// Document templates with full content
export const documentTemplates = {
  'air-force-manual': {
    name: 'Air Force Technical Manual',
    content: `
      <h1>Air Force Technical Manual</h1>
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
    `
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
  }
};

export function getTemplateContent(templateId: string): string {
  const template = documentTemplates[templateId as keyof typeof documentTemplates];
  return template ? template.content : documentTemplates.blank.content;
}

export function getTemplateName(templateId: string): string {
  const template = documentTemplates[templateId as keyof typeof documentTemplates];
  return template ? template.name : 'Blank Document';
}