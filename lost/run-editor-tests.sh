#!/bin/bash

# Comprehensive Editor Test Runner
# This script runs all editor tests with proper configuration

echo "=================================="
echo "Document Editor - Comprehensive Test"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Error: Node.js is not installed${NC}"
    exit 1
fi

# Navigate to frontend directory
cd "$(dirname "$0")/frontend" || exit 1

echo -e "${BLUE}Installing dependencies if needed...${NC}"
npm install --silent

echo ""
echo -e "${BLUE}Running Comprehensive Editor Tests...${NC}"
echo ""

# Run the test with Playwright
npx playwright test tests/editor-comprehensive.spec.js \
  --headed \
  --timeout=60000 \
  --reporter=list

# Check exit code
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ All tests passed successfully!${NC}"
    echo ""
else
    echo ""
    echo -e "${YELLOW}Some tests failed. Check the output above for details.${NC}"
    echo ""
fi

echo "=================================="
echo "Test run completed"
echo "=================================="
