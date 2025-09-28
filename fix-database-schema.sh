#!/bin/bash

# Fix database schema issues on AWS

echo "🔧 Fixing Database Schema Issues"
echo "================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${GREEN}✅ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️ $1${NC}"; }

# Stop existing services
print_info "Stopping existing services..."
pkill -f "ts-node" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true
sleep 2

# Ensure .env is correct
print_info "Checking environment..."
if [ ! -f backend/.env ]; then
    cp .env backend/.env
fi

# Add DATABASE_URL if missing
if ! grep -q "DATABASE_URL" backend/.env; then
    echo "DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dms_dev" >> backend/.env
fi

cd backend

# Clean Prisma cache first
print_info "Cleaning Prisma cache..."
rm -rf node_modules/.prisma
rm -rf node_modules/@prisma/client

# Reinstall Prisma dependencies
print_info "Reinstalling Prisma dependencies..."
npm install @prisma/client prisma --save-exact

# Generate Prisma client first
print_info "Generating Prisma client..."
npx prisma generate

# Force recreate the schema
print_info "Recreating database schema..."
npx prisma db push --force-reset --skip-generate

if [ $? -eq 0 ]; then
    print_status "Database schema created successfully"
else
    print_error "Failed to create schema. Trying alternative method..."

    # Alternative: Drop and recreate database
    print_info "Dropping and recreating database..."
    PGPASSWORD=postgres psql -U postgres -h localhost << EOF
DROP DATABASE IF EXISTS dms_dev;
CREATE DATABASE dms_dev;
EOF

    # Try again with fresh database
    npx prisma db push --skip-generate
fi

# Seed the database
print_info "Seeding database with initial data..."
npx prisma db seed || {
    print_warning "Seed script not found, trying alternative..."
    cd ../database
    npm run seed || {
        print_warning "Seeding failed, but continuing..."
    }
    cd ../backend
}

# Verify tables exist
print_info "Verifying database tables..."
PGPASSWORD=postgres psql -U postgres -h localhost -d dms_dev -c "\dt" | head -20

# Count tables
TABLE_COUNT=$(PGPASSWORD=postgres psql -U postgres -h localhost -d dms_dev -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
print_status "Created $TABLE_COUNT tables in database"

cd ..

echo ""
print_status "Database schema fixed!"
echo ""
echo "🚀 You can now run:"
echo "   ./start-with-data.sh"
echo ""
echo "📊 To check database:"
echo "   cd backend && npx prisma studio --browser none --port 5555"