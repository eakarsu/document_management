// Import critical templates
import { criticalTemplates } from './criticalPubOneTemplates';
import { militaryDocumentTemplates } from './militaryDocumentTemplates';
import * as fs from 'fs';
import * as path from 'path';

// Function to create DAFMAN header
function createDAFMANHeader(): string {
  return `
        <style>
  @page {
    size: letter;
    margin: 0.5in;
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Times New Roman', Times, serif;
    font-size: 11pt;
    line-height: 1.3;
    color: #000;
    padding: 20px;
  }

  /* Header table layout */
  .header-table {
    width: 100%;
    margin-bottom: 20px;
  }

  .header-table td {
    vertical-align: top;
    padding: 10px;
  }

  /* Left column */
  .left-column {
    width: 35%;
    text-align: center;
  }

  .by-order {
    font-weight: bold;
    font-size: 10pt;
    margin-bottom: 5px;
  }

  .secretary {
    font-weight: bold;
    font-size: 10pt;
    margin-bottom: 20px;
  }

  .seal-container img {
    width: 100px;
    height: 100px;
    display: block;
    margin: 0 auto;
  }

  /* Right column */
  .right-column {
    width: 65%;
    text-align: right;
  }

  .department {
    font-style: italic;
    font-size: 11pt;
    margin-bottom: 5px;
  }

  .doc-type {
    font-weight: bold;
    font-size: 11pt;
    margin-bottom: 20px;
  }

  .doc-date {
    font-size: 10pt;
    margin-bottom: 10px;
  }

  .doc-subtitle {
    font-style: italic;
    font-size: 10pt;
    margin-bottom: 10px;
  }

  .doc-title {
    font-weight: bold;
    font-size: 12pt;
    margin-bottom: 5px;
  }

  .doc-version {
    font-size: 10pt;
  }

  /* Compliance section */
  .compliance-section {
    text-align: center;
    font-weight: bold;
    font-size: 10pt;
    margin: 30px 0;
    padding: 10px 0;
    border-top: 2px solid #000;
    border-bottom: 2px solid #000;
  }

  /* Info table */
  .info-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
  }

  .info-table td {
    padding: 8px;
    border-top: 1px solid #000;
    font-size: 10pt;
    vertical-align: top;
  }

  .info-label {
    font-weight: bold;
    width: 20%;
  }

  .info-value {
    width: 80%;
  }

  /* Bottom section */
  .bottom-section {
    display: flex;
    justify-content: space-between;
    margin-top: 20px;
    padding-top: 10px;
    border-top: 1px solid #000;
  }

  .opr-section {
    font-size: 10pt;
  }

  .certified-section {
    text-align: right;
    font-size: 10pt;
  }

  .pages-section {
    text-align: right;
    font-size: 10pt;
  }
</style>


<table class="header-table">
  <tr>
    <td class="left-column">
      <div class="by-order">BY ORDER OF THE</div>
      <div class="secretary">SECRETARY OF THE AIR FORCE</div>
      <div class="seal-container">
        <img src="http://localhost:3000/images/air-force-seal.png" alt="Official Seal">
      </div>
    </td>
    <td class="right-column">
      <div class="department">DEPARTMENT OF THE AIR FORCE</div>
      <div class="doc-type">DEPARTMENT OF THE AIR FORCE MANUAL DAFMAN-2618</div>
      <div class="doc-date">${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()}</div>
      <div class="doc-subtitle">The Enlisted Force Structure</div>
      <div class="doc-title">AIRMAN AND FAMILY READINESS</div>
      <div class="doc-version">Version 1.0</div>
    </td>
  </tr>
</table>

<div class="compliance-section">
  COMPLIANCE WITH THIS PUBLICATION IS MANDATORY
</div>

<table class="info-table">
  <tr>
    <td class="info-label">DISTRIBUTION:</td>
    <td class="info-value">DISTRIBUTION STATEMENT A: Approved for public release; distribution unlimited</td>
  </tr>
  <tr>
    <td class="info-label">ACCESSIBILITY:</td>
    <td class="info-value">Publications and forms are available on the e-Publishing website at http://www.e-publishing.af.mil</td>
  </tr>
  <tr>
    <td class="info-label">RELEASABILITY:</td>
    <td class="info-value">There are no releasability restrictions on this publication.</td>
  </tr>
  <tr>
    <td class="info-label">EFFECTIVE DATE:</td>
    <td class="info-value" colspan="2">
      <div style="display: flex; justify-content: space-between;">
        <span>${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()}</span>
        <span style="font-weight: bold; white-space: nowrap;">REVIEW DATE: ${new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()}</span>
      </div>
    </td>
  </tr>
  <tr>
    <td class="info-label">POC:</td>
    <td class="info-value">Lt Col Smith, John A.<br>
    DSN: 555-1234 | Commercial: (555) 555-1234<br>
    Email: john.a.smith@us.af.mil</td>
  </tr>
</table>

<table style="width: 100%; margin-top: 20px; border-top: 1px solid #000;">
  <tr>
    <td style="width: 33%; padding-top: 10px; font-size: 10pt;">
      <strong>OPR:</strong> SAF/IG
    </td>
    <td style="width: 33%; text-align: center; padding-top: 10px; font-size: 10pt;">
    </td>
    <td style="width: 33%; text-align: right; padding-top: 10px; font-size: 10pt;">
      Certified by: AF/CV<br>
      (General Larry O. Spencer)<br>
      <br>
      Pages: 5
    </td>
  </tr>
</table>
`;
}

