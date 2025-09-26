/**
 * Critical PubOne Templates Implementation
 * These are the most important templates required for the AF publication system
 */

export interface CriticalTemplate {
  id: string;
  name: string;
  type: 'form' | 'document' | 'matrix';
  content: string;
  metadata?: Record<string, any>;
}

export const criticalTemplates: Record<string, CriticalTemplate> = {
  // 1. COMMENT RESOLUTION MATRIX (CRM) - The most critical coordination tool
  'comment-resolution-matrix': {
    id: 'comment-resolution-matrix',
    name: 'Comment Resolution Matrix (CRM)',
    type: 'matrix',
    content: `
      <style>
        .crm-template table { width: 100%; border-collapse: collapse; }
        .crm-template th { background-color: #003366; color: white; padding: 8px; }
        .crm-template td { border: 1px solid #ddd; padding: 6px; }
        .line-ref { font-weight: bold; color: #0066cc; }
        .para-ref { font-weight: bold; color: #006600; }
        .page-ref { font-weight: bold; color: #cc0000; }
      </style>
      <div class="crm-template">
        <h1>Comment Resolution Matrix (CRM)</h1>
        <div class="crm-header">
          <table class="header-info">
            <tr>
              <td><strong>Publication Title:</strong> <span contenteditable="true">[Enter Publication Title]</span></td>
              <td><strong>Publication Number:</strong> <span contenteditable="true">[Enter Pub Number]</span></td>
            </tr>
            <tr>
              <td><strong>OPR:</strong> <span contenteditable="true">[Enter OPR Office]</span></td>
              <td><strong>Coordination Level:</strong> <span contenteditable="true">[O6/GS15 | 2-Letter | Legal]</span></td>
            </tr>
            <tr>
              <td><strong>Suspense Date:</strong> <span contenteditable="true">[Enter Date]</span></td>
              <td><strong>Extension Requested:</strong> <span contenteditable="true">[Yes/No]</span></td>
            </tr>
          </table>
        </div>

        <h2>Coordination Comments and Resolutions</h2>
        <table class="crm-matrix" border="1">
          <thead>
            <tr>
              <th width="4%">Comment #</th>
              <th width="5%">Page</th>
              <th width="8%">Paragraph</th>
              <th width="5%">Line</th>
              <th width="10%">Org</th>
              <th width="10%">Reviewer</th>
              <th width="18%">Comment</th>
              <th width="18%">OPR Response</th>
              <th width="7%">Resolution</th>
              <th width="10%">Concurrence</th>
              <th width="5%">Date</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td contenteditable="true" class="page-ref">1</td>
              <td contenteditable="true" class="para-ref">2.1.1</td>
              <td contenteditable="true" class="line-ref">5-7</td>
              <td contenteditable="true">[Org]</td>
              <td contenteditable="true">[Name]</td>
              <td contenteditable="true">[Enter specific comment about text at this location]</td>
              <td contenteditable="true">[OPR response to comment]</td>
              <td>
                <select>
                  <option>Pending</option>
                  <option>Accept</option>
                  <option>Reject</option>
                  <option>Accept with Modification</option>
                </select>
              </td>
              <td>
                <select>
                  <option>Pending</option>
                  <option>Concur</option>
                  <option>Non-concur</option>
                  <option>Concur with Comment</option>
                </select>
              </td>
              <td contenteditable="true">[Date]</td>
            </tr>
            <!-- Example row 2 -->
            <tr>
              <td>2</td>
              <td contenteditable="true" class="page-ref">2</td>
              <td contenteditable="true" class="para-ref">3.1</td>
              <td contenteditable="true" class="line-ref">12</td>
              <td contenteditable="true">[Org]</td>
              <td contenteditable="true">[Name]</td>
              <td contenteditable="true">[Comment]</td>
              <td contenteditable="true">[Response]</td>
              <td>
                <select>
                  <option>Pending</option>
                  <option>Accept</option>
                  <option>Reject</option>
                  <option>Accept with Modification</option>
                </select>
              </td>
              <td>
                <select>
                  <option>Pending</option>
                  <option>Concur</option>
                  <option>Non-concur</option>
                  <option>Concur with Comment</option>
                </select>
              </td>
              <td contenteditable="true">[Date]</td>
            </tr>
            <!-- Additional rows will be added dynamically -->
          </tbody>
        </table>

        <div class="crm-summary">
          <h3>Summary Statistics</h3>
          <table>
            <tr>
              <td>Total Comments:</td>
              <td><strong>0</strong></td>
              <td>Resolved:</td>
              <td><strong>0</strong></td>
              <td>Pending:</td>
              <td><strong>0</strong></td>
            </tr>
            <tr>
              <td>Concur:</td>
              <td><strong>0</strong></td>
              <td>Non-concur:</td>
              <td><strong>0</strong></td>
              <td>Concur with Comment:</td>
              <td><strong>0</strong></td>
            </tr>
          </table>
        </div>

        <div class="crm-notes">
          <h3>Additional Notes</h3>
          <textarea rows="4" style="width: 100%;" placeholder="Enter any additional coordination notes or special instructions..."></textarea>
        </div>
      </div>
    `,
    metadata: {
      exportFormats: ['excel', 'pdf', 'csv'],
      trackChanges: true,
      versionControl: true,
      notifications: true
    }
  },

  // 2. AF FORM 673 - Official Coordination and Approval Record
  'af-form-673': {
    id: 'af-form-673',
    name: 'AF Form 673 - Air Force Publication/Form Action Request',
    type: 'form',
    content: `
      <div class="af-form-673">
        <div class="form-header">
          <img src="/af-seal.png" alt="AF Seal" style="width: 60px; height: 60px; float: left;">
          <h1>AF FORM 673</h1>
          <h2>AIR FORCE PUBLICATION/FORM ACTION REQUEST</h2>
          <p style="font-size: 10px;">PRIVACY ACT STATEMENT: Authority: 10 U.S.C. 8013, 44 U.S.C. 3101</p>
        </div>

        <div class="form-section">
          <h3>SECTION I - PUBLICATION/FORM IDENTIFICATION</h3>
          <table border="1" style="width: 100%;">
            <tr>
              <td colspan="2"><strong>1. TYPE OF ACTION</strong></td>
              <td colspan="2">
                <input type="checkbox"> New Publication
                <input type="checkbox"> Revision
                <input type="checkbox"> Change
                <input type="checkbox"> Supplement
                <input type="checkbox"> Rescind
              </td>
            </tr>
            <tr>
              <td><strong>2. PUBLICATION NUMBER</strong></td>
              <td contenteditable="true">[Enter Number]</td>
              <td><strong>3. PUBLICATION DATE</strong></td>
              <td contenteditable="true">[Enter Date]</td>
            </tr>
            <tr>
              <td colspan="4">
                <strong>4. PUBLICATION TITLE</strong><br>
                <div contenteditable="true" style="min-height: 30px;">[Enter Complete Title]</div>
              </td>
            </tr>
            <tr>
              <td><strong>5. OPR (Office Symbol)</strong></td>
              <td contenteditable="true">[Office Symbol]</td>
              <td><strong>6. OPR DSN/Commercial</strong></td>
              <td contenteditable="true">[Phone Number]</td>
            </tr>
          </table>
        </div>

        <div class="form-section">
          <h3>SECTION II - COORDINATION</h3>
          <table border="1" style="width: 100%;">
            <thead>
              <tr style="background-color: #f0f0f0;">
                <th width="5%">#</th>
                <th width="25%">Office/Organization</th>
                <th width="20%">Name/Rank/Grade</th>
                <th width="15%">Date Sent</th>
                <th width="15%">Date Returned</th>
                <th width="10%">Concur</th>
                <th width="10%">Non-Concur</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td contenteditable="true">AF/JA (Legal)</td>
                <td contenteditable="true">[Name/Rank]</td>
                <td contenteditable="true">[Date]</td>
                <td contenteditable="true">[Date]</td>
                <td style="text-align: center;"><input type="checkbox"></td>
                <td style="text-align: center;"><input type="checkbox"></td>
              </tr>
              <tr>
                <td>2</td>
                <td contenteditable="true">[Organization]</td>
                <td contenteditable="true">[Name/Rank]</td>
                <td contenteditable="true">[Date]</td>
                <td contenteditable="true">[Date]</td>
                <td style="text-align: center;"><input type="checkbox"></td>
                <td style="text-align: center;"><input type="checkbox"></td>
              </tr>
              <tr>
                <td>3</td>
                <td contenteditable="true">[Organization]</td>
                <td contenteditable="true">[Name/Rank]</td>
                <td contenteditable="true">[Date]</td>
                <td contenteditable="true">[Date]</td>
                <td style="text-align: center;"><input type="checkbox"></td>
                <td style="text-align: center;"><input type="checkbox"></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="form-section">
          <h3>SECTION III - CERTIFICATION AND APPROVAL</h3>
          <table border="1" style="width: 100%;">
            <tr>
              <td width="50%">
                <strong>7. CERTIFYING OFFICIAL</strong><br>
                Name: <span contenteditable="true">[Name]</span><br>
                Title: <span contenteditable="true">[Title]</span><br>
                Signature: _________________________<br>
                Date: <span contenteditable="true">[Date]</span>
              </td>
              <td width="50%">
                <strong>8. APPROVING AUTHORITY</strong><br>
                Name: <span contenteditable="true">[Name]</span><br>
                Title: <span contenteditable="true">[Title]</span><br>
                Signature: _________________________<br>
                Date: <span contenteditable="true">[Date]</span>
              </td>
            </tr>
          </table>
        </div>

        <div class="form-section">
          <h3>SECTION IV - AFDPO USE ONLY</h3>
          <table border="1" style="width: 100%;">
            <tr>
              <td><strong>Date Received:</strong> ___________</td>
              <td><strong>Date Published:</strong> ___________</td>
              <td><strong>Control Number:</strong> ___________</td>
            </tr>
          </table>
        </div>
      </div>
    `,
    metadata: {
      formNumber: 'AF673',
      requiredSignatures: ['certifying-official', 'approving-authority'],
      digitalSignatureEnabled: true
    }
  },

  // 3. SUPPLEMENT TEMPLATE - For lower-level organizations
  'supplement-template': {
    id: 'supplement-template',
    name: 'Supplement Template',
    type: 'document',
    content: `
      <div class="supplement-template">
        <div class="header">
          <p style="text-align: center;">
            <strong>BY ORDER OF THE COMMANDER</strong><br>
            <span contenteditable="true">[ORGANIZATION NAME]</span>
          </p>
          <h1 style="text-align: center;">
            <span contenteditable="true">[PARENT PUB NUMBER]</span>_<span contenteditable="true">[ORG]</span>SUP
          </h1>
          <p style="text-align: center;">
            <span contenteditable="true">[Date]</span>
          </p>
          <h2 style="text-align: center;">
            <span contenteditable="true">[PARENT PUBLICATION TITLE]</span><br>
            <span style="font-size: 0.9em;">SUPPLEMENT</span>
          </h2>
        </div>

        <div class="compliance-statement">
          <p><strong>COMPLIANCE WITH THIS PUBLICATION IS MANDATORY</strong></p>
        </div>

        <div class="opening">
          <p><strong>ACCESSIBILITY:</strong> Publications and forms are available on the e-Publishing website at www.e-Publishing.af.mil for downloading or ordering.</p>
          <p><strong>RELEASABILITY:</strong> There are no releasability restrictions on this publication.</p>
        </div>

        <div class="metadata-table">
          <table>
            <tr>
              <td>OPR:</td>
              <td contenteditable="true">[Office Symbol]</td>
              <td>Certified by:</td>
              <td contenteditable="true">[Office Symbol]</td>
            </tr>
            <tr>
              <td>Supersedes:</td>
              <td contenteditable="true">[If applicable]</td>
              <td>Pages:</td>
              <td contenteditable="true">[Number]</td>
            </tr>
          </table>
        </div>

        <div class="supplement-notice" style="border: 2px solid #000; padding: 10px; margin: 20px 0;">
          <p><strong>This supplement implements and extends the guidance in <span contenteditable="true">[Parent Publication Number and Title]</span>.</strong></p>
          <p>It applies to <span contenteditable="true">[specify applicability]</span>. Ensure all records created as a result of processes prescribed in this publication are maintained in accordance with AFMAN 33-363.</p>
        </div>

        <div class="summary-of-changes">
          <p><strong>SUMMARY OF CHANGES</strong></p>
          <p contenteditable="true">This document is substantially revised and must be completely reviewed. Major changes include...</p>
        </div>

        <div class="content">
          <h2>Chapter 1—GENERAL INFORMATION</h2>
          
          <p><strong>1.1. Purpose.</strong> <span contenteditable="true">[Original text from parent publication]</span></p>
          
          <p><strong>1.1.1. (Added)</strong> <span contenteditable="true" style="background-color: #ffffcc;">[New supplemental content specific to this organization]</span></p>
          
          <p><strong>1.2. Applicability.</strong> <span contenteditable="true">[Original text from parent publication]</span></p>
          
          <p><strong>1.2.1. (Added)</strong> <span contenteditable="true" style="background-color: #ffffcc;">[Additional applicability requirements for this organization]</span></p>
          
          <h3>Section 1A—Responsibilities (Added)</h3>
          
          <p><strong>1.3. (Added) Unit Commander Responsibilities.</strong> <span contenteditable="true" style="background-color: #ffffcc;">[Specific responsibilities added by supplementing organization]</span></p>
          
          <p><strong>1.4. Additional Requirements.</strong> <span contenteditable="true">[Original text]</span></p>
          
          <p><strong>1.4.2.1. (Added)</strong> <span contenteditable="true" style="background-color: #ffffcc;">[Subordinate paragraph added to existing paragraph]</span></p>

          <div class="added-notice" style="margin: 20px 0; padding: 10px; background-color: #f0f8ff; border-left: 4px solid #0066cc;">
            <p><strong>Note:</strong> All paragraphs marked with "(Added)" are supplemental content specific to this organization and do not appear in the parent publication.</p>
          </div>

          <h2>Chapter 2—PROCEDURES</h2>
          
          <p><strong>2.1. Standard Procedures.</strong> <span contenteditable="true">[Original procedures from parent publication]</span></p>
          
          <table border="1" style="width: 100%; margin: 15px 0;">
            <caption><strong>Table 2.1. (Added) Local Processing Times</strong></caption>
            <tr style="background-color: #f0f0f0;">
              <th>Process</th>
              <th>Standard Time</th>
              <th>Local Requirement</th>
              <th>POC</th>
            </tr>
            <tr>
              <td contenteditable="true">Coordination</td>
              <td contenteditable="true">10 days</td>
              <td contenteditable="true">7 days</td>
              <td contenteditable="true">Org/Office</td>
            </tr>
          </table>

          <h2>Chapter 3—ADDITIONAL LOCAL PROCEDURES (Added)</h2>
          <p contenteditable="true" style="background-color: #ffffcc;">[This entire chapter is added by the supplementing organization]</p>
        </div>

        <div class="attachments">
          <h2>Attachment 1</h2>
          <p><strong>GLOSSARY OF REFERENCES AND SUPPORTING INFORMATION</strong></p>
          
          <h3>References (Added)</h3>
          <p contenteditable="true">[Local references added to parent publication references]</p>
          
          <h3>Abbreviations and Acronyms (Added)</h3>
          <p contenteditable="true">[Local abbreviations added to parent publication list]</p>
        </div>
      </div>
    `,
    metadata: {
      parentPubRequired: true,
      addedParagraphHighlight: true,
      localAuthority: true
    }
  },

  // 4. O6/GS15 COORDINATION TEMPLATE
  'o6-gs15-coordination': {
    id: 'o6-gs15-coordination',
    name: 'O6/GS15 Level Coordination Template',
    type: 'form',
    content: `
      <div class="coordination-template o6-gs15">
        <h1>O6/GS15 LEVEL COORDINATION</h1>
        <p style="text-align: center; font-style: italic;">Subject Matter Expert Review</p>
        
        <div class="coordination-header">
          <table style="width: 100%;">
            <tr>
              <td><strong>TO:</strong> <span contenteditable="true">[Coordinating Office/Organization]</span></td>
              <td><strong>DATE:</strong> <span contenteditable="true">[Current Date]</span></td>
            </tr>
            <tr>
              <td><strong>FROM:</strong> <span contenteditable="true">[OPR Office Symbol]</span></td>
              <td><strong>SUSPENSE:</strong> <span contenteditable="true" style="color: red;">[Suspense Date]</span></td>
            </tr>
            <tr>
              <td colspan="2"><strong>SUBJECT:</strong> O6/GS15 Level Coordination for <span contenteditable="true">[Publication Number and Title]</span></td>
            </tr>
          </table>
        </div>

        <div class="instructions">
          <h2>COORDINATION INSTRUCTIONS</h2>
          <ol>
            <li>Review the attached draft publication for technical accuracy and compliance with applicable directives.</li>
            <li>Provide subject matter expert (SME) comments using the attached Comment Resolution Matrix (CRM).</li>
            <li>Focus review on:
              <ul>
                <li>Technical accuracy and completeness</li>
                <li>Operational feasibility</li>
                <li>Resource implications</li>
                <li>Conflicts with existing guidance</li>
              </ul>
            </li>
            <li>Return completed CRM NLT <span style="color: red; font-weight: bold;">[Suspense Date]</span></li>
            <li>Extension requests must be submitted within 48 hours of receipt.</li>
          </ol>
        </div>

        <div class="reviewer-section">
          <h2>REVIEWER INFORMATION</h2>
          <table border="1" style="width: 100%;">
            <tr>
              <td><strong>Reviewer Name:</strong></td>
              <td contenteditable="true">[Name]</td>
              <td><strong>Rank/Grade:</strong></td>
              <td contenteditable="true">[O6/GS15]</td>
            </tr>
            <tr>
              <td><strong>Office Symbol:</strong></td>
              <td contenteditable="true">[Office]</td>
              <td><strong>DSN/Commercial:</strong></td>
              <td contenteditable="true">[Phone]</td>
            </tr>
            <tr>
              <td><strong>Email:</strong></td>
              <td colspan="3" contenteditable="true">[Email Address]</td>
            </tr>
          </table>
        </div>

        <div class="review-checklist">
          <h2>REVIEW CHECKLIST</h2>
          <table border="1" style="width: 100%;">
            <tr>
              <th>Review Area</th>
              <th>Reviewed</th>
              <th>Comments</th>
            </tr>
            <tr>
              <td>Technical Accuracy</td>
              <td style="text-align: center;"><input type="checkbox"></td>
              <td contenteditable="true"></td>
            </tr>
            <tr>
              <td>Operational Feasibility</td>
              <td style="text-align: center;"><input type="checkbox"></td>
              <td contenteditable="true"></td>
            </tr>
            <tr>
              <td>Resource Requirements</td>
              <td style="text-align: center;"><input type="checkbox"></td>
              <td contenteditable="true"></td>
            </tr>
            <tr>
              <td>Regulatory Compliance</td>
              <td style="text-align: center;"><input type="checkbox"></td>
              <td contenteditable="true"></td>
            </tr>
          </table>
        </div>

        <div class="recommendation">
          <h2>COORDINATION RECOMMENDATION</h2>
          <p><strong>Based on my review, I:</strong></p>
          <input type="radio" name="recommendation" id="concur"> <label for="concur">CONCUR without comment</label><br>
          <input type="radio" name="recommendation" id="concur-comment"> <label for="concur-comment">CONCUR with comments (see CRM)</label><br>
          <input type="radio" name="recommendation" id="nonconcur"> <label for="nonconcur">NON-CONCUR (justification in CRM required)</label><br>
        </div>

        <div class="signature-block">
          <table style="width: 100%; margin-top: 30px;">
            <tr>
              <td style="width: 50%;">
                <p>_________________________________<br>
                Signature<br>
                Date: _____________</p>
              </td>
              <td style="width: 50%;">
                <p contenteditable="true">
                [NAME, Rank, USAF]<br>
                [Title]<br>
                [Organization]
                </p>
              </td>
            </tr>
          </table>
        </div>
      </div>
    `
  },

  // 5. 2-LETTER COORDINATION TEMPLATE
  '2-letter-coordination': {
    id: '2-letter-coordination',
    name: '2-Letter Level Coordination Template',
    type: 'form',
    content: `
      <div class="coordination-template two-letter">
        <h1>2-LETTER COORDINATION</h1>
        <p style="text-align: center; font-style: italic;">Senior Leadership Review and Approval</p>
        
        <div class="executive-summary">
          <h2>EXECUTIVE SUMMARY</h2>
          <div style="border: 1px solid #ccc; padding: 10px; background-color: #f9f9f9;">
            <p><strong>Publication:</strong> <span contenteditable="true">[Publication Number and Title]</span></p>
            <p><strong>Purpose:</strong> <span contenteditable="true">[Brief description of publication purpose]</span></p>
            <p><strong>Key Changes:</strong> <span contenteditable="true">[Summary of major changes if revision]</span></p>
            <p><strong>Impact:</strong> <span contenteditable="true">[Expected organizational impact]</span></p>
          </div>
        </div>

        <div class="coordination-status">
          <h2>PRIOR COORDINATION STATUS</h2>
          <table border="1" style="width: 100%;">
            <tr style="background-color: #e8f4ff;">
              <th>Coordination Level</th>
              <th>Date Completed</th>
              <th>Result</th>
              <th>Outstanding Issues</th>
            </tr>
            <tr>
              <td>Legal Review</td>
              <td contenteditable="true">[Date]</td>
              <td contenteditable="true">Concur</td>
              <td contenteditable="true">None</td>
            </tr>
            <tr>
              <td>O6/GS15 SME Review</td>
              <td contenteditable="true">[Date]</td>
              <td contenteditable="true">Concur with comments</td>
              <td contenteditable="true">All resolved</td>
            </tr>
          </table>
        </div>

        <div class="leadership-review">
          <h2>SENIOR LEADERSHIP REVIEW</h2>
          
          <div style="border: 2px solid #0066cc; padding: 15px; margin: 20px 0;">
            <p><strong>TO:</strong> <span contenteditable="true">[2-Letter Organization (e.g., AF/A3)]</span></p>
            <p><strong>THROUGH:</strong> <span contenteditable="true">[Intermediate Routing if applicable]</span></p>
            <p><strong>FROM:</strong> <span contenteditable="true">[OPR Organization]</span></p>
            <p><strong>SUSPENSE:</strong> <span contenteditable="true" style="color: red; font-weight: bold;">[Date]</span></p>
          </div>

          <h3>ACTION REQUESTED</h3>
          <p>Request your review and coordination on the attached publication. All lower-level coordination has been completed, and comments have been adjudicated through the Comment Resolution Matrix process.</p>
          
          <h3>COORDINATION DECISION</h3>
          <table border="1" style="width: 100%;">
            <tr>
              <td style="width: 30%; text-align: center;">
                <input type="checkbox" style="transform: scale(1.5);">
                <br><strong>CONCUR</strong>
              </td>
              <td style="width: 35%; text-align: center;">
                <input type="checkbox" style="transform: scale(1.5);">
                <br><strong>CONCUR WITH COMMENTS</strong>
                <br><small>(See attached)</small>
              </td>
              <td style="width: 35%; text-align: center;">
                <input type="checkbox" style="transform: scale(1.5);">
                <br><strong>NON-CONCUR</strong>
                <br><small>(Justification required)</small>
              </td>
            </tr>
          </table>
        </div>

        <div class="leadership-comments">
          <h3>SENIOR LEADERSHIP COMMENTS</h3>
          <textarea style="width: 100%; height: 100px;" placeholder="Enter any strategic-level concerns, policy conflicts, or resource implications..."></textarea>
        </div>

        <div class="signature-authority">
          <h2>COORDINATION AUTHORITY</h2>
          <div style="border: 1px solid #000; padding: 20px; margin-top: 30px;">
            <p style="margin-bottom: 50px;">________________________________</p>
            <p contenteditable="true">
              [NAME, Rank/Grade]<br>
              [Title]<br>
              [2-Letter Organization]<br>
              Date: _____________
            </p>
          </div>
        </div>
      </div>
    `
  },

  // 6. LEGAL COORDINATION TEMPLATE
  'legal-coordination': {
    id: 'legal-coordination',
    name: 'Legal Coordination Template',
    type: 'form',
    content: `
      <div class="legal-coordination-template">
        <h1>LEGAL REVIEW AND COORDINATION</h1>
        <p style="text-align: center;"><strong>OFFICE OF THE JUDGE ADVOCATE (AF/JA)</strong></p>
        
        <div class="legal-header">
          <table style="width: 100%; background-color: #f0f0f0; padding: 10px;">
            <tr>
              <td><strong>PRIVILEGED AND CONFIDENTIAL</strong></td>
              <td style="text-align: right;"><strong>ATTORNEY-CLIENT COMMUNICATION</strong></td>
            </tr>
          </table>
        </div>

        <div class="publication-info">
          <h2>PUBLICATION UNDER REVIEW</h2>
          <table border="1" style="width: 100%;">
            <tr>
              <td><strong>Publication Number:</strong></td>
              <td contenteditable="true">[Number]</td>
              <td><strong>Date Received:</strong></td>
              <td contenteditable="true">[Date]</td>
            </tr>
            <tr>
              <td><strong>Publication Title:</strong></td>
              <td colspan="3" contenteditable="true">[Full Title]</td>
            </tr>
            <tr>
              <td><strong>OPR:</strong></td>
              <td contenteditable="true">[Office Symbol]</td>
              <td><strong>Suspense:</strong></td>
              <td contenteditable="true" style="color: red;">[Date]</td>
            </tr>
          </table>
        </div>

        <div class="legal-review-checklist">
          <h2>LEGAL REVIEW CHECKLIST</h2>
          <table border="1" style="width: 100%;">
            <tr style="background-color: #e8f4ff;">
              <th>Review Criteria</th>
              <th>Compliant</th>
              <th>Issue Found</th>
              <th>Comments</th>
            </tr>
            <tr>
              <td>Statutory Authority (10 U.S.C., etc.)</td>
              <td style="text-align: center;"><input type="checkbox"></td>
              <td style="text-align: center;"><input type="checkbox"></td>
              <td contenteditable="true"></td>
            </tr>
            <tr>
              <td>Constitutional Compliance</td>
              <td style="text-align: center;"><input type="checkbox"></td>
              <td style="text-align: center;"><input type="checkbox"></td>
              <td contenteditable="true"></td>
            </tr>
            <tr>
              <td>Federal Law Compliance</td>
              <td style="text-align: center;"><input type="checkbox"></td>
              <td style="text-align: center;"><input type="checkbox"></td>
              <td contenteditable="true"></td>
            </tr>
            <tr>
              <td>DoD Directive Compliance</td>
              <td style="text-align: center;"><input type="checkbox"></td>
              <td style="text-align: center;"><input type="checkbox"></td>
              <td contenteditable="true"></td>
            </tr>
            <tr>
              <td>Privacy Act Requirements</td>
              <td style="text-align: center;"><input type="checkbox"></td>
              <td style="text-align: center;"><input type="checkbox"></td>
              <td contenteditable="true"></td>
            </tr>
            <tr>
              <td>FOIA Compliance</td>
              <td style="text-align: center;"><input type="checkbox"></td>
              <td style="text-align: center;"><input type="checkbox"></td>
              <td contenteditable="true"></td>
            </tr>
            <tr>
              <td>Punitive Language Review</td>
              <td style="text-align: center;"><input type="checkbox"></td>
              <td style="text-align: center;"><input type="checkbox"></td>
              <td contenteditable="true"></td>
            </tr>
            <tr>
              <td>Labor Relations Impact</td>
              <td style="text-align: center;"><input type="checkbox"></td>
              <td style="text-align: center;"><input type="checkbox"></td>
              <td contenteditable="true"></td>
            </tr>
            <tr>
              <td>Environmental Compliance</td>
              <td style="text-align: center;"><input type="checkbox"></td>
              <td style="text-align: center;"><input type="checkbox"></td>
              <td contenteditable="true"></td>
            </tr>
            <tr>
              <td>International Law (if applicable)</td>
              <td style="text-align: center;"><input type="checkbox"></td>
              <td style="text-align: center;"><input type="checkbox"></td>
              <td contenteditable="true"></td>
            </tr>
          </table>
        </div>

        <div class="legal-concerns">
          <h2>LEGAL CONCERNS AND RECOMMENDATIONS</h2>
          <div style="border: 2px solid #cc0000; padding: 15px; background-color: #fff5f5;">
            <h3>Critical Legal Issues (Must Fix)</h3>
            <ol>
              <li contenteditable="true">[Issue and recommended resolution]</li>
            </ol>
          </div>
          
          <div style="border: 2px solid #ff9900; padding: 15px; background-color: #fff9e6; margin-top: 15px;">
            <h3>Legal Recommendations (Should Consider)</h3>
            <ol>
              <li contenteditable="true">[Recommendation for improvement]</li>
            </ol>
          </div>
        </div>

        <div class="legal-opinion">
          <h2>LEGAL OPINION</h2>
          <div style="border: 1px solid #000; padding: 20px; background-color: #f9f9f9;">
            <p><strong>Based on legal review, this office:</strong></p>
            <table style="width: 100%;">
              <tr>
                <td style="width: 33%; text-align: center;">
                  <input type="radio" name="legal-opinion" id="legally-sufficient">
                  <label for="legally-sufficient"><strong>LEGALLY SUFFICIENT</strong><br>No legal objection</label>
                </td>
                <td style="width: 33%; text-align: center;">
                  <input type="radio" name="legal-opinion" id="legally-sufficient-comments">
                  <label for="legally-sufficient-comments"><strong>LEGALLY SUFFICIENT WITH COMMENTS</strong><br>See recommendations</label>
                </td>
                <td style="width: 34%; text-align: center;">
                  <input type="radio" name="legal-opinion" id="legally-insufficient">
                  <label for="legally-insufficient"><strong>LEGALLY INSUFFICIENT</strong><br>Must address legal issues</label>
                </td>
              </tr>
            </table>
          </div>
        </div>

        <div class="legal-signature">
          <h2>LEGAL REVIEWER AUTHENTICATION</h2>
          <table style="width: 100%;">
            <tr>
              <td style="width: 50%;">
                <p>_________________________________<br>
                <span contenteditable="true">[Name, Rank]</span><br>
                Attorney-Advisor<br>
                AF/JA<br>
                Date: _____________</p>
              </td>
              <td style="width: 50%;">
                <p>_________________________________<br>
                <span contenteditable="true">[Name, Rank]</span><br>
                Deputy Staff Judge Advocate<br>
                AF/JA<br>
                Date: _____________</p>
              </td>
            </tr>
          </table>
        </div>
      </div>
    `
  },

  // HIGH PRIORITY TEMPLATES - Key template categories for document creation
  
  // DAFPD - DAF Policy Directive
  'dafpd-template': {
    id: 'dafpd-template',
    name: 'DAF Policy Directive (DAFPD)',
    type: 'document',
    content: `
      <style>
        .dafpd-template { counter-reset: page-counter; }
        .page-marker { 
          text-align: right; 
          font-size: 10px; 
          color: #666; 
          margin: 10px 0;
          border-top: 1px dashed #ccc;
          padding-top: 5px;
        }
        .page-marker::before { 
          counter-increment: page-counter; 
          content: "Page " counter(page-counter); 
        }
        [data-paragraph]::before {
          content: attr(data-paragraph) " ";
          font-weight: bold;
          color: #000080;
          margin-right: 10px;
        }
        [data-line] {
          position: relative;
        }
        [data-line]::after {
          content: " (Line " attr(data-line) ")";
          font-size: 9px;
          color: #999;
          vertical-align: super;
        }
      </style>
      <div class="dafpd-template" style="margin-top: 2in;">
        <!-- Content starts after header -->
        <table style="width: 100%; margin-bottom: 30px;">
          <tr>
            <td style="width: 50%;"><strong>OPR:</strong> <span contenteditable="true" style="background-color: #ffffcc;">[Office Symbol]</span></td>
            <td style="width: 50%;"><strong>Certified by:</strong> <span contenteditable="true" style="background-color: #ffffcc;">[Name/Title]</span></td>
          </tr>
          <tr>
            <td><strong>Supersedes:</strong> <span contenteditable="true">[Previous Directive if applicable]</span></td>
            <td><strong>Pages:</strong> <span contenteditable="true">[##]</span></td>
          </tr>
        </table>

        <!-- Page 1 -->
        <div class="page-marker"></div>
        
        <!-- Policy Content -->
        <div class="policy-content">
          <p data-paragraph="1" data-line="1">This directive establishes policy for <span contenteditable="true" style="background-color: #ffffcc;">[describe the policy area]</span>. It applies to <span contenteditable="true" style="background-color: #ffffcc;">[specify who it applies to]</span>.</p>

          <h3 data-paragraph="1">1. OVERVIEW</h3>
          <p data-paragraph="1.1" data-line="1" style="text-indent: 20px;" contenteditable="true">[Provide overview of the policy directive and its importance]</p>

          <h3 data-paragraph="2">2. POLICY</h3>
          <p data-paragraph="2.1" data-line="1" style="text-indent: 20px;">It is Air Force policy that:</p>
          <p data-paragraph="2.1.1" data-line="1" style="margin-left: 40px;"><strong>2.1.</strong> <span contenteditable="true">[First policy statement]</span></p>
          <p data-paragraph="2.1.2" data-line="1" style="margin-left: 40px;"><strong>2.2.</strong> <span contenteditable="true">[Second policy statement]</span></p>
          <p data-paragraph="2.1.3" data-line="1" style="margin-left: 40px;"><strong>2.3.</strong> <span contenteditable="true">[Third policy statement]</span></p>

          <h3 data-paragraph="3">3. ROLES AND RESPONSIBILITIES</h3>
          <p data-paragraph="3.1" data-line="1" style="margin-left: 40px;"><strong>3.1. The Assistant Secretary of the Air Force</strong> <span contenteditable="true">[specific title]</span>:</p>
          <p data-paragraph="3.1.1" data-line="1" style="margin-left: 60px;"><strong>3.1.1.</strong> <span contenteditable="true">[Responsibility 1]</span></p>
          <p data-paragraph="3.1.2" data-line="1" style="margin-left: 60px;"><strong>3.1.2.</strong> <span contenteditable="true">[Responsibility 2]</span></p>
          
          <p data-paragraph="3.2" data-line="1" style="margin-left: 40px;"><strong>3.2. MAJCOM Commanders:</strong></p>
          <p data-paragraph="3.2.1" data-line="1" style="margin-left: 60px;"><strong>3.2.1.</strong> <span contenteditable="true">[Responsibility 1]</span></p>
          <p data-paragraph="3.2.2" data-line="1" style="margin-left: 60px;"><strong>3.2.2.</strong> <span contenteditable="true">[Responsibility 2]</span></p>
        </div>
      </div>
    `
  },

  // DAFMAN - DAF Manual
  'dafman-template': {
    id: 'dafman-template',
    name: 'DAF Manual (DAFMAN)',
    type: 'document',
    content: `
      <div class="dafman-template" style="margin-top: 2in;">
        <!-- Content starts after header -->
        <!-- Summary of Changes -->
        <div style="margin-bottom: 30px; padding: 10px; background-color: #f0f0f0;">
          <h3>SUMMARY OF CHANGES</h3>
          <p contenteditable="true">This document has been substantially revised and needs a complete review.</p>
        </div>

        <!-- Table of Contents -->
        <div style="margin-bottom: 30px;">
          <h3>Table of Contents</h3>
          <p>Chapter 1—<span contenteditable="true">GENERAL INFORMATION</span></p>
          <p>Chapter 2—<span contenteditable="true">RESPONSIBILITIES</span></p>
          <p>Chapter 3—<span contenteditable="true">PROCEDURES</span></p>
          <p>Attachment 1—GLOSSARY</p>
        </div>

        <!-- Chapter 1 -->
        <div class="chapter">
          <h2>Chapter 1</h2>
          <h2><span contenteditable="true">GENERAL INFORMATION</span></h2>
          
          <p data-paragraph="1.1" data-line="1"><strong>1.1. Purpose.</strong> <span contenteditable="true">This manual provides guidance and procedures for [describe purpose]. It implements [reference to policy directive].</span></p>
          <p data-paragraph="1.2" data-line="1"><strong>1.2. Applicability.</strong> <span contenteditable="true">This manual applies to [specify who it applies to], including Air Force Reserve and Air National Guard units.</span></p>
          <p data-paragraph="1.3" data-line="1"><strong>1.3. Background.</strong> <span contenteditable="true">[Provide background information]</span></p>
          <p data-paragraph="1.4" data-line="1"><strong>1.4. Waivers.</strong> Waivers to this manual may be granted by <span contenteditable="true">[waiver authority]</span>. Submit waiver requests through <span contenteditable="true">[process]</span>.</p>
        </div>

        <!-- Chapter 2 -->
        <div class="chapter">
          <h2>Chapter 2</h2>
          <h2><span contenteditable="true">RESPONSIBILITIES</span></h2>
          
          <p data-paragraph="2.1" data-line="1"><strong>2.1. Deputy Chief of Staff.</strong> The Deputy Chief of Staff for <span contenteditable="true">[area]</span>:</p>
          <p data-paragraph="2.1.1" data-line="1" style="margin-left: 20px;"><strong>2.1.1.</strong> <span contenteditable="true">[Responsibility 1]</span></p>
          <p data-paragraph="2.1.2" data-line="1" style="margin-left: 20px;"><strong>2.1.2.</strong> <span contenteditable="true">[Responsibility 2]</span></p>
          
          <p data-paragraph="2.2" data-line="1"><strong>2.2. MAJCOM Commanders.</strong></p>
          <p data-paragraph="2.2.1" data-line="1" style="margin-left: 20px;"><strong>2.2.1.</strong> <span contenteditable="true">[Responsibility 1]</span></p>
          <p data-paragraph="2.2.2" data-line="1" style="margin-left: 20px;"><strong>2.2.2.</strong> <span contenteditable="true">[Responsibility 2]</span></p>
        </div>

        <!-- Chapter 3 -->
        <div class="chapter">
          <h2>Chapter 3</h2>
          <h2><span contenteditable="true">PROCEDURES</span></h2>
          
          <p data-paragraph="3.1" data-line="1"><strong>3.1. General Procedures.</strong></p>
          <p data-paragraph="3.1.1" data-line="1" style="margin-left: 20px;"><strong>3.1.1.</strong> <span contenteditable="true">[Procedure 1]</span></p>
          <p data-paragraph="3.1.2" data-line="1" style="margin-left: 20px;"><strong>3.1.2.</strong> <span contenteditable="true">[Procedure 2]</span></p>
          
          <p data-paragraph="3.2" data-line="1"><strong>3.2. Specific Requirements.</strong></p>
          <p data-paragraph="3.2.1" data-line="1" style="margin-left: 20px;"><strong>3.2.1.</strong> <span contenteditable="true">[Requirement 1]</span></p>
          <p data-paragraph="3.2.1.1" data-line="1" style="margin-left: 40px;"><strong>3.2.1.1.</strong> <span contenteditable="true">[Sub-requirement]</span></p>
          <p data-paragraph="3.2.1.2" data-line="1" style="margin-left: 40px;"><strong>3.2.1.2.</strong> <span contenteditable="true">[Sub-requirement]</span></p>
        </div>
      </div>
    `
  },

  // Guidance Memorandum
  'guidance-memorandum': {
    id: 'guidance-memorandum',
    name: 'Guidance Memorandum',
    type: 'document',
    content: `
      <div class="guidance-memorandum">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="/af-seal.png" alt="Department of the Air Force" style="width: 60px; height: 60px; margin-bottom: 10px;">
          <h2 style="font-size: 14px;">DEPARTMENT OF THE AIR FORCE</h2>
          <h2 style="font-size: 14px;"><span contenteditable="true" style="background-color: #ffffcc;">[ORGANIZATION]</span></h2>
        </div>

        <!-- Memorandum Header -->
        <div style="text-align: right; margin-bottom: 20px;">
          <p><strong>GUIDANCE MEMORANDUM</strong></p>
          <p>NUMBER: <span contenteditable="true" style="background-color: #ffffcc;">[DAFGM##-##]</span></p>
          <p>DATE: <span contenteditable="true">${new Date().toLocaleDateString()}</span></p>
        </div>

        <!-- Subject Line -->
        <div style="margin-bottom: 20px;">
          <p><strong>MEMORANDUM FOR</strong> <span contenteditable="true">[DISTRIBUTION]</span></p>
          <p><strong>FROM:</strong> <span contenteditable="true">[Office Symbol]</span></p>
          <p><strong>SUBJECT:</strong> Guidance Memorandum to <span contenteditable="true">[Publication Number and Title]</span></p>
        </div>

        <!-- Compliance Statement -->
        <div style="margin-bottom: 20px; padding: 10px; border: 1px solid black;">
          <p style="font-weight: bold;">COMPLIANCE WITH THIS MEMORANDUM IS MANDATORY</p>
        </div>

        <!-- Body -->
        <div style="margin-bottom: 30px;">
          <p><strong>1. Purpose.</strong> This Guidance Memorandum immediately implements changes to <span contenteditable="true">[Publication]</span>.</p>
          
          <p><strong>2. Background.</strong> <span contenteditable="true">[Explain why this interim guidance is necessary]</span></p>
          
          <p><strong>3. Guidance.</strong> The following interim guidance is effective immediately:</p>
          <p style="margin-left: 20px;"><strong>3.1.</strong> <span contenteditable="true">[Guidance item 1]</span></p>
          <p style="margin-left: 20px;"><strong>3.2.</strong> <span contenteditable="true">[Guidance item 2]</span></p>
          
          <p><strong>4. Specific Changes to Publication.</strong></p>
          <div style="margin-left: 20px; padding: 10px; background-color: #f9f9f9;">
            <p><strong>Paragraph <span contenteditable="true">[#.#]</span> is changed to read:</strong></p>
            <p contenteditable="true">[New paragraph text]</p>
          </div>
          
          <p><strong>5. Expiration.</strong> This Guidance Memorandum expires <span contenteditable="true">[1 year from date or upon publication]</span>.</p>
          
          <p><strong>6. Point of Contact.</strong> <span contenteditable="true">[Name, Phone, Email]</span></p>
        </div>

        <!-- Signature Block -->
        <div style="margin-top: 40px; text-align: center;">
          <p contenteditable="true">[NAME, Rank, USAF]</p>
          <p contenteditable="true">[Title]</p>
        </div>
      </div>
    `
  },

  // Waiver Request
  'waiver-request': {
    id: 'waiver-request',
    name: 'Waiver Request',
    type: 'document',
    content: `
      <div class="waiver-request">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="font-size: 16px;">WAIVER REQUEST</h2>
          <p>IAW <span contenteditable="true" style="background-color: #ffffcc;">[Regulation Reference]</span></p>
        </div>

        <!-- Date -->
        <div style="text-align: right; margin-bottom: 20px;">
          <p>DATE: <span contenteditable="true">${new Date().toLocaleDateString()}</span></p>
        </div>

        <!-- Memorandum Header -->
        <div style="margin-bottom: 20px;">
          <p><strong>MEMORANDUM FOR</strong> <span contenteditable="true">[Waiver Authority]</span></p>
          <p><strong>FROM:</strong> <span contenteditable="true">[Requesting Office]</span></p>
          <p><strong>SUBJECT:</strong> Request for Waiver - <span contenteditable="true">[Brief Description]</span></p>
        </div>

        <!-- Request Details -->
        <div style="margin-bottom: 30px;">
          <p><strong>1. Request.</strong> <span contenteditable="true">[Organization]</span> requests a waiver from <span contenteditable="true">[Specific requirement]</span>.</p>
          
          <p><strong>2. Requirement Being Waived.</strong></p>
          <div style="margin-left: 20px; padding: 10px; background-color: #f9f9f9;">
            <p><strong>Regulation:</strong> <span contenteditable="true">[Regulation number and title]</span></p>
            <p><strong>Paragraph:</strong> <span contenteditable="true">[Paragraph number]</span></p>
            <p><strong>Requirement:</strong> <span contenteditable="true">[Quote the requirement]</span></p>
          </div>
          
          <p><strong>3. Justification.</strong> <span contenteditable="true">[Provide detailed justification]</span></p>
          
          <p><strong>4. Alternative Compliance Method.</strong> <span contenteditable="true">[Describe alternative method]</span></p>
          
          <p><strong>5. Risk Assessment.</strong></p>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <th style="border: 1px solid black; padding: 5px;">Risk Area</th>
              <th style="border: 1px solid black; padding: 5px;">Impact</th>
              <th style="border: 1px solid black; padding: 5px;">Mitigation</th>
            </tr>
            <tr>
              <td style="border: 1px solid black; padding: 5px;" contenteditable="true">Safety</td>
              <td style="border: 1px solid black; padding: 5px;" contenteditable="true">[Low/Medium/High]</td>
              <td style="border: 1px solid black; padding: 5px;" contenteditable="true">[Mitigation measures]</td>
            </tr>
            <tr>
              <td style="border: 1px solid black; padding: 5px;" contenteditable="true">Operational</td>
              <td style="border: 1px solid black; padding: 5px;" contenteditable="true">[Low/Medium/High]</td>
              <td style="border: 1px solid black; padding: 5px;" contenteditable="true">[Mitigation measures]</td>
            </tr>
          </table>
          
          <p><strong>6. Duration.</strong> This waiver is requested for <span contenteditable="true">[time period]</span>.</p>
          
          <p><strong>7. Point of Contact.</strong> <span contenteditable="true">[Name, Phone, Email]</span></p>
        </div>

        <!-- Approval Section -->
        <div style="margin-top: 40px; border-top: 2px solid black; padding-top: 20px;">
          <p><strong>WAIVER AUTHORITY DECISION</strong></p>
          <p>☐ APPROVED ☐ DISAPPROVED</p>
          <p><strong>Conditions/Restrictions:</strong> <span contenteditable="true">[If approved, any conditions]</span></p>
          <div style="margin-top: 30px;">
            <p>_________________________________</p>
            <p contenteditable="true">[APPROVAL AUTHORITY NAME]</p>
            <p>Date: _____________</p>
          </div>
        </div>
      </div>
    `
  }
};

// Helper function to get critical template by ID
export function getCriticalTemplate(templateId: string): CriticalTemplate | undefined {
  return criticalTemplates[templateId];
}

// Helper function to get all critical template IDs
export function getAllCriticalTemplateIds(): string[] {
  return Object.keys(criticalTemplates);
}

// Helper function to check if a template is critical
export function isCriticalTemplate(templateId: string): boolean {
  return templateId in criticalTemplates;
}

// Export list of critical template categories
export const criticalTemplateCategories = {
  coordination: [
    'comment-resolution-matrix',
    'af-form-673',
    'o6-gs15-coordination',
    '2-letter-coordination',
    'legal-coordination'
  ],
  supplements: [
    'supplement-template'
  ],
  highPriority: [
    'dafpd-template',
    'dafman-template',
    'guidance-memorandum',
    'waiver-request'
  ]
};

export default criticalTemplates;