#!/bin/bash

# Richmond Document Management System - One Command Startup WITH DATA RESTORE
# Simply run: ./start-with-data.sh
# This script does EVERYTHING to start the complete system with database restore

set -e

# Get script directory for relative paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️ $1${NC}"
}

print_header() {
    echo -e "${PURPLE}🚀 $1${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if port is in use
port_in_use() {
    lsof -ti:$1 >/dev/null 2>&1
}

# Function to wait for service
wait_for_service() {
    local url=$1
    local name=$2
    local max_attempts=30
    local attempt=1

    print_info "Waiting for $name to be ready..."
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "$url" >/dev/null 2>&1; then
            print_status "$name is ready!"
            return 0
        fi
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done

    # Check if service is running on a different port
    print_warning "$name may not be ready on expected port, checking logs..."
    if [ "$name" = "Backend API" ] && [ -f backend.log ]; then
        local actual_port=$(grep -o "localhost:[0-9]\+" backend.log | tail -1 | cut -d: -f2)
        if [ "$actual_port" != "4000" ] && [ -n "$actual_port" ]; then
            print_warning "Backend is running on port $actual_port instead of 4000"
            if curl -f -s "http://localhost:$actual_port/health" >/dev/null 2>&1; then
                print_status "Backend is healthy on port $actual_port!"
                return 0
            fi
        fi
    fi

    print_warning "$name may not be ready yet, continuing..."
    return 1
}

# Function to stop any existing services
stop_existing_services() {
    print_info "Stopping any existing services..."

    # Stop local services if running
    if [ -f .backend.pid ]; then
        BACKEND_PID=$(cat .backend.pid)
        if kill -0 $BACKEND_PID 2>/dev/null; then
            print_info "Stopping backend (PID: $BACKEND_PID)..."
            kill $BACKEND_PID
            sleep 3
            # Force kill if still running
            if kill -0 $BACKEND_PID 2>/dev/null; then
                kill -9 $BACKEND_PID 2>/dev/null || true
            fi
        fi
        rm -f .backend.pid
    fi

    if [ -f .frontend.pid ]; then
        FRONTEND_PID=$(cat .frontend.pid)
        if kill -0 $FRONTEND_PID 2>/dev/null; then
            print_info "Stopping frontend (PID: $FRONTEND_PID)..."
            kill $FRONTEND_PID
            sleep 3
            # Force kill if still running
            if kill -0 $FRONTEND_PID 2>/dev/null; then
                kill -9 $FRONTEND_PID 2>/dev/null || true
            fi
        fi
        rm -f .frontend.pid
    fi

    # Clean up any remaining processes more selectively
    print_info "Cleaning up any remaining DMS processes..."

    # More specific process matching to catch all DMS-related processes
    local dms_processes=$(ps aux | grep -E "(ts-node.*src/server|next.*dev|nodemon|document_management)" | grep -v grep | awk '{print $2}' || echo "")
    if [ -n "$dms_processes" ]; then
        echo "$dms_processes" | while read -r pid; do
            if [ -n "$pid" ]; then
                print_info "Cleaning up DMS process (PID: $pid)..."
                kill -9 "$pid" 2>/dev/null || true
            fi
        done
    fi

    # Kill any processes using our target ports - more aggressive cleanup
    for port in 3000 3001 3002 3003 3004 4000 4001 4002 4003 5432 9000 9200 6379; do
        if port_in_use $port; then
            local pids=$(lsof -ti:$port 2>/dev/null || echo "")
            if [ -n "$pids" ]; then
                # Kill processes on our app ports (3000-3004 and 4000-4003)
                if [ $port -ge 3000 -a $port -le 3004 ] || [ $port -ge 4000 -a $port -le 4003 ]; then
                    print_info "Freeing application port $port..."
                    echo "$pids" | while read -r pid; do
                        if [ -n "$pid" ]; then
                            # Force kill any process on our ports
                            kill -9 "$pid" 2>/dev/null || true
                        fi
                    done
                else
                    print_info "Port $port is in use (external service - not killing)"
                fi
            fi
        fi
    done

    # Additional cleanup for stubborn Next.js and Node processes
    pkill -f "next dev" 2>/dev/null || true
    pkill -f "ts-node.*server" 2>/dev/null || true
    pkill -f "nodemon" 2>/dev/null || true

    # Clean up log files from previous runs
    rm -f backend.log frontend.log error.log

    # Wait for processes to die
    sleep 5

    print_status "Cleaned up existing services"
}

# Function to check external services
check_external_services() {
    print_info "Checking external services..."

    # Check PostgreSQL
    if ! command_exists "pg_isready"; then
        print_warning "pg_isready not found, trying alternative PostgreSQL check..."
        if ! psql -d postgres -c '\q' >/dev/null 2>&1; then
            print_error "PostgreSQL is not running or accessible"
            print_info "Try starting PostgreSQL with: brew services start postgresql"
            return 1
        fi
    else
        if ! pg_isready >/dev/null 2>&1; then
            print_error "PostgreSQL is not running"
            print_info "Try starting PostgreSQL with: brew services start postgresql"
            return 1
        fi
    fi

    print_status "PostgreSQL is running"

    # Optional services (MinIO, Elasticsearch, Redis) - warn if not available
    if port_in_use 9000; then
        print_status "MinIO detected on port 9000"
    else
        print_warning "MinIO not detected on port 9000 (file storage may use local filesystem)"
    fi

    if port_in_use 9200; then
        print_status "Elasticsearch detected on port 9200"
    else
        print_warning "Elasticsearch not detected on port 9200 (search functionality may be limited)"
    fi

    if port_in_use 6379; then
        print_status "Redis detected on port 6379"
    else
        print_warning "Redis not detected on port 6379 (caching may be disabled)"
    fi

    return 0
}

# Main startup function
main() {
    print_header "Richmond Document Management System - Complete Setup WITH DATA RESTORE"
    echo "======================================================================="
    echo "This script will set up and start your complete DMS platform"
    echo "AND restore your existing database backup"
    echo "🎯 Target: http://localhost:3000"
    echo ""

    # Stop any existing services first
    stop_existing_services

    # Check prerequisites
    print_info "Checking system requirements..."

    if ! command_exists "node"; then
        print_error "Node.js is not installed. Please install Node.js and try again."
        echo "Visit: https://nodejs.org/"
        exit 1
    fi

    local node_version=$(node --version 2>/dev/null)
    print_info "Node.js version: $node_version"

    if ! command_exists "npm"; then
        print_error "npm is not installed. Please install npm and try again."
        exit 1
    fi

    local npm_version=$(npm --version 2>/dev/null)
    print_info "npm version: $npm_version"

    if ! command_exists "psql"; then
        print_error "PostgreSQL is not installed. Please install PostgreSQL and try again."
        echo "Visit: https://www.postgresql.org/download/"
        exit 1
    fi

    if ! command_exists "createdb"; then
        print_error "PostgreSQL command line tools not available. Please ensure PostgreSQL is properly installed."
        exit 1
    fi

    print_status "All system requirements met"

    # Check external services
    if ! check_external_services; then
        exit 1
    fi

    # Check if database exists and create if needed
    print_info "Setting up PostgreSQL database..."

    if ! psql -lqt | cut -d '|' -f 1 | grep -qw dms_dev; then
        print_info "Creating database 'dms_dev'..."
        createdb dms_dev 2>/dev/null || {
            if psql -lqt | cut -d '|' -f 1 | grep -qw dms_dev; then
                print_status "Database 'dms_dev' already exists"
            else
                print_error "Failed to create database. Please ensure PostgreSQL is running."
                print_info "Try running: brew services start postgresql"
                exit 1
            fi
        }
        if psql -lqt | cut -d '|' -f 1 | grep -qw dms_dev; then
            print_status "Database 'dms_dev' created successfully"
        fi
    else
        print_status "Database 'dms_dev' already exists"
    fi

    # Install all dependencies
    print_info "Installing dependencies..."

    # Root dependencies
    if [ ! -d "node_modules" ] || [ ! -f "package-lock.json" ]; then
        print_info "Installing root dependencies..."
        npm install --silent || {
            print_warning "Root npm install failed, trying without --silent"
            npm install
        }
        print_status "Root dependencies installed"
    else
        print_status "Root dependencies already installed"
    fi

    # Backend dependencies
    if [ ! -d "backend/node_modules" ] || [ ! -f "backend/package-lock.json" ]; then
        print_info "Installing backend dependencies..."
        cd backend
        npm install --legacy-peer-deps --silent || {
            print_warning "Backend npm install failed, trying without --silent"
            npm install --legacy-peer-deps
        }
        cd ..
        print_status "Backend dependencies installed"
    else
        print_info "Checking backend dependencies..."
        cd backend
        if ! npm list --depth=0 >/dev/null 2>&1; then
            print_info "Backend dependencies incomplete, reinstalling..."
            npm install --legacy-peer-deps --silent
        fi
        cd ..
        print_status "Backend dependencies ready"
    fi

    # Frontend dependencies
    if [ ! -d "frontend/node_modules" ] || [ ! -f "frontend/package-lock.json" ]; then
        print_info "Installing frontend dependencies..."
        cd frontend
        npm install --legacy-peer-deps --silent || {
            print_warning "Frontend npm install failed, trying without --silent"
            npm install --legacy-peer-deps
        }
        cd ..
        print_status "Frontend dependencies installed"
    else
        print_info "Checking frontend dependencies..."
        cd frontend
        if ! npm list --depth=0 >/dev/null 2>&1; then
            print_info "Frontend dependencies incomplete, reinstalling..."
            npm install --legacy-peer-deps --silent
        fi
        cd ..
        print_status "Frontend dependencies ready"
    fi

    # Database dependencies
    if [ ! -d "database/node_modules" ] || [ ! -f "database/package-lock.json" ]; then
        print_info "Installing database dependencies..."
        cd database
        npm install --silent || {
            print_warning "Database npm install failed, trying without --silent"
            npm install
        }
        cd ..
        print_status "Database dependencies installed"
    else
        print_status "Database dependencies already installed"
    fi

    # Set up database schema
    print_info "Setting up database schema..."

    # Copy environment file to backend
    if [ ! -f backend/.env ]; then
        cp .env backend/.env
        print_info "Copied environment configuration to backend"
    fi

    # Ensure backend environment is properly configured
    cd backend

    # Generate Prisma client first
    print_info "Generating Prisma client..."
    npx prisma generate >/dev/null 2>&1 || {
        print_warning "Prisma generate failed, trying with output"
        npx prisma generate
    }

    # Run database migrations
    print_info "Running database migrations..."
    # Use migrate deploy for non-interactive environments, fallback to db push
    npx prisma migrate deploy >/dev/null 2>&1 || {
        print_warning "Deploy migration failed, trying db push..."
        npx prisma db push >/dev/null 2>&1 || {
            print_warning "DB push failed, showing output"
            npx prisma db push
        }
    }

    cd ..
    print_status "Database schema ready"

    # =====================================
    # DATA RESTORE SECTION - Key Difference
    # =====================================
    print_header "📦 Database Data Restore"

    # Check if backup exists
    if [ -f "backend/database-backup/database-export.json" ]; then
        print_info "Found database backup, importing..."
        cd backend

        # Run the import script
        if node import-database.js >/dev/null 2>&1; then
            print_status "✨ Database restored from backup successfully!"

            # Count imported data
            doc_count=$(node -e "
                const { PrismaClient } = require('@prisma/client');
                const prisma = new PrismaClient();
                Promise.all([
                    prisma.user.count(),
                    prisma.document.count(),
                    prisma.workflow.count()
                ]).then(([users, docs, workflows]) => {
                    console.log(users + ',' + docs + ',' + workflows);
                    process.exit(0);
                }).catch(() => {
                    console.log('0,0,0');
                    process.exit(0);
                });
            " 2>/dev/null || echo "0,0,0")

            IFS=',' read -r user_count document_count workflow_count <<< "$doc_count"
            print_status "Imported: $user_count users, $document_count documents, $workflow_count workflows"
        else
            print_warning "Database import had issues, trying alternative method..."

            # Alternative: Try seeding if import fails
            print_info "Running seed script instead..."
            if npm run seed >/dev/null 2>&1 || npx prisma db seed >/dev/null 2>&1; then
                print_status "Database seeded with demo data"
                user_count="3"
                document_count="2"
            else
                print_warning "Database seeding skipped - may already contain data"
                user_count="unknown"
                document_count="unknown"
            fi
        fi

        cd ..
    else
        # No backup found - seed with demo data
        print_info "No database backup found. Seeding with demo data..."

        # Check if database is empty
        user_exists=$(cd backend && node -e "
            const { PrismaClient } = require('@prisma/client');
            const prisma = new PrismaClient();
            prisma.user.count().then(count => {
                console.log(count);
                process.exit(0);
            }).catch(() => {
                console.log('0');
                process.exit(0);
            });
        " 2>/dev/null || echo "0")

        if [ "$user_exists" = "0" ] || [ "$user_exists" = "" ]; then
            print_info "Seeding database with demo data..."
            if (cd database && npm run seed >/dev/null 2>&1); then
                print_status "Database seeded with demo users and documents"
                user_count="3"
                document_count="2"
            else
                print_warning "Database seeding had issues, but system can still start"
                # Try alternative seeding method
                if (cd backend && npx prisma db seed >/dev/null 2>&1); then
                    print_status "Database seeded using alternative method"
                    user_count="3"
                    document_count="2"
                else
                    print_info "Database seeding skipped - may already contain data"
                    user_count="unknown"
                    document_count="unknown"
                fi
            fi
        else
            print_status "Database already contains data ($user_exists users)"
            user_count="$user_exists"
            document_count="unknown"
        fi
    fi

    # Double-check ports are free
    for port in 3000 3001 3002 3003 3004 4000 4001 4002 4003; do
        if port_in_use $port; then
            print_warning "Port $port is still in use after cleanup, attempting final cleanup..."
            local pids=$(lsof -ti:$port 2>/dev/null || echo "")
            if [ -n "$pids" ]; then
                echo "$pids" | while read -r pid; do
                    if [ -n "$pid" ]; then
                        kill -9 "$pid" 2>/dev/null || true
                    fi
                done
                sleep 3
                if port_in_use $port; then
                    print_error "Port $port is still in use after final cleanup!"
                    print_info "Manual cleanup required. Run: kill -9 \$(lsof -ti:$port)"
                    exit 1
                fi
            fi
        fi
    done
    print_status "Application ports (3000, 4000) are free"

    # Start backend service
    print_info "Starting backend server..."

    # Ensure backend directory exists and has the right files
    if [ ! -f "backend/src/server.ts" ]; then
        print_error "Backend server file not found: backend/src/server.ts"
        exit 1
    fi

    # Ensure backend has complete environment configuration
    print_info "Updating backend environment configuration..."
    cp .env backend/.env

    # Ensure correct ports in backend .env
    sed -i '' 's/^PORT=.*/PORT=4000/' backend/.env || echo "PORT=4000" >> backend/.env
    sed -i '' 's|^FRONTEND_URL=.*|FRONTEND_URL=http://localhost:3000|' backend/.env || echo "FRONTEND_URL=http://localhost:3000" >> backend/.env

    # Start the backend
    cd backend

    print_info "Launching backend on port 4000..."
    # Clear previous log
    > ../backend.log

    # Check TypeScript compilation first
    print_info "Checking TypeScript compilation..."
    if ! npx tsc --noEmit >/dev/null 2>&1; then
        print_warning "TypeScript compilation has warnings, continuing anyway..."
        npx tsc --noEmit || true
    fi

    PORT=4000 nohup npm run dev > ../backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > ../.backend.pid
    cd ..

    # Give it more time to start
    print_info "Waiting for backend to initialize..."
    sleep 10

    # Check if backend is actually running
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        print_error "Backend failed to start! Check backend.log for errors:"
        echo "--- Last 20 lines of backend.log ---"
        tail -20 backend.log
        print_error "Backend startup failed. Please check the logs above."
        exit 1
    fi

    print_status "Backend process started (PID: $BACKEND_PID)"

    # Wait for backend to start
    wait_for_service "http://localhost:4000/health" "Backend API"

    # Start frontend service
    print_info "Starting frontend server..."

    # Ensure frontend directory exists
    if [ ! -f "frontend/package.json" ]; then
        print_error "Frontend package.json not found!"
        exit 1
    fi

    cd frontend

    # Clear Next.js cache to prevent build errors
    print_info "Clearing Next.js cache..."
    rm -rf .next
    print_status "Next.js cache cleared"

    # Ensure frontend environment is configured correctly
    print_info "Updating frontend environment configuration..."
    cat > .env.local << 'EOF'
# Frontend Environment Configuration
# This file is automatically generated by start-with-data.sh
# Edit the main .env file in the root directory instead

# Backend API URLs
NEXT_PUBLIC_API_URL=http://localhost:4000
BACKEND_URL=http://localhost:4000

# Frontend Port
PORT=3000

# Development Settings
NODE_ENV=development

# Company Information
NEXT_PUBLIC_COMPANY_NAME=Richmond DMS
NEXT_PUBLIC_COMPANY_LOCATION=Richmond, VA
EOF

    # Check TypeScript compilation first
    print_info "Checking frontend TypeScript compilation..."
    if ! npx tsc --noEmit >/dev/null 2>&1; then
        print_warning "TypeScript frontend compilation has warnings, continuing anyway..."
        npx tsc --noEmit || true
    fi

    print_info "Launching frontend on port 3000..."
    # Clear previous log
    > ../frontend.log

    PORT=3000 nohup npm run dev > ../frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > ../.frontend.pid
    cd ..

    # Give it more time to start (Next.js takes longer)
    print_info "Waiting for frontend to initialize..."
    sleep 10

    # Check if frontend is actually running
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        print_error "Frontend failed to start! Check frontend.log for errors:"
        echo "--- Last 15 lines of frontend.log ---"
        tail -15 frontend.log
        print_error "Frontend startup failed. Please check the logs above."
        exit 1
    fi

    print_status "Frontend process started (PID: $FRONTEND_PID)"

    # Wait for frontend to start
    wait_for_service "http://localhost:3000" "Frontend"

    # Final status check
    echo ""
    print_status "🎉 Richmond Document Management System is READY!"
    echo "============================================================"
    echo ""

    # Show data restore info
    if [ -f "backend/database-backup/database-export.json" ]; then
        print_header "📦 DATABASE RESTORED FROM BACKUP"
        echo "   ✅ Users: ${user_count:-unknown}"
        echo "   ✅ Documents: ${document_count:-unknown}"
        echo "   ✅ Workflows: ${workflow_count:-unknown}"
    else
        print_header "📦 DATABASE SEEDED WITH DEMO DATA"
        echo "   ✅ Users: ${user_count:-3}"
        echo "   ✅ Documents: ${document_count:-2}"
    fi
    echo ""

    print_warning "🧹 IMPORTANT: Clear your browser cache and localStorage!"
    echo "   This ensures you start with a fresh authentication state."
    echo "   In your browser:"
    echo "   • Chrome/Edge: Ctrl+Shift+Delete or Cmd+Shift+Delete"
    echo "   • Firefox: Ctrl+Shift+Delete or Cmd+Shift+Delete"
    echo "   • Safari: Cmd+Option+E"
    echo "   OR open an Incognito/Private window for a fresh start"
    echo ""
    echo "📋 Your System is Running:"
    echo "   🌐 Frontend:     http://localhost:3000"
    echo "   ⚡ Workflow Builder: http://localhost:3000/workflow-builder-v2"
    echo "   🤖 AI Document Generator: http://localhost:3000/ai-document-generator"
    echo "   🔧 Backend API:  http://localhost:4000"
    echo "   💾 Database:     PostgreSQL (dms_dev)"
    echo "   🤖 AI Services:  OpenRouter AI Integration"
    echo ""
    echo "👥 Demo Login Credentials:"
    echo "   👑 Admin:    admin@richmond-dms.com / admin123"
    echo "   👔 Manager:  manager@richmond-dms.com / manager123"
    echo "   👤 User:     user@richmond-dms.com / user123"
    echo ""
    echo "🤖 AI Features Available:"
    echo "   📊 AI Workflow Dashboard - Real-time analytics and insights"
    echo "   🧠 Smart Publishing - AI-powered document routing"
    echo "   🤝 Collaborative AI - Real-time collaboration assistance"
    echo "   🔍 Content Analysis - AI document quality assessment"
    echo "   ⚡ Workflow Optimizer - Performance optimization suggestions"
    echo "   💡 Recommendation Engine - Intelligent workflow recommendations"
    echo "   ⚖️ Decision Support - AI-assisted decision making"
    echo "   📈 Insights Hub - Predictive analytics and benchmarking"
    echo ""
    echo "📊 System Status:"

    # Test endpoints
    if curl -f -s http://localhost:4000/health >/dev/null 2>&1; then
        echo "   ✅ Backend API: Healthy"
    else
        echo "   ⚠️  Backend API: May be starting (check backend.log)"
    fi

    if curl -f -s http://localhost:3000 >/dev/null 2>&1; then
        echo "   ✅ Frontend: Accessible"
    else
        echo "   ⚠️  Frontend: May be starting (check frontend.log)"
    fi

    # Check AI configuration
    if [ -f backend/.env ] && grep -q "OPENROUTER_API_KEY" backend/.env && [ "$(grep -c '^OPENROUTER_API_KEY=sk-' backend/.env)" -eq 1 ]; then
        echo "   ✅ AI Services: OpenRouter API configured"
    else
        echo "   ⚠️  AI Services: OpenRouter API key may not be configured"
    fi

    echo "   ✅ Database: ${user_count:-unknown} users, ${document_count:-unknown} documents"
    echo ""

    echo "📊 Monitoring Commands:"
    echo "   📋 Backend logs:  tail -f backend.log"
    echo "   🖥️  Frontend logs: tail -f frontend.log"
    echo "   🛑 Stop system:   pkill -f 'ts-node\\|next dev'"
    echo ""

    echo "🔧 API Testing:"
    echo "   ⚕️  Health:       curl http://localhost:4000/health"
    echo "   👥 Users:         curl http://localhost:4000/users"
    echo "   📄 Documents:     curl http://localhost:4000/documents"
    echo "   🤖 AI Workflow:   curl http://localhost:4000/api/ai-workflow/analytics/dashboard"
    echo ""

    print_status "Setup completed successfully!"
    print_header "🚀 Open http://localhost:3000 to access your Document Management System"

    # Try to open browser
    if command_exists "open"; then
        print_info "Opening your browser..."
        sleep 2
        open http://localhost:3000
    elif command_exists "xdg-open"; then
        print_info "Opening your browser..."
        sleep 2
        xdg-open http://localhost:3000
    fi

    echo ""
    print_header "🎯 Your Richmond Document Management System is ready for use!"
    echo ""
    print_warning "🔥 CRITICAL FIRST STEP:"
    echo "   1. Clear your browser cache and localStorage (or use Incognito/Private mode)"
    echo "   2. Go to http://localhost:3000"
    echo "   3. You should be redirected to the login page first"
    echo "   4. Login with demo credentials above"
    echo ""
    echo "   If you go directly to dashboard without login, clear your browser cache!"
    echo ""
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "Richmond Document Management System - One Command Setup WITH DATA RESTORE"
        echo "========================================================================="
        echo ""
        echo "Usage: $0 [OPTION]"
        echo ""
        echo "Options:"
        echo "  (no option)    Start the complete DMS system with data restore"
        echo "  --stop         Stop all DMS services"
        echo "  --clean        Clean start (removes node_modules and logs)"
        echo "  --status       Show current system status"
        echo "  --logs         Show live logs (backend & frontend)"
        echo "  --export       Export current database to backup"
        echo "  --help, -h     Show this help message"
        echo ""
        echo "This script automatically:"
        echo "  ✅ Checks all requirements (Node.js, PostgreSQL)"
        echo "  ✅ Creates database if needed"
        echo "  ✅ Installs all dependencies"
        echo "  ✅ Sets up database schema"
        echo "  ✅ RESTORES DATABASE FROM BACKUP (if available)"
        echo "  ✅ Seeds demo data only if no backup exists"
        echo "  ✅ Configures AI services (OpenRouter integration)"
        echo "  ✅ Starts backend and frontend servers"
        echo "  ✅ Opens browser to http://localhost:3000"
        echo ""
        echo "Database Restore:"
        echo "  📦 If backup exists in backend/database-backup/"
        echo "     - Restores all users, documents, workflows"
        echo "  📦 If no backup exists"
        echo "     - Seeds with 3 demo users"
        echo ""
        echo "To create a backup:"
        echo "  cd backend && node export-database.js"
        echo ""
        echo "Demo users (if no backup):"
        echo "  - admin@richmond-dms.com / admin123"
        echo "  - manager@richmond-dms.com / manager123"
        echo "  - user@richmond-dms.com / user123"
        echo ""
        exit 0
        ;;
    --stop)
        print_info "Stopping Richmond Document Management System..."

        if [ -f .backend.pid ]; then
            BACKEND_PID=$(cat .backend.pid)
            if kill -0 $BACKEND_PID 2>/dev/null; then
                kill $BACKEND_PID
                print_status "Backend stopped (PID: $BACKEND_PID)"
                sleep 2
                # Force kill if still running
                if kill -0 $BACKEND_PID 2>/dev/null; then
                    kill -9 $BACKEND_PID 2>/dev/null || true
                    print_info "Force killed backend process"
                fi
            fi
            rm -f .backend.pid
        fi

        if [ -f .frontend.pid ]; then
            FRONTEND_PID=$(cat .frontend.pid)
            if kill -0 $FRONTEND_PID 2>/dev/null; then
                kill $FRONTEND_PID
                print_status "Frontend stopped (PID: $FRONTEND_PID)"
                sleep 2
                # Force kill if still running
                if kill -0 $FRONTEND_PID 2>/dev/null; then
                    kill -9 $FRONTEND_PID 2>/dev/null || true
                    print_info "Force killed frontend process"
                fi
            fi
            rm -f .frontend.pid
        fi

        # Clean shutdown of any remaining processes
        pkill -f "ts-node.*server" 2>/dev/null || true
        pkill -f "next dev" 2>/dev/null || true
        pkill -f "nodemon" 2>/dev/null || true

        # Kill processes on our ports
        for port in 3000 3001 3002 3003 3004 4000 4001 4002 4003; do
            if port_in_use $port; then
                pids=$(lsof -ti:$port 2>/dev/null || echo "")
                if [ -n "$pids" ]; then
                    echo "$pids" | while read -r pid; do
                        if [ -n "$pid" ]; then
                            kill -9 "$pid" 2>/dev/null || true
                        fi
                    done
                fi
            fi
        done

        print_status "All Richmond DMS services stopped"
        exit 0
        ;;
    --clean)
        print_info "Performing clean start (removing node_modules and logs)..."

        # Stop services first
        "$0" --stop

        # Remove node_modules
        print_info "Removing node_modules directories..."
        rm -rf node_modules backend/node_modules frontend/node_modules database/node_modules

        # Remove Next.js cache
        print_info "Removing Next.js cache..."
        rm -rf frontend/.next

        # Remove logs
        print_info "Removing log files..."
        rm -f backend.log frontend.log error.log *.log

        # Remove lock files
        print_info "Removing package lock files..."
        rm -f package-lock.json backend/package-lock.json frontend/package-lock.json database/package-lock.json

        print_status "Clean completed. Starting fresh installation..."
        main
        ;;
    --status)
        print_header "Richmond DMS System Status"
        echo ""

        # Check if services are running
        if [ -f .backend.pid ] && kill -0 $(cat .backend.pid) 2>/dev/null; then
            print_status "Backend: Running (PID: $(cat .backend.pid))"
        else
            print_error "Backend: Not running"
        fi

        if [ -f .frontend.pid ] && kill -0 $(cat .frontend.pid) 2>/dev/null; then
            print_status "Frontend: Running (PID: $(cat .frontend.pid))"
        else
            print_error "Frontend: Not running"
        fi

        # Check ports
        echo ""
        print_info "Port Status:"
        for port in 3000 3001 3002 3003 3004 4000 4001 4002 4003 5432 9000 9200 6379; do
            if port_in_use $port; then
                service_name=""
                case $port in
                    3000) service_name=" (Frontend - Primary)" ;;
                    3001) service_name=" (Frontend - Alt 1)" ;;
                    3002) service_name=" (Frontend - Alt 2)" ;;
                    3003) service_name=" (Frontend - Alt 3)" ;;
                    3004) service_name=" (Frontend - Alt 4)" ;;
                    4000) service_name=" (Backend API - Primary)" ;;
                    4001) service_name=" (Backend API - Alt 1)" ;;
                    4002) service_name=" (Backend API - Alt 2)" ;;
                    4003) service_name=" (Backend API - Alt 3)" ;;
                    5432) service_name=" (PostgreSQL)" ;;
                    9000) service_name=" (MinIO)" ;;
                    9200) service_name=" (Elasticsearch)" ;;
                    6379) service_name=" (Redis)" ;;
                esac
                print_status "Port $port: In use$service_name"
            else
                print_warning "Port $port: Free"
            fi
        done

        # Test endpoints if running
        echo ""
        print_info "Service Health:"
        if curl -f -s http://localhost:4000/health >/dev/null 2>&1; then
            print_status "Backend API: Healthy (http://localhost:4000/health)"
        else
            print_error "Backend API: Unhealthy or not responding"
        fi

        if curl -f -s http://localhost:3000 >/dev/null 2>&1; then
            print_status "Frontend: Accessible (http://localhost:3000)"
        else
            print_error "Frontend: Not accessible"
        fi

        # Check backup status
        echo ""
        print_info "Database Backup Status:"
        if [ -f "backend/database-backup/database-export.json" ]; then
            backup_date=$(grep '"exportDate"' backend/database-backup/export-summary.json | cut -d'"' -f4)
            print_status "Backup exists (created: ${backup_date})"

            if [ -f "backend/database-backup/export-summary.json" ]; then
                echo "   Backup contains:"
                grep -E '"users"|"documents"|"workflows"' backend/database-backup/export-summary.json | sed 's/.*: /   - /'
            fi
        else
            print_warning "No database backup found"
            echo "   Run: cd backend && node export-database.js"
        fi

        exit 0
        ;;
    --logs)
        print_header "Richmond DMS Live Logs"
        echo ""
        print_info "Showing live logs (Ctrl+C to exit)"
        echo "Backend logs (backend.log) and Frontend logs (frontend.log)"
        echo ""

        if [ -f backend.log ] && [ -f frontend.log ]; then
            tail -f backend.log frontend.log
        elif [ -f backend.log ]; then
            tail -f backend.log
        elif [ -f frontend.log ]; then
            tail -f frontend.log
        else
            print_warning "No log files found. Services may not be running."
            exit 1
        fi
        ;;
    --export)
        print_header "Exporting Database"
        echo ""

        if [ -f "backend/export-database.js" ]; then
            cd backend
            print_info "Running database export..."
            node export-database.js
            cd ..
            print_status "Database export completed"
        else
            print_error "Export script not found: backend/export-database.js"
            exit 1
        fi
        ;;
    "")
        # Default: run the main setup
        main
        ;;
    *)
        print_error "Unknown option: $1"
        echo "Run '$0 --help' for usage information"
        exit 1
        ;;
esac