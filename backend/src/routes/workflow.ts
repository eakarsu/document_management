import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { WorkflowRegistry } from '../services/WorkflowRegistry';
import { WorkflowEngine } from '../services/WorkflowEngine';
import { AirForce12StagePlugin } from '../plugins/AirForce12StagePlugin';
import { SimpleApprovalPlugin } from '../plugins/SimpleApprovalPlugin';
import { CorporateReviewPlugin } from '../plugins/CorporateReviewPlugin';
import { IWorkflowContext, IWorkflowConfig } from '../types/workflow.types';
import { authMiddleware } from '../middleware/auth';

const prisma = new PrismaClient();

const router = Router();
const registry = WorkflowRegistry.getInstance();
const engine = new WorkflowEngine();

// Initialize pre-built plugins on startup
async function initializePlugins() {
  try {
    // Register pre-built plugins
    await registry.register(new AirForce12StagePlugin());
    await registry.register(new SimpleApprovalPlugin());
    await registry.register(new CorporateReviewPlugin());

    console.log('✅ Pre-built workflow plugins loaded');

    // Set default active workflows for document types
    // Use AirForce 12-stage as default for all document types
    // Note: Only activate if plugins are successfully registered
    const documentTypes = ['standard', 'memo', 'report', 'policy', 'instruction', 'manual'];
    const pluginId = 'af-12-stage-review';

    // Check if the plugin exists before activating
    const plugin = registry.getWorkflow(pluginId);
    if (plugin) {
      for (const docType of documentTypes) {
        await registry.activateForDocumentType(pluginId, docType);
      }
      console.log(`✅ Default workflow '${pluginId}' activated for document types: ${documentTypes.join(', ')}`);
    } else {
      console.warn(`⚠️ Plugin '${pluginId}' not found, skipping activation`);
    }

    console.log('✅ Default workflows activated for document types');
  } catch (error: any) {
    console.error('Failed to initialize workflow plugins:', error);
  }
}

// Call initialization
initializePlugins();

// Get all available workflows
router.get('/workflows', authMiddleware, async (req: Request, res: Response) => {
  try {
    const workflows = registry.listAll();
    res.json({
      success: true,
      workflows
    });
  } catch (error: any) {
    console.error('Error fetching workflows:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch workflows'
    });
  }
});

// Get active workflow mappings
router.get('/workflows/active', authMiddleware, async (req: Request, res: Response) => {
  try {
    const activeWorkflows = registry.listActive();
    const mappings = Array.from(activeWorkflows.entries()).map(([docType, pluginId]) => ({
      documentType: docType,
      workflowId: pluginId
    }));
    
    res.json({
      success: true,
      mappings
    });
  } catch (error: any) {
    console.error('Error fetching active workflows:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active workflows'
    });
  }
});

// Get specific workflow details
router.get('/workflows/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // First try to get from database for persistence
    const dbWorkflow = await prisma.workflowPlugin.findUnique({
      where: { id }
    });

    if (dbWorkflow) {
      // Return workflow from database with stages from config
      const config = dbWorkflow.config as any;
      return res.json({
        id: dbWorkflow.id,
        name: dbWorkflow.name,
        version: dbWorkflow.version,
        description: dbWorkflow.description,
        organization: dbWorkflow.organization,
        stages: config.stages || [],
        config: config
      });
    }

    // Fallback to registry
    const workflow = registry.getWorkflow(id);

    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: 'Workflow not found'
      });
    }

    // Return workflow details directly
    res.json({
      id: workflow.id,
      name: workflow.name,
      version: workflow.version,
      description: workflow.description,
      organization: workflow.organization,
      stages: workflow.config.stages || workflow.getStages(),
      config: workflow.config
    });
  } catch (error: any) {
    console.error('Error fetching workflow:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch workflow'
    });
  }
});

// Register a new workflow plugin
router.post('/workflows/register', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { config, metadata } = req.body;
    
    if (!config || !metadata) {
      return res.status(400).json({
        success: false,
        error: 'Missing configuration or metadata'
      });
    }
    
    const pluginId = await registry.importPlugin(config, metadata);
    
    res.json({
      success: true,
      workflowId: pluginId,
      message: 'Workflow registered successfully'
    });
  } catch (error: any) {
    console.error('Error registering workflow:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register workflow'
    });
  }
});

// Activate workflow for document type
router.post('/workflows/:id/activate', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { documentType } = req.body;
    
    if (!documentType) {
      return res.status(400).json({
        success: false,
        error: 'Document type is required'
      });
    }
    
    await registry.activateForDocumentType(id, documentType);
    
    res.json({
      success: true,
      message: `Workflow ${id} activated for document type ${documentType}`
    });
  } catch (error: any) {
    console.error('Error activating workflow:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to activate workflow'
    });
  }
});

// Deactivate workflow for document type
router.post('/workflows/deactivate', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { documentType } = req.body;
    
    if (!documentType) {
      return res.status(400).json({
        success: false,
        error: 'Document type is required'
      });
    }
    
    await registry.deactivateForDocumentType(documentType);
    
    res.json({
      success: true,
      message: `Workflow deactivated for document type ${documentType}`
    });
  } catch (error: any) {
    console.error('Error deactivating workflow:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to deactivate workflow'
    });
  }
});

// Initialize workflow for document
router.post('/documents/:id/workflow/initialize', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id: documentId } = req.params;
    const { documentType, title, workflowId } = req.body;

    console.log('Received request body:', req.body);
    console.log('Document type received:', documentType);
    console.log('Workflow ID received:', workflowId);

    // Check if workflow instance already exists
    const existingInstance = await prisma.jsonWorkflowInstance.findFirst({
      where: {
        documentId,
        isActive: true
      }
    });

    if (existingInstance) {
      return res.status(400).json({
        success: false,
        error: 'Workflow already active for this document'
      });
    }

    // Create new workflow instance in database
    const workflowInstance = await prisma.jsonWorkflowInstance.create({
      data: {
        documentId,
        workflowId: workflowId || 'af-12-stage-review', // Default to 12-stage workflow
        currentStageId: '1', // Start at stage 1
        isActive: true,
        metadata: JSON.stringify({
          documentType,
          title: title || 'Untitled Document',
          startedAt: new Date().toISOString(),
          startedBy: (req as any).user.id
        })
      }
    });

    // Also create initial history entry
    await prisma.jsonWorkflowHistory.create({
      data: {
        workflowInstanceId: workflowInstance.id,
        stageId: '1',
        stageName: 'Initial Draft Preparation',
        action: 'workflow_started',
        performedBy: (req as any).user.id,
        metadata: JSON.stringify({
          documentType,
          title: title || 'Untitled Document'
        })
      }
    });

    const document = {
      id: documentId,
      type: documentType,
      title: title || 'Untitled Document'
    };

    const state = await engine.initializeWorkflow(document);

    res.json({
      success: true,
      state,
      workflowInstance,
      message: 'Workflow initialized and saved to database'
    });
  } catch (error: any) {
    console.error('Error initializing workflow:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize workflow'
    });
  }
});

// Process workflow action
router.post('/documents/:id/workflow/action', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id: documentId } = req.params;
    const { action, comment, metadata } = req.body;
    const user = (req as any).user;

    if (!action) {
      return res.status(400).json({
        success: false,
        error: 'Action is required'
      });
    }

    // CRITICAL VALIDATION: Block publish actions unless at stage 10
    const lowerAction = action.toLowerCase();
    if (lowerAction.includes('publish') || lowerAction.includes('afdpo')) {
      // Get current workflow stage
      const workflowInstance = await prisma.jsonWorkflowInstance.findFirst({
        where: {
          documentId,
          isActive: true
        }
      });

      if (!workflowInstance || workflowInstance.currentStageId !== '10') {
        console.error(`⚠️ BLOCKED: Attempt to publish document at stage ${workflowInstance?.currentStageId || 'unknown'} (must be at stage 10)`);
        return res.status(403).json({
          success: false,
          error: 'Publishing is only allowed at the AFDPO Publication stage (stage 10)'
        });
      }
    }
    
    // Get document (simplified - would normally fetch from DB)
    const document = {
      id: documentId,
      type: req.body.documentType || 'policy',
      title: req.body.title || 'Document'
    };
    
    const context: IWorkflowContext = {
      document,
      user: {
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        roles: user.roles || ['user']
      },
      action,
      comment,
      metadata
    };
    
    const result = await engine.processDocument(document, action, context);
    
    res.json({
      success: result.success,
      result,
      message: result.success ? 'Workflow action processed' : 'Workflow action failed'
    });
  } catch (error: any) {
    console.error('Error processing workflow action:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process workflow action'
    });
  }
});

