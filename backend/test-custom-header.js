const axios = require('axios');

async function testCustomHeader() {
  try {
    // Test with custom header data
    const response = await axios.post('http://localhost:4000/api/ai-document-generator', {
      template: 'policy',
      pages: 2,
      feedbackCount: 3,
      headerData: {
        byOrderOf: 'BY ORDER OF THE',
        secretary: 'CHIEF OF STAFF',
        instructionTitle: 'CUSTOM POLICY DOCUMENT 2025',
        subject: 'DATA GOVERNANCE AND SECURITY',
        responsibilities: 'INFORMATION TECHNOLOGY DIVISION',
        compliance: 'COMPLIANCE IS REQUIRED FOR ALL PERSONNEL',
        accessibility: 'Available on internal network at https://internal.docs/',
        releasability: 'Internal use only - not for public distribution',
        opr: 'IT/SEC',
        certifiedBy: 'John Doe, IT Director',
        documentDate: 'JANUARY 12, 2025'
      }
    });

    console.log('✅ Success! Document created with custom header');
    console.log('Document ID:', response.data.documentId);
    console.log('Title:', response.data.title);
    console.log('Message:', response.data.message);
    
    // Also test with custom seal image (a simple red circle SVG)
    const customSealSvg = 'data:image/svg+xml;base64,' + Buffer.from(
      '<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">' +
      '<circle cx="50" cy="50" r="40" fill="#CC0000"/>' +
      '<text x="50" y="55" text-anchor="middle" fill="white" font-family="Arial" font-size="14">CUSTOM</text>' +
      '</svg>'
    ).toString('base64');
    
    const response2 = await axios.post('http://localhost:4000/api/ai-document-generator', {
      template: 'technical',
      pages: 1,
      feedbackCount: 2,
      sealImage: customSealSvg,
      headerData: {
        secretary: 'TECHNOLOGY OFFICER',
        instructionTitle: 'TECH SPEC 001',
        subject: 'SYSTEM REQUIREMENTS'
      }
    });
    
    console.log('\n✅ Success! Document created with custom seal');
    console.log('Document ID:', response2.data.documentId);
    console.log('Title:', response2.data.title);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testCustomHeader();