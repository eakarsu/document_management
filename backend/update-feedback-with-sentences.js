const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateFeedbackWithSentences() {
  console.log('=== UPDATING FEEDBACK WITH SENTENCE CHANGES ===\n');
  
  try {
    const documentId = 'doc_real_10c443f4750a';
    
    // Get the document
    const doc = await prisma.document.findUnique({
      where: { id: documentId }
    });
    
    if (!doc) {
      console.log('Document not found. Run create-real-3-page-document.js first');
      return;
    }
    
    // New feedback with both word and sentence changes
    const enhancedFeedback = [
      // Word changes (simple spelling)
      {
        page: 1,
        paragraph: '2',
        changeFrom: 'managment',
        changeTo: 'management',
        comment: 'Spelling error - should be "management"',
        type: 'A',
        pocName: 'John Smith',
        pocEmail: 'john.smith@demo.mil'
      },
      {
        page: 2,
        paragraph: '4',
        changeFrom: 'approch',
        changeTo: 'approach',
        comment: 'Spelling error - should be "approach"',
        type: 'A',
        pocName: 'Jane Doe',
        pocEmail: 'jane.doe@demo.mil'
      },
      
      // Full sentence changes
      {
        page: 1,
        paragraph: '2',
        changeFrom: 'The system must integrate seamlessly with existing enterprise applications while providing a modern, intuitive user interface that requires minimal training for end users.',
        changeTo: 'The system shall provide seamless integration with existing enterprise applications and deliver a modern, user-friendly interface designed to minimize training requirements and accelerate user adoption across all organizational levels.',
        comment: 'Rewrite for clarity and stronger requirements language',
        type: 'S',
        pocName: 'Mike Johnson',
        pocEmail: 'mike.johnson@demo.mil'
      },
      {
        page: 1,
        paragraph: '3',
        changeFrom: 'The primary business objectives driving this implementation include reducing document processing time by 60%, eliminating paper-based workflows, ensuring regulatory compliance with industry standards, and providing real-time access to critical documents across all departments.',
        changeTo: 'This implementation aims to achieve a 60% reduction in document processing time, complete elimination of paper-based workflows, full regulatory compliance with applicable industry standards, and instantaneous access to critical documents for all authorized personnel regardless of department or location.',
        comment: 'Restructure sentence for better flow and clarity',
        type: 'S',
        pocName: 'Sarah Wilson',
        pocEmail: 'sarah.wilson@demo.mil'
      },
      
      // More word changes
      {
        page: 2,
        paragraph: '5',
        changeFrom: 'transactonal',
        changeTo: 'transactional',
        comment: 'Spelling error - should be "transactional"',
        type: 'A',
        pocName: 'John Smith',
        pocEmail: 'john.smith@demo.mil'
      },
      
      // Critical sentence change
      {
        page: 2,
        paragraph: '6',
        changeFrom: 'All comunicaton between system components uses TLS encryption with certificate-based authentication for service-to-service communication.',
        changeTo: 'All communication between system components must utilize TLS 1.3 or higher encryption protocols with mutual TLS (mTLS) certificate-based authentication for all service-to-service communication, ensuring end-to-end security and preventing man-in-the-middle attacks.',
        comment: 'Critical security requirement - needs more specific technical details',
        type: 'C',
        pocName: 'Security Team Lead',
        pocEmail: 'security.lead@demo.mil'
      },
      
      // Another sentence improvement
      {
        page: 3,
        paragraph: '7',
        changeFrom: 'Document upload operations must complete within 5 seconds for files up to 100MB with progress indicators for larger files.',
        changeTo: 'The system shall ensure document upload operations complete within 5 seconds for files up to 100MB, with real-time progress indicators, automatic retry mechanisms, and graceful error handling for larger files or network interruptions.',
        comment: 'Add requirements for error handling and retry logic',
        type: 'S',
        pocName: 'Tech Lead',
        pocEmail: 'tech.lead@demo.mil'
      },
      
      // Word change
      {
        page: 3,
        paragraph: '9',
        changeFrom: 'infrastucture',
        changeTo: 'infrastructure',
        comment: 'Spelling error - should be "infrastructure"',
        type: 'A',
        pocName: 'Mike Johnson',
        pocEmail: 'mike.johnson@demo.mil'
      },
      
      // Major sentence rewrite
      {
        page: 3,
        paragraph: '9',
        changeFrom: 'Phase 1 focuses on core infrastucture setup, basic document management functionality, and integration with authentication systems, scheduled for completion in Q1 2024.',
        changeTo: 'Phase 1 will establish the foundational infrastructure, implement core document management capabilities including upload, storage, and retrieval functions, integrate with enterprise authentication systems using SAML 2.0 and OAuth 2.0 protocols, and deliver a minimum viable product by the end of Q1 2024.',
        comment: 'Major - Provide more detail on Phase 1 deliverables',
        type: 'M',
        pocName: 'Project Manager',
        pocEmail: 'pm@demo.mil'
      },
      
      // Critical paragraph rewrite
      {
        page: 3,
        paragraph: '10',
        changeFrom: 'Project success will be measured through multiple key performance indicators including system adoption rate targeting 80% of users actively using the system within six months, document processing efficiency showing 60% reduction in average processing time, and system reliability achieving 99.99% uptime excluding planned maintenance windows.',
        changeTo: 'Project success metrics shall include: (1) User adoption rate of 80% within six months, measured by unique daily active users; (2) Document processing efficiency improvement of 60%, calculated as the average time from document submission to final approval; (3) System availability of 99.99% (52.56 minutes maximum annual downtime), excluding scheduled maintenance windows not to exceed 4 hours per month; (4) Mean time to recovery (MTTR) not exceeding 15 minutes for critical incidents.',
        comment: 'Critical - Success metrics need specific measurable criteria',
        type: 'C',
        pocName: 'Executive Sponsor',
        pocEmail: 'exec.sponsor@demo.mil'
      }
    ];
    
    // Update the document with enhanced feedback
    await prisma.document.update({
      where: { id: documentId },
      data: {
        customFields: {
          ...doc.customFields,
          draftFeedback: enhancedFeedback
        }
      }
    });
    
    console.log('✅ FEEDBACK UPDATED WITH SENTENCE CHANGES');
    console.log('\n📊 FEEDBACK SUMMARY:');
    console.log('   Total feedback items:', enhancedFeedback.length);
    
    const wordChanges = enhancedFeedback.filter(f => f.changeFrom.split(' ').length === 1);
    const sentenceChanges = enhancedFeedback.filter(f => f.changeFrom.split(' ').length > 1);
    
    console.log('   Word-level changes:', wordChanges.length);
    console.log('   Sentence-level changes:', sentenceChanges.length);
    
    console.log('\n📝 TYPES OF CHANGES:');
    console.log('   Critical (C):', enhancedFeedback.filter(f => f.type === 'C').length);
    console.log('   Major (M):', enhancedFeedback.filter(f => f.type === 'M').length);
    console.log('   Substantive (S):', enhancedFeedback.filter(f => f.type === 'S').length);
    console.log('   Administrative (A):', enhancedFeedback.filter(f => f.type === 'A').length);
    
    console.log('\n🔍 SAMPLE SENTENCE CHANGES:');
    sentenceChanges.slice(0, 3).forEach((f, i) => {
      console.log(`\n${i + 1}. Page ${f.page} (${f.type} - ${f.pocName}):`);
      console.log('   FROM: "' + f.changeFrom.substring(0, 60) + '..."');
      console.log('   TO:   "' + f.changeTo.substring(0, 60) + '..."');
      console.log('   Comment:', f.comment);
    });
    
    console.log('\n🔗 VIEW IN OPR REVIEW:');
    console.log('   http://localhost:3000/documents/' + documentId + '/opr-review');
    
    return enhancedFeedback;
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

updateFeedbackWithSentences();