import { PrismaClient } from '@prisma/client';
import { workflowManager } from './WorkflowManager';
import winston from 'winston';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

interface WorkflowStartParams {
  documentId: string;
  userId: string;
  workflowId?: string;
  organizationId?: string;
  metadata?: any;
}

interface StageTransitionParams {
  documentId: string;
  fromStageId?: string;
  toStageId: string;
  userId: string;
  transitionData?: any;
}

/**
 * Generic Workflow Service
 * Works with any workflow configuration defined in JSON files
 * No hardcoded workflow-specific logic
 */
export class GenericWorkflowService {

  /**
   * Start a workflow for a document
   * Automatically detects and uses the appropriate workflow configuration
   */
  async startWorkflow(params: WorkflowStartParams) {
    try {
      const { documentId, userId, organizationId, metadata } = params;

      // Check if document exists
      const document = await prisma.document.findUnique({
        where: { id: documentId },
        include: { createdBy: true }
      });

      if (!document) {
        throw new Error('Document not found');
      }

      // Determine workflow ID - could come from:
      // 1. Explicit parameter
      // 2. Document type configuration
      // 3. Organization settings
      // 4. Default workflow
      let workflowId = params.workflowId;

      if (!workflowId) {
        // Try to determine workflow from configuration
        workflowId = await this.determineWorkflowId(document, organizationId);
      }

      // Use centralized WorkflowManager
      const workflowInstance = await workflowManager.getOrCreateWorkflow(
        documentId,
        workflowId,
        userId
      );

      // PERMANENT FIX: Do NOT auto-start workflow
      // User must explicitly click "Start Workflow" button
      // Removing auto-start to prevent workflow from being activated after reset
      // if (!workflowInstance.isActive) {
      //   await workflowManager.startWorkflow(documentId, userId);
      // }

      // Get the updated workflow instance
      const activeWorkflow = await workflowManager.getWorkflowStatus(documentId);

      logger.info(`Workflow started for document: ${documentId}, workflow: ${workflowId}`);

      return {
        success: true,
        workflowInstance: {
          id: activeWorkflow?.id,
          documentId,
          workflowId,
          currentStageId: activeWorkflow?.currentStageId,
          isActive: activeWorkflow?.isActive,
          metadata: {
            ...(activeWorkflow?.metadata as any || {}),
            ...metadata
          }
        }
      };
    } catch (error) {
      logger.error('Error starting workflow:', error);
      throw error;
    }
  }

  /**
   * Advance workflow to a specific stage
   * Works with any workflow configuration
   */
  async transitionToStage(params: StageTransitionParams) {
    try {
      const { documentId, fromStageId, toStageId, userId, transitionData } = params;

      // Get current workflow instance
      const workflowInstance = await prisma.jsonWorkflowInstance.findFirst({
        where: {
          documentId,
          isActive: true
        }
      });

      if (!workflowInstance) {
        throw new Error('No active workflow found for document');
      }

      // Load workflow definition
      const workflowPath = path.join(__dirname, '../../workflows', `${workflowInstance.workflowId}.json`);
      if (!fs.existsSync(workflowPath)) {
        throw new Error(`Workflow definition not found: ${workflowInstance.workflowId}`);
      }

      const workflowDef = JSON.parse(fs.readFileSync(workflowPath, 'utf-8'));

      // Validate transition is allowed
      const currentStageId = fromStageId || workflowInstance.currentStageId;
      const validTransition = workflowDef.transitions?.find((t: any) =>
        t.from === currentStageId && t.to === toStageId
      );

      if (!validTransition && workflowDef.transitions?.length > 0) {
        throw new Error(`Invalid transition from ${currentStageId} to ${toStageId}`);
      }

      // Update workflow instance
      const updated = await prisma.jsonWorkflowInstance.update({
        where: { id: workflowInstance.id },
        data: {
          currentStageId: toStageId,
          metadata: {
            ...(workflowInstance.metadata as any || {}),
            lastTransition: {
              from: currentStageId,
              to: toStageId,
              performedBy: userId,
              performedAt: new Date().toISOString(),
              data: transitionData
            }
          }
        }
      });

      // Create history entry
      const targetStage = workflowDef.stages?.find((s: any) => s.id === toStageId);
      await prisma.jsonWorkflowHistory.create({
        data: {
          workflowInstanceId: workflowInstance.id,
          stageId: toStageId,
          stageName: targetStage?.name || toStageId,
          action: `TRANSITIONED_TO_${toStageId}`,
          performedBy: userId,
          metadata: transitionData || {}
        }
      });

      // Check if workflow is complete
      // Only mark as complete if we're explicitly completing the workflow
      // Don't auto-complete just because there are no more transitions
      const shouldComplete = transitionData?.completeWorkflow === true;

      if (shouldComplete) {
        await prisma.jsonWorkflowInstance.update({
          where: { id: workflowInstance.id },
          data: {
            isActive: false,
            completedAt: new Date()
          }
        });
      }

      const hasNextTransitions = workflowDef.transitions?.some((t: any) => t.from === toStageId);

      logger.info(`Workflow transitioned from ${currentStageId} to ${toStageId} for document ${documentId}`);

      return {
        success: true,
        currentStageId: toStageId,
        isComplete: shouldComplete
      };
    } catch (error) {
      logger.error('Error transitioning workflow:', error);
      throw error;
    }
  }

