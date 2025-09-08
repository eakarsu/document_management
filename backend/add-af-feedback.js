const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addFeedbackToAFManual() {
  console.log('Adding feedback to Air Force Manual...\n');
  
  const documentId = 'doc_af_manual_mfbc7cmi';
  
  // Get the document
  const document = await prisma.document.findUnique({
    where: { id: documentId }
  });
  
  if (!document) {
    throw new Error('Document not found');
  }
  
  const feedbackItems = [
    // Page 1 feedback - fixing typos in the actual document content
    {
      id: 'fb_af_001',
      page: 1,
      paragraphNumber: 1,
      lineNumber: 3,
      changeFrom: 'MAINTENENCE',
      changeTo: 'MAINTENANCE',
      coordinatorComment: 'Fix spelling of maintenance in header',
      coordinatorJustification: 'Correct spelling required for official document',
      pocName: 'Lt Col Smith',
      pocEmail: 'smith@af.mil',
      pocPhone: '555-0101',
      component: 'Header',
      commentType: 'S',
      severity: 'MAJOR'
    },
    {
      id: 'fb_af_002',
      page: 1,
      paragraphNumber: 2,
      lineNumber: 1,
      changeFrom: 'comprehesive maintenance instructions and operational guidelines for F-16C Fighting Falcon aircraft maintainance',
      changeTo: 'comprehensive maintenance instructions and operational guidelines for F-16C Fighting Falcon aircraft maintenance',
      coordinatorComment: 'Multiple spelling errors in purpose statement',
      coordinatorJustification: 'Critical for document accuracy',
      pocName: 'Maj Johnson',
      pocEmail: 'johnson@af.mil',
      pocPhone: '555-0102',
      component: 'Section 1.1',
      commentType: 'S',
      severity: 'MAJOR'
    },
    {
      id: 'fb_af_003',
      page: 1,
      paragraphNumber: 2,
      lineNumber: 2,
      changeFrom: 'personel',
      changeTo: 'personnel',
      coordinatorComment: 'Fix spelling of personnel',
      coordinatorJustification: 'Standard military terminology',
      pocName: 'Capt Davis',
      pocEmail: 'davis@af.mil',
      pocPhone: '555-0103',
      component: 'Section 1.1',
      commentType: 'A',
      severity: 'MINOR'
    },
    {
      id: 'fb_af_004',
      page: 1,
      paragraphNumber: 3,
      lineNumber: 1,
      changeFrom: 'requirments',
      changeTo: 'requirements',
      coordinatorComment: 'Fix spelling of requirements',
      coordinatorJustification: 'Correct spelling needed',
      pocName: 'MSgt Brown',
      pocEmail: 'brown@af.mil',
      pocPhone: '555-0104',
      component: 'Section 1.2',
      commentType: 'A',
      severity: 'MINOR'
    },
    {
      id: 'fb_af_005',
      page: 1,
      paragraphNumber: 3,
      lineNumber: 2,
      changeFrom: 'Technicans shall complete required training before performing maintenence',
      changeTo: 'Technicians shall complete required training before performing maintenance',
      coordinatorComment: 'Fix spelling of technicians and maintenance',
      coordinatorJustification: 'Safety-critical terminology must be correct',
      pocName: 'TSgt Wilson',
      pocEmail: 'wilson@af.mil',
      pocPhone: '555-0105',
      component: 'Section 1.2',
      commentType: 'S',
      severity: 'MAJOR'
    },
    {
      id: 'fb_af_006',
      page: 1,
      paragraphNumber: 4,
      lineNumber: 1,
      changeFrom: 'capabilites',
      changeTo: 'capabilities',
      coordinatorComment: 'Fix spelling of capabilities',
      coordinatorJustification: 'Technical specification accuracy',
      pocName: 'SSgt Garcia',
      pocEmail: 'garcia@af.mil',
      pocPhone: '555-0106',
      component: 'Section 1.3',
      commentType: 'A',
      severity: 'MINOR'
    },
    {
      id: 'fb_af_007',
      page: 1,
      paragraphNumber: 4,
      lineNumber: 2,
      changeFrom: 'paramters',
      changeTo: 'parameters',
      coordinatorComment: 'Fix spelling of parameters',
      coordinatorJustification: 'Technical accuracy',
      pocName: 'A1C Martinez',
      pocEmail: 'martinez@af.mil',
      pocPhone: '555-0107',
      component: 'Section 1.3',
      commentType: 'A',
      severity: 'MINOR'
    },
    // Page 2 feedback
    {
      id: 'fb_af_008',
      page: 2,
      paragraphNumber: 1,
      lineNumber: 1,
      changeFrom: 'determind',
      changeTo: 'determined',
      coordinatorComment: 'Fix spelling of determined',
      coordinatorJustification: 'Procedural clarity',
      pocName: 'SrA Anderson',
      pocEmail: 'anderson@af.mil',
      pocPhone: '555-0108',
      component: 'Section 3.1',
      commentType: 'A',
      severity: 'MINOR'
    },
    {
      id: 'fb_af_009',
      page: 2,
      paragraphNumber: 1,
      lineNumber: 2,
      changeFrom: 'componets',
      changeTo: 'components',
      coordinatorComment: 'Fix spelling of components',
      coordinatorJustification: 'Technical accuracy',
      pocName: 'Amn Taylor',
      pocEmail: 'taylor@af.mil',
      pocPhone: '555-0109',
      component: 'Section 3.1',
      commentType: 'A',
      severity: 'MINOR'
    },
    {
      id: 'fb_af_010',
      page: 2,
      paragraphNumber: 2,
      lineNumber: 2,
      changeFrom: 'availible',
      changeTo: 'available',
      coordinatorComment: 'Fix spelling of available',
      coordinatorJustification: 'Safety equipment terminology',
      pocName: 'Lt Thompson',
      pocEmail: 'thompson@af.mil',
      pocPhone: '555-0110',
      component: 'Section 3.2',
      commentType: 'A',
      severity: 'MINOR'
    },
    // Page 3 feedback
    {
      id: 'fb_af_011',
      page: 3,
      paragraphNumber: 1,
      lineNumber: 3,
      changeFrom: 'emergancy',
      changeTo: 'emergency',
      coordinatorComment: 'Fix spelling of emergency',
      coordinatorJustification: 'Critical safety terminology',
      pocName: 'CWO White',
      pocEmail: 'white@af.mil',
      pocPhone: '555-0111',
      component: 'Section 6.1',
      commentType: 'S',
      severity: 'MAJOR'
    },
    {
      id: 'fb_af_012',
      page: 3,
      paragraphNumber: 5,
      lineNumber: 2,
      changeFrom: 'complience',
      changeTo: 'compliance',
      coordinatorComment: 'Fix spelling of compliance',
      coordinatorJustification: 'Regulatory terminology must be correct',
      pocName: 'Col Harris',
      pocEmail: 'harris@af.mil',
      pocPhone: '555-0112',
      component: 'Section 8.1',
      commentType: 'C',
      severity: 'CRITICAL'
    }
  ];
  
  // Update document with feedback
  await prisma.document.update({
    where: { id: documentId },
    data: {
      customFields: {
        ...document.customFields,
        draftFeedback: feedbackItems
      }
    }
  });
  
  console.log('✅ Added', feedbackItems.length, 'feedback items to Air Force Manual');
  console.log('\nFeedback summary:');
  console.log('  Critical:', feedbackItems.filter(f => f.severity === 'CRITICAL').length);
  console.log('  Major:', feedbackItems.filter(f => f.severity === 'MAJOR').length);
  console.log('  Minor:', feedbackItems.filter(f => f.severity === 'MINOR').length);
  
  console.log('\nReady to run automated-opr-review-test.js');
  
  await prisma.$disconnect();
}

addFeedbackToAFManual().catch(console.error);