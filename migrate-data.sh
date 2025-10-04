#!/bin/bash

# Data Migration Script
# Migrates data from local PostgreSQL (port 5432) to Docker PostgreSQL (port 5433)

set -e

echo "🔄 Data Migration: Local PostgreSQL → Docker PostgreSQL"
echo "=================================================="

# Configuration
LOCAL_HOST="localhost"
LOCAL_PORT="5432"
LOCAL_DB="dms_dev"
LOCAL_USER="postgres"

DOCKER_HOST="localhost"
DOCKER_PORT="5433"
DOCKER_DB="dms_prod"
DOCKER_USER="dms_user"
DOCKER_PASS="dms_password"

BACKUP_FILE="/tmp/dms_backup_$(date +%Y%m%d_%H%M%S).sql"

# Step 1: Export from local PostgreSQL
echo ""
echo "📤 Step 1: Exporting data from local PostgreSQL..."
echo "   Database: $LOCAL_DB"
echo "   Port: $LOCAL_PORT"

pg_dump -h $LOCAL_HOST -p $LOCAL_PORT -U $LOCAL_USER -d $LOCAL_DB > $BACKUP_FILE

if [ $? -eq 0 ]; then
    echo "✅ Export successful: $BACKUP_FILE"
    echo "   Size: $(du -h $BACKUP_FILE | cut -f1)"
else
    echo "❌ Export failed!"
    exit 1
fi

# Step 2: Wait for Docker PostgreSQL to be ready
echo ""
echo "⏳ Step 2: Waiting for Docker PostgreSQL to be ready..."

until PGPASSWORD=$DOCKER_PASS psql -h $DOCKER_HOST -p $DOCKER_PORT -U $DOCKER_USER -d postgres -c '\q' 2>/dev/null; do
    echo "   Waiting for PostgreSQL container..."
    sleep 2
done

echo "✅ Docker PostgreSQL is ready!"

# Step 3: Create database if not exists
echo ""
echo "🗄️  Step 3: Creating database if not exists..."

PGPASSWORD=$DOCKER_PASS psql -h $DOCKER_HOST -p $DOCKER_PORT -U $DOCKER_USER -d postgres -c "CREATE DATABASE $DOCKER_DB;" 2>/dev/null || echo "   Database already exists"

# Step 4: Import to Docker PostgreSQL
echo ""
echo "📥 Step 4: Importing data to Docker PostgreSQL..."
echo "   Database: $DOCKER_DB"
echo "   Port: $DOCKER_PORT"

PGPASSWORD=$DOCKER_PASS psql -h $DOCKER_HOST -p $DOCKER_PORT -U $DOCKER_USER -d $DOCKER_DB < $BACKUP_FILE

if [ $? -eq 0 ]; then
    echo "✅ Import successful!"
else
    echo "❌ Import failed!"
    exit 1
fi

# Step 5: Verify migration
echo ""
echo "🔍 Step 5: Verifying migration..."

LOCAL_COUNT=$(psql -h $LOCAL_HOST -p $LOCAL_PORT -U $LOCAL_USER -d $LOCAL_DB -t -c "SELECT COUNT(*) FROM users;")
DOCKER_COUNT=$(PGPASSWORD=$DOCKER_PASS psql -h $DOCKER_HOST -p $DOCKER_PORT -U $DOCKER_USER -d $DOCKER_DB -t -c "SELECT COUNT(*) FROM users;")

echo "   Local users: $LOCAL_COUNT"
echo "   Docker users: $DOCKER_COUNT"

if [ "$LOCAL_COUNT" = "$DOCKER_COUNT" ]; then
    echo "✅ Verification passed! User counts match."
else
    echo "⚠️  Warning: User counts don't match!"
fi

# Step 6: Cleanup
echo ""
echo "🧹 Step 6: Cleanup"
read -p "Keep backup file? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    rm $BACKUP_FILE
    echo "✅ Backup file removed"
else
    echo "📁 Backup saved: $BACKUP_FILE"
fi

echo ""
echo "=================================================="
echo "✅ Migration Complete!"
echo ""
echo "Docker PostgreSQL is now accessible at:"
echo "   Host: localhost"
echo "   Port: 5433"
echo "   Database: $DOCKER_DB"
echo "   User: $DOCKER_USER"
echo "   Password: $DOCKER_PASS"
echo ""
echo "Connection string:"
echo "   postgresql://$DOCKER_USER:$DOCKER_PASS@localhost:5433/$DOCKER_DB"
echo "=================================================="