// Function to combine header with content
function createDocumentWithHeader(templateId: string, content: string): string {
  // For now, just add DAFMAN header to DAFMAN templates
  if (templateId === 'dafman' || templateId === 'dafpd') {
    return createDAFMANHeader() + `
        <div style="page-break-before: always; margin-top: 2in;">
          ${content}
        </div>
      `;
  }
  return content;
}

// Document templates with full content - combining all template sources
export const documentTemplates = {
  // CRITICAL TEMPLATES - From PubOne Requirements
  'comment-resolution-matrix': {
    name: criticalTemplates['comment-resolution-matrix'].name,
    content: criticalTemplates['comment-resolution-matrix'].content
  },
  'af-form-673': {
    name: criticalTemplates['af-form-673'].name,
    content: criticalTemplates['af-form-673'].content
  },
  'supplement-template': {
    name: criticalTemplates['supplement-template'].name,
    content: criticalTemplates['supplement-template'].content
  },
  'o6-gs15-coordination': {
    name: criticalTemplates['o6-gs15-coordination'].name,
    content: criticalTemplates['o6-gs15-coordination'].content
  },
  '2-letter-coordination': {
    name: criticalTemplates['2-letter-coordination'].name,
    content: criticalTemplates['2-letter-coordination'].content
  },
  'legal-coordination': {
    name: criticalTemplates['legal-coordination'].name,
    content: criticalTemplates['legal-coordination'].content
  },
  
  // HIGH PRIORITY TEMPLATES
  'dafpd-template': {
    name: criticalTemplates['dafpd-template'].name,
    content: createDocumentWithHeader('dafpd', criticalTemplates['dafpd-template'].content)
  },
  'dafman-template': {
    name: criticalTemplates['dafman-template'].name,
    content: createDocumentWithHeader('dafman', criticalTemplates['dafman-template'].content)
  },
  'guidance-memorandum': {
    name: criticalTemplates['guidance-memorandum'].name,
    content: criticalTemplates['guidance-memorandum'].content
  },
  'waiver-request': {
    name: criticalTemplates['waiver-request'].name,
    content: criticalTemplates['waiver-request'].content
  },
  
  // EXISTING TEMPLATES
  'air-force-manual': {
    name: 'Air Force Technical Manual',
    content: createDocumentWithHeader('af-manual', `
      <h2>Chapter 1: Introduction</h2>
      <p>This document provides comprehensive guidance for Air Force personnel regarding operational procedures and best practices.</p>
      
      <h3>1.1 Purpose</h3>
      <p>The purpose of this manual is to establish standardized procedures across all Air Force installations. This ensures consistency, safety, and operational excellence.</p>
      
      <h3>1.2 Scope</h3>
      <p>This manual applies to all active duty, reserve, and guard personnel involved in:</p>
      <ul>
        <li>Flight operations</li>
        <li>Maintenance procedures</li>
        <li>Safety protocols</li>
        <li>Emergency response</li>
      </ul>
      
      <h2>Chapter 2: Safety Procedures</h2>
      <p><strong>Safety is paramount</strong> in all Air Force operations. Personnel must adhere to the following guidelines:</p>
      
      <table>
        <tr>
          <th>Risk Level</th>
          <th>Response Protocol</th>
          <th>Authorization Required</th>
        </tr>
        <tr>
          <td>Low</td>
          <td>Standard procedures</td>
          <td>Supervisor</td>
        </tr>
        <tr>
          <td>Medium</td>
          <td>Enhanced safety measures</td>
          <td>Flight Chief</td>
        </tr>
        <tr>
          <td>High</td>
          <td>Special protocols</td>
          <td>Commander</td>
        </tr>
      </table>
      
      <blockquote>
        <p>"Excellence in all we do" - This core value drives our commitment to safety and operational excellence.</p>
      </blockquote>
      
      <h3>2.1 Personal Protective Equipment</h3>
      <p>All personnel must wear appropriate PPE including:</p>
      <ol>
        <li>Safety glasses</li>
        <li>Hearing protection</li>
        <li>Steel-toed boots</li>
        <li>High-visibility vests when on flightline</li>
      </ol>
      
      <p><em>Document classification: For Official Use Only (FOUO)</em></p>
    `)
  },
  'operational-plan': {
    name: 'Operational Planning Document',
    content: `
      <h1>Operational Planning Document</h1>
      <h2>Executive Summary</h2>
      <p>This operational plan outlines the strategic objectives, tactical approaches, and resource allocation for the upcoming fiscal period.</p>
      
      <h2>1. Mission Statement</h2>
      <p>To provide superior air power capabilities while maintaining the highest standards of readiness, safety, and efficiency.</p>
      
      <h2>2. Strategic Objectives</h2>
      <ul>
        <li><strong>Objective 1:</strong> Enhance operational readiness through advanced training programs</li>
        <li><strong>Objective 2:</strong> Improve maintenance efficiency by 15% over the next quarter</li>
        <li><strong>Objective 3:</strong> Strengthen inter-unit coordination and communication</li>
      </ul>
      
      <h2>3. Resource Requirements</h2>
      <table>
        <tr>
          <th>Resource Type</th>
          <th>Current Status</th>
          <th>Required</th>
          <th>Gap Analysis</th>
        </tr>
        <tr>
          <td>Personnel</td>
          <td>85%</td>
          <td>100%</td>
          <td>15% shortage</td>
        </tr>
        <tr>
          <td>Equipment</td>
          <td>92%</td>
          <td>100%</td>
          <td>8% shortage</td>
        </tr>
        <tr>
          <td>Training Hours</td>
          <td>75%</td>
          <td>100%</td>
          <td>25% shortage</td>
        </tr>
      </table>
      
      <h2>4. Timeline and Milestones</h2>
      <p>Implementation will proceed in three phases:</p>
      <ol>
        <li><strong>Phase 1 (Months 1-2):</strong> Assessment and preparation</li>
        <li><strong>Phase 2 (Months 3-4):</strong> Implementation and training</li>
        <li><strong>Phase 3 (Months 5-6):</strong> Evaluation and adjustment</li>
      </ol>
    `
  },
  'safety-bulletin': {
    name: 'Safety Bulletin',
    content: `
      <h1>Safety Bulletin</h1>
      <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
      <p><strong>Priority:</strong> <span style="color: red;">HIGH</span></p>
      
      <h2>Subject: Updated Safety Protocols</h2>
      
      <h3>1. Immediate Actions Required</h3>
      <p>All personnel must review and acknowledge the following safety updates within 48 hours:</p>
      <ul>
        <li>New personal protective equipment requirements</li>
        <li>Updated emergency response procedures</li>
        <li>Revised hazardous material handling protocols</li>
      </ul>
      
      <h3>2. Background</h3>
      <p>Recent safety assessments have identified areas requiring immediate attention to maintain our exemplary safety record.</p>
      
      <h3>3. Detailed Requirements</h3>
      <table>
        <tr>
          <th>Area</th>
          <th>Previous Requirement</th>
          <th>New Requirement</th>
        </tr>
        <tr>
          <td>Flightline Operations</td>
          <td>Standard PPE</td>
          <td>Enhanced PPE with reflective markers</td>
        </tr>
        <tr>
          <td>Maintenance Bay</td>
          <td>Single spotter</td>
          <td>Dual spotter system</td>
        </tr>
      </table>
      
      <h3>4. Compliance</h3>
      <p>Unit commanders are responsible for ensuring 100% compliance by all assigned personnel.</p>
      
      <p><strong>Point of Contact:</strong> Safety Office, Ext. 5555</p>
    `
  },
  'meeting-minutes': {
    name: 'Meeting Minutes',
    content: `
      <h1>Meeting Minutes</h1>
      <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
      <p><strong>Time:</strong> 0900-1100 hours</p>
      <p><strong>Location:</strong> Conference Room A</p>
      
      <h2>Attendees</h2>
      <ul>
        <li>Col. Smith - Presiding</li>
        <li>Lt. Col. Johnson - Operations</li>
        <li>Maj. Williams - Maintenance</li>
        <li>Capt. Brown - Safety</li>
      </ul>
      
      <h2>Agenda Items</h2>
      
      <h3>1. Operational Readiness Review</h3>
      <p><strong>Discussion:</strong> Current readiness levels were reviewed. Overall unit readiness stands at 87%.</p>
      <p><strong>Action Items:</strong></p>
      <ul>
        <li>Lt. Col. Johnson to submit detailed readiness report by Friday</li>
        <li>Maintenance to prioritize critical equipment repairs</li>
      </ul>
      
      <h3>2. Safety Update</h3>
      <p><strong>Discussion:</strong> No reportable incidents in the past 30 days. Safety training completion rate at 95%.</p>
      <p><strong>Decision:</strong> Continue current safety protocols with minor adjustments to training schedule.</p>
      
      <h3>3. Resource Allocation</h3>
      <table>
        <tr>
          <th>Department</th>
          <th>Current Allocation</th>
          <th>Requested</th>
          <th>Approved</th>
        </tr>
        <tr>
          <td>Operations</td>
          <td>$500K</td>
          <td>$600K</td>
          <td>$550K</td>
        </tr>
        <tr>
          <td>Maintenance</td>
          <td>$300K</td>
          <td>$400K</td>
          <td>$350K</td>
        </tr>
      </table>
      
      <h2>Next Meeting</h2>
      <p>Scheduled for ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()} at 0900 hours.</p>
    `
  },
  'blank': {
    name: 'Blank Document',
    content: `
      <h1>New Document</h1>
      <p>Start typing your content here...</p>
    `
  },

  // Military Document Templates
  ...militaryDocumentTemplates
};

export function getTemplateContent(templateId: string): string {
  const headersDir = path.join(__dirname, '../../headers');
  const headerFile = path.join(headersDir, `${templateId}-header.html`);

  // Check if it's a military template
  const militaryTemplate = militaryDocumentTemplates[templateId as keyof typeof militaryDocumentTemplates];
  if (militaryTemplate && fs.existsSync(headerFile)) {
    // For military templates with header files, combine header with content
    const header = fs.readFileSync(headerFile, 'utf8');
    // Extract styles and body content from the full HTML header
    const styleMatch = header.match(/<style>([\s\S]*?)<\/style>/);
    const bodyMatch = header.match(/<body>([\s\S]*)<\/body>/);

    if (styleMatch && bodyMatch) {
      // Return styles + header body + template content
      return `<style>${styleMatch[1]}</style>\n${bodyMatch[1]}${militaryTemplate.content}`;
    } else if (bodyMatch) {
      // Return header body + template content (which only has document content, no header)
      return bodyMatch[1] + militaryTemplate.content;
    }
    return militaryTemplate.content;
  } else if (militaryTemplate) {
    // Military template without header file
    return militaryTemplate.content;
  }

  // For non-military templates, check if there's a generated header

  if (fs.existsSync(headerFile)) {
    // Load the header from generated files
    const header = fs.readFileSync(headerFile, 'utf8');
    const template = documentTemplates[templateId as keyof typeof documentTemplates];
    const baseContent = template ? template.content : documentTemplates.blank.content;

    // Extract styles and body from header
    const styleMatch = header.match(/<style>([\s\S]*?)<\/style>/);
    const bodyMatch = header.match(/<body>([\s\S]*)<\/body>/);

    // Remove any existing styles/headers from base content to avoid duplication
    const contentWithoutHeader = baseContent.replace(/<style[\s\S]*?<\/style>/g, '')
      .replace(/<div class="classification-header"[\s\S]*?<\/div>/g, '')
      .replace(/<div class="air-force-document-header"[\s\S]*?<\/div>/g, '');

    if (styleMatch && bodyMatch) {
      // Combine styles + header body + content
      return `<style>${styleMatch[1]}</style>\n${bodyMatch[1]}${contentWithoutHeader}`;
    } else if (bodyMatch) {
      // Combine header body with content
      return bodyMatch[1] + contentWithoutHeader;
    }
    // Fallback to original behavior
    return header + contentWithoutHeader;
  }

  // Fallback to regular template content
  const template = documentTemplates[templateId as keyof typeof documentTemplates];
  return template ? template.content : documentTemplates.blank.content;
}

export function getTemplateName(templateId: string): string {
  const template = documentTemplates[templateId as keyof typeof documentTemplates];
  return template ? template.name : 'Blank Document';
}