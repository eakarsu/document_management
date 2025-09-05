/**
 * PubOne Template Categories based on Prototype Planning Document
 * This file defines all template categories and their templates for the AF publication system
 */

export interface TemplateMetadata {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  description: string;
  requiredSections: string[];
  optionalSections?: string[];
  requiresCoordination: boolean;
  coordinationLevels?: string[];
  aiAssistAvailable?: boolean;
}

export interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  templates: TemplateMetadata[];
  priority: number; // Display order priority
}

// Main Template Categories based on the planning document
export const templateCategories: TemplateCategory[] = [
  {
    id: 'policy-documents',
    name: 'Policy Documents',
    description: 'High-level policy directives and memorandums',
    priority: 1,
    templates: [
      {
        id: 'dafpd',
        name: 'DAF Policy Directive (DAFPD)',
        category: 'policy-documents',
        description: 'Department of Air Force Policy Directive template',
        requiredSections: [
          'seal', 'byOrderOf', 'pubNumber', 'date', 'title', 
          'complianceStatement', 'accessibilityStatement', 'releasabilityStatement',
          'oprOffice', 'certifiedBy', 'chapters', 'attachments'
        ],
        optionalSections: ['forewords', 'supersedes'],
        requiresCoordination: true,
        coordinationLevels: ['legal', 'o6-gs15', '2-letter'],
        aiAssistAvailable: true
      },
      {
        id: 'policy-memorandum',
        name: 'Policy Memorandum',
        category: 'policy-documents',
        description: 'Official policy memorandum template',
        requiredSections: [
          'header', 'date', 'subject', 'purpose', 'applicability', 
          'policy', 'responsibilities', 'effectiveDate'
        ],
        requiresCoordination: true,
        coordinationLevels: ['legal', 'o6-gs15']
      },
      {
        id: 'mission-directive',
        name: 'Mission Directive',
        category: 'policy-documents',
        description: 'Mission directive establishing organizational responsibilities',
        requiredSections: [
          'missionStatement', 'organizationalStructure', 'responsibilities',
          'authorities', 'relationships', 'administration'
        ],
        requiresCoordination: true,
        coordinationLevels: ['legal', '2-letter']
      }
    ]
  },
  {
    id: 'instructions-manuals',
    name: 'Instructions & Manuals',
    description: 'Detailed instructional documents and manuals',
    priority: 2,
    templates: [
      {
        id: 'dafman',
        name: 'DAF Manual (DAFMAN)',
        category: 'instructions-manuals',
        description: 'Department of Air Force Manual template (e.g., DAFMAN11-402)',
        requiredSections: [
          'seal', 'pubNumber', 'title', 'complianceStatement', 
          'chapters', 'paragraphNumbering', 'tables', 'illustrations',
          'attachments', 'applicableForms'
        ],
        optionalSections: ['summaryOfChanges'],
        requiresCoordination: true,
        coordinationLevels: ['legal', 'o6-gs15', '2-letter'],
        aiAssistAvailable: true
      },
      {
        id: 'instruction',
        name: 'Instruction',
        category: 'instructions-manuals',
        description: 'Standard instruction document',
        requiredSections: [
          'purpose', 'applicability', 'procedures', 'responsibilities',
          'recordsManagement', 'recommendedChanges'
        ],
        requiresCoordination: true,
        coordinationLevels: ['legal', 'o6-gs15']
      },
      {
        id: 'operating-instruction',
        name: 'Operating Instruction',
        category: 'instructions-manuals',
        description: 'Unit-level operating instruction',
        requiredSections: [
          'purpose', 'procedures', 'responsibilities', 'references'
        ],
        requiresCoordination: false
      },
      {
        id: 'checklist',
        name: 'Instruction Checklist',
        category: 'instructions-manuals',
        description: 'Checklist for instruction compliance',
        requiredSections: [
          'title', 'checklistItems', 'verificationSignature', 'date'
        ],
        requiresCoordination: false
      }
    ]
  },
  {
    id: 'supplements',
    name: 'Supplements & Addendums',
    description: 'Supplemental documents to existing publications',
    priority: 3,
    templates: [
      {
        id: 'supplement',
        name: 'Supplement Template',
        category: 'supplements',
        subcategory: 'lower-level',
        description: 'Supplement to existing publication (e.g., AFI11-402_AFMCSUP)',
        requiredSections: [
          'parentPubReference', 'supplementingOrg', 'addedParagraphs',
          'modifiedParagraphs', 'applicabilityStatement'
        ],
        optionalSections: ['localProcedures'],
        requiresCoordination: true,
        coordinationLevels: ['legal', 'o6-gs15'],
        aiAssistAvailable: true
      },
      {
        id: 'addendum',
        name: 'Addendum',
        category: 'supplements',
        description: 'Addendum to existing document',
        requiredSections: [
          'originalDocReference', 'addendumNumber', 'changes', 'effectiveDate'
        ],
        requiresCoordination: true,
        coordinationLevels: ['legal']
      },
      {
        id: 'integrated-change',
        name: 'Integrated Change',
        category: 'supplements',
        description: 'Integrated change to existing publication',
        requiredSections: [
          'changeNumber', 'affectedSections', 'changeDescription', 
          'implementation', 'coordination'
        ],
        requiresCoordination: true,
        coordinationLevels: ['legal', 'o6-gs15', '2-letter']
      }
    ]
  },
  {
    id: 'guidance-memorandums',
    name: 'Guidance Memorandums',
    description: 'Temporary guidance and interim changes',
    priority: 4,
    templates: [
      {
        id: 'guidance-memorandum',
        name: 'Guidance Memorandum',
        category: 'guidance-memorandums',
        description: 'Interim guidance pending formal publication update',
        requiredSections: [
          'memorandumNumber', 'subject', 'purpose', 'guidance',
          'applicability', 'expirationDate', 'poc'
        ],
        requiresCoordination: true,
        coordinationLevels: ['legal']
      },
      {
        id: 'waiver-request',
        name: 'Waiver Request',
        category: 'guidance-memorandums',
        description: 'Request for waiver from existing requirements',
        requiredSections: [
          'requestingOrg', 'requirementReference', 'justification',
          'alternativeCompliance', 'riskAssessment', 'duration'
        ],
        requiresCoordination: true,
        coordinationLevels: ['legal', 'certifying-official']
      }
    ]
  },
  {
    id: 'reference-documents',
    name: 'Reference Documents',
    description: 'Handbooks, pamphlets, and reference materials',
    priority: 5,
    templates: [
      {
        id: 'handbook',
        name: 'Handbook',
        category: 'reference-documents',
        description: 'Reference handbook for procedures and best practices',
        requiredSections: [
          'introduction', 'chapters', 'quickReference', 'glossary', 'index'
        ],
        optionalSections: ['visualAids', 'exampleForms'],
        requiresCoordination: false
      },
      {
        id: 'pamphlet',
        name: 'Pamphlet',
        category: 'reference-documents',
        description: 'Educational or informational pamphlet',
        requiredSections: [
          'title', 'purpose', 'content', 'references'
        ],
        requiresCoordination: false
      },
      {
        id: 'visual-aid',
        name: 'Visual Aid',
        category: 'reference-documents',
        description: 'Visual training aid or infographic',
        requiredSections: [
          'title', 'graphicContent', 'legend', 'references'
        ],
        requiresCoordination: false
      },
      {
        id: 'tactics-techniques',
        name: 'Tactics, Techniques & Procedures (TTP)',
        category: 'reference-documents',
        description: 'Tactical doctrine and procedures',
        requiredSections: [
          'classification', 'introduction', 'tactics', 'techniques',
          'procedures', 'bestPractices', 'lessonsLearned'
        ],
        requiresCoordination: true,
        coordinationLevels: ['sme', 'o6-gs15']
      }
    ]
  },
  {
    id: 'coordination-documents',
    name: 'Coordination & Workflow Documents',
    description: 'Templates for coordination and review processes',
    priority: 6,
    templates: [
      {
        id: 'comment-resolution-matrix',
        name: 'Comment Resolution Matrix (CRM)',
        category: 'coordination-documents',
        description: 'Matrix for tracking and resolving coordination comments',
        requiredSections: [
          'documentTitle', 'coordinationLevel', 'commentNumber',
          'pageLineRef', 'comment', 'oprResponse', 'resolution',
          'coordinatorConcurrence', 'suspenseDate'
        ],
        optionalSections: ['extensionRequest'],
        requiresCoordination: false,
        aiAssistAvailable: true
      },
      {
        id: 'form-673',
        name: 'AF Form 673 - Coordination Record',
        category: 'coordination-documents',
        description: 'Official coordination and approval record',
        requiredSections: [
          'pubTitle', 'pubNumber', 'oprInfo', 'coordinationList',
          'signatures', 'dates', 'concurrenceStatus'
        ],
        requiresCoordination: false
      },
      {
        id: 'o6-coordination-tracker',
        name: 'O6/GS15 Coordination Tracker',
        category: 'coordination-documents',
        description: 'Tracking document for O6/GS15 level coordination',
        requiredSections: [
          'coordinators', 'sentDate', 'suspenseDate', 'receivedDate',
          'status', 'comments', 'resolution'
        ],
        requiresCoordination: false
      },
      {
        id: 'legal-review',
        name: 'Legal Review Checklist',
        category: 'coordination-documents',
        description: 'Legal coordination and review checklist',
        requiredSections: [
          'legalRequirements', 'complianceCheck', 'statutoryReview',
          'recommendations', 'legalApproval'
        ],
        requiresCoordination: false
      }
    ]
  },
  {
    id: 'administrative-templates',
    name: 'Administrative Templates',
    description: 'Administrative and process management templates',
    priority: 7,
    templates: [
      {
        id: 'publication-request',
        name: 'Publication Number Request',
        category: 'administrative-templates',
        description: 'Request form for new publication number assignment',
        requiredSections: [
          'requestingOrg', 'pubType', 'proposedTitle', 'justification',
          'oprContactInfo', 'anticipatedCoordination'
        ],
        requiresCoordination: false
      },
      {
        id: 'draft-assignment',
        name: 'Draft Assignment Sheet',
        category: 'administrative-templates',
        description: 'Assignment of draft to internal/external coordinators',
        requiredSections: [
          'draftTitle', 'assignedTo', 'assignmentDate', 'suspense',
          'instructions', 'deliverables'
        ],
        requiresCoordination: false
      },
      {
        id: 'publication-tracker',
        name: 'Publication Status Tracker',
        category: 'administrative-templates',
        description: 'Track publication through development lifecycle',
        requiredSections: [
          'pubNumber', 'currentPhase', 'completedMilestones',
          'upcomingMilestones', 'issues', 'poc'
        ],
        requiresCoordination: false,
        aiAssistAvailable: true
      }
    ]
  }
];

