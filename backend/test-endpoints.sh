#!/bin/bash

# Publishing API Endpoint Tests
BASE_URL="http://localhost:4000"
echo "🚀 Testing Publishing API Endpoints"
echo "======================================"

# Step 1: Login to get auth token
echo "🔐 Step 1: Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@admin.com","password":"password123"}')

echo "Login Response: $LOGIN_RESPONSE"

# Extract token from response (basic approach)
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to get auth token"
  exit 1
fi

echo "✅ Auth token obtained: ${TOKEN:0:20}..."

# Step 2: Test Publishing Dashboard
echo ""
echo "📊 Step 2: Testing Publishing Dashboard..."
DASHBOARD_RESPONSE=$(curl -s -X GET "$BASE_URL/api/publishing/dashboard" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "Dashboard Response: $DASHBOARD_RESPONSE"

# Step 3: Test Create Workflow
echo ""
echo "⚙️ Step 3: Testing Create Publishing Workflow..."
WORKFLOW_DATA='{
  "name": "Test Workflow",
  "description": "Test workflow for endpoint testing",
  "workflowType": "DOCUMENT_APPROVAL",
  "autoApprove": false,
  "requiredApprovers": 1,
  "allowParallel": false,
  "timeoutHours": 72,
  "approvalSteps": [
    {
      "stepNumber": 1,
      "stepName": "Initial Review",
      "description": "First level approval",
      "isRequired": true,
      "timeoutHours": 24,
      "minApprovals": 1,
      "allowDelegation": true,
      "requiredUsers": []
    }
  ]
}'

WORKFLOW_RESPONSE=$(curl -s -X POST "$BASE_URL/api/publishing/workflows" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$WORKFLOW_DATA")

echo "Workflow Response: $WORKFLOW_RESPONSE"

# Step 4: Test Get Templates
echo ""
echo "📝 Step 4: Testing Get Publishing Templates..."
TEMPLATES_RESPONSE=$(curl -s -X GET "$BASE_URL/api/publishing/templates" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "Templates Response: $TEMPLATES_RESPONSE"

# Step 5: Test Create Template
echo ""
echo "🎨 Step 5: Testing Create Publishing Template..."
TEMPLATE_DATA='{
  "name": "Test Template",
  "description": "Test template for endpoint testing",
  "templateType": "STANDARD",
  "formatting": {
    "fontFamily": "Helvetica",
    "fontSize": 12,
    "margins": {"top": 50, "bottom": 50, "left": 50, "right": 50}
  },
  "layout": {
    "pageSize": "A4",
    "orientation": "portrait"
  },
  "metadata": {
    "version": "1.0"
  }
}'

TEMPLATE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/publishing/templates" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$TEMPLATE_DATA")

echo "Template Response: $TEMPLATE_RESPONSE"

# Step 6: Test Get Notifications
echo ""
echo "🔔 Step 6: Testing Get Notifications..."
NOTIFICATIONS_RESPONSE=$(curl -s -X GET "$BASE_URL/api/publishing/notifications" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "Notifications Response: $NOTIFICATIONS_RESPONSE"

# Step 7: Test Distribution Analytics
echo ""
echo "📈 Step 7: Testing Distribution Analytics..."
ANALYTICS_RESPONSE=$(curl -s -X GET "$BASE_URL/api/publishing/distribution/analytics" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "Analytics Response: $ANALYTICS_RESPONSE"

# Step 8: Test Error Handling - Invalid Token
echo ""
echo "❌ Step 8: Testing Error Handling (Invalid Token)..."
ERROR_RESPONSE=$(curl -s -X GET "$BASE_URL/api/publishing/dashboard" \
  -H "Authorization: Bearer invalid-token" \
  -H "Content-Type: application/json")

echo "Error Response: $ERROR_RESPONSE"

# Step 9: Test Error Handling - Missing Data
echo ""
echo "❌ Step 9: Testing Error Handling (Missing Required Data)..."
INVALID_WORKFLOW_DATA='{"description": "Missing required name field"}'

INVALID_RESPONSE=$(curl -s -X POST "$BASE_URL/api/publishing/workflows" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$INVALID_WORKFLOW_DATA")

echo "Invalid Workflow Response: $INVALID_RESPONSE"

echo ""
echo "✅ All endpoint tests completed!"
echo "======================================"