// Quick fix to disable Elasticsearch
const fs = require('fs');
const path = require('path');

const searchServicePath = path.join(__dirname, 'src/services/SearchService.ts');
const content = fs.readFileSync(searchServicePath, 'utf8');

// Comment out the initializeIndex call
const fixed = content.replace(
  /async initializeIndex/g,
  'async initializeIndex_DISABLED'
).replace(
  /this\.initializeIndex\(\)/g,
  '// this.initializeIndex() // DISABLED'
);

fs.writeFileSync(searchServicePath, fixed);
console.log('✅ Elasticsearch initialization disabled in SearchService');
