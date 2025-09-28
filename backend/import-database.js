#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function importDatabase() {
  console.log('📥 Importing database data...');

  try {
    const backupDir = path.join(__dirname, 'database-backup');
    const dataFile = path.join(backupDir, 'database-export.json');
    const passwordFile = path.join(backupDir, 'user-passwords.json');

    if (!fs.existsSync(dataFile)) {
      console.error('❌ Database export file not found:', dataFile);
      console.log('Run export-database.js first to create the backup.');
      process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
    const passwords = fs.existsSync(passwordFile)
      ? JSON.parse(fs.readFileSync(passwordFile, 'utf-8'))
      : [];

    // Create a map of email to password hash
    const passwordMap = {};
    passwords.forEach(p => {
      passwordMap[p.email] = p.passwordHash;
    });

    console.log('🧹 Clearing existing data...');

    // Delete in reverse dependency order
    await prisma.workflowTask.deleteMany();
    await prisma.jsonWorkflowHistory.deleteMany();
    await prisma.jsonWorkflowInstance.deleteMany();
    await prisma.documentWorkflow.deleteMany();
    await prisma.workflow.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.attachment.deleteMany();
    await prisma.documentVersion.deleteMany();
    await prisma.document.deleteMany();
    await prisma.folder.deleteMany();
    await prisma.user.deleteMany();
    await prisma.role.deleteMany();
    await prisma.organization.deleteMany();
    await prisma.systemSetting.deleteMany();

    console.log('✅ Existing data cleared');

    // Import in dependency order
    console.log('📦 Importing organizations...');
    for (const org of data.organizations) {
      await prisma.organization.create({
        data: {
          ...org,
          createdAt: new Date(org.createdAt),
          updatedAt: new Date(org.updatedAt),
        }
      });
    }

    console.log('📦 Importing roles...');
    for (const role of data.roles) {
      await prisma.role.create({
        data: {
          ...role,
          createdAt: new Date(role.createdAt),
          updatedAt: new Date(role.updatedAt),
        }
      });
    }

    console.log('📦 Importing users...');
    for (const user of data.users) {
      // Use the original password hash if available, otherwise create a default
      const passwordHash = passwordMap[user.email] || await bcrypt.hash('password123', 10);

      await prisma.user.create({
        data: {
          ...user,
          passwordHash,
          lastLogin: user.lastLogin ? new Date(user.lastLogin) : null,
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(user.updatedAt),
        }
      });
    }

    console.log('📦 Importing folders...');
    for (const folder of data.folders) {
      await prisma.folder.create({
        data: {
          ...folder,
          createdAt: new Date(folder.createdAt),
          updatedAt: new Date(folder.updatedAt),
        }
      });
    }

    console.log('📦 Importing documents...');
    for (const doc of data.documents) {
      await prisma.document.create({
        data: {
          ...doc,
          publishedAt: doc.publishedAt ? new Date(doc.publishedAt) : null,
          archivedAt: doc.archivedAt ? new Date(doc.archivedAt) : null,
          deletedAt: doc.deletedAt ? new Date(doc.deletedAt) : null,
          createdAt: new Date(doc.createdAt),
          updatedAt: new Date(doc.updatedAt),
        }
      });
    }

    console.log('📦 Importing document versions...');
    for (const version of data.documentVersions) {
      await prisma.documentVersion.create({
        data: {
          ...version,
          createdAt: new Date(version.createdAt),
        }
      });
    }

    if (data.attachments?.length) {
      console.log('📦 Importing attachments...');
      for (const attachment of data.attachments) {
        await prisma.attachment.create({
          data: {
            ...attachment,
            createdAt: new Date(attachment.createdAt),
          }
        });
      }
    }

    if (data.comments?.length) {
      console.log('📦 Importing comments...');
      for (const comment of data.comments) {
        await prisma.comment.create({
          data: {
            ...comment,
            createdAt: new Date(comment.createdAt),
            updatedAt: new Date(comment.updatedAt),
          }
        });
      }
    }

    if (data.workflows?.length) {
      console.log('📦 Importing workflows...');
      for (const workflow of data.workflows) {
        await prisma.workflow.create({
          data: {
            ...workflow,
            createdAt: new Date(workflow.createdAt),
            updatedAt: new Date(workflow.updatedAt),
          }
        });
      }
    }

    if (data.documentWorkflows?.length) {
      console.log('📦 Importing document workflows...');
      for (const docWorkflow of data.documentWorkflows) {
        await prisma.documentWorkflow.create({
          data: {
            ...docWorkflow,
            startedAt: docWorkflow.startedAt ? new Date(docWorkflow.startedAt) : null,
            completedAt: docWorkflow.completedAt ? new Date(docWorkflow.completedAt) : null,
            createdAt: new Date(docWorkflow.createdAt),
            updatedAt: new Date(docWorkflow.updatedAt),
          }
        });
      }
    }

    if (data.jsonWorkflowInstances?.length) {
      console.log('📦 Importing workflow instances...');
      for (const instance of data.jsonWorkflowInstances) {
        await prisma.jsonWorkflowInstance.create({
          data: {
            ...instance,
            startedAt: instance.startedAt ? new Date(instance.startedAt) : null,
            completedAt: instance.completedAt ? new Date(instance.completedAt) : null,
            createdAt: new Date(instance.createdAt),
            updatedAt: new Date(instance.updatedAt),
          }
        });
      }
    }

    console.log('📦 Importing system settings...');
    for (const setting of data.systemSettings) {
      await prisma.systemSetting.create({
        data: {
          ...setting,
          createdAt: new Date(setting.createdAt),
          updatedAt: new Date(setting.updatedAt),
        }
      });
    }

    console.log('\n✅ Database import completed successfully!');

    // Show summary
    console.log('\n📊 Import Summary:');
    console.log(`   Organizations: ${data.organizations.length}`);
    console.log(`   Roles: ${data.roles.length}`);
    console.log(`   Users: ${data.users.length}`);
    console.log(`   Documents: ${data.documents.length}`);
    console.log(`   Folders: ${data.folders.length}`);
    console.log(`   Workflows: ${data.workflows?.length || 0}`);
    console.log(`   Workflow Instances: ${data.jsonWorkflowInstances?.length || 0}`);

  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Allow running directly or via require
if (require.main === module) {
  importDatabase();
}

module.exports = { importDatabase };