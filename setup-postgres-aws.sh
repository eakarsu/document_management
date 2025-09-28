#!/bin/bash

# PostgreSQL Setup Script for AWS/Ubuntu
# Run this before start.sh or start-with-data.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_header() {
    echo -e "${BLUE}==================================${NC}"
    echo -e "${BLUE}  PostgreSQL Setup for AWS/Ubuntu ${NC}"
    echo -e "${BLUE}==================================${NC}"
}

print_header

# Check if running as root
if [ "$EUID" -eq 0 ]; then
   print_error "Please run without sudo (script will use sudo when needed)"
   exit 1
fi

# Get current username
CURRENT_USER=$(whoami)
print_info "Setting up PostgreSQL for user: $CURRENT_USER"

# Install PostgreSQL if not installed
if ! command -v psql &> /dev/null; then
    print_info "Installing PostgreSQL..."
    sudo apt-get update
    sudo apt-get install -y postgresql postgresql-contrib
    print_status "PostgreSQL installed"
else
    print_status "PostgreSQL is already installed"
fi

# Start PostgreSQL service
print_info "Starting PostgreSQL service..."
sudo systemctl start postgresql
sudo systemctl enable postgresql
print_status "PostgreSQL service started and enabled"

# Create PostgreSQL user for current system user
print_info "Creating PostgreSQL user '$CURRENT_USER'..."
sudo -u postgres psql << EOF
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_user WHERE usename = '$CURRENT_USER') THEN
        CREATE USER $CURRENT_USER WITH SUPERUSER CREATEDB CREATEROLE PASSWORD 'postgres';
        RAISE NOTICE 'User $CURRENT_USER created';
    ELSE
        ALTER USER $CURRENT_USER WITH SUPERUSER CREATEDB CREATEROLE PASSWORD 'postgres';
        RAISE NOTICE 'User $CURRENT_USER updated';
    END IF;
END
\$\$;
EOF
print_status "PostgreSQL user '$CURRENT_USER' configured"

# Create postgres user if it doesn't exist (for compatibility)
print_info "Ensuring 'postgres' user exists..."
sudo -u postgres psql << EOF
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_user WHERE usename = 'postgres') THEN
        ALTER USER postgres PASSWORD 'postgres';
    END IF;
END
\$\$;
EOF
print_status "User 'postgres' configured"

# Create database if it doesn't exist
print_info "Creating database 'dms_dev'..."
sudo -u postgres createdb dms_dev 2>/dev/null || echo "Database dms_dev already exists"

# Grant all privileges
sudo -u postgres psql << EOF
GRANT ALL PRIVILEGES ON DATABASE dms_dev TO $CURRENT_USER;
GRANT ALL PRIVILEGES ON DATABASE dms_dev TO postgres;
EOF
print_status "Database 'dms_dev' ready with proper permissions"

# Update PostgreSQL configuration for local connections
print_info "Configuring PostgreSQL for local connections..."
PG_VERSION=$(sudo -u postgres psql -t -c "SELECT version();" | grep -oP '\d+\.\d+' | head -1 | cut -d. -f1)
PG_CONFIG_DIR="/etc/postgresql/$PG_VERSION/main"

if [ -d "$PG_CONFIG_DIR" ]; then
    # Backup original configs
    sudo cp $PG_CONFIG_DIR/postgresql.conf $PG_CONFIG_DIR/postgresql.conf.backup 2>/dev/null || true
    sudo cp $PG_CONFIG_DIR/pg_hba.conf $PG_CONFIG_DIR/pg_hba.conf.backup 2>/dev/null || true

    # Update pg_hba.conf for local authentication
    sudo tee $PG_CONFIG_DIR/pg_hba.conf > /dev/null << 'EOF'
# Database administrative login by Unix domain socket
local   all             postgres                                peer
local   all             all                                     md5
host    all             all             127.0.0.1/32            md5
host    all             all             ::1/128                 md5
# Allow local network connections (optional, for Docker)
host    all             all             172.17.0.0/16           md5
host    all             all             172.18.0.0/16           md5
EOF

    # Ensure PostgreSQL listens on localhost
    sudo sed -i "s/#listen_addresses = 'localhost'/listen_addresses = 'localhost'/" $PG_CONFIG_DIR/postgresql.conf

    print_status "PostgreSQL configuration updated"
else
    print_info "PostgreSQL config directory not found at expected location, skipping config update"
fi

# Restart PostgreSQL to apply changes
print_info "Restarting PostgreSQL..."
sudo systemctl restart postgresql
sleep 3
print_status "PostgreSQL restarted"

# Test connection
print_info "Testing database connection..."
if PGPASSWORD=postgres psql -U $CURRENT_USER -d dms_dev -c '\q' 2>/dev/null; then
    print_status "Database connection successful!"
else
    # Try with postgres user
    if PGPASSWORD=postgres psql -U postgres -d dms_dev -c '\q' 2>/dev/null; then
        print_status "Database connection successful with postgres user!"
    else
        print_error "Could not connect to database. You may need to check logs: sudo journalctl -u postgresql"
    fi
fi

# Update .env file with correct database URL
if [ -f .env ]; then
    print_info "Updating .env with database configuration..."
    # Backup original .env
    cp .env .env.backup

    # Update DATABASE_URL
    if grep -q "^DATABASE_URL=" .env; then
        sed -i "s|^DATABASE_URL=.*|DATABASE_URL=postgresql://$CURRENT_USER:postgres@localhost:5432/dms_dev|" .env
    else
        echo "DATABASE_URL=postgresql://$CURRENT_USER:postgres@localhost:5432/dms_dev" >> .env
    fi

    print_status ".env updated with database connection"
else
    print_info "Creating .env with database configuration..."
    cat > .env << EOF
# Database Configuration
DATABASE_URL=postgresql://$CURRENT_USER:postgres@localhost:5432/dms_dev

# Add your other environment variables below
NODE_ENV=development
PORT=4000
FRONTEND_URL=http://localhost:3000
EOF
    print_status ".env created with database connection"
fi

echo ""
print_status "PostgreSQL setup complete!"
echo ""
echo "📋 Connection Details:"
echo "   Database: dms_dev"
echo "   User: $CURRENT_USER"
echo "   Password: postgres"
echo "   Connection: postgresql://$CURRENT_USER:postgres@localhost:5432/dms_dev"
echo ""
echo "🚀 You can now run:"
echo "   ./start.sh           # For fresh install with demo data"
echo "   ./start-with-data.sh # To restore from backup"
echo ""
echo "🔧 PostgreSQL Commands:"
echo "   sudo systemctl status postgresql  # Check status"
echo "   sudo -u postgres psql            # Access PostgreSQL as superuser"
echo "   psql -d dms_dev                  # Connect to database"
echo ""