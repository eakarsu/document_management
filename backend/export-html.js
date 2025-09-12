#!/usr/bin/env node

/**
 * Export HTML content from database document
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Parse command line arguments
const documentId = process.argv[2];

if (!documentId) {
  console.log('Usage: node export-html.js <document-id>');
  process.exit(0);
}

async function exportHTML() {
  try {
    console.log(`📄 Exporting HTML for document: ${documentId}`);
    
    // Find document in database
    const document = await prisma.document.findUnique({
      where: { id: documentId }
    });
    
    if (!document) {
      console.error(`❌ Document not found: ${documentId}`);
      process.exit(1);
    }
    
    // Extract HTML content
    const htmlContent = document.customFields?.content;
    
    if (!htmlContent) {
      console.error(`❌ No HTML content found in document: ${documentId}`);
      process.exit(1);
    }
    
    // Save to file
    const filename = `${documentId}.html`;
    const filepath = path.join(__dirname, filename);
    
    fs.writeFileSync(filepath, htmlContent);
    
    console.log(`✅ HTML exported successfully!`);
    console.log(`📁 File: ${filepath}`);
    console.log(`📊 Size: ${(Buffer.byteLength(htmlContent, 'utf8') / 1024).toFixed(2)} KB`);
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

exportHTML();