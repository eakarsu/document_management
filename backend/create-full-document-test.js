const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');

async function createFullDocumentWithFeedback() {
  console.log('=== CREATING FULL DOCUMENT WITH REVIEW FEEDBACK ===\n');
  
  try {
    // Step 1: Create a new multi-page document
    console.log('1. CREATING NEW DOCUMENT:');
    const documentId = 'doc_' + crypto.randomBytes(8).toString('hex');
    const organizationId = 'cmeys45f10000jp4iccb6f59u'; // Using existing org
    const userId = 'cmeys45qj000ojp4izc4fumqb'; // admin user
    
    const multiPageContent = `
<div class="document-container">
  <div class="page" data-page="1">
    <h1>Technical Requirements Document</h1>
    <p data-paragraph="1.1">This document outlines the technical reqirements for the new system implementation.</p>
    <p data-paragraph="1.2">The system will provide comprehansive data processing capabilities with real-time analytics.</p>
    <p data-paragraph="1.3">All componants must be designed with scalability and reliablity in mind.</p>
  </div>
  
  <div class="page" data-page="2">
    <h2>System Architecture</h2>
    <p data-paragraph="2.1">The architecture follows a microservices approch with distributed processing nodes.</p>
    <p data-paragraph="2.2">Each service will comunicate through REST APIs and message queues for asyncronous operations.</p>
    <p data-paragraph="2.3">The database layer will use PostgreSQL for transactonal data and MongoDB for document storage.</p>
  </div>
  
  <div class="page" data-page="3">
    <h2>Implementation Timeline</h2>
    <p data-paragraph="3.1">Phase 1 will focus on core infrastucture setup and basic functionality.</p>
    <p data-paragraph="3.2">Phase 2 will implament advanced features and intergrations with external systems.</p>
    <p data-paragraph="3.3">Final deployment is schedled for Q4 2024 with full production readyness.</p>
  </div>
</div>`;

    const newDocument = await prisma.document.create({
      data: {
        id: documentId,
        title: 'Technical Requirements Document v1.0',
        fileName: 'tech-requirements-v1.pdf',
        originalName: 'tech-requirements-v1.pdf',
        mimeType: 'application/pdf',
        fileSize: 15234,
        checksum: crypto.randomBytes(16).toString('hex'),
        status: 'DRAFT',
        category: 'Technical',
        tags: ['requirements', 'architecture', 'technical'],
        storagePath: `/documents/${documentId}/tech-requirements.pdf`,
        currentVersion: 1,
        organizationId,
        createdById: userId,
        customFields: {
          content: multiPageContent,
          pageCount: 3,
          template: 'technical-document',
          draftFeedback: []
        }
      }
    });
    
    console.log('   ✓ Document created:', newDocument.id);
    console.log('   ✓ Title:', newDocument.title);
    console.log('   ✓ Pages: 3');
    
    // Step 2: Create review comments with CRM feedback
    console.log('\n2. CREATING REVIEW FEEDBACK:');
    
    const feedbackItems = [
      {
        page: 1,
        paragraph: '1.1',
        line: 1,
        changeFrom: 'reqirements',
        changeTo: 'requirements',
        comment: 'Spelling error - should be "requirements"',
        type: 'S', // Substantive
        pocName: 'John Smith',
        pocEmail: 'john.smith@demo.mil'
      },
      {
        page: 1,
        paragraph: '1.2',
        line: 1,
        changeFrom: 'comprehansive',
        changeTo: 'comprehensive',
        comment: 'Spelling error - should be "comprehensive"',
        type: 'A', // Administrative
        pocName: 'Jane Doe',
        pocEmail: 'jane.doe@demo.mil'
      },
      {
        page: 1,
        paragraph: '1.3',
        line: 1,
        changeFrom: 'componants',
        changeTo: 'components',
        comment: 'Spelling error - should be "components"',
        type: 'S',
        pocName: 'John Smith',
        pocEmail: 'john.smith@demo.mil'
      },
      {
        page: 1,
        paragraph: '1.3',
        line: 1,
        changeFrom: 'reliablity',
        changeTo: 'reliability',
        comment: 'Spelling error - should be "reliability"',
        type: 'A',
        pocName: 'Jane Doe',
        pocEmail: 'jane.doe@demo.mil'
      },
      {
        page: 2,
        paragraph: '2.1',
        line: 1,
        changeFrom: 'approch',
        changeTo: 'approach',
        comment: 'Spelling error - should be "approach"',
        type: 'C', // Critical
        pocName: 'Mike Johnson',
        pocEmail: 'mike.johnson@demo.mil'
      },
      {
        page: 2,
        paragraph: '2.2',
        line: 1,
        changeFrom: 'comunicate',
        changeTo: 'communicate',
        comment: 'Spelling error - should be "communicate"',
        type: 'S',
        pocName: 'John Smith',
        pocEmail: 'john.smith@demo.mil'
      },
      {
        page: 2,
        paragraph: '2.2',
        line: 1,
        changeFrom: 'asyncronous',
        changeTo: 'asynchronous',
        comment: 'Spelling error - should be "asynchronous"',
        type: 'A',
        pocName: 'Jane Doe',
        pocEmail: 'jane.doe@demo.mil'
      },
      {
        page: 2,
        paragraph: '2.3',
        line: 1,
        changeFrom: 'transactonal',
        changeTo: 'transactional',
        comment: 'Spelling error - should be "transactional"',
        type: 'S',
        pocName: 'Mike Johnson',
        pocEmail: 'mike.johnson@demo.mil'
      },
      {
        page: 3,
        paragraph: '3.1',
        line: 1,
        changeFrom: 'infrastucture',
        changeTo: 'infrastructure',
        comment: 'Spelling error - should be "infrastructure"',
        type: 'C',
        pocName: 'Sarah Wilson',
        pocEmail: 'sarah.wilson@demo.mil'
      },
      {
        page: 3,
        paragraph: '3.2',
        line: 1,
        changeFrom: 'implament',
        changeTo: 'implement',
        comment: 'Spelling error - should be "implement"',
        type: 'S',
        pocName: 'John Smith',
        pocEmail: 'john.smith@demo.mil'
      },
      {
        page: 3,
        paragraph: '3.2',
        line: 1,
        changeFrom: 'intergrations',
        changeTo: 'integrations',
        comment: 'Spelling error - should be "integrations"',
        type: 'A',
        pocName: 'Jane Doe',
        pocEmail: 'jane.doe@demo.mil'
      },
      {
        page: 3,
        paragraph: '3.3',
        line: 1,
        changeFrom: 'schedled',
        changeTo: 'scheduled',
        comment: 'Spelling error - should be "scheduled"',
        type: 'S',
        pocName: 'Sarah Wilson',
        pocEmail: 'sarah.wilson@demo.mil'
      },
      {
        page: 3,
        paragraph: '3.3',
        line: 1,
        changeFrom: 'readyness',
        changeTo: 'readiness',
        comment: 'Spelling error - should be "readiness"',
        type: 'M', // Major
        pocName: 'Mike Johnson',
        pocEmail: 'mike.johnson@demo.mil'
      }
    ];
    
    // Add feedback to document
    await prisma.document.update({
      where: { id: documentId },
      data: {
        customFields: {
          ...newDocument.customFields,
          draftFeedback: feedbackItems
        }
      }
    });
    
    console.log('   ✓ Added', feedbackItems.length, 'feedback items');
    console.log('   ✓ Critical:', feedbackItems.filter(f => f.type === 'C').length);
    console.log('   ✓ Major:', feedbackItems.filter(f => f.type === 'M').length);
    console.log('   ✓ Substantive:', feedbackItems.filter(f => f.type === 'S').length);
    console.log('   ✓ Administrative:', feedbackItems.filter(f => f.type === 'A').length);
    
    // Step 3: Display summary
    console.log('\n3. DOCUMENT READY FOR OPR REVIEW:');
    console.log('   Document ID:', documentId);
    console.log('   Title:', newDocument.title);
    console.log('   Pages: 3');
    console.log('   Total feedback items:', feedbackItems.length);
    console.log('\n   Sample feedback to merge:');
    console.log('   - Page 1: "reqirements" → "requirements"');
    console.log('   - Page 2: "approch" → "approach" (Critical)');
    console.log('   - Page 3: "infrastucture" → "infrastructure" (Critical)');
    
    console.log('\n4. TO VIEW IN OPR REVIEW:');
    console.log('   URL: http://localhost:3000/documents/' + documentId + '/opr-review');
    
    console.log('\n5. FEEDBACK DATA STRUCTURE:');
    console.log(JSON.stringify(feedbackItems[0], null, 2));
    
    return {
      documentId,
      feedbackItems
    };
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the creation
createFullDocumentWithFeedback().then(result => {
  if (result) {
    console.log('\n✅ DOCUMENT CREATED SUCCESSFULLY!');
    console.log('Document ID:', result.documentId);
  }
});