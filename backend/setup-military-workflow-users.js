const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function setupMilitaryWorkflowUsers() {
  try {
    console.log('🚀 Setting up MILITARY .mil domain users for 8-stage workflow testing...');

    // Create military organization
    let milOrg = await prisma.organization.findFirst({
      where: { domain: 'af.mil' }
    });

    if (!milOrg) {
      milOrg = await prisma.organization.create({
        data: {
          name: 'United States Air Force',
          domain: 'af.mil',
          settings: { workflowEnabled: true, militaryMode: true },
          isActive: true
        }
      });
      console.log(`✅ Created military organization: ${milOrg.name} (${milOrg.id})`);
    } else {
      console.log(`✅ Military organization exists: ${milOrg.name} (${milOrg.id})`);
    }

    // Create comprehensive roles for 8-stage military workflow
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
          organizationId: milOrg.id 
        }
      });

      if (!role) {
        role = await prisma.role.create({
          data: {
            ...roleData,
            organizationId: milOrg.id
          }
        });
        console.log(`✅ Created military role: ${role.name}`);
      } else {
        console.log(`✅ Military role exists: ${role.name}`);
      }
      createdRoles[roleData.name] = role;
    }

    // Create comprehensive military users for 8-stage workflow testing
    const militaryUsers = [
      // ADMIN users
      {
        email: 'admin@af.mil',
        password: 'admin123',
        firstName: 'System',
        lastName: 'Administrator',
        role: 'ADMIN',
        rank: 'Col',
        description: 'Air Force system admin'
      },
      {
        email: 'sysadmin@us.af.mil',
        password: 'admin123',
        firstName: 'Technical',
        lastName: 'Administrator', 
        role: 'ADMIN',
        rank: 'Maj',
        description: 'Technical system admin'
      },

      // OPR/AUTHOR users (can start workflows and create documents)
      {
        email: 'opr.chief@af.mil',
        password: 'opr123',
        firstName: 'John',
        lastName: 'Smith',
        role: 'OPR',
        rank: 'Lt Col',
        description: 'Primary OPR for DAFMAN documents'
      },
      {
        email: 'opr.deputy@af.mil', 
        password: 'opr123',
        firstName: 'Sarah',
        lastName: 'Johnson',
        role: 'OPR',
        rank: 'Maj',
        description: 'Deputy OPR for DAFI documents'
      },
      {
        email: 'author.policy@af.mil',
        password: 'author123',
        firstName: 'Michael',
        lastName: 'Davis',
        role: 'AUTHOR',
        rank: 'Capt',
        description: 'Policy document author'
      },
      {
        email: 'author.tech@af.mil',
        password: 'author123',
        firstName: 'Lisa',
        lastName: 'Wilson',
        role: 'AUTHOR',
        rank: 'Capt',
        description: 'Technical document author'
      },

      // TECHNICAL_REVIEWER users (for 1st and 2nd coordination stages)
      {
        email: 'tech.senior@af.mil',
        password: 'tech123',
        firstName: 'Robert',
        lastName: 'Brown',
        role: 'TECHNICAL_REVIEWER',
        rank: 'Lt Col',
        description: 'Senior Technical Reviewer'
      },
      {
        email: 'tech.engineer@af.mil',
        password: 'tech123',
        firstName: 'Jennifer',
        lastName: 'Garcia',
        role: 'TECHNICAL_REVIEWER',
        rank: 'Maj',
        description: 'Engineering Technical Reviewer'
      },
      {
        email: 'reviewer.coord1@af.mil',
        password: 'reviewer123',
        firstName: 'David',
        lastName: 'Martinez',
        role: 'TECHNICAL_REVIEWER',
        rank: 'Maj',
        description: '1st Coordination Reviewer'
      },
      {
        email: 'reviewer.coord2@af.mil',
        password: 'reviewer123',
        firstName: 'Amanda',
        lastName: 'Taylor',
        role: 'TECHNICAL_REVIEWER',
        rank: 'Capt',
        description: '2nd Coordination Reviewer'
      },

      // LEGAL_REVIEWER users (for legal review stage)
      {
        email: 'legal.chief@af.mil',
        password: 'legal123',
        firstName: 'James',
        lastName: 'Anderson',
        role: 'LEGAL_REVIEWER',
        rank: 'Col',
        description: 'Chief Legal Counsel'
      },
      {
        email: 'legal.compliance@af.mil',
        password: 'legal123',
        firstName: 'Maria',
        lastName: 'Rodriguez',
        role: 'LEGAL_REVIEWER',
        rank: 'Lt Col',
        description: 'Legal Compliance Reviewer'
      },
      {
        email: 'counsel.policy@af.mil',
        password: 'counsel123',
        firstName: 'William',
        lastName: 'Thompson',
        role: 'LEGAL_REVIEWER',
        rank: 'Maj',
        description: 'Policy Legal Counsel'
      },

      // PUBLISHER users (AFDPO - final publishing authority)
      {
        email: 'publisher.senior@af.mil',
        password: 'publish123',
        firstName: 'Susan',
        lastName: 'White',
        role: 'PUBLISHER',
        rank: 'Col',
        description: 'Senior AFDPO Publisher'
      },
      {
        email: 'publisher.deputy@af.mil',
        password: 'publish123',
        firstName: 'Charles',
        lastName: 'Lewis',
        role: 'PUBLISHER',
        rank: 'Lt Col',
        description: 'Deputy AFDPO Publisher'
      },
      {
        email: 'afdpo.chief@af.mil',
        password: 'afdpo123',
        firstName: 'Patricia',
        lastName: 'Clark',
        role: 'PUBLISHER',
        rank: 'Brig Gen',
        description: 'AFDPO Chief Publishing Officer'
      },

      // MANAGER users (supervisory oversight)
      {
        email: 'manager.dept@af.mil',
        password: 'manager123',
        firstName: 'Kevin',
        lastName: 'Miller',
        role: 'MANAGER',
        rank: 'Lt Col',
        description: 'Department Manager'
      },
      {
        email: 'supervisor.workflow@af.mil',
        password: 'supervisor123',
        firstName: 'Linda',
        lastName: 'Walker',
        role: 'MANAGER',
        rank: 'Maj',
        description: 'Workflow Supervisor'
      },

      // Regular USER accounts
      {
        email: 'airman.user@af.mil',
        password: 'user123',
        firstName: 'Regular',
        lastName: 'User',
        role: 'USER',
        rank: 'SSgt',
        description: 'Standard Air Force user'
      },
      {
        email: 'viewer.docs@af.mil',
        password: 'viewer123',
        firstName: 'Document',
        lastName: 'Viewer',
        role: 'USER',
        rank: 'SrA',
        description: 'Document viewer'
      }
    ];

    console.log(`\n📝 Creating ${militaryUsers.length} military users...`);

    for (const userData of militaryUsers) {
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
            organizationId: milOrg.id,
            roleId: role.id,
            jobTitle: `${userData.rank} ${userData.firstName} ${userData.lastName}`
          }
        });
        console.log(`✅ Created military user: ${userData.rank} ${user.email} (${userData.role}) - ${userData.description}`);
      } else {
        console.log(`✅ Military user exists: ${userData.rank} ${user.email} (${userData.role}) - ${userData.description}`);
      }
    }

    console.log('\n🎉 Military .mil Domain User Setup Complete!');
    console.log('\n📋 MILITARY LOGIN CREDENTIALS FOR 8-STAGE WORKFLOW TESTING:\n');

    console.log('🔐 ADMIN ACCOUNTS (.mil):');
    console.log('  • admin@af.mil / admin123 (Col System Administrator)');
    console.log('  • sysadmin@us.af.mil / admin123 (Maj Technical Administrator)');

    console.log('\n📝 OPR/AUTHOR ACCOUNTS (Can start workflows):');
    console.log('  • opr.chief@af.mil / opr123 (Lt Col John Smith - Primary OPR)');
    console.log('  • opr.deputy@af.mil / opr123 (Maj Sarah Johnson - Deputy OPR)');
    console.log('  • author.policy@af.mil / author123 (Capt Michael Davis - Policy Author)');
    console.log('  • author.tech@af.mil / author123 (Capt Lisa Wilson - Technical Author)');

    console.log('\n🔍 TECHNICAL REVIEWER ACCOUNTS (1st & 2nd Coordination):');
    console.log('  • tech.senior@af.mil / tech123 (Lt Col Robert Brown - Senior Technical)');
    console.log('  • tech.engineer@af.mil / tech123 (Maj Jennifer Garcia - Engineering)');
    console.log('  • reviewer.coord1@af.mil / reviewer123 (Maj David Martinez - 1st Coordinator)');
    console.log('  • reviewer.coord2@af.mil / reviewer123 (Capt Amanda Taylor - 2nd Coordinator)');

    console.log('\n⚖️  LEGAL REVIEWER ACCOUNTS (Legal Review Stage):');
    console.log('  • legal.chief@af.mil / legal123 (Col James Anderson - Chief Legal)');
    console.log('  • legal.compliance@af.mil / legal123 (Lt Col Maria Rodriguez - Compliance)');
    console.log('  • counsel.policy@af.mil / counsel123 (Maj William Thompson - Policy Counsel)');

    console.log('\n🎯 PUBLISHER ACCOUNTS (AFDPO Final Publishing):');
    console.log('  • publisher.senior@af.mil / publish123 (Col Susan White - Senior Publisher)');
    console.log('  • publisher.deputy@af.mil / publish123 (Lt Col Charles Lewis - Deputy)');
    console.log('  • afdpo.chief@af.mil / afdpo123 (Brig Gen Patricia Clark - AFDPO Chief)');

    console.log('\n👔 MANAGER ACCOUNTS (Supervisory):');
    console.log('  • manager.dept@af.mil / manager123 (Lt Col Kevin Miller - Department Manager)');
    console.log('  • supervisor.workflow@af.mil / supervisor123 (Maj Linda Walker - Workflow Supervisor)');

    console.log('\n👤 USER ACCOUNTS (Read-only):');
    console.log('  • airman.user@af.mil / user123 (SSgt Regular User)');
    console.log('  • viewer.docs@af.mil / viewer123 (SrA Document Viewer)');

    console.log('\n🚀 MILITARY WORKFLOW TESTING SEQUENCE:');
    console.log('1. Login as OPR/AUTHOR → Create DAFMAN/DAFI document & start workflow');
    console.log('2. Login as TECHNICAL_REVIEWER → Review 1st Coordination');
    console.log('3. Login as OPR/AUTHOR → Handle OPR Revisions');
    console.log('4. Login as TECHNICAL_REVIEWER → Review 2nd Coordination');
    console.log('5. Login as OPR/AUTHOR → Finalize OPR Final');
    console.log('6. Login as LEGAL_REVIEWER → Conduct Legal Review');
    console.log('7. Login as OPR/AUTHOR → Handle OPR Legal');
    console.log('8. Login as PUBLISHER → Final AFDPO Publishing');

    console.log('\n✨ All military .mil accounts are ready for comprehensive 8-stage workflow testing!');

  } catch (error) {
    console.error('❌ Error setting up military users:', error);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

setupMilitaryWorkflowUsers();