  /**
   * Get workflow status for a document
   */
  async getWorkflowStatus(documentId: string) {
    try {
      const workflowInstance = await workflowManager.getWorkflowStatus(documentId);

      if (!workflowInstance) {
        return {
          success: false,
          message: 'No workflow found for document'
        };
      }

      // Load workflow definition for additional details
      const workflowPath = path.join(__dirname, '../../workflows', `${workflowInstance.workflowId}.json`);
      let workflowDef = null;

      if (fs.existsSync(workflowPath)) {
        workflowDef = JSON.parse(fs.readFileSync(workflowPath, 'utf-8'));
      }

      const currentStage = workflowDef?.stages?.find((s: any) => s.id === workflowInstance.currentStageId);

      return {
        success: true,
        workflow: {
          id: workflowInstance.id,
          documentId,
          workflowId: workflowInstance.workflowId,
          currentStageId: workflowInstance.currentStageId,
          currentStageName: currentStage?.name,
          isActive: workflowInstance.isActive,
          createdAt: workflowInstance.createdAt,
          updatedAt: workflowInstance.updatedAt,
          completedAt: workflowInstance.completedAt,
          metadata: workflowInstance.metadata,
          history: workflowInstance.history
        }
      };
    } catch (error) {
      logger.error('Error getting workflow status:', error);
      throw error;
    }
  }

  /**
   * Reset workflow to beginning
   */
  async resetWorkflow(documentId: string, userId: string) {
    try {
      const reset = await workflowManager.resetWorkflow(documentId, userId);

      return {
        success: true,
        message: 'Workflow reset successfully',
        workflowInstance: reset
      };
    } catch (error) {
      logger.error('Error resetting workflow:', error);
      throw error;
    }
  }

  /**
   * Determine which workflow to use based on document and organization
   */
  private async determineWorkflowId(document: any, organizationId?: string): Promise<string> {
    // Check if document type has a default workflow
    if (document.type) {
      const typeWorkflowMapping: Record<string, string> = {
        'policy': 'document-review-workflow',
        'procedure': 'simple-approval-workflow',
        'form': 'form-review-workflow'
      };

      if (typeWorkflowMapping[document.type]) {
        return typeWorkflowMapping[document.type];
      }
    }

    // Check organization settings (if implemented)
    if (organizationId) {
      // Could query organization settings for default workflow
    }

    // Return system default
    const configPath = path.join(__dirname, '../../config/workflow-config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      return config.defaultWorkflowId || 'document-review-workflow';
    }

    return 'document-review-workflow';
  }

  /**
   * Get available workflows
   */
  async getAvailableWorkflows() {
    try {
      const workflowsDir = path.join(__dirname, '../../workflows');

      if (!fs.existsSync(workflowsDir)) {
        return { success: true, workflows: [] };
      }

      const files = fs.readdirSync(workflowsDir);
      const workflows = files
        .filter(file => file.endsWith('.json'))
        .map(file => {
          const data = JSON.parse(fs.readFileSync(path.join(workflowsDir, file), 'utf-8'));
          return {
            id: data.id,
            name: data.name,
            description: data.description,
            version: data.version,
            stageCount: data.stages?.length || 0
          };
        });

      return {
        success: true,
        workflows
      };
    } catch (error) {
      logger.error('Error getting available workflows:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const genericWorkflowService = new GenericWorkflowService();