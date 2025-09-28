#!/bin/bash

# Quick database fix for AWS

echo "🔧 Quick Database Fix"
echo "===================="

# 1. Check current .env
echo ""
echo "Current DATABASE_URL in .env:"
grep "DATABASE_URL" .env || echo "Not found!"

echo ""
echo "Current DATABASE_URL in backend/.env:"
grep "DATABASE_URL" backend/.env || echo "Not found!"

# 2. Fix both .env files
echo ""
echo "📝 Updating .env files with correct DATABASE_URL..."

# Update root .env
cat > .env << 'EOF'
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dms_dev

# Backend
NODE_ENV=development
PORT=4000
JWT_SECRET=your-secret-key-change-this
FRONTEND_URL=http://localhost:3000

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_COMPANY_NAME=Richmond DMS
NEXT_PUBLIC_COMPANY_LOCATION=Richmond, VA
EOF

# Copy to backend
cp .env backend/.env

echo "✅ .env files updated"

# 3. Test connection
echo ""
echo "🧪 Testing database connection..."
PGPASSWORD=postgres psql -U postgres -h localhost -d dms_dev -c "SELECT version();" > /dev/null 2>&1 && {
    echo "✅ Database connection successful!"
    echo ""
    echo "🚀 You can now run: ./start-with-data.sh"
} || {
    echo "❌ Connection still failing. Let's try another approach..."

    # Alternative: Create ubuntu user with password
    echo ""
    echo "Creating ubuntu user in PostgreSQL..."
    sudo -u postgres psql << EOF
CREATE USER ubuntu WITH SUPERUSER CREATEDB PASSWORD 'postgres';
ALTER DATABASE dms_dev OWNER TO ubuntu;
GRANT ALL PRIVILEGES ON DATABASE dms_dev TO ubuntu;
EOF

    # Update .env with ubuntu user
    sed -i 's|postgresql://postgres:postgres|postgresql://ubuntu:postgres|g' .env
    sed -i 's|postgresql://postgres:postgres|postgresql://ubuntu:postgres|g' backend/.env

    echo ""
    echo "✅ Created ubuntu user. Updated .env files."
    echo ""
    echo "New DATABASE_URL:"
    grep "DATABASE_URL" .env

    # Test again
    PGPASSWORD=postgres psql -U ubuntu -h localhost -d dms_dev -c "SELECT version();" > /dev/null 2>&1 && {
        echo "✅ Connection working with ubuntu user!"
    } || {
        echo "⚠️  Still having issues. Manual fix needed."
        echo ""
        echo "Run these commands:"
        echo "1. sudo -u postgres psql"
        echo "2. \\du  (to list users)"
        echo "3. \\l   (to list databases)"
        echo "4. Check which user owns dms_dev database"
    }
}

echo ""
echo "📋 Current .env content:"
echo "========================"
head -3 .env

echo ""
echo "If still failing, try:"
echo "1. cd backend"
echo "2. npx prisma db push --skip-generate"
echo "3. If that works: cd .. && ./start-with-data.sh"