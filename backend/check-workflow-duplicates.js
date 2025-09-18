const fs = require('fs');
const path = require('path');

function checkWorkflowDuplicates() {
  console.log('🔍 Checking Workflow Definitions for Duplicates\n');
  console.log('='.repeat(60));

  const workflowFiles = [
    'distributed-review-workflow.json',
    'hierarchical-distributed-workflow.json',
    'opr-review-workflow.json'
  ];

  workflowFiles.forEach(filename => {
    const workflowPath = path.join(__dirname, 'workflows', filename);

    if (fs.existsSync(workflowPath)) {
      const workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf-8'));

      console.log(`\n📋 ${filename}:`);
      console.log('   ID:', workflow.id);
      console.log('   Name:', workflow.name);
      console.log('   Total Stages:', workflow.stages.length);

      // Check for duplicate stage IDs
      const stageIds = workflow.stages.map(s => s.id);
      const uniqueIds = [...new Set(stageIds)];

      if (stageIds.length !== uniqueIds.length) {
        console.log('   ⚠️  DUPLICATE STAGE IDS FOUND!');
        const duplicates = stageIds.filter((id, index) => stageIds.indexOf(id) !== index);
        console.log('   Duplicates:', duplicates);
      } else {
        console.log('   ✅ No duplicate stage IDs');
      }

      // Check for duplicate stage names
      const stageNames = workflow.stages.map(s => s.name);
      const nameCount = {};
      stageNames.forEach(name => {
        nameCount[name] = (nameCount[name] || 0) + 1;
      });

      const duplicateNames = Object.entries(nameCount)
        .filter(([name, count]) => count > 1)
        .map(([name, count]) => `${name} (appears ${count} times)`);

      if (duplicateNames.length > 0) {
        console.log('   ⚠️  DUPLICATE STAGE NAMES:');
        duplicateNames.forEach(dup => console.log('      -', dup));
      } else {
        console.log('   ✅ All stage names are unique');
      }

      // List all stages
      console.log('\n   Stage List:');
      workflow.stages.forEach(stage => {
        console.log(`      Stage ${stage.id}: ${stage.name} (Order: ${stage.order})`);
      });

      // Check transitions if they exist
      if (workflow.transitions) {
        console.log('\n   Transitions:', workflow.transitions.length);
      }
    } else {
      console.log(`\n❌ ${filename} not found`);
    }
  });

  console.log('\n' + '='.repeat(60));
  console.log('\n📝 ISSUES TO FIX:');
  console.log('1. If you see duplicate stages, the workflow definition needs to be cleaned');
  console.log('2. PCM should be using hierarchical-distributed-workflow (10 stages)');
  console.log('3. The distributed-review-workflow (8 stages) is a different workflow');
}

checkWorkflowDuplicates();