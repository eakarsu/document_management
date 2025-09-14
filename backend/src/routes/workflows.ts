import express from 'express';
import fs from 'fs';
import path from 'path';
import { authMiddleware } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const router = express.Router();

// Load workflow from JSON file
router.get('/workflows/:workflowId', authMiddleware, async (req, res) => {
  try {
    const { workflowId } = req.params;
    const workflowPath = path.join(__dirname, '../../workflows', `${workflowId}.json`);
    
    if (!fs.existsSync(workflowPath)) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    
    const workflowData = JSON.parse(fs.readFileSync(workflowPath, 'utf-8'));
    res.json(workflowData);
  } catch (error) {
    console.error('Error loading workflow:', error);
    res.status(500).json({ error: 'Failed to load workflow' });
  }
});

// List available workflows
router.get('/workflows', authMiddleware, async (req, res) => {
  try {
    const workflowsDir = path.join(__dirname, '../../workflows');
    const configPath = path.join(__dirname, '../../config/workflow-config.json');
    
    if (!fs.existsSync(workflowsDir)) {
      fs.mkdirSync(workflowsDir, { recursive: true });
    }
    
    // Load workflow configuration if exists
    let config: any = { defaultWorkflowId: 'document-review-workflow' };
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
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
          type: data.type,
          stageCount: data.stages?.length || 0,
          isDefault: data.id === config.defaultWorkflowId
        };
      })
      // Sort so default workflow appears first
      .sort((a, b) => {
        if (a.isDefault) return -1;
        if (b.isDefault) return 1;
        return 0;
      });
    
    res.json(workflows);
  } catch (error) {
    console.error('Error listing workflows:', error);
    res.status(500).json({ error: 'Failed to list workflows' });
  }
});

// Save workflow JSON
router.post('/workflows', authMiddleware, async (req, res) => {
  try {
    const workflowData = req.body;
    
    if (!workflowData.id || !workflowData.name) {
      return res.status(400).json({ error: 'Workflow ID and name are required' });
    }
    
    const workflowsDir = path.join(__dirname, '../../workflows');
    if (!fs.existsSync(workflowsDir)) {
      fs.mkdirSync(workflowsDir, { recursive: true });
    }
    
    const workflowPath = path.join(workflowsDir, `${workflowData.id}.json`);
    fs.writeFileSync(workflowPath, JSON.stringify(workflowData, null, 2));
    
    res.json({ success: true, message: 'Workflow saved successfully' });
  } catch (error) {
    console.error('Error saving workflow:', error);
    res.status(500).json({ error: 'Failed to save workflow' });
  }
});

// Get workflow instance status for a document
router.get('/workflow-instances/:documentId', authMiddleware, async (req, res) => {
  try {
    const { documentId } = req.params;
    
    // First try to find an active workflow
    let workflowInstance = await prisma.jsonWorkflowInstance.findFirst({
      where: {
        documentId,
        isActive: true
      },
      include: {
        history: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    // If no active workflow, check for a completed workflow
    if (!workflowInstance) {
      workflowInstance = await prisma.jsonWorkflowInstance.findFirst({
        where: {
          documentId,
          completedAt: { not: null }
        },
        orderBy: {
          completedAt: 'desc'
        },
        include: {
          history: {
            orderBy: {
              createdAt: 'desc'
            }
          }
        }
      });
    }

    if (!workflowInstance) {
      return res.json({
        active: false,
        isActive: false,
        message: 'No workflow for this document'
      });
    }
    
    // Load the workflow definition
    const workflowPath = path.join(__dirname, '../../workflows', `${workflowInstance.workflowId}.json`);
    
    if (!fs.existsSync(workflowPath)) {
      return res.status(404).json({ error: 'Workflow definition not found' });
    }
    
    const workflowDef = JSON.parse(fs.readFileSync(workflowPath, 'utf-8'));
    const currentStage = workflowDef.stages.find((s: any) => s.id === workflowInstance.currentStageId);
    
    res.json({
      active: true,
      isActive: workflowInstance.isActive,
      workflowId: workflowInstance.workflowId,
      workflowName: workflowDef.name,
      currentStageId: workflowInstance.currentStageId,
      currentStageName: currentStage?.name || 'Unknown',
      currentStageType: currentStage?.type || 'Unknown',
      stageOrder: currentStage?.order || 0,
      totalStages: workflowDef.stages.length,
      history: workflowInstance.history,
      metadata: workflowInstance.metadata,
      startedAt: workflowInstance.createdAt,
      updatedAt: workflowInstance.updatedAt,
      completedAt: workflowInstance.completedAt,
      status: workflowInstance.completedAt ? 'completed' : 'in_progress'
    });
  } catch (error) {
    console.error('Error getting workflow instance:', error);
    res.status(500).json({ error: 'Failed to get workflow instance' });
  }
});

// Start workflow for document
router.post('/workflow-instances/:documentId/start', authMiddleware, async (req, res) => {
  try {
    const { documentId } = req.params;
    const { workflowId } = req.body;
    const userId = (req as any).user?.userId || (req as any).user?.id || 'system';
    
    // Check if document exists
    const document = await prisma.document.findUnique({
      where: { id: documentId }
    });
    
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    // Check if there's already a workflow (active or inactive)
    const existingWorkflow = await prisma.jsonWorkflowInstance.findFirst({
      where: {
        documentId
      }
    });
    
    // If workflow exists and is active, error
    if (existingWorkflow && existingWorkflow.isActive) {
      return res.status(400).json({ error: 'Document already has an active workflow' });
    }
    
    // If workflow exists but is inactive (from reset), reactivate it
    if (existingWorkflow && !existingWorkflow.isActive) {
      const updatedWorkflow = await prisma.jsonWorkflowInstance.update({
        where: { id: existingWorkflow.id },
        data: {
          isActive: true,
          metadata: {
            ...(typeof existingWorkflow.metadata === 'object' && existingWorkflow.metadata !== null ? existingWorkflow.metadata : {}),
            lastAction: 'RESTARTED',
            lastActionBy: userId,
            lastActionAt: new Date().toISOString()
          }
        }
      });
      
      return res.json({
        success: true,
        workflowInstance: updatedWorkflow,
        message: 'Workflow restarted successfully'
      });
    }
    
    // Load workflow definition
    const workflowPath = path.join(__dirname, '../../workflows', `${workflowId}.json`);
    
    if (!fs.existsSync(workflowPath)) {
      return res.status(404).json({ error: 'Workflow definition not found' });
    }
    
    const workflowDef = JSON.parse(fs.readFileSync(workflowPath, 'utf-8'));
    const firstStage = workflowDef.stages.find((s: any) => s.order === 1);
    
    if (!firstStage) {
      return res.status(400).json({ error: 'Workflow has no starting stage' });
    }
    
    // Create workflow instance
    const workflowInstance = await prisma.jsonWorkflowInstance.create({
      data: {
        documentId,
        workflowId,
        currentStageId: firstStage.id,
        isActive: true,
        metadata: {
          workflowName: workflowDef.name,
          workflowVersion: workflowDef.version,
          startedBy: userId
        }
      }
    });
    
    // Create first history entry
    await prisma.jsonWorkflowHistory.create({
      data: {
        workflowInstanceId: workflowInstance.id,
        stageId: firstStage.id,
        stageName: firstStage.name,
        action: 'STARTED',
        performedBy: userId,
        metadata: {
          message: 'Workflow started'
        }
      }
    });
    
    res.json({
      success: true,
      workflowInstanceId: workflowInstance.id,
      currentStage: firstStage.name,
      message: 'Workflow started successfully'
    });
  } catch (error) {
    console.error('Error starting workflow:', error);
    res.status(500).json({ error: 'Failed to start workflow' });
  }
});

// Advance workflow to next stage
router.post('/workflow-instances/:documentId/advance', authMiddleware, async (req, res) => {
  try {
    const { documentId } = req.params;
    const { targetStageId, action, metadata } = req.body;
    const userId = (req as any).user?.userId || (req as any).user?.id || 'system';
    
    // Get active workflow instance
    const workflowInstance = await prisma.jsonWorkflowInstance.findFirst({
      where: {
        documentId,
        isActive: true
      }
    });
    
    if (!workflowInstance) {
      return res.status(404).json({ error: 'No active workflow found for this document' });
    }
    
    // Load workflow definition
    const workflowPath = path.join(__dirname, '../../workflows', `${workflowInstance.workflowId}.json`);
    
    if (!fs.existsSync(workflowPath)) {
      return res.status(404).json({ error: 'Workflow definition not found' });
    }
    
    const workflowDef = JSON.parse(fs.readFileSync(workflowPath, 'utf-8'));
    const currentStage = workflowDef.stages.find((s: any) => s.id === workflowInstance.currentStageId);
    const targetStage = workflowDef.stages.find((s: any) => s.id === targetStageId);
    
    if (!currentStage || !targetStage) {
      return res.status(400).json({ error: 'Invalid stage transition' });
    }
    
    // Check if transition is valid
    const validTransition = workflowDef.transitions.find((t: any) => 
      t.from === workflowInstance.currentStageId && t.to === targetStageId
    );
    
    if (!validTransition) {
      return res.status(400).json({ 
        error: 'Invalid transition',
        message: `Cannot transition from ${currentStage.name} to ${targetStage.name}`
      });
    }

    // Get user's role for permission checking
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const userRole = user.role?.name;
    
    // Check if user has permission to act on the current stage
    // Admin role can always override any stage
    const hasPermission = userRole === 'Admin' || currentStage.roles.includes(userRole);
    
    if (!hasPermission) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        message: `Role '${userRole}' cannot perform actions on stage '${currentStage.name}'. Required roles: ${currentStage.roles.join(', ')}`
      });
    }
    
    // Update workflow instance
    await prisma.jsonWorkflowInstance.update({
      where: { id: workflowInstance.id },
      data: {
        currentStageId: targetStageId,
        metadata: {
          ...(typeof workflowInstance.metadata === 'object' && workflowInstance.metadata !== null ? workflowInstance.metadata : {}),
          lastAction: action,
          lastActionBy: userId,
          lastActionAt: new Date().toISOString()
        }
      }
    });
    
    // Create history entry
    await prisma.jsonWorkflowHistory.create({
      data: {
        workflowInstanceId: workflowInstance.id,
        stageId: targetStageId,
        stageName: targetStage.name,
        action: action || validTransition.label,
        performedBy: userId,
        metadata: metadata || {}
      }
    });
    
    // Check if workflow is complete
    const isComplete = !workflowDef.transitions.find((t: any) => t.from === targetStageId);
    
    if (isComplete) {
      await prisma.jsonWorkflowInstance.update({
        where: { id: workflowInstance.id },
        data: {
          isActive: false,
          completedAt: new Date()
        }
      });
    }
    
    res.json({
      success: true,
      currentStage: targetStage.name,
      isComplete,
      message: `Workflow advanced to ${targetStage.name}`
    });
  } catch (error) {
    console.error('Error advancing workflow:', error);
    res.status(500).json({ error: 'Failed to advance workflow' });
  }
});

// Reset workflow to beginning
router.post('/workflow-instances/:documentId/reset', authMiddleware, async (req, res) => {
  try {
    const { documentId } = req.params;
    const userId = (req as any).user?.userId || (req as any).user?.id || 'system';
    
    // Get workflow instance (active or inactive)
    const workflowInstance = await prisma.jsonWorkflowInstance.findFirst({
      where: {
        documentId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    if (!workflowInstance) {
      return res.status(404).json({ error: 'No workflow found for this document' });
    }
    
    // If already inactive at the first stage, just return success
    if (!workflowInstance.isActive) {
      const workflowPath = path.join(__dirname, '../../workflows', `${workflowInstance.workflowId}.json`);
      const workflowDef = JSON.parse(fs.readFileSync(workflowPath, 'utf-8'));
      const firstStage = workflowDef.stages.find((s: any) => s.order === 1);
      
      if (workflowInstance.currentStageId === firstStage?.id) {
        return res.json({
          success: true,
          currentStage: firstStage.name,
          message: 'Workflow is already reset to beginning'
        });
      }
    }
    
    // Load workflow definition
    const workflowPath = path.join(__dirname, '../../workflows', `${workflowInstance.workflowId}.json`);
    
    if (!fs.existsSync(workflowPath)) {
      return res.status(404).json({ error: 'Workflow definition not found' });
    }
    
    const workflowDef = JSON.parse(fs.readFileSync(workflowPath, 'utf-8'));
    const firstStage = workflowDef.stages.find((s: any) => s.order === 1);
    
    if (!firstStage) {
      return res.status(400).json({ error: 'Workflow has no starting stage' });
    }
    
    // First, delete ALL existing workflows (active and inactive) for this document
    // to avoid unique constraint violations
    await prisma.jsonWorkflowHistory.deleteMany({
      where: {
        workflowInstance: {
          documentId: documentId
        }
      }
    });
    
    await prisma.jsonWorkflowInstance.deleteMany({
      where: { documentId }
    });
    
    // Create a fresh inactive workflow at the first stage
    const newWorkflowInstance = await prisma.jsonWorkflowInstance.create({
      data: {
        documentId,
        workflowId: workflowInstance.workflowId,
        currentStageId: firstStage.id,
        isActive: false, // DEACTIVATE workflow on reset - user must click Start again
        completedAt: null,
        metadata: {
          workflowName: workflowDef.name,
          workflowVersion: workflowDef.version,
          resetFrom: workflowInstance.currentStageId,
          resetBy: userId,
          resetAt: new Date().toISOString(),
          resetCount: ((workflowInstance.metadata as any)?.resetCount || 0) + 1
        }
      }
    });
    
    // Create history entry for reset
    await prisma.jsonWorkflowHistory.create({
      data: {
        workflowInstanceId: newWorkflowInstance.id,
        stageId: firstStage.id,
        stageName: firstStage.name,
        action: 'RESET_TO_START',
        performedBy: userId ? userId : 'system',
        metadata: {
          message: 'Workflow reset to beginning',
          previousStage: workflowInstance.currentStageId
        }
      }
    });
    
    res.json({
      success: true,
      currentStage: firstStage.name,
      message: 'Workflow reset to beginning successfully'
    });
  } catch (error) {
    console.error('Error resetting workflow:', error);
    res.status(500).json({ error: 'Failed to reset workflow' });
  }
});

export default router;