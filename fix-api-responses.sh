#!/bin/bash

# Fix API response handling in all publishing components
# This script replaces response.data.* with proper response.json() handling

echo "Fixing API response handling in publishing components..."

# For PublishingWorkflowForm.tsx
echo "Fixing PublishingWorkflowForm.tsx..."
sed -i '' 's/setTemplates(response\.data\.templates || \[\]);/if (response.ok) { const data = await response.json(); setTemplates(data.templates || []); } else { setTemplates([]); }/g' /Users/erolakarsu/projects/document_management/frontend/src/components/publishing/PublishingWorkflowForm.tsx

# For DocumentPublishForm.tsx
echo "Fixing DocumentPublishForm.tsx..."
sed -i '' 's/setDocuments(response\.data\.documents || \[\]);/if (response.ok) { const data = await response.json(); setDocuments(data.documents || []); } else { setDocuments([]); }/g' /Users/erolakarsu/projects/document_management/frontend/src/components/publishing/DocumentPublishForm.tsx

echo "Done! Manual verification recommended for complex cases."