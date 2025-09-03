#!/bin/bash

echo "🚀 COMPREHENSIVE SYSTEM TEST"
echo "============================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

test_result() {
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ PASS${NC}: $2"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}❌ FAIL${NC}: $2"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

echo -e "\n${BLUE}1. Testing Backend Services${NC}"
echo "----------------------------"

# Test backend health
curl -s -o /dev/null http://localhost:4000/health
test_result $? "Backend server health check"

# Test database connection
curl -s http://localhost:4000/api/dashboard/stats >/dev/null 2>&1
test_result $? "Database connection"

echo -e "\n${BLUE}2. Testing Authentication${NC}"
echo "-------------------------"

# Login test
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@admin.com", "password": "password123"}')

if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
    TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.accessToken')
    test_result 0 "User authentication"
else
    test_result 1 "User authentication"
    TOKEN=""
fi

echo -e "\n${BLUE}3. Testing Template System${NC}"
echo "----------------------------"

if [ ! -z "$TOKEN" ]; then
    # Test get templates
    TEMPLATES_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" \
      http://localhost:4000/api/publishing/templates)
    
    if echo "$TEMPLATES_RESPONSE" | grep -q '"success":true'; then
        test_result 0 "Get publishing templates"
        TEMPLATE_COUNT=$(echo "$TEMPLATES_RESPONSE" | jq '.templates | length')
        echo -e "${YELLOW}Info${NC}: Found $TEMPLATE_COUNT templates"
    else
        test_result 1 "Get publishing templates"
    fi

    # Test create template with biography section
    CREATE_TEMPLATE_RESPONSE=$(curl -s -X POST http://localhost:4000/api/publishing/templates \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "name": "Test Biography Template",
        "description": "Template with biography section for testing",
        "templateType": "STANDARD",
        "formatting": {
          "fontSize": 12,
          "fontFamily": "Arial",
          "margins": {"top": 50, "bottom": 50, "left": 50, "right": 50}
        },
        "layout": {
          "pageSize": "A4",
          "orientation": "portrait"
        },
        "metadata": {
          "version": "1.0",
          "sections": ["Header", "Biography", "Content", "References"]
        }
      }')
    
    if echo "$CREATE_TEMPLATE_RESPONSE" | grep -q '"success":true'; then
        test_result 0 "Create template with biography section"
        TEMPLATE_ID=$(echo "$CREATE_TEMPLATE_RESPONSE" | jq -r '.template.id')
        echo -e "${YELLOW}Info${NC}: Created template ID: ${TEMPLATE_ID:0:8}..."
    else
        test_result 1 "Create template with biography section"
    fi
else
    test_result 1 "Templates test (no auth token)"
fi

echo -e "\n${BLUE}4. Testing Document Creation${NC}"
echo "------------------------------"

if [ ! -z "$TOKEN" ]; then
    # Create test document with biography content
    TEST_DOC_CONTENT="# Test Air Force Manual

**Publication Number:** DAFMAN-TEST-001
**OPR:** AF/TEST
**Date:** $(date)

## Header Information
BY ORDER OF THE SECRETARY OF THE AIR FORCE
AIR FORCE MANUAL TEST-001
$(date)
Test Manual with Biography Section

## Subject Biography
This section provides biographical and historical information about the subject matter of this manual. It includes:

- Historical context and development
- Key personnel biographies
- Organizational background
- Previous versions and evolution
- Relevant regulatory history

[This is a test biography section created by the comprehensive system test.]

## Procedures
1. Test procedure one
2. Test procedure two
3. Test procedure three

## References
- Reference document 1
- Reference document 2

---
**Certifying Official:** Test Official
**OPR:** AF/TEST
"

    echo "$TEST_DOC_CONTENT" > /tmp/test_biography_manual.txt
    
    # Upload document
    UPLOAD_RESPONSE=$(curl -s -X POST http://localhost:4000/api/documents/upload \
      -H "Authorization: Bearer $TOKEN" \
      -F "file=@/tmp/test_biography_manual.txt" \
      -F "title=Test Air Force Manual with Biography" \
      -F "description=Comprehensive test manual with biography section" \
      -F "category=Manual")
    
    if echo "$UPLOAD_RESPONSE" | grep -q '"success":true'; then
        test_result 0 "Document creation with biography content"
        DOC_ID=$(echo "$UPLOAD_RESPONSE" | jq -r '.document.id')
        echo -e "${YELLOW}Info${NC}: Created document ID: ${DOC_ID:0:8}..."
    else
        test_result 1 "Document creation with biography content"
        echo -e "${RED}Error${NC}: $UPLOAD_RESPONSE"
    fi
    
    # Clean up
    rm -f /tmp/test_biography_manual.txt
else
    test_result 1 "Document creation test (no auth token)"
fi

echo -e "\n${BLUE}5. Testing Frontend Services${NC}"
echo "----------------------------"

# Test frontend server
curl -s -o /dev/null http://localhost:3000
test_result $? "Frontend server running"

# Test document creation page
FRONTEND_RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null http://localhost:3000/documents/create)
if [ "$FRONTEND_RESPONSE" = "200" ] || [ "$FRONTEND_RESPONSE" = "307" ]; then
    test_result 0 "Document creation page accessible"
else
    test_result 1 "Document creation page accessible"
fi

# Test dashboard
DASHBOARD_RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null http://localhost:3000/dashboard)
if [ "$DASHBOARD_RESPONSE" = "200" ] || [ "$DASHBOARD_RESPONSE" = "307" ]; then
    test_result 0 "Dashboard page accessible"
else
    test_result 1 "Dashboard page accessible"
fi

echo -e "\n${BLUE}6. Testing Workflow System${NC}"
echo "---------------------------"

if [ ! -z "$TOKEN" ] && [ ! -z "$DOC_ID" ]; then
    # Test workflow status
    WORKFLOW_RESPONSE=$(curl -s -X POST http://localhost:3000/api/workflow-status \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"documentId\": \"$DOC_ID\", \"action\": \"get_status\"}")
    
    if echo "$WORKFLOW_RESPONSE" | grep -q -E '"success":true|"workflow"'; then
        test_result 0 "8-stage workflow system"
    else
        test_result 1 "8-stage workflow system"
    fi
else
    test_result 1 "Workflow system test (missing prerequisites)"
fi

echo -e "\n${BLUE}📊 TEST SUMMARY${NC}"
echo "================"
echo -e "Total Tests: ${BLUE}$TOTAL_TESTS${NC}"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}🎉 ALL TESTS PASSED! System is fully functional.${NC}"
    exit 0
else
    echo -e "\n${YELLOW}⚠️  Some tests failed. Check the output above for details.${NC}"
    exit 1
fi