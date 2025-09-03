const puppeteer = require('puppeteer');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testEditorContent() {
  console.log('\n=== TESTING EDITOR CONTENT (EMPTY OR NOT) ===\n');
  
  let browser;
  
  try {
    // 1. Get documents from database
    console.log('📊 Checking database for documents...');
    const documents = await prisma.document.findMany({
      take: 5,
      select: {
        id: true,
        title: true,
        description: true
      }
    });
    
    console.log(`Found ${documents.length} documents to test\n`);
    
    // 2. Launch browser
    browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1400, height: 900 }
    });
    
    const page = await browser.newPage();
    
    // 3. Test each document's editor content
    for (const doc of documents) {
      console.log(`\n📄 Testing document: "${doc.title}"`);
      console.log(`   ID: ${doc.id}`);
      
      // Navigate directly to editor
      const editorUrl = `http://localhost:3000/editor/${doc.id}`;
      await page.goto(editorUrl, { waitUntil: 'networkidle2' });
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check if we're on editor page or redirected
      const currentUrl = page.url();
      
      if (currentUrl.includes('/login')) {
        console.log('   ⚠️  Redirected to login - skipping auth check');
        continue;
      }
      
      // Check for editor content
      const editorStatus = await page.evaluate(() => {
        // Look for TipTap/ProseMirror editor
        const editorElement = document.querySelector('.ProseMirror') || 
                             document.querySelector('[contenteditable="true"]') ||
                             document.querySelector('.tiptap') ||
                             document.querySelector('[data-editor]');
        
        if (!editorElement) {
          return { found: false };
        }
        
        // Get editor content
        const textContent = editorElement.textContent || '';
        const htmlContent = editorElement.innerHTML || '';
        
        // Check if content is empty or just has placeholder text
        const isEmpty = 
          textContent.trim() === '' ||
          htmlContent === '<p></p>' ||
          htmlContent === '<p><br></p>' ||
          htmlContent === '<p><br class="ProseMirror-trailingBreak"></p>';
        
        // Check for default/placeholder content
        const hasPlaceholder = 
          textContent.includes('Start editing') ||
          textContent.includes('Type here') ||
          textContent.includes('Enter text');
        
        // Count actual content
        const wordCount = textContent.split(/\s+/).filter(word => word.length > 0).length;
        const charCount = textContent.replace(/\s/g, '').length;
        
        return {
          found: true,
          isEmpty: isEmpty,
          hasPlaceholder: hasPlaceholder,
          textContent: textContent.substring(0, 100),
          htmlContent: htmlContent.substring(0, 100),
          wordCount: wordCount,
          charCount: charCount,
          contentLength: textContent.length
        };
      });
      
      if (editorStatus.found) {
        console.log('   ✅ Editor found');
        
        if (editorStatus.isEmpty) {
          console.log('   📭 EMPTY: Editor has no content');
        } else {
          console.log('   📬 HAS CONTENT: Editor contains text');
          console.log(`      - Word count: ${editorStatus.wordCount}`);
          console.log(`      - Character count: ${editorStatus.charCount}`);
          console.log(`      - Total length: ${editorStatus.contentLength}`);
          
          if (editorStatus.hasPlaceholder) {
            console.log('      - Contains placeholder text');
          }
          
          console.log(`      - Preview: "${editorStatus.textContent}..."`);
        }
        
        // Additional checks for specific content
        const contentChecks = await page.evaluate(() => {
          const editor = document.querySelector('.ProseMirror') || 
                        document.querySelector('[contenteditable="true"]');
          
          if (!editor) return {};
          
          return {
            hasHeadings: editor.querySelectorAll('h1, h2, h3, h4, h5, h6').length > 0,
            hasParagraphs: editor.querySelectorAll('p').length > 0,
            hasLists: editor.querySelectorAll('ul, ol').length > 0,
            hasTables: editor.querySelectorAll('table').length > 0,
            hasImages: editor.querySelectorAll('img').length > 0,
            hasLinks: editor.querySelectorAll('a').length > 0,
            hasBold: editor.querySelectorAll('strong, b').length > 0,
            hasItalic: editor.querySelectorAll('em, i').length > 0
          };
        });
        
        // Report content types found
        const contentTypes = [];
        if (contentChecks.hasHeadings) contentTypes.push('headings');
        if (contentChecks.hasParagraphs) contentTypes.push('paragraphs');
        if (contentChecks.hasLists) contentTypes.push('lists');
        if (contentChecks.hasTables) contentTypes.push('tables');
        if (contentChecks.hasImages) contentTypes.push('images');
        if (contentChecks.hasLinks) contentTypes.push('links');
        if (contentChecks.hasBold) contentTypes.push('bold text');
        if (contentChecks.hasItalic) contentTypes.push('italic text');
        
        if (contentTypes.length > 0) {
          console.log(`      - Content types: ${contentTypes.join(', ')}`);
        }
        
      } else {
        console.log('   ❌ Editor not found on page');
      }
    }
    
    // 4. Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 SUMMARY:');
    console.log('- The editor can be checked for empty content by:');
    console.log('  1. Finding the editor element (.ProseMirror or [contenteditable])');
    console.log('  2. Checking textContent.trim() === ""');
    console.log('  3. Checking if innerHTML is just empty paragraph tags');
    console.log('  4. Counting words and characters');
    console.log('  5. Looking for specific content types (headings, lists, etc.)');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    if (browser) {
      console.log('\n🔚 Closing browser...');
      await browser.close();
    }
    await prisma.$disconnect();
  }
  
  console.log('\n=== TEST COMPLETE ===\n');
}

// Run the test
testEditorContent().catch(console.error);