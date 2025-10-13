import { WorkflowAction } from '@/hooks/useWorkflowActions';

export const filterWorkflowActions = (
  currentStage: any,
  workflowDef: any,
  workflowInstance: any,
  userRole?: string,
  canEdit?: boolean
): WorkflowAction[] => {
  if (!currentStage || !workflowDef || !workflowInstance) {
    return [];
  }

  const actions: WorkflowAction[] = [];

  // Always show actions, but check permissions for each
  if (currentStage.actions) {
    currentStage.actions.forEach((action: any) => {
      const actionName = action.name || action.label;

      // Skip "Approve for Coordination" for non-PCM users (case insensitive)
      const isPCMUser = userRole && (
        userRole.toLowerCase().includes('pcm') ||
        userRole.toLowerCase() === 'admin'
      );
      if (actionName === 'Approve for Coordination' && !isPCMUser) {
        return; // Don't add this action for non-PCM users
      }

      // Skip "All Reviews Complete" or "All Draft Reviews Complete" for non-coordinator users
      const isCoordinatorUser = userRole && (
        userRole.toLowerCase().includes('coord') ||
        userRole.toLowerCase() === 'admin'
      );
      if ((actionName === 'All Reviews Complete' || actionName === 'All Draft Reviews Complete') && !isCoordinatorUser) {
        return; // Don't add this action for non-coordinator users
      }

      // Skip "Incorporate Changes" and "Create Draft Document" for OPR users (these are Action Officer actions)
      const isActionOfficer = userRole && (
        userRole.toLowerCase().includes('action') ||
        userRole.toLowerCase().includes('ao') ||
        userRole.toLowerCase() === 'admin'
      );
      if ((actionName === 'Incorporate Changes' || actionName === 'Create Draft Document') && !isActionOfficer) {
        return; // Don't add these actions for non-Action Officer users
      }

      // Check if this specific action is allowed for the user's role
      const isAllowedForRole = checkActionPermission(action, currentStage, userRole);

      // "Review Document" is always enabled for anyone with edit permissions
      const isReviewAction = actionName?.toLowerCase().includes('review document');
      const isDisabled = isReviewAction ? !canEdit : !isAllowedForRole;

      actions.push({
        id: action.id,
        label: actionName,
        target: action.nextStage || action.target || action.targetStage || currentStage.id,
        type: action.type,
        requiresDistribution: action.type === 'DISTRIBUTE' ||
                             action.id === 'distribute_to_reviewers' ||
                             action.id === 'distribute_draft_to_reviewers' ||
                             action.label?.toLowerCase().includes('distribute'),
        disabled: isDisabled,
        disabledReason: isDisabled ?
          (isReviewAction ? 'You need edit permissions' : `This action requires ${currentStage.assignedRole || 'appropriate'} role`)
          : undefined
      });
    });
  }

  // Add return button if not at first stage - each stage has its own return to previous
  if (currentStage.id !== '1') {
    const returnAction = createReturnAction(currentStage, workflowDef);
    if (returnAction) {
      // Return to previous stage is allowed for the role assigned to current stage
      const isAllowedForRole = checkActionPermission({ type: 'RETURN' }, currentStage, userRole);
      returnAction.disabled = !isAllowedForRole;
      returnAction.disabledReason = !isAllowedForRole ? `This action requires ${currentStage.assignedRole || 'appropriate'} role` : undefined;
      actions.push(returnAction);
    }
  }

  return actions;
};

export const checkActionPermission = (
  action: any,
  currentStage: any,
  userRole?: string
): boolean => {
  // Admin can always act
  if (userRole && userRole.toLowerCase() === 'admin') return true;

  // No role specified means no permission
  if (!userRole) return false;

  // Get the allowed roles for the current stage (can be allowedRoles array or assignedRole string)
  const allowedRoles = currentStage.allowedRoles || (currentStage.assignedRole ? [currentStage.assignedRole] : []);

  // Map user roles to stage roles - case insensitive matching
  const userRoleLower = userRole.toLowerCase();

  // Check if user matches any allowed role
  if (allowedRoles && allowedRoles.length > 0) {
    const isAllowed = allowedRoles.some((role: string) => {
      const roleLower = role.toLowerCase();

      // Direct match
      if (userRoleLower === roleLower) {
        return true;
      }

      // PCM users can act on PCM stages
      if (roleLower === 'pcm' && (userRoleLower === 'pcm' || userRoleLower === 'pcm1' || userRoleLower.includes('pcm'))) {
        return true;
      }

      // Action Officer / OPR matching - EXPANDED
      // ACTION_OFFICER stage role matches OPR, AO, Action Officer user roles
      if (roleLower === 'action_officer' &&
          (userRoleLower === 'opr' || userRoleLower.includes('ao') || userRoleLower === 'ao1' ||
           userRoleLower === 'action officer' || userRoleLower === 'action_officer' ||
           userRoleLower.includes('opr'))) {
        return true;
      }

      // Direct OPR role matching - handle all variations
      // OPR stage role matches OPR, Action Officer user roles
      if ((roleLower === 'opr' || roleLower === 'action_officer') &&
          (userRoleLower === 'opr' || userRoleLower === 'action officer' ||
           userRoleLower === 'action_officer' || userRoleLower === 'opr_user' ||
           userRoleLower.includes('opr') || userRoleLower.includes('action'))) {
        return true;
      }

      // Coordinator matching
      if (roleLower === 'coordinator' && userRoleLower.includes('coord')) return true;

      // Legal matching
      if (roleLower === 'legal' && userRoleLower.includes('legal')) return true;

      // Leadership matching (including OPR Leadership/Commander)
      if ((roleLower === 'leadership' || roleLower === 'opr_leadership' || roleLower === 'commander') &&
          (userRoleLower.includes('leader') || userRoleLower.includes('commander') ||
           userRoleLower === 'opr.leadership')) return true;

      // AFDPO matching
      if (roleLower === 'afdpo' && userRoleLower.includes('publish')) return true;

      return false;
    });

    return isAllowed;
  }

  // For stages without specific role requirements, allow if user has edit permissions
  if (!allowedRoles || allowedRoles.length === 0) {
    return true;
  }

  return false;
};

export const checkUserPermission = (
  currentStage: any,
  userRole?: string,
  canEdit?: boolean
): boolean => {
  // For testing - allow all users with edit permissions to see buttons
  if (canEdit) return true;

  if (!userRole) return false;

  // Admin can always act
  if (userRole === 'Admin') return true;

  // Check if user has edit permissions
  if (!canEdit) return false;

  // Role mapping
  const roleMapping: Record<string, string[]> = {
    'Action Officer': ['ACTION_OFFICER', 'OPR'],
    'OPR': ['ACTION_OFFICER', 'OPR'],
    'OPR LEADERSHIP': ['LEADERSHIP', 'OPR_LEADERSHIP'],
    'OPR Leadership': ['LEADERSHIP', 'OPR_LEADERSHIP'],
    'PCM': ['PCM'],
    'Coordinator': ['COORDINATOR'],
    'LEADERSHIP': ['LEADERSHIP'],
    'SUB_REVIEWER': ['SUB_REVIEWER'],
    'Legal Reviewer': ['LEGAL'],
    'LEGAL': ['LEGAL'],
    'LEGAL_REVIEWER': ['LEGAL'],
    'AFDPO Publisher': ['AFDPO']
  };

  const mappedRoles = roleMapping[userRole] || [userRole];

  // Check stage roles
  if (currentStage.roles) {
    return currentStage.roles.some((role: string) =>
      mappedRoles.includes(role)
    );
  }

  // Check assigned role
  if (currentStage.assignedRole) {
    return mappedRoles.includes(currentStage.assignedRole);
  }

  return false;
};

export const createReturnAction = (
  currentStage: any,
  workflowDef: any
): WorkflowAction | null => {
  const sortedStages = workflowDef.stages.slice().sort((a: any, b: any) => a.order - b.order);
  const currentIndex = sortedStages.findIndex((s: any) => s.id === currentStage.id);

  if (currentIndex <= 0) return null;

  const previousStage = sortedStages[currentIndex - 1];

  // Custom return button labels based on stage
  const returnLabels: Record<string, string> = {
    '2': 'Return to Draft Preparation',
    '3': 'Return to PCM for Review',
    '3.5': 'Return to Distribution Phase',
    '4': 'Return to Review Collection',
    '5': 'Return to Feedback Incorporation',
    '5.5': 'Return to Second Distribution',
    '6': 'Return to Second Review Collection',
    '7': 'Return to Draft Finalization',
    '8': 'Return to Legal Review',
    '9': 'Return to Final Draft Prep',
    '10': 'Return to Leadership Review',
    '11': 'Return to PCM Validation'
  };

  return {
    id: `return-to-${previousStage.id}`,
    label: returnLabels[currentStage.id] || `Return to ${previousStage.name}`,
    target: previousStage.id,
    type: 'RETURN'
  };
};

export const getStageProgress = (currentStage: any, workflowDef: any): number => {
  if (!currentStage || !workflowDef) return 0;

  const totalStages = workflowDef.stages.length;
  const currentOrder = currentStage.order || 1;

  return Math.round((currentOrder / totalStages) * 100);
};

export const formatWorkflowDate = (dateString: string | Date): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  }).format(date);
};

export const getWorkflowStatusColor = (status: string): 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'success' | 'info' => {
  switch (status?.toLowerCase()) {
    case 'completed':
      return 'success';
    case 'in_progress':
      return 'primary';
    case 'pending':
      return 'warning';
    case 'rejected':
      return 'error';
    case 'distributed':
      return 'info';
    default:
      return 'default';
  }
};

export const getStageTypeIcon = (stageType?: string): string => {
  switch (stageType) {
    case 'REVIEW':
      return 'schedule';
    case 'APPROVE':
      return 'check_circle';
    case 'DISTRIBUTE':
      return 'account_tree';
    case 'COMPLETE':
      return 'flag';
    case 'SIGN':
      return 'draw';
    case 'REJECT':
      return 'cancel';
    default:
      return 'radio_button_unchecked';
  }
};