// Get available actions for document
router.get('/documents/:id/workflow/actions', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id: documentId } = req.params;
    const user = (req as any).user;
    
    // Get document (simplified - would normally fetch from DB)
    const document = {
      id: documentId,
      type: req.query.documentType as string || 'policy',
      title: 'Document'
    };
    
    const actions = await engine.getAvailableActions(document, user.id);
    
    res.json({
      success: true,
      actions
    });
  } catch (error: any) {
    console.error('Error fetching available actions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch available actions'
    });
  }
});

// Get workflow status for document
router.get('/documents/:id/workflow/status', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id: documentId } = req.params;

    // Get the workflow state from our new system
    const { WorkflowStateManager } = require('../services/WorkflowStateManager');
    const stateManager = new WorkflowStateManager();
    const workflowState = await stateManager.getState(documentId);

    if (!workflowState) {
      return res.json({
        success: false,
        workflow: null
      });
    }

    // Get the workflow plugin to get stage details
    const workflow = registry.getWorkflow(workflowState.workflowId);
    if (!workflow) {
      return res.json({
        success: false,
        workflow: null
      });
    }

    // Get all stages from the workflow
    const allStages = workflow.getStages();
    const currentStage = allStages.find(s => s.id === workflowState.currentStage);
    const currentStageName = currentStage?.name || workflowState.currentStage;
    const currentStageOrder = currentStage?.order || 1;
    const totalStages = allStages.filter(s => !s.id.includes('.')).length; // Count main stages only

    // Return in the format the frontend expects with full stage information
    res.json({
      success: true,
      workflow: {
        id: workflowState.workflowId,
        document_id: documentId,
        current_stage: currentStageName,
        current_stage_id: workflowState.currentStage,
        current_stage_order: currentStageOrder,
        total_stages: totalStages,
        all_stages: allStages,
        is_active: workflowState.status === 'active',
        created_at: workflowState.startedAt,
        updated_at: workflowState.updatedAt,
        completed_at: workflowState.completedAt,
        status: workflowState.status,
        history: workflowState.history || []
      }
    });
  } catch (error: any) {
    console.error('Error fetching workflow status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch workflow status'
    });
  }
});

// Get workflow history for document
router.get('/documents/:id/workflow/history', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id: documentId } = req.params;
    
    const history = await engine.getWorkflowHistory(documentId);
    
    res.json({
      success: true,
      history
    });
  } catch (error: any) {
    console.error('Error fetching workflow history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch workflow history'
    });
  }
});

// Cancel workflow
router.post('/documents/:id/workflow/cancel', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id: documentId } = req.params;
    const { reason } = req.body;
    const user = (req as any).user;
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        error: 'Cancellation reason is required'
      });
    }
    
    await engine.cancelWorkflow(documentId, reason, user.id);
    
    res.json({
      success: true,
      message: 'Workflow cancelled successfully'
    });
  } catch (error: any) {
    console.error('Error cancelling workflow:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel workflow'
    });
  }
});

// Suspend workflow
router.post('/documents/:id/workflow/suspend', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id: documentId } = req.params;
    const { reason } = req.body;
    const user = (req as any).user;
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        error: 'Suspension reason is required'
      });
    }
    
    await engine.suspendWorkflow(documentId, reason, user.id);
    
    res.json({
      success: true,
      message: 'Workflow suspended successfully'
    });
  } catch (error: any) {
    console.error('Error suspending workflow:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to suspend workflow'
    });
  }
});

// Resume workflow
router.post('/documents/:id/workflow/resume', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id: documentId } = req.params;
    const user = (req as any).user;
    
    await engine.resumeWorkflow(documentId, user.id);
    
    res.json({
      success: true,
      message: 'Workflow resumed successfully'
    });
  } catch (error: any) {
    console.error('Error resuming workflow:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resume workflow'
    });
  }
});

// Export workflow configuration
router.get('/workflows/:id/export', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const config = registry.exportPlugin(id);
    
    if (!config) {
      return res.status(404).json({
        success: false,
        error: 'Workflow not found'
      });
    }
    
    res.json({
      success: true,
      config
    });
  } catch (error: any) {
    console.error('Error exporting workflow:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export workflow'
    });
  }
});

// Import workflow configuration
router.post('/workflows/import', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { config, metadata } = req.body;
    
    if (!config) {
      return res.status(400).json({
        success: false,
        error: 'Workflow configuration is required'
      });
    }
    
    const workflowId = await registry.importPlugin(config as IWorkflowConfig, metadata || {});
    
    res.json({
      success: true,
      workflowId,
      message: 'Workflow imported successfully'
    });
  } catch (error: any) {
    console.error('Error importing workflow:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to import workflow'
    });
  }
});

export default router;