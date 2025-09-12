#!/usr/bin/env node

/**
 * Fix formatting for all existing AI-generated documents
 * Adds proper paragraph spacing and line height
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/document_management'
    }
  }
});

async function fixDocumentFormatting(content) {
  if (!content) return content;
  
  // Add spacing to all paragraphs that don't already have it
  let fixed = content;
  
  // Fix plain <p> tags
  fixed = fixed.replace(/<p>/g, '<p style="margin-bottom: 1.5em; line-height: 1.8;">');
  
  // Fix indented paragraphs - preserve existing margin-left and add spacing
  fixed = fixed.replace(/<p style="margin-left: (\d+)px;">/g, 
    '<p style="margin-left: $1px; margin-bottom: 1.5em; line-height: 1.8;">');
  
  // Fix paragraphs that already have some styles but not spacing
  fixed = fixed.replace(/<p style="([^"]+)">/g, function(match, styles) {
    if (!styles.includes('margin-bottom')) {
      styles += '; margin-bottom: 1.5em';
    }
    if (!styles.includes('line-height')) {
      styles += '; line-height: 1.8';
    }
    return `<p style="${styles}">`;
  });
  
  // Remove any "Here is..." or "As requested..." intro text
  fixed = fixed.replace(/^[^<]*Here is[^<]*/, '');
  fixed = fixed.replace(/^[^<]*As requested[^<]*/, '');
  
  return fixed;
}

async function main() {
  try {
    console.log('🔧 Starting document formatting fix...\n');
    
    // Find all documents with AI-generated content
    const documents = await prisma.document.findMany({
      where: {
        OR: [
          { customFields: { path: ['generatedBy'], equals: 'AI' } },
          { customFields: { path: ['deepNesting'], equals: true } },
          { description: { contains: 'AI generated' } }
        ]
      }
    });
    
    console.log(`📄 Found ${documents.length} AI-generated documents to fix\n`);
    
    let fixedCount = 0;
    
    for (const doc of documents) {
      console.log(`Processing: ${doc.title} (${doc.id})`);
      
      const customFields = doc.customFields || {};
      let needsUpdate = false;
      
      // Fix htmlContent
      if (customFields.htmlContent) {
        const fixedHtml = await fixDocumentFormatting(customFields.htmlContent);
        if (fixedHtml !== customFields.htmlContent) {
          customFields.htmlContent = fixedHtml;
          needsUpdate = true;
        }
      }
      
      // Fix editableContent
      if (customFields.editableContent) {
        const fixedEditable = await fixDocumentFormatting(customFields.editableContent);
        if (fixedEditable !== customFields.editableContent) {
          customFields.editableContent = fixedEditable;
          needsUpdate = true;
        }
      }
      
      if (needsUpdate) {
        await prisma.document.update({
          where: { id: doc.id },
          data: { customFields }
        });
        console.log(`  ✅ Fixed formatting\n`);
        fixedCount++;
      } else {
        console.log(`  ⏭️  Already properly formatted\n`);
      }
    }
    
    console.log(`\n✨ Fixed ${fixedCount} documents`);
    console.log(`📊 ${documents.length - fixedCount} were already properly formatted`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();