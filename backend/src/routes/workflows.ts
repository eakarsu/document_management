import express from 'express';
import fs from 'fs';
import path from 'path';
import { authMiddleware } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import { workflowManager } from '../services/WorkflowManager';

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

// Start workflow for document - using centralized WorkflowManager
router.post('/workflow-instances/:documentId/start', authMiddleware, async (req, res) => {
  try {
    const { documentId } = req.params;
    const { workflowId } = req.body;
    const userId = (req as any).user?.userId || (req as any).user?.id || 'system';

    console.log(`[WORKFLOW START] Document: ${documentId}, Workflow: ${workflowId}, User: ${userId}`);

    // Check if document exists
    const document = await prisma.document.findUnique({
      where: { id: documentId }
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // PERMANENT FIX: Check for ANY active workflow first
    const activeWorkflow = await prisma.jsonWorkflowInstance.findFirst({
      where: {
        documentId,
        isActive: true
      }
    });

    if (activeWorkflow) {
      return res.status(400).json({
        error: 'Document already has an active workflow',
        currentStage: activeWorkflow.currentStageId,
        workflowId: activeWorkflow.workflowId
      });
    }

    // Create new workflow instance
    const existingWorkflow = await workflowManager.getOrCreateWorkflow(
      documentId,
      workflowId,
      userId
    );

    // Start the workflow
    const startedWorkflow = await workflowManager.startWorkflow(documentId, userId);

    // Load workflow definition for response details
    const workflowPath = path.join(__dirname, '../../workflows', `${workflowId}.json`);

    if (!fs.existsSync(workflowPath)) {
      return res.status(404).json({ error: 'Workflow definition not found' });
    }

    const workflowDef = JSON.parse(fs.readFileSync(workflowPath, 'utf-8'));
    const currentStage = workflowDef.stages.find((s: any) => s.id === startedWorkflow.currentStageId);

    // Create history entry for started workflow
    await prisma.jsonWorkflowHistory.create({
      data: {
        workflowInstanceId: startedWorkflow.id,
        stageId: startedWorkflow.currentStageId,
        stageName: currentStage?.name || 'Initial',
        action: 'STARTED',
        performedBy: userId,
        metadata: {
          message: 'Workflow started'
        }
      }
    });

    res.json({
      success: true,
      workflowInstanceId: startedWorkflow.id,
      currentStage: currentStage?.name || 'Initial',
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
    let { targetStageId, action, metadata } = req.body;
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

    if (!currentStage) {
      return res.status(400).json({ error: 'Invalid current stage' });
    }

    // Debug logging for Stage 9 Leadership actions
    if (workflowInstance.currentStageId === '9') {
      console.log('[WORKFLOW DEBUG] Stage 9 Leadership action:', {
        action,
        targetStageId,
        metadata,
        currentStageId: workflowInstance.currentStageId
      });
    }

    // Check if this is a workflow completion action
    // Only treat as completion if explicitly marked OR if it's the final stage (11) with a PUBLISH action
    // IMPORTANT: Stage 9 (Leadership) should NEVER complete - it must transition to Stage 10 (PCM)
    // IMPORTANT: Stage 10 (PCM) should NEVER complete - it must transition to Stage 11 (AFDPO)
    // IMPORTANT: Stage 11 (AFDPO) should only complete when "Publish Document" action is taken
    const isCompletionAction = metadata?.completeWorkflow === true ||
                              (workflowInstance.currentStageId === '11' && action === 'Publish Document' && !targetStageId);

    // Special handling for Leadership Stage (id: 9) - if no targetStageId provided, default to Stage 10 (PCM)
    // Note: Stage 9 in workflow definition is "OPR Leadership Final Review & Signature"
    if (workflowInstance.currentStageId === '9' && !targetStageId && action === 'Sign and Approve') {
      console.log('[WORKFLOW FIX] Leadership Stage (9) Sign and Approve missing targetStageId, setting to 10 (PCM)');
      targetStageId = '10';
    }

    // Initialize variables that might be used later
    let targetStage: any = null;
    let validTransition: any = null;

    if (isCompletionAction) {
      console.log('[WORKFLOW] Processing completion action:', { action, metadata });
      // Skip transition validation for completion actions
    } else {
      targetStage = workflowDef.stages.find((s: any) => s.id === targetStageId);

      if (!targetStage) {
        return res.status(400).json({ error: 'Invalid target stage' });
      }

      // Check if transition is valid
      validTransition = workflowDef.transitions.find((t: any) =>
        t.from === workflowInstance.currentStageId && t.to === targetStageId
      );

      if (!validTransition) {
        return res.status(400).json({
          error: 'Invalid transition',
          message: `Cannot transition from ${currentStage.name} to ${targetStage.name}`
        });
      }
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

    // Debug logging
    console.log('[WORKFLOW ADVANCE] Permission check:', {
      userId,
      userRole,
      currentStageId: currentStage.id,
      currentStageName: currentStage.name,
      stageRoles: currentStage.roles,
      stageAssignedRole: currentStage.assignedRole,
      targetStageId,
      targetStageName: targetStage?.name || (isCompletionAction ? 'Completion Action' : 'N/A'),
      isCompletionAction
    });

    // Map database roles to workflow roles
    const roleMapping: any = {
      'Action Officer': 'ACTION_OFFICER',
      'OPR': 'ACTION_OFFICER',  // OPR can act as Action Officer
      'OPR LEADERSHIP': 'LEADERSHIP', // OPR Leadership maps to LEADERSHIP
      'PCM': 'PCM',
      'Coordinator': 'COORDINATOR',
      'Admin': 'Admin',
      'LEADERSHIP': 'LEADERSHIP',
      'SUB_REVIEWER': 'SUB_REVIEWER',
      'LEGAL': 'LEGAL',
      'AFDPO': 'AFDPO'
    };

    const mappedRole = roleMapping[userRole] || userRole;

    // Check if user has permission to act on the current stage
    // Admin role can always override any stage
    // LEADERSHIP role can advance workflows through key transition points and act at stage 6
    // OPR role can act on ACTION_OFFICER stages (feedback incorporation)
    // Support both 'roles' array and 'assignedRole' string (hierarchical workflow uses assignedRole)
    const hasPermission = userRole === 'Admin' ||
                          (currentStage.roles && currentStage.roles.includes(mappedRole)) ||
                          (currentStage.assignedRole && currentStage.assignedRole === mappedRole) ||
                          (userRole === 'OPR' && currentStage.assignedRole === 'ACTION_OFFICER') || // OPR can act as Action Officer
                          (userRole === 'OPR' && ['1', '4', '6', '8'].includes(currentStage.id)) || // OPR stages
                          (userRole === 'OPR LEADERSHIP' && ['1', '4', '6', '8', '9'].includes(currentStage.id)) || // OPR Leadership can act at multiple stages
                          (userRole === 'LEADERSHIP' && ['1', '4', '6', '8', '9'].includes(currentStage.id)) || // LEADERSHIP at key stages
                          (userRole === 'LEADERSHIP' && currentStage.id === '3.5' && targetStageId === '4') ||
                          (userRole === 'LEADERSHIP' && currentStage.id === '4' && targetStageId === '5') ||
                          (userRole === 'LEADERSHIP' && currentStage.id === '5.5' && targetStageId === '6') ||
                          (userRole === 'LEADERSHIP' && currentStage.id === '6' && targetStageId === '7'); // LEADERSHIP can submit to Legal from stage 6
    
    if (!hasPermission) {
      const requiredRoles = currentStage.roles
        ? currentStage.roles.join(', ')
        : currentStage.assignedRole || 'Unknown';

      return res.status(403).json({
        error: 'Insufficient permissions',
        message: `Role '${userRole}' cannot perform actions on stage '${currentStage.name}'. Required roles: ${requiredRoles}`
      });
    }
    
    // Update workflow instance
    if (isCompletionAction) {
      // Complete the workflow
      await prisma.jsonWorkflowInstance.update({
        where: { id: workflowInstance.id },
        data: {
          isActive: false,
          completedAt: new Date(),
          metadata: {
            ...(typeof workflowInstance.metadata === 'object' && workflowInstance.metadata !== null ? workflowInstance.metadata : {}),
            lastAction: action,
            lastActionBy: userId,
            lastActionAt: new Date().toISOString(),
            completionAction: action,
            completedBy: userId
          }
        }
      });

      // Update document status
      await prisma.document.update({
        where: { id: documentId },
        data: {
          status: metadata?.archive ? 'ARCHIVED' : 'PUBLISHED'
        }
      });

      console.log(`[WORKFLOW] Completed workflow for document ${documentId} with action: ${action}`);
    } else {
      // Regular stage transition
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
    }
    
    // Create history entry
    await prisma.jsonWorkflowHistory.create({
      data: {
        workflowInstanceId: workflowInstance.id,
        stageId: targetStageId || workflowInstance.currentStageId,
        stageName: targetStage?.name || (isCompletionAction ? 'Workflow Completed' : currentStage.name),
        action: action || validTransition?.label || action,
        performedBy: userId,
        metadata: metadata || {}
      }
    });

    // Grant document access to the new stage's assigned role (skip for completion actions)
    if (!isCompletionAction && targetStage && targetStage.assignedRole) {
      console.log(`🔐 Granting document access for stage ${targetStageId} to role: ${targetStage.assignedRole}`);

      // Find users with the target role
      const roleName = targetStage.assignedRole === 'LEGAL' ? 'Legal Reviewer' :
                      targetStage.assignedRole === 'ACTION_OFFICER' ? 'Action Officer' :
                      targetStage.assignedRole === 'PCM' ? 'PCM' :
                      targetStage.assignedRole === 'COORDINATOR' ? 'Coordinator' :
                      targetStage.assignedRole === 'LEADERSHIP' ? 'OPR Leadership' :
                      targetStage.assignedRole === 'AFDPO' ? 'AFDPO Publisher' :
                      targetStage.assignedRole;

      const targetRole = await prisma.role.findFirst({
        where: { name: roleName }
      });

      if (targetRole) {
        // Find all users with this role
        const usersWithRole = await prisma.user.findMany({
          where: { roleId: targetRole.id },
          select: { id: true, email: true }
        });

        // Grant document access to each user with the target role
        for (const user of usersWithRole) {
          try {
            // Check if permission already exists
            const existingPermission = await prisma.documentPermission.findFirst({
              where: {
                documentId: documentId,
                userId: user.id
              }
            });

            if (!existingPermission) {
              await prisma.documentPermission.create({
                data: {
                  documentId: documentId,
                  userId: user.id,
                  permission: 'WRITE',
                  grantedAt: new Date()
                }
              });
              console.log(`✅ Granted document access to ${user.email} for stage ${targetStageId}`);
            }

            // Create a workflow task for the user
            // Store documentId in formData since WorkflowTask doesn't have documentId field
            await prisma.workflowTask.create({
              data: {
                workflowId: workflowInstance.id, // Use workflow instance ID
                assignedToId: user.id,
                createdById: userId,
                title: `Review Document - ${targetStage.name}`,
                description: `${targetStage.description || 'Please review the document'}`,
                status: 'PENDING',
                priority: targetStageId === '7' ? 'HIGH' : 'MEDIUM', // Legal review is high priority
                stepNumber: parseInt(targetStage.order || targetStageId),
                dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours from now
                formData: {
                  documentId: documentId, // Store documentId in formData
                  stage: targetStageId,
                  stageName: targetStage.name,
                  assignedRole: targetStage.assignedRole
                }
              }
            });
            console.log(`📋 Created workflow task for ${user.email} at stage ${targetStageId}`);
          } catch (err) {
            console.error(`Failed to grant permission to ${user.email}:`, err);
          }
        }
      }
    }

    // Check if workflow is complete
    // IMPORTANT: Don't mark as complete just because there are no transitions
    // Stage 10 (AFDPO) has no outgoing transitions but should remain active until "Publish Document" is clicked
    const isComplete = false; // Never auto-complete based on transitions - only complete via explicit action
    
    res.json({
      success: true,
      currentStage: targetStage?.name || (isCompletionAction ? 'Workflow Completed' : currentStage.name),
      isComplete,
      message: `Workflow advanced to ${targetStage?.name || 'completion'}`
    });
  } catch (error) {
    console.error('Error advancing workflow:', error);
    res.status(500).json({ error: 'Failed to advance workflow' });
  }
});

// Reset workflow to beginning - using centralized WorkflowManager
router.post('/workflow-instances/:documentId/reset', authMiddleware, async (req, res) => {
  try {
    const { documentId } = req.params;
    const userId = (req as any).user?.userId || (req as any).user?.id || 'system';

    // Use the centralized WorkflowManager for consistent handling
    const resetWorkflow = await workflowManager.resetWorkflow(documentId, userId);

    // Handle case where there was no workflow to reset
    if (resetWorkflow.workflowId === null) {
      return res.json({
        success: true,
        currentStage: null,
        message: 'No workflow to reset - document ready for new workflow'
      });
    }

    // Get workflow definition for the first stage name
    const workflowPath = path.join(__dirname, '../../workflows', `${resetWorkflow.workflowId}.json`);
    const workflowDef = JSON.parse(fs.readFileSync(workflowPath, 'utf-8'));
    const firstStage = workflowDef.stages.find((s: any) => s.id === resetWorkflow.currentStageId);

    res.json({
      success: true,
      currentStage: firstStage?.name || 'Initial',
      message: 'Workflow reset to beginning successfully'
    });
  } catch (error) {
    console.error('Error resetting workflow:', error);
    res.status(500).json({ error: 'Failed to reset workflow' });
  }
});

// System-wide workflow cleanup (Admin only)
router.post('/workflow-instances/cleanup', authMiddleware, async (req, res) => {
  try {
    const userRole = (req as any).user?.role || (req as any).user?.Role?.name;

    // Only allow admins to run cleanup
    if (userRole !== 'Admin') {
      return res.status(403).json({ error: 'Only administrators can run cleanup' });
    }

    const result = await workflowManager.cleanupAllOrphanedWorkflows();

    res.json({
      success: true,
      message: 'Workflow cleanup completed',
      ...result
    });
  } catch (error) {
    console.error('Error during workflow cleanup:', error);
    res.status(500).json({ error: 'Failed to run workflow cleanup' });
  }
});

// Get workflow status for a document
router.get('/workflow-instances/:documentId/status', authMiddleware, async (req, res) => {
  try {
    const { documentId } = req.params;

    const status = await workflowManager.getWorkflowStatus(documentId);

    if (!status) {
      return res.status(404).json({ error: 'No workflow found for this document' });
    }

    res.json(status);
  } catch (error) {
    console.error('Error getting workflow status:', error);
    res.status(500).json({ error: 'Failed to get workflow status' });
  }
});

// Document distribution endpoint for Stage 3
router.post('/workflows/documents/:documentId/distribute', authMiddleware, async (req, res) => {
  try {
    const { documentId } = req.params;
    const { reviewerEmails, workflowInstanceId, stageId } = req.body;

    if (!reviewerEmails || !Array.isArray(reviewerEmails) || reviewerEmails.length === 0) {
      return res.status(400).json({ error: 'At least one reviewer email is required' });
    }

    // Get the document and workflow instance
    const document = await prisma.document.findUnique({
      where: { id: documentId }
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Get the workflow instance
    const workflowInstance = await prisma.jsonWorkflowInstance.findFirst({
      where: {
        documentId: documentId,
        isActive: true
      }
    });

    if (!workflowInstance) {
      return res.status(404).json({ error: 'Active workflow not found' });
    }

    // Verify user is authorized (coordinator or admin)
    const userRole = (req as any).user?.role?.name;
    if (userRole !== 'Coordinator' && userRole !== 'Admin') {
      return res.status(403).json({ error: 'Only coordinators can distribute documents' });
    }

    // Verify we're in Stage 3 or Stage 5 (both are distribution phases)
    if (workflowInstance.currentStageId !== '3' && workflowInstance.currentStageId !== '5') {
      return res.status(400).json({ error: 'Distribution is only allowed in Stage 3 or Stage 5' });
    }

    // Create workflow tasks for each reviewer
    const tasks = [];
    for (const email of reviewerEmails) {
      // Find or create user for the reviewer email
      let reviewerUser = await prisma.user.findUnique({
        where: { email }
      });

      if (!reviewerUser) {
        // PERMANENT FIX: Create a proper reviewer user with correct role and password
        const emailParts = email.split('@')[0].split('.');
        const firstName = emailParts[0]?.charAt(0).toUpperCase() + emailParts[0]?.slice(1) || 'Reviewer';
        const lastName = emailParts[1]?.charAt(0).toUpperCase() + emailParts[1]?.slice(1) || 'User';
        const organization = email.includes('ops') ? 'Operations' :
                           email.includes('log') ? 'Logistics' :
                           email.includes('fin') ? 'Finance' :
                           email.includes('per') ? 'Personnel' : 'Unknown';

        // Find organization by name
        let orgRecord = await prisma.organization.findFirst({
          where: { name: organization }
        });

        if (!orgRecord) {
          orgRecord = await prisma.organization.create({
            data: {
              name: organization,
              domain: `${organization.toLowerCase()}.airforce.mil`
            }
          });
        }

        // PERMANENT FIX: Use SUB_REVIEWER role which matches the workflow definition
        let reviewerRole = await prisma.role.findFirst({ where: { name: 'SUB_REVIEWER' } });
        if (!reviewerRole) {
          // Create SUB_REVIEWER role if it doesn't exist
          reviewerRole = await prisma.role.create({
            data: {
              name: 'SUB_REVIEWER',
              description: 'Sub-reviewer for distributed document reviews',
              organizationId: orgRecord.id
            }
          });
        }

        // Create reviewer with proper password
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash('testpass123', 10);

        reviewerUser = await prisma.user.create({
          data: {
            email,
            firstName,
            lastName,
            passwordHash: hashedPassword, // Use passwordHash field
            organizationId: orgRecord.id,
            roleId: reviewerRole.id
          }
        });

        console.log(`Created new reviewer user: ${email}`);
      }

      // PERMANENT FIX: Always grant document permission when distributing
      const existingPermission = await prisma.documentPermission.findFirst({
        where: {
          documentId: documentId,
          userId: reviewerUser.id
        }
      });

      if (!existingPermission) {
        await prisma.documentPermission.create({
          data: {
            documentId: documentId,
            userId: reviewerUser.id,
            permission: 'READ'
          }
        });
        console.log(`Granted READ permission for ${email} on document ${documentId}`);
      }

      // Create a workflow task for this reviewer
      // Using the default workflow ID from the database
      const task = await prisma.workflowTask.create({
        data: {
          workflowId: 'cmf2pmgl8000s20lao29cydiq', // Default workflow ID from database
          assignedToId: reviewerUser.id,
          createdById: (req as any).user?.id || reviewerUser.id,
          stepNumber: 3,
          status: 'PENDING',
          title: `Review Document: ${document.title}`,
          description: `Please review and provide feedback on: ${document.title}`,
          formData: {
            workflowInstanceId: workflowInstance.id,
            stageId: stageId,
            documentId: documentId,
            jsonWorkflowId: workflowInstance.workflowId || 'hierarchical-distributed-workflow',
            assignedBy: (req as any).user?.id,
            distributedAt: new Date().toISOString()
          }
        }
      });

      tasks.push(task);
    }

    // Update workflow instance metadata to track distribution
    const existingMetadata = (workflowInstance.metadata as any) || {};
    await prisma.jsonWorkflowInstance.update({
      where: { id: workflowInstance.id },
      data: {
        metadata: Object.assign(
          existingMetadata,
          {
            distributedReviewers: reviewerEmails,
            distributedAt: new Date().toISOString(),
            distributedBy: (req as any).user?.id,
            pendingReviewTasks: tasks.map(t => t.id)
          }
        )
      }
    });

    // After successful distribution, advance workflow to next review collection phase
    // Stage 3 -> 3.5 (First Review Collection Phase)
    // Stage 5 -> 5.5 (Second Review Collection Phase)
    const nextStageId = workflowInstance.currentStageId === '3' ? '3.5' : '5.5';
    const nextStageName = workflowInstance.currentStageId === '3' ? 'Review Collection Phase' : 'Second Review Collection Phase';

    await prisma.jsonWorkflowInstance.update({
      where: { id: workflowInstance.id },
      data: {
        currentStageId: nextStageId,
        updatedAt: new Date()
      }
    });

    console.log(`🔄 WORKFLOW: Document ${documentId} distributed to ${reviewerEmails.length} reviewers by ${(req as any).user?.email}`);
    console.log(`🔄 WORKFLOW: Advanced to Stage ${nextStageId} (${nextStageName})`);

    res.json({
      success: true,
      message: `Document successfully distributed to ${reviewerEmails.length} reviewer(s)`,
      distributedTo: reviewerEmails,
      tasksCreated: tasks.length,
      nextStage: nextStageId,
      stageName: nextStageName
    });

  } catch (error) {
    console.error('Error distributing document:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    res.status(500).json({
      error: 'Failed to distribute document',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Reviewer submission endpoint for Stage 3.5
router.post('/workflows/documents/:documentId/submit-review', authMiddleware, async (req, res) => {
  try {
    const { documentId } = req.params;
    const { workflowInstanceId, feedback, approved } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get the workflow instance
    const workflowInstance = await prisma.jsonWorkflowInstance.findFirst({
      where: {
        documentId: documentId,
        isActive: true
      }
    });

    if (!workflowInstance) {
      return res.status(404).json({ error: 'Active workflow not found' });
    }

    // Verify we're in Stage 3.5 (Review Collection Phase)
    if (workflowInstance.currentStageId !== '3.5') {
      return res.status(400).json({ error: 'Review submission only allowed in Stage 3.5' });
    }

    // Find the reviewer's task
    const task = await prisma.workflowTask.findFirst({
      where: {
        assignedToId: userId,
        status: 'PENDING'
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'No pending review task found for this user' });
    }

    // Update the task to completed
    await prisma.workflowTask.update({
      where: { id: task.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        formData: Object.assign(
          task.formData || {},
          {
            reviewSubmitted: true,
            feedback: feedback,
            approved: approved,
            submittedAt: new Date().toISOString()
          }
        )
      }
    });

    // Check if all review tasks are completed
    const existingMetadata = (workflowInstance.metadata as any) || {};
    const pendingTaskIds = existingMetadata.pendingReviewTasks || [];

    const remainingTasks = await prisma.workflowTask.count({
      where: {
        id: { in: pendingTaskIds },
        status: 'PENDING'
      }
    });

    console.log(`🔄 WORKFLOW: Reviewer ${(req as any).user?.email} submitted review for document ${documentId}`);
    console.log(`🔄 WORKFLOW: Remaining pending reviews: ${remainingTasks}`);

    // If all reviews are complete, advance to Stage 4
    if (remainingTasks === 0) {
      await prisma.jsonWorkflowInstance.update({
        where: { id: workflowInstance.id },
        data: {
          currentStageId: '4',
          updatedAt: new Date(),
          metadata: {
            ...existingMetadata,
            allReviewsCompleted: true,
            reviewsCompletedAt: new Date().toISOString()
          }
        }
      });

      console.log(`🔄 WORKFLOW: All reviews completed - Advanced to Stage 4 (OPR Feedback Incorporation)`);

      res.json({
        success: true,
        message: 'Review submitted successfully. All reviews are now complete.',
        allReviewsComplete: true,
        nextStage: '4',
        stageName: 'OPR Feedback Incorporation'
      });
    } else {
      res.json({
        success: true,
        message: 'Review submitted successfully. Waiting for other reviewers.',
        allReviewsComplete: false,
        remainingReviews: remainingTasks
      });
    }

  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

export default router;