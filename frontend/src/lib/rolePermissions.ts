/**
 * Role-based permissions for document action buttons
 *
 * Button visibility rules:
 * - AO1/AO2: Edit Document only
 * - PCM: Edit Document only
 * - Reviewer: Review & CRM only
 * - Coordinator: Edit Document + Review & CRM
 * - AFDPO: All 3 buttons (Edit Document, Review & CRM, OPR Review)
 * - OPR: OPR Review only
 * - Admin: All buttons
 * - Legal: Review & CRM only
 */

export interface DocumentActionPermissions {
  canEditDocument: boolean;
  canAccessReviewCRM: boolean;
  canAccessOPRReview: boolean;
}

export function getDocumentActionPermissions(roleType: string): DocumentActionPermissions {
  const normalizedRole = roleType?.toLowerCase() || '';

  // Admin has access to all buttons
  if (normalizedRole === 'admin') {
    return {
      canEditDocument: true,
      canAccessReviewCRM: true,
      canAccessOPRReview: true,
    };
  }

  // AFDPO has access to all 3 buttons
  if (normalizedRole === 'afdpo') {
    return {
      canEditDocument: true,
      canAccessReviewCRM: true,
      canAccessOPRReview: true,
    };
  }

  // AO1, AO2, ACTION_OFFICER, and PCM: Edit Document only
  if (
    normalizedRole === 'ao1' ||
    normalizedRole === 'ao2' ||
    normalizedRole === 'action_officer' ||
    normalizedRole === 'pcm'
  ) {
    return {
      canEditDocument: true,
      canAccessReviewCRM: false,
      canAccessOPRReview: false,
    };
  }

  // Reviewer and Legal: Review & CRM only
  if (
    normalizedRole === 'reviewer' ||
    normalizedRole === 'sub_reviewer' ||
    normalizedRole === 'legal' ||
    normalizedRole === 'legal_reviewer'
  ) {
    return {
      canEditDocument: false,
      canAccessReviewCRM: true,
      canAccessOPRReview: false,
    };
  }

  // Coordinator: Edit Document + Review & CRM
  if (
    normalizedRole === 'coordinator' ||
    normalizedRole === 'internal_coordinator' ||
    normalizedRole === 'o6_gs15_coordinator' ||
    normalizedRole === 'two_letter_coordinator'
  ) {
    return {
      canEditDocument: true,
      canAccessReviewCRM: true,
      canAccessOPRReview: false,
    };
  }

  // OPR and OPR_LEADERSHIP: OPR Review only
  if (normalizedRole === 'opr' || normalizedRole === 'opr_leadership') {
    return {
      canEditDocument: false,
      canAccessReviewCRM: false,
      canAccessOPRReview: true,
    };
  }

  // Default: No access to any buttons (for unknown roles)
  return {
    canEditDocument: false,
    canAccessReviewCRM: false,
    canAccessOPRReview: false,
  };
}
