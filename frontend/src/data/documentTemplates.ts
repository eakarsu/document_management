// Comprehensive Document Templates List
import {
  Description as DocumentIcon,
  Assignment as AssignmentIcon,
  Gavel as LegalIcon,
  School as ManualIcon,
  Policy as PolicyIcon,
  Book as BookIcon,
  LocalLibrary as LibraryIcon,
  Security as SecurityIcon,
  AccountTree as WorkflowIcon,
  Science as TechIcon,
  Groups as TeamIcon,
  RocketLaunch as SpaceIcon,
  Shield as DefenseIcon
} from '@mui/icons-material';

export const documentTemplates = [
  // Air Force Templates
  {
    id: 'af-manual',
    name: 'Air Force Manual (AFM)',
    description: 'Air Force Manual for operational procedures',
    icon: ManualIcon,
    category: 'Air Force',
    color: '#1e40af'
  },
  {
    id: 'af-instruction',
    name: 'Air Force Instruction (AFI)',
    description: 'Air Force Instruction document',
    icon: DocumentIcon,
    category: 'Air Force',
    color: '#1e40af'
  },
  {
    id: 'af-policy-directive',
    name: 'Air Force Policy Directive (AFPD)',
    description: 'Air Force Policy Directive',
    icon: PolicyIcon,
    category: 'Air Force',
    color: '#1e40af'
  },
  {
    id: 'af-manual-afman',
    name: 'Air Force Manual (AFMAN)',
    description: 'Air Force Manual - AFMAN series',
    icon: ManualIcon,
    category: 'Air Force',
    color: '#1e40af'
  },
  {
    id: 'af-job-qualification',
    name: 'Air Force Job Qualification Standard (AFJQS)',
    description: 'Job Qualification Standard document',
    icon: AssignmentIcon,
    category: 'Air Force',
    color: '#1e40af'
  },
  {
    id: 'af-technical-order',
    name: 'Air Force Technical Order (AFTO)',
    description: 'Technical Order for equipment and procedures',
    icon: TechIcon,
    category: 'Air Force',
    color: '#1e40af'
  },
  {
    id: 'af-visual-aid',
    name: 'Air Force Visual Aid (AFVA)',
    description: 'Visual Aid for training and reference',
    icon: LibraryIcon,
    category: 'Air Force',
    color: '#1e40af'
  },
  {
    id: 'af-handbook',
    name: 'Air Force Handbook (AFH)',
    description: 'Air Force Handbook for reference',
    icon: BookIcon,
    category: 'Air Force',
    color: '#1e40af'
  },
  {
    id: 'af-guidance-memorandum',
    name: 'Air Force Guidance Memorandum (AFGM)',
    description: 'Guidance Memorandum for interim changes',
    icon: DocumentIcon,
    category: 'Air Force',
    color: '#1e40af'
  },
  {
    id: 'af-mission-directive',
    name: 'Air Force Mission Directive (AFMD)',
    description: 'Mission Directive defining unit responsibilities',
    icon: WorkflowIcon,
    category: 'Air Force',
    color: '#1e40af'
  },

  // Department of the Air Force Templates
  {
    id: 'daf-instruction',
    name: 'Department of the Air Force Instruction (DAFI)',
    description: 'DAF Instruction document',
    icon: DocumentIcon,
    category: 'Department of the Air Force',
    color: '#1e3a8a'
  },
  {
    id: 'daf-manual',
    name: 'Department of the Air Force Manual (DAFMAN)',
    description: 'DAF Manual document',
    icon: ManualIcon,
    category: 'Department of the Air Force',
    color: '#1e3a8a'
  },
  {
    id: 'daf-policy-directive',
    name: 'Department of the Air Force Policy Directive (DAFPD)',
    description: 'DAF Policy Directive',
    icon: PolicyIcon,
    category: 'Department of the Air Force',
    color: '#1e3a8a'
  },

  // Space Force Templates
  {
    id: 'space-force-instruction',
    name: 'Space Force Instruction (SFI)',
    description: 'Space Force Instruction document',
    icon: SpaceIcon,
    category: 'Space Force',
    color: '#111827'
  },

  // Army Templates
  {
    id: 'army-regulation',
    name: 'Army Regulation (AR)',
    description: 'Army Regulation document',
    icon: SecurityIcon,
    category: 'Army',
    color: '#4d5626'
  },

  // Navy Templates
  {
    id: 'navy-instruction',
    name: 'Navy Instruction (OPNAVINST)',
    description: 'Navy Instruction document',
    icon: DocumentIcon,
    category: 'Navy',
    color: '#001f3f'
  },

  // Marine Corps Templates
  {
    id: 'marine-corps-order',
    name: 'Marine Corps Order (MCO)',
    description: 'Marine Corps Order document',
    icon: SecurityIcon,
    category: 'Marine Corps',
    color: '#8b0000'
  },

  // Department of Defense Templates
  {
    id: 'dod-directive',
    name: 'Department of Defense Directive (DODD)',
    description: 'DoD Directive document',
    icon: DefenseIcon,
    category: 'Department of Defense',
    color: '#374151'
  },
  {
    id: 'dod-instruction',
    name: 'Department of Defense Instruction (DODI)',
    description: 'DoD Instruction document',
    icon: DocumentIcon,
    category: 'Department of Defense',
    color: '#374151'
  },
  {
    id: 'cjcs-instruction',
    name: 'Chairman Joint Chiefs of Staff Instruction (CJCSI)',
    description: 'CJCS Instruction document',
    icon: TeamIcon,
    category: 'Joint Chiefs',
    color: '#4b5563'
  },

  // Operational Documents
  {
    id: 'operation-plan',
    name: 'Operation Plan (OPLAN)',
    description: 'Operational Plan document',
    icon: WorkflowIcon,
    category: 'Operations',
    color: '#dc2626'
  },
  {
    id: 'operation-order',
    name: 'Operation Order (OPORD)',
    description: 'Operation Order document',
    icon: AssignmentIcon,
    category: 'Operations',
    color: '#dc2626'
  },
  {
    id: 'concept-of-operations',
    name: 'Concept of Operations (CONOPS)',
    description: 'Concept of Operations document',
    icon: DocumentIcon,
    category: 'Operations',
    color: '#dc2626'
  },

  // Generic Templates
  {
    id: 'technical-documentation',
    name: 'Technical Documentation',
    description: 'Technical documentation template',
    icon: TechIcon,
    category: 'Generic',
    color: '#6b7280'
  },
  {
    id: 'policy-document',
    name: 'Policy Document',
    description: 'General policy document',
    icon: PolicyIcon,
    category: 'Generic',
    color: '#6b7280'
  },
  {
    id: 'training-manual',
    name: 'Training Manual',
    description: 'Training manual template',
    icon: BookIcon,
    category: 'Generic',
    color: '#6b7280'
  },
  {
    id: 'standard-operating-procedure',
    name: 'Standard Operating Procedure (SOP)',
    description: 'SOP template',
    icon: AssignmentIcon,
    category: 'Generic',
    color: '#6b7280'
  },

  // Coordination & Workflow Templates
  {
    id: 'comment-resolution-matrix',
    name: 'Comment Resolution Matrix (CRM)',
    description: 'Track and resolve coordination comments',
    icon: AssignmentIcon,
    category: 'Coordination',
    color: '#059669'
  },
  {
    id: 'af-form-673',
    name: 'AF Form 673 - Coordination Record',
    description: 'Official coordination and approval record',
    icon: LegalIcon,
    category: 'Coordination',
    color: '#059669'
  },
  {
    id: 'supplement-template',
    name: 'Supplement Template',
    description: 'Supplement to existing publication',
    icon: DocumentIcon,
    category: 'Coordination',
    color: '#059669'
  },
  {
    id: 'o6-gs15-coordination',
    name: 'O6/GS15 Coordination',
    description: 'SME review and coordination template',
    icon: AssignmentIcon,
    category: 'Coordination',
    color: '#059669'
  },
  {
    id: '2-letter-coordination',
    name: '2-Letter Coordination',
    description: 'Senior leadership review template',
    icon: PolicyIcon,
    category: 'Coordination',
    color: '#059669'
  },
  {
    id: 'legal-coordination',
    name: 'Legal Coordination',
    description: 'Legal review and compliance template',
    icon: LegalIcon,
    category: 'Coordination',
    color: '#059669'
  },

  // High Priority Templates
  {
    id: 'dafpd-template',
    name: 'DAF Policy Directive Template',
    description: 'Department of Air Force Policy Directive',
    icon: PolicyIcon,
    category: 'High Priority',
    color: '#dc2626'
  },
  {
    id: 'dafman-template',
    name: 'DAF Manual Template',
    description: 'Department of Air Force Manual',
    icon: ManualIcon,
    category: 'High Priority',
    color: '#dc2626'
  },
  {
    id: 'guidance-memorandum',
    name: 'Guidance Memorandum',
    description: 'Official guidance memorandum',
    icon: DocumentIcon,
    category: 'High Priority',
    color: '#dc2626'
  },
  {
    id: 'waiver-request',
    name: 'Waiver Request',
    description: 'Waiver request template',
    icon: LegalIcon,
    category: 'High Priority',
    color: '#dc2626'
  },

  // Default
  {
    id: 'blank',
    name: 'Blank Document',
    description: 'Start with a blank document',
    icon: DocumentIcon,
    category: 'Generic',
    color: '#9ca3af'
  }
];

// Get categories for filtering
export const getTemplateCategories = () => {
  const categories = new Set(documentTemplates.map(t => t.category));
  return Array.from(categories).sort();
};

// Get templates by category
export const getTemplatesByCategory = (category: string) => {
  return documentTemplates.filter(t => t.category === category);
};

// Get template by ID
export const getTemplateById = (id: string) => {
  return documentTemplates.find(t => t.id === id);
};