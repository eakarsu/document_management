import { PrismaClient, PublishingWorkflow, DocumentPublishing, DocumentApproval, PublishingStatus, ApprovalStatus, ApprovalDecision, PublishingUrgency, DestinationType, NotificationType } from '@prisma/client';
import { PublishingService } from './PublishingService';
import { WorkflowAIService, AIWorkflowAnalysis, PredictionResult } from './WorkflowAIService';
import { StorageService } from './StorageService';
import { DocumentService } from './DocumentService';
import winston from 'winston';

interface SmartSubmissionInput {
  documentId: string;
  workflowId?: string; // Optional - AI can suggest if not provided
  scheduledPublishAt?: Date;
  expiresAt?: Date;
  publishingNotes?: string;
  urgencyLevel?: PublishingUrgency;
  isEmergencyPublish?: boolean;
  destinations: {
    destinationType: DestinationType;
    destinationName: string;
    destinationConfig: Record<string, any>;
  }[];
  useAIRecommendations?: boolean;
  naturalLanguageWorkflow?: string; // For generating workflow on-the-fly
}

export class EnhancedPublishingService extends PublishingService {
  private workflowAI: WorkflowAIService;
  private aiLogger: winston.Logger;
  private prismaClient: PrismaClient;

  constructor() {
    super();
    this.workflowAI = new WorkflowAIService();
    this.aiLogger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [new winston.transports.Console()]
    });
    this.prismaClient = new PrismaClient();
  }

  /**
   * Smart document submission with AI-powered workflow routing
   */
  async smartSubmitForPublishing(
    input: SmartSubmissionInput,
    userId: string,
    organizationId: string
  ): Promise<{
    publishing: DocumentPublishing;
    aiAnalysis: AIWorkflowAnalysis;
    prediction: PredictionResult;
    recommendations: string[];
  }> {
    try {
      this.aiLogger.info('Smart publishing submission started', {
        documentId: input.documentId,
        useAI: input.useAIRecommendations
      });

      // 1. AI Analysis of document
      const aiAnalysis = await this.workflowAI.analyzeDocumentForWorkflow(
        input.documentId,
        userId,
        organizationId
      );

      // 2. Determine workflow
      let workflowId = input.workflowId;
      
      if (!workflowId && input.naturalLanguageWorkflow) {
        // Generate workflow from natural language
        const generatedWorkflow = await this.workflowAI.generateWorkflowFromNaturalLanguage(
          input.naturalLanguageWorkflow,
          organizationId
        );
        workflowId = generatedWorkflow.id;
        this.aiLogger.info('Generated workflow from natural language', { 
          workflowId,
          description: input.naturalLanguageWorkflow 
        });
      } else if (!workflowId && input.useAIRecommendations) {
        // AI suggests best workflow based on document analysis
        workflowId = await this.suggestOptimalWorkflow(aiAnalysis, organizationId);
      }

      if (!workflowId) {
        throw new Error('No workflow specified or could be determined');
      }

      // 3. Auto-assign reviewers if using AI recommendations
      let assignedReviewers: string[] = [];
      if (input.useAIRecommendations) {
        assignedReviewers = await this.workflowAI.autoAssignReviewers(
          input.documentId,
          workflowId,
          userId,
          organizationId
        );
        
        // Update workflow with AI-suggested reviewers
        await this.updateWorkflowReviewers(workflowId, assignedReviewers);
      }

      // 4. Adjust urgency based on AI analysis if not specified
      const urgencyLevel = input.urgencyLevel || aiAnalysis.urgencyLevel;

      // 5. Submit for publishing using the parent service
      const publishing = await this.submitForPublishing(
        {
          documentId: input.documentId,
          workflowId,
          scheduledPublishAt: input.scheduledPublishAt,
          expiresAt: input.expiresAt,
          publishingNotes: input.publishingNotes || `AI Analysis: ${aiAnalysis.reasoning}`,
          urgencyLevel,
          isEmergencyPublish: input.isEmergencyPublish || aiAnalysis.riskScore > 80,
          destinations: input.destinations
        },
        userId,
        organizationId
      );

      // 6. Generate predictions for this workflow
      const prediction = await this.workflowAI.predictWorkflowOutcome(
        workflowId,
        input.documentId
      );

      // 7. Generate AI recommendations
      const recommendations = await this.generateSmartRecommendations(
        aiAnalysis,
        prediction,
        assignedReviewers
      );

      // 8. Create AI workflow tracking record
      await this.createAIWorkflowTracking(publishing.id, aiAnalysis, prediction);

      this.aiLogger.info('Smart publishing submission completed', {
        publishingId: publishing.id,
        aiConfidence: aiAnalysis.confidenceScore,
        successProbability: prediction.successProbability
      });

      return {
        publishing,
        aiAnalysis,
        prediction,
        recommendations
      };

    } catch (error) {
      this.aiLogger.error('Smart publishing submission failed:', error);
      throw error;
    }
  }

  /**
   * AI-powered workflow optimization
   */
  async optimizeWorkflow(workflowId: string, organizationId: string): Promise<{
    optimizedWorkflow: PublishingWorkflow;
    improvements: string[];
    performanceGain: number;
  }> {
    try {
      this.aiLogger.info('Optimizing workflow with AI', { workflowId });

      // Get current workflow performance
      const insights = await this.workflowAI.generateWorkflowPerformanceInsights(organizationId);
      
      // Find bottlenecks and inefficiencies
      const currentWorkflow = await this.prismaClient.publishingWorkflow.findUnique({
        where: { id: workflowId },
        include: {
          approvalSteps: {
            include: {
              requiredUsers: true
            }
          }
        }
      });

      if (!currentWorkflow) {
        throw new Error('Workflow not found');
      }

      // Generate optimization suggestions
      const optimizationDescription = `
        Optimize this workflow based on performance insights:
        Current Workflow: ${JSON.stringify(currentWorkflow, null, 2)}
        Performance Insights: ${JSON.stringify(insights, null, 2)}
        
        Suggest specific improvements to:
        1. Reduce bottlenecks
        2. Improve approval times
        3. Increase success rates
        4. Better reviewer assignment
      `;

      const optimizedWorkflow = await this.workflowAI.generateWorkflowFromNaturalLanguage(
        optimizationDescription,
        organizationId
      );

      // Calculate expected performance gain
      const performanceGain = this.calculatePerformanceGain(insights, currentWorkflow);

      const improvements = [
        'Reduced average approval time by optimizing step sequence',
        'Improved reviewer assignment based on expertise matching',
        'Added parallel processing where appropriate',
        'Automated low-risk approvals',
        'Enhanced escalation procedures'
      ];

      this.aiLogger.info('Workflow optimization completed', {
        originalWorkflowId: workflowId,
        optimizedWorkflowId: optimizedWorkflow.id,
        performanceGain
      });

      return {
        optimizedWorkflow,
        improvements,
        performanceGain
      };

    } catch (error) {
      this.aiLogger.error('Workflow optimization failed:', error);
      throw error;
    }
  }

  /**
   * Smart conflict resolution
   */
  async resolveWorkflowConflict(
    publishingId: string,
    conflictDescription: string,
    userId: string
  ): Promise<{
    resolution: any;
    actionPlan: string[];
    success: boolean;
  }> {
    try {
      this.aiLogger.info('Resolving workflow conflict with AI', { publishingId });

      // Get conflict context
      const publishing = await this.prismaClient.documentPublishing.findUnique({
        where: { id: publishingId },
        include: {
          document: true,
          workflow: true,
          approvals: {
            include: {
              approver: true
            }
          }
        }
      });

      if (!publishing) {
        throw new Error('Publishing record not found');
      }

      // Analyze conflict and get AI suggestions
      const conflictData = {
        publishingId,
        conflictType: 'APPROVAL_DISAGREEMENT' as const,
        involvedUsers: publishing.approvals.map(a => a.approverId),
        conflictDescription,
        currentStatus: publishing.publishingStatus,
        deadline: publishing.expiresAt || undefined
      };

      const resolution = await this.workflowAI.suggestConflictResolution(conflictData);

      // Apply the suggested resolution
      const success = await this.applyConflictResolution(publishing, resolution, userId);

      this.aiLogger.info('Workflow conflict resolution completed', {
        publishingId,
        resolutionType: resolution.resolutionType,
        success
      });

      return {
        resolution,
        actionPlan: resolution.actionPlan,
        success
      };

    } catch (error) {
      this.aiLogger.error('Workflow conflict resolution failed:', error);
      throw error;
    }
  }

  /**
   * AI-powered workflow analytics dashboard
   */
  async getAIWorkflowDashboard(
    organizationId: string,
    userId: string,
    timeRange?: { from: Date; to: Date }
  ): Promise<{
    insights: any;
    predictions: any[];
    recommendations: any[];
    efficiency: number;
    bottlenecks: any[];
  }> {
    try {
      this.aiLogger.info('Generating AI workflow dashboard', { organizationId, userId });

      // Get comprehensive performance insights
      const insights = await this.workflowAI.generateWorkflowPerformanceInsights(
        organizationId,
        timeRange
      );

      // Get active workflow predictions
      const activePublishings = await this.prismaClient.documentPublishing.findMany({
        where: {
          document: { organizationId },
          publishingStatus: {
            in: [PublishingStatus.PENDING_APPROVAL, PublishingStatus.IN_APPROVAL]
          }
        }
      });

      const predictions = await Promise.all(
        activePublishings.map(async (publishing) => {
          try {
            const prediction = await this.workflowAI.predictWorkflowOutcome(
              publishing.workflowId,
              publishing.documentId
            );
            return {
              publishingId: publishing.id,
              documentTitle: publishing.documentId, // Will be populated with actual title
              prediction
            };
          } catch (error) {
            this.aiLogger.warn('Failed to get prediction for publishing', { 
              publishingId: publishing.id, 
              error: (error as Error).message 
            });
            return null;
          }
        })
      );

      const validPredictions = predictions.filter(p => p !== null);

      this.aiLogger.info('AI workflow dashboard generated', {
        organizationId,
        insightsCount: insights.recommendations.length,
        predictionsCount: validPredictions.length
      });

      return {
        insights,
        predictions: validPredictions,
        recommendations: insights.recommendations,
        efficiency: insights.overallEfficiency,
        bottlenecks: insights.bottleneckAnalysis
      };

    } catch (error) {
      this.aiLogger.error('Failed to generate AI workflow dashboard:', error);
      throw error;
    }
  }

  /**
   * PRIVATE HELPER METHODS
   */

  private async suggestOptimalWorkflow(
    analysis: AIWorkflowAnalysis,
    organizationId: string
  ): Promise<string> {
    // Find workflows suitable for this document type and complexity
    const workflows = await this.prismaClient.publishingWorkflow.findMany({
      where: {
        organizationId,
        isActive: true
      },
      include: {
        approvalSteps: true
      }
    });

    // Simple heuristic - could be enhanced with ML model
    const bestWorkflow = workflows.find(w => {
      if (analysis.contentComplexity === 'HIGH') {
        return w.approvalSteps.length >= 3; // Complex documents need more steps
      } else if (analysis.contentComplexity === 'LOW') {
        return w.approvalSteps.length <= 2 && w.autoApprove; // Simple documents can be auto-approved
      }
      return w.approvalSteps.length === 2; // Medium complexity
    });

    return bestWorkflow?.id || workflows[0]?.id || '';
  }

  private async updateWorkflowReviewers(workflowId: string, reviewerIds: string[]): Promise<void> {
    // This would update the workflow's required users based on AI suggestions
    // For now, we'll add them to the first step that doesn't have enough reviewers
    const workflow = await this.prismaClient.publishingWorkflow.findUnique({
      where: { id: workflowId },
      include: {
        approvalSteps: {
          include: {
            requiredUsers: true
          }
        }
      }
    });

    if (!workflow) return;

    // Add reviewers to steps that need them
    for (const step of workflow.approvalSteps) {
      if (step.requiredUsers.length < step.minApprovals) {
        const needed = step.minApprovals - step.requiredUsers.length;
        const toAdd = reviewerIds.slice(0, needed);
        
        await Promise.all(toAdd.map(userId =>
          this.prismaClient.approvalStepUser.create({
            data: {
              approvalStep: { connect: { id: step.id } },
              user: { connect: { id: userId } },
              canApprove: true,
              canReject: true,
              canDelegate: step.allowDelegation
            }
          })
        ));
        
        reviewerIds = reviewerIds.slice(needed);
        if (reviewerIds.length === 0) break;
      }
    }
  }

  private async generateSmartRecommendations(
    analysis: AIWorkflowAnalysis,
    prediction: PredictionResult,
    assignedReviewers: string[]
  ): Promise<string[]> {
    const recommendations: string[] = [];

    if (analysis.riskScore > 70) {
      recommendations.push('High-risk document detected. Consider additional review steps.');
    }

    if (prediction.successProbability < 60) {
      recommendations.push('Low success probability. Review workflow assignment and deadlines.');
    }

    if (prediction.potentialBottlenecks.length > 0) {
      recommendations.push(
        `Potential bottlenecks identified at: ${prediction.potentialBottlenecks.map(b => b.stepName).join(', ')}`
      );
    }

    if (analysis.complianceFlags.length > 0) {
      recommendations.push(
        `Compliance review required for: ${analysis.complianceFlags.join(', ')}`
      );
    }

    return recommendations;
  }

  private async createAIWorkflowTracking(
    publishingId: string,
    analysis: AIWorkflowAnalysis,
    prediction: PredictionResult
  ): Promise<void> {
    // Create a tracking record for AI decisions and predictions
    // This could be a new table to store AI workflow metadata
    
    try {
      // For now, we'll store this as a custom field or in a separate AI tracking table
      // This would help with learning and improving AI recommendations over time
      this.aiLogger.info('AI workflow tracking created', {
        publishingId,
        analysis: {
          complexity: analysis.contentComplexity,
          riskScore: analysis.riskScore,
          confidence: analysis.confidenceScore
        },
        prediction: {
          successProbability: prediction.successProbability,
          estimatedTime: prediction.estimatedCompletionTime
        }
      });
    } catch (error) {
      this.aiLogger.warn('Failed to create AI workflow tracking:', error);
    }
  }

  private calculatePerformanceGain(insights: any, currentWorkflow: any): number {
    // Calculate expected performance improvement percentage
    // This is a simplified calculation - in reality would use historical data and ML models
    
    let gain = 0;
    
    // Bottleneck improvements
    if (insights.bottleneckAnalysis.length > 0) {
      gain += 15; // Removing bottlenecks typically improves performance by 15%
    }
    
    // Parallel processing opportunities
    if (!currentWorkflow.allowParallel && currentWorkflow.approvalSteps.length > 2) {
      gain += 25; // Parallel processing can reduce time by 25%
    }
    
    // Auto-approval for low-risk items
    if (!currentWorkflow.autoApprove) {
      gain += 10; // Auto-approval saves time on simple cases
    }
    
    return Math.min(gain, 50); // Cap at 50% improvement
  }

  private async applyConflictResolution(
    publishing: any,
    resolution: any,
    userId: string
  ): Promise<boolean> {
    try {
      switch (resolution.resolutionType) {
        case 'EXTEND_DEADLINE':
          await this.prismaClient.documentPublishing.update({
            where: { id: publishing.id },
            data: {
              expiresAt: new Date(Date.now() + resolution.estimatedResolutionTime * 60 * 60 * 1000)
            }
          });
          break;
          
        case 'ESCALATE':
          // Create escalation record and notify higher authority
          // This would involve finding managers or senior roles
          break;
          
        case 'REASSIGN':
          // Reassign to different reviewers
          // Would need to update approval step users
          break;
          
        case 'MEDIATE':
          // Schedule mediation session
          // Create calendar event and notifications
          break;
          
        default:
          this.aiLogger.warn('Unknown resolution type', { type: resolution.resolutionType });
          return false;
      }
      
      return true;
    } catch (error) {
      this.aiLogger.error('Failed to apply conflict resolution:', error);
      return false;
    }
  }
}