#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function setupTestUser() {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'john.doe@usaf.mil' }
    });

    if (existingUser) {
      console.log('Test user already exists');
      return;
    }

    // Get or create organization
    let organization = await prisma.organization.findFirst();
    if (!organization) {
      organization = await prisma.organization.create({
        data: {
          name: 'US Air Force',
          slug: 'usaf',
          domain: 'usaf.mil'
        }
      });
    }

    // Get or create admin role
    let role = await prisma.role.findFirst({ where: { name: 'Admin' } });
    if (!role) {
      role = await prisma.role.create({
        data: {
          name: 'Admin',
          description: 'Administrator role',
          permissions: ['all']
        }
      });
    }

    // Create test user
    const hashedPassword = await bcrypt.hash('SecurePass123!', 10);
    const user = await prisma.user.create({
      data: {
        email: 'john.doe@usaf.mil',
        passwordHash: hashedPassword,
        firstName: 'John',
        lastName: 'Doe',
        department: 'AF/A1',
        organization: {
          connect: { id: organization.id }
        },
        role: {
          connect: { id: role.id }
        }
      }
    });

    console.log('Test user created successfully:', user.email);
  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupTestUser();