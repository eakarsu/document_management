const axios = require('axios');

async function testDeepHierarchy() {
  try {
    console.log('Testing AI document generation for deep hierarchy...\n');
    
    const response = await axios.post('http://localhost:4000/api/ai-document-generator', {
      template: 'technical',
      pages: 2,
      feedbackCount: 5
    });
    
    const content = response.data.content || response.data.htmlContent || response.data.html || '';
    
    // Check for 5-level hierarchy patterns
    const level5Patterns = content.match(/\d+\.\d+\.\d+\.\d+\.\d+/g) || [];
    const level4Patterns = content.match(/\d+\.\d+\.\d+\.\d+(?!\.\d)/g) || [];
    const level3Patterns = content.match(/\d+\.\d+\.\d+(?!\.\d)/g) || [];
    
    console.log('=== HIERARCHY ANALYSIS ===');
    console.log(`Level 5 (X.X.X.X.X): ${level5Patterns.length} occurrences`);
    if (level5Patterns.length > 0) {
      console.log('Examples:', level5Patterns.slice(0, 5));
    }
    console.log(`Level 4 (X.X.X.X): ${level4Patterns.length} occurrences`);
    console.log(`Level 3 (X.X.X): ${level3Patterns.length} occurrences`);
    
    // Check for inline styles
    const marginStyles = content.match(/style="margin-left:\s*\d+px/g) || [];
    console.log(`\nInline margin styles: ${marginStyles.length} occurrences`);
    
    // Check specific indentation levels
    const indent20 = (content.match(/margin-left:\s*20px/g) || []).length;
    const indent40 = (content.match(/margin-left:\s*40px/g) || []).length;
    const indent60 = (content.match(/margin-left:\s*60px/g) || []).length;
    const indent80 = (content.match(/margin-left:\s*80px/g) || []).length;
    const indent100 = (content.match(/margin-left:\s*100px/g) || []).length;
    
    console.log('\n=== INDENTATION LEVELS ===');
    console.log(`20px (Level 2): ${indent20}`);
    console.log(`40px (Level 3): ${indent40}`);
    console.log(`60px (Level 4): ${indent60}`);
    console.log(`80px (Level 5): ${indent80}`);
    console.log(`100px (Level 6): ${indent100}`);
    
    // Extract and show h6 headers (level 5)
    const h6Headers = content.match(/<h6[^>]*>([^<]+)<\/h6>/g) || [];
    console.log(`\n=== LEVEL 5 HEADERS (h6) ===`);
    console.log(`Found ${h6Headers.length} h6 headers`);
    if (h6Headers.length > 0) {
      console.log('Examples:');
      h6Headers.slice(0, 3).forEach(h => {
        const text = h.replace(/<[^>]+>/g, '');
        console.log(`  - ${text}`);
      });
    }
    
    // Save for inspection
    const fs = require('fs');
    const filename = `test-deep-${Date.now()}.html`;
    fs.writeFileSync(filename, content);
    console.log(`\n✓ Full content saved to: ${filename}`);
    
    // Show a snippet with 5-level content if found
    if (level5Patterns.length > 0) {
      const pattern = level5Patterns[0];
      const index = content.indexOf(pattern);
      const snippet = content.substring(Math.max(0, index - 100), Math.min(content.length, index + 200));
      console.log('\n=== SNIPPET WITH 5-LEVEL CONTENT ===');
      console.log(snippet.replace(/<[^>]+>/g, ' ').trim());
    } else {
      console.log('\n⚠️ WARNING: No 5-level hierarchy found in generated content!');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testDeepHierarchy();