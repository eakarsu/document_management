#!/bin/bash

# Quick Docker Build Test Script
# Run: ./test-docker-build.sh

set -e

echo "🐳 Docker Build Test for Richmond DMS"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker Desktop.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker is running${NC}"
echo ""

# Build the image
echo "📦 Building Docker image..."
echo "This will take 5-10 minutes on first build..."
echo ""

docker build -t richmond-dms:test . 2>&1 | tee docker-build.log

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Build succeeded!${NC}"
    echo ""
    
    # Show image info
    echo "📊 Image info:"
    docker images richmond-dms:test
    echo ""
    
    # Ask if user wants to test it
    read -p "Do you want to test the image now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        echo "🚀 Starting test containers..."
        
        # Start PostgreSQL
        docker run -d \
          --name test-postgres \
          -e POSTGRES_DB=dms_metadata \
          -e POSTGRES_USER=dms_user \
          -e POSTGRES_PASSWORD=dms_password \
          -p 5432:5432 \
          postgres:15-alpine
        
        echo "⏳ Waiting for PostgreSQL to start..."
        sleep 5
        
        # Start app
        docker run -d \
          --name test-richmond-dms \
          -p 3000:3000 \
          -p 4000:4000 \
          -e DATABASE_URL=postgresql://dms_user:dms_password@host.docker.internal:5432/dms_metadata \
          -e JWT_SECRET=test_jwt_secret_key_12345 \
          -e JWT_REFRESH_SECRET=test_jwt_refresh_secret_12345 \
          richmond-dms:test
        
        echo ""
        echo -e "${YELLOW}⏳ Waiting 60 seconds for app to start...${NC}"
        for i in {60..1}; do
            echo -ne "\r${i} seconds remaining..."
            sleep 1
        done
        echo ""
        echo ""
        
        # Test backend
        echo "🔍 Testing backend health..."
        if curl -f -s http://localhost:4000/health > /dev/null; then
            echo -e "${GREEN}✅ Backend is healthy!${NC}"
        else
            echo -e "${RED}❌ Backend health check failed${NC}"
            echo "Check logs: docker logs test-richmond-dms"
        fi
        
        # Test login
        echo ""
        echo "🔍 Testing login API..."
        RESPONSE=$(curl -s -X POST http://localhost:4000/api/auth/login \
          -H "Content-Type: application/json" \
          -d '{"email":"ao1@airforce.mil","password":"password123"}')
        
        if echo "$RESPONSE" | grep -q "success"; then
            echo -e "${GREEN}✅ Login API is working!${NC}"
        else
            echo -e "${RED}❌ Login API failed${NC}"
            echo "Response: $RESPONSE"
        fi
        
        echo ""
        echo "======================================"
        echo -e "${GREEN}✅ Test complete!${NC}"
        echo ""
        echo "Access the app at:"
        echo "  Frontend: http://localhost:3000"
        echo "  Backend:  http://localhost:4000"
        echo ""
        echo "View logs:"
        echo "  docker logs -f test-richmond-dms"
        echo ""
        echo "Stop containers:"
        echo "  docker stop test-richmond-dms test-postgres"
        echo "  docker rm test-richmond-dms test-postgres"
        echo ""
    fi
else
    echo ""
    echo -e "${RED}❌ Build failed!${NC}"
    echo "Check the logs: docker-build.log"
    exit 1
fi
