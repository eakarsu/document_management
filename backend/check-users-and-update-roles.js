const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAndUpdateUsers() {
  try {
    console.log('🔍 Checking existing users and their roles...\n');
    
    // Get all users with their roles
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: {
          select: {
            name: true,
            roleType: true
          }
        }
      }
    });
    
    console.log(`Found ${users.length} users:\n`);
    users.forEach(user => {
      const fullName = `${user.firstName} ${user.lastName}`.trim();
      console.log(`📧 ${user.email} | Role: ${user.role?.name || 'No Role'} | Name: ${fullName}`);
    });
    
    // Define required roles for OPR workflow
    const requiredRoles = {
      'OPR': ['opr@demo.mil', 'opr@test.mil', 'opr@example.com'],
      'Coordinator': ['coordinator@demo.mil', 'coordinator@test.mil', 'coord@example.com'],
      'Legal': ['legal@demo.mil', 'legal@test.mil', 'legal@example.com'],
      'AFDPO': ['afdpo@demo.mil', 'afdpo@test.mil', 'publisher@example.com'],
      'Admin': ['admin@demo.mil', 'admin@test.mil', 'admin@example.com']
    };
    
    console.log('\n🎯 Required roles for OPR workflow:');
    console.log('- OPR: Stages 1, 3, 5, 7 (document author)');
    console.log('- Coordinator: Stages 2, 4 (coordination rounds)');
    console.log('- Legal: Stage 6 (legal review)');
    console.log('- AFDPO: Stage 8 (final publication)');
    console.log('- Admin: All stages (override capability)\n');
    
    // First, let's check what roles exist in the system
    const existingRoles = await prisma.role.findMany({
      select: {
        id: true,
        name: true,
        roleType: true
      }
    });
    
    console.log(`\n🔍 Found ${existingRoles.length} roles in system:\n`);
    existingRoles.forEach(role => {
      console.log(`🏷️  ${role.name} (Type: ${role.roleType || 'None'})`);
    });
    
    // Map workflow role names to what we need to find/create
    const workflowRoles = ['OPR', 'Coordinator', 'Legal', 'AFDPO', 'Admin'];
    
    console.log('\n🎯 Required roles for OPR workflow:');
    console.log('- OPR: Stages 1, 3, 5, 7 (document author)');
    console.log('- Coordinator: Stages 2, 4 (coordination rounds)');
    console.log('- Legal: Stage 6 (legal review)');
    console.log('- AFDPO: Stage 8 (final publication)');
    console.log('- Admin: All stages (override capability)\n');
    
    // Check if we need to create any roles
    const missingRoles = workflowRoles.filter(roleName => 
      !existingRoles.find(r => r.name === roleName)
    );
    
    if (missingRoles.length > 0) {
      console.log(`🔄 Creating missing roles: ${missingRoles.join(', ')}\n`);
      
      // Get the first organization ID for role creation
      const firstOrg = await prisma.organization.findFirst();
      if (!firstOrg) {
        console.error('❌ No organization found to create roles in');
        return;
      }
      
      for (const roleName of missingRoles) {
        try {
          await prisma.role.create({
            data: {
              name: roleName,
              description: `${roleName} role for OPR workflow`,
              permissions: ['READ', 'WRITE'], // Basic permissions
              organizationId: firstOrg.id,
              isSystem: false
            }
          });
          console.log(`✅ Created role: ${roleName}`);
        } catch (error) {
          console.log(`⚠️  Role ${roleName} might already exist or error: ${error.message}`);
        }
      }
    }
    
    // Re-fetch roles after potential creation
    const allRoles = await prisma.role.findMany({
      select: {
        id: true,
        name: true,
        roleType: true
      }
    });
    
    // Check which users need role updates
    const updates = [];
    
    for (const user of users) {
      let suggestedRoleName = null;
      
      // Try to match email to appropriate role
      const emailLower = user.email.toLowerCase();
      
      if (emailLower.includes('admin')) suggestedRoleName = 'Admin';
      else if (emailLower.includes('legal')) suggestedRoleName = 'Legal';
      else if (emailLower.includes('coord')) suggestedRoleName = 'Coordinator';
      else if (emailLower.includes('opr')) suggestedRoleName = 'OPR';
      else if (emailLower.includes('afdpo') || emailLower.includes('publish')) suggestedRoleName = 'AFDPO';
      else {
        // Keep current role if it's already one of our workflow roles
        if (user.role?.name && workflowRoles.includes(user.role.name)) {
          suggestedRoleName = user.role.name;
        } else {
          suggestedRoleName = 'OPR'; // Default to OPR
        }
      }
      
      // Find the role ID
      const targetRole = allRoles.find(r => r.name === suggestedRoleName);
      if (!targetRole) {
        console.log(`⚠️  Could not find role ${suggestedRoleName} for user ${user.email}`);
        continue;
      }
      
      if (user.role?.name !== suggestedRoleName) {
        updates.push({
          id: user.id,
          email: user.email,
          currentRole: user.role?.name || 'No Role',
          newRole: suggestedRoleName,
          newRoleId: targetRole.id
        });
      }
    }
    
    if (updates.length > 0) {
      console.log(`\n🔄 Found ${updates.length} users that need role updates:\n`);
      
      for (const update of updates) {
        console.log(`📧 ${update.email}: ${update.currentRole} → ${update.newRole}`);
        
        try {
          // Update the user's role
          await prisma.user.update({
            where: { id: update.id },
            data: { roleId: update.newRoleId }
          });
          console.log(`  ✅ Updated ${update.email}`);
        } catch (error) {
          console.log(`  ❌ Failed to update ${update.email}: ${error.message}`);
        }
      }
      
      console.log('\n✅ Successfully processed user role updates!');
    } else {
      console.log('\n✅ All users already have appropriate roles for the OPR workflow!');
    }
    
    // Show final user mapping
    const updatedUsers = await prisma.user.findMany({
      select: {
        email: true,
        firstName: true,
        lastName: true,
        role: {
          select: {
            name: true
          }
        }
      },
      orderBy: { 
        role: {
          name: 'asc'
        }
      }
    });
    
    console.log('\n📋 Final user role mapping for OPR workflow testing:\n');
    
    const roleGroups = {};
    updatedUsers.forEach(user => {
      const roleName = user.role?.name || 'No Role';
      if (!roleGroups[roleName]) roleGroups[roleName] = [];
      roleGroups[roleName].push(user);
    });
    
    Object.entries(roleGroups).forEach(([role, users]) => {
      console.log(`👥 ${role} Users:`);
      users.forEach(user => {
        const fullName = `${user.firstName} ${user.lastName}`.trim();
        console.log(`   📧 ${user.email} (${fullName})`);
      });
      console.log('');
    });
    
    // Show workflow stage mappings
    console.log('🔄 Workflow Stage Mappings:');
    console.log('Stage 1 (OPR Author): OPR users');
    console.log('Stage 2 (1st Coordination): Coordinator users');
    console.log('Stage 3 (Back to OPR): OPR users');
    console.log('Stage 4 (2nd Coordination): Coordinator users');
    console.log('Stage 5 (Back to OPR): OPR users');
    console.log('Stage 6 (Legal Review): Legal users');
    console.log('Stage 7 (Back to OPR): OPR users');
    console.log('Stage 8 (AFDPO Publication): AFDPO users');
    console.log('All Stages: Admin users (override)');
    
  } catch (error) {
    console.error('❌ Error checking/updating users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndUpdateUsers();