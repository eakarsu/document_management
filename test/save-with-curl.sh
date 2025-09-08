#!/bin/bash

# CURL COMMAND TO SAVE MERGED DOCUMENT TO DATABASE

DOCUMENT_ID="cmf6w5vh9002bgu01h5abycma"
API_URL="http://localhost:4000"

# The merged content (with "Replace wit test" instead of "sdlgsdfgsdfgsdfgsdf")
MERGED_CONTENT='<p>Section 1.1.2: The text here contains Replace wit test that needs improvement.</p>'

echo "=== SAVING MERGED DOCUMENT TO DATABASE ==="
echo ""
echo "Document ID: $DOCUMENT_ID"
echo "New content: $MERGED_CONTENT"
echo ""
echo "To actually save, you need to:"
echo "1. Get your auth token from the browser"
echo "2. Run this command with your token:"
echo ""
echo "curl -X PATCH '$API_URL/api/documents/$DOCUMENT_ID' \\"
echo "  -H 'Authorization: Bearer YOUR_TOKEN_HERE' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"customFields\":{\"content\":\"$MERGED_CONTENT\",\"lastOPRUpdate\":\"'$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")'\",\"mergedByScript\":true}}'"
echo ""
echo "This will ACTUALLY update the document in the database!"