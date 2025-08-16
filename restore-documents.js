#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// MIME type mappings
const getMimeType = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    '.pdf': 'application/pdf',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.html': 'text/html',
    '.txt': 'text/plain'
  };
  return mimeTypes[ext] || 'application/octet-stream';
};

// Generate document title from filename
const generateTitle = (filename) => {
  // Remove timestamp and random numbers, clean up filename
  let title = filename
    .replace(/^(document-|file-)\d+-\d+/, '') // Remove prefixes and timestamps
    .replace(/\.[^.]+$/, '') // Remove extension
    .replace(/[-_]/g, ' ') // Replace dashes/underscores with spaces
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
  
  if (!title) {
    // If no meaningful title, use file extension type
    const ext = path.extname(filename).replace('.', '');
    title = `Document (${ext.toUpperCase()})`;
  }
  
  // Capitalize first letter of each word
  title = title.replace(/\b\w/g, l => l.toUpperCase());
  
  return title;
};

// Calculate file checksum
const calculateChecksum = (filePath) => {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(fileBuffer).digest('hex');
};

async function restoreDocuments() {
  try {
    console.log('🔄 Starting document restoration...');
    
    // Get demo user to assign as document creator
    const demoUser = await prisma.user.findFirst({
      where: { email: 'admin@richmond-dms.com' }
    });
    
    if (!demoUser) {
      throw new Error('Demo admin user not found. Run database seeding first.');
    }

    // Get organization
    const organization = await prisma.organization.findFirst();
    if (!organization) {
      throw new Error('No organization found. Run database seeding first.');
    }

    const uploadsDir = './backend/uploads';
    const files = fs.readdirSync(uploadsDir)
      .filter(file => file.match(/\.(pdf|docx|xlsx|html|txt)$/i))
      .filter(file => file.startsWith('document-') || file.startsWith('file-'));

    console.log(`📄 Found ${files.length} document files to restore`);

    let restoredCount = 0;
    let skippedCount = 0;

    for (const filename of files) {
      const filePath = path.join(uploadsDir, filename);
      const stats = fs.statSync(filePath);
      
      try {
        // Calculate checksum to check if already exists
        const checksum = calculateChecksum(filePath);
        
        // Check if document already exists with this checksum
        const existingDoc = await prisma.document.findFirst({
          where: { checksum }
        });
        
        if (existingDoc) {
          console.log(`⏭️  Skipping ${filename} - already exists`);
          skippedCount++;
          continue;
        }

        // Create document record
        const title = generateTitle(filename);
        const mimeType = getMimeType(filename);
        
        const document = await prisma.document.create({
          data: {
            title,
            description: `Restored document from ${filename}`,
            fileName: filename,
            originalName: filename,
            mimeType,
            fileSize: stats.size,
            checksum,
            storagePath: `uploads/${filename}`,
            storageProvider: 'local',
            status: 'APPROVED', // Set as approved since they were previously uploaded
            createdById: demoUser.id,
            organizationId: organization.id,
            createdAt: stats.birthtime || stats.mtime, // Use file creation time
            currentVersion: 1
          }
        });

        // Create initial version record
        await prisma.documentVersion.create({
          data: {
            documentId: document.id,
            versionNumber: 1,
            title,
            description: 'Initial version (restored)',
            fileName: filename,
            fileSize: stats.size,
            checksum,
            storagePath: `uploads/${filename}`,
            changeType: 'MAJOR',
            changeNotes: 'Document restored from backup files',
            createdById: demoUser.id,
            createdAt: stats.birthtime || stats.mtime
          }
        });

        console.log(`✅ Restored: ${title} (${filename})`);
        restoredCount++;

      } catch (error) {
        console.error(`❌ Failed to restore ${filename}:`, error.message);
      }
    }

    console.log('\n📊 Restoration Summary:');
    console.log(`✅ Successfully restored: ${restoredCount} documents`);
    console.log(`⏭️  Skipped (already exist): ${skippedCount} documents`);
    console.log(`📄 Total files processed: ${files.length}`);
    
    // Verify final count
    const totalDocs = await prisma.document.count();
    console.log(`🎯 Total documents in database: ${totalDocs}`);

  } catch (error) {
    console.error('❌ Restoration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the restoration
restoreDocuments();