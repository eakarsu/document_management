import { PrismaClient, PublishingWorkflow, DocumentApproval, PublishingStatus, ApprovalStatus, ApprovalDecision, NotificationType } from '@prisma/client';

// Types that don't exist in schema anymore - defining locally
type PublishingUrgency = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
type DestinationType = 'EMAIL' | 'PORTAL' | 'API' | 'FTP' | 'WEBHOOK';
import { StorageService } from './StorageService';
import { DocumentService } from './DocumentService';
import winston from 'winston';
import cron from 'node-cron';

interface CreatePublishingWorkflowInput {
  name: string;
  description?: string;
  workflowType: string;
  autoApprove?: boolean;
  requiredApprovers?: number;
  allowParallel?: boolean;
  timeoutHours?: number;
  templateId?: string;
  approvalSteps: {
    stepNumber: number;
    stepName: string;
    description?: string;
    isRequired: boolean;
    timeoutHours: number;
    requiredRole?: string;
    minApprovals: number;
    allowDelegation: boolean;
    requiredUsers: string[];
  }[];
}

interface SubmitForPublishingInput {
  documentId: string;
  workflowId: string;
  scheduledPublishAt?: Date;
  expiresAt?: Date;
  publishingNotes?: string;
  urgencyLevel: PublishingUrgency;
  isEmergencyPublish?: boolean;
  destinations: {
    destinationType: DestinationType;
    destinationName: string;
    destinationConfig: Record<string, any>;
  }[];
}

interface ApprovalInput {
  publishingId: string;
  stepId: string;
  decision: ApprovalDecision;
  comments?: string;
  conditions?: string;
}

export class PublishingService {
  private prisma: PrismaClient;
  private storageService: StorageService;
  private documentService: DocumentService;
  private logger: winston.Logger;

  constructor() {
    this.prisma = new PrismaClient();
    this.storageService = new StorageService();
    this.documentService = new DocumentService();
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [new winston.transports.Console()]
    });

    // Initialize scheduled tasks
    this.initializeScheduledTasks();
  }

  /**
   * Create a new publishing workflow
   */
  async createPublishingWorkflow(
    input: CreatePublishingWorkflowInput,
    organizationId: string,
    userId: string
  ): Promise<PublishingWorkflow> {
    try {
      this.logger.info('Creating publishing workflow', {
        name: input.name,
        workflowType: input.workflowType,
        organizationId
      });

      const workflow = await this.prisma.publishingWorkflow.create({
        data: {
          name: input.name,
          description: input.description,
          workflowType: input.workflowType as any,
          autoApprove: input.autoApprove || false,
          requiredApprovers: input.requiredApprovers || 1,
          allowParallel: input.allowParallel || false,
          timeoutHours: input.timeoutHours || 72,
          templateId: input.templateId,
          organizationId,
          approvalSteps: {
            create: input.approvalSteps.map(step => ({
              stepNumber: step.stepNumber,
              stepName: step.stepName,
              description: step.description,
              isRequired: step.isRequired,
              timeoutHours: step.timeoutHours,
              requiredRole: step.requiredRole || '',
              minApprovals: step.minApprovals,
              allowDelegation: step.allowDelegation,
              requiredUsers: step.requiredUsers ? {
                create: step.requiredUsers.map(userId => ({
                  userId,
                  canApprove: true,
                  canReject: true,
                  canDelegate: step.allowDelegation
                }))
              } : undefined
            }))
          }
        },
        include: {
          approvalSteps: {
            include: {
              requiredUsers: true
            }
          }
        }
      });

      this.logger.info('Publishing workflow created successfully', {
        workflowId: workflow.id,
        name: workflow.name
      });

      return workflow;

    } catch (error) {
      this.logger.error('Failed to create publishing workflow:', error);
      throw error;
    }
  }

  /**
   * Submit document for publishing approval
   */
  async submitForPublishing(
    input: SubmitForPublishingInput,
    userId: string,
    organizationId: string
  ): Promise<any> {
    try {
      this.logger.info('Submitting document for publishing', {
        documentId: input.documentId,
        workflowId: input.workflowId,
        urgencyLevel: input.urgencyLevel
      });

      // Get workflow and validate
      const workflow = await this.prisma.publishingWorkflow.findFirst({
        where: {
          id: input.workflowId,
          organizationId,
          isActive: true
        },
        include: {
          approvalSteps: {
            include: {
              requiredUsers: true
            },
            orderBy: {
              stepNumber: 'asc'
            }
          }
        }
      });

      if (!workflow) {
        throw new Error('Publishing workflow not found or inactive');
      }

      // Validate document exists and is in the same organization
      const document = await this.prisma.document.findFirst({
        where: {
          id: input.documentId,
          organizationId
        },
        select: {
          id: true,
          title: true,
          status: true,
          organizationId: true,
          createdById: true
        }
      });
      
      if (!document) {
        throw new Error('Document not found');
      }

      // Create publishing record
      const publishing = await this.prisma.document_publishings.create({
        data: {
          id: `pub_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
          documentId: input.documentId,
          workflowId: input.workflowId,
          status: workflow.autoApprove ? PublishingStatus.APPROVED : PublishingStatus.PENDING_APPROVAL,
          currentStepNumber: 1,
          scheduledPublishDate: input.scheduledPublishAt,
          submissionNotes: input.publishingNotes,
          submittedById: userId,
          updatedAt: new Date()
        },
        include: {
          documents: true
        }
      });

      // If auto-approve, publish immediately
      if (workflow.autoApprove) {
        await this.publishDocument(publishing.id, userId, organizationId);
      } else {
        // Create approval requests for first step
        await this.createApprovalRequests(publishing.id, workflow.approvalSteps[0]);
      }

      this.logger.info('Document submitted for publishing successfully', {
        publishingId: publishing.id,
        documentId: input.documentId,
        autoApproved: workflow.autoApprove
      });

      return publishing;

    } catch (error) {
      this.logger.error('Failed to submit document for publishing:', error);
      throw error;
    }
  }

  /**
   * Process approval/rejection
   */
  async processApproval(
    input: ApprovalInput,
    approverId: string,
    organizationId: string
  ): Promise<DocumentApproval> {
    try {
      this.logger.info('Processing approval', {
        publishingId: input.publishingId,
        stepId: input.stepId,
        decision: input.decision,
        approverId
      });

      // Get publishing record with workflow
      const publishing = await this.prisma.document_publishings.findFirst({
        where: {
          id: input.publishingId,
          documents: {
            organizationId
          }
        },
        include: {
          documents: true,
          publishing_workflows: {
            include: {
              approvalSteps: {
                include: {
                  requiredUsers: true
                },
                orderBy: {
                  stepNumber: 'asc'
                }
              }
            }
          },
          approvals: true
        }
      });

      if (!publishing) {
        throw new Error('Publishing record not found');
      }

      // Find the approval step
      const approvalStep = publishing.publishing_workflows.approvalSteps.find(step => step.id === input.stepId);
      if (!approvalStep) {
        throw new Error('Approval step not found');
      }

      // Validate approver has permission
      const hasPermission = approvalStep.requiredUsers.some(user => user.userId === approverId);
      if (!hasPermission) {
        throw new Error('User not authorized to approve this step');
      }

      // Create or update approval record
      const approval = await this.prisma.documentApproval.upsert({
        where: {
          publishingId_stepId_approverId: {
            publishingId: input.publishingId,
            stepId: input.stepId,
            approverId
          }
        },
        update: {
          status: ApprovalStatus.APPROVED,
          decision: input.decision,
          comments: input.comments,
          respondedAt: new Date()
        },
        create: {
          publishingId: input.publishingId,
          stepId: input.stepId,
          approverId,
          status: input.decision === ApprovalDecision.APPROVE ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED,
          decision: input.decision,
          comments: input.comments,
          respondedAt: new Date(),
          dueDate: new Date(Date.now() + (approvalStep.timeoutHours || 72) * 60 * 60 * 1000)
        }
      });

      // Send notification
      await this.sendApprovalNotification(publishing, approval, approvalStep);

      // Check if step is complete and advance workflow
      await this.checkStepCompletion(publishing.id, approvalStep);

      this.logger.info('Approval processed successfully', {
        approvalId: approval.id,
        publishingId: input.publishingId,
        decision: input.decision
      });

      return approval;

    } catch (error) {
      this.logger.error('Failed to process approval:', error);
      throw error;
    }
  }

  /**
   * Publish document to all destinations
   */
  async publishDocument(
    publishingId: string,
    userId: string,
    organizationId: string
  ): Promise<boolean> {
    try {
      this.logger.info('Publishing document', { publishingId, userId });

      const publishing = await this.prisma.document_publishings.findFirst({
        where: {
          id: publishingId,
          documents: {
            organizationId
          }
        },
        include: {
          documents: true,
          publishing_workflows: true
        }
      });

      if (!publishing) {
        throw new Error('Publishing record not found');
      }

      // Update document status to PUBLISHED
      await this.prisma.document.update({
        where: { id: publishing.documentId },
        data: {
          status: 'PUBLISHED',
          updatedAt: new Date()
        }
      });

      // Update publishing status
      await this.prisma.document_publishings.update({
        where: { id: publishingId },
        data: {
          status: PublishingStatus.PUBLISHED,
          actualPublishDate: new Date(),
          publishedById: userId
        }
      });

      // Publishing destinations would be handled here if they exist in schema
      // Currently not implemented in the schema

      // Send publication notifications
      await this.sendPublicationNotifications(publishing);

      this.logger.info('Document published successfully', {
        publishingId,
        documentId: publishing.documentId,
        destinationCount: 0 // destinations not implemented in schema
      });

      return true;

    } catch (error) {
      this.logger.error('Failed to publish document:', error);
      
      // Update status to failed
      await this.prisma.document_publishings.update({
        where: { id: publishingId },
        data: {
          status: PublishingStatus.REJECTED
        }
      });

      throw error;
    }
  }

  /**
   * Get publishing dashboard data
   */
  async getPublishingDashboard(
    organizationId: string,
    userId: string
  ): Promise<{
    pendingApprovals: number;
    scheduledPublications: number;
    recentPublications: any[];
    myApprovals: DocumentApproval[];
  }> {
    try {
      const [
        pendingApprovals,
        scheduledPublications,
        recentPublications,
        myApprovals
      ] = await Promise.all([
        // Count pending approvals
        this.prisma.document_publishings.count({
          where: {
            documents: { organizationId },
            status: PublishingStatus.PENDING_APPROVAL
          }
        }),

        // Count scheduled publications
        this.prisma.document_publishings.count({
          where: {
            documents: { organizationId },
            status: PublishingStatus.APPROVED,
            scheduledPublishDate: {
              gte: new Date()
            }
          }
        }),

        // Recent publications
        this.prisma.document_publishings.findMany({
          where: {
            documents: { organizationId },
            status: PublishingStatus.PUBLISHED
          },
          include: {
            documents: {
              select: {
                id: true,
                title: true,
                fileName: true
              }
            },
            users_document_publishings_publishedByIdTousers: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: {
            actualPublishDate: 'desc'
          },
          take: 10
        }),

        // My pending approvals
        this.prisma.documentApproval.findMany({
          where: {
            approverId: userId,
            status: ApprovalStatus.PENDING,
            documentPublishing: {
              documents: {
                organizationId
              }
            }
          },
          include: {
            documentPublishing: {
              include: {
                documents: {
                  select: {
                    id: true,
                    title: true,
                    fileName: true
                  }
                }
              }
            },
            approvalStep: true
          },
          orderBy: {
            assignedAt: 'asc'
          }
        })
      ]);

      return {
        pendingApprovals,
        scheduledPublications,
        recentPublications,
        myApprovals
      };

    } catch (error) {
      this.logger.error('Failed to get publishing dashboard:', error);
      throw error;
    }
  }

  /**
   * Initialize scheduled tasks for publishing
   */
  private initializeScheduledTasks(): void {
    // Check for scheduled publications every minute
    cron.schedule('* * * * *', async () => {
      await this.processScheduledPublications();
    });

    // Check for expired approvals every hour
    cron.schedule('0 * * * *', async () => {
      await this.processExpiredApprovals();
    });

    this.logger.info('Publishing scheduled tasks initialized');
  }

  /**
   * Process scheduled publications
   */
  private async processScheduledPublications(): Promise<void> {
    try {
      const scheduledPublications = await this.prisma.document_publishings.findMany({
        where: {
          status: PublishingStatus.APPROVED,
          scheduledPublishDate: {
            lte: new Date()
          }
        },
        include: {
          documents: {
            include: {
              organization: true
            }
          }
        }
      });

      for (const publishing of scheduledPublications) {
        try {
          await this.publishDocument(
            publishing.id,
            'system',
            publishing.documents.organizationId
          );
          
          this.logger.info('Scheduled publication completed', {
            publishingId: publishing.id,
            documentId: publishing.documentId
          });
        } catch (error) {
          this.logger.error('Failed to process scheduled publication:', {
            publishingId: publishing.id,
            error
          });
        }
      }

    } catch (error) {
      this.logger.error('Failed to process scheduled publications:', error);
    }
  }

  /**
   * Process expired approvals
   */
  private async processExpiredApprovals(): Promise<void> {
    try {
      const expiredApprovals = await this.prisma.documentApproval.findMany({
        where: {
          status: ApprovalStatus.PENDING,
          dueDate: {
            lte: new Date()
          }
        },
        include: {
          documentPublishing: {
            include: {
              publishing_workflows: true
            }
          }
        }
      });

      for (const approval of expiredApprovals) {
        await this.prisma.documentApproval.update({
          where: { id: approval.id },
          data: {
            status: ApprovalStatus.EXPIRED
          }
        });

        // Send expiration notification
        await this.sendExpirationNotification(approval);
      }

    } catch (error) {
      this.logger.error('Failed to process expired approvals:', error);
    }
  }

  /**
   * Create approval requests for a step
   */
  private async createApprovalRequests(
    publishingId: string,
    approvalStep: any
  ): Promise<void> {
    const dueDate = new Date(Date.now() + approvalStep.timeoutHours * 60 * 60 * 1000);

    for (const user of approvalStep.requiredUsers) {
      await this.prisma.documentApproval.create({
        data: {
          publishingId,
          stepId: approvalStep.id,
          approverId: user.userId,
          status: ApprovalStatus.PENDING,
          dueDate
        }
      });

      // Send approval request notification
      await this.sendApprovalRequestNotification(publishingId, user.userId, approvalStep);
    }
  }

  /**
   * Check if approval step is complete
   */
  private async checkStepCompletion(
    publishingId: string,
    approvalStep: any
  ): Promise<void> {
    const approvals = await this.prisma.documentApproval.findMany({
      where: {
        publishingId,
        stepId: approvalStep.id
      }
    });

    const approvedCount = approvals.filter(a => a.status === ApprovalStatus.APPROVED).length;
    const rejectedCount = approvals.filter(a => a.status === ApprovalStatus.REJECTED).length;

    // Check if step is rejected
    if (rejectedCount > 0) {
      await this.prisma.document_publishings.update({
        where: { id: publishingId },
        data: {
          status: PublishingStatus.REJECTED
        }
      });
      return;
    }

    // Check if step is approved
    if (approvedCount >= approvalStep.minApprovals) {
      const publishing = await this.prisma.document_publishings.findUnique({
        where: { id: publishingId },
        include: {
          documents: true,
          publishing_workflows: {
            include: {
              approvalSteps: {
                orderBy: { stepNumber: 'asc' }
              }
            }
          }
        }
      });

      if (!publishing) return;

      const nextStep = publishing.publishing_workflows.approvalSteps.find(
        step => step.stepNumber === approvalStep.stepNumber + 1
      );

      if (nextStep) {
        // Move to next step
        await this.prisma.document_publishings.update({
          where: { id: publishingId },
          data: {
            currentStepNumber: nextStep.stepNumber,
            status: PublishingStatus.IN_APPROVAL
          }
        });

        await this.createApprovalRequests(publishingId, nextStep);
      } else {
        // All steps complete - approve for publishing
        await this.prisma.document_publishings.update({
          where: { id: publishingId },
          data: {
            status: PublishingStatus.APPROVED
          }
        });

        // If scheduled for immediate publish, do it now
        if (!publishing.scheduledPublishDate || publishing.scheduledPublishDate <= new Date()) {
          await this.publishDocument(publishingId, 'system', publishing.documents.organizationId);
        }
      }
    }
  }

  /**
   * Publish to specific destination - placeholder (destinations not implemented in schema)
   */
  private async publishToDestination(
    publishing: any,
    destination: any,
    userId: string
  ): Promise<void> {
    // Publishing destinations not implemented in schema - placeholder
    this.logger.info('Publishing destinations would be handled here', {
      publishingId: publishing.id,
      destinationType: destination.destinationType
    });
  }

  /**
   * Placeholder publishing methods (to be implemented)
   */
  private async publishToWebPortal(publishing: any, destination: any, content: Buffer | null): Promise<string> {
    // Implementation for web portal publishing
    this.logger.info('Publishing to web portal', { destinationId: destination.id });
    return `https://portal.example.com/documents/${publishing.documentId}`;
  }

  private async publishToEmail(publishing: any, destination: any, content: Buffer | null): Promise<void> {
    // Implementation for email distribution
    this.logger.info('Publishing to email', { destinationId: destination.id });
  }

  private async publishToPrint(publishing: any, destination: any, content: Buffer | null): Promise<void> {
    // Implementation for print queue
    this.logger.info('Publishing to print queue', { destinationId: destination.id });
  }

  private async publishToFileShare(publishing: any, destination: any, content: Buffer | null): Promise<string> {
    // Implementation for file share publishing
    this.logger.info('Publishing to file share', { destinationId: destination.id });
    return `https://fileshare.example.com/published/${publishing.documentId}`;
  }

  /**
   * Notification methods
   */
  private async sendApprovalRequestNotification(
    publishingId: string,
    userId: string,
    approvalStep: any
  ): Promise<void> {
    await this.prisma.publishingNotification.create({
      data: {
        publishingId,
        recipientId: userId,
        type: NotificationType.APPROVAL_REQUEST,
        title: `Approval Required: ${approvalStep.stepName}`,
        message: `You have been requested to approve step "${approvalStep.stepName}". Please review and provide your decision.`
      }
    });
  }

  private async sendApprovalNotification(
    publishing: any,
    approval: any,
    approvalStep: any
  ): Promise<void> {
    const notificationType = approval.decision === ApprovalDecision.APPROVE 
      ? NotificationType.APPROVAL_RECEIVED 
      : NotificationType.REJECTION_RECEIVED;

    await this.prisma.publishingNotification.create({
      data: {
        publishingId: publishing.id,
        recipientId: publishing.submittedById,
        type: notificationType,
        title: `${approval.decision === ApprovalDecision.APPROVE ? 'Approval' : 'Rejection'} Received`,
        message: `Step "${approvalStep.stepName}" has been ${approval.decision.toLowerCase()}.`
      }
    });
  }

  private async sendPublicationNotifications(publishing: any): Promise<void> {
    await this.prisma.publishingNotification.create({
      data: {
        publishingId: publishing.id,
        recipientId: publishing.submittedById,
        type: NotificationType.PUBLICATION_SUCCESS,
        title: 'Document Published Successfully',
        message: `Your document "${publishing.documents.title}" has been published successfully.`
      }
    });
  }

  private async sendExpirationNotification(approval: any): Promise<void> {
    await this.prisma.publishingNotification.create({
      data: {
        publishingId: approval.publishingId,
        recipientId: approval.approverId,
        type: NotificationType.DEADLINE_APPROACHING,
        title: 'Approval Request Expired',
        message: 'Your approval request has expired. The document publishing workflow may be affected.'
      }
    });
  }
}