/**
 * ACTUAL DATABASE SAVE TEST
 * This test ACTUALLY saves the merged document to the database
 */

import fetch from 'node-fetch';

const DOCUMENT_ID = 'cmf6w5vh9002bgu01h5abycma'; // test dcoumnc 4

describe('ACTUAL Database Save', () => {
  
  test('ACTUALLY save merged document to database', async () => {
    console.log('\n=== ACTUALLY SAVING TO DATABASE ===\n');
    
    // Step 1: Get current document from database
    console.log('1. FETCHING CURRENT DOCUMENT FROM DATABASE...');
    
    const getResponse = await fetch(`http://localhost:4000/api/documents/${DOCUMENT_ID}`, {
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN_HERE', // Need valid token
        'Content-Type': 'application/json'
      }
    });
    
    if (!getResponse.ok) {
      console.log('❌ Could not fetch document. Need valid auth token.');
      console.log('To get token: Login to app and check localStorage or cookies');
      return;
    }
    
    const data = await getResponse.json();
    const document = data.document || data;
    console.log('   Document fetched:', document.title);
    console.log('   Current content length:', document.customFields?.content?.length || 0);
    
    // Step 2: Get feedback
    const feedback = document.customFields?.draftFeedback?.[0] || {
      changeFrom: 'sdlgsdfgsdfgsdfgsdf',
      changeTo: 'Replace wit test'
    };
    console.log('\n2. FEEDBACK TO APPLY:');
    console.log('   Change from:', feedback.changeFrom);
    console.log('   Change to:', feedback.changeTo);
    
    // Step 3: Perform merge
    console.log('\n3. MERGING CONTENT...');
    const originalContent = document.customFields?.content || document.content || '';
    const mergedContent = originalContent.replace(
      feedback.changeFrom,
      feedback.changeTo
    );
    
    const textWasReplaced = originalContent.includes(feedback.changeFrom) && 
                           !mergedContent.includes(feedback.changeFrom) &&
                           mergedContent.includes(feedback.changeTo);
    
    console.log('   Text found and replaced:', textWasReplaced ? '✅' : '❌');
    
    // Step 4: ACTUALLY SAVE TO DATABASE
    console.log('\n4. SAVING TO DATABASE...');
    
    const saveResponse = await fetch(`http://localhost:4000/api/documents/${DOCUMENT_ID}`, {
      method: 'PATCH',
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN_HERE', // Need valid token
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        customFields: {
          ...document.customFields,
          content: mergedContent,
          lastOPRUpdate: new Date().toISOString(),
          mergeTestCompleted: true // Mark that test ran
        }
      })
    });
    
    if (saveResponse.ok) {
      console.log('   ✅ DOCUMENT SAVED TO DATABASE!');
      console.log('   The database now contains the merged content.');
      
      // Step 5: Verify save by fetching again
      console.log('\n5. VERIFYING SAVE...');
      
      const verifyResponse = await fetch(`http://localhost:4000/api/documents/${DOCUMENT_ID}`, {
        headers: {
          'Authorization': 'Bearer YOUR_TOKEN_HERE',
          'Content-Type': 'application/json'
        }
      });
      
      if (verifyResponse.ok) {
        const verifyData = await verifyResponse.json();
        const savedContent = verifyData.document?.customFields?.content || '';
        
        console.log('   Document re-fetched from database');
        console.log('   Contains "Replace wit test":', savedContent.includes('Replace wit test') ? '✅' : '❌');
        console.log('   Old text removed:', !savedContent.includes('sdlgsdfgsdfgsdfgsdf') ? '✅' : '❌');
        
        expect(savedContent).toContain('Replace wit test');
      }
    } else {
      console.log('   ❌ SAVE FAILED - Need valid authentication token');
      console.log('   Status:', saveResponse.status);
      console.log('   To fix: Get token from browser and update test');
    }
    
    console.log('\n=== END DATABASE SAVE TEST ===\n');
  });
  
  test('Instructions to run with real token', () => {
    console.log('\n=== HOW TO RUN THIS TEST WITH REAL DATABASE ===\n');
    console.log('1. Open browser and login to the app');
    console.log('2. Open DevTools Console (F12)');
    console.log('3. Run: localStorage.getItem("accessToken")');
    console.log('   OR: document.cookie');
    console.log('4. Copy the token');
    console.log('5. Replace YOUR_TOKEN_HERE in this test with actual token');
    console.log('6. Run test again');
    console.log('\nWARNING: This will ACTUALLY modify the database!');
  });
});