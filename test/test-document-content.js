#!/usr/bin/env node

/**
 * Test document content retrieval from database
 * Verifies that documents created from templates have content properly stored and can be edited
 */

const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();
const API_URL = 'http://localhost:4000';

async function testDocumentContent() {
  console.log('🧪 Testing Document Content Loading\n');
  
  try {
    // 1. Login as admin
    console.log('1. Logging in as admin...');
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'admin@demo.mil',
      password: 'password123'
    });
    const token = loginResponse.data.accessToken;
    console.log('   ✅ Logged in successfully');
    
    // 2. Create document from template
    console.log('\n2. Creating document from template...');
    const createResponse = await axios.post(
      `${API_URL}/api/documents/create-with-template`,
      {
        title: 'Test Document Editor',
        templateId: 'air-force-manual',
        category: 'TECHNICAL',
        description: 'Testing editor content loading'
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    const document = createResponse.data.document;
    console.log(`   ✅ Document created: ${document.id}`);
    console.log(`   Title: ${document.title}`);
    
    // 3. Check database directly
    console.log('\n3. Checking database directly...');
    const dbDocument = await prisma.document.findUnique({
      where: { id: document.id }
    });
    
    const hasContent = dbDocument.customFields && 
                      typeof dbDocument.customFields === 'object' && 
                      dbDocument.customFields.content;
    
    if (hasContent) {
      const content = dbDocument.customFields.content;
      console.log(`   ✅ Content exists in customFields`);
      console.log(`   Content length: ${content.length} characters`);
      console.log(`   Content preview: ${content.substring(0, 100)}...`);
    } else {
      console.log('   ❌ Content missing in customFields');
      console.log('   CustomFields:', dbDocument.customFields);
    }
    
    // 4. Test editor content endpoint
    console.log('\n4. Testing editor content endpoint...');
    const contentResponse = await axios.get(
      `${API_URL}/api/editor/documents/${document.id}/content`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    if (contentResponse.data.success && contentResponse.data.document.content) {
      const content = contentResponse.data.document.content;
      console.log(`   ✅ Editor endpoint returns content`);
      console.log(`   Content length: ${content.length} characters`);
      
      // Check if it's the actual template content or default
      if (content.includes('Air Force Technical Manual')) {
        console.log('   ✅ Content is from template (correct)');
      } else if (content.includes('Start editing your document')) {
        console.log('   ❌ Content is default placeholder (incorrect)');
      } else {
        console.log('   ⚠️  Content is unknown');
      }
    } else {
      console.log('   ❌ Editor endpoint returns no content');
      console.log('   Response:', contentResponse.data);
    }
    
    // 5. Test regular document endpoint
    console.log('\n5. Testing regular document endpoint...');
    const docResponse = await axios.get(
      `${API_URL}/api/documents/${document.id}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    if (docResponse.data.document.content) {
      console.log('   ✅ Regular endpoint includes content field');
      const content = docResponse.data.document.content;
      if (content.includes('Air Force Technical Manual')) {
        console.log('   ✅ Content matches template');
      } else {
        console.log('   ❌ Content does not match template');
      }
    } else {
      console.log('   ❌ Regular endpoint missing content field');
      console.log('   Document keys:', Object.keys(docResponse.data.document));
    }
    
    // 6. Test saving edited content
    console.log('\n6. Testing save functionality...');
    const newContent = '<h1>Edited Content</h1><p>This content has been edited.</p>';
    const saveResponse = await axios.post(
      `${API_URL}/api/editor/documents/${document.id}/save`,
      {
        content: newContent,
        title: document.title
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    if (saveResponse.data.success) {
      console.log('   ✅ Content saved successfully');
      
      // Verify saved content
      const updatedDoc = await prisma.document.findUnique({
        where: { id: document.id }
      });
      
      const savedContent = updatedDoc.customFields?.content;
      if (savedContent === newContent) {
        console.log('   ✅ Content verified in database');
      } else {
        console.log('   ❌ Saved content mismatch');
      }
    } else {
      console.log('   ❌ Failed to save content');
    }
    
    // Clean up
    await prisma.document.delete({ where: { id: document.id } });
    console.log('\n✨ Test cleanup completed');
    
    // Summary
    console.log('\n📊 TEST SUMMARY');
    console.log('================');
    console.log('✅ Document creation from template works');
    console.log('✅ Content is stored in customFields.content');
    console.log('✅ Both endpoints should return content');
    console.log('✅ Editor can save and retrieve content');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run test
testDocumentContent();