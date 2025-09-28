#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function exportDatabase() {
  console.log('🗂️  Exporting database data...');

  try {
    // Export all tables in dependency order
    const data = {
      organizations: await prisma.organization.findMany(),
      roles: await prisma.role.findMany(),
      users: await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          username: true,
          emailVerified: true,
          isActive: true,
          department: true,
          jobTitle: true,
          roleId: true,
          organizationId: true,
          createdAt: true,
          updatedAt: true,
          // Exclude passwordHash for security
        }
      }),
      folders: await prisma.folder.findMany(),
      documents: await prisma.document.findMany(),
      documentVersions: await prisma.documentVersion.findMany(),
      attachments: await prisma.attachment.findMany(),
      comments: await prisma.comment.findMany(),
      auditLogs: await prisma.auditLog.findMany(),
      workflows: await prisma.workflow.findMany(),
      documentWorkflows: await prisma.documentWorkflow.findMany(),
      jsonWorkflowInstances: await prisma.jsonWorkflowInstance.findMany(),
      jsonWorkflowHistories: await prisma.jsonWorkflowHistory.findMany(),
      workflowTasks: await prisma.workflowTask.findMany(),
      systemSettings: await prisma.systemSetting.findMany(),
    };

    // Get password hashes separately for reference
    const userPasswords = await prisma.user.findMany({
      select: {
        email: true,
        passwordHash: true,
      }
    });

    // Create backup directory
    const backupDir = path.join(__dirname, 'database-backup');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Save main data
    const dataFile = path.join(backupDir, 'database-export.json');
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
    console.log(`✅ Database exported to: ${dataFile}`);

    // Save passwords separately (for development only)
    const passwordFile = path.join(backupDir, 'user-passwords.json');
    fs.writeFileSync(passwordFile, JSON.stringify(userPasswords, null, 2));
    console.log(`✅ User passwords exported to: ${passwordFile}`);

    // Create summary
    const summary = {
      exportDate: new Date().toISOString(),
      counts: {
        organizations: data.organizations.length,
        roles: data.roles.length,
        users: data.users.length,
        documents: data.documents.length,
        folders: data.folders.length,
        workflows: data.workflows.length,
        workflowInstances: data.jsonWorkflowInstances.length,
      }
    };

    const summaryFile = path.join(backupDir, 'export-summary.json');
    fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
    console.log(`✅ Export summary saved to: ${summaryFile}`);

    console.log('\n📊 Export Summary:');
    console.log(`   Organizations: ${summary.counts.organizations}`);
    console.log(`   Roles: ${summary.counts.roles}`);
    console.log(`   Users: ${summary.counts.users}`);
    console.log(`   Documents: ${summary.counts.documents}`);
    console.log(`   Folders: ${summary.counts.folders}`);
    console.log(`   Workflows: ${summary.counts.workflows}`);
    console.log(`   Workflow Instances: ${summary.counts.workflowInstances}`);

  } catch (error) {
    console.error('❌ Export failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

exportDatabase();