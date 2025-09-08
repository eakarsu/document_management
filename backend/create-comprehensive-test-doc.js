const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createComprehensiveTestDocument() {
  console.log('=== CREATING COMPREHENSIVE TEST DOCUMENT ===\n');
  
  const documentId = 'doc_test_comprehensive_' + Date.now().toString(36);
  
  // Document with both spelling errors AND sentences that need rephrasing
  const documentContent = `
<div class="document-container">
  <div class="page" data-page="1">
    <h1>TECHNICAL OPERATIONS MANUAL</h1>
    <p class="subtitle">Comprehensive Testing Document</p>
    
    <h2>INTRODUCTION</h2>
    <p>This document serves as a comprehesive guide for testing feedback processing systems. The manual contains intentional errors and suboptimal phrasing to facilitate thorough testing of correction mechanisms.</p>
    
    <p>The organizaton has determind that proper documentation is essential for operational success. All personel must adhere to established protocols without exception.</p>
    
    <h2>OPERATIONAL PROCEDURES</h2>
    
    <h3>SAFETY PROTOCOLS</h3>
    <p>Safety requirments must be followed at all times. Failure to comply with safety standards can result in serious consequences including equipment damage, personal injury, or worse outcomes. Technicans are required to complete all mandatory training before performing any maintenence tasks.</p>
    
    <p>It is very important that you always make sure to check all of the equipment before you start using it because if you don't check the equipment then something bad might happen and that would not be good for anyone involved in the operation.</p>
    
    <h3>QUALITY ASSURANCE</h3>
    <p>The quality control process is designed to identify and correct deficiencies before they impact operations. Regular inspections are conducted to ensure complience with standards.</p>
    
    <p>Due to the fact that quality is important, we need to make sure that we are always checking our work and making sure that everything is correct before we move on to the next step in the process.</p>
  </div>
  
  <div class="page" data-page="2">
    <h2>TECHNICAL SPECIFICATIONS</h2>
    
    <h3>SYSTEM REQUIREMENTS</h3>
    <p>The system requires specific operating paramters to function correctly. These specifications have been determind through extensive testing and analysis.</p>
    
    <p>In order to achieve optimal performance, it is necessary to ensure that all system components are functioning within their designated operational parameters and that any deviations from these parameters are immediately addressed through appropriate corrective actions.</p>
    
    <h3>MAINTENANCE PROCEDURES</h3>
    <p>Routine maintainence is critical for system reliablity. All maintenance activities must be documented in the apropriate logs.</p>
    
    <p>At this point in time, we are currently in the process of updating our maintenance procedures to better align with industry best practices and ensure that we are providing the highest level of service possible to our customers.</p>
    
    <p>It should be noted that the aforementioned procedures are subject to change based on evolving requirements and that all personnel should remain cognizant of updates disseminated through official channels.</p>
    
    <h2>OPERATIONAL GUIDELINES</h2>
    
    <h3>STANDARD PROCEDURES</h3>
    <p>Standard operating procedures must be followed to ensure consistant results. Any deviations require supervisory aproval.</p>
    
    <p>In the event that an emergency situation arises, personnel should immediately notify their supervisor and follow the established emergency protocols as outlined in the emergency response manual which can be found in the main office.</p>
  </div>
  
  <div class="page" data-page="3">
    <h2>ADMINISTRATIVE REQUIREMENTS</h2>
    
    <h3>DOCUMENTATION</h3>
    <p>Accurate record keeping is essential for regulatory complience. All documentation must be completed in a timely manner.</p>
    
    <p>It is absolutely critical and of the utmost importance that each and every member of the team understands and appreciates the significance of maintaining accurate and up-to-date records at all times without exception.</p>
    
    <p>Documentation errors can have significant consequences. Therefore, all records must be reviewed for accurracy before submission.</p>
    
    <h3>REPORTING PROCEDURES</h3>
    <p>Reports must be submitted according to the established schedule. Late submissions may result in disciplinary action.</p>
    
    <p>The process of submitting reports involves multiple steps including data collection, analysis, review, and final submission, all of which must be completed in accordance with the established timeline to ensure timely delivery of information to relevant stakeholders.</p>
    
    <h2>CONCLUSION</h2>
    <p>This manual provides essential guidance for operational activities. Adherance to these guidelines ensures optimal performance and safety.</p>
    
    <p>In conclusion, it is important to remember that the information contained within this document represents the collective knowledge and experience of our organization and should be treated as a valuable resource for all personnel.</p>
  </div>
</div>`;

  // Create comprehensive feedback items
  const feedbackItems = [
    // Spelling corrections (simple word changes)
    {
      id: 'fb_comp_001',
      page: 1,
      paragraphNumber: '1.1.1',  // First paragraph under INTRODUCTION
      lineNumber: 1,
      changeFrom: 'comprehesive',
      changeTo: 'comprehensive',
      coordinatorComment: 'Fix spelling',
      coordinatorJustification: 'Correct spelling required',
      pocName: 'Editor One',
      pocEmail: 'editor1@test.mil',
      pocPhone: '555-0001',
      component: 'Introduction',
      commentType: 'A',
      severity: 'MINOR'
    },
    {
      id: 'fb_comp_002',
      page: 1,
      paragraphNumber: '1.1.2',  // Second paragraph under INTRODUCTION
      lineNumber: 1,
      changeFrom: 'organizaton',
      changeTo: 'organization',
      coordinatorComment: 'Fix spelling',
      coordinatorJustification: 'Correct spelling',
      pocName: 'Editor Two',
      pocEmail: 'editor2@test.mil',
      pocPhone: '555-0002',
      component: 'Introduction',
      commentType: 'A',
      severity: 'MINOR'
    },
    {
      id: 'fb_comp_003',
      page: 1,
      paragraphNumber: '1.1.2',  // Same paragraph as fb_comp_002
      lineNumber: 1,
      changeFrom: 'determind',
      changeTo: 'determined',
      coordinatorComment: 'Fix spelling',
      coordinatorJustification: 'Correct spelling',
      pocName: 'Editor Three',
      pocEmail: 'editor3@test.mil',
      pocPhone: '555-0003',
      component: 'Introduction',
      commentType: 'A',
      severity: 'MINOR'
    },
    // Sentence rephrasing (complex changes)
    {
      id: 'fb_comp_004',
      page: 1,
      paragraphNumber: '1.2.1.2',  // Second para under SAFETY PROTOCOLS
      lineNumber: 1,
      changeFrom: 'It is very important that you always make sure to check all of the equipment before you start using it because if you don\'t check the equipment then something bad might happen and that would not be good for anyone involved in the operation.',
      changeTo: 'All equipment must be inspected before use to prevent accidents and ensure operational safety.',
      coordinatorComment: 'Simplify verbose sentence',
      coordinatorJustification: 'Improve clarity and conciseness',
      pocName: 'Senior Editor',
      pocEmail: 'senior@test.mil',
      pocPhone: '555-0004',
      component: 'Safety Protocols',
      commentType: 'S',
      severity: 'MAJOR'
    },
    {
      id: 'fb_comp_005',
      page: 1,
      paragraphNumber: '1.2.2.2',  // Second para under QUALITY ASSURANCE
      lineNumber: 1,
      changeFrom: 'Due to the fact that quality is important, we need to make sure that we are always checking our work and making sure that everything is correct before we move on to the next step in the process.',
      changeTo: 'Quality is essential; all work must be verified before proceeding to the next step.',
      coordinatorComment: 'Eliminate wordiness',
      coordinatorJustification: 'Improve readability',
      pocName: 'QA Manager',
      pocEmail: 'qa@test.mil',
      pocPhone: '555-0005',
      component: 'Quality Assurance',
      commentType: 'S',
      severity: 'MAJOR'
    },
    {
      id: 'fb_comp_006',
      page: 2,
      paragraphNumber: '1.3.1.2',  // Second para under SYSTEM REQUIREMENTS
      lineNumber: 1,
      changeFrom: 'In order to achieve optimal performance, it is necessary to ensure that all system components are functioning within their designated operational parameters and that any deviations from these parameters are immediately addressed through appropriate corrective actions.',
      changeTo: 'Optimal performance requires all system components to operate within designated parameters. Address any deviations immediately.',
      coordinatorComment: 'Reduce redundancy and improve clarity',
      coordinatorJustification: 'Make instructions more direct',
      pocName: 'Tech Lead',
      pocEmail: 'tech@test.mil',
      pocPhone: '555-0006',
      component: 'System Requirements',
      commentType: 'S',
      severity: 'MAJOR'
    },
    {
      id: 'fb_comp_007',
      page: 2,
      paragraphNumber: '1.3.2.2',  // Second para under MAINTENANCE PROCEDURES
      lineNumber: 1,
      changeFrom: 'At this point in time, we are currently in the process of updating our maintenance procedures to better align with industry best practices and ensure that we are providing the highest level of service possible to our customers.',
      changeTo: 'We are updating maintenance procedures to align with industry best practices and improve service quality.',
      coordinatorComment: 'Remove redundant phrases',
      coordinatorJustification: 'Improve conciseness',
      pocName: 'Operations Manager',
      pocEmail: 'ops@test.mil',
      pocPhone: '555-0007',
      component: 'Maintenance',
      commentType: 'S',
      severity: 'MAJOR'
    },
    {
      id: 'fb_comp_008',
      page: 2,
      paragraphNumber: '1.3.2.3',  // Third para under MAINTENANCE PROCEDURES
      lineNumber: 1,
      changeFrom: 'It should be noted that the aforementioned procedures are subject to change based on evolving requirements and that all personnel should remain cognizant of updates disseminated through official channels.',
      changeTo: 'Procedures may change based on evolving requirements. Personnel must stay informed of updates through official channels.',
      coordinatorComment: 'Simplify bureaucratic language',
      coordinatorJustification: 'Improve clarity',
      pocName: 'Policy Director',
      pocEmail: 'policy@test.mil',
      pocPhone: '555-0008',
      component: 'Maintenance',
      commentType: 'S',
      severity: 'MAJOR'
    },
    {
      id: 'fb_comp_009',
      page: 2,
      paragraphNumber: '1.4.1.2',  // Second para under STANDARD PROCEDURES
      lineNumber: 1,
      changeFrom: 'In the event that an emergency situation arises, personnel should immediately notify their supervisor and follow the established emergency protocols as outlined in the emergency response manual which can be found in the main office.',
      changeTo: 'During emergencies, immediately notify your supervisor and follow emergency protocols from the response manual (available in the main office).',
      coordinatorComment: 'Streamline emergency instructions',
      coordinatorJustification: 'Critical instructions must be clear and concise',
      pocName: 'Safety Officer',
      pocEmail: 'safety@test.mil',
      pocPhone: '555-0009',
      component: 'Standard Procedures',
      commentType: 'C',
      severity: 'CRITICAL'
    },
    {
      id: 'fb_comp_010',
      page: 3,
      paragraphNumber: '1.5.1.2',  // Second para under DOCUMENTATION
      lineNumber: 1,
      changeFrom: 'It is absolutely critical and of the utmost importance that each and every member of the team understands and appreciates the significance of maintaining accurate and up-to-date records at all times without exception.',
      changeTo: 'All team members must maintain accurate and current records at all times.',
      coordinatorComment: 'Eliminate excessive emphasis',
      coordinatorJustification: 'Improve professional tone',
      pocName: 'Records Manager',
      pocEmail: 'records@test.mil',
      pocPhone: '555-0010',
      component: 'Documentation',
      commentType: 'S',
      severity: 'MAJOR'
    },
    {
      id: 'fb_comp_011',
      page: 3,
      paragraphNumber: '1.5.2.2',  // Second para under REPORTING PROCEDURES
      lineNumber: 1,
      changeFrom: 'The process of submitting reports involves multiple steps including data collection, analysis, review, and final submission, all of which must be completed in accordance with the established timeline to ensure timely delivery of information to relevant stakeholders.',
      changeTo: 'Report submission involves data collection, analysis, review, and final submission. Complete all steps according to the established timeline.',
      coordinatorComment: 'Break up run-on sentence',
      coordinatorJustification: 'Improve readability',
      pocName: 'Report Coordinator',
      pocEmail: 'reports@test.mil',
      pocPhone: '555-0011',
      component: 'Reporting',
      commentType: 'S',
      severity: 'MAJOR'
    },
    {
      id: 'fb_comp_012',
      page: 3,
      paragraphNumber: '1.6.2',  // Second para under CONCLUSION
      lineNumber: 1,
      changeFrom: 'In conclusion, it is important to remember that the information contained within this document represents the collective knowledge and experience of our organization and should be treated as a valuable resource for all personnel.',
      changeTo: 'This document represents our organization\'s collective knowledge and serves as a valuable resource for all personnel.',
      coordinatorComment: 'Remove unnecessary introduction',
      coordinatorJustification: 'More direct conclusion',
      pocName: 'Document Manager',
      pocEmail: 'docs@test.mil',
      pocPhone: '555-0012',
      component: 'Conclusion',
      commentType: 'A',
      severity: 'MINOR'
    },
    // Additional spelling fixes that depend on previous changes
    {
      id: 'fb_comp_013',
      page: 1,
      paragraphNumber: '1.1.2',  // Same paragraph, different word
      lineNumber: 2,
      changeFrom: 'personel',
      changeTo: 'personnel',
      coordinatorComment: 'Fix spelling',
      coordinatorJustification: 'Correct spelling',
      pocName: 'Proofreader',
      pocEmail: 'proof@test.mil',
      pocPhone: '555-0013',
      component: 'Introduction',
      commentType: 'A',
      severity: 'MINOR'
    },
    {
      id: 'fb_comp_014',
      page: 3,
      paragraphNumber: '1.5.1.3',  // Third para under DOCUMENTATION
      lineNumber: 2,
      changeFrom: 'accurracy',
      changeTo: 'accuracy',
      coordinatorComment: 'Fix spelling',
      coordinatorJustification: 'Correct spelling',
      pocName: 'Quality Control',
      pocEmail: 'qc@test.mil',
      pocPhone: '555-0014',
      component: 'Documentation',
      commentType: 'A',
      severity: 'MINOR'
    }
  ];

  // Create document
  const newDoc = await prisma.document.create({
    data: {
      id: documentId,
      title: 'Comprehensive Test Document - Spelling and Rephrasing',
      fileName: 'comprehensive_test.pdf',
      originalName: 'comprehensive_test.pdf',
      mimeType: 'application/pdf',
      fileSize: 2048000,
      checksum: 'test-' + Date.now(),
      storagePath: '/documents/' + documentId,
      createdBy: { connect: { id: 'cmeys45qj000ojp4izc4fumqb' } },
      organization: { connect: { id: 'cmeys45f10000jp4iccb6f59u' } },
      customFields: {
        content: documentContent,
        draftFeedback: feedbackItems,
        documentType: 'Test Document',
        testInfo: {
          totalFeedback: feedbackItems.length,
          spellingFixes: 5,
          sentenceRephrasings: 9,
          criticalChanges: 1
        }
      }
    }
  });

  console.log('✅ Comprehensive test document created successfully!');
  console.log('\n📄 Document Details:');
  console.log('   ID:', documentId);
  console.log('   Title:', newDoc.title);
  console.log('   Pages: 3');
  console.log('\n📊 Feedback Summary:');
  console.log('   Total feedback items:', feedbackItems.length);
  console.log('   Spelling corrections:', feedbackItems.filter(f => f.changeFrom.split(' ').length === 1).length);
  console.log('   Sentence rephrasings:', feedbackItems.filter(f => f.changeFrom.split(' ').length > 5).length);
  console.log('   Critical:', feedbackItems.filter(f => f.severity === 'CRITICAL').length);
  console.log('   Major:', feedbackItems.filter(f => f.severity === 'MAJOR').length);
  console.log('   Minor:', feedbackItems.filter(f => f.severity === 'MINOR').length);
  
  console.log('\n⚠️  Important Notes:');
  console.log('   - Some spelling fixes depend on sentence changes');
  console.log('   - Test cascading changes (e.g., "determind" appears in multiple places)');
  console.log('   - Sentence changes should preserve meaning while improving clarity');
  
  console.log('\n🔗 View document at:');
  console.log('   http://localhost:3000/documents/' + documentId);
  
  await prisma.$disconnect();
  
  return documentId;
}

createComprehensiveTestDocument().catch(console.error);