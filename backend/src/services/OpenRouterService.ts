import axios, { AxiosInstance } from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface FeedbackItem {
  id: string;
  lineNumber: string;
  paragraphNumber: string;
  pageNumber: string;
  content: string;
  severity: 'CRITICAL' | 'MAJOR' | 'SUBSTANTIVE' | 'ADMINISTRATIVE';
  reviewerId: string;
  reviewerName: string;
  originalSentence?: string;
  documentContext?: string;
}

interface ProcessedFeedback {
  originalSentence: string;
  improvedSentence: string;
  feedbackIds: string[];
  modelUsed: string;
  confidence: number;
  reasoning?: string;
}

interface ConsolidatedFeedback {
  location: {
    lineNumber: string;
    paragraphNumber: string;
    pageNumber: string;
  };
  originalSentence: string;
  feedbackItems: FeedbackItem[];
  consolidatedContent: string;
  severity: string;
}

export class OpenRouterService {
  private client: AxiosInstance;
  private apiKey: string;
  private defaultModel: string;
  private modelPriority: Map<string, string[]>;

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
    this.defaultModel = 'anthropic/claude-3.5-sonnet';
    
    this.client = axios.create({
      baseURL: 'https://openrouter.ai/api/v1',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'HTTP-Referer': process.env.APP_URL || 'http://localhost:4000',
        'X-Title': 'Document Management System',
        'Content-Type': 'application/json'
      }
    });

    // Model priority based on feedback severity and task complexity
    // Using Claude 3.5 Sonnet as primary model for all severities (cost-effective)
    this.modelPriority = new Map([
      ['CRITICAL', ['anthropic/claude-3.5-sonnet', 'openai/gpt-4-turbo', 'openai/gpt-4']],
      ['MAJOR', ['anthropic/claude-3.5-sonnet', 'openai/gpt-4', 'google/gemini-pro']],
      ['SUBSTANTIVE', ['anthropic/claude-3.5-sonnet', 'openai/gpt-3.5-turbo', 'google/gemini-pro']],
      ['ADMINISTRATIVE', ['anthropic/claude-3.5-sonnet', 'openai/gpt-3.5-turbo', 'mistralai/mistral-medium']]
    ]);
  }

  /**
   * Select appropriate model based on severity
   */
  selectModel(severity: 'CRITICAL' | 'MAJOR' | 'SUBSTANTIVE' | 'ADMINISTRATIVE'): string[] {
    return this.modelPriority.get(severity) || [this.defaultModel];
  }

  /**
   * Process and improve a sentence based on approved feedback
   */
  async processFeedback(
    originalSentence: string,
    feedbackItems: FeedbackItem[],
    documentContext?: string
  ): Promise<ProcessedFeedback> {
    const severity = this.getHighestSeverity(feedbackItems);
    const models = this.modelPriority.get(severity) || [this.defaultModel];
    
    let lastError: Error | null = null;
    
    // Try models in priority order
    for (const model of models) {
      try {
        const improvedSentence = await this.callOpenRouter(
          originalSentence,
          feedbackItems,
          documentContext,
          model
        );
        
        return {
          originalSentence,
          improvedSentence,
          feedbackIds: feedbackItems.map(f => f.id),
          modelUsed: model,
          confidence: this.calculateConfidence(originalSentence, improvedSentence, feedbackItems),
          reasoning: this.generateReasoning(feedbackItems)
        };
      } catch (error: any) {
        console.error(`Failed with model ${model}:`, error);
        lastError = error as Error;
        // Continue to next model
      }
    }
    
    throw lastError || new Error('All models failed to process feedback');
  }

  /**
   * Consolidate multiple feedback items for the same location
   */
  async consolidateFeedback(
    documentId: string,
    lineNumber: string,
    paragraphNumber: string,
    pageNumber: string
  ): Promise<ConsolidatedFeedback> {
    // Retrieve all feedback for this location from database
    // Get feedback through document approvals
    const approval = await prisma.documentApproval.findFirst({
      where: { 
        documentPublishing: {
          documentId
        }
      }
    });
    
    if (!approval) {
      throw new Error('No approval found for this document');
    }
    
    const feedbackItems = await prisma.reviewer_feedback.findMany({
      where: {
        approvalId: approval.id,
        sectionFeedback: {
          path: ['lineNumber'],
          equals: lineNumber
        }
      },
      include: {
        users: true
      }
    });

    if (feedbackItems.length === 0) {
      throw new Error('No feedback found for this location');
    }

    // Convert to FeedbackItem format
    const formattedFeedback: FeedbackItem[] = feedbackItems.map(item => ({
      id: item.id,
      lineNumber: (item.sectionFeedback as any)?.lineNumber || lineNumber,
      paragraphNumber: (item.sectionFeedback as any)?.paragraphNumber || paragraphNumber,
      pageNumber: (item.sectionFeedback as any)?.pageNumber || pageNumber,
      content: item.detailedComments || item.summary || '',
      severity: (item.sectionFeedback as any)?.severity || 'SUBSTANTIVE',
      reviewerId: item.reviewerId,
      reviewerName: `${item.users.firstName} ${item.users.lastName}`,
      originalSentence: (item.sectionFeedback as any)?.originalSentence
    }));

    // Apply consolidation algorithm
    const consolidatedContent = await this.applyConsolidationAlgorithm(formattedFeedback);
    const originalSentence = formattedFeedback[0]?.originalSentence || '';

    return {
      location: {
        lineNumber,
        paragraphNumber,
        pageNumber
      },
      originalSentence,
      feedbackItems: formattedFeedback,
      consolidatedContent,
      severity: this.getHighestSeverity(formattedFeedback)
    };
  }

  /**
   * Process OPR decision on feedback
   */
  async processOPRDecision(
    feedbackId: string,
    decision: 'APPROVE' | 'REJECT',
    oprId: string,
    justification?: string
  ): Promise<ProcessedFeedback | null> {
    const feedback = await prisma.reviewer_feedback.findUnique({
      where: { id: feedbackId },
      include: { 
        document_approvals: {
          include: {
            documentPublishing: {
              include: {
                documents: true
              }
            }
          }
        },
        users: true
      }
    });

    if (!feedback) {
      throw new Error('Feedback not found');
    }

    const metadata = feedback.sectionFeedback as any;
    
    // Update feedback status
    await prisma.reviewer_feedback.update({
      where: { id: feedbackId },
      data: {
        sectionFeedback: {
          ...metadata,
          status: decision === 'APPROVE' ? 'RESOLVED' : 'REJECTED',
          oprDecision: decision,
          oprId,
          oprJustification: justification,
          processedAt: new Date().toISOString()
        }
      }
    });

    // If rejected or not critical, return null
    if (decision === 'REJECT' && metadata.severity !== 'CRITICAL') {
      return null;
    }

    // For critical feedback, must be resolved
    if (metadata.severity === 'CRITICAL' && decision === 'REJECT') {
      throw new Error('Critical feedback cannot be rejected without resolution');
    }

    // If approved, process with AI
    if (decision === 'APPROVE') {
      const feedbackItem: FeedbackItem = {
        id: feedback.id,
        lineNumber: metadata?.lineNumber || '0',
        paragraphNumber: metadata?.paragraphNumber || '0',
        pageNumber: metadata?.pageNumber || '0',
        content: feedback.detailedComments || feedback.summary || '',
        severity: metadata?.severity || 'SUBSTANTIVE',
        reviewerId: feedback.reviewerId,
        reviewerName: metadata?.reviewerName || `${feedback.users.firstName} ${feedback.users.lastName}`,
        originalSentence: metadata?.originalSentence || ''
      };

      const document = feedback.document_approvals.documentPublishing.documents;
      const documentContext = (document.customFields as any)?.content || '';
      
      return await this.processFeedback(
        metadata?.originalSentence || '',
        [feedbackItem],
        documentContext
      );
    }

    return null;
  }

  /**
   * Call OpenRouter API with appropriate prompt
   */
  private async callOpenRouter(
    originalSentence: string,
    feedbackItems: FeedbackItem[],
    documentContext: string | undefined,
    model: string
  ): Promise<string> {
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(originalSentence, feedbackItems, documentContext);

    const messages: OpenRouterMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    try {
      const response = await this.client.post('/chat/completions', {
        model,
        messages,
        temperature: 0.3, // Lower temperature for more consistent output
        max_tokens: 500,
        stream: false
      });

      const improvedSentence = response.data.choices[0]?.message?.content?.trim();
      
      if (!improvedSentence) {
        throw new Error('Empty response from AI model');
      }

      // Validate the response
      if (this.isValidImprovement(originalSentence, improvedSentence, feedbackItems)) {
        return improvedSentence;
      } else {
        throw new Error('Generated improvement did not adequately address feedback');
      }
    } catch (error: any) {
      console.error('OpenRouter API error:', error);
      throw error;
    }
  }

  /**
   * Build system prompt for the AI model
   */
  private buildSystemPrompt(): string {
    return `You are an expert document editor specializing in military and government documentation.
Your task is to improve sentences based on reviewer feedback while maintaining:
1. Document clarity and professional tone
2. Technical accuracy
3. Regulatory compliance
4. Original meaning and intent

Rules:
- Address ALL feedback points provided
- Maintain formal military/government writing style
- Preserve technical terms and acronyms
- Keep improvements concise and clear
- For CRITICAL feedback, ensure complete resolution
- Return ONLY the improved sentence without explanation`;
  }

  /**
   * Build user prompt with feedback details
   */
  private buildUserPrompt(
    originalSentence: string,
    feedbackItems: FeedbackItem[],
    documentContext?: string
  ): string {
    let prompt = `Original Sentence: "${originalSentence}"\n\n`;
    
    if (documentContext) {
      // Include surrounding context for better understanding
      prompt += `Document Context: ${documentContext.substring(0, 500)}...\n\n`;
    }
    
    prompt += 'Reviewer Feedback:\n';
    feedbackItems.forEach((item, index) => {
      prompt += `${index + 1}. [${item.severity}] ${item.reviewerName}: ${item.content}\n`;
    });
    
    prompt += '\nGenerate an improved sentence that addresses all feedback while maintaining document flow and clarity.';
    
    return prompt;
  }

  /**
   * Apply consolidation algorithm for multiple feedback items
   */
  private async applyConsolidationAlgorithm(feedbackItems: FeedbackItem[]): Promise<string> {
    if (feedbackItems.length === 1) {
      return feedbackItems[0].content;
    }

    // Group by similarity
    const grouped = this.groupSimilarFeedback(feedbackItems);
    
    // Build consolidated feedback
    let consolidated = 'Consolidated feedback from multiple reviewers:\n';
    
    grouped.forEach((group, index) => {
      if (group.length === 1) {
        consolidated += `${index + 1}. ${group[0].content} (${group[0].reviewerName})\n`;
      } else {
        const reviewers = group.map(f => f.reviewerName).join(', ');
        const commonContent = this.findCommonContent(group);
        consolidated += `${index + 1}. ${commonContent} (${reviewers})\n`;
      }
    });
    
    return consolidated;
  }

  /**
   * Group similar feedback items
   */
  private groupSimilarFeedback(feedbackItems: FeedbackItem[]): FeedbackItem[][] {
    const groups: FeedbackItem[][] = [];
    const processed = new Set<string>();
    
    feedbackItems.forEach(item => {
      if (processed.has(item.id)) return;
      
      const similarItems = feedbackItems.filter(other => {
        if (processed.has(other.id)) return false;
        return this.calculateSimilarity(item.content, other.content) > 0.7;
      });
      
      similarItems.forEach(similar => processed.add(similar.id));
      groups.push(similarItems);
    });
    
    return groups;
  }

  /**
   * Find common content in similar feedback
   */
  private findCommonContent(feedbackItems: FeedbackItem[]): string {
    // Simple implementation - could be enhanced with NLP
    if (feedbackItems.length === 0) return '';
    
    // Return the most detailed feedback
    return feedbackItems.reduce((longest, current) => 
      current.content.length > longest.content.length ? current : longest
    ).content;
  }

  /**
   * Calculate similarity between two feedback strings
   */
  private calculateSimilarity(str1: string, str2: string): number {
    // Simple word-based similarity - could use more sophisticated NLP
    const words1 = new Set(str1.toLowerCase().split(/\s+/));
    const words2 = new Set(str2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  /**
   * Get highest severity from feedback items
   */
  private getHighestSeverity(feedbackItems: FeedbackItem[]): string {
    const severityOrder = ['CRITICAL', 'MAJOR', 'SUBSTANTIVE', 'ADMINISTRATIVE'];
    
    for (const severity of severityOrder) {
      if (feedbackItems.some(f => f.severity === severity)) {
        return severity;
      }
    }
    
    return 'SUBSTANTIVE';
  }

  /**
   * Calculate confidence score for the improvement
   */
  private calculateConfidence(
    original: string,
    improved: string,
    feedbackItems: FeedbackItem[]
  ): number {
    let score = 0.5; // Base score
    
    // Check if improvement addresses feedback keywords
    feedbackItems.forEach(item => {
      const keywords = item.content.toLowerCase().split(/\s+/);
      const addressedKeywords = keywords.filter(word => 
        improved.toLowerCase().includes(word)
      );
      score += (addressedKeywords.length / keywords.length) * 0.2;
    });
    
    // Check if improvement maintains original meaning
    const originalWords = new Set(original.toLowerCase().split(/\s+/));
    const improvedWords = new Set(improved.toLowerCase().split(/\s+/));
    const preserved = [...originalWords].filter(w => improvedWords.has(w));
    score += (preserved.length / originalWords.size) * 0.3;
    
    return Math.min(score, 1.0);
  }

  /**
   * Generate reasoning for the improvement
   */
  private generateReasoning(feedbackItems: FeedbackItem[]): string {
    const severities = feedbackItems.map(f => f.severity);
    const hasCritical = severities.includes('CRITICAL');
    
    let reasoning = 'Improvement addresses ';
    
    if (hasCritical) {
      reasoning += 'critical issues including ';
    }
    
    const issues = feedbackItems.map(f => {
      const keywords = f.content.split(/\s+/).slice(0, 5).join(' ');
      return `${f.severity.toLowerCase()} feedback: "${keywords}..."`;
    });
    
    reasoning += issues.join('; ');
    
    return reasoning;
  }

  /**
   * Validate if improvement adequately addresses feedback
   */
  private isValidImprovement(
    original: string,
    improved: string,
    feedbackItems: FeedbackItem[]
  ): boolean {
    // Check if improvement is different from original
    if (original === improved) return false;
    
    // Check if improvement is not empty
    if (!improved || improved.trim().length < 10) return false;
    
    // For critical feedback, ensure substantial changes
    const hasCritical = feedbackItems.some(f => f.severity === 'CRITICAL');
    if (hasCritical) {
      const changeRatio = this.calculateChangeRatio(original, improved);
      if (changeRatio < 0.3) return false; // At least 30% change for critical
    }
    
    return true;
  }

  /**
   * Calculate the ratio of changes between two strings
   */
  private calculateChangeRatio(str1: string, str2: string): number {
    const words1 = str1.toLowerCase().split(/\s+/);
    const words2 = str2.toLowerCase().split(/\s+/);
    
    let changes = 0;
    const maxLength = Math.max(words1.length, words2.length);
    
    for (let i = 0; i < maxLength; i++) {
      if (words1[i] !== words2[i]) {
        changes++;
      }
    }
    
    return changes / maxLength;
  }

  /**
   * Process batch feedback for multiple locations
   */
  async processBatchFeedback(
    documentId: string,
    approvedFeedbackIds: string[]
  ): Promise<ProcessedFeedback[]> {
    // Get feedback through document approvals
    const approval = await prisma.documentApproval.findFirst({
      where: { 
        documentPublishing: {
          documentId
        }
      },
      include: {
        documentPublishing: {
          include: {
            documents: true
          }
        }
      }
    });
    
    if (!approval) {
      return [];
    }
    
    const feedbackItems = await prisma.reviewer_feedback.findMany({
      where: {
        id: { in: approvedFeedbackIds },
        approvalId: approval.id
      },
      include: {
        users: true
      }
    });

    // Group by location
    const groupedByLocation = new Map<string, FeedbackItem[]>();
    
    feedbackItems.forEach(item => {
      const metadata = item.sectionFeedback as any;
      const locationKey = `${metadata?.lineNumber || '0'}-${metadata?.paragraphNumber || '0'}-${metadata?.pageNumber || '0'}`;
      
      if (!groupedByLocation.has(locationKey)) {
        groupedByLocation.set(locationKey, []);
      }
      
      groupedByLocation.get(locationKey)!.push({
        id: item.id,
        lineNumber: metadata?.lineNumber || '0',
        paragraphNumber: metadata?.paragraphNumber || '0',
        pageNumber: metadata?.pageNumber || '0',
        content: item.detailedComments || item.summary || '',
        severity: metadata?.severity || 'SUBSTANTIVE',
        reviewerId: item.reviewerId,
        reviewerName: `${item.users.firstName} ${item.users.lastName}`,
        originalSentence: metadata?.originalSentence || ''
      });
    });

    // Process each location
    const results: ProcessedFeedback[] = [];
    
    for (const [location, feedback] of groupedByLocation) {
      const document = approval?.documentPublishing?.documents;
      const documentContext = (document?.customFields as any)?.content || '';
      const originalSentence = feedback[0]?.originalSentence || '';
      
      try {
        const processed = await this.processFeedback(
          originalSentence,
          feedback,
          documentContext
        );
        results.push(processed);
      } catch (error: any) {
        console.error(`Failed to process feedback for location ${location}:`, error);
      }
    }
    
    return results;
  }
}

export default OpenRouterService;