// Helper functions for template management
export function getTemplateById(templateId: string): TemplateMetadata | undefined {
  for (const category of templateCategories) {
    const template = category.templates.find(t => t.id === templateId);
    if (template) return template;
  }
  return undefined;
}

export function getTemplatesByCategory(categoryId: string): TemplateMetadata[] {
  const category = templateCategories.find(c => c.id === categoryId);
  return category ? category.templates : [];
}

export function getRequiredTemplatesForAction(action: 'create' | 'revise' | 'supplement'): TemplateMetadata[] {
  const requiredTemplates: TemplateMetadata[] = [];
  
  switch (action) {
    case 'create':
      // For new publications, include main document templates
      requiredTemplates.push(...getTemplatesByCategory('policy-documents'));
      requiredTemplates.push(...getTemplatesByCategory('instructions-manuals'));
      break;
    case 'revise':
      // For revisions, include coordination templates
      requiredTemplates.push(...getTemplatesByCategory('coordination-documents'));
      break;
    case 'supplement':
      // For supplements, include supplement templates
      requiredTemplates.push(...getTemplatesByCategory('supplements'));
      break;
  }
  
  // Always include CRM and Form 673 for coordination
  const crm = getTemplateById('comment-resolution-matrix');
  const form673 = getTemplateById('form-673');
  if (crm && !requiredTemplates.find(t => t.id === crm.id)) {
    requiredTemplates.push(crm);
  }
  if (form673 && !requiredTemplates.find(t => t.id === form673.id)) {
    requiredTemplates.push(form673);
  }
  
  return requiredTemplates;
}

// Export template statistics
export const templateStats = {
  totalCategories: templateCategories.length,
  totalTemplates: templateCategories.reduce((sum, cat) => sum + cat.templates.length, 0),
  aiEnabledTemplates: templateCategories.reduce(
    (sum, cat) => sum + cat.templates.filter(t => t.aiAssistAvailable).length, 
    0
  ),
  coordinationRequiredTemplates: templateCategories.reduce(
    (sum, cat) => sum + cat.templates.filter(t => t.requiresCoordination).length,
    0
  )
};

export default templateCategories;