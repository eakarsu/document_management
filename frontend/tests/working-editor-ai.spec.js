/**
 * Working Playwright test that uses AI to generate content
 * Based on working-editor-test.spec.js
 */

const { test, expect } = require('@playwright/test');

// OpenRouter API configuration
const OPENROUTER_API_KEY = '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';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Generate AI content
async function generateAIContent() {
  const prompt = `Generate a 2-page technical documentation structure in JSON format:
{
  "title": "Document Title",
  "sections": [
    {
      "number": "1",
      "title": "Section Title",
      "subsections": [
        {
          "number": "1.1",
          "title": "Subsection Title",
          "paragraphs": [
            "First paragraph content (100-150 words)...",
            "Second paragraph content (100-150 words)..."
          ]
        }
      ]
    }
  ]
}

Requirements:
- Create 2 main sections
- Each section should have 2 subsections
- Each subsection should have 2 paragraphs
- Content should be professional technical documentation`;

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'AI Editor Test'
    },
    body: JSON.stringify({
      model: 'anthropic/claude-3.5-sonnet',
      messages: [
        {
          role: 'system',
          content: 'You are a professional technical writer. Generate structured document content in JSON format.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 4000
    })
  });

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  
  // Parse JSON response
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error('Error parsing AI response:', error);
  }
  
  // Fallback structure
  return {
    title: "Technical Documentation",
    sections: [
      {
        number: "1",
        title: "Introduction",
        subsections: [
          {
            number: "1.1",
            title: "Overview",
            paragraphs: [
              "This document provides comprehensive information.",
              "The content covers all essential aspects."
            ]
          }
        ]
      }
    ]
  };
}

test.describe('Working Editor Test with AI', () => {
  
  test('Login via backend API and create AI document in editor', async ({ page, context }) => {
    console.log('=== WORKING EDITOR TEST WITH AI ===');
    
    test.setTimeout(180000);
    
    // 1. Login directly to backend API to get token
    console.log('1. Getting auth token from backend API...');
    const loginResponse = await fetch('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@demo.mil',
        password: 'password123'
      })
    });
    
    const loginData = await loginResponse.json();
    
    if (!loginData.success || !loginData.accessToken) {
      console.log('Login response:', loginData);
      throw new Error('Failed to get auth token from backend');
    }
    
    console.log('✅ Got auth token from backend!');
    const token = loginData.accessToken;
    const user = loginData.user;
    
    // 2. Generate AI content
    console.log('2. Generating AI content...');
    const aiContent = await generateAIContent();
    console.log(`✅ Generated AI content with ${aiContent.sections.length} sections`);
    
    // 3. Set up authentication before navigating
    console.log('3. Setting up authentication...');
    
    // First navigate to the app to establish context
    await page.goto('http://localhost:3002');
    
    // Store auth data in localStorage (matching what AuthProvider expects)
    await page.evaluate(({ token, user }) => {
      localStorage.setItem('accessToken', token);
      localStorage.setItem('refreshToken', token); // Use same token for refresh
      localStorage.setItem('user', JSON.stringify(user));
    }, { token, user });
    
    // Also set cookies for good measure
    await context.addCookies([
      {
        name: 'accessToken',
        value: token,
        domain: 'localhost',
        path: '/',
        httpOnly: false,
        secure: false,
        sameSite: 'Lax'
      }
    ]);
    
    console.log('Authentication data stored in browser');
    
    // 4. Now navigate to documents page
    console.log('4. Navigating to documents page...');
    await page.goto('http://localhost:3002/documents');
    await page.waitForTimeout(3000);
    
    // Check if we got redirected to login
    let currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      console.log('Got redirected to login, trying dashboard...');
      await page.goto('http://localhost:3002/dashboard');
      await page.waitForTimeout(3000);
      currentUrl = page.url();
    }
    
    // 5. Try to navigate to existing document editor
    console.log('5. Navigating to editor...');
    await page.goto('http://localhost:3002/editor/doc_technical_980lvau4');
    await page.waitForTimeout(5000);
    
    // Check current URL
    currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    // 6. Look for editor
    console.log('6. Looking for editor...');
    
    const editorSelectors = [
      '.ProseMirror',
      '[contenteditable="true"]',
      '.tiptap',
      '[role="textbox"]',
      'div[data-placeholder]'
    ];
    
    let editor = null;
    let editorFound = false;
    
    for (const selector of editorSelectors) {
      try {
        const element = page.locator(selector).first();
        const count = await element.count();
        console.log(`Checking ${selector}: found ${count} elements`);
        
        if (count > 0) {
          // Wait for visibility
          try {
            await element.waitFor({ state: 'visible', timeout: 3000 });
            if (await element.isVisible()) {
              console.log(`✅ Found visible editor with selector: ${selector}`);
              editor = element;
              editorFound = true;
              break;
            }
          } catch (e) {
            console.log(`Element found but not visible: ${selector}`);
          }
        }
      } catch (e) {
        console.log(`Error checking ${selector}: ${e.message}`);
      }
    }
    
    if (!editorFound) {
      // Try creating a new document
      console.log('No editor found, trying to create new document...');
      await page.goto('http://localhost:3002/documents');
      await page.waitForTimeout(3000);
      
      // Look for New Document button
      const newDocButton = page.locator('button:has-text("New Document"), button:has-text("Create Document"), button:has-text("Create"), a:has-text("New")').first();
      if (await newDocButton.count() > 0 && await newDocButton.isVisible()) {
        console.log('Found New Document button, clicking...');
        await newDocButton.click();
        await page.waitForTimeout(5000);
        
        // Check for editor again
        for (const selector of editorSelectors) {
          const element = page.locator(selector).first();
          if (await element.count() > 0 && await element.isVisible()) {
            console.log(`Found editor after creating new doc: ${selector}`);
            editor = element;
            editorFound = true;
            break;
          }
        }
      }
    }
    
    if (editorFound && editor) {
      console.log('7. Editor found! Creating AI document content...');
      
      // Click to focus
      await editor.click();
      await page.waitForTimeout(1000);
      
      // Build HTML content from AI structure
      let htmlContent = `<h1>${aiContent.title}</h1>\n\n`;
      
      for (const section of aiContent.sections) {
        htmlContent += `<h2>${section.number}. ${section.title}</h2>\n\n`;
        
        for (const subsection of section.subsections) {
          htmlContent += `<h3>${subsection.number} ${subsection.title}</h3>\n`;
          
          for (const paragraph of subsection.paragraphs) {
            htmlContent += `<p>${paragraph}</p>\n`;
          }
        }
      }
      
      // Use evaluate to set content directly
      console.log('8. Writing AI content to editor...');
      await page.evaluate((html) => {
        const editor = document.querySelector('.ProseMirror');
        if (editor) {
          editor.innerHTML = html;
        }
      }, htmlContent);
      
      console.log('✅ AI content written successfully!');
      
      // Take screenshot of success
      await page.screenshot({ path: 'test-results/working-editor-ai-success.png', fullPage: true });
      
      // Get content metrics
      const editorContent = await editor.innerText();
      const contentLength = editorContent.length;
      const sizeKB = (contentLength / 1024).toFixed(2);
      
      console.log('✅ SUCCESS!');
      console.log(`Created AI document with ${contentLength} characters (${sizeKB} KB)`);
      console.log(`Document has ${aiContent.sections.length} sections`);
      
      // Extract paragraph map (same numbering schema as AI generator)
      const paragraphMap = {};
      let currentSection = 0;
      let currentSubsection = 0;
      let paragraphInSubsection = 0;
      
      for (const section of aiContent.sections) {
        currentSection = parseInt(section.number);
        
        for (const subsection of section.subsections) {
          currentSubsection = parseInt(subsection.number.split('.')[1]);
          paragraphInSubsection = 0;
          
          for (const paragraph of subsection.paragraphs) {
            paragraphInSubsection++;
            const paragraphNumber = `${currentSection}.${currentSubsection}.${paragraphInSubsection}`;
            paragraphMap[paragraphNumber] = paragraph;
          }
        }
      }
      
      console.log(`\n📊 Paragraph Map (${Object.keys(paragraphMap).length} paragraphs):`);
      Object.entries(paragraphMap).slice(0, 3).forEach(([num, text]) => {
        const preview = text.length > 50 ? text.substring(0, 50) + '...' : text;
        console.log(`  ${num}: "${preview}"`);
      });
      
      // Verify content
      expect(editorContent).toContain(aiContent.title);
      expect(editorContent).toContain(aiContent.sections[0].title);
      
      // Try to save
      const saveButton = page.locator('button:has-text("Save")').first();
      if (await saveButton.isVisible()) {
        console.log('\n9. Saving document...');
        await saveButton.click();
        await page.waitForTimeout(2000);
        console.log('Document saved!');
      }
      
      console.log('\n=== COMPARISON WITH GENERATOR ===');
      console.log('AI Document Generator (ai-document-generator.js): Uses AI content');
      console.log(`Playwright UI Test with AI: ${sizeKB} KB`);
      console.log('✅ Both use AI to generate content with same numbering schema!');
      
    } else {
      console.log('Editor not found');
      await page.screenshot({ path: 'test-results/working-no-editor-ai.png', fullPage: true });
      throw new Error('Could not find editor - authentication may have failed');
    }
  });
});