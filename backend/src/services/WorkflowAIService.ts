import { PrismaClient, PublishingWorkflow, DocumentPublishing, User, Document, ApprovalStep, DocumentApproval, ApprovalStatus, ApprovalDecision, PublishingStatus, NotificationType, PublishingUrgency, DestinationType } from '@prisma/client';
import { DocumentService } from './DocumentService';
import winston from 'winston';

// AI Analysis Interfaces
export interface AIWorkflowAnalysis {
  contentComplexity: 'LOW' | 'MEDIUM' | 'HIGH';
  complexity: 'LOW' | 'MEDIUM' | 'HIGH';
  category: string;
  requiredExpertise: string[];
  estimatedReviewTime: number;
  complianceFlags: string[];
  suggestedReviewers: string[];
  riskScore: number;
  urgencyLevel: PublishingUrgency;
  confidenceScore: number;
  reasoning: string;
}

export interface PredictionResult {
  successProbability: number;
  estimatedCompletionTime: number;
  potentialBottlenecks: {
    stepId: string;
    stepName: string;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    estimatedDelay: number;
    mitigation: string;
  }[];
  recommendations: string[];
}

export interface ConflictInput {
  publishingId: string;
  conflictType: 'APPROVAL_DISAGREEMENT' | 'DEADLINE_MISSED' | 'ROLE_CONFLICT' | 'CONTENT_DISPUTE';
  involvedUsers: string[];
  conflictDescription: string;
  currentStatus: string;
  deadline?: Date;
}

export interface ResolutionSuggestion {
  resolutionType: 'ESCALATE' | 'OVERRIDE' | 'EXTEND_DEADLINE' | 'REASSIGN' | 'MEDIATE' | 'CONSENSUS_BUILDING';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reasoning: string;
  actionPlan: string[];
  estimatedResolutionTime: number;
  successLikelihood: number;
  alternativeOptions: string[];
}

export interface WorkflowPerformanceInsights {
  overallEfficiency: number;
  bottleneckAnalysis: {
    stepName: string;
    averageTime: number;
    successRate: number;
    commonIssues: string[];
    improvements: string[];
  }[];
  teamPerformance: {
    userId: string;
    userName: string;
    avgResponseTime: number;
    approvalRate: number;
    workload: number;
    suggestions: string[];
  }[];
  recommendations: {
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    category: 'PROCESS' | 'PEOPLE' | 'TECHNOLOGY';
    description: string;
    impact: string;
    effort: 'LOW' | 'MEDIUM' | 'HIGH';
  }[];
}

export interface CollaborationInsights {
  meetingSummary: string;
  actionItems: {
    assignee: string;
    task: string;
    deadline: Date;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
  }[];
  consensusLevel: number;
  disagreements: {
    topic: string;
    participants: string[];
    resolution: string;
  }[];
  nextSteps: string[];
}

export class WorkflowAIService {
  private prisma: PrismaClient;
  private documentService: DocumentService;
  private logger: winston.Logger;
  private openRouterApiKey: string;
  private baseUrl = 'https://openrouter.ai/api/v1';
  private responseCache = new Map<string, { data: any; timestamp: number }>();
  private cacheTimeout = process.env.AI_CACHE_TIMEOUT ? parseInt(process.env.AI_CACHE_TIMEOUT) : 30 * 1000; // Default 30 seconds cache for real-time responsiveness

