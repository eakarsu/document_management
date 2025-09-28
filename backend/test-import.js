#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function testImport() {
  console.log('🧪 Testing database import...\n');

  // Check if backup exists
  const backupDir = path.join(__dirname, 'database-backup');
  const dataFile = path.join(backupDir, 'database-export.json');

  if (!fs.existsSync(dataFile)) {
    console.log('❌ No backup file found at:', dataFile);
    console.log('   This is why import fails - no backup to restore from!');
    console.log('\n📝 To create a backup:');
    console.log('   cd backend && node export-database.js');
    return;
  }

  console.log('✅ Backup file exists');

  // Check if we can read it
  try {
    const data = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
    console.log('✅ Backup file is valid JSON');
    console.log('\n📊 Backup contains:');
    console.log(`   Organizations: ${data.organizations?.length || 0}`);
    console.log(`   Users: ${data.users?.length || 0}`);
    console.log(`   Documents: ${data.documents?.length || 0}`);
    console.log(`   Workflows: ${data.workflows?.length || 0}`);
  } catch (error) {
    console.log('❌ Cannot read backup file:', error.message);
    return;
  }

  // Test database connection
  console.log('\n🔌 Testing database connection...');
  const prisma = new PrismaClient();

  try {
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connected');

    // Check current data
    const userCount = await prisma.user.count();
    const docCount = await prisma.document.count();
    console.log(`\n📊 Current database has:`);
    console.log(`   Users: ${userCount}`);
    console.log(`   Documents: ${docCount}`);

    if (userCount > 0) {
      console.log('\n⚠️  Database already has data!');
      console.log('   This might be why import is skipped.');
      console.log('   The import script avoids overwriting existing data.');
    }

  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
    console.log('\n🔧 Check your DATABASE_URL in backend/.env');
    console.log('   Should be: postgresql://postgres:postgres@localhost:5432/dms_dev');
  } finally {
    await prisma.$disconnect();
  }
}

testImport();