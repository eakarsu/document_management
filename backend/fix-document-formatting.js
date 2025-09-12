const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function fixDocumentFormatting() {
  try {
    // Read the original HTML file
    const htmlPath = path.join(__dirname, 'long_document_output.html');
    const fullHtml = fs.readFileSync(htmlPath, 'utf-8');
    
    // Extract the header section (everything before <h1>1. OVERVIEW</h1>)
    const overviewIndex = fullHtml.indexOf('<h1>1. OVERVIEW</h1>');
    const bodyStartIndex = fullHtml.indexOf('<body>') + 6;
    const bodyEndIndex = fullHtml.indexOf('</body>');
    
    // Extract full body content including header
    const fullBodyContent = fullHtml.substring(bodyStartIndex, bodyEndIndex);
    
    // Extract just the document content (after the header section)
    const documentContentStart = fullHtml.indexOf('<h1>1. OVERVIEW</h1>');
    const editableContent = fullHtml.substring(documentContentStart, bodyEndIndex);
    
    // Extract styles
    const styleStart = fullHtml.indexOf('<style>');
    const styleEnd = fullHtml.indexOf('</style>') + 8;
    const styles = fullHtml.substring(styleStart, styleEnd);
    
    // Create a properly formatted content that preserves the header
    const formattedContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>AIR FORCE INSTRUCTION 36-2903 - DRESS AND APPEARANCE STANDARDS</title>
  ${styles}
</head>
<body>
${fullBodyContent}
</body>
</html>`;

    // Update the document with properly formatted content
    const updatedDoc = await prisma.document.update({
      where: { id: 'cmffo4zta0001125e4twigu39' },
      data: {
        customFields: {
          // Preserve all existing fields
          documentType: 'Air Force Instruction',
          instructionNumber: 'AFI 36-2903',
          effectiveDate: new Date().toISOString(),
          pages: 10,
          wordCount: 5666,
          paragraphs: 62,
          generatedBy: 'AI Document Generator',
          model: 'google/gemini-2.5-flash',
          
          // Store different versions of content
          content: formattedContent,  // Full HTML with header for viewing
          htmlContent: fullHtml,       // Original complete HTML
          editableContent: editableContent,  // Just the body content for editing
          headerHtml: fullBodyContent.substring(0, documentContentStart - bodyStartIndex), // Just the header
          
          // Store styles separately
          documentStyles: styles,
          
          // Flag to indicate this has special formatting
          hasCustomHeader: true,
          preserveFormatting: true
        }
      }
    });
    
    console.log('✅ Document formatting fixed!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📄 Document ID:', updatedDoc.id);
    console.log('📝 Title:', updatedDoc.title);
    console.log('✨ Formatting preserved: Yes');
    console.log('🎨 Has custom header: Yes');
    console.log('📏 Content sections stored:');
    console.log('   - Full formatted HTML (for viewing)');
    console.log('   - Editable content (for editor)');
    console.log('   - Header HTML (preserved separately)');
    console.log('   - Document styles (can be reapplied)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🔗 View the document at:');
    console.log(`   http://localhost:3000/documents/${updatedDoc.id}`);
    console.log('\n💡 The document now preserves the Air Force header formatting!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixDocumentFormatting();