const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

async function verifyHierarchicalTestSetup() {
  try {
    console.log('🔍 Verifying Hierarchical Workflow Test Setup\n');
    console.log('='.repeat(60));

    // Check workflow file
    const workflowPath = path.join(__dirname, 'workflows', 'hierarchical-distributed-workflow.json');
    const workflowExists = fs.existsSync(workflowPath);

    console.log('\n1. WORKFLOW CONFIGURATION:');
    console.log('   File exists:', workflowExists ? '✅ YES' : '❌ NO');

    if (workflowExists) {
      const workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf-8'));
      console.log('   Workflow ID:', workflow.id);
      console.log('   Name:', workflow.name);
      console.log('   Total Stages:', workflow.stages.length);
      console.log('   Version:', workflow.version);
    }

    // Test accounts from the manual
    const testAccounts = [
      // Stage 1: Action Officers
      { email: 'ao1@airforce.mil', role: 'ACTION_OFFICER', stage: '1' },
      { email: 'ao2@airforce.mil', role: 'ACTION_OFFICER', stage: '1' },
      // Stage 2: PCM
      { email: 'pcm@airforce.mil', role: 'PCM_COORDINATOR', stage: '2' },
      // Stage 3 & 5: Front Office Gatekeepers
      { email: 'ops.frontoffice@airforce.mil', role: 'FRONT_OFFICE_GATEKEEPER', stage: '3,5' },
      { email: 'log.frontoffice@airforce.mil', role: 'FRONT_OFFICE_GATEKEEPER', stage: '3,5' },
      { email: 'fin.frontoffice@airforce.mil', role: 'FRONT_OFFICE_GATEKEEPER', stage: '3,5' },
      { email: 'per.frontoffice@airforce.mil', role: 'FRONT_OFFICE_GATEKEEPER', stage: '3,5' },
      // Coordinator
      { email: 'coordinator1@airforce.mil', role: 'COORDINATOR', stage: '3,5' },
      // Sub-Reviewers
      { email: 'ops.reviewer1@airforce.mil', role: 'SUB_REVIEWER', stage: '3,5' },
      { email: 'ops.reviewer2@airforce.mil', role: 'SUB_REVIEWER', stage: '3,5' },
      { email: 'log.reviewer1@airforce.mil', role: 'SUB_REVIEWER', stage: '3,5' },
      { email: 'fin.reviewer1@airforce.mil', role: 'SUB_REVIEWER', stage: '3,5' },
      { email: 'per.reviewer1@airforce.mil', role: 'SUB_REVIEWER', stage: '3,5' },
      // Stage 7: Legal
      { email: 'legal.reviewer@airforce.mil', role: 'LEGAL', stage: '7' },
      // Stage 9: Leadership
      { email: 'opr.leadership@airforce.mil', role: 'OPR_LEADERSHIP', stage: '9' },
      // Stage 10: AFDPO
      { email: 'afdpo.publisher@airforce.mil', role: 'AFDPO_PUBLISHER', stage: '10' }
    ];

    console.log('\n2. TEST ACCOUNTS STATUS:');
    console.log('   Checking ' + testAccounts.length + ' test accounts...\n');

    let missingAccounts = [];
    let existingAccounts = 0;

    for (const account of testAccounts) {
      const user = await prisma.user.findUnique({
        where: { email: account.email },
        include: { role: true }
      });

      if (user) {
        existingAccounts++;
        console.log(`   ✅ ${account.email.padEnd(30)} - Found (Role: ${user.role?.name || 'NO ROLE'})`);
      } else {
        missingAccounts.push(account);
        console.log(`   ❌ ${account.email.padEnd(30)} - NOT FOUND`);
      }
    }

    console.log('\n3. SUMMARY:');
    console.log('   Total accounts needed:', testAccounts.length);
    console.log('   Accounts found:', existingAccounts);
    console.log('   Missing accounts:', missingAccounts.length);

    if (missingAccounts.length > 0) {
      console.log('\n   ⚠️  Missing accounts need to be created:');
      missingAccounts.forEach(acc => {
        console.log(`      - ${acc.email} (${acc.role})`);
      });
      console.log('\n   Run: node create-hierarchical-test-users.js');
    }

    // Check if workflow is currently active
    console.log('\n4. ACTIVE WORKFLOW CHECK:');
    const activeWorkflow = await prisma.jsonWorkflowInstance.findFirst({
      where: {
        workflowId: 'hierarchical-distributed-workflow',
        isActive: true
      }
    });

    if (activeWorkflow) {
      console.log('   ✅ Active workflow found:');
      console.log('      Document ID:', activeWorkflow.documentId);
      console.log('      Current Stage:', activeWorkflow.currentStageId);
      console.log('      Created:', activeWorkflow.createdAt);
    } else {
      console.log('   ℹ️  No active hierarchical workflow instances');
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n📋 TESTING MANUAL STATUS:');

    if (workflowExists && existingAccounts === testAccounts.length) {
      console.log('   ✅ MANUAL IS VALID - All components are in place');
      console.log('   You can proceed with testing using HIERARCHICAL-WORKFLOW-TESTING-MANUAL.md');
    } else if (workflowExists && missingAccounts.length > 0) {
      console.log('   ⚠️  MANUAL PARTIALLY VALID - Some test users are missing');
      console.log('   Create missing users first, then proceed with testing');
    } else {
      console.log('   ❌ MANUAL NOT VALID - Setup incomplete');
    }

    console.log('\n📝 NOTES:');
    console.log('   - All test accounts use password: testpass123');
    console.log('   - The workflow supports ownership transfer between AOs');
    console.log('   - PCM acts as gatekeeper at Stage 2');
    console.log('   - Front Office gatekeepers control distribution at Stages 3 & 5');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyHierarchicalTestSetup();