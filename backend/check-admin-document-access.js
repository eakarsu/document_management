const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAdminAccess() {
  try {
    console.log('🔍 Checking admin@airforce.mil access to documents...\n');

    // Find the admin user
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@airforce.mil' },
      include: {
        role: true
      }
    });

    if (!adminUser) {
      console.log('❌ Admin user not found!');
      return;
    }

    console.log('✅ Admin user found:');
    console.log('   ID:', adminUser.id);
    console.log('   Email:', adminUser.email);
    console.log('   Role:', adminUser.role?.name || 'No role');
    console.log('   Permissions:', adminUser.role?.permissions || []);
    console.log();

    // Check documents with workflows
    console.log('📄 Checking documents with workflows:\n');

    const documents = await prisma.document.findMany({
      include: {
        jsonWorkflowInstances: true,
        permissions: {
          where: {
            userId: adminUser.id
          }
        }
      },
      take: 5
    });

    for (const doc of documents) {
      console.log(`Document: ${doc.id}`);
      console.log(`  Title: ${doc.title}`);
      console.log(`  Created by: ${doc.createdById}`);

      // Check if admin owns the document
      const isOwner = doc.createdById === adminUser.id;
      console.log(`  Is owner: ${isOwner ? 'YES' : 'NO'}`);

      // Check permissions
      if (doc.permissions.length > 0) {
        console.log(`  Permissions for admin:`);
        doc.permissions.forEach(perm => {
          console.log(`    - ${perm.permission}`);
        });
      } else {
        console.log(`  No explicit permissions for admin`);
      }

      // Check workflow instances
      if (doc.jsonWorkflowInstances.length > 0) {
        console.log(`  Workflow instances: ${doc.jsonWorkflowInstances.length}`);
        doc.jsonWorkflowInstances.forEach(instance => {
          console.log(`    - Instance ID: ${instance.id}`);
          console.log(`      Workflow ID: ${instance.workflowId}`);
          console.log(`      Current Stage: ${instance.currentStageId}`);
          console.log(`      Active: ${instance.isActive}`);
        });
      } else {
        console.log(`  ⚠️ No workflow instances`);
      }
      console.log();
    }

    // Check specific document that user mentioned
    const specificDocId = 'cmfn33ifj000pfjsqyo04fb7p';
    console.log(`\n🎯 Checking specific document ${specificDocId}:\n`);

    const specificDoc = await prisma.document.findUnique({
      where: { id: specificDocId },
      include: {
        jsonWorkflowInstances: true,
        permissions: true,
        createdBy: true
      }
    });

    if (specificDoc) {
      console.log('Document found:');
      console.log('  Title:', specificDoc.title);
      console.log('  Created by:', specificDoc.createdBy?.email);
      console.log('  Workflow instances:', specificDoc.jsonWorkflowInstances.length);

      if (specificDoc.jsonWorkflowInstances.length > 0) {
        const instance = specificDoc.jsonWorkflowInstances[0];
        console.log('\n  Workflow details:');
        console.log('    Instance ID:', instance.id);
        console.log('    Workflow ID:', instance.workflowId);
        // The workflow ID is the name/identifier, not a database record
        console.log('    Workflow name:', instance.workflowId);
        console.log('    Current stage:', instance.currentStageId);
        console.log('    Is active:', instance.isActive);
        console.log('    Metadata:', instance.metadata ? 'Present' : 'Missing');
      }

      // Check if admin can access based on role permissions
      console.log('\n  Admin access check:');
      const adminRole = adminUser.role;
      const hasDocumentView = adminRole?.permissions?.includes('document:view');
      const hasWorkflowManage = adminRole?.permissions?.includes('workflow:manage');
      const hasWorkflowExecute = adminRole?.permissions?.includes('workflow:execute');

      console.log('    Has document:view permission:', hasDocumentView ? 'YES' : 'NO');
      console.log('    Has workflow:manage permission:', hasWorkflowManage ? 'YES' : 'NO');
      console.log('    Has workflow:execute permission:', hasWorkflowExecute ? 'YES' : 'NO');
      console.log('    Is ADMIN/Admin role:', ['ADMIN', 'Admin'].includes(adminRole?.name) ? 'YES' : 'NO');
    } else {
      console.log('❌ Document not found');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminAccess();