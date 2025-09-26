export const workflowSteps = [
  'Initial Draft',           // Stage 1
  'PCM Review',              // Stage 2
  'First Coordination',      // Stage 3
  'Review Collection',       // Stage 3.5
  'OPR Feedback',           // Stage 4
  'Second Coordination',     // Stage 5
  'Second Review',          // Stage 5.5
  'Second OPR Feedback',    // Stage 6
  'Legal Review',           // Stage 7
  'Post-Legal OPR',         // Stage 8
  'Leadership Review',      // Stage 9
  'AFDPO Publication'       // Stage 10
];

export const stageMapping = {
  'DRAFT_CREATION': 'OPR Creates',
  'INTERNAL_COORDINATION': '1st Coordination',
  'OPR_REVISIONS': 'OPR Revisions',
  'EXTERNAL_COORDINATION': '2nd Coordination',
  'OPR_FINAL': 'OPR Final',
  'LEGAL_REVIEW': 'Legal Review',
  'OPR_LEGAL': 'OPR Legal',
  'FINAL_PUBLISHING': 'AFDPO Publish',
  // New stages for hierarchical workflow
  '1': 'Initial Draft Preparation',
  '2': 'PCM Review',
  '3': 'First Coordination Distribution',
  '3.5': 'First Review Collection',
  '4': 'OPR Feedback Incorporation',
  '5': 'Second Coordination Distribution',
  '5.5': 'Second Review Collection',
  '6': 'Second OPR Feedback Incorporation',
  '7': 'Legal Review',
  '8': 'Post-Legal OPR Update',
  '9': 'OPR Leadership Review',
  '10': 'AFDPO Publication'
};

export const stageToStepMap: Record<string, string> = {
  'DRAFT_CREATION': 'OPR Creates',
  'INTERNAL_COORDINATION': '1st Coordination',
  'OPR_REVISIONS': 'OPR Revisions',
  'EXTERNAL_COORDINATION': '2nd Coordination',
  'OPR_FINAL': 'OPR Final',
  'LEGAL_REVIEW': 'Legal Review',
  'OPR_LEGAL': 'OPR Legal',
  'FINAL_PUBLISHING': 'AFDPO Publish',
  'PUBLISHED': 'AFDPO Publish'
};

export const getBackendStage = (frontendStage: string): string => {
  const stageMap: { [key: string]: string } = {
    '1st Coordination': 'INTERNAL_COORDINATION',
    'OPR Revisions': 'OPR_REVISIONS',
    '2nd Coordination': 'EXTERNAL_COORDINATION',
    'OPR Final': 'OPR_FINAL',
    'Legal Review': 'LEGAL_REVIEW',
    'OPR Legal': 'OPR_LEGAL',
    'AFDPO Publish': 'FINAL_PUBLISHING',
    'Published': 'PUBLISHED'
  };
  return stageMap[frontendStage] || frontendStage;
};

export const roleRequirements = {
  1: ['ADMIN', 'ACTION_OFFICER'],         // Stage 1: Initial Draft
  2: ['ADMIN', 'PCM'],                    // Stage 2: PCM Review
  3: ['ADMIN', 'COORDINATOR'],            // Stage 3: First Coordination
  3.5: ['ADMIN', 'SUB_REVIEWER', 'OPR'],  // Stage 3.5: Review Collection
  4: ['ADMIN', 'ACTION_OFFICER'],         // Stage 4: OPR Feedback
  5: ['ADMIN', 'COORDINATOR'],            // Stage 5: Second Coordination
  5.5: ['ADMIN', 'SUB_REVIEWER', 'OPR'],  // Stage 5.5: Second Review
  6: ['ADMIN', 'ACTION_OFFICER'],         // Stage 6: Second OPR Feedback
  7: ['ADMIN', 'LEGAL'],                  // Stage 7: Legal Review
  8: ['ADMIN', 'ACTION_OFFICER'],         // Stage 8: Post-Legal OPR
  9: ['ADMIN', 'LEADERSHIP'],             // Stage 9: Leadership Review
  10: ['ADMIN', 'AFDPO', 'PUBLISHER']     // Stage 10: AFDPO Publication
};

export const stageRoles: Record<number, string[]> = {
  1: ['ADMIN', 'ACTION_OFFICER'],         // Stage 1: Initial Draft
  2: ['ADMIN', 'PCM'],                    // Stage 2: PCM Review
  3: ['ADMIN', 'COORDINATOR'],            // Stage 3: First Coordination
  3.5: ['ADMIN', 'SUB_REVIEWER', 'OPR'],  // Stage 3.5: Review Collection
  4: ['ADMIN', 'ACTION_OFFICER'],         // Stage 4: OPR Feedback
  5: ['ADMIN', 'COORDINATOR'],            // Stage 5: Second Coordination
  5.5: ['ADMIN', 'SUB_REVIEWER', 'OPR'],  // Stage 5.5: Second Review
  6: ['ADMIN', 'ACTION_OFFICER'],         // Stage 6: Second OPR Feedback
  7: ['ADMIN', 'LEGAL'],                  // Stage 7: Legal Review
  8: ['ADMIN', 'ACTION_OFFICER'],         // Stage 8: Post-Legal OPR
  9: ['ADMIN', 'LEADERSHIP'],             // Stage 9: Leadership Review
  10: ['ADMIN', 'AFDPO', 'PUBLISHER']     // Stage 10: AFDPO Publication
};