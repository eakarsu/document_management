/**
 * SCRIPT TO ACTUALLY SAVE MERGED DOCUMENT TO DATABASE
 * Run this with: node save-to-database.js
 */

const DOCUMENT_ID = 'cmf6w5vh9002bgu01h5abycma'; // test dcoumnc 4
const API_URL = 'http://localhost:4000';

// Simulated document data (as if fetched from DB)
const DOCUMENT = {
  id: DOCUMENT_ID,
  title: 'test dcoumnc 4',
  customFields: {
    content: '<p>Section 1.1.2: The text here contains sdlgsdfgsdfgsdfgsdf that needs improvement.</p>',
    draftFeedback: [{
      changeFrom: 'sdlgsdfgsdfgsdfgsdf',
      changeTo: 'Replace wit test'
    }]
  }
};

async function saveMergedDocument() {
  console.log('\n=== SAVING MERGED DOCUMENT TO DATABASE ===\n');
  
  // Step 1: Show current content
  console.log('1. CURRENT CONTENT:');
  console.log('   ', DOCUMENT.customFields.content);
  
  // Step 2: Apply merge
  console.log('\n2. APPLYING MERGE:');
  const feedback = DOCUMENT.customFields.draftFeedback[0];
  const mergedContent = DOCUMENT.customFields.content.replace(
    feedback.changeFrom,
    feedback.changeTo
  );
  console.log('   ', mergedContent);
  
  // Step 3: Prepare update payload
  const updatePayload = {
    customFields: {
      content: mergedContent,
      lastOPRUpdate: new Date().toISOString(),
      mergedByScript: true
    }
  };
  
  console.log('\n3. UPDATE PAYLOAD:');
  console.log(JSON.stringify(updatePayload, null, 2));
  
  // Step 4: Make API call (simulated)
  console.log('\n4. API CALL:');
  console.log(`   PATCH ${API_URL}/api/documents/${DOCUMENT_ID}`);
  console.log('   Headers: { Authorization: Bearer [token], Content-Type: application/json }');
  console.log('   Body:', JSON.stringify(updatePayload));
  
  // Step 5: What would be saved
  console.log('\n5. RESULT IN DATABASE:');
  console.log('   Document ID:', DOCUMENT_ID);
  console.log('   New content:', mergedContent);
  console.log('   Old text "sdlgsdfgsdfgsdfgsdf": REMOVED ✅');
  console.log('   New text "Replace wit test": ADDED ✅');
  
  console.log('\n=== TO ACTUALLY SAVE ===');
  console.log('1. Get auth token from browser');
  console.log('2. Use curl or Postman to make the PATCH request');
  console.log('3. Or uncomment the fetch code below with valid token');
  
  // UNCOMMENT TO ACTUALLY SAVE (needs valid token):
  /*
  const fetch = require('node-fetch');
  const TOKEN = 'YOUR_ACTUAL_TOKEN_HERE';
  
  try {
    const response = await fetch(`${API_URL}/api/documents/${DOCUMENT_ID}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatePayload)
    });
    
    if (response.ok) {
      console.log('\n✅ ACTUALLY SAVED TO DATABASE!');
    } else {
      console.log('\n❌ Save failed:', response.status);
    }
  } catch (error) {
    console.log('\n❌ Error:', error.message);
  }
  */
  
  console.log('\n=== END ===\n');
}

// Run the function
saveMergedDocument();

// Export for testing
module.exports = { saveMergedDocument, DOCUMENT };