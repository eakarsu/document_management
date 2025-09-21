import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get auth token
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    const userId = decoded.userId;

    // Get request body
    const body = await request.json();
    const { comments, userRole, isDraft } = body;
    const documentId = params.id;

    // Get the document
    const document = await prisma.document.findUnique({
      where: { id: documentId }
    });

    if (!document) {
      // For POST, we still need to return an error since we can't save feedback without a document
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Save feedback to document's customFields
    const existingFeedback = document.customFields as any || {};
    
    // Handle draft vs final feedback differently
    let updatedFeedback;
    
    if (isDraft) {
      // For drafts, replace existing draft or create new one
      const drafts = existingFeedback.draftFeedback || {};
      drafts[userId] = {
        comments,
        userRole,
        userId,
        lastUpdated: new Date().toISOString(),
        isDraft: true
      };
      existingFeedback.draftFeedback = drafts;
      updatedFeedback = comments;
    } else {
      // For final submission, add to permanent feedback
      const crmFeedback = existingFeedback.crmFeedback || [];
      
      // Add new comments with metadata
      const newFeedback = comments.map((comment: any) => ({
        ...comment,
        id: comment.id || `crm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        userRole,
        createdAt: new Date().toISOString(),
        status: 'pending'
      }));

      // Merge with existing feedback
      updatedFeedback = [...crmFeedback, ...newFeedback];
      existingFeedback.crmFeedback = updatedFeedback;
      
      // Clear the draft for this user
      if (existingFeedback.draftFeedback) {
        delete existingFeedback.draftFeedback[userId];
      }
    }

    // Check for critical comments
    const hasCritical = comments.some((c: any) => c.commentType === 'C');
    
    // Update document with new feedback
    const updatedDocument = await prisma.document.update({
      where: { id: documentId },
      data: {
        customFields: {
          ...existingFeedback,
          hasCriticalComments: (!isDraft && hasCritical) || existingFeedback.hasCriticalComments,
          lastFeedbackAt: new Date().toISOString(),
          totalComments: existingFeedback.crmFeedback?.length || 0
        }
      }
    });

    // TODO: Create audit log entry only for final submissions
    // Note: Audit log creation disabled due to schema incompatibility
    // if (!isDraft) {
    //   await prisma.auditLog.create({
    //     data: {
    //       action: 'CRM_FEEDBACK_ADDED',
    //       userId,
    //       metadata: {
    //         entityType: 'Document',
    //         commentCount: comments.length,
    //         hasCritical,
    //         commentTypes: comments.map((c: any) => c.commentType)
    //       }
    //     }
    //   });
    // }

    // If there are critical comments in final submission, update document status
    if (!isDraft && hasCritical) {
      await prisma.document.update({
        where: { id: documentId },
        data: {
          customFields: {
            ...updatedDocument.customFields as any,
            requiresAttention: true,
            criticalIssuesFound: true
          }
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'CRM feedback submitted successfully',
      feedbackCount: updatedFeedback.length,
      hasCritical
    });

  } catch (error) {
    console.error('Error saving CRM feedback:', error);
    return NextResponse.json(
      { error: 'Failed to save feedback' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const documentId = params.id;

    // Get auth token to identify user
    const authHeader = request.headers.get('authorization');
    let userId = null;

    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
        userId = decoded.userId;
      } catch (e) {
        console.log('Could not decode token for user identification');
      }
    }

    // Get the document
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      select: {
        customFields: true
      }
    });

    if (!document) {
      // Return empty feedback instead of 404 to avoid errors
      return NextResponse.json({
        feedback: [],
        totalComments: 0,
        hasCritical: false
      });
    }

    const customFields = document.customFields as any || {};

    // Check if requesting draft feedback
    const url = new URL(request.url);
    const isDraft = url.searchParams.get('isDraft') === 'true';

    if (isDraft && userId && customFields.draftFeedback && customFields.draftFeedback[userId]) {
      // Return user's draft feedback
      const draft = customFields.draftFeedback[userId];
      return NextResponse.json({
        feedback: [{
          feedbackData: draft,
          isDraft: true
        }],
        totalComments: draft.comments?.length || 0,
        hasCritical: draft.comments?.some((c: any) => c.commentType === 'C') || false
      });
    }

    // Return final feedback
    const crmFeedback = customFields.crmFeedback || [];

    return NextResponse.json({
      feedback: crmFeedback.map((f: any) => ({
        feedbackData: { comments: [f] },
        isDraft: false
      })),
      totalComments: crmFeedback.length,
      hasCritical: crmFeedback.some((c: any) => c.commentType === 'C')
    });

  } catch (error) {
    console.error('Error fetching CRM feedback:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feedback' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get auth token
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    const userId = decoded.userId;

    const documentId = params.id;

    // Get the document
    const document = await prisma.document.findUnique({
      where: { id: documentId }
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Clear all feedback from the document
    const updatedDocument = await prisma.document.update({
      where: { id: documentId },
      data: {
        customFields: {
          ...(document.customFields as any || {}),
          crmFeedback: [],
          draftFeedback: {},
          feedback: [],
          comments: [],
          hasCriticalComments: false,
          requiresAttention: false,
          criticalIssuesFound: false,
          lastClearedAt: new Date().toISOString(),
          totalComments: 0
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'All feedback cleared successfully',
      clearedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error clearing feedback:', error);
    return NextResponse.json(
      { error: 'Failed to clear feedback' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get auth token
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    const userId = decoded.userId;

    const documentId = params.id;
    const body = await request.json();
    const { feedbackIdsToDelete } = body;

    if (!feedbackIdsToDelete || !Array.isArray(feedbackIdsToDelete)) {
      return NextResponse.json({ error: 'Invalid request: feedbackIdsToDelete must be an array' }, { status: 400 });
    }

    // Get the document
    const document = await prisma.document.findUnique({
      where: { id: documentId }
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const customFields = document.customFields as any || {};
    const currentFeedback = customFields.crmFeedback || [];

    // Filter out the feedback items that should be deleted
    const remainingFeedback = currentFeedback.filter((item: any) =>
      !feedbackIdsToDelete.includes(item.id)
    );

    // Check if any remaining feedback is critical
    const hasCritical = remainingFeedback.some((c: any) => c.commentType === 'C');

    // Update the document with remaining feedback
    const updatedDocument = await prisma.document.update({
      where: { id: documentId },
      data: {
        customFields: {
          ...customFields,
          crmFeedback: remainingFeedback,
          hasCriticalComments: hasCritical,
          requiresAttention: hasCritical,
          criticalIssuesFound: hasCritical,
          lastModifiedAt: new Date().toISOString(),
          totalComments: remainingFeedback.length
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: `Deleted ${feedbackIdsToDelete.length} feedback items`,
      remainingCount: remainingFeedback.length,
      deletedCount: feedbackIdsToDelete.length
    });

  } catch (error) {
    console.error('Error deleting selected feedback:', error);
    return NextResponse.json(
      { error: 'Failed to delete selected feedback' },
      { status: 500 }
    );
  }
}