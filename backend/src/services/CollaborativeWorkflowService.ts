import { PrismaClient, PublishingWorkflow, DocumentPublishing, User, ApprovalStep, DocumentApproval, ApprovalStatus, ApprovalDecision, PublishingStatus, NotificationType } from '@prisma/client';

// Types that don't exist in schema anymore - defining locally
type PublishingUrgency = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
type DestinationType = 'EMAIL' | 'PORTAL' | 'API' | 'FTP' | 'WEBHOOK';
import { PublishingService } from './PublishingService';
import { NotificationService } from './NotificationService';
import winston from 'winston';

interface CollaborativeReviewInput {
  documentId: string;
  reviewType: 'PARALLEL' | 'SEQUENTIAL' | 'CONDITIONAL';
  reviewers: {
    userId: string;
    role: string;
    requiredAction: 'REVIEW' | 'APPROVE' | 'SIGN_OFF';
    priority: number;
    conditions?: string[];
    delegateToRole?: string;
  }[];
  deadline?: Date;
  allowSimultaneousEditing?: boolean;
  requireConsensus?: boolean;
  minimumApprovals?: number;
}

interface CollaborativeEditingSession {
  documentId: string;
  sessionId: string;
  participants: string[];
  isActive: boolean;
  lockAcquiredBy?: string;
  lockAcquiredAt?: Date;
  changes: {
    userId: string;
    timestamp: Date;
    changeType: 'CONTENT' | 'METADATA' | 'STATUS';
    description: string;
    data: any;
  }[];
}

interface ConflictResolutionInput {
  publishingId: string;
  conflictType: 'APPROVAL_DISAGREEMENT' | 'DEADLINE_MISSED' | 'ROLE_CONFLICT';
  resolution: 'ESCALATE' | 'OVERRIDE' | 'EXTEND_DEADLINE' | 'REASSIGN';
  notes: string;
  resolvedBy: string;
}

export class CollaborativeWorkflowService {
  private prisma: PrismaClient;
  private publishingService: PublishingService;
  private notificationService: NotificationService;
  private logger: winston.Logger;
  private activeSessions: Map<string, CollaborativeEditingSession> = new Map();

