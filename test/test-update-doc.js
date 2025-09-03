// Test script to add content to a document
const axios = require('axios');

async function updateDocumentContent() {
  const documentId = 'cmf05xtwa0001nrfblq3vy1lj';
  
  const htmlContent = `
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
    
    <h3>2.1 Personal Protective Equipment</h3>
    <p>All personnel must wear appropriate PPE including:</p>
    <ol>
      <li>Safety glasses</li>
      <li>Hearing protection</li>
      <li>Steel-toed boots</li>
      <li>High-visibility vests when on flightline</li>
    </ol>
    
    <blockquote>
      <p>"Excellence in all we do" - This core value drives our commitment to safety and operational excellence.</p>
    </blockquote>
    
    <h2>Chapter 3: Operational Procedures</h2>
    <p>Standard operating procedures must be followed at all times. Any deviation requires written authorization from the appropriate command level.</p>
    
    <p><em>Last updated: ${new Date().toLocaleDateString()}</em></p>
  `;

  try {
    // First login as OPR to get token
    const loginResponse = await axios.post('http://localhost:4000/api/auth/login', {
      email: 'opr@demo.mil',
      password: 'Test123!@#'
    });

    const token = loginResponse.data.accessToken;
    console.log('Logged in, token received');

    // Update document content
    const response = await axios.put(
      `http://localhost:4000/api/documents/${documentId}`,
      {
        content: htmlContent,
        title: 'Air Force Technical Manual - AFM 2024-001'
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    console.log('Document updated:', response.data.success ? 'Success' : 'Failed');
    if (!response.data.success) {
      console.log('Error:', response.data.error);
    }
  } catch (error) {
    console.error('Error updating document:', error);
  }
}

updateDocumentContent();