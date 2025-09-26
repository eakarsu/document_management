import { PrismaClient } from '@prisma/client';
import winston from 'winston';
import { workflowManager } from './WorkflowManager';

const prisma = new PrismaClient();

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

interface WorkflowParams {
  documentId: string;
  oprUserId: string;
  organizationId: string;
  metadata?: any;
}

interface StageTransitionParams {
  workflowInstanceId: string;
  fromStage: string;
  toStage: string;
  userId: string;
  transitionData?: any;
}

interface ICUFeedbackParams {
  workflowInstanceId: string;
  userId: string;
  feedback: string;
  comments?: string;
  reviewCompletionDate?: Date;
}

export class EightStageWorkflowService {
  constructor() {
    // Simple constructor
  }

  // Stage 1: Initial Draft Creation
  async createWorkflowInstance(params: WorkflowParams) {
    try {
      // Check if document exists
      const document = await prisma.document.findUnique({
        where: { id: params.documentId },
        include: { createdBy: true }
      });

      if (!document) {
        throw new Error('Document not found');
      }

      // Determine workflow ID dynamically based on request or configuration
      const workflowId = params.metadata?.workflowId || 'document-review-workflow';

      // Use centralized WorkflowManager to ensure only one workflow per document
      const workflowInstance = await workflowManager.getOrCreateWorkflow(
        params.documentId,
        workflowId,
        params.oprUserId
      );

      // PERMANENT FIX: Do NOT auto-start workflow
      // User must explicitly click "Start Workflow" button
      // Removing auto-start to prevent workflow from being activated after reset
      // if (!workflowInstance.isActive) {
      //   await workflowManager.startWorkflow(params.documentId, params.oprUserId);
      // }

      // Get updated workflow instance
      const activeWorkflow = await workflowManager.getWorkflowStatus(params.documentId);

      // Also update document's customFields for backward compatibility
      await prisma.document.update({
        where: { id: params.documentId },
        data: {
          customFields: {
            ...(document.customFields as object || {}),
            workflow: {
              stage: 'DRAFT_CREATION',
              status: 'active',
              oprUserId: params.oprUserId,
              createdAt: new Date().toISOString(),
              workflowInstanceId: activeWorkflow?.id,
              stageHistory: [{
                stage: 'DRAFT_CREATION',
                enteredAt: new Date().toISOString(),
                userId: params.oprUserId
              }]
            }
          }
        }
      });

      logger.info(`8-Stage workflow created for document: ${params.documentId}, workflow instance: ${activeWorkflow?.id}`);

      return {
        success: true,
        workflowInstance: {
          id: activeWorkflow?.id || `workflow_${params.documentId}`,
          document_id: params.documentId,
          opr_user_id: params.oprUserId,
          organization_id: params.organizationId,
          current_stage: activeWorkflow?.currentStageId || 'DRAFT_CREATION',
          is_active: activeWorkflow?.isActive || true,
          documents: document,
          users: document.createdBy
        }
      };
    } catch (error: any) {
      logger.error('Error creating 8-stage workflow instance:', error);
      throw error;
    }
  }

  // Stage 2: Internal Coordination (1st Coordination)
  async advanceToInternalCoordination(params: StageTransitionParams) {
    return await this.transitionStage({
      ...params,
      toStage: 'INTERNAL_COORDINATION'
    });
  }

  // Stage 3: OPR Revisions
  async advanceToOPRRevisions(params: StageTransitionParams) {
    return await this.transitionStage({
      ...params,
      toStage: 'OPR_REVISIONS'
    });
  }

  // Stage 4: External Coordination (2nd Coordination)
  async advanceToExternalCoordination(params: StageTransitionParams) {
    return await this.transitionStage({
      ...params,
      toStage: 'EXTERNAL_COORDINATION'
    });
  }

  // Stage 5: OPR Final
  async advanceToOPRFinal(params: StageTransitionParams) {
    return await this.transitionStage({
      ...params,
      toStage: 'OPR_FINAL'
    });
  }

  // Stage 6: Legal Review
  async advanceToLegalReview(params: StageTransitionParams) {
    return await this.transitionStage({
      ...params,
      toStage: 'LEGAL_REVIEW'
    });
  }

