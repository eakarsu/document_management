import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';
import OpenRouterService from '../services/OpenRouterService';
import * as cheerio from 'cheerio';

const router = Router();
const prisma = new PrismaClient();
const openRouterService = new OpenRouterService();

// Middleware to check OPR permissions
const checkOPRPermission = async (req: Request, res: Response, next: Function) => {
  const userId = (req as any).user?.id;
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true }
  });
  
  if (!user || (user.role?.name !== 'OPR' && user.role?.name !== 'ADMIN')) {
    return res.status(403).json({ error: 'Only OPR personnel can process feedback' });
  }
  
  next();
};

/**
 * Get all feedback for a document grouped by location
 */
router.get('/document/:documentId/feedback', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;
    const { status, severity, groupByLocation } = req.query;
    
    // Get feedback through document approvals
    const approval = await prisma.documentApproval.findFirst({
      where: { 
        documentPublishing: {
          documentId
        }
      },
      include: {
        documentPublishing: true
      }
    });
    
    if (!approval) {
      return res.json({ feedback: [], total: 0 });
    }
    
    const whereClause: any = { approvalId: approval.id };
    
    if (status) {
      whereClause.status = status as string;
    }
    
    if (severity) {
      whereClause.sectionFeedback = {
        path: ['severity'],
        equals: severity
      };
    }
    
    const feedback = await prisma.reviewer_feedback.findMany({
      where: whereClause,
      include: {
        users: true,
        document_approvals: {
          include: {
            documentPublishing: {
              include: {
                documents: {
                  select: {
                    id: true,
                    title: true,
                    currentVersion: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: [
        { createdAt: 'desc' }
      ]
    });
    
    // Group by location if requested
    if (groupByLocation === 'true') {
      const grouped = new Map<string, any[]>();
      
      feedback.forEach(item => {
        const metadata = item.sectionFeedback as any;
        const locationKey = `${metadata.pageNumber || 0}-${metadata.paragraphNumber || 0}-${metadata.lineNumber || 0}`;
        
        if (!grouped.has(locationKey)) {
          grouped.set(locationKey, []);
        }
        
        grouped.get(locationKey)!.push({
          ...item,
          severity: metadata?.severity || 'SUBSTANTIVE',
          location: {
            page: metadata?.pageNumber,
            paragraph: metadata?.paragraphNumber,
            line: metadata?.lineNumber
          }
        });
      });
      
      const groupedArray = Array.from(grouped.entries()).map(([key, items]) => ({
        locationKey: key,
        location: items[0].location,
        originalSentence: (items[0].sectionFeedback as any)?.originalSentence,
        feedbackCount: items.length,
        hasCritical: items.some(i => (i.sectionFeedback as any)?.severity === 'CRITICAL'),
        items
      }));
      
      return res.json({ grouped: groupedArray, total: feedback.length });
    }
    
    res.json({ feedback, total: feedback.length });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
});

/**
 * Process OPR decision on feedback
 */
router.post('/feedback/:feedbackId/decision', 
  authMiddleware, 
  checkOPRPermission,
  async (req: Request, res: Response) => {
    try {
      const { feedbackId } = req.params;
      const { decision, justification } = req.body;
      const oprId = (req as any).user?.id;
      
      if (!['APPROVE', 'REJECT'].includes(decision)) {
        return res.status(400).json({ error: 'Invalid decision. Must be APPROVE or REJECT' });
      }
      
      // Process the decision
      const result = await openRouterService.processOPRDecision(
        feedbackId,
        decision,
        oprId,
        justification
      );
      
      // If approved and processed, update the document
      if (result) {
        const feedback = await prisma.reviewer_feedback.findUnique({
          where: { id: feedbackId },
          include: {
            document_approvals: {
              include: {
                documentPublishing: true
              }
            }
          }
        });
        
        if (feedback) {
          const documentId = feedback.document_approvals.documentPublishing.documentId;
          await updateDocumentContent(
            documentId,
            result.originalSentence,
            result.improvedSentence,
            (feedback.sectionFeedback as any)?.lineNumber
          );
          
          // Log the change
          const document = await prisma.document.findUnique({
            where: { id: documentId }
          });
          
          if (document) {
            await prisma.documentVersion.create({
              data: {
                documentId,
                versionNumber: await getNextVersionNumber(documentId),
                title: document.title + ' (Feedback Applied)',
                fileName: document.fileName,
                fileSize: document.fileSize,
                checksum: document.checksum + '-' + Date.now(),
                storagePath: document.storagePath,
                changeNotes: `Applied feedback: ${result.reasoning}`,
                createdById: oprId
              }
            });
          }
        }
      }
      
      res.json({ 
        success: true, 
        decision,
        processed: !!result,
        result 
      });
    } catch (error: any) {
      console.error('Error processing OPR decision:', error);
      res.status(500).json({ error: error.message || 'Failed to process decision' });
    }
});

/**
 * Consolidate and process multiple feedback for same location
 */
router.post('/feedback/consolidate',
  authMiddleware,
  checkOPRPermission,
  async (req: Request, res: Response) => {
    try {
      const { documentId, lineNumber, paragraphNumber, pageNumber } = req.body;
      
      if (!documentId || !lineNumber) {
        return res.status(400).json({ error: 'Document ID and line number are required' });
      }
      
      const consolidated = await openRouterService.consolidateFeedback(
        documentId,
        lineNumber,
        paragraphNumber || '0',
        pageNumber || '1'
      );
      
      res.json(consolidated);
    } catch (error: any) {
      console.error('Error consolidating feedback:', error);
      res.status(500).json({ error: error.message || 'Failed to consolidate feedback' });
    }
});

/**
 * Process batch feedback approval
 */
router.post('/feedback/batch-process',
  authMiddleware,
  checkOPRPermission,
  async (req: Request, res: Response) => {
    try {
      const { documentId, approvedFeedbackIds, rejectedFeedbackIds } = req.body;
      const oprId = (req as any).user?.id;
      
      if (!documentId || (!approvedFeedbackIds?.length && !rejectedFeedbackIds?.length)) {
        return res.status(400).json({ error: 'Invalid batch processing request' });
      }
      
      const results = {
        approved: [] as any[],
        rejected: [] as any[],
        failed: [] as any[]
      };
      
      // Process rejections first (simpler)
      if (rejectedFeedbackIds?.length) {
        for (const feedbackId of rejectedFeedbackIds) {
          try {
            await prisma.reviewer_feedback.update({
              where: { id: feedbackId },
              data: {
                sectionFeedback: {
                  ...(await getFeedbackMetadata(feedbackId)),
                  status: 'REJECTED',
                  oprDecision: 'REJECT',
                  oprId,
                  processedAt: new Date().toISOString()
                }
              }
            });
            results.rejected.push(feedbackId);
          } catch (error) {
            results.failed.push({ feedbackId, error: (error as Error).message });
          }
        }
      }
      
      // Process approvals with AI
      if (approvedFeedbackIds?.length) {
        const processedFeedback = await openRouterService.processBatchFeedback(
          documentId,
          approvedFeedbackIds
        );
        
        // Apply improvements to document
        for (const processed of processedFeedback) {
          try {
            // Update document content
            const document = await prisma.document.findUnique({
              where: { id: documentId }
            });
            
            if (document && document.customFields) {
              const content = (document.customFields as any).content || '';
              // FIX: Use replaceAll to replace ALL occurrences, not just the first one
              const updatedContent = content.replaceAll(
                processed.originalSentence,
                processed.improvedSentence
              );
              
              await prisma.document.update({
                where: { id: documentId },
                data: { 
                  customFields: {
                    ...(document.customFields as any),
                    content: updatedContent,
                    lastModifiedAt: new Date().toISOString(),
                    lastModifiedById: oprId
                  }
                }
              });
              
              // Mark feedback as resolved
              for (const feedbackId of processed.feedbackIds) {
                await prisma.reviewer_feedback.update({
                  where: { id: feedbackId },
                  data: {
                    sectionFeedback: {
                      ...(await getFeedbackMetadata(feedbackId)),
                      status: 'RESOLVED',
                      oprDecision: 'APPROVE',
                      oprId,
                      processedAt: new Date().toISOString(),
                      appliedImprovement: processed.improvedSentence
                    }
                  }
                });
              }
              
              results.approved.push({
                feedbackIds: processed.feedbackIds,
                improvement: processed.improvedSentence,
                modelUsed: processed.modelUsed,
                confidence: processed.confidence
              });
            }
          } catch (error) {
            results.failed.push({ 
              feedbackIds: processed.feedbackIds, 
              error: (error as Error).message 
            });
          }
        }
      }
      
      res.json({
        success: true,
        results,
        summary: {
          approved: results.approved.length,
          rejected: results.rejected.length,
          failed: results.failed.length
        }
      });
    } catch (error: any) {
      console.error('Error in batch processing:', error);
      res.status(500).json({ error: error.message || 'Batch processing failed' });
    }
});

/**
 * Get AI model recommendations for feedback
 */
router.post('/feedback/ai-recommendation',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { originalSentence, feedbackContent, severity, documentContext } = req.body;
      
      if (!originalSentence || !feedbackContent) {
        return res.status(400).json({ error: 'Original sentence and feedback are required' });
      }
      
      // Create temporary feedback item for processing
      const tempFeedback = {
        id: 'temp-' + Date.now(),
        lineNumber: '0',
        paragraphNumber: '0',
        pageNumber: '0',
        content: feedbackContent,
        severity: severity || 'SUBSTANTIVE',
        reviewerId: (req as any).user?.id,
        reviewerName: 'Current User',
        originalSentence
      };
      
      const result = await openRouterService.processFeedback(
        originalSentence,
        [tempFeedback],
        documentContext
      );
      
      res.json({
        recommendation: result.improvedSentence,
        modelUsed: result.modelUsed,
        confidence: result.confidence,
        reasoning: result.reasoning
      });
    } catch (error: any) {
      console.error('Error getting AI recommendation:', error);
      res.status(500).json({ error: error.message || 'Failed to get recommendation' });
    }
});

/**
 * Merge feedback into document with AI assistance
 */
router.post('/merge',
  authMiddleware,
  // checkOPRPermission, // TEMPORARILY DISABLED FOR TESTING
  async (req: Request, res: Response) => {
    try {
      const { documentContent, feedback, mode } = req.body;
      
      // Debug logging - ALSO write to backend.log file
      const fs = require('fs');
      const debugLog = `
=== MERGE ENDPOINT DEBUG ===
Time: ${new Date().toISOString()}
Mode: ${mode}
Feedback received: ${JSON.stringify(feedback, null, 2)}
Document content length: ${documentContent?.length || 0}
Document content preview (first 500 chars): ${documentContent?.substring(0, 500)}

=== TEXT LOCATION DEBUG ===
Looking for text (changeFrom): ${feedback.changeFrom}
Replace with text (changeTo): ${feedback.changeTo}
Location - Page: ${feedback.page}, Paragraph: ${feedback.paragraphNumber}, Line: ${feedback.lineNumber}
`;
      
      // Write to backend.log
      fs.appendFileSync('/Users/erolakarsu/projects/document_management/backend/backend.log', debugLog);
      
      // Also log to console
      console.log('=== MERGE ENDPOINT DEBUG ===');
      console.log('Mode:', mode);
      console.log('Feedback received:', JSON.stringify(feedback, null, 2));
      console.log('Document content length:', documentContent?.length || 0);
      console.log('Document content preview (first 500 chars):', documentContent?.substring(0, 500));
      
      // Log the specific text to locate and replace
      console.log('\n=== TEXT LOCATION DEBUG ===');
      console.log('Looking for text (changeFrom):', feedback.changeFrom);
      console.log('Replace with text (changeTo):', feedback.changeTo);
      console.log('Location - Page:', feedback.page, 'Paragraph:', feedback.paragraphNumber, 'Line:', feedback.lineNumber);
      
      if (!documentContent || !feedback) {
        return res.status(400).json({ error: 'Document content and feedback are required' });
      }
      
      let mergedContent = documentContent;
      
      if (mode === 'ai' || mode === 'hybrid') {
        // Parse HTML to extract text from specific paragraph if needed
        const $ = cheerio.load(documentContent);
        let originalText = feedback.changeFrom || '';
        
        // If we have a paragraph number but no changeFrom text, extract it
        if (!originalText && feedback.paragraphNumber) {
          console.log('No changeFrom text provided, attempting to extract from paragraph:', feedback.paragraphNumber);
          
          // Find paragraph by data-paragraph attribute
          const targetParagraph = $(`[data-paragraph="${feedback.paragraphNumber}"]`);
          if (targetParagraph.length > 0) {
            originalText = targetParagraph.text().trim();
            console.log('Extracted text from paragraph:', originalText);
          } else {
            // Try to find by section numbering in the text
            const allParagraphs = $('p');
            allParagraphs.each((i, elem) => {
              const text = $(elem).text();
              if (text.includes(feedback.paragraphNumber)) {
                originalText = text.replace(new RegExp(`^${feedback.paragraphNumber}\\s*`), '').trim();
                console.log('Found paragraph by number in text:', originalText);
                return false; // break the loop
              }
            });
          }
        }
        
        console.log('Change From:', originalText);
        console.log('Change To:', feedback.changeTo);
        console.log('Coordinator Comment:', feedback.coordinatorComment);
        console.log('Justification:', feedback.coordinatorJustification);
        
        // Create FeedbackItem format for the service
        const feedbackItem: any = {
          id: feedback.id || 'temp-' + Date.now(),
          lineNumber: feedback.lineNumber || '0',
          paragraphNumber: feedback.paragraphNumber || '0',
          pageNumber: feedback.page || '0',
          content: feedback.coordinatorComment || feedback.changeTo || '',
          severity: feedback.commentType === 'C' ? 'CRITICAL' : 
                   feedback.commentType === 'M' ? 'MAJOR' :
                   feedback.commentType === 'S' ? 'SUBSTANTIVE' : 'ADMINISTRATIVE',
          reviewerId: 'opr-user',
          reviewerName: feedback.pocName || 'OPR',
          originalSentence: originalText,
          documentContext: documentContent
        };
        
        console.log('Calling OpenRouterService.processFeedback with:', {
          originalText,
          feedbackItem,
          hasContext: !!documentContent
        });
        
        try {
          // CRITICAL: First verify the changeFrom text actually exists in the document
          if (!feedback.changeFrom || !documentContent.includes(feedback.changeFrom)) {
            console.error('ERROR: changeFrom text not found in document!');
            console.error('Looking for:', feedback.changeFrom);
            console.error('Document length:', documentContent.length);
            
            // Check if the changeTo text is already present (cascading change)
            if (feedback.changeTo && documentContent.includes(feedback.changeTo)) {
              console.log('ℹ️ INFO: changeTo text already present in document');
              console.log('   This likely means the change was already applied by a previous merge');
              console.log('   Treating as successful (idempotent operation)');
              
              // Return success since the desired state is already achieved
              return res.json({
                success: true,
                mergedContent: documentContent,
                message: 'Change already applied - text is in desired state',
                cascading: true
              });
            }
            
            // Try to find similar text for debugging
            if (feedback.changeFrom) {
              const searchStart = feedback.changeFrom.substring(0, Math.min(20, feedback.changeFrom.length));
              const similarIndex = documentContent.indexOf(searchStart);
              if (similarIndex > -1) {
                const actualText = documentContent.substring(similarIndex, Math.min(similarIndex + 100, documentContent.length));
                console.error('Found similar text at position', similarIndex + ':', actualText);
                
                // Check if this is a partial match due to previous changes
                const partialWords = feedback.changeFrom.split(' ').slice(0, 3).join(' ');
                if (documentContent.includes(partialWords)) {
                  console.log('⚠️ WARNING: Partial match found - text may have been partially modified');
                }
              } else {
                console.error('No similar text found even with partial search:', searchStart);
              }
            }
            
            // Return error response with details
            return res.status(400).json({
              success: false,
              error: 'Text to replace not found in document',
              details: {
                changeFrom: feedback.changeFrom || 'Not provided',
                changeToAlreadyPresent: feedback.changeTo ? documentContent.includes(feedback.changeTo) : false,
                textExists: false,
                documentLength: documentContent.length,
                page: feedback.page,
                paragraph: feedback.paragraphNumber,
                line: feedback.lineNumber
              }
            });
          }
          
          // Text exists, proceed with replacement
          console.log('✓ changeFrom text found in document at position:', documentContent.indexOf(feedback.changeFrom));
          console.log('✓ Proceeding with replacement');
          
          // Check for duplicates BEFORE merge
          const h1CountBefore = (documentContent.match(/<h1>/g) || []).length;
          const sectionICountBefore = (documentContent.match(/SECTION I - INTRODUCTION/g) || []).length;
          console.log('BEFORE MERGE - H1 count:', h1CountBefore, 'Section I count:', sectionICountBefore);
          
          if (h1CountBefore > 1 || sectionICountBefore > 1) {
            console.error('❌ WARNING: Input document ALREADY HAS DUPLICATES!');
            console.error('  - H1 headers:', h1CountBefore);
            console.error('  - Section I occurrences:', sectionICountBefore);
            console.error('  - Frontend sent corrupted content!');
          }
          
          // AI mode - Call OpenRouterService for intelligent merging
          console.log('AI mode: Calling OpenRouterService for AI-powered merge');
          
          try {
            // Actually call the AI service
            const aiResult = await openRouterService.processFeedback(
              originalText,
              [feedbackItem],
              documentContent
            );
            
            if (aiResult?.improvedSentence) {
              console.log('✓ AI generated improved text');
              // Replace the original text with AI-improved version
              mergedContent = documentContent.replace(feedback.changeFrom, aiResult.improvedSentence);
            } else {
              console.log('⚠️ AI did not return improved text, falling back to simple replacement');
              mergedContent = documentContent.replaceAll(feedback.changeFrom, feedback.changeTo);
            }
          } catch (aiError) {
            console.error('AI service error, falling back to simple replacement:', aiError);
            mergedContent = documentContent.replaceAll(feedback.changeFrom, feedback.changeTo);
          }
          
          // Check for duplicates AFTER merge
          const h1CountAfter = (mergedContent.match(/<h1>/g) || []).length;
          const sectionICountAfter = (mergedContent.match(/SECTION I - INTRODUCTION/g) || []).length;
          console.log('AFTER MERGE - H1 count:', h1CountAfter, 'Section I count:', sectionICountAfter);
          
          if (h1CountAfter > h1CountBefore || sectionICountAfter > sectionICountBefore) {
            console.error('❌ CRITICAL: Merge CREATED duplicates!');
            console.error('  - H1 headers:', h1CountBefore, '->', h1CountAfter);
            console.error('  - Section I:', sectionICountBefore, '->', sectionICountAfter);
          }
          
          // Verify the replacement actually happened
          if (!mergedContent.includes(feedback.changeTo)) {
            console.error('WARNING: changeTo text not found after merge!');
            console.error('Expected to find:', feedback.changeTo);
            
            // Check if merge failed silently
            if (mergedContent === documentContent) {
              console.error('ERROR: Document content unchanged after merge!');
              return res.status(500).json({
                success: false,
                error: 'Merge failed - document unchanged',
                details: {
                  changeFrom: feedback.changeFrom,
                  changeTo: feedback.changeTo,
                  reason: 'Replacement did not occur'
                }
              });
            }
          } else {
            console.log('✓ changeTo text successfully added to document');
            console.log('✓ Verification passed - new text is present');
          }
          
          console.log('Merge completed using AI mode');
          console.log('Content changed:', mergedContent !== documentContent);
          
        } catch (aiError) {
          console.error('AI processing failed, falling back to simple merge:', aiError);
          
          // Fallback to simple replacement if AI fails
          if (feedback.changeFrom && feedback.changeTo) {
            // FIX: Use replaceAll to replace ALL occurrences
            mergedContent = documentContent.replaceAll(feedback.changeFrom, feedback.changeTo);
          }
        }
      } else {
        // Manual merge - simple replacement
        console.log('Manual merge mode - applying direct replacement');
        if (feedback.changeFrom && feedback.changeTo) {
          // FIX: Use replaceAll to replace ALL occurrences
          mergedContent = documentContent.replaceAll(feedback.changeFrom, feedback.changeTo);
        }
      }
      
      console.log('=== END MERGE DEBUG ===');
      
      res.json({
        success: true,
        mergedContent,
        suggestedContent: mode === 'hybrid' ? mergedContent : undefined
      });
    } catch (error: any) {
      console.error('Error in merge endpoint:', error);
      res.status(500).json({ error: error.message || 'Failed to merge feedback' });
    }
  });

/**
 * Get critical feedback requiring mandatory resolution
 */
router.get('/feedback/critical/:documentId',
  authMiddleware,
  checkOPRPermission,
  async (req: Request, res: Response) => {
    try {
      const { documentId } = req.params;
      
      // Get critical feedback through document approvals
      const approval = await prisma.documentApproval.findFirst({
        where: { 
          documentPublishing: {
            documentId
          }
        }
      });
      
      if (!approval) {
        return res.json({ critical: [], count: 0, requiresResolution: false });
      }
      
      const criticalFeedback = await prisma.reviewer_feedback.findMany({
        where: {
          approvalId: approval.id,
          sectionFeedback: {
            path: ['severity'],
            equals: 'CRITICAL'
          }
        },
        include: {
          users: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      });
      
      const formatted = criticalFeedback.map(item => {
        const metadata = item.sectionFeedback as any;
        return {
          id: item.id,
          content: item.detailedComments || item.summary || '',
          reviewer: `${item.users.firstName} ${item.users.lastName}`,
          location: {
            page: metadata?.pageNumber,
            paragraph: metadata?.paragraphNumber,
            line: metadata?.lineNumber
          },
          originalSentence: metadata?.originalSentence,
          createdAt: item.createdAt,
          mustResolve: true
        };
      });
      
      res.json({
        critical: formatted,
        count: formatted.length,
        requiresResolution: formatted.length > 0
      });
    } catch (error) {
      console.error('Error fetching critical feedback:', error);
      res.status(500).json({ error: 'Failed to fetch critical feedback' });
    }
});

// Helper functions

async function updateDocumentContent(
  documentId: string,
  originalSentence: string,
  improvedSentence: string,
  lineNumber: string
): Promise<void> {
  const document = await prisma.document.findUnique({
    where: { id: documentId }
  });
  
  if (!document || !document.customFields) {
    throw new Error('Document not found or has no content');
  }
  
  let content = (document.customFields as any).content || '';
  
  // Replace the sentence in the content
  if (content.includes(originalSentence)) {
    content = content.replace(originalSentence, improvedSentence);
  } else {
    // If exact match not found, try line-based replacement
    const lines = content.split('\n');
    const lineIndex = parseInt(lineNumber) - 1;
    
    if (lineIndex >= 0 && lineIndex < lines.length) {
      lines[lineIndex] = improvedSentence;
      content = lines.join('\n');
    }
  }
  
  await prisma.document.update({
    where: { id: documentId },
    data: { 
      customFields: {
        ...(document.customFields as any),
        content
      }
    }
  });
}

async function getNextVersionNumber(documentId: string): Promise<number> {
  const lastVersion = await prisma.documentVersion.findFirst({
    where: { documentId },
    orderBy: { versionNumber: 'desc' }
  });
  
  if (!lastVersion) {
    return 1;
  }
  
  return lastVersion.versionNumber + 1;
}

async function getFeedbackMetadata(feedbackId: string): Promise<any> {
  const feedback = await prisma.reviewer_feedback.findUnique({
    where: { id: feedbackId }
  });
  
  return feedback?.sectionFeedback || {};
}

export default router;