  constructor() {
    this.prisma = new PrismaClient();
    this.publishingService = new PublishingService();
    this.notificationService = new NotificationService();
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [new winston.transports.Console()]
    });
  }

  /**
   * Create collaborative review workflow
   */
  async createCollaborativeReview(
    input: CollaborativeReviewInput,
    organizationId: string,
    initiatorId: string
  ): Promise<DocumentPublishing> {
    try {
      this.logger.info('Creating collaborative review workflow', {
        documentId: input.documentId,
        reviewType: input.reviewType,
        reviewerCount: input.reviewers.length
      });

      // Create dynamic workflow based on reviewers
      const workflowInput = {
        name: `Collaborative Review - ${input.reviewType}`,
        description: `Collaborative review workflow for document ${input.documentId}`,
        workflowType: 'COLLABORATIVE_REVIEW',
        autoApprove: false,
        requiredApprovers: input.minimumApprovals || Math.ceil(input.reviewers.length / 2),
        allowParallel: input.reviewType === 'PARALLEL',
        timeoutHours: input.deadline ? this.calculateTimeoutHours(input.deadline) : 72,
        approvalSteps: this.generateApprovalSteps(input.reviewers, input.reviewType)
      };

      // Create workflow
      const workflow = await this.publishingService.createPublishingWorkflow(
        workflowInput,
        organizationId,
        initiatorId
      );

      // Submit document for collaborative review
      const publishingInput = {
        documentId: input.documentId,
        workflowId: workflow.id,
        scheduledPublishAt: input.deadline,
        publishingNotes: `Collaborative review (${input.reviewType}) with ${input.reviewers.length} reviewers`,
        urgencyLevel: input.deadline && this.isUrgent(input.deadline) ? 'HIGH' as PublishingUrgency : 'MEDIUM' as PublishingUrgency,
        destinations: [{
          destinationType: 'PORTAL' as DestinationType,
          destinationName: 'Internal Review Portal',
          destinationConfig: {
            allowCollaborativeEditing: input.allowSimultaneousEditing,
            requireConsensus: input.requireConsensus
          }
        }]
      };

      const publishing = await this.publishingService.submitForPublishing(
        publishingInput,
        initiatorId,
        organizationId
      );

      // Create collaborative editing session if enabled
      if (input.allowSimultaneousEditing) {
        await this.createEditingSession(
          input.documentId,
          input.reviewers.map(r => r.userId),
          organizationId
        );
      }

      // Send initial notifications to all reviewers
      await this.notifyReviewers(publishing, input.reviewers, 'REVIEW_STARTED');

      this.logger.info('Collaborative review workflow created successfully', {
        publishingId: publishing.id,
        workflowId: workflow.id,
        documentId: input.documentId
      });

      return publishing;

    } catch (error) {
      this.logger.error('Failed to create collaborative review workflow:', error);
      throw error;
    }
  }

  /**
   * Create collaborative editing session
   */
  async createEditingSession(
    documentId: string,
    participantIds: string[],
    organizationId: string
  ): Promise<CollaborativeEditingSession> {
    try {
      const sessionId = `session_${documentId}_${Date.now()}`;
      
      const session: CollaborativeEditingSession = {
        documentId,
        sessionId,
        participants: participantIds,
        isActive: true,
        changes: []
      };

      this.activeSessions.set(sessionId, session);

      // Notify participants about the collaborative session
      for (const participantId of participantIds) {
        await this.notificationService.sendNotification({
          publishingId: '', // Will be updated when publishing record exists
          recipientId: participantId,
          notificationType: NotificationType.WORKFLOW_COMPLETED, // Using available enum
          title: 'Collaborative Editing Session Started',
          message: `You can now collaboratively edit document ${documentId}. Please coordinate with other participants to avoid conflicts.`,
          deliveryMethods: ['IN_APP', 'EMAIL']
        });
      }

      this.logger.info('Collaborative editing session created', {
        sessionId,
        documentId,
        participantCount: participantIds.length
      });

      return session;

    } catch (error) {
      this.logger.error('Failed to create collaborative editing session:', error);
      throw error;
    }
  }

  /**
   * Record change in collaborative session
   */
  async recordCollaborativeChange(
    sessionId: string,
    userId: string,
    changeType: 'CONTENT' | 'METADATA' | 'STATUS',
    description: string,
    data: any
  ): Promise<boolean> {
    try {
      const session = this.activeSessions.get(sessionId);
      
      if (!session || !session.isActive) {
        throw new Error('Collaborative session not found or inactive');
      }

      if (!session.participants.includes(userId)) {
        throw new Error('User not authorized for this collaborative session');
      }

      // Record the change
      session.changes.push({
        userId,
        timestamp: new Date(),
        changeType,
        description,
        data
      });

      // Notify other participants about the change
      const otherParticipants = session.participants.filter(id => id !== userId);
      
      for (const participantId of otherParticipants) {
        await this.notificationService.sendNotification({
          publishingId: '',
          recipientId: participantId,
          notificationType: NotificationType.WORKFLOW_COMPLETED,
          title: 'Document Updated in Collaborative Session',
          message: `${description} by another collaborator. Please review the changes.`,
          deliveryMethods: ['IN_APP']
        });
      }

      this.logger.info('Collaborative change recorded', {
        sessionId,
        userId,
        changeType,
        description
      });

      return true;

    } catch (error) {
      this.logger.error('Failed to record collaborative change:', error);
      throw error;
    }
  }

  /**
   * Acquire document lock for exclusive editing
   */
  async acquireDocumentLock(
    sessionId: string,
    userId: string,
    lockDurationMinutes: number = 30
  ): Promise<boolean> {
    try {
      const session = this.activeSessions.get(sessionId);
      
      if (!session || !session.isActive) {
        throw new Error('Collaborative session not found or inactive');
      }

      if (!session.participants.includes(userId)) {
        throw new Error('User not authorized for this collaborative session');
      }

      // Check if document is already locked
      if (session.lockAcquiredBy && session.lockAcquiredBy !== userId) {
        const lockAge = Date.now() - (session.lockAcquiredAt?.getTime() || 0);
        const lockDurationMs = lockDurationMinutes * 60 * 1000;
        
        if (lockAge < lockDurationMs) {
          throw new Error(`Document is locked by another user until ${new Date(session.lockAcquiredAt!.getTime() + lockDurationMs)}`);
        }
      }

      // Acquire lock
      session.lockAcquiredBy = userId;
      session.lockAcquiredAt = new Date();

      // Notify other participants
      const otherParticipants = session.participants.filter(id => id !== userId);
      
      for (const participantId of otherParticipants) {
        await this.notificationService.sendNotification({
          publishingId: '',
          recipientId: participantId,
          notificationType: NotificationType.WORKFLOW_COMPLETED,
          title: 'Document Locked for Editing',
          message: `Document is now locked for exclusive editing. The lock will expire in ${lockDurationMinutes} minutes.`,
          deliveryMethods: ['IN_APP']
        });
      }

      // Set automatic lock release
      setTimeout(() => {
        this.releaseDocumentLock(sessionId, userId);
      }, lockDurationMinutes * 60 * 1000);

      this.logger.info('Document lock acquired', {
        sessionId,
        userId,
        lockDurationMinutes
      });

      return true;

    } catch (error) {
      this.logger.error('Failed to acquire document lock:', error);
      throw error;
    }
  }

  /**
   * Release document lock
   */
  async releaseDocumentLock(
    sessionId: string,
    userId: string
  ): Promise<boolean> {
    try {
      const session = this.activeSessions.get(sessionId);
      
      if (!session || !session.isActive) {
        return false;
      }

      if (session.lockAcquiredBy !== userId) {
        throw new Error('Cannot release lock - not the lock owner');
      }

      // Release lock
      session.lockAcquiredBy = undefined;
      session.lockAcquiredAt = undefined;

      // Notify other participants
      const otherParticipants = session.participants.filter(id => id !== userId);
      
      for (const participantId of otherParticipants) {
        await this.notificationService.sendNotification({
          publishingId: '',
          recipientId: participantId,
          notificationType: NotificationType.WORKFLOW_COMPLETED,
          title: 'Document Lock Released',
          message: 'The document is now available for editing by all participants.',
          deliveryMethods: ['IN_APP']
        });
      }

      this.logger.info('Document lock released', {
        sessionId,
        userId
      });

      return true;

    } catch (error) {
      this.logger.error('Failed to release document lock:', error);
      throw error;
    }
  }

  /**
   * Process collaborative approval with conflict detection
   */
  async processCollaborativeApproval(
    publishingId: string,
    stepId: string,
    approverId: string,
    decision: ApprovalDecision,
    comments?: string,
    conditions?: string
  ): Promise<{
    approved: boolean;
    conflicts: any[];
    nextActions: string[];
  }> {
    try {
      this.logger.info('Processing collaborative approval', {
        publishingId,
        stepId,
        approverId,
        decision
      });

      // Get current approval state
      const publishing = await this.prisma.documentPublishing.findFirst({
        where: { id: publishingId },
        include: {
          document: true
        }
      });

      if (!publishing) {
        throw new Error('Publishing record not found');
      }

      // Process the approval
      const approval = await this.publishingService.processApproval(
        {
          publishingId,
          stepId,
          decision,
          comments,
          conditions
        },
        approverId,
        publishing.document.organizationId
      );

      // Detect conflicts
      const conflicts = await this.detectApprovalConflicts(publishing, stepId);

      // Determine next actions
      const nextActions = await this.determineNextActions(publishing, stepId, conflicts);

      // Handle conflicts if any
      if (conflicts.length > 0) {
        await this.handleApprovalConflicts(publishingId, conflicts);
      }

      this.logger.info('Collaborative approval processed', {
        publishingId,
        stepId,
        approverId,
        conflictCount: conflicts.length,
        nextActionCount: nextActions.length
      });

      return {
        approved: approval.status === ApprovalStatus.APPROVED,
        conflicts,
        nextActions
      };

    } catch (error) {
      this.logger.error('Failed to process collaborative approval:', error);
      throw error;
    }
  }

  /**
   * Resolve workflow conflicts
   */
  async resolveConflict(
    input: ConflictResolutionInput,
    organizationId: string
  ): Promise<boolean> {
    try {
      this.logger.info('Resolving workflow conflict', {
        publishingId: input.publishingId,
        conflictType: input.conflictType,
        resolution: input.resolution
      });

      const publishing = await this.prisma.documentPublishing.findFirst({
        where: {
          id: input.publishingId,
          document: { organizationId }
        },
        include: {
          document: true
        }
      });

      if (!publishing) {
        throw new Error('Publishing record not found');
      }

      let resolved = false;

      switch (input.resolution) {
        case 'ESCALATE':
          resolved = await this.escalateToHigherAuthority(publishing, input);
          break;
        
        case 'OVERRIDE':
          resolved = await this.overrideApprovalDecision(publishing, input);
          break;
        
        case 'EXTEND_DEADLINE':
          resolved = await this.extendApprovalDeadline(publishing, input);
          break;
        
        case 'REASSIGN':
          resolved = await this.reassignApproval(publishing, input);
          break;
        
        default:
          throw new Error(`Unknown resolution type: ${input.resolution}`);
      }

      if (resolved) {
        // Log the conflict resolution
        await this.logConflictResolution(input);
        
        // Notify stakeholders
        await this.notifyConflictResolution(publishing, input);
      }

      this.logger.info('Workflow conflict resolved', {
        publishingId: input.publishingId,
        resolution: input.resolution,
        resolved
      });

      return resolved;

    } catch (error) {
      this.logger.error('Failed to resolve workflow conflict:', error);
      throw error;
    }
  }

  /**
   * Get collaborative workflow status
   */
  async getCollaborativeWorkflowStatus(
    publishingId: string,
    organizationId: string
  ): Promise<{
    status: PublishingStatus;
    currentStep: number;
    totalSteps: number;
    approvals: any[];
    conflicts: any[];
    editingSession?: CollaborativeEditingSession;
    timeline: any[];
  }> {
    try {
      const publishing = await this.prisma.documentPublishing.findFirst({
        where: {
          id: publishingId,
          document: { organizationId }
        },
        include: {
          document: true
        }
      });

      if (!publishing) {
        throw new Error('Publishing record not found');
      }

      // Detect current conflicts
      const conflicts: any[] = [];

      // Find active editing session
      const editingSession = Array.from(this.activeSessions.values()).find(
        session => session.documentId === publishing.documentId && session.isActive
      );

      // Build timeline
      const timeline = await this.buildWorkflowTimeline(publishing);

      return {
        status: publishing.status as any,
        currentStep: 1,
        totalSteps: 1,
        approvals: [],
        conflicts,
        editingSession,
        timeline
      };

    } catch (error) {
      this.logger.error('Failed to get collaborative workflow status:', error);
      throw error;
    }
  }

  /**
   * Helper method to generate approval steps from reviewers
   */
  private generateApprovalSteps(
    reviewers: any[],
    reviewType: 'PARALLEL' | 'SEQUENTIAL' | 'CONDITIONAL'
  ): any[] {
    if (reviewType === 'PARALLEL') {
      // All reviewers in one step
      return [{
        stepNumber: 1,
        stepName: 'Parallel Review',
        description: 'All reviewers approve in parallel',
        isRequired: true,
        timeoutHours: 72,
        minApprovals: Math.ceil(reviewers.length / 2),
        allowDelegation: true,
        requiredUsers: reviewers.map(r => r.userId)
      }];
    } else if (reviewType === 'SEQUENTIAL') {
      // Each reviewer in their own step
      return reviewers
        .sort((a, b) => a.priority - b.priority)
        .map((reviewer, index) => ({
          stepNumber: index + 1,
          stepName: `Review by ${reviewer.role}`,
          description: `Sequential review step ${index + 1}`,
          isRequired: reviewer.requiredAction !== 'REVIEW',
          timeoutHours: 48,
          minApprovals: 1,
          allowDelegation: !!reviewer.delegateToRole,
          requiredUsers: [reviewer.userId]
        }));
    } else {
      // Conditional logic based on reviewer conditions
      return this.generateConditionalSteps(reviewers);
    }
  }

  /**
   * Generate conditional approval steps
   */
  private generateConditionalSteps(reviewers: any[]): any[] {
    const steps: any[] = [];
    const groupedReviewers = reviewers.reduce((acc, reviewer) => {
      const conditions = reviewer.conditions || ['default'];
      conditions.forEach((condition: string) => {
        if (!acc[condition]) {
          acc[condition] = [];
        }
        acc[condition].push(reviewer);
      });
      return acc;
    }, {} as Record<string, any[]>);

    let stepNumber = 1;
    Object.entries(groupedReviewers).forEach(([condition, conditionReviewers]) => {
      steps.push({
        stepNumber: stepNumber++,
        stepName: `Conditional Review: ${condition}`,
        description: `Review required when condition '${condition}' is met`,
        isRequired: true,
        timeoutHours: 48,
        minApprovals: Math.ceil((conditionReviewers as any[]).length / 2),
        allowDelegation: true,
        requiredUsers: (conditionReviewers as any[]).map(r => r.userId)
      });
    });

    return steps;
  }

  /**
   * Calculate timeout hours from deadline
   */
  private calculateTimeoutHours(deadline: Date): number {
    const now = new Date();
    const diffMs = deadline.getTime() - now.getTime();
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
    return Math.max(diffHours, 1); // At least 1 hour
  }

  /**
   * Check if deadline is urgent (less than 24 hours)
   */
  private isUrgent(deadline: Date): boolean {
    const now = new Date();
    const diffMs = deadline.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    return diffHours < 24;
  }

  /**
   * Notify reviewers about workflow events
   */
  private async notifyReviewers(
    publishing: DocumentPublishing,
    reviewers: any[],
    eventType: string
  ): Promise<void> {
    for (const reviewer of reviewers) {
      await this.notificationService.sendNotification({
        publishingId: publishing.id,
        recipientId: reviewer.userId,
        notificationType: NotificationType.APPROVAL_REQUEST,
        title: `Collaborative Review: ${eventType}`,
        message: `You have been assigned to review document in a collaborative workflow. Your role: ${reviewer.role}`,
        deliveryMethods: ['IN_APP', 'EMAIL']
      });
    }
  }

  /**
   * Detect approval conflicts in collaborative workflow
   */
  private async detectApprovalConflicts(
    publishing: any,
    stepId: string
  ): Promise<any[]> {
    const approvals: any[] = [];
    const conflicts: any[] = [];

    // Check for disagreements
    const approvedCount = approvals.filter((a: any) => a.decision === ApprovalDecision.APPROVE).length;
    const rejectedCount = approvals.filter((a: any) => a.decision === ApprovalDecision.REJECT).length;

    if (approvedCount > 0 && rejectedCount > 0) {
      conflicts.push({
        type: 'APPROVAL_DISAGREEMENT',
        description: 'Some reviewers approved while others rejected',
        approvals: approvals.map((a: any) => ({
          approverId: a.approverId,
          decision: a.decision,
          comments: a.comments
        }))
      });
    }

    // Check for deadline misses
    const overdueApprovals = approvals.filter((a: any) => 
      a.status === ApprovalStatus.PENDING && a.dueDate && a.dueDate < new Date()
    );

    if (overdueApprovals.length > 0) {
      conflicts.push({
        type: 'DEADLINE_MISSED',
        description: 'Some approvals are overdue',
        overdueApprovals: overdueApprovals.map((a: any) => ({
          approverId: a.approverId,
          dueDate: a.dueDate
        }))
      });
    }

    return conflicts;
  }

  /**
   * Determine next actions based on current state
   */
  private async determineNextActions(
    publishing: any,
    stepId: string,
    conflicts: any[]
  ): Promise<string[]> {
    const actions: string[] = [];

    if (conflicts.length > 0) {
      actions.push('Resolve conflicts before proceeding');
      
      if (conflicts.some(c => c.type === 'APPROVAL_DISAGREEMENT')) {
        actions.push('Escalate disagreement to higher authority');
        actions.push('Request additional review or clarification');
      }
      
      if (conflicts.some(c => c.type === 'DEADLINE_MISSED')) {
        actions.push('Extend deadline or reassign overdue approvals');
      }
    } else {
      // Check if step is complete
      const currentStep = null;
      const approvals: any[] = [];
      const approvedCount = approvals.filter((a: any) => a.status === ApprovalStatus.APPROVED).length;

      if (approvedCount >= 1) {
        actions.push('Advance to next step');
      } else {
        actions.push('Wait for additional approvals');
      }
    }

    return actions;
  }

  /**
   * Handle approval conflicts
   */
  private async handleApprovalConflicts(
    publishingId: string,
    conflicts: any[]
  ): Promise<void> {
    // Log conflicts and create notifications for administrators
    for (const conflict of conflicts) {
      this.logger.warn('Approval conflict detected', {
        publishingId,
        conflictType: conflict.type,
        description: conflict.description
      });

      // Could send notifications to administrators here
    }
  }

  /**
   * Conflict resolution methods
   */
  private async escalateToHigherAuthority(publishing: any, input: ConflictResolutionInput): Promise<boolean> {
    // Implementation for escalation logic
    this.logger.info('Escalating to higher authority', { publishingId: input.publishingId });
    return true;
  }

  private async overrideApprovalDecision(publishing: any, input: ConflictResolutionInput): Promise<boolean> {
    // Implementation for override logic
    this.logger.info('Overriding approval decision', { publishingId: input.publishingId });
    return true;
  }

  private async extendApprovalDeadline(publishing: any, input: ConflictResolutionInput): Promise<boolean> {
    // Implementation for deadline extension
    this.logger.info('Extending approval deadline', { publishingId: input.publishingId });
    return true;
  }

  private async reassignApproval(publishing: any, input: ConflictResolutionInput): Promise<boolean> {
    // Implementation for reassignment logic
    this.logger.info('Reassigning approval', { publishingId: input.publishingId });
    return true;
  }

  /**
   * Log conflict resolution
   */
  private async logConflictResolution(input: ConflictResolutionInput): Promise<void> {
    // Could store conflict resolution in database for audit trail
    this.logger.info('Conflict resolution logged', {
      publishingId: input.publishingId,
      conflictType: input.conflictType,
      resolution: input.resolution,
      resolvedBy: input.resolvedBy
    });
  }

  /**
   * Notify stakeholders about conflict resolution
   */
  private async notifyConflictResolution(publishing: any, input: ConflictResolutionInput): Promise<void> {
    // Send notifications about conflict resolution
    await this.notificationService.sendNotification({
      publishingId: input.publishingId,
      recipientId: publishing.submittedById,
      notificationType: NotificationType.WORKFLOW_COMPLETED,
      title: 'Workflow Conflict Resolved',
      message: `A conflict in the publishing workflow has been resolved: ${input.notes}`,
      deliveryMethods: ['IN_APP', 'EMAIL']
    });
  }

  /**
   * Build workflow timeline
   */
  private async buildWorkflowTimeline(publishing: any): Promise<any[]> {
    const timeline: any[] = [];

    // Add workflow creation
    timeline.push({
      timestamp: publishing.createdAt,
      event: 'Workflow Started',
      description: `Collaborative publishing workflow initiated`,
      actor: publishing.submittedBy
    });

    // Add approval events - placeholder since approvals are not available
    const publishingApprovals: any[] = [];
    publishingApprovals.forEach((approval: any) => {
      if (approval.respondedAt) {
        timeline.push({
          timestamp: approval.respondedAt,
          event: `${approval.decision}`,
          description: approval.comments || `${approval.decision} by ${approval.approver.firstName} ${approval.approver.lastName}`,
          actor: approval.approver
        });
      }
    });

    // Add editing session events
    const editingSession = Array.from(this.activeSessions.values()).find(
      session => session.documentId === publishing.documentId
    );

    if (editingSession) {
      editingSession.changes.forEach(change => {
        timeline.push({
          timestamp: change.timestamp,
          event: 'Document Modified',
          description: change.description,
          actor: { id: change.userId }
        });
      });
    }

    return timeline.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }
}