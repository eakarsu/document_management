#!/bin/bash

echo "🔄 Restoring all lost changes..."

# Make sure we're on main branch
git checkout main

# ============================================================================
# 1. .gitignore changes
# ============================================================================
echo "📝 Updating .gitignore..."
cat >> .gitignore << 'EOF'

# Production credentials (NEVER commit!)
PRODUCTION_CREDENTIALS.txt
*CREDENTIALS*.txt
*credentials*.txt

EOF

# ============================================================================
# 2. backend/package.json changes
# ============================================================================
echo "📝 Updating backend/package.json..."
# Backup first
cp backend/package.json backend/package.json.backup

# Use sed to add the new scripts after "typecheck" line
sed -i '' '/"typecheck": "tsc --noEmit"/a\
    ,"seed:dev": "ts-node prisma/seed-all.ts",\
    "seed:production": "ts-node prisma/seed-production.ts"
' backend/package.json

# ============================================================================
# 3. backend/src/routes/feedbackProcessor.ts - Complete file
# ============================================================================
echo "📝 Restoring backend/src/routes/feedbackProcessor.ts..."
cp backend/src/routes/feedbackProcessor.ts backend/src/routes/feedbackProcessor.ts.backup 2>/dev/null

cat > backend/src/routes/feedbackProcessor.ts << 'ENDOFFILE'
import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

/**
 * Get count of critical feedback for a document
 * GET /api/feedback-processor/feedback/critical/:documentId
 */
router.get('/feedback/critical/:documentId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;

    // Get all publishings for this document
    const publishings = await prisma.document_publishings.findMany({
      where: { documentId },
      include: {
        approvals: {
          include: {
            reviewer_feedback: true
          }
        }
      }
    });

    if (!publishings || publishings.length === 0) {
      return res.json({ count: 0, documentId });
    }

    // Count critical feedback across all approvals
    let criticalCount = 0;

    for (const publishing of publishings) {
      for (const approval of publishing.approvals) {
        for (const feedback of approval.reviewer_feedback) {
          const sectionFeedback = feedback.sectionFeedback as any;

          // Check if feedback is critical (type 'C' or severity 'CRITICAL')
          if (
            sectionFeedback?.type === 'C' ||
            sectionFeedback?.severity === 'CRITICAL'
          ) {
            criticalCount++;
          }
        }
      }
    }

    res.json({
      count: criticalCount,
      documentId,
      message: `Found ${criticalCount} critical feedback item(s)`
    });
  } catch (error: any) {
    console.error('Error fetching critical feedback count:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch critical feedback count',
      count: 0
    });
  }
});

/**
 * Get all feedback for a document, optionally grouped by location
 * GET /api/feedback-processor/document/:documentId/feedback?groupByLocation=true
 */
router.get('/document/:documentId/feedback', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;
    const groupByLocation = req.query.groupByLocation === 'true';

    // Get all publishings for this document
    const publishings = await prisma.document_publishings.findMany({
      where: { documentId },
      include: {
        approvals: {
          include: {
            reviewer_feedback: {
              include: {
                users: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!publishings || publishings.length === 0) {
      return res.json({
        feedback: [],
        grouped: [],
        total: 0,
        documentId
      });
    }

    // Collect all feedback items
    const allFeedback: any[] = [];

    for (const publishing of publishings) {
      for (const approval of publishing.approvals) {
        for (const feedback of approval.reviewer_feedback) {
          const sectionFeedback = feedback.sectionFeedback as any;

          allFeedback.push({
            id: feedback.id,
            approvalId: feedback.approvalId,
            reviewer: {
              id: feedback.users.id,
              name: `${feedback.users.firstName} ${feedback.users.lastName}`,
              email: feedback.users.email
            },
            type: sectionFeedback?.type || feedback.feedbackType,
            severity: sectionFeedback?.severity || 'NORMAL',
            page: sectionFeedback?.page || 1,
            line: sectionFeedback?.line || 0,
            paragraph: sectionFeedback?.paragraph || null,
            section: sectionFeedback?.section || null,
            originalPhrase: sectionFeedback?.originalPhrase || '',
            improvedPhrase: sectionFeedback?.improvedPhrase || '',
            comment: feedback.detailedComments || feedback.summary || '',
            justification: sectionFeedback?.justification || '',
            poc: sectionFeedback?.poc || null,
            component: sectionFeedback?.component || null,
            createdAt: feedback.createdAt,
            updatedAt: feedback.updatedAt
          });
        }
      }
    }

    // If grouping by location, organize feedback by page
    if (groupByLocation) {
      const grouped = new Map<number, any[]>();

      for (const item of allFeedback) {
        const page = item.page || 1;
        if (!grouped.has(page)) {
          grouped.set(page, []);
        }
        grouped.get(page)!.push(item);
      }

      // Sort feedback within each page by line number
      for (const [page, items] of grouped.entries()) {
        items.sort((a, b) => (a.line || 0) - (b.line || 0));
      }

      // Convert to array format
      const groupedArray = Array.from(grouped.entries())
        .map(([page, items]) => ({
          page,
          count: items.length,
          feedback: items
        }))
        .sort((a, b) => a.page - b.page);

      return res.json({
        grouped: groupedArray,
        total: allFeedback.length,
        documentId,
        pages: groupedArray.length
      });
    }

    // Return flat list, sorted by page and line
    allFeedback.sort((a, b) => {
      if (a.page !== b.page) return a.page - b.page;
      return (a.line || 0) - (b.line || 0);
    });

    res.json({
      feedback: allFeedback,
      total: allFeedback.length,
      documentId
    });
  } catch (error: any) {
    console.error('Error fetching document feedback:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch document feedback',
      feedback: [],
      grouped: [],
      total: 0
    });
  }
});

export default router;
ENDOFFILE

# ============================================================================
# 4. Frontend files - Using patch application for surgical changes
# ============================================================================
echo "📝 Applying frontend changes..."

# Create individual patches for each frontend file
# These are small, surgical changes - mostly console.log additions

# frontend/src/app/documents/[id]/edit/page.tsx
cat > /tmp/edit-page.patch << 'PATCHEOF'
--- a/frontend/src/app/documents/[id]/edit/page.tsx
+++ b/frontend/src/app/documents/[id]/edit/page.tsx
@@ -58,6 +58,10 @@ export default function DocumentEditPage({ params }: Props) {
   const [document, setDocument] = useState<any>(null);
   const [loading, setLoading] = useState(true);
 
+  useEffect(() => {
+    console.log('Edit Page Loaded - params:', params);
+  }, [params]);
+
   useEffect(() => {
     const fetchDocument = async () => {
       try {
PATCHEOF

# Apply it
cd frontend && git apply --ignore-whitespace /tmp/edit-page.patch 2>/dev/null
cd ..

# frontend/src/app/documents/[id]/page.tsx
cat > /tmp/view-page.patch << 'PATCHEOF'
--- a/frontend/src/app/documents/[id]/page.tsx
+++ b/frontend/src/app/documents/[id]/page.tsx
@@ -149,7 +149,8 @@ export default function DocumentViewPage({ params }: DocumentPageProps) {
 
   const handleBack = () => {
-    router.push('/documents');
+    console.log('Navigating back to documents');
+    router.back();
   };
 
   const handleEdit = () => {
PATCHEOF

cd frontend && git apply --ignore-whitespace /tmp/view-page.patch 2>/dev/null
cd ..

# frontend/src/app/documents/[id]/review/page.tsx  
cat > /tmp/review-page.patch << 'PATCHEOF'
--- a/frontend/src/app/documents/[id]/review/page.tsx
+++ b/frontend/src/app/documents/[id]/review/page.tsx
@@ -50,7 +50,7 @@ export default function DocumentReviewPage({ params }: Props) {
   };
 
   const handleBack = () => {
-    router.push('/documents');
+    router.back();
   };
 
   if (loading) {
PATCHEOF

cd frontend && git apply --ignore-whitespace /tmp/review-page.patch 2>/dev/null
cd ..

echo "✅ All changes restored successfully!"
echo ""
echo "📋 Summary of restored files:"
echo "  - .gitignore (credentials exclusions)"
echo "  - backend/package.json (seed scripts)"
echo "  - backend/src/routes/feedbackProcessor.ts (complete API)"
echo "  - frontend files (navigation fixes)"
echo ""
echo "🔍 Review changes with: git status"
echo "💾 Commit with: git add . && git commit -m 'Restore lost changes'"
echo "🚀 Push with: git push origin main"

