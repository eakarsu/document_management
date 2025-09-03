const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function setup8StageWorkflowUsers() {
  try {
    console.log('🚀 Setting up comprehensive user system for 8-stage workflow testing...');

    // Create organizations
    const organizations = [
      {
        name: 'Richmond DMS Organization',
        domain: 'richmond-dms.com',
        settings: { workflowEnabled: true }
      },
      {
        name: 'Test Organization',
        domain: 'test.com',
        settings: { workflowEnabled: true }
      }
    ];

    const createdOrgs = {};
    for (const orgData of organizations) {
      let org = await prisma.organization.findFirst({
        where: { domain: orgData.domain }
      });

      if (!org) {
        org = await prisma.organization.create({
          data: {
            ...orgData,
            isActive: true
          }
        });
        console.log(`✅ Created organization: ${org.name} (${org.id})`);
      } else {
        console.log(`✅ Organization exists: ${org.name} (${org.id})`);
      }
      createdOrgs[orgData.domain] = org;
    }

    const mainOrg = createdOrgs['richmond-dms.com'];

    // Create comprehensive roles for 8-stage workflow
    const roles = [
      {
        name: 'ADMIN',
        description: 'System Administrator - Can perform all actions',
        permissions: ['READ', 'WRITE', 'DELETE', 'ADMIN', 'WORKFLOW_ADMIN', 'PUBLISH'],
        isSystem: true
      },
      {
        name: 'OPR',
        description: 'Office of Primary Responsibility - Document owner/author',
        permissions: ['READ', 'WRITE', 'CREATE_DOCUMENT', 'START_WORKFLOW'],
        isSystem: false
      },
      {
        name: 'AUTHOR',
        description: 'Document Author - Can create and edit documents',
        permissions: ['READ', 'WRITE', 'CREATE_DOCUMENT', 'START_WORKFLOW'],
        isSystem: false
      },
      {
        name: 'TECHNICAL_REVIEWER',
        description: 'Technical Reviewer - Reviews documents for technical accuracy',
        permissions: ['READ', 'REVIEW', 'PROVIDE_FEEDBACK'],
        isSystem: false
      },
      {
        name: 'LEGAL_REVIEWER',
        description: 'Legal Reviewer - Reviews documents for legal compliance',
        permissions: ['READ', 'LEGAL_REVIEW', 'PROVIDE_LEGAL_FEEDBACK'],
        isSystem: false
      },
      {
        name: 'PUBLISHER',
        description: 'Publisher (AFDPO) - Final publishing authority',
        permissions: ['READ', 'PUBLISH', 'FINAL_APPROVAL'],
        isSystem: false
      },
      {
        name: 'MANAGER',
        description: 'Manager - Supervisory role with broad permissions',
        permissions: ['READ', 'WRITE', 'REVIEW', 'APPROVE', 'WORKFLOW_MANAGE'],
        isSystem: false
      },
      {
        name: 'USER',
        description: 'Standard User - Basic read access',
        permissions: ['READ'],
        isSystem: false
      }
    ];

    const createdRoles = {};
    for (const roleData of roles) {
      let role = await prisma.role.findFirst({
        where: { 
          name: roleData.name,
          organizationId: mainOrg.id 
        }
      });

      if (!role) {
        role = await prisma.role.create({
          data: {
            ...roleData,
            organizationId: mainOrg.id
          }
        });
        console.log(`✅ Created role: ${role.name}`);
      } else {
        console.log(`✅ Role exists: ${role.name}`);
      }
      createdRoles[roleData.name] = role;
    }

    // Create comprehensive users for 8-stage workflow testing
    const users = [
      // ADMIN users
      {
        email: 'admin@richmond-dms.com',
        password: 'admin123',
        firstName: 'System',
        lastName: 'Administrator',
        role: 'ADMIN',
        description: 'Main system admin'
      },
      {
        email: 'admin@test.com',
        password: 'admin123',
        firstName: 'Test',
        lastName: 'Admin',
        role: 'ADMIN',
        description: 'Test environment admin'
      },

      // OPR/AUTHOR users (can start workflows and create documents)
      {
        email: 'opr1@richmond-dms.com',
        password: 'opr123',
        firstName: 'John',
        lastName: 'Smith',
        role: 'OPR',
        description: 'Primary OPR for policy documents'
      },
      {
        email: 'opr2@richmond-dms.com',
        password: 'opr123',
        firstName: 'Sarah',
        lastName: 'Johnson',
        role: 'OPR',
        description: 'Secondary OPR for technical documents'
      },
      {
        email: 'author1@richmond-dms.com',
        password: 'author123',
        firstName: 'Mike',
        lastName: 'Davis',
        role: 'AUTHOR',
        description: 'Document author - regulations'
      },
      {
        email: 'author2@richmond-dms.com',
        password: 'author123',
        firstName: 'Lisa',
        lastName: 'Wilson',
        role: 'AUTHOR',
        description: 'Document author - procedures'
      },

      // TECHNICAL_REVIEWER users (for 1st and 2nd coordination stages)
      {
        email: 'tech1@richmond-dms.com',
        password: 'tech123',
        firstName: 'Robert',
        lastName: 'Brown',
        role: 'TECHNICAL_REVIEWER',
        description: 'Senior Technical Reviewer'
      },
      {
        email: 'tech2@richmond-dms.com',
        password: 'tech123',
        firstName: 'Jennifer',
        lastName: 'Garcia',
        role: 'TECHNICAL_REVIEWER',
        description: 'Technical Reviewer - Engineering'
      },
      {
        email: 'reviewer1@richmond-dms.com',
        password: 'reviewer123',
        firstName: 'David',
        lastName: 'Martinez',
        role: 'TECHNICAL_REVIEWER',
        description: 'Coordination Reviewer 1'
      },
      {
        email: 'reviewer2@richmond-dms.com',
        password: 'reviewer123',
        firstName: 'Amanda',
        lastName: 'Taylor',
        role: 'TECHNICAL_REVIEWER',
        description: 'Coordination Reviewer 2'
      },

      // LEGAL_REVIEWER users (for legal review stage)
      {
        email: 'legal1@richmond-dms.com',
        password: 'legal123',
        firstName: 'James',
        lastName: 'Anderson',
        role: 'LEGAL_REVIEWER',
        description: 'Senior Legal Counsel'
      },
      {
        email: 'legal2@richmond-dms.com',
        password: 'legal123',
        firstName: 'Maria',
        lastName: 'Rodriguez',
        role: 'LEGAL_REVIEWER',
        description: 'Legal Reviewer - Compliance'
      },
      {
        email: 'counsel@richmond-dms.com',
        password: 'counsel123',
        firstName: 'William',
        lastName: 'Thompson',
        role: 'LEGAL_REVIEWER',
        description: 'Legal Counsel - Policy Review'
      },

      // PUBLISHER users (AFDPO - final publishing authority)
      {
        email: 'publisher1@richmond-dms.com',
        password: 'publish123',
        firstName: 'Susan',
        lastName: 'White',
        role: 'PUBLISHER',
        description: 'AFDPO Publisher - Senior'
      },
      {
        email: 'publisher2@richmond-dms.com',
        password: 'publish123',
        firstName: 'Charles',
        lastName: 'Lewis',
        role: 'PUBLISHER',
        description: 'AFDPO Publisher - Deputy'
      },
      {
        email: 'afdpo@richmond-dms.com',
        password: 'afdpo123',
        firstName: 'Patricia',
        lastName: 'Clark',
        role: 'PUBLISHER',
        description: 'AFDPO Chief Publishing Officer'
      },

      // MANAGER users (supervisory oversight)
      {
        email: 'manager@richmond-dms.com',
        password: 'manager123',
        firstName: 'Kevin',
        lastName: 'Miller',
        role: 'MANAGER',
        description: 'Department Manager'
      },
      {
        email: 'supervisor@richmond-dms.com',
        password: 'supervisor123',
        firstName: 'Linda',
        lastName: 'Walker',
        role: 'MANAGER',
        description: 'Workflow Supervisor'
      },

      // Regular USER accounts
      {
        email: 'user@richmond-dms.com',
        password: 'user123',
        firstName: 'Regular',
        lastName: 'User',
        role: 'USER',
        description: 'Standard system user'
      },
      {
        email: 'viewer@richmond-dms.com',
        password: 'viewer123',
        firstName: 'Document',
        lastName: 'Viewer',
        role: 'USER',
        description: 'Read-only user'
      }
    ];

    console.log(`\n📝 Creating ${users.length} users...`);

    for (const userData of users) {
      let user = await prisma.user.findFirst({
        where: { email: userData.email }
      });

      if (!user) {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const role = createdRoles[userData.role];

        user = await prisma.user.create({
          data: {
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            passwordHash: hashedPassword,
            isActive: true,
            emailVerified: true,
            organizationId: mainOrg.id,
            roleId: role.id
          }
        });
        console.log(`✅ Created user: ${user.email} (${userData.role}) - ${userData.description}`);
      } else {
        console.log(`✅ User exists: ${user.email} (${userData.role}) - ${userData.description}`);
      }
    }

    console.log('\n🎉 8-Stage Workflow User Setup Complete!');
    console.log('\n📋 LOGIN CREDENTIALS FOR 8-STAGE WORKFLOW TESTING:\n');

    console.log('🔐 ADMIN ACCOUNTS:');
    console.log('  • admin@richmond-dms.com / admin123 (System Administrator)');
    console.log('  • admin@test.com / admin123 (Test Admin)');

    console.log('\n📝 OPR/AUTHOR ACCOUNTS (Can start workflows):');
    console.log('  • opr1@richmond-dms.com / opr123 (John Smith - Primary OPR)');
    console.log('  • opr2@richmond-dms.com / opr123 (Sarah Johnson - Secondary OPR)');
    console.log('  • author1@richmond-dms.com / author123 (Mike Davis - Author)');
    console.log('  • author2@richmond-dms.com / author123 (Lisa Wilson - Author)');

    console.log('\n🔍 TECHNICAL REVIEWER ACCOUNTS (1st & 2nd Coordination):');
    console.log('  • tech1@richmond-dms.com / tech123 (Robert Brown - Senior Technical)');
    console.log('  • tech2@richmond-dms.com / tech123 (Jennifer Garcia - Engineering)');
    console.log('  • reviewer1@richmond-dms.com / reviewer123 (David Martinez - Coordinator 1)');
    console.log('  • reviewer2@richmond-dms.com / reviewer123 (Amanda Taylor - Coordinator 2)');

    console.log('\n⚖️  LEGAL REVIEWER ACCOUNTS (Legal Review Stage):');
    console.log('  • legal1@richmond-dms.com / legal123 (James Anderson - Senior Legal)');
    console.log('  • legal2@richmond-dms.com / legal123 (Maria Rodriguez - Compliance)');
    console.log('  • counsel@richmond-dms.com / counsel123 (William Thompson - Policy)');

    console.log('\n🎯 PUBLISHER ACCOUNTS (AFDPO Final Publishing):');
    console.log('  • publisher1@richmond-dms.com / publish123 (Susan White - Senior)');
    console.log('  • publisher2@richmond-dms.com / publish123 (Charles Lewis - Deputy)');
    console.log('  • afdpo@richmond-dms.com / afdpo123 (Patricia Clark - Chief)');

    console.log('\n👔 MANAGER ACCOUNTS (Supervisory):');
    console.log('  • manager@richmond-dms.com / manager123 (Kevin Miller - Manager)');
    console.log('  • supervisor@richmond-dms.com / supervisor123 (Linda Walker - Supervisor)');

    console.log('\n👤 USER ACCOUNTS (Read-only):');
    console.log('  • user@richmond-dms.com / user123 (Regular User)');
    console.log('  • viewer@richmond-dms.com / viewer123 (Document Viewer)');

    console.log('\n🚀 WORKFLOW TESTING SEQUENCE:');
    console.log('1. Login as OPR/AUTHOR → Create document & start workflow');
    console.log('2. Login as TECHNICAL_REVIEWER → Review 1st Coordination');
    console.log('3. Login as OPR/AUTHOR → Handle OPR Revisions');
    console.log('4. Login as TECHNICAL_REVIEWER → Review 2nd Coordination');
    console.log('5. Login as OPR/AUTHOR → Finalize OPR Final');
    console.log('6. Login as LEGAL_REVIEWER → Conduct Legal Review');
    console.log('7. Login as OPR/AUTHOR → Handle OPR Legal');
    console.log('8. Login as PUBLISHER → Final AFDPO Publishing');

    console.log('\n✨ All accounts are ready for comprehensive 8-stage workflow testing!');

  } catch (error) {
    console.error('❌ Error setting up users:', error);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

setup8StageWorkflowUsers();