  // Stage 7: OPR Legal
  async advanceToOPRLegal(params: StageTransitionParams) {
    return await this.transitionStage({
      ...params,
      toStage: 'OPR_LEGAL'
    });
  }

  // Stage 8: Final Publishing (AFDPO)
  async advanceToFinalPublishing(params: StageTransitionParams) {
    return await this.transitionStage({
      ...params,
      toStage: 'FINAL_PUBLISHING'
    });
  }

  async advanceToPublished(params: StageTransitionParams) {
    return await this.transitionStage({
      ...params,
      toStage: 'PUBLISHED'
    });
  }

  // ICU Feedback Management
  async submitICUFeedback(params: ICUFeedbackParams) {
    try {
      const documentId = params.workflowInstanceId.replace('workflow_', '');
      
      // Get current document
      const document = await prisma.document.findUnique({
        where: { id: documentId }
      });

      if (!document) {
        throw new Error('Document not found');
      }

      const customFields = typeof document.customFields === 'object' && document.customFields !== null ? document.customFields as any : {};
      const currentWorkflow = customFields?.workflow || {};
      const currentFeedback = currentWorkflow.feedback || {};

      // Add the feedback
      currentFeedback[params.userId] = {
        feedback: params.feedback,
        comments: params.comments,
        submittedAt: new Date().toISOString(),
        reviewCompletionDate: params.reviewCompletionDate || new Date()
      };

      // Update document with feedback
      await prisma.document.update({
        where: { id: documentId },
        data: {
          customFields: {
            ...document.customFields as object,
            workflow: {
              ...currentWorkflow,
              feedback: currentFeedback
            }
          }
        }
      });

      logger.info(`ICU feedback submitted for document: ${documentId} by user: ${params.userId}`);

      return {
        success: true,
        message: 'ICU feedback submitted successfully',
        feedback: currentFeedback[params.userId]
      };
    } catch (error: any) {
      logger.error('Error submitting ICU feedback:', error);
      throw error;
    }
  }

  // Get workflow status
  async getWorkflowStatus(workflowInstanceId: string) {
    try {
      const documentId = workflowInstanceId.replace('workflow_', '');

      // First check if we have a JsonWorkflowInstance
      const workflowInstance = await workflowManager.getWorkflowStatus(documentId);

      if (workflowInstance) {
        return {
          success: true,
          workflow: {
            id: workflowInstance.id,
            document_id: documentId,
            current_stage: workflowInstance.currentStageId,
            is_active: workflowInstance.isActive,
            created_at: workflowInstance.createdAt,
            updated_at: workflowInstance.updatedAt,
            completed_at: workflowInstance.completedAt,
            metadata: workflowInstance.metadata
          }
        };
      }

      // Fallback to document customFields for backward compatibility
      const document = await prisma.document.findUnique({
        where: { id: documentId },
        include: {
          createdBy: true
        }
      });

      if (!document) {
        return {
          success: false,
          message: 'Workflow not found'
        };
      }

      const workflow = (document.customFields as any)?.workflow || {};

      return {
        success: true,
        workflow: {
          id: workflowInstanceId,
          document_id: documentId,
          current_stage: workflow.stage || 'DRAFT_CREATION',
          is_active: workflow.status === 'active',
          documents: document,
          users: document.createdBy,
          internal_coordinating_users: this.formatFeedback(workflow.feedback),
          stage_transitions: workflow.stageHistory || []
        }
      };
    } catch (error: any) {
      logger.error('Error getting workflow status:', error);
      throw error;
    }
  }

