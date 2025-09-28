#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function exportDatabase() {
  console.log('🗂️  Exporting database data (lite version - limited documents)...');

  try {
    // Export all tables but limit documents
    const data = {
      // Full export of essential data
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
      folders: await prisma.folder.findMany({
        take: 50 // Limit folders to 50
      }),

      // LIMIT DOCUMENTS TO KEEP FILE SIZE SMALL
      documents: await prisma.document.findMany({
        take: 10, // Only export 10 documents
        orderBy: {
          createdAt: 'desc' // Get most recent documents
        }
      }),

      // Only export versions for the limited documents
      documentVersions: await prisma.documentVersion.findMany({
        where: {
          documentId: {
            in: (await prisma.document.findMany({
              take: 10,
              orderBy: { createdAt: 'desc' },
              select: { id: true }
            })).map(d => d.id)
          }
        }
      }),

      // Export limited related data
      attachments: await prisma.attachment.findMany({
        take: 20 // Limit attachments
      }),
      comments: await prisma.comment.findMany({
        take: 50 // Limit comments
      }),
      auditLogs: await prisma.auditLog.findMany({
        take: 100 // Limit audit logs
      }),

      // Full export of workflow configuration (small data)
      workflows: await prisma.workflow.findMany({
        take: 20 // Limit workflows
      }),
      documentWorkflows: await prisma.documentWorkflow.findMany({
        take: 20
      }),
      jsonWorkflowInstances: await prisma.jsonWorkflowInstance.findMany({
        take: 10
      }),
      jsonWorkflowHistories: await prisma.jsonWorkflowHistory.findMany({
        take: 20
      }),
      workflowTasks: await prisma.workflowTask.findMany({
        take: 20
      }),

      // System settings (always small)
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
    const backupDir = path.join(__dirname, 'database-backup-lite');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Save main data
    const dataFile = path.join(backupDir, 'database-export-lite.json');
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));

    // Calculate file size
    const stats = fs.statSync(dataFile);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

    console.log(`✅ Lite database exported to: ${dataFile}`);
    console.log(`📦 File size: ${fileSizeInMB} MB`);

    // Save passwords separately (for development only)
    const passwordFile = path.join(backupDir, 'user-passwords.json');
    fs.writeFileSync(passwordFile, JSON.stringify(userPasswords, null, 2));
    console.log(`✅ User passwords exported to: ${passwordFile}`);

    // Create summary
    const summary = {
      exportDate: new Date().toISOString(),
      exportType: 'LITE',
      counts: {
        organizations: data.organizations.length,
        roles: data.roles.length,
        users: data.users.length,
        documents: data.documents.length + ' (limited to 10)',
        folders: data.folders.length + ' (limited to 50)',
        workflows: data.workflows.length + ' (limited to 20)',
        workflowInstances: data.jsonWorkflowInstances.length + ' (limited to 10)',
      },
      fileSizeMB: fileSizeInMB
    };

    const summaryFile = path.join(backupDir, 'export-summary.json');
    fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
    console.log(`✅ Export summary saved to: ${summaryFile}`);

    console.log('\n📊 Lite Export Summary:');
    console.log(`   Organizations: ${data.organizations.length}`);
    console.log(`   Roles: ${data.roles.length}`);
    console.log(`   Users: ${data.users.length} (all users exported)`);
    console.log(`   Documents: ${data.documents.length} (limited to 10 most recent)`);
    console.log(`   Folders: ${data.folders.length} (limited to 50)`);
    console.log(`   Workflows: ${data.workflows.length} (limited to 20)`);
    console.log(`   File Size: ${fileSizeInMB} MB`);
    console.log('\n✨ This lite export keeps all users and settings');
    console.log('   but limits documents to keep file size small for Git.');

  } catch (error) {
    console.error('❌ Export failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

exportDatabase();