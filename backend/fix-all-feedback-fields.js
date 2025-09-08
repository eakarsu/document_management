const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixAllFeedbackFields() {
  console.log('=== FIXING ALL FEEDBACK FIELDS ===\n');
  
  try {
    const documentId = 'doc_real_10c443f4750a';
    
    // Get the document
    const doc = await prisma.document.findUnique({
      where: { id: documentId }
    });
    
    if (!doc) {
      console.log('Document not found');
      return;
    }
    
    // Complete feedback with ALL fields filled
    const completeFeedback = [
      // Word changes
      {
        id: 'fb_001',
        page: 1,
        paragraphNumber: '2.1',
        lineNumber: '3',
        component: 'Executive Summary',
        pocName: 'John Smith',
        pocPhone: '+1-555-0101',
        pocEmail: 'john.smith@demo.mil',
        changeFrom: 'managment',
        changeTo: 'management',
        coordinatorComment: 'Spelling error in critical business term',
        coordinatorJustification: 'Incorrect spelling affects document professionalism',
        commentType: 'A', // Administrative
        severity: 'LOW',
        status: 'PENDING',
        createdAt: new Date().toISOString()
      },
      {
        id: 'fb_002',
        page: 2,
        paragraphNumber: '4.1',
        lineNumber: '2',
        component: 'Technical Architecture',
        pocName: 'Jane Doe',
        pocPhone: '+1-555-0102',
        pocEmail: 'jane.doe@demo.mil',
        changeFrom: 'approch',
        changeTo: 'approach',
        coordinatorComment: 'Spelling error in technical section',
        coordinatorJustification: 'Technical documentation must be precise',
        commentType: 'S', // Substantive
        severity: 'MEDIUM',
        status: 'PENDING',
        createdAt: new Date().toISOString()
      },
      
      // Sentence changes
      {
        id: 'fb_003',
        page: 1,
        paragraphNumber: '2.2',
        lineNumber: '5-7',
        component: 'Business Requirements',
        pocName: 'Mike Johnson',
        pocPhone: '+1-555-0103',
        pocEmail: 'mike.johnson@demo.mil',
        changeFrom: 'The system must integrate seamlessly with existing enterprise applications while providing a modern, intuitive user interface that requires minimal training for end users.',
        changeTo: 'The system shall provide seamless integration with existing enterprise applications and deliver a modern, user-friendly interface designed to minimize training requirements and accelerate user adoption across all organizational levels.',
        coordinatorComment: 'Requirements language needs to be more specific and formal',
        coordinatorJustification: 'Use "shall" for mandatory requirements per DoD standards',
        commentType: 'C', // Critical
        severity: 'HIGH',
        status: 'PENDING',
        createdAt: new Date().toISOString()
      },
      {
        id: 'fb_004',
        page: 1,
        paragraphNumber: '3.1',
        lineNumber: '1-4',
        component: 'Business Requirements',
        pocName: 'Sarah Wilson',
        pocPhone: '+1-555-0104',
        pocEmail: 'sarah.wilson@demo.mil',
        changeFrom: 'The primary business objectives driving this implementation include reducing document processing time by 60%, eliminating paper-based workflows, ensuring regulatory compliance with industry standards, and providing real-time access to critical documents across all departments.',
        changeTo: 'This implementation aims to achieve a 60% reduction in document processing time, complete elimination of paper-based workflows, full regulatory compliance with applicable industry standards, and instantaneous access to critical documents for all authorized personnel regardless of department or location.',
        coordinatorComment: 'Restructure for clarity and add specificity',
        coordinatorJustification: 'More precise language improves requirement measurability',
        commentType: 'S', // Substantive
        severity: 'MEDIUM',
        status: 'PENDING',
        createdAt: new Date().toISOString()
      },
      
      // More word changes with complete fields
      {
        id: 'fb_005',
        page: 2,
        paragraphNumber: '5.2',
        lineNumber: '4',
        component: 'Data Management',
        pocName: 'Robert Chen',
        pocPhone: '+1-555-0105',
        pocEmail: 'robert.chen@demo.mil',
        changeFrom: 'transactonal',
        changeTo: 'transactional',
        coordinatorComment: 'Spelling error in database terminology',
        coordinatorJustification: 'Technical terms must be spelled correctly',
        commentType: 'A', // Administrative
        severity: 'LOW',
        status: 'PENDING',
        createdAt: new Date().toISOString()
      },
      {
        id: 'fb_006',
        page: 2,
        paragraphNumber: '4.2',
        lineNumber: '6',
        component: 'Technical Architecture',
        pocName: 'Lisa Anderson',
        pocPhone: '+1-555-0106',
        pocEmail: 'lisa.anderson@demo.mil',
        changeFrom: 'comunicate',
        changeTo: 'communicate',
        coordinatorComment: 'Spelling error affecting multiple occurrences',
        coordinatorJustification: 'Consistent spelling throughout document',
        commentType: 'A', // Administrative
        severity: 'LOW',
        status: 'PENDING',
        createdAt: new Date().toISOString()
      },
      
      // Critical security sentence change
      {
        id: 'fb_007',
        page: 2,
        paragraphNumber: '6.1',
        lineNumber: '1-3',
        component: 'Security Requirements',
        pocName: 'Col. James Mitchell',
        pocPhone: '+1-555-0107',
        pocEmail: 'james.mitchell@demo.mil',
        changeFrom: 'All comunicaton between system components uses TLS encryption with certificate-based authentication for service-to-service communication.',
        changeTo: 'All communication between system components must utilize TLS 1.3 or higher encryption protocols with mutual TLS (mTLS) certificate-based authentication for all service-to-service communication, ensuring end-to-end security and preventing man-in-the-middle attacks.',
        coordinatorComment: 'Security requirements need specific protocol versions',
        coordinatorJustification: 'DoD security mandate requires TLS 1.3 minimum',
        commentType: 'C', // Critical
        severity: 'CRITICAL',
        status: 'PENDING',
        createdAt: new Date().toISOString()
      },
      
      // Performance requirement change
      {
        id: 'fb_008',
        page: 3,
        paragraphNumber: '7.1',
        lineNumber: '2-3',
        component: 'Performance Requirements',
        pocName: 'David Thompson',
        pocPhone: '+1-555-0108',
        pocEmail: 'david.thompson@demo.mil',
        changeFrom: 'Document upload operations must complete within 5 seconds for files up to 100MB with progress indicators for larger files.',
        changeTo: 'The system shall ensure document upload operations complete within 5 seconds for files up to 100MB, with real-time progress indicators, automatic retry mechanisms, and graceful error handling for larger files or network interruptions.',
        coordinatorComment: 'Add error handling and retry requirements',
        coordinatorJustification: 'System resilience requires proper error handling',
        commentType: 'S', // Substantive
        severity: 'MEDIUM',
        status: 'PENDING',
        createdAt: new Date().toISOString()
      },
      
      // Infrastructure typo
      {
        id: 'fb_009',
        page: 3,
        paragraphNumber: '9.1',
        lineNumber: '2',
        component: 'Implementation Timeline',
        pocName: 'Patricia Brown',
        pocPhone: '+1-555-0109',
        pocEmail: 'patricia.brown@demo.mil',
        changeFrom: 'infrastucture',
        changeTo: 'infrastructure',
        coordinatorComment: 'Spelling error in key technical term',
        coordinatorJustification: 'Correct technical terminology required',
        commentType: 'A', // Administrative
        severity: 'LOW',
        status: 'PENDING',
        createdAt: new Date().toISOString()
      },
      
      // Major phase description change
      {
        id: 'fb_010',
        page: 3,
        paragraphNumber: '9.1',
        lineNumber: '1-4',
        component: 'Implementation Timeline',
        pocName: 'Maj. William Davis',
        pocPhone: '+1-555-0110',
        pocEmail: 'william.davis@demo.mil',
        changeFrom: 'Phase 1 focuses on core infrastucture setup, basic document management functionality, and integration with authentication systems, scheduled for completion in Q1 2024.',
        changeTo: 'Phase 1 will establish the foundational infrastructure, implement core document management capabilities including upload, storage, and retrieval functions, integrate with enterprise authentication systems using SAML 2.0 and OAuth 2.0 protocols, and deliver a minimum viable product by the end of Q1 2024.',
        coordinatorComment: 'Expand Phase 1 deliverables with specific technical details',
        coordinatorJustification: 'Project stakeholders need clear deliverable definitions',
        commentType: 'M', // Major
        severity: 'HIGH',
        status: 'PENDING',
        createdAt: new Date().toISOString()
      },
      
      // Critical success metrics
      {
        id: 'fb_011',
        page: 3,
        paragraphNumber: '10.1',
        lineNumber: '1-6',
        component: 'Success Metrics',
        pocName: 'Gen. Susan Martinez',
        pocPhone: '+1-555-0111',
        pocEmail: 'susan.martinez@demo.mil',
        changeFrom: 'Project success will be measured through multiple key performance indicators including system adoption rate targeting 80% of users actively using the system within six months, document processing efficiency showing 60% reduction in average processing time, and system reliability achieving 99.99% uptime excluding planned maintenance windows.',
        changeTo: 'Project success metrics shall include: (1) User adoption rate of 80% within six months, measured by unique daily active users; (2) Document processing efficiency improvement of 60%, calculated as the average time from document submission to final approval; (3) System availability of 99.99% (52.56 minutes maximum annual downtime), excluding scheduled maintenance windows not to exceed 4 hours per month; (4) Mean time to recovery (MTTR) not exceeding 15 minutes for critical incidents.',
        coordinatorComment: 'Success metrics must be specific and measurable',
        coordinatorJustification: 'Executive leadership requires quantifiable success criteria',
        commentType: 'C', // Critical
        severity: 'CRITICAL',
        status: 'PENDING',
        createdAt: new Date().toISOString()
      },
      
      // Additional minor fixes
      {
        id: 'fb_012',
        page: 2,
        paragraphNumber: '4.3',
        lineNumber: '8',
        component: 'Technical Architecture',
        pocName: 'Jennifer White',
        pocPhone: '+1-555-0112',
        pocEmail: 'jennifer.white@demo.mil',
        changeFrom: 'comunicates',
        changeTo: 'communicates',
        coordinatorComment: 'Spelling consistency throughout document',
        coordinatorJustification: 'Multiple instances of this misspelling found',
        commentType: 'A', // Administrative
        severity: 'LOW',
        status: 'PENDING',
        createdAt: new Date().toISOString()
      }
    ];
    
    // Update the document with complete feedback
    await prisma.document.update({
      where: { id: documentId },
      data: {
        customFields: {
          ...doc.customFields,
          draftFeedback: completeFeedback,
          feedbackCount: completeFeedback.length,
          lastFeedbackUpdate: new Date().toISOString()
        }
      }
    });
    
    console.log('✅ ALL FEEDBACK FIELDS FIXED AND COMPLETE');
    console.log('\n📊 FEEDBACK SUMMARY:');
    console.log('   Total feedback items:', completeFeedback.length);
    
    console.log('\n📝 COMMENT TYPES:');
    console.log('   Critical (C):', completeFeedback.filter(f => f.commentType === 'C').length);
    console.log('   Major (M):', completeFeedback.filter(f => f.commentType === 'M').length);
    console.log('   Substantive (S):', completeFeedback.filter(f => f.commentType === 'S').length);
    console.log('   Administrative (A):', completeFeedback.filter(f => f.commentType === 'A').length);
    
    console.log('\n📞 ALL POC INFORMATION COMPLETE:');
    completeFeedback.slice(0, 3).forEach((f, i) => {
      console.log(`\n${i + 1}. ${f.pocName}`);
      console.log('   Phone:', f.pocPhone);
      console.log('   Email:', f.pocEmail);
      console.log('   Component:', f.component);
      console.log('   Location: Page', f.page + ', Para', f.paragraphNumber + ', Line', f.lineNumber);
    });
    
    console.log('\n✅ ALL FIELDS NOW POPULATED:');
    console.log('   ✓ ID');
    console.log('   ✓ Page number');
    console.log('   ✓ Paragraph number');
    console.log('   ✓ Line number');
    console.log('   ✓ Component');
    console.log('   ✓ POC Name');
    console.log('   ✓ POC Phone');
    console.log('   ✓ POC Email');
    console.log('   ✓ Comment Type');
    console.log('   ✓ Severity');
    console.log('   ✓ Status');
    console.log('   ✓ Coordinator Comment');
    console.log('   ✓ Coordinator Justification');
    
    console.log('\n🔗 VIEW IN OPR REVIEW:');
    console.log('   http://localhost:3000/documents/' + documentId + '/opr-review');
    
    return completeFeedback;
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixAllFeedbackFields();