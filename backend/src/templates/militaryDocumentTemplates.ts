import * as fs from 'fs';
import * as path from 'path';

// Function to load generated headers
function loadGeneratedHeader(templateId: string): string {
  try {
    const headerPath = path.join(__dirname, '../../headers', `${templateId}-header.html`);
    if (fs.existsSync(headerPath)) {
      return fs.readFileSync(headerPath, 'utf8');
    }
  } catch (error) {
    console.warn(`Could not load header for ${templateId}:`, error);
  }
  return '';
}

// Function to get just the document content without header
function getDocumentContentOnly(content: string): string {
  // Return just the content without any header
  return `
    <div style="margin-top: 40px;">
      ${content}
    </div>
  `;
}

// Comprehensive Military and Government Document Templates
// Note: Templates are dynamically generated to ensure fresh headers are loaded
export const militaryDocumentTemplates = {
  // Air Force Templates
  'af-manual': {
    name: 'Air Force Manual (AFM)',
    description: 'Air Force Manual for operational procedures',
    get content() {
      return getDocumentContentOnly(`
      <h2>Chapter 1: Introduction</h2>
      <p>This Air Force Manual provides comprehensive guidance for Air Force personnel regarding operational procedures and best practices.</p>

      <h3>1.1 Purpose</h3>
      <p>The purpose of this manual is to establish standardized procedures across all Air Force installations.</p>

      <h3>1.2 Scope</h3>
      <p>This manual applies to all active duty, reserve, and guard personnel.</p>

      <h2>Chapter 2: Procedures</h2>
      <p>Detailed procedures and guidelines follow...</p>
    `);
    }
  },

  'af-instruction': {
    name: 'Air Force Instruction (AFI)',
    description: 'Air Force Instruction document',
    get content() {
      return getDocumentContentOnly( `
      <h3>1. Overview</h3>
      <p>This instruction implements Air Force Policy Directive...</p>

      <h3>2. Responsibilities</h3>
      <p>Unit commanders will ensure compliance with this instruction.</p>

      <h3>3. Procedures</h3>
      <p>Follow these procedures for implementation...</p>
    `);
    }
  },

  'af-policy-directive': {
    name: 'Air Force Policy Directive (AFPD)',
    description: 'Air Force Policy Directive',
    get content() {
      return getDocumentContentOnly( `
      <h2>1. Overview</h2>
      <p>This directive establishes policies and responsibilities for...</p>

      <h2>2. Policy</h2>
      <p>It is Air Force policy that...</p>

      <h2>3. Responsibilities</h2>
      <p>The following offices have specific responsibilities...</p>
    `);
    }
  },

  'af-manual-afman': {
    name: 'Air Force Manual (AFMAN)',
    description: 'Air Force Manual - AFMAN series',
    get content() {
      return getDocumentContentOnly( `
      <h2>Chapter 1: General Information</h2>
      <p>This AFMAN provides guidance for...</p>

      <h2>Chapter 2: Responsibilities</h2>
      <p>Personnel responsibilities include...</p>

      <h2>Chapter 3: Procedures</h2>
      <p>Standard procedures for operations...</p>
    `);
    }
  },

  'af-job-qualification': {
    name: 'Air Force Job Qualification Standard (AFJQS)',
    description: 'Job Qualification Standard document',
    get content() {
      return getDocumentContentOnly( `
      <h2>1. Position Description</h2>
      <p>This AFJQS defines the qualification requirements for...</p>

      <h2>2. Core Tasks</h2>
      <p>Personnel must demonstrate proficiency in the following tasks...</p>

      <h2>3. Certification Requirements</h2>
      <p>Certification requires completion of...</p>
    `);
    }
  },

  'af-technical-order': {
    name: 'Air Force Technical Order (AFTO)',
    description: 'Technical Order for equipment and procedures',
    get content() {
      return getDocumentContentOnly( `
      <h2>1. General Information</h2>
      <p>This technical order provides instructions for...</p>

      <h2>2. Safety Precautions</h2>
      <p>WARNING: Follow all safety procedures...</p>

      <h2>3. Operating Instructions</h2>
      <p>Step-by-step operating procedures...</p>
    `);
    }
  },

  'af-visual-aid': {
    name: 'Air Force Visual Aid (AFVA)',
    description: 'Visual Aid for training and reference',
    get content() {
      return getDocumentContentOnly( `
      <h2>Purpose</h2>
      <p>This visual aid provides quick reference for...</p>

      <h2>Key Points</h2>
      <ul>
        <li>Point 1: Important information...</li>
        <li>Point 2: Critical procedures...</li>
        <li>Point 3: Emergency contacts...</li>
      </ul>
    `);
    }
  },

  'af-handbook': {
    name: 'Air Force Handbook (AFH)',
    description: 'Air Force Handbook for reference',
    get content() {
      return getDocumentContentOnly( `
      <h2>Chapter 1: Introduction</h2>
      <p>This handbook serves as a comprehensive reference for...</p>

      <h2>Chapter 2: Core Concepts</h2>
      <p>Understanding the fundamental concepts...</p>

      <h2>Chapter 3: Application</h2>
      <p>Practical application of concepts...</p>
    `);
    }
  },

  'af-guidance-memorandum': {
    name: 'Air Force Guidance Memorandum (AFGM)',
    description: 'Guidance Memorandum for interim changes',
    get content() {
      return getDocumentContentOnly( `
      <h2>1. Purpose</h2>
      <p>This Guidance Memorandum immediately implements...</p>

      <h2>2. Background</h2>
      <p>Recent changes require immediate implementation of...</p>

      <h2>3. Guidance</h2>
      <p>Effective immediately, units will...</p>
    `);
    }
  },

  'af-mission-directive': {
    name: 'Air Force Mission Directive (AFMD)',
    description: 'Mission Directive defining unit responsibilities',
    content: `
      <h1>Air Force Mission Directive (AFMD)</h1>

      <h2>1. Mission</h2>
      <p>The mission of this unit is to...</p>

      <h2>2. Command Structure</h2>
      <p>This unit reports directly to...</p>

      <h2>3. Responsibilities</h2>
      <p>Primary responsibilities include...</p>
    `
  },

  // Department of the Air Force Templates
  'dafi': {  // Also support 'dafi' as an alias
    name: 'Department of the Air Force Instruction (DAFI)',
    description: 'DAF Instruction document',
    get content() {
      return getDocumentContentOnly( `
      <h2>1. Overview</h2>
      <p>This instruction applies to all Department of the Air Force personnel...</p>

      <h2>2. Responsibilities</h2>
      <p>The Secretary of the Air Force...</p>

      <h2>3. Procedures</h2>
      <p>Implementation procedures...</p>
    `);
    }
  },
  'daf-instruction': {
    name: 'Department of the Air Force Instruction (DAFI)',
    description: 'DAF Instruction document',
    get content() {
      return getDocumentContentOnly( `
      <h2>1. Overview</h2>
      <p>This instruction applies to all Department of the Air Force personnel...</p>

      <h2>2. Responsibilities</h2>
      <p>The Secretary of the Air Force...</p>

      <h2>3. Procedures</h2>
      <p>Implementation procedures...</p>
    `);
    }
  },

  'daf-manual': {
    name: 'Department of the Air Force Manual (DAFMAN)',
    description: 'DAF Manual document',
    get content() {
      return getDocumentContentOnly( `
      <h2>Chapter 1: General Provisions</h2>
      <p>This manual provides guidance for all DAF organizations...</p>

      <h2>Chapter 2: Operational Procedures</h2>
      <p>Standard operating procedures...</p>
    `);
    }
  },

  'daf-policy-directive': {
    name: 'Department of the Air Force Policy Directive (DAFPD)',
    description: 'DAF Policy Directive',
    content: `
      <h1>Department of the Air Force Policy Directive (DAFPD)</h1>

      <h2>1. Purpose</h2>
      <p>This directive establishes DAF policy for...</p>

      <h2>2. Policy</h2>
      <p>It is DAF policy that all personnel...</p>
    `
  },

  // Space Force Templates
  'space-force-instruction': {
    name: 'Space Force Instruction (SFI)',
    description: 'Space Force Instruction document',
    content: `
      <h1>Space Force Instruction (SFI)</h1>

      <h2>1. Purpose</h2>
      <p>This instruction establishes Space Force procedures for...</p>

      <h2>2. Applicability</h2>
      <p>This instruction applies to all Space Force personnel...</p>
    `
  },

  // Other Military Branch Templates
  'army-regulation': {
    name: 'Army Regulation (AR)',
    description: 'Army Regulation document',
    content: `
      <h1>Army Regulation (AR)</h1>

      <h2>Chapter 1: Introduction</h2>
      <p>This regulation prescribes Army policy for...</p>

      <h2>Chapter 2: Responsibilities</h2>
      <p>The Commanding General will...</p>
    `
  },

  'navy-instruction': {
    name: 'Navy Instruction (OPNAVINST)',
    description: 'Navy Instruction document',
    content: `
      <h1>Navy Instruction (OPNAVINST)</h1>

      <h2>1. Purpose</h2>
      <p>This instruction establishes Navy policy and procedures for...</p>

      <h2>2. Policy</h2>
      <p>It is Navy policy that...</p>
    `
  },

  'marine-corps-order': {
    name: 'Marine Corps Order (MCO)',
    description: 'Marine Corps Order document',
    content: `
      <h1>Marine Corps Order (MCO)</h1>

      <h2>1. Situation</h2>
      <p>This order provides Marine Corps policy for...</p>

      <h2>2. Mission</h2>
      <p>Marine Corps units will...</p>
    `
  },

  // Department of Defense Templates
  'dod-directive': {
    name: 'Department of Defense Directive (DODD)',
    description: 'DoD Directive document',
    content: `
      <h1>Department of Defense Directive (DODD)</h1>

      <h2>1. Purpose</h2>
      <p>This Directive establishes policy and assigns responsibilities for...</p>

      <h2>2. Applicability</h2>
      <p>This Directive applies to all DoD Components...</p>
    `
  },

  'dod-instruction': {
    name: 'Department of Defense Instruction (DODI)',
    description: 'DoD Instruction document',
    content: `
      <h1>Department of Defense Instruction (DODI)</h1>

      <h2>1. Purpose</h2>
      <p>This Instruction implements policy established in...</p>

      <h2>2. Responsibilities</h2>
      <p>The Under Secretary of Defense...</p>
    `
  },

  'cjcs-instruction': {
    name: 'Chairman Joint Chiefs of Staff Instruction (CJCSI)',
    description: 'CJCS Instruction document',
    content: `
      <h1>Chairman Joint Chiefs of Staff Instruction (CJCSI)</h1>

      <h2>1. Purpose</h2>
      <p>This instruction provides guidance to the Joint Staff...</p>

      <h2>2. Applicability</h2>
      <p>This instruction applies to the Joint Staff and Combatant Commands...</p>
    `
  },

  // Operational Documents
  'operation-plan': {
    name: 'Operation Plan (OPLAN)',
    description: 'Operational Plan document',
    content: `
      <h1>Operation Plan (OPLAN)</h1>

      <h2>1. Situation</h2>
      <p>Current operational environment...</p>

      <h2>2. Mission</h2>
      <p>Unit will conduct operations to...</p>

      <h2>3. Execution</h2>
      <p>Concept of operations...</p>
    `
  },

  'operation-order': {
    name: 'Operation Order (OPORD)',
    description: 'Operation Order document',
    content: `
      <h1>Operation Order (OPORD)</h1>

      <h2>1. Situation</h2>
      <p>Enemy forces...</p>
      <p>Friendly forces...</p>

      <h2>2. Mission</h2>
      <p>Unit conducts operations...</p>

      <h2>3. Execution</h2>
      <p>Commander's intent...</p>
    `
  },

  'concept-of-operations': {
    name: 'Concept of Operations (CONOPS)',
    description: 'Concept of Operations document',
    content: `
      <h1>Concept of Operations (CONOPS)</h1>

      <h2>1. Purpose and Scope</h2>
      <p>This CONOPS describes how...</p>

      <h2>2. Operational Concept</h2>
      <p>The concept for this operation...</p>
    `
  },

  // Generic Templates
  'technical-documentation': {
    name: 'Technical Documentation',
    description: 'Technical documentation template',
    content: `
      <h1>Technical Documentation</h1>

      <h2>1. System Overview</h2>
      <p>This document describes the technical specifications for...</p>

      <h2>2. Technical Requirements</h2>
      <p>System requirements include...</p>

      <h2>3. Implementation</h2>
      <p>Implementation procedures...</p>
    `
  },

  'policy-document': {
    name: 'Policy Document',
    description: 'General policy document',
    content: `
      <h1>Policy Document</h1>

      <h2>1. Policy Statement</h2>
      <p>It is the policy of this organization that...</p>

      <h2>2. Scope</h2>
      <p>This policy applies to...</p>

      <h2>3. Responsibilities</h2>
      <p>All personnel are responsible for...</p>
    `
  },

  'training-manual': {
    name: 'Training Manual',
    description: 'Training manual template',
    content: `
      <h1>Training Manual</h1>

      <h2>Module 1: Introduction</h2>
      <p>This training manual provides...</p>

      <h2>Module 2: Basic Concepts</h2>
      <p>Understanding the fundamentals...</p>

      <h2>Module 3: Practical Application</h2>
      <p>Hands-on exercises...</p>
    `
  },

  'standard-operating-procedure': {
    name: 'Standard Operating Procedure (SOP)',
    description: 'SOP template',
    content: `
      <h1>Standard Operating Procedure (SOP)</h1>

      <h2>1. Purpose</h2>
      <p>This SOP establishes procedures for...</p>

      <h2>2. Scope</h2>
      <p>This procedure applies to...</p>

      <h2>3. Procedure</h2>
      <p>Step 1: Initial preparation...</p>
      <p>Step 2: Execution...</p>
      <p>Step 3: Completion...</p>
    `
  }
};

export function getMilitaryTemplateContent(templateId: string): string {
  const template = militaryDocumentTemplates[templateId as keyof typeof militaryDocumentTemplates];
  return template ? template.content : '<h1>New Document</h1><p>Start typing your content here...</p>';
}

export function getMilitaryTemplateName(templateId: string): string {
  const template = militaryDocumentTemplates[templateId as keyof typeof militaryDocumentTemplates];
  return template ? template.name : 'Blank Document';
}

export function getAllMilitaryTemplates() {
  return Object.entries(militaryDocumentTemplates).map(([id, template]) => ({
    id,
    name: template.name,
    description: template.description
  }));
}