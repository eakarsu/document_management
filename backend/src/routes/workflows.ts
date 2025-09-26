import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/authenticateToken';
import { WorkflowRegistry } from '../services/WorkflowRegistry';
import { logger } from '../config/logger';

const router = Router();

// GET /api/workflows - Get all registered workflows
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const workflowRegistry = WorkflowRegistry.getInstance();
    const workflows = workflowRegistry.listAll();

    // Format workflows for client
    const formattedWorkflows = workflows.map((workflow: any) => ({
      id: workflow.id,
      name: workflow.name,
      description: workflow.description,
      version: workflow.version,
      createdAt: workflow.createdAt || new Date().toISOString(),
      updatedAt: workflow.updatedAt || new Date().toISOString()
    }));

    res.json({
      success: true,
      workflows: formattedWorkflows
    });
  } catch (error) {
    logger.error('Error fetching workflows:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch workflows'
    });
  }
});

// GET /api/workflows/:id - Get a specific workflow
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const workflowRegistry = WorkflowRegistry.getInstance();
    const workflow = workflowRegistry.getWorkflow(req.params.id);

    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: 'Workflow not found'
      });
    }

    // Include stages from the workflow config
    const stages = workflow.config?.stages || workflow.getStages?.() || [];

    res.json({
      success: true,
      workflow: {
        id: workflow.id,
        name: workflow.name,
        description: workflow.description,
        version: workflow.version,
        stages: stages,
        config: workflow.config,
        createdAt: workflow.createdAt || new Date().toISOString(),
        updatedAt: workflow.updatedAt || new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error fetching workflow:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch workflow'
    });
  }
});

export default router;
