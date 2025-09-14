import { Router, Request, Response } from 'express';
import { WorkflowRegistry } from '../services/WorkflowRegistry';
import { WorkflowEngine } from '../services/WorkflowEngine';
import { AirForce8StagePlugin } from '../plugins/AirForce8StagePlugin';
import { SimpleApprovalPlugin } from '../plugins/SimpleApprovalPlugin';
import { CorporateReviewPlugin } from '../plugins/CorporateReviewPlugin';
import { IWorkflowContext, IWorkflowConfig } from '../types/workflow.types';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const registry = WorkflowRegistry.getInstance();
const engine = new WorkflowEngine();

// Initialize pre-built plugins on startup
async function initializePlugins() {
  try {
    // Register pre-built plugins
    await registry.register(new AirForce8StagePlugin());
    await registry.register(new SimpleApprovalPlugin());
    await registry.register(new CorporateReviewPlugin());
    
    console.log('✅ Pre-built workflow plugins loaded');
  } catch (error) {
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
  } catch (error) {
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
  } catch (error) {
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
    const workflow = registry.getWorkflow(id);
    
    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: 'Workflow not found'
      });
    }
    
    res.json({
      success: true,
      workflow: {
        id: workflow.id,
        name: workflow.name,
        version: workflow.version,
        description: workflow.description,
        organization: workflow.organization,
        stages: workflow.getStages(),
        config: workflow.config
      }
    });
  } catch (error) {
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
  } catch (error) {
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
  } catch (error) {
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
  } catch (error) {
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
    const { documentType, title } = req.body;
    
    const document = {
      id: documentId,
      type: documentType,
      title: title || 'Untitled Document'
    };
    
    const state = await engine.initializeWorkflow(document);
    
    res.json({
      success: true,
      state,
      message: 'Workflow initialized for document'
    });
  } catch (error) {
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
  } catch (error) {
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
  } catch (error) {
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
    
    const status = await engine.getWorkflowStatus(documentId);
    
    if (!status) {
      return res.status(404).json({
        success: false,
        error: 'Workflow status not found for document'
      });
    }
    
    res.json({
      success: true,
      status
    });
  } catch (error) {
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
  } catch (error) {
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
  } catch (error) {
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
  } catch (error) {
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
  } catch (error) {
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
  } catch (error) {
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
  } catch (error) {
    console.error('Error importing workflow:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to import workflow'
    });
  }
});

export default router;