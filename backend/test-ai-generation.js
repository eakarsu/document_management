const axios = require('axios');

async function testAIGeneration() {
  try {
    console.log('Testing AI document generation with 5-level hierarchy...\n');
    
    const response = await axios.post('http://localhost:4000/api/ai-document-generator', {
      template: 'technical',
      pages: 2,
      feedbackCount: 5
    });
    
    console.log('Response status:', response.status);
    console.log('Response data keys:', Object.keys(response.data));
    
    const content = response.data.content || response.data.htmlContent || response.data.html || '';
    
    if (!content) {
      console.error('No content found in response!');
      console.log('Full response:', JSON.stringify(response.data, null, 2));
      return;
    }
    
    // Check for 5-level hierarchy
    const level5Pattern = /\d+\.\d+\.\d+\.\d+\.\d+/;
    const hasLevel5 = level5Pattern.test(content);
    
    // Check for inline styles
    const hasInlineStyles = content.includes('style="margin-left:');
    
    // Count each level
    const level1 = (content.match(/<h2>/g) || []).length;
    const level2 = (content.match(/<h3[^>]*>/g) || []).length;
    const level3 = (content.match(/<h4[^>]*>/g) || []).length;
    const level4 = (content.match(/<h5[^>]*>/g) || []).length;
    const level5 = (content.match(/<h6[^>]*>/g) || []).length;
    
    console.log('=== ANALYSIS RESULTS ===');
    console.log(`✓ Has 5-level numbering (X.X.X.X.X): ${hasLevel5}`);
    console.log(`✓ Has inline margin-left styles: ${hasInlineStyles}`);
    console.log(`\n=== HIERARCHY LEVELS ===`);
    console.log(`Level 1 (h2): ${level1} sections`);
    console.log(`Level 2 (h3): ${level2} sections`);
    console.log(`Level 3 (h4): ${level3} sections`);
    console.log(`Level 4 (h5): ${level4} sections`);
    console.log(`Level 5 (h6): ${level5} sections`);
    
    // Check specific inline styles
    const styles20px = (content.match(/margin-left:\s*20px/g) || []).length;
    const styles40px = (content.match(/margin-left:\s*40px/g) || []).length;
    const styles60px = (content.match(/margin-left:\s*60px/g) || []).length;
    const styles80px = (content.match(/margin-left:\s*80px/g) || []).length;
    
    console.log(`\n=== INLINE STYLES ===`);
    console.log(`20px indents: ${styles20px}`);
    console.log(`40px indents: ${styles40px}`);
    console.log(`60px indents: ${styles60px}`);
    console.log(`80px indents: ${styles80px}`);
    
    // Save to file for inspection
    const fs = require('fs');
    const filename = `test-generated-${Date.now()}.html`;
    fs.writeFileSync(filename, content);
    console.log(`\n✓ Content saved to: ${filename}`);
    
    // Show a sample of level 5 content if found
    if (hasLevel5) {
      const level5Match = content.match(/<h6[^>]*>([^<]+)<\/h6>/);
      if (level5Match) {
        console.log(`\nSample Level 5 heading: ${level5Match[1]}`);
      }
    } else {
      console.log('\n❌ WARNING: No level 5 content found!');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testAIGeneration();