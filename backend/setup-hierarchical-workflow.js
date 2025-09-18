const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function setupHierarchicalWorkflow() {
  try {
    console.log('🚀 Setting up Hierarchical Distributed Workflow...\n');

    // Step 1: Create/update organizations
    console.log('📦 Setting up organizations...');
    const organizations = [
      { name: 'OPR', domain: 'opr.airforce.mil' },
      { name: 'Operations', domain: 'ops.airforce.mil' },
      { name: 'Logistics', domain: 'log.airforce.mil' },
      { name: 'Finance', domain: 'fin.airforce.mil' },
      { name: 'Personnel', domain: 'per.airforce.mil' },
      { name: 'Legal', domain: 'legal.airforce.mil' },
      { name: 'AFDPO', domain: 'afdpo.airforce.mil' }
    ];

    for (const org of organizations) {
      await prisma.organization.upsert({
        where: { domain: org.domain },
        update: {
          name: org.name
        },
        create: {
          name: org.name,
          domain: org.domain
        }
      });
      console.log(`  ✓ ${org.name}`);
    }

    // Step 2: Get OPR organization for global roles
    const oprOrg = await prisma.organization.findFirst({
      where: { name: 'OPR' }
    });

    if (!oprOrg) {
      throw new Error('OPR organization not found');
    }

    // Step 3: Create/update roles
    console.log('\n👥 Setting up roles...');
    const roles = [
      {
        name: 'ACTION_OFFICER',
        description: 'Action Officer (AO) - Person responsible for working the draft',
        permissions: ['draft:create', 'draft:edit', 'ownership:transfer', 'feedback:incorporate'],
        organizationId: oprOrg.id
      },
      {
        name: 'PCM',
        description: 'Program Control Manager - OPR top-level gatekeeper',
        permissions: ['document:approve', 'document:reject', 'document:forward'],
        organizationId: oprOrg.id
      },
      {
        name: 'FRONT_OFFICE',
        description: 'Organization Front Office - Controls organization inbox and routing',
        permissions: ['document:route', 'document:approve', 'document:distribute'],
        organizationId: oprOrg.id
      },
      {
        name: 'Coordinator',
        description: 'Coordinator - Manages distribution to sub-reviewers',
        permissions: ['document:distribute', 'feedback:collect'],
        organizationId: oprOrg.id
      },
      {
        name: 'SUB_REVIEWER',
        description: 'Sub-Reviewer - Department-level reviewer',
        permissions: ['document:review', 'feedback:submit'],
        organizationId: oprOrg.id
      },
      {
        name: 'LEGAL',
        description: 'Legal Reviewer - Legal compliance review',
        permissions: ['document:review', 'compliance:certify'],
        organizationId: oprOrg.id
      },
      {
        name: 'LEADERSHIP',
        description: 'OPR Leadership - Final approval and signature authority',
        permissions: ['document:approve', 'document:sign', 'document:reject'],
        organizationId: oprOrg.id
      },
      {
        name: 'AFDPO_PUBLISHER',
        description: 'AFDPO Publisher - Final publication authority',
        permissions: ['document:publish', 'document:archive'],
        organizationId: oprOrg.id
      }
    ];

    for (const role of roles) {
      await prisma.role.upsert({
        where: {
          name_organizationId: {
            name: role.name,
            organizationId: role.organizationId
          }
        },
        update: {
          description: role.description,
          permissions: role.permissions
        },
        create: role
      });
      console.log(`  ✓ ${role.name}`);
    }

    // Step 4: Create test users for each role
    console.log('\n👤 Creating test users for hierarchical workflow...');
    const hashedPassword = await bcrypt.hash('testpass123', 10);

    const testUsers = [
      // Action Officers (multiple for ownership transfer testing)
      {
        email: 'ao1@airforce.mil',
        firstName: 'John',
        lastName: 'Smith',
        role: 'ACTION_OFFICER',
        organization: 'OPR',
        description: 'Primary Action Officer'
      },
      {
        email: 'ao2@airforce.mil',
        firstName: 'Sarah',
        lastName: 'Johnson',
        role: 'ACTION_OFFICER',
        organization: 'OPR',
        description: 'Secondary Action Officer (for transfer testing)'
      },

      // PCM (Program Control Manager)
      {
        email: 'pcm@airforce.mil',
        firstName: 'Michael',
        lastName: 'Davis',
        role: 'PCM',
        organization: 'OPR',
        description: 'OPR Gatekeeper'
      },

      // Front Office Gatekeepers for each organization
      {
        email: 'ops.frontoffice@airforce.mil',
        firstName: 'Robert',
        lastName: 'Williams',
        role: 'FRONT_OFFICE',
        organization: 'Operations',
        description: 'Operations Front Office'
      },
      {
        email: 'log.frontoffice@airforce.mil',
        firstName: 'Jennifer',
        lastName: 'Martinez',
        role: 'FRONT_OFFICE',
        organization: 'Logistics',
        description: 'Logistics Front Office'
      },
      {
        email: 'fin.frontoffice@airforce.mil',
        firstName: 'David',
        lastName: 'Thompson',
        role: 'FRONT_OFFICE',
        organization: 'Finance',
        description: 'Finance Front Office'
      },
      {
        email: 'per.frontoffice@airforce.mil',
        firstName: 'Patricia',
        lastName: 'Garcia',
        role: 'FRONT_OFFICE',
        organization: 'Personnel',
        description: 'Personnel Front Office'
      },

      // Coordinators (still needed for overall distribution management)
      {
        email: 'coordinator1@airforce.mil',
        firstName: 'Alice',
        lastName: 'Johnson',
        role: 'Coordinator',
        organization: 'OPR',
        description: 'Primary Coordinator'
      },

      // Sub-Reviewers for each department
      {
        email: 'ops.reviewer1@airforce.mil',
        firstName: 'James',
        lastName: 'Wilson',
        role: 'SUB_REVIEWER',
        organization: 'Operations',
        description: 'Operations Reviewer'
      },
      {
        email: 'ops.reviewer2@airforce.mil',
        firstName: 'Mary',
        lastName: 'Brown',
        role: 'SUB_REVIEWER',
        organization: 'Operations',
        description: 'Operations Reviewer'
      },
      {
        email: 'log.reviewer1@airforce.mil',
        firstName: 'Christopher',
        lastName: 'Lee',
        role: 'SUB_REVIEWER',
        organization: 'Logistics',
        description: 'Logistics Reviewer'
      },
      {
        email: 'fin.reviewer1@airforce.mil',
        firstName: 'Linda',
        lastName: 'Anderson',
        role: 'SUB_REVIEWER',
        organization: 'Finance',
        description: 'Finance Reviewer'
      },
      {
        email: 'per.reviewer1@airforce.mil',
        firstName: 'Richard',
        lastName: 'Taylor',
        role: 'SUB_REVIEWER',
        organization: 'Personnel',
        description: 'Personnel Reviewer'
      },

      // Legal Reviewer
      {
        email: 'legal.reviewer@airforce.mil',
        firstName: 'Elizabeth',
        lastName: 'Moore',
        role: 'LEGAL',
        organization: 'Legal',
        description: 'Legal Compliance Officer'
      },

      // OPR Leadership
      {
        email: 'opr.leadership@airforce.mil',
        firstName: 'Colonel',
        lastName: 'Anderson',
        role: 'LEADERSHIP',
        organization: 'OPR',
        description: 'OPR Commander'
      },

      // AFDPO Publisher
      {
        email: 'afdpo.publisher@airforce.mil',
        firstName: 'Thomas',
        lastName: 'Jackson',
        role: 'AFDPO_PUBLISHER',
        organization: 'AFDPO',
        description: 'AFDPO Publishing Authority'
      }
    ];

    for (const userData of testUsers) {
      const organization = await prisma.organization.findFirst({
        where: { name: userData.organization }
      });

      if (!organization) {
        console.log(`  ⚠️  Skipping ${userData.email} - organization ${userData.organization} not found`);
        continue;
      }

      const role = await prisma.role.findFirst({
        where: {
          name: userData.role,
          organizationId: oprOrg.id
        }
      });

      if (!role) {
        console.log(`  ⚠️  Skipping ${userData.email} - role ${userData.role} not found`);
        continue;
      }

      const user = await prisma.user.upsert({
        where: { email: userData.email },
        update: {
          firstName: userData.firstName,
          lastName: userData.lastName,
          roleId: role.id,
          organizationId: organization.id,
          isActive: true
        },
        create: {
          email: userData.email,
          passwordHash: hashedPassword,
          firstName: userData.firstName,
          lastName: userData.lastName,
          roleId: role.id,
          organizationId: organization.id,
          isActive: true
        }
      });

      console.log(`  ✓ ${userData.email} (${userData.role}) - ${userData.description}`);
    }

    // Step 4: Display summary
    console.log('\n📊 Summary:');
    const userCount = await prisma.user.count();
    const roleCount = await prisma.role.count();
    const orgCount = await prisma.organization.count();

    console.log(`  Total users: ${userCount}`);
    console.log(`  Total roles: ${roleCount}`);
    console.log(`  Total organizations: ${orgCount}`);

    console.log('\n✅ Hierarchical workflow setup complete!');
    console.log('\n📝 Test Accounts (all use password: testpass123):');
    console.log('\n  Action Officers:');
    console.log('    ao1@airforce.mil - Primary AO');
    console.log('    ao2@airforce.mil - Secondary AO (for transfer testing)');
    console.log('\n  Gatekeepers:');
    console.log('    pcm@airforce.mil - OPR Gatekeeper (PCM)');
    console.log('    ops.frontoffice@airforce.mil - Operations Front Office');
    console.log('    log.frontoffice@airforce.mil - Logistics Front Office');
    console.log('    fin.frontoffice@airforce.mil - Finance Front Office');
    console.log('    per.frontoffice@airforce.mil - Personnel Front Office');
    console.log('\n  Reviewers:');
    console.log('    coordinator1@airforce.mil - Primary Coordinator');
    console.log('    ops.reviewer1@airforce.mil - Operations Sub-Reviewer');
    console.log('    log.reviewer1@airforce.mil - Logistics Sub-Reviewer');
    console.log('    fin.reviewer1@airforce.mil - Finance Sub-Reviewer');
    console.log('    per.reviewer1@airforce.mil - Personnel Sub-Reviewer');
    console.log('    legal.reviewer@airforce.mil - Legal Reviewer');
    console.log('\n  Leadership:');
    console.log('    opr.leadership@airforce.mil - OPR Commander');
    console.log('    afdpo.publisher@airforce.mil - AFDPO Publisher');

  } catch (error) {
    console.error('❌ Error setting up hierarchical workflow:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupHierarchicalWorkflow();