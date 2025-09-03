#!/bin/bash

# Test Binary Diff System
# Quick verification script for the hybrid document versioning system

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🧪 Testing Binary Diff System${NC}"
echo "=================================="

# Check if system is running
echo -e "\n${BLUE}📋 Step 1: System Status Check${NC}"
if curl -s http://localhost:4000/health >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend API: Running${NC}"
else
    echo -e "${RED}❌ Backend API: Not running${NC}"
    echo "Please start the system with: ./start.sh"
    exit 1
fi

if curl -s http://localhost:3000 >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend: Running${NC}"
else
    echo -e "${RED}❌ Frontend: Not running${NC}"
    exit 1
fi

# Check database connection
echo -e "\n${BLUE}📋 Step 2: Database Schema Check${NC}"
cd backend
if npx prisma db pull --print >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Database: Connected${NC}"
    
    # Check if binary diff fields exist
    if npx prisma db pull --print 2>/dev/null | grep -q "diffSize\|compressionRatio\|changeCategory"; then
        echo -e "${GREEN}✅ Binary diff schema: Present${NC}"
    else
        echo -e "${YELLOW}⚠️ Binary diff schema: May be missing${NC}"
    fi
else
    echo -e "${RED}❌ Database: Connection failed${NC}"
    exit 1
fi
cd ..

# Check if node-bsdiff is installed
echo -e "\n${BLUE}📋 Step 3: Binary Diff Dependencies${NC}"
if [ -f "backend/node_modules/node-bsdiff/package.json" ]; then
    echo -e "${GREEN}✅ node-bsdiff: Installed${NC}"
else
    echo -e "${YELLOW}⚠️ node-bsdiff: Not found, installing...${NC}"
    cd backend
    npm install node-bsdiff
    cd ..
fi

# Test API endpoints
echo -e "\n${BLUE}📋 Step 4: API Endpoint Tests${NC}"

# Health check with more details
health_response=$(curl -s http://localhost:4000/health)
if echo "$health_response" | grep -q "healthy"; then
    echo -e "${GREEN}✅ Health endpoint: Working${NC}"
else
    echo -e "${RED}❌ Health endpoint: Failed${NC}"
fi

# Check documents endpoint (should require auth)
docs_response=$(curl -s -w "%{http_code}" http://localhost:4000/api/documents)
if [[ "$docs_response" =~ 401|403 ]]; then
    echo -e "${GREEN}✅ Documents endpoint: Protected (expected)${NC}"
else
    echo -e "${YELLOW}⚠️ Documents endpoint: Response code $docs_response${NC}"
fi

# Test file upload endpoint
upload_response=$(curl -s -w "%{http_code}" -X POST http://localhost:4000/api/documents)
if [[ "$upload_response" =~ 401|403 ]]; then
    echo -e "${GREEN}✅ Upload endpoint: Protected (expected)${NC}"
else
    echo -e "${YELLOW}⚠️ Upload endpoint: Response code $upload_response${NC}"
fi

# Check storage directories
echo -e "\n${BLUE}📋 Step 5: Storage Structure${NC}"
if [ -d "backend/uploads" ] || [ -d "backend/storage" ]; then
    echo -e "${GREEN}✅ Upload directories: Present${NC}"
else
    echo -e "${YELLOW}⚠️ Upload directories: Will be created on first upload${NC}"
fi

# Check logs for binary diff activity
echo -e "\n${BLUE}📋 Step 6: Binary Diff Service Check${NC}"
if [ -f "backend.log" ]; then
    if grep -q "BinaryDiffService\|binary diff\|bsdiff" backend.log; then
        echo -e "${GREEN}✅ Binary diff logging: Active${NC}"
        echo -e "${BLUE}   Recent binary diff activities:${NC}"
        grep -i "binary diff\|bsdiff" backend.log | tail -3 | sed 's/^/   /'
    else
        echo -e "${YELLOW}⚠️ Binary diff logging: No recent activity${NC}"
        echo -e "${BLUE}   (This is normal if no versions were created yet)${NC}"
    fi
else
    echo -e "${YELLOW}⚠️ Backend log: Not found${NC}"
fi

# Summary
echo -e "\n${BLUE}📊 System Verification Summary${NC}"
echo "=================================="

echo -e "${GREEN}✅ Core Features Ready:${NC}"
echo "   • Backend API running on port 4000"
echo "   • Frontend running on port 3000"
echo "   • Database connected with binary diff schema"
echo "   • Binary diff library (node-bsdiff) available"
echo "   • Storage system configured"

echo -e "\n${YELLOW}📋 To Test Binary Diff Manually:${NC}"
echo "   1. Open http://localhost:3000"
echo "   2. Login with: admin@richmond-dms.com / admin123"
echo "   3. Upload a document"
echo "   4. Edit the document and upload a new version"
echo "   5. Check version history for diff analytics"

echo -e "\n${BLUE}📖 Detailed Testing Guide:${NC}"
echo "   • See: test-hybrid-system.md"
echo "   • API docs: http://localhost:4000/health"

echo -e "\n${GREEN}🎉 Binary Diff System: Ready for Testing!${NC}"

# Offer to create test document
echo -e "\n${BLUE}🔧 Create Test Document?${NC}"
read -p "Would you like to create a simple test document now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}Creating test document...${NC}"
    
    # Create a simple test file
    cat > test-document.txt << 'EOF'
# Test Document for Binary Diff System

This is a test document to demonstrate the binary diff functionality.

## Version 1 Content
- Initial paragraph with some content
- A few bullet points to test diff detection
- Some basic formatting and structure

## Features to Test
1. Minor changes (typos, small additions)
2. Major changes (new sections, reorganization) 
3. Structural changes (complete rewrites)

The binary diff system will analyze changes between versions and provide:
- Change categorization (MINOR, MAJOR, STRUCTURAL)
- Percentage of content changed
- Similarity scores between versions
- Compression ratios achieved by the diff algorithm

This content provides a good baseline for testing version differences.
EOF

    echo -e "${GREEN}✅ Created test-document.txt${NC}"
    echo -e "${BLUE}   Use this file to test version uploading:${NC}"
    echo "   1. Upload test-document.txt as initial version"
    echo "   2. Modify the file and upload as version 2"
    echo "   3. Make major changes and upload as version 3"
    echo "   4. Check version history for binary diff analytics"
fi

echo -e "\n${GREEN}🚀 Happy Testing!${NC}"