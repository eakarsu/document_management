const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function storeDocument() {
  try {
    // Read the HTML file
    const htmlPath = path.join(__dirname, 'long_document_output.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
    
    // Extract title from HTML
    const titleMatch = htmlContent.match(/<title>(.*?)<\/title>/);
    const title = titleMatch ? titleMatch[1] : 'AIR FORCE INSTRUCTION 36-2903';
    
    // Get admin user
    const adminUser = await prisma.user.findFirst({
      where: {
        email: 'admin@richmond-dms.com'
      }
    });
    
    if (!adminUser) {
      throw new Error('Admin user not found. Please ensure the database is seeded.');
    }
    
    // Get admin organization
    const adminOrg = await prisma.organization.findFirst({
      where: {
        users: {
          some: {
            id: adminUser.id
          }
        }
      }
    });
    
    if (!adminOrg) {
      throw new Error('Admin organization not found');
    }
    
    // Generate checksum for the document
    const crypto = require('crypto');
    const checksum = crypto.createHash('sha256').update(htmlContent).digest('hex');
    
    // Check if document with this checksum already exists
    const existingDoc = await prisma.document.findUnique({
      where: { checksum }
    });
    
    if (existingDoc) {
      console.log(`Document already exists with ID: ${existingDoc.id}`);
      return existingDoc;
    }
    
    // Create the document
    const document = await prisma.document.create({
      data: {
        title: 'AIR FORCE INSTRUCTION 36-2903 - DRESS AND APPEARANCE STANDARDS',
        description: 'Comprehensive Air Force dress and appearance standards instruction covering all aspects of military uniform wear, grooming standards, and personal appearance requirements.',
        fileName: 'afi_36_2903.html',
        originalName: 'long_document_output.html',
        mimeType: 'text/html',
        fileSize: Buffer.byteLength(htmlContent, 'utf8'),
        checksum: checksum,
        storagePath: `documents/${Date.now()}_afi_36_2903.html`,
        storageProvider: 'local',
        status: 'PUBLISHED',
        category: 'MILITARY_INSTRUCTION',
        tags: ['air-force', 'instruction', 'dress-code', 'appearance', 'uniform', 'military', 'standards'],
        customFields: {
          documentType: 'Air Force Instruction',
          instructionNumber: 'AFI 36-2903',
          effectiveDate: new Date().toISOString(),
          pages: 10,
          wordCount: 5666,
          paragraphs: 62,
          generatedBy: 'AI Document Generator',
          model: 'google/gemini-2.5-flash',
          htmlContent: htmlContent
        },
        documentNumber: `AFI-36-2903-${Date.now()}`,
        createdById: adminUser.id,
        organizationId: adminOrg.id,
        currentVersion: 1,
        ocrProcessed: false,
        aiClassification: 'Military Instruction',
        aiTags: ['dress-standards', 'appearance', 'uniform-policy'],
        aiConfidence: 0.95
      }
    });
    
    console.log('\n✅ Document successfully stored in database!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📄 Document ID: ${document.id}`);
    console.log(`📝 Title: ${document.title}`);
    console.log(`📊 Size: ${(document.fileSize / 1024).toFixed(2)} KB`);
    console.log(`🏷️  Tags: ${document.tags.join(', ')}`);
    console.log(`👤 Uploaded by: ${adminUser.email}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🔗 View the document in the application:');
    console.log(`   http://localhost:3000/documents/${document.id}`);
    console.log('\n📱 Or browse all documents:');
    console.log('   http://localhost:3000/documents');
    console.log('\n');
    
    return document;
  } catch (error) {
    console.error('❌ Error storing document:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
storeDocument()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });