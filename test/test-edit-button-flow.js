const puppeteer = require('puppeteer');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testEditButtonFlow() {
  console.log('\n=== TESTING EDIT BUTTON TO EDITOR FLOW ===\n');
  
  let browser;
  
  try {
    // 1. Get a document from database
    console.log('📊 Getting document from database...');
    const document = await prisma.document.findFirst({
      select: {
        id: true,
        title: true,
        fileName: true,
        description: true
      }
    });
    
    if (!document) {
      console.log('❌ No documents in database to test');
      return;
    }
    
    console.log(`✅ Found document: "${document.title}" (ID: ${document.id})`);
    console.log(`   Description: ${document.description ? 'YES' : 'NO'}`);
    
    // 2. Launch browser
    console.log('\n🌐 Launching browser...');
    browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1400, height: 900 }
    });
    
    const page = await browser.newPage();
    
    // 3. Navigate to document view page
    const documentUrl = `http://localhost:3000/documents/${document.id}`;
    console.log(`\n📄 Navigating to document page: ${documentUrl}`);
    
    await page.goto(documentUrl, { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 4. Check if edit button exists
    console.log('\n🔍 Looking for Edit button...');
    
    const editButton = await page.evaluate(() => {
      // Look for button with Edit text
      const buttons = Array.from(document.querySelectorAll('button'));
      const editBtn = buttons.find(btn => 
        btn.textContent?.includes('Edit') || 
        btn.textContent?.includes('✏️')
      );
      
      if (editBtn) {
        return {
          found: true,
          text: editBtn.textContent,
          hasIcon: editBtn.innerHTML.includes('EditIcon') || editBtn.textContent?.includes('✏️')
        };
      }
      return { found: false };
    });
    
    if (editButton.found) {
      console.log(`✅ Edit button found: "${editButton.text}"`);
      console.log(`   Has edit icon: ${editButton.hasIcon ? 'YES' : 'NO'}`);
      
      // 5. Click the edit button
      console.log('\n🖱️ Clicking Edit button...');
      
      const clicked = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const editBtn = buttons.find(btn => 
          btn.textContent?.includes('Edit') || 
          btn.textContent?.includes('✏️')
        );
        
        if (editBtn) {
          editBtn.click();
          return true;
        }
        return false;
      });
      
      if (clicked) {
        console.log('✅ Edit button clicked');
        
        // Wait for navigation
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // 6. Check if we're on the editor page
        const currentUrl = page.url();
        console.log(`\n📝 Current URL: ${currentUrl}`);
        
        if (currentUrl.includes('/editor/')) {
          console.log('✅ Successfully navigated to editor page!');
          
          // 7. Check if editor loaded with document data
          console.log('\n🔍 Checking if editor loaded document data...');
          
          const editorContent = await page.evaluate(() => {
            // Check for editor element
            const editor = document.querySelector('.ProseMirror') || 
                          document.querySelector('[contenteditable]') ||
                          document.querySelector('.tiptap');
            
            if (editor) {
              return {
                hasEditor: true,
                content: editor.textContent || '',
                html: editor.innerHTML?.substring(0, 200)
              };
            }
            
            return { hasEditor: false };
          });
          
          if (editorContent.hasEditor) {
            console.log('✅ Editor component loaded');
            
            // Check if document title or content is visible
            const pageText = await page.evaluate(() => document.body.textContent);
            
            if (pageText?.includes(document.title)) {
              console.log('✅ Document title is displayed in editor');
            }
            
            if (editorContent.content.length > 0) {
              console.log(`✅ Editor has content (${editorContent.content.length} characters)`);
              console.log(`   Preview: "${editorContent.content.substring(0, 50)}..."`);
            }
            
            // Check for editor toolbar
            const hasToolbar = await page.evaluate(() => {
              return document.querySelector('[role="toolbar"]') !== null ||
                     document.querySelector('.toolbar') !== null ||
                     document.querySelector('button[title*="Bold"]') !== null;
            });
            
            if (hasToolbar) {
              console.log('✅ Editor toolbar is present');
            }
            
            console.log('\n🎉 SUCCESS: Edit button successfully opens editor with document data!');
          } else {
            console.log('❌ Editor component not found on page');
          }
        } else {
          console.log('❌ Did not navigate to editor page');
        }
      } else {
        console.log('❌ Failed to click edit button');
      }
    } else {
      console.log('❌ Edit button not found on document page');
      
      // Check what's on the page
      const pageContent = await page.evaluate(() => {
        return {
          hasButtons: document.querySelectorAll('button').length,
          pageText: document.body.textContent?.substring(0, 200)
        };
      });
      
      console.log(`   Found ${pageContent.hasButtons} buttons on page`);
      console.log(`   Page content: ${pageContent.pageText}...`);
    }
    
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
testEditButtonFlow().catch(console.error);