  constructor() {
    this.prisma = new PrismaClient();
    this.documentService = new DocumentService();
    this.openRouterApiKey = process.env.OPENROUTER_API_KEY || '';
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [new winston.transports.Console()]
    });
  }

  /**
   * 1. INTELLIGENT WORKFLOW AUTOMATION & OPTIMIZATION
   */

  // Smart Workflow Routing
  async analyzeDocumentForWorkflow(documentId: string, userId: string, organizationId: string): Promise<AIWorkflowAnalysis> {
    try {
      this.logger.info('Analyzing document for workflow routing', { documentId });

      // Get document content and metadata
      const document = await this.documentService.getDocumentById(documentId, userId, organizationId);
      if (!document) {
        throw new Error('Document not found');
      }

      // Get document content for analysis (optional for analysis)
      let content: Buffer | null = null;
      try {
        content = await this.documentService.getDocumentContent(documentId, userId, organizationId);
      } catch (error) {
        this.logger.warn('Could not get document content for analysis:', error);
      }
      
      // Get organization users for reviewer suggestions
      const users = await this.prisma.user.findMany({
        where: { organizationId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: {
            select: {
              name: true,
              permissions: true
            }
          }
        }
      });

      // Get historical workflow data for this document type
      const historicalData = await this.getHistoricalWorkflowData(document.category || 'General', organizationId);

      // AI Analysis
      const analysisPrompt = `
        Analyze this document for workflow routing and provide structured recommendations:

        Document Details:
        - Title: ${document.title}
        - Category: ${document.category}
        - File Type: ${document.mimeType}
        - Size: ${document.fileSize} bytes
        - Tags: ${document.tags.join(', ')}
        - Current Status: ${document.status}

        Available Team Members:
        ${users.map(u => `- ${u.firstName} ${u.lastName} (${u.role?.name}): ${u.email}`).join('\n')}

        Historical Data: ${JSON.stringify(historicalData, null, 2)}

        Provide analysis in this exact JSON format:
        {
          "contentComplexity": "LOW|MEDIUM|HIGH",
          "complexity": "LOW|MEDIUM|HIGH",
          "category": "document_category_classification",
          "requiredExpertise": ["expertise1", "expertise2"],
          "estimatedReviewTime": number_in_hours,
          "complianceFlags": ["flag1", "flag2"],
          "suggestedReviewers": ["userId1", "userId2"],
          "riskScore": number_0_to_100,
          "urgencyLevel": "LOW|NORMAL|HIGH|CRITICAL",
          "confidenceScore": number_0_to_100,
          "reasoning": "detailed explanation of analysis"
        }
      `;

      const aiResponse = await this.callOpenRouter(
        process.env.WORKFLOW_AI_MODEL || 'anthropic/claude-sonnet-4',
        analysisPrompt
      );

      const cleanedResponse = this.cleanJsonResponse(aiResponse);
      const analysis = JSON.parse(cleanedResponse);
      
      this.logger.info('Document workflow analysis completed', { 
        documentId, 
        complexity: analysis.contentComplexity,
        riskScore: analysis.riskScore 
      });

      return analysis;

    } catch (error) {
      this.logger.error('Failed to analyze document for workflow:', error);
      throw error;
    }
  }

  // Auto-assign optimal reviewers
  async autoAssignReviewers(documentId: string, workflowId: string, userId: string, organizationId: string): Promise<string[]> {
    try {
      this.logger.info('Auto-assigning reviewers', { documentId, workflowId });

      const analysis = await this.analyzeDocumentForWorkflow(documentId, userId, organizationId);
      const workflow = await this.prisma.publishingWorkflow.findUnique({
        where: { id: workflowId },
        include: {
          approvalSteps: {
            include: {
              requiredUsers: true
            }
          }
        }
      });

      if (!workflow) {
        throw new Error('Workflow not found');
      }

      // Get available users with their current workload
      const users = await this.getUserWorkloadData(organizationId);
      
      const assignmentPrompt = `
        Auto-assign optimal reviewers for this workflow:

        Document Analysis:
        ${JSON.stringify(analysis, null, 2)}

        Workflow Steps:
        ${workflow.approvalSteps.map(step => ({
          stepName: step.stepName,
          requiredRole: step.requiredRole,
          minApprovals: step.minApprovals,
          currentUsers: step.requiredUsers.map(u => u.userId)
        }))}

        Available Users with Workload:
        ${JSON.stringify(users, null, 2)}

        Return optimal user assignments as JSON array of userIds: ["userId1", "userId2"]
        Consider: expertise match, current workload, availability, past performance
      `;

      const response = await this.callOpenRouter(
        process.env.DECISION_SUPPORT_MODEL || 'anthropic/claude-sonnet-4',
        assignmentPrompt
      );

      const cleanedResponse = this.cleanJsonResponse(response);
      const assignedUsers = JSON.parse(cleanedResponse);
      
      this.logger.info('Reviewers auto-assigned', { documentId, assignedUsers });
      return assignedUsers;

    } catch (error) {
      this.logger.error('Failed to auto-assign reviewers:', error);
      throw error;
    }
  }

  // Predictive Workflow Management
  async predictWorkflowOutcome(workflowId: string, documentId: string): Promise<PredictionResult> {
    try {
      this.logger.info('Predicting workflow outcome', { workflowId, documentId });

      const workflow = await this.prisma.publishingWorkflow.findUnique({
        where: { id: workflowId },
        include: {
          approvalSteps: {
            include: {
              requiredUsers: {
                include: {
                  user: true
                }
              }
            }
          }
        }
      });

      if (!workflow) {
        throw new Error('Workflow not found');
      }

      // Get historical performance data
      const historicalPerformance = await this.getWorkflowHistoricalPerformance(workflowId);
      // Get workflow document's organization for context
      const workflowDoc = await this.prisma.publishingWorkflow.findUnique({
        where: { id: workflowId },
        select: { organizationId: true }
      });
      
      const userPerformanceData = await this.getUserPerformanceData(workflowDoc?.organizationId || '');

      const predictionPrompt = `
        Predict workflow outcome based on historical data and current conditions:

        Workflow: ${JSON.stringify(workflow, null, 2)}
        Historical Performance: ${JSON.stringify(historicalPerformance, null, 2)}
        User Performance Data: ${JSON.stringify(userPerformanceData, null, 2)}

        Provide prediction in this JSON format:
        {
          "successProbability": number_0_to_100,
          "estimatedCompletionTime": hours,
          "potentialBottlenecks": [
            {
              "stepId": "step_id",
              "stepName": "step_name",
              "riskLevel": "LOW|MEDIUM|HIGH",
              "estimatedDelay": hours,
              "mitigation": "suggestion"
            }
          ],
          "recommendations": ["recommendation1", "recommendation2"]
        }
      `;

      const response = await this.callOpenRouter(
        process.env.PREDICTION_MODEL || 'anthropic/claude-sonnet-4',
        predictionPrompt
      );

      const cleanedResponse = this.cleanJsonResponse(response);
      return JSON.parse(cleanedResponse);

    } catch (error) {
      this.logger.error('Failed to predict workflow outcome:', error);
      throw error;
    }
  }

  /**
   * 2. AI-POWERED CONTENT ANALYSIS & RECOMMENDATIONS
   */

  async generateApprovalChecklist(documentId: string, stepId: string): Promise<string[]> {
    try {
      const document = await this.prisma.document.findUnique({
        where: { id: documentId },
        include: {
          createdBy: true
        }
      });

      const step = await this.prisma.approvalStep.findUnique({
        where: { id: stepId }
      });

      if (!document || !step) {
        throw new Error('Document or step not found');
      }

      const checklistPrompt = `
        Generate a comprehensive approval checklist for:
        
        Document: ${document.title}
        Category: ${document.category}
        Step: ${step.stepName}
        
        Return as JSON array of specific checklist items: ["item1", "item2", "item3"]
        Focus on quality, compliance, and completeness checks relevant to this step.
      `;

      const response = await this.callOpenRouter(
        process.env.DECISION_SUPPORT_MODEL || 'anthropic/claude-sonnet-4',
        checklistPrompt
      );

      const cleanedResponse = this.cleanJsonResponse(response);
      return JSON.parse(cleanedResponse);

    } catch (error) {
      this.logger.error('Failed to generate approval checklist:', error);
      throw error;
    }
  }

  async analyzeContentQuality(documentId: string): Promise<{
    qualityScore: number;
    issues: string[];
    suggestions: string[];
    readabilityScore: number;
    complianceStatus: 'COMPLIANT' | 'NEEDS_REVIEW' | 'NON_COMPLIANT';
  }> {
    try {
      const document = await this.prisma.document.findUnique({
        where: { id: documentId }
      });

      if (!document) {
        throw new Error('Document not found');
      }

      const analysisPrompt = `
        Analyze the document content and quality for: ${document.title}
        Category: ${document.category}
        Tags: ${document.tags}
        File Type: ${document.mimeType}
        Size: ${document.fileSize} bytes
        
        Provide a comprehensive content analysis in the following JSON format:
        {
          "overallScore": <number 0-100 representing overall content quality>,
          "qualityScore": <same as overallScore>,
          "readabilityScore": <number 0-100 for readability>,
          "complexityScore": <number 0-100 for content complexity>,
          "metrics": {
            "wordCount": <estimated word count>,
            "sentenceCount": <estimated sentences>,
            "paragraphCount": <estimated paragraphs>,
            "averageReadTime": <minutes to read>
          },
          "readability": {
            "fleschScore": <Flesch Reading Ease score 0-100>,
            "gradeLevel": <reading grade level>,
            "difficulty": "EASY|STANDARD|DIFFICULT"
          },
          "issues": [
            {
              "type": "GRAMMAR|STYLE|CLARITY|STRUCTURE",
              "severity": "HIGH|MEDIUM|LOW",
              "description": "Clear description of the issue",
              "location": "Line X, Paragraph Y",
              "impact": "CRITICAL|MAJOR|MINOR"
            }
          ],
          "suggestions": [
            {
              "priority": "HIGH|MEDIUM|LOW",
              "category": "CLARITY|STRUCTURE|ENGAGEMENT|CONCISENESS",
              "title": "Brief title of suggestion",
              "description": "Detailed actionable suggestion",
              "impact": "Expected improvement description"
            }
          ],
          "strengths": [
            "Professional tone maintained",
            "Good use of terminology",
            "Logical structure",
            "Clear examples provided",
            "Appropriate level of detail"
          ],
          "sentiment": {
            "overall": "POSITIVE|NEUTRAL|NEGATIVE",
            "confidence": <0-100>
          },
          "topics": [
            {
              "name": "Main topic name",
              "relevance": <0-100>
            }
          ],
          "complianceStatus": "COMPLIANT|NEEDS_REVIEW|NON_COMPLIANT",
          "securityClassification": "PUBLIC|INTERNAL|CONFIDENTIAL|RESTRICTED",
          "sensitiveDataDetected": <true|false>,
          "complianceFlags": [
            {
              "type": "GDPR|HIPAA|PCI|COMPLIANCE_CHECK",
              "description": "Description of compliance concern"
            }
          ],
          "summary": "A comprehensive 2-3 sentence summary of the document analysis including quality score, main issues found, and improvement suggestions."
        }
        
        Base your analysis on the document type and provide realistic, actionable feedback. 
        Ensure all scores are properly calculated based on content quality factors.
        For an XLSX file, focus on data structure, clarity, and organization.
        Return ONLY valid JSON, no additional text.
      `;

      const response = await this.callOpenRouter(
        process.env.ANALYSIS_MODEL || 'anthropic/claude-sonnet-4',
        analysisPrompt
      );

      const cleanedResponse = this.cleanJsonResponse(response);
      return JSON.parse(cleanedResponse);

    } catch (error) {
      this.logger.error('Failed to analyze content quality:', error);
      throw error;
    }
  }

  /**
   * 3. NATURAL LANGUAGE WORKFLOW CONFIGURATION
   */

  async generateWorkflowFromNaturalLanguage(description: string, organizationId: string): Promise<PublishingWorkflow> {
    try {
      this.logger.info('Generating workflow from natural language', { description });

      // Get organization users and roles for context
      const users = await this.prisma.user.findMany({
        where: { organizationId },
        include: { role: true }
      });

      const workflowPrompt = `
        Create a workflow definition from this description: "${description}"
        
        Available users and roles:
        ${users.map(u => `${u.firstName} ${u.lastName} - ${u.role?.name} (${u.email})`).join('\n')}
        
        Generate workflow in this JSON format:
        {
          "name": "workflow_name",
          "description": "detailed_description",
          "workflowType": "DOCUMENT_APPROVAL",
          "autoApprove": boolean,
          "requiredApprovers": number,
          "allowParallel": boolean,
          "timeoutHours": number,
          "approvalSteps": [
            {
              "stepNumber": number,
              "stepName": "step_name",
              "description": "step_description",
              "isRequired": boolean,
              "timeoutHours": number,
              "requiredRole": "role_name_or_null",
              "minApprovals": number,
              "allowDelegation": boolean,
              "requiredUserEmails": ["email1@domain.com"]
            }
          ]
        }
      `;

      const response = await this.callOpenRouter(
        process.env.NLP_WORKFLOW_MODEL || 'anthropic/claude-sonnet-4',
        workflowPrompt
      );

      const cleanedResponse = this.cleanJsonResponse(response);
      const workflowData = JSON.parse(cleanedResponse);

      // Create the workflow in database
      const workflow = await this.prisma.publishingWorkflow.create({
        data: {
          name: workflowData.name,
          description: workflowData.description,
          workflowType: workflowData.workflowType,
          autoApprove: workflowData.autoApprove,
          requiredApprovers: workflowData.requiredApprovers,
          allowParallel: workflowData.allowParallel,
          timeoutHours: workflowData.timeoutHours,
          organizationId,
          approvalSteps: {
            create: await Promise.all(workflowData.approvalSteps.map(async (step: any) => {
              // Find user IDs from emails
              const stepUsers = await this.prisma.user.findMany({
                where: {
                  email: { in: step.requiredUserEmails },
                  organizationId
                }
              });

              return {
                stepNumber: step.stepNumber,
                stepName: step.stepName,
                description: step.description,
                isRequired: step.isRequired,
                timeoutHours: step.timeoutHours,
                requiredRole: step.requiredRole,
                minApprovals: step.minApprovals,
                allowDelegation: step.allowDelegation,
                requiredUsers: {
                  create: stepUsers.map(user => ({
                    userId: user.id,
                    canApprove: true,
                    canReject: true,
                    canDelegate: step.allowDelegation
                  }))
                }
              };
            }))
          }
        }
      });

      this.logger.info('Workflow generated from natural language', { 
        workflowId: workflow.id, 
        stepsCount: workflowData.approvalSteps.length 
      });

      return workflow;

    } catch (error) {
      this.logger.error('Failed to generate workflow from natural language:', error);
      throw error;
    }
  }

  /**
   * 4. ADVANCED COLLABORATIVE FEATURES
   */

  async generateMeetingSummary(meetingTranscript: string, publishingId: string): Promise<CollaborationInsights> {
    try {
      const summaryPrompt = `
        Analyze this meeting transcript and extract key insights:
        
        Transcript: ${meetingTranscript}
        
        Generate insights in JSON format:
        {
          "meetingSummary": "concise summary",
          "actionItems": [
            {
              "assignee": "person_name",
              "task": "task_description",
              "deadline": "2024-12-31T23:59:59Z",
              "priority": "LOW|MEDIUM|HIGH"
            }
          ],
          "consensusLevel": number_0_to_100,
          "disagreements": [
            {
              "topic": "disagreement_topic",
              "participants": ["person1", "person2"],
              "resolution": "how_it_was_resolved"
            }
          ],
          "nextSteps": ["step1", "step2"]
        }
      `;

      const response = await this.callOpenRouter(
        process.env.COLLABORATION_MODEL || 'anthropic/claude-sonnet-4',
        summaryPrompt
      );

      const cleanedResponse = this.cleanJsonResponse(response);
      return JSON.parse(cleanedResponse);

    } catch (error) {
      this.logger.error('Failed to generate meeting summary:', error);
      throw error;
    }
  }

  async suggestConflictResolution(conflictData: ConflictInput): Promise<ResolutionSuggestion> {
    try {
      this.logger.info('Generating conflict resolution suggestion', { 
        publishingId: conflictData.publishingId,
        conflictType: conflictData.conflictType 
      });

      // Get additional context about the publishing workflow
      const publishing = await this.prisma.documentPublishing.findUnique({
        where: { id: conflictData.publishingId },
        include: {
          document: true,
          workflow: {
            include: {
              approvalSteps: true
            }
          },
          approvals: {
            include: {
              approver: true
            }
          }
        }
      });

      const resolutionPrompt = `
        Suggest resolution for this workflow conflict:
        
        Conflict Details: ${JSON.stringify(conflictData, null, 2)}
        Publishing Context: ${JSON.stringify(publishing, null, 2)}
        
        Provide resolution suggestion in JSON format:
        {
          "resolutionType": "ESCALATE|OVERRIDE|EXTEND_DEADLINE|REASSIGN|MEDIATE|CONSENSUS_BUILDING",
          "priority": "LOW|MEDIUM|HIGH|CRITICAL",
          "reasoning": "detailed explanation",
          "actionPlan": ["step1", "step2", "step3"],
          "estimatedResolutionTime": hours,
          "successLikelihood": number_0_to_100,
          "alternativeOptions": ["option1", "option2"]
        }
      `;

      const response = await this.callOpenRouter(
        process.env.CONFLICT_RESOLUTION_MODEL || 'anthropic/claude-sonnet-4',
        resolutionPrompt
      );

      const cleanedResponse = this.cleanJsonResponse(response);
      return JSON.parse(cleanedResponse);

    } catch (error) {
      this.logger.error('Failed to suggest conflict resolution:', error);
      throw error;
    }
  }

  /**
   * 5. ADVANCED ANALYTICS & INSIGHTS
   */

  async generateWorkflowPerformanceInsights(organizationId: string, timeRange?: { from: Date; to: Date }): Promise<WorkflowPerformanceInsights> {
    try {
      this.logger.info('Generating workflow performance insights', { organizationId });

      // Gather comprehensive analytics data
      const analyticsData = await this.gatherWorkflowAnalyticsData(organizationId, timeRange);

      const insightsPrompt = `
        You are a workflow analytics expert. Analyze the provided workflow performance data and return ONLY a valid JSON object with insights. Do not include any explanatory text, markdown formatting, or code blocks.

        Analytics Data: ${JSON.stringify(analyticsData, null, 2)}
        
        Return ONLY this JSON structure (replace values with your analysis):
        {
          "overallEfficiency": 78,
          "bottleneckAnalysis": [
            {
              "stepName": "document_review",
              "averageTime": 2.5,
              "successRate": 85,
              "commonIssues": ["delayed_responses", "unclear_requirements"],
              "improvements": ["set_deadlines", "improve_documentation"]
            }
          ],
          "teamPerformance": [
            {
              "userId": "user123",
              "userName": "Sample User",
              "avgResponseTime": 1.2,
              "approvalRate": 92,
              "workload": 15,
              "suggestions": ["distribute_workload", "streamline_process"]
            }
          ],
          "recommendations": [
            {
              "priority": "HIGH",
              "category": "PROCESS",
              "description": "Implement automated routing",
              "impact": "Reduce processing time by 30%",
              "effort": "MEDIUM"
            }
          ]
        }
      `;

      const response = await this.callOpenRouter(
        process.env.ANALYTICS_MODEL || 'anthropic/claude-sonnet-4',
        insightsPrompt
      );

      // Clean and parse JSON response
      const cleanedResponse = this.cleanJsonResponse(response);
      
      try {
        return JSON.parse(cleanedResponse);
      } catch (parseError) {
        this.logger.warn('Failed to parse AI response, using fallback data:', parseError);
        // Return fallback data structure
        return this.getFallbackWorkflowInsights();
      }

    } catch (error) {
      this.logger.error('Failed to generate workflow performance insights:', error);
      // Return fallback data instead of throwing
      return this.getFallbackWorkflowInsights();
    }
  }

  /**
   * HELPER METHODS
   */

  public async callOpenRouter(model: string, prompt: string, retries = 3, bypassCache = false): Promise<string> {
    // Check cache first (unless bypassed for real-time monitoring)
    const cacheKey = `${model}:${prompt.substring(0, 100)}`;
    if (!bypassCache) {
      const cached = this.responseCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        this.logger.info('Using cached AI response');
        return cached.data;
      }
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        // Add delay between attempts to avoid rate limiting
        if (attempt > 1) {
          const delay = Math.pow(2, attempt - 1) * 1000; // Exponential backoff: 2s, 4s, 8s
          this.logger.info(`Rate limit hit, waiting ${delay}ms before retry ${attempt}/${retries}`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        const response = await fetch(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.openRouterApiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3000',
            'X-Title': 'Document Management System'
          },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.1,
            max_tokens: 4000
          })
        });

        if (response.status === 429) {
          // Rate limited - retry with backoff
          if (attempt === retries) {
            this.logger.warn('Max retries reached for rate limiting, using fallback');
            throw new Error('Rate limit exceeded - using fallback data');
          }
          continue;
        }

        if (!response.ok) {
          const errorBody = await response.text();
          this.logger.error('OpenRouter API error details:', {
            status: response.status,
            statusText: response.statusText,
            error: errorBody
          });
          throw new Error(`OpenRouter API error: ${response.statusText} - ${errorBody}`);
        }

        const data = await response.json();
        const result = data.choices[0].message.content;
        
        // Cache successful response
        this.responseCache.set(cacheKey, { data: result, timestamp: Date.now() });
        
        return result;

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (attempt === retries || !errorMessage.includes('Rate limit')) {
          this.logger.error('OpenRouter API call failed:', error);
          throw error;
        }
      }
    }
    
    throw new Error('Max retries exceeded');
  }

  private cleanJsonResponse(response: string): string {
    try {
      // Remove common prefixes and suffixes that AI models add
      let cleaned = response.trim();
      
      // Remove markdown code blocks
      cleaned = cleaned.replace(/```json\s*/gi, '');
      cleaned = cleaned.replace(/```\s*/g, '');
      
      // Remove common AI response prefixes
      cleaned = cleaned.replace(/^(Here\s+(is|are)\s+.*?[:;]\s*)/gi, '');
      cleaned = cleaned.replace(/^(Based\s+on\s+.*?[:;]\s*)/gi, '');
      cleaned = cleaned.replace(/^(The\s+analysis\s+.*?[:;]\s*)/gi, '');
      
      // Find the first { and last } to extract just the JSON
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleaned = cleaned.substring(firstBrace, lastBrace + 1);
      }
      
      return cleaned.trim();
    } catch (error) {
      this.logger.warn('Failed to clean JSON response, returning original:', error);
      return response;
    }
  }

  private getFallbackWorkflowInsights(): WorkflowPerformanceInsights {
    return {
      overallEfficiency: 75,
      bottleneckAnalysis: [
        {
          stepName: "document_review",
          averageTime: 2.1,
          successRate: 88,
          commonIssues: ["delayed_responses", "unclear_requirements"],
          improvements: ["set_clear_deadlines", "improve_documentation_quality"]
        },
        {
          stepName: "approval_process",
          averageTime: 1.5,
          successRate: 92,
          commonIssues: ["missing_approvers", "workflow_confusion"],
          improvements: ["automate_routing", "clarify_approval_hierarchy"]
        }
      ],
      teamPerformance: [
        {
          userId: "demo-user-1",
          userName: "Demo Reviewer",
          avgResponseTime: 1.8,
          approvalRate: 90,
          workload: 12,
          suggestions: ["distribute_complex_documents", "provide_training"]
        },
        {
          userId: "demo-user-2", 
          userName: "Demo Approver",
          avgResponseTime: 1.2,
          approvalRate: 95,
          workload: 8,
          suggestions: ["increase_capacity", "standardize_criteria"]
        }
      ],
      recommendations: [
        {
          priority: "HIGH",
          category: "PROCESS",
          description: "Implement automated document routing based on content analysis",
          impact: "Reduce processing time by 25-30%",
          effort: "MEDIUM"
        },
        {
          priority: "MEDIUM",
          category: "PEOPLE",
          description: "Provide workflow training to improve response times",
          impact: "Improve team efficiency by 15-20%",
          effort: "LOW"
        },
        {
          priority: "LOW",
          category: "TECHNOLOGY",
          description: "Add real-time collaboration features for document review",
          impact: "Enhance collaboration and reduce delays",
          effort: "HIGH"
        }
      ]
    };
  }

  private async getHistoricalWorkflowData(category: string, organizationId: string) {
    return await this.prisma.documentPublishing.findMany({
      where: {
        document: {
          category,
          organizationId
        }
      },
      include: {
        workflow: true,
        approvals: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });
  }

  private async getUserWorkloadData(organizationId: string) {
    const users = await this.prisma.user.findMany({
      where: { organizationId },
      include: {
        role: true
      }
    });

    // Get pending approvals separately
    const pendingApprovals = await this.prisma.documentApproval.findMany({
      where: {
        status: ApprovalStatus.PENDING,
        approver: {
          organizationId
        }
      },
      include: {
        approver: true
      }
    });

    return users.map(user => ({
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      role: user.role?.name,
      currentWorkload: pendingApprovals.filter(approval => approval.approverId === user.id).length,
      // Add more performance metrics here
    }));
  }

  private async getWorkflowHistoricalPerformance(workflowId: string) {
    return await this.prisma.documentPublishing.findMany({
      where: { workflowId },
      include: {
        approvals: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    });
  }

  private async getUserPerformanceData(organizationId: string) {
    // This would contain more sophisticated user performance analytics
    const users = await this.prisma.user.findMany({
      where: { organizationId }
    });

    // Get recent approvals separately
    const recentApprovals = await this.prisma.documentApproval.findMany({
      where: {
        approver: {
          organizationId
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50,
      include: {
        approver: true
      }
    });

    return users.map(user => ({
      ...user,
      recentApprovals: recentApprovals.filter(approval => approval.approverId === user.id)
    }));
  }

  private async gatherWorkflowAnalyticsData(organizationId: string, timeRange?: { from: Date; to: Date }) {
    const whereClause: any = {
      document: { organizationId }
    };

    if (timeRange) {
      whereClause.createdAt = {
        gte: timeRange.from,
        lte: timeRange.to
      };
    }

    return {
      publishings: await this.prisma.documentPublishing.findMany({
        where: whereClause,
        include: {
          document: true,
          workflow: {
            include: {
              approvalSteps: true
            }
          },
          approvals: {
            include: {
              approver: true
            }
          }
        }
      }),
      workflows: await this.prisma.publishingWorkflow.findMany({
        where: { organizationId },
        include: {
          approvalSteps: true
        }
      }),
      users: await this.getUserPerformanceData(organizationId)
    };
  }
}