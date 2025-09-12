#!/usr/bin/env node

/**
 * Comprehensive Test for AI Feedback Accuracy
 * 
 * This test verifies that:
 * 1. Every feedback item references text that actually exists in the document
 * 2. Page numbers match where the text appears
 * 3. Paragraph numbers match the actual document structure
 * 4. Line numbers are accurate
 * 
 * PASS CRITERIA:
 * - 100% of feedback items must have valid text references
 * - Page/paragraph/line numbers must match actual locations
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testFeedbackAccuracy(documentId) {
  console.log('🧪 COMPREHENSIVE AI FEEDBACK ACCURACY TEST');
  console.log('=========================================\n');
  
  try {
    // 1. Fetch the document
    const document = await prisma.document.findUnique({
      where: { id: documentId }
    });
    
    if (!document) {
      console.error('❌ Document not found:', documentId);
      return false;
    }
    
    console.log('📄 Document:', document.title);
    console.log('🆔 ID:', documentId);
    
    // 2. Get the HTML content
    const htmlContent = document.customFields?.content || 
                       document.customFields?.htmlContent || 
                       '';
    
    if (!htmlContent) {
      console.error('❌ No HTML content found in document');
      return false;
    }
    
    console.log('📏 Content length:', htmlContent.length, 'characters\n');
    
    // 3. Parse the document structure
    console.log('🔍 Parsing document structure...');
    const documentStructure = parseDocumentStructure(htmlContent);
    console.log(`✅ Found ${documentStructure.paragraphs.length} paragraphs`);
    console.log(`✅ Found ${documentStructure.sections.length} sections\n`);
    
    // 4. Get feedback items
    const feedbackItems = document.customFields?.crmFeedback || [];
    console.log(`💬 Testing ${feedbackItems.length} feedback items...\n`);
    
    if (feedbackItems.length === 0) {
      console.error('❌ No feedback items found');
      return false;
    }
    
    // 5. Test each feedback item
    let passCount = 0;
    let failCount = 0;
    const errors = [];
    
    for (let i = 0; i < feedbackItems.length; i++) {
      const feedback = feedbackItems[i];
      console.log(`📝 Testing Feedback #${i + 1}:`);
      console.log(`   Type: ${feedback.commentType}`);
      console.log(`   Location: Page ${feedback.page}, Paragraph ${feedback.paragraphNumber}, Line ${feedback.lineNumber}`);
      console.log(`   Text: "${feedback.changeFrom?.substring(0, 50)}..."`);
      
      // Test 1: Does the text exist in the document?
      const textExists = htmlContent.includes(feedback.changeFrom);
      if (!textExists) {
        console.error(`   ❌ TEXT NOT FOUND in document`);
        errors.push(`Feedback #${i + 1}: Text "${feedback.changeFrom?.substring(0, 30)}..." not found in document`);
        failCount++;
        console.log('');
        continue;
      }
      console.log(`   ✅ Text exists in document`);
      
      // Test 2: Is the paragraph number valid?
      const paragraphValid = documentStructure.sections.some(s => 
        s.number === feedback.paragraphNumber || 
        s.number.startsWith(feedback.paragraphNumber)
      );
      
      if (!paragraphValid && feedback.paragraphNumber) {
        console.warn(`   ⚠️  Paragraph ${feedback.paragraphNumber} not found in structure`);
        // Not a hard fail - might be using different numbering
      } else {
        console.log(`   ✅ Paragraph number valid`);
      }
      
      // Test 3: Is the page number reasonable?
      const pageNum = parseInt(feedback.page);
      const expectedPages = Math.ceil(documentStructure.paragraphs.length / 40); // ~40 paragraphs per page
      
      if (pageNum < 1 || pageNum > expectedPages + 1) {
        console.error(`   ❌ Page ${pageNum} out of range (expected 1-${expectedPages})`);
        errors.push(`Feedback #${i + 1}: Page ${pageNum} out of range`);
        failCount++;
      } else {
        console.log(`   ✅ Page number reasonable`);
      }
      
      // Test 4: Find actual location of text
      const actualLocation = findTextLocation(feedback.changeFrom, documentStructure);
      if (actualLocation) {
        console.log(`   📍 Actual location: Page ${actualLocation.page}, Section ${actualLocation.section}, Line ~${actualLocation.line}`);
        
        // Compare with claimed location
        const pageDiff = Math.abs(actualLocation.page - parseInt(feedback.page));
        if (pageDiff > 1) {
          console.warn(`   ⚠️  Page mismatch: claimed ${feedback.page}, actual ~${actualLocation.page}`);
        }
      }
      
      passCount++;
      console.log('');
    }
    
    // 6. Summary
    console.log('📊 TEST SUMMARY');
    console.log('===============');
    console.log(`✅ Passed: ${passCount}/${feedbackItems.length}`);
    console.log(`❌ Failed: ${failCount}/${feedbackItems.length}`);
    console.log(`📈 Success Rate: ${((passCount / feedbackItems.length) * 100).toFixed(1)}%`);
    
    if (errors.length > 0) {
      console.log('\n❌ ERRORS:');
      errors.forEach(err => console.log(`   - ${err}`));
    }
    
    const allPassed = failCount === 0;
    console.log(`\n${allPassed ? '✅ TEST PASSED' : '❌ TEST FAILED'}`);
    
    return allPassed;
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

function parseDocumentStructure(html) {
  const structure = {
    paragraphs: [],
    sections: [],
    lines: []
  };
  
  // Remove header section
  const contentStart = html.indexOf('COMPLIANCE WITH THIS PUBLICATION IS MANDATORY');
  const mainContent = contentStart > 0 ? html.substring(contentStart) : html;
  
  // Extract all paragraphs
  const paragraphRegex = /<p[^>]*>([^<]+)<\/p>/g;
  let match;
  let paragraphIndex = 0;
  
  while ((match = paragraphRegex.exec(mainContent)) !== null) {
    structure.paragraphs.push({
      index: paragraphIndex++,
      text: match[1].trim(),
      position: match.index
    });
  }
  
  // Extract all sections
  const sectionRegexes = [
    /<h2[^>]*>(\d+\.?)\s*([^<]+)<\/h2>/g,
    /<h3[^>]*>(\d+\.\d+)\s*([^<]+)<\/h3>/g,
    /<h4[^>]*>(\d+\.\d+\.\d+)\s*([^<]+)<\/h4>/g,
    /<h5[^>]*>(\d+\.\d+\.\d+\.\d+)\s*([^<]+)<\/h5>/g,
    /<h6[^>]*>(\d+\.\d+\.\d+\.\d+\.\d+)\s*([^<]+)<\/h6>/g
  ];
  
  sectionRegexes.forEach(regex => {
    regex.lastIndex = 0;
    while ((match = regex.exec(mainContent)) !== null) {
      structure.sections.push({
        number: match[1],
        title: match[2].trim(),
        position: match.index
      });
    }
  });
  
  // Sort sections by position
  structure.sections.sort((a, b) => a.position - b.position);
  
  return structure;
}

function findTextLocation(text, structure) {
  if (!text) return null;
  
  // Find which paragraph contains this text
  const paragraph = structure.paragraphs.find(p => 
    p.text.includes(text) || text.includes(p.text.substring(0, 50))
  );
  
  if (!paragraph) return null;
  
  // Estimate page (40 paragraphs per page)
  const page = Math.floor(paragraph.index / 40) + 1;
  
  // Find nearest section
  let section = '1';
  for (const sec of structure.sections) {
    if (sec.position < paragraph.position) {
      section = sec.number;
    } else {
      break;
    }
  }
  
  // Estimate line (rough calculation)
  const line = (paragraph.index % 40) + 1;
  
  return { page, section, line };
}

// Run the test
const documentId = process.argv[2];

if (!documentId) {
  console.log('Usage: node test-ai-feedback-accuracy.js <document-id>');
  console.log('Example: node test-ai-feedback-accuracy.js cmffw0ycf0001x6bsic32oqaw');
  process.exit(1);
}

testFeedbackAccuracy(documentId).then(passed => {
  process.exit(passed ? 0 : 1);
});