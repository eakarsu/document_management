const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addContentToDocument() {
  try {
    // Get the first document
    const documents = await prisma.document.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('Found documents:', documents.map(d => ({ id: d.id, title: d.title })));
    
    if (documents.length === 0) {
      console.log('No documents found');
      return;
    }
    
    // Add content to each document
    for (const doc of documents) {
      const content = `
        <h1>${doc.title}</h1>
        <h2>Executive Summary</h2>
        <p>This document provides comprehensive guidelines and procedures for ${doc.category || 'organizational'} operations. It has been developed in accordance with Air Force standards and regulations.</p>
        
        <h2>1. Introduction</h2>
        <p>This instruction implements Air Force Policy Directive (AFPD) guidelines. It provides guidance and procedures for all personnel involved in the specified operations.</p>
        
        <h3>1.1 Purpose</h3>
        <p>The purpose of this document is to establish clear, standardized procedures that ensure consistency, safety, and operational excellence across all units.</p>
        
        <h3>1.2 Scope</h3>
        <p>This instruction applies to all Air Force personnel, including:</p>
        <ul>
          <li>Active duty members</li>
          <li>Reserve components</li>
          <li>Air National Guard</li>
          <li>Civilian employees</li>
          <li>Contractor personnel when specified</li>
        </ul>
        
        <h2>2. Responsibilities</h2>
        <h3>2.1 Commander Responsibilities</h3>
        <p>Unit commanders shall:</p>
        <ol>
          <li>Ensure all personnel are familiar with this instruction</li>
          <li>Implement procedures outlined in this document</li>
          <li>Monitor compliance and effectiveness</li>
          <li>Report any issues or recommended changes through appropriate channels</li>
        </ol>
        
        <h3>2.2 Individual Responsibilities</h3>
        <p>All personnel shall:</p>
        <ul>
          <li>Read and understand applicable sections of this instruction</li>
          <li>Comply with all procedures and requirements</li>
          <li>Report violations or safety concerns immediately</li>
        </ul>
        
        <h2>3. Procedures</h2>
        <h3>3.1 Standard Operating Procedures</h3>
        <p>The following procedures must be followed for all operations covered under this instruction:</p>
        
        <h4>3.1.1 Pre-Operation Checklist</h4>
        <ol>
          <li>Verify all required personnel are present and briefed</li>
          <li>Confirm equipment status and readiness</li>
          <li>Review safety protocols</li>
          <li>Obtain necessary authorizations</li>
        </ol>
        
        <h4>3.1.2 During Operations</h4>
        <p>Maintain constant communication with supervisory personnel and adhere to all safety protocols. Any deviations from standard procedures must be immediately reported and documented.</p>
        
        <h4>3.1.3 Post-Operation Requirements</h4>
        <ul>
          <li>Complete all required documentation</li>
          <li>Conduct equipment inspection and maintenance</li>
          <li>Submit after-action reports as required</li>
          <li>Participate in debriefing sessions</li>
        </ul>
        
        <h2>4. Training Requirements</h2>
        <p>All personnel must complete initial training within 30 days of assignment and annual refresher training thereafter. Training shall include:</p>
        <ol>
          <li>Review of this instruction</li>
          <li>Hands-on practical exercises</li>
          <li>Written examination with minimum passing score of 80%</li>
          <li>Documentation in training records</li>
        </ol>
        
        <h2>5. Compliance and Enforcement</h2>
        <p>Failure to comply with this instruction may result in administrative or disciplinary action in accordance with the Uniform Code of Military Justice (UCMJ) and applicable regulations.</p>
        
        <h2>6. References</h2>
        <ul>
          <li>Air Force Instruction (AFI) 33-360, Publications and Forms Management</li>
          <li>Air Force Manual (AFMAN) 33-363, Management of Records</li>
          <li>DoD Instruction 5200.01, DoD Information Security Program</li>
        </ul>
        
        <h2>7. Point of Contact</h2>
        <p>For questions regarding this instruction, contact the Office of Primary Responsibility (OPR) at:</p>
        <p><strong>Organization:</strong> ${doc.organization?.name || 'HQ USAF/A1'}<br/>
        <strong>Email:</strong> opr@af.mil<br/>
        <strong>Phone:</strong> DSN 555-0100</p>
        
        <hr/>
        <p><em>This instruction becomes effective immediately and remains in effect until superseded or rescinded.</em></p>
        <p><strong>Document Classification:</strong> UNCLASSIFIED<br/>
        <strong>Distribution:</strong> F<br/>
        <strong>OPR:</strong> AF/A1<br/>
        <strong>Certified by:</strong> AF/CV</p>
      `;
      
      const updatedDoc = await prisma.document.update({
        where: { id: doc.id },
        data: {
          customFields: {
            ...(doc.customFields || {}),
            content: content
          }
        }
      });
      
      console.log(`✅ Added content to document: ${doc.title}`);
    }
    
    console.log('\n✅ Content added to all documents successfully!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addContentToDocument();