  // Get workflow by document ID
  async getWorkflowByDocumentId(documentId: string) {
    try {
      // First check if we have a JsonWorkflowInstance for this document
      const workflowInstance = await workflowManager.getWorkflowStatus(documentId);

      if (workflowInstance) {
        // Return data from the JsonWorkflowInstance
        return {
          success: true,
          workflow: {
            id: workflowInstance.id,
            document_id: documentId,
            current_stage: workflowInstance.currentStageId,
            is_active: workflowInstance.isActive,
            created_at: workflowInstance.createdAt,
            updated_at: workflowInstance.updatedAt,
            completed_at: workflowInstance.completedAt,
            metadata: workflowInstance.metadata,
            history: workflowInstance.history
          }
        };
      }

      // Fallback to checking document customFields for backward compatibility
      const document = await prisma.document.findUnique({
        where: { id: documentId },
        include: {
          createdBy: true
        }
      });

      if (!document) {
        return {
          success: false,
          workflow: null
        };
      }

      const workflow = (document.customFields as any)?.workflow;

      if (!workflow) {
        return {
          success: false,
          workflow: null
        };
      }

      return {
        success: true,
        workflow: {
          id: `workflow_${documentId}`,
          document_id: documentId,
          current_stage: workflow.stage || 'DRAFT_CREATION',
          is_active: workflow.status === 'active',
          documents: document,
          users: document.createdBy,
          internal_coordinating_users: this.formatFeedback(workflow.feedback),
          stage_transitions: workflow.stageHistory || []
        }
      };
    } catch (error: any) {
      logger.error('Error getting workflow by document ID:', error);
      throw error;
    }
  }

  // Bidirectional Workflow Methods
  async moveWorkflowBackward(params: {
    workflowInstanceId: string;
    fromStage: string;
    toStage: string;
    userId: string;
    reason: string;
    transitionData?: any;
  }) {
    try {
      const documentId = params.workflowInstanceId.replace('workflow_', '');
      
      // Get current document
      const document = await prisma.document.findUnique({
        where: { id: documentId },
        include: {
          createdBy: true
        }
      });

      if (!document) {
        throw new Error('Document not found');
      }

      const customFields = typeof document.customFields === 'object' && document.customFields !== null ? document.customFields as any : {};
      const currentWorkflow = customFields?.workflow || {};
      
      // Validate backward transition is allowed
      const isValidBackwardTransition = await this.validateBackwardTransition(
        params.fromStage, 
        params.toStage, 
        params.userId,
        document.organizationId
      );

      if (!isValidBackwardTransition.allowed) {
        throw new Error(`Backward transition not allowed: ${isValidBackwardTransition.reason}`);
      }

      // Record the backward transition with reason
      const stageHistory = currentWorkflow.stageHistory || [];
      stageHistory.push({
        stage: params.toStage,
        enteredAt: new Date().toISOString(),
        userId: params.userId,
        transitionType: 'BACKWARD',
        fromStage: params.fromStage,
        reason: params.reason,
        transitionData: params.transitionData
      });

      // Update document workflow state
      await prisma.document.update({
        where: { id: documentId },
        data: {
          customFields: {
            ...document.customFields as object,
            workflow: {
              ...currentWorkflow,
              stage: params.toStage,
              status: 'active',
              lastTransition: {
                type: 'BACKWARD',
                from: params.fromStage,
                to: params.toStage,
                userId: params.userId,
                reason: params.reason,
                timestamp: new Date().toISOString()
              },
              stageHistory
            }
          }
        }
      });

      logger.info(`Workflow moved backward: ${params.fromStage} -> ${params.toStage} for document ${documentId} by user ${params.userId}. Reason: ${params.reason}`);

      return {
        success: true,
        message: 'Workflow moved backward successfully',
        workflow: {
          id: params.workflowInstanceId,
          current_stage: params.toStage,
          previous_stage: params.fromStage,
          transition_type: 'BACKWARD',
          reason: params.reason,
          stage_history: stageHistory
        }
      };
    } catch (error: any) {
      logger.error('Error moving workflow backward:', error);
      throw error;
    }
  }

