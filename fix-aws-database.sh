#!/bin/bash

# Quick fix for AWS PostgreSQL authentication issues

set -e

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

echo -e "${BLUE}=================================${NC}"
echo -e "${BLUE}  AWS Database Quick Fix         ${NC}"
echo -e "${BLUE}=================================${NC}"
echo ""

# Get current user
CURRENT_USER=$(whoami)
print_info "Current system user: $CURRENT_USER"

# Method 1: Fix PostgreSQL authentication
print_info "Setting up PostgreSQL authentication..."

# Create user and database with proper permissions
sudo -u postgres psql << EOF 2>/dev/null || true
-- Create user if doesn't exist
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_user WHERE usename = '$CURRENT_USER') THEN
        CREATE USER $CURRENT_USER WITH SUPERUSER CREATEDB PASSWORD 'postgres';
    ELSE
        ALTER USER $CURRENT_USER WITH SUPERUSER CREATEDB PASSWORD 'postgres';
    END IF;

    -- Also ensure postgres user has password
    ALTER USER postgres PASSWORD 'postgres';
END
\$\$;

-- Create database if doesn't exist
SELECT 'CREATE DATABASE dms_dev OWNER $CURRENT_USER'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'dms_dev')\gexec

-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE dms_dev TO $CURRENT_USER;
GRANT ALL PRIVILEGES ON DATABASE dms_dev TO postgres;
EOF

print_status "PostgreSQL users configured"

# Method 2: Update pg_hba.conf for password authentication
print_info "Updating PostgreSQL authentication method..."

# Find PostgreSQL version and config
PG_VERSION=$(sudo -u postgres psql -t -c "SELECT version();" 2>/dev/null | grep -oP '\d+' | head -1)
PG_CONFIG="/etc/postgresql/$PG_VERSION/main/pg_hba.conf"

if [ -f "$PG_CONFIG" ]; then
    # Backup original
    sudo cp $PG_CONFIG ${PG_CONFIG}.backup.$(date +%s)

    # Update authentication to md5/scram-sha-256
    sudo tee $PG_CONFIG > /dev/null << 'EOF'
# Database administrative login by Unix domain socket
local   all             postgres                                md5
local   all             all                                     md5

# IPv4 local connections:
host    all             all             127.0.0.1/32            md5
# IPv6 local connections:
host    all             all             ::1/128                 md5

# Allow local connections
host    all             all             0.0.0.0/0               md5
EOF

    print_status "PostgreSQL config updated"

    # Restart PostgreSQL
    print_info "Restarting PostgreSQL..."
    sudo systemctl restart postgresql
    sleep 3
    print_status "PostgreSQL restarted"
else
    print_warning "Could not find PostgreSQL config at $PG_CONFIG"
fi

# Method 3: Update .env files with correct credentials
print_info "Updating environment files..."

# Try multiple connection strings
CONNECTION_STRINGS=(
    "postgresql://$CURRENT_USER:postgres@localhost:5432/dms_dev"
    "postgresql://postgres:postgres@localhost:5432/dms_dev"
    "postgresql://$CURRENT_USER:postgres@127.0.0.1:5432/dms_dev"
    "postgresql://postgres:postgres@127.0.0.1:5432/dms_dev"
)

# Test which connection works
WORKING_URL=""
for url in "${CONNECTION_STRINGS[@]}"; do
    print_info "Testing: $url"
    if DATABASE_URL="$url" psql -d dms_dev -c '\q' 2>/dev/null; then
        WORKING_URL="$url"
        print_status "Connection successful!"
        break
    fi
done

if [ -z "$WORKING_URL" ]; then
    print_error "Could not establish database connection"
    print_info "Trying to create a simple connection..."

    # Last resort - create simple user/pass
    sudo -u postgres psql << EOF
ALTER USER postgres PASSWORD 'postgres';
ALTER USER $CURRENT_USER PASSWORD 'postgres';
EOF

    WORKING_URL="postgresql://postgres:postgres@localhost:5432/dms_dev"
fi

# Update .env files
for env_file in .env backend/.env; do
    if [ -f "$env_file" ]; then
        cp $env_file ${env_file}.backup

        # Update or add DATABASE_URL
        if grep -q "^DATABASE_URL=" $env_file; then
            sed -i "s|^DATABASE_URL=.*|DATABASE_URL=$WORKING_URL|" $env_file
        else
            echo "DATABASE_URL=$WORKING_URL" >> $env_file
        fi

        print_status "Updated $env_file"
    fi
done

# Test final connection
print_info "Testing final database connection..."
export DATABASE_URL="$WORKING_URL"

if psql -d dms_dev -c "SELECT version();" > /dev/null 2>&1; then
    print_status "✨ Database connection working!"
    echo ""
    echo "📋 Working connection string:"
    echo "   $WORKING_URL"
    echo ""
    echo "🚀 You can now run:"
    echo "   ./start-with-data.sh"
else
    print_error "Database connection still failing"
    echo ""
    echo "Try manual fix:"
    echo "1. sudo -u postgres psql"
    echo "2. ALTER USER postgres PASSWORD 'postgres';"
    echo "3. CREATE USER $CURRENT_USER WITH SUPERUSER PASSWORD 'postgres';"
    echo "4. CREATE DATABASE dms_dev OWNER $CURRENT_USER;"
    echo "5. \q"
    echo ""
    echo "Then update .env with:"
    echo "DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dms_dev"
fi

echo ""
print_info "If still having issues, check PostgreSQL logs:"
echo "   sudo journalctl -xe | grep postgres"
echo "   sudo tail -f /var/log/postgresql/*.log"