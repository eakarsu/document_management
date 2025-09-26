import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../../middleware/authenticateToken';

const prisma = new PrismaClient();

export class TaskController {
  async getUserTasks(req: AuthenticatedRequest, res: Response) {
    try {
      console.log('[/api/tasks] Request from user:', req.user?.id, req.user?.email);

      if (!req.user || !req.user.id) {
        console.error('[/api/tasks] No user in request');
        return res.status(401).json({ error: 'User not authenticated' });
      }

      console.log('[/api/tasks] Fetching tasks for user:', req.user.id);
      const tasks = await prisma.workflowTask.findMany({
        where: {
          assignedToId: req.user.id,
          status: 'PENDING'
        },
        include: {
          assignedTo: true,
          createdBy: true,
          workflow: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      console.log('[/api/tasks] Found', tasks.length, 'tasks for user');

      // Extract document IDs from tasks formData and get document details
      const tasksWithDocuments = await Promise.all(tasks.map(async (task) => {
        try {
          const formData = task.formData as any;
          if (formData?.documentId) {
            const document = await prisma.document.findUnique({
              where: { id: formData.documentId },
              select: {
                id: true,
                title: true,
                category: true,
                status: true
              }
            });
            return { ...task, document };
          }
          return task;
        } catch (taskError) {
          console.error('[/api/tasks] Error processing task:', task.id, taskError);
          return task;
        }
      }));

      console.log('[/api/tasks] Successfully returning', tasksWithDocuments.length, 'tasks');
      res.json(tasksWithDocuments);
    } catch (error: any) {
      console.error('[/api/tasks] Error fetching tasks:', error);
      console.error('[/api/tasks] Error stack:', (error as Error).stack);
      res.status(500).json({ error: 'Failed to fetch tasks', details: (error as Error).message });
    }
  }

  async getWorkflowTasks(req: AuthenticatedRequest, res: Response) {
    try {
      console.log('📋 Fetching workflow tasks for user:', req.user.email, 'Role:', req.user.role?.name);

      // First check if user is a coordinator
      const isCoordinator = req.user.role?.name === 'Coordinator';

      // Map stage IDs to coordinator assignments
      const coordinatorStages: { [key: string]: string[] } = {
        '2': ['coordinator1@airforce.mil'], // Stage 2: First Coordination
        '4': ['coordinator2@airforce.mil'], // Stage 4: Second Coordination
      };

      let tasks: any[] = [];

      if (isCoordinator) {
        // Find stages this coordinator is responsible for
        const coordinatorEmail = req.user.email;
        const responsibleStages = Object.entries(coordinatorStages)
          .filter(([_, emails]) => emails.includes(coordinatorEmail))
          .map(([stage, _]) => stage);

        console.log('Coordinator responsible for stages:', responsibleStages);

        if (responsibleStages.length > 0) {
          // Get all active workflow instances at coordinator's stages
          const workflowInstances = await prisma.jsonWorkflowInstance.findMany({
            where: {
              isActive: true,
              currentStageId: { in: responsibleStages }
            },
            include: {
              document: {
                include: {
                  createdBy: {
                    select: { firstName: true, lastName: true, email: true }
                  },
                  versions: {
                    orderBy: { versionNumber: "desc" as any },
                    take: 1
                  }
                }
              }
            }
          });

          console.log(`Found ${workflowInstances.length} documents at coordinator stages`);

          // Convert to tasks
          tasks = workflowInstances.map(wi => ({
            id: wi.document.id,
            title: `Distribute: ${wi.document.title}`,
            description: `Document needs distribution to sub-reviewers (Stage ${wi.currentStageId})`,
            status: 'PENDING_DISTRIBUTION',
            priority: 'HIGH',
            stepNumber: parseInt(wi.currentStageId),
            createdBy: wi.document.createdBy,
            document: {
              id: wi.document.id,
              title: wi.document.title,
              status: wi.document.status,
              currentVersion: wi.document.currentVersion
            },
            createdAt: wi.createdAt.toISOString(),
            formData: {
              workflowInstanceId: wi.id,
              documentId: wi.document.id,
              versionId: wi.document.versions[0]?.id,
              stageId: wi.currentStageId,
              action: 'DISTRIBUTE'
            }
          }));
        }
      } else {
        // Original logic for non-coordinator users - show documents in review
        const documentsInReview = await prisma.document.findMany({
          where: {
            organizationId: req.user.organizationId,
            status: 'IN_REVIEW',
            NOT: {
              createdById: req.user.id
            }
          },
          include: {
            createdBy: {
              select: { firstName: true, lastName: true, email: true }
            },
            versions: {
              orderBy: { versionNumber: "desc" as any },
              take: 1
            }
          }
        });

        tasks = documentsInReview.map((doc: any) => ({
          id: doc.id,
          title: doc.title,
          description: doc.description,
          status: doc.status,
          createdBy: doc.createdBy,
          updatedAt: doc.updatedAt,
          currentVersion: doc.currentVersion,
          latestVersion: doc.versions[0]?.versionNumber || 1,
          taskType: 'APPROVAL_REQUIRED'
        }));
      }

      console.log(`Returning ${tasks.length} tasks to user`);

      res.json({
        success: true,
        tasks,
        totalTasks: tasks.length
      });

    } catch (error: any) {
      console.error('Workflow tasks error:', error);
      res.status(500).json({
        error: 'Failed to fetch workflow tasks',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export const taskController = new TaskController();