  private async validateBackwardTransition(fromStage: string, toStage: string, userId: string, organizationId: string) {
    // Get user role and permissions
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true }
    });

    if (!user) {
      return { allowed: false, reason: 'User not found' };
    }

    // Check if user has permission to move workflows backward
    const hasWorkflowAdminPermission = user.role.permissions.includes('MANAGE_WORKFLOW') || 
                                       user.role.permissions.includes('MOVE_BACKWARD');

    if (!hasWorkflowAdminPermission) {
      return { allowed: false, reason: 'User does not have permission to move workflows backward' };
    }

    // Define valid backward transitions
    const validBackwardTransitions: Record<string, string[]> = {
      'INTERNAL_COORDINATION': ['DRAFT_CREATION'],
      'OPR_REVISIONS': ['INTERNAL_COORDINATION', 'DRAFT_CREATION'],
      'EXTERNAL_COORDINATION': ['OPR_REVISIONS', 'INTERNAL_COORDINATION'],
      'OPR_FINAL': ['EXTERNAL_COORDINATION', 'OPR_REVISIONS'],
      'LEGAL_REVIEW': ['OPR_FINAL', 'EXTERNAL_COORDINATION'],
      'OPR_LEGAL': ['LEGAL_REVIEW', 'OPR_FINAL'],
      'FINAL_PUBLISHING': ['OPR_LEGAL', 'LEGAL_REVIEW']
    };

    const allowedTargets = validBackwardTransitions[fromStage] || [];
    if (!allowedTargets.includes(toStage)) {
      return { 
        allowed: false, 
        reason: `Cannot move from ${fromStage} to ${toStage}. Valid targets: ${allowedTargets.join(', ')}` 
      };
    }

    return { allowed: true, reason: 'Valid backward transition' };
  }

  // Enhanced stage transition with role validation
  async transitionStageWithRoleValidation(params: StageTransitionParams & { 
    requiredRole?: string;
    skipValidation?: boolean;
  }) {
    try {
      const documentId = params.workflowInstanceId.replace('workflow_', '');
      
      // Get user role if role validation is required
      if (params.requiredRole && !params.skipValidation) {
        const user = await prisma.user.findUnique({
          where: { id: params.userId },
          include: { role: true }
        });

        if (!user) {
          throw new Error('User not found');
        }

        if (user.role.name !== params.requiredRole && !user.role.permissions.includes('MANAGE_WORKFLOW')) {
          throw new Error(`User role ${user.role.name} is not authorized for this transition. Required role: ${params.requiredRole}`);
        }
      }

      // First find the workflow instance by documentId
      const workflowInstance = await prisma.jsonWorkflowInstance.findFirst({
        where: {
          documentId: documentId,
          isActive: true
        }
      });

      if (!workflowInstance) {
        throw new Error('Active workflow instance not found');
      }

      // Update the workflow instance in the database
      const updatedInstance = await prisma.jsonWorkflowInstance.update({
        where: {
          id: workflowInstance.id
        },
        data: {
          currentStageId: params.toStage,
          metadata: {
            ...params.transitionData,
            roleValidated: true,
            requiredRole: params.requiredRole,
            lastTransition: {
              from: params.fromStage,
              to: params.toStage,
              userId: params.userId,
              timestamp: new Date().toISOString()
            }
          },
          updatedAt: new Date()
        }
      });

      // Get stage name for history
      const stageNames: Record<string, string> = {
        '1': 'Initial Draft Creation',
        '2': 'PCM Review',
        '3': 'Initial Coordination - Distribution Phase',
        '3.5': 'Review Collection Phase',
        '4': 'OPR Feedback Incorporation & Draft Creation',
        '5': 'Second Coordination - Distribution Phase',
        '5.5': 'Second Review Collection Phase',
        '6': 'OPR Second Feedback Incorporation',
        '7': 'Legal Review',
        '8': 'Post-Legal OPR Update',
        '9': 'Leadership Review & Decision',
        '10': 'AFDPO Processing',
        '11': 'Records Management',
        '12': 'Workflow Completion'
      };

      // Add to workflow history
      await prisma.jsonWorkflowHistory.create({
        data: {
          workflowInstanceId: updatedInstance.id,
          stageId: params.toStage,
          stageName: stageNames[params.toStage] || `Stage ${params.toStage}`,
          action: `Transitioned from ${params.fromStage} to ${params.toStage}`,
          performedBy: params.userId,
          metadata: {
            transitionData: params.transitionData || {}
          }
        }
      });

      return {
        success: true,
        message: `Advanced to ${params.toStage} stage`,
        workflowInstance: updatedInstance
      };
    } catch (error: any) {
      logger.error('Error in role-validated stage transition:', error);
      throw error;
    }
  }

  // Get workflow history with transition details
  async getWorkflowHistory(workflowInstanceId: string) {
    try {
      const documentId = workflowInstanceId.replace('workflow_', '');
      
      const document = await prisma.document.findUnique({
        where: { id: documentId },
        include: {
          createdBy: true
        }
      });

      if (!document) {
        throw new Error('Document not found');
      }

      const workflow = (document.customFields as any)?.workflow || {};
      const stageHistory = workflow.stageHistory || [];

      // Enhance history with user details
      const enhancedHistory = await Promise.all(
        stageHistory.map(async (entry: any) => {
          const user = await prisma.user.findUnique({
            where: { id: entry.userId },
            include: { role: true }
          });
          
          return {
            ...entry,
            user: user ? {
              id: user.id,
              name: `${user.firstName} ${user.lastName}`,
              email: user.email,
              role: user.role.name
            } : null
          };
        })
      );

      return {
        success: true,
        workflow: {
          id: workflowInstanceId,
          document_id: documentId,
          current_stage: workflow.stage || 'DRAFT_CREATION',
          status: workflow.status,
          history: enhancedHistory,
          feedback: workflow.feedback || {},
          lastTransition: workflow.lastTransition
        }
      };
    } catch (error: any) {
      logger.error('Error getting workflow history:', error);
      throw error;
    }
  }

  // Helper Methods
  private async transitionStage(params: StageTransitionParams) {
    try {
      const documentId = params.workflowInstanceId.replace('workflow_', '');
      
      // Get current document
      const document = await prisma.document.findUnique({
        where: { id: documentId },
        include: {
          createdBy: true
        }
      });

      if (!document) {
        throw new Error('Document not found');
      }

      const customFields = typeof document.customFields === 'object' && document.customFields !== null ? document.customFields as any : {};
      const currentWorkflow = customFields?.workflow || {};
      const stageHistory = currentWorkflow.stageHistory || [];

      // Add new stage to history
      stageHistory.push({
        stage: params.toStage,
        enteredAt: new Date().toISOString(),
        userId: params.userId,
        transitionData: params.transitionData
      });

      // Update document
      const updatedDocument = await prisma.document.update({
        where: { id: documentId },
        data: {
          customFields: {
            ...document.customFields as object,
            workflow: {
              ...currentWorkflow,
              stage: params.toStage,
              stageHistory
            }
          }
        },
        include: {
          createdBy: true
        }
      });

      logger.info(`Workflow stage transitioned from ${params.fromStage} to ${params.toStage} for document: ${documentId}`);

      return {
        success: true,
        message: `Advanced to ${params.toStage} stage`,
        workflowInstance: {
          id: params.workflowInstanceId,
          current_stage: params.toStage,
          documents: updatedDocument,
          users: updatedDocument.createdBy,
          opr_user_id: currentWorkflow.oprUserId
        }
      };
    } catch (error: any) {
      logger.error('Error transitioning workflow stage:', error);
      throw error;
    }
  }

  private formatFeedback(feedback: any) {
    if (!feedback) return [];
    
    return Object.entries(feedback).map(([userId, data]: [string, any]) => ({
      user_id: userId,
      feedback: data.feedback,
      comments: data.comments,
      review_completion_date: data.reviewCompletionDate
    }));
  }

  // Submit generic feedback for any role
  async submitGenericFeedback(params: {
    workflowInstanceId: string;
    userId: string;
    userRole: string;
    stage: string;
    feedback: string;
    comments?: string;
    reviewCompletionDate?: Date;
  }) {
    try {
      // Try to find by workflow_instance_id first (for backward compatibility)
      let document = await prisma.document.findFirst({
        where: {
          customFields: {
            path: ['workflow', 'workflow_instance_id'],
            equals: params.workflowInstanceId
          }
        }
      });

      // If not found, try to find by document ID directly
      if (!document) {
        document = await prisma.document.findUnique({
          where: { id: params.workflowInstanceId }
        });
      }

      if (!document) {
        throw new Error('Workflow not found');
      }

      const customFields = typeof document.customFields === 'object' && document.customFields !== null ? document.customFields as any : {};
      const currentWorkflow = customFields?.workflow || {};
      const feedbackKey = `${params.stage}_${params.userRole}_feedback`;
      
      const updatedWorkflow = {
        ...currentWorkflow,
        feedback: {
          ...(currentWorkflow.feedback || {}),
          [feedbackKey]: {
            userId: params.userId,
            userRole: params.userRole,
            feedback: params.feedback,
            comments: params.comments,
            reviewCompletionDate: params.reviewCompletionDate || new Date(),
            stage: params.stage
          }
        }
      };

      await prisma.document.update({
        where: { id: document.id },
        data: {
          customFields: {
            ...(typeof document.customFields === 'object' && document.customFields !== null ? document.customFields : {}),
            workflow: updatedWorkflow
          }
        }
      });

      return {
        success: true,
        message: 'Feedback submitted successfully',
        feedback: updatedWorkflow.feedback[feedbackKey]
      };
    } catch (error: any) {
      logger.error('Error submitting generic feedback:', error);
      throw error;
    }
  }

  // Get role-specific UI configuration
  async getRoleSpecificConfig(stage: string, userRole: string) {
    try {
      const stageConfigs: Record<string, Record<string, any>> = {
        'DRAFT_CREATION': {
          'OPR': {
            buttons: ['Submit for Coordination', 'Save Draft'],
            permissions: ['create', 'edit', 'submit'],
            fields: ['document_content']
          },
          'AUTHOR': {
            buttons: ['Submit for Coordination', 'Save Draft'],
            permissions: ['create', 'edit', 'submit'],
            fields: ['document_content']
          }
        },
        'INTERNAL_COORDINATION': {
          'ICU_REVIEWER': {
            buttons: ['Approve', 'Request Changes', 'Add Comments'],
            permissions: ['review', 'comment', 'approve', 'reject'],
            fields: ['review_comments', 'feedback']
          },
          'TECHNICAL_REVIEWER': {
            buttons: ['Approve', 'Request Changes', 'Add Comments'],
            permissions: ['review', 'comment', 'approve', 'reject'],
            fields: ['technical_review', 'feedback']
          }
        },
        'EXTERNAL_COORDINATION': {
          'TECHNICAL_REVIEWER': {
            buttons: ['Final Review', 'Request Changes'],
            permissions: ['review', 'comment', 'approve'],
            fields: ['external_review', 'feedback']
          }
        },
        'LEGAL_REVIEW': {
          'LEGAL_REVIEWER': {
            buttons: ['Legal Approve', 'Request Legal Changes'],
            permissions: ['legal_review', 'comment', 'approve', 'reject'],
            fields: ['legal_comments', 'compliance_check']
          }
        },
        'FINAL_PUBLISHING': {
          'PUBLISHER': {
            buttons: ['Publish Document', 'Schedule Publishing'],
            permissions: ['publish', 'schedule'],
            fields: ['publishing_notes']
          }
        }
      };

      const config = stageConfigs[stage]?.[userRole] || {
        buttons: [],
        permissions: [],
        fields: [],
        message: 'No actions available for your role in this stage'
      };

      return {
        success: true,
        stage,
        userRole,
        config
      };
    } catch (error: any) {
      logger.error('Error getting role-specific config:', error);
      throw error;
    }
  }

  // Get user permissions for workflow
  async getUserPermissionsForWorkflow(workflowId: string, userId: string, userRole: string) {
    try {
      // Try to find by workflow_instance_id first (for backward compatibility)
      let document = await prisma.document.findFirst({
        where: {
          customFields: {
            path: ['workflow', 'workflow_instance_id'],
            equals: workflowId
          }
        }
      });

      // If not found, try to find by document ID directly
      if (!document) {
        document = await prisma.document.findUnique({
          where: { id: workflowId }
        });
      }

      if (!document) {
        throw new Error('Workflow not found');
      }

      const customFields = typeof document.customFields === 'object' && document.customFields !== null ? document.customFields as any : {};
      const currentWorkflow = customFields?.workflow || {};
      const currentStage = currentWorkflow.current_stage || 'DRAFT_CREATION';

      // Role-based permissions by stage
      const stagePermissions: Record<string, string[]> = {
        'DRAFT_CREATION': ['OPR', 'AUTHOR', 'ADMIN', 'WORKFLOW_ADMIN'],
        'INTERNAL_COORDINATION': ['ICU_REVIEWER', 'TECHNICAL_REVIEWER', 'ADMIN', 'WORKFLOW_ADMIN'],
        'OPR_REVISIONS': ['OPR', 'AUTHOR', 'ADMIN', 'WORKFLOW_ADMIN'],
        'EXTERNAL_COORDINATION': ['TECHNICAL_REVIEWER', 'ADMIN', 'WORKFLOW_ADMIN'],
        'OPR_FINAL': ['OPR', 'AUTHOR', 'ADMIN', 'WORKFLOW_ADMIN'],
        'LEGAL_REVIEW': ['LEGAL_REVIEWER', 'ADMIN', 'WORKFLOW_ADMIN'],
        'OPR_LEGAL': ['OPR', 'AUTHOR', 'ADMIN', 'WORKFLOW_ADMIN'],
        'FINAL_PUBLISHING': ['PUBLISHER', 'ADMIN', 'WORKFLOW_ADMIN']
      };

      const canAdvance = stagePermissions[currentStage]?.includes(userRole) || false;
      const canComment = true; // All authenticated users can comment
      const canView = true; // All authenticated users can view
      const isWorkflowOwner = currentWorkflow.opr_user_id === userId;

      return {
        success: true,
        workflowId,
        userId,
        userRole,
        currentStage,
        permissions: {
          canAdvance,
          canComment,
          canView,
          canMoveBackward: userRole === 'ADMIN' || userRole === 'WORKFLOW_ADMIN',
          isWorkflowOwner,
          allowedActions: this.getAllowedActionsForRole(currentStage, userRole)
        }
      };
    } catch (error: any) {
      logger.error('Error getting user permissions:', error);
      throw error;
    }
  }

  private getAllowedActionsForRole(stage: string, role: string): string[] {
    const roleActions: Record<string, Record<string, string[]>> = {
      'DRAFT_CREATION': {
        'OPR': ['submit_for_coordination', 'save_draft', 'edit_content'],
        'AUTHOR': ['submit_for_coordination', 'save_draft', 'edit_content']
      },
      'INTERNAL_COORDINATION': {
        'ICU_REVIEWER': ['approve', 'reject', 'add_comments', 'request_changes'],
        'TECHNICAL_REVIEWER': ['approve', 'reject', 'add_comments', 'request_changes']
      },
      'EXTERNAL_COORDINATION': {
        'TECHNICAL_REVIEWER': ['final_review', 'request_changes', 'add_comments']
      },
      'LEGAL_REVIEW': {
        'LEGAL_REVIEWER': ['legal_approve', 'legal_reject', 'add_legal_comments']
      },
      'FINAL_PUBLISHING': {
        'PUBLISHER': ['publish', 'schedule_publish', 'add_publishing_notes']
      }
    };

    return roleActions[stage]?.[role] || ['view'];
  }

  // Reset workflow to DRAFT_CREATION stage (Admin only)
  async resetWorkflow(workflowId: string, userId: string) {
    try {
      // Remove 'workflow_' prefix if present
      const documentId = workflowId.startsWith('workflow_')
        ? workflowId.replace('workflow_', '')
        : workflowId;

      // Use the centralized WorkflowManager for reset
      // This ensures workflow is properly deactivated after reset
      const resetResult = await workflowManager.resetWorkflow(documentId, userId);

      logger.info(`Workflow reset to beginning for document: ${documentId} by user: ${userId}`);

      return {
        success: true,
        message: 'Workflow successfully reset to beginning',
        workflow: {
          documentId: documentId,
          currentStage: resetResult.currentStageId,
          isActive: resetResult.isActive, // Will be false after reset
          resetAt: new Date().toISOString(),
          resetBy: userId
        }
      };
    } catch (error: any) {
      logger.error('Error resetting workflow:', error);
      throw error;
    }
  }
}