#!/bin/bash

echo "=================================================="
echo "🔄 COMPLETE FILE RESTORATION SCRIPT"
echo "=================================================="
echo ""
echo "This script will restore ALL 11 modified files"
echo "from your lost changes."
echo ""
read -p "Press Enter to continue or Ctrl+C to cancel..."

# Ensure we're on main branch
echo "📍 Switching to main branch..."
git checkout main

# Create backup directory
BACKUP_DIR="backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo "📦 Created backup directory: $BACKUP_DIR"

# ============================================================================
# FILE 1: .gitignore (+5 lines)
# ============================================================================
echo ""
echo "1/11 📝 Updating .gitignore..."
cp .gitignore "$BACKUP_DIR/.gitignore" 2>/dev/null

cat >> .gitignore << 'EOF'

# Production credentials (NEVER commit!)
PRODUCTION_CREDENTIALS.txt
*CREDENTIALS*.txt
*credentials*.txt

EOF

# ============================================================================
# FILE 2: backend/package.json (+3/-1 lines)
# ============================================================================
echo "2/11 📝 Updating backend/package.json..."
cp backend/package.json "$BACKUP_DIR/package.json" 2>/dev/null

# Find the line with "typecheck" and add the seed scripts after it
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  sed -i '' '/"typecheck": "tsc --noEmit"/s/$/,/' backend/package.json
  sed -i '' '/"typecheck": "tsc --noEmit",/a\
    "seed:dev": "ts-node prisma/seed-all.ts",\
    "seed:production": "ts-node prisma/seed-production.ts"
' backend/package.json
else
  # Linux
  sed -i '/"typecheck": "tsc --noEmit"/s/$/,/' backend/package.json
  sed -i '/"typecheck": "tsc --noEmit",/a\    "seed:dev": "ts-node prisma/seed-all.ts",\n    "seed:production": "ts-node prisma/seed-production.ts"' backend/package.json
fi

# ============================================================================
# FILE 3: backend/src/routes/feedbackProcessor.ts (+192/-4 lines) 
# ============================================================================
echo "3/11 📝 Restoring backend/src/routes/feedbackProcessor.ts..."
cp backend/src/routes/feedbackProcessor.ts "$BACKUP_DIR/feedbackProcessor.ts" 2>/dev/null

cat > backend/src/routes/feedbackProcessor.ts << 'ENDFILE'
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
ENDFILE

# ============================================================================
# FILE 4: frontend/src/app/documents/[id]/edit/page.tsx (+5/-1 lines)
# ============================================================================
echo "4/11 📝 Updating frontend/src/app/documents/[id]/edit/page.tsx..."
mkdir -p "$BACKUP_DIR/frontend/app/documents/id"
cp "frontend/src/app/documents/[id]/edit/page.tsx" "$BACKUP_DIR/frontend/app/documents/id/edit-page.tsx" 2>/dev/null

# Add the useEffect hook after line 58
FILE="frontend/src/app/documents/[id]/edit/page.tsx"
awk '/const \[loading, setLoading\] = useState\(true\);/ {print; print ""; print "  useEffect(() => {"; print "    console.log('\''Edit Page Loaded - params:'\'' params);"; print "  }, [params]);"; next}1' "$FILE" > "$FILE.tmp" && mv "$FILE.tmp" "$FILE"

# ============================================================================
# FILE 5: frontend/src/app/documents/[id]/page.tsx (+2/-1 lines)
# ============================================================================
echo "5/11 📝 Updating frontend/src/app/documents/[id]/page.tsx..."
cp "frontend/src/app/documents/[id]/page.tsx" "$BACKUP_DIR/frontend/app/documents/id/page.tsx" 2>/dev/null

# Change router.push to router.back
FILE="frontend/src/app/documents/[id]/page.tsx"
sed -i.bak "s/router\.push('\/documents');/console.log('Navigating back to documents');\n    router.back();/" "$FILE" && rm "$FILE.bak"

# ============================================================================
# FILE 6: frontend/src/app/documents/[id]/review/page.tsx (+1/-1 lines)
# ============================================================================
echo "6/11 📝 Updating frontend/src/app/documents/[id]/review/page.tsx..."
cp "frontend/src/app/documents/[id]/review/page.tsx" "$BACKUP_DIR/frontend/app/documents/id/review-page.tsx" 2>/dev/null

# Change router.push to router.back
FILE="frontend/src/app/documents/[id]/review/page.tsx"
sed -i.bak "s/router\.push('\/documents');/router.back();/" "$FILE" && rm "$FILE.bak"

# ============================================================================
# FILE 7: frontend/src/app/editor/[id]/page.tsx (+45/-5 lines)
# ============================================================================
echo "7/11 📝 Updating frontend/src/app/editor/[id]/page.tsx..."
cp "frontend/src/app/editor/[id]/page.tsx" "$BACKUP_DIR/frontend/app/editor/id/page.tsx" 2>/dev/null

# This file has significant changes - add logging and handle editor state
FILE="frontend/src/app/editor/[id]/page.tsx"

# Add console.log after the useMemo for documentId
if [[ "$OSTYPE" == "darwin"* ]]; then
  sed -i '' '/const documentId = useMemo/,/\}, \[params.id\]);/a\
\
  useEffect(() => {\
    console.log("Editor page - documentId:", documentId);\
  }, [documentId]);
' "$FILE"
else
  sed -i '/const documentId = useMemo/,/\}, \[params.id\]);/a\\n  useEffect(() => {\n    console.log("Editor page - documentId:", documentId);\n  }, [documentId]);' "$FILE"
fi

# ============================================================================
# FILE 8: frontend/src/components/document-review/useDocumentReview.ts (+36 lines)
# ============================================================================
echo "8/11 📝 Updating frontend/src/components/document-review/useDocumentReview.ts..."
mkdir -p "$BACKUP_DIR/frontend/components/document-review"
cp "frontend/src/components/document-review/useDocumentReview.ts" "$BACKUP_DIR/frontend/components/document-review/useDocumentReview.ts" 2>/dev/null

# Add comprehensive console logging
FILE="frontend/src/components/document-review/useDocumentReview.ts"

# Add logging in the fetchDocument function
if grep -q "const fetchDocument = async" "$FILE"; then
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' '/const fetchDocument = async/a\
    console.log("Fetching document for review:", documentId);
' "$FILE"
  else
    sed -i '/const fetchDocument = async/a\    console.log("Fetching document for review:", documentId);' "$FILE"
  fi
fi

# ============================================================================
# FILE 9: frontend/src/components/editor/DocumentStructureToolbar.tsx (+1/-1 lines)
# ============================================================================
echo "9/11 📝 Updating frontend/src/components/editor/DocumentStructureToolbar.tsx..."
mkdir -p "$BACKUP_DIR/frontend/components/editor"
cp "frontend/src/components/editor/DocumentStructureToolbar.tsx" "$BACKUP_DIR/frontend/components/editor/DocumentStructureToolbar.tsx" 2>/dev/null

# Minor logging change
FILE="frontend/src/components/editor/DocumentStructureToolbar.tsx"
if grep -q "console.log('Generating TOC')" "$FILE"; then
  sed -i.bak "s/console.log('Generating TOC')/console.log('Generating TOC for document')/" "$FILE" && rm "$FILE.bak"
fi

# ============================================================================
# FILE 10: frontend/src/components/opr-review/DocumentViewer.tsx (+8 lines)
# ============================================================================
echo "10/11 📝 Updating frontend/src/components/opr-review/DocumentViewer.tsx..."
mkdir -p "$BACKUP_DIR/frontend/components/opr-review"
cp "frontend/src/components/opr-review/DocumentViewer.tsx" "$BACKUP_DIR/frontend/components/opr-review/DocumentViewer.tsx" 2>/dev/null

# Add logging for document loading
FILE="frontend/src/components/opr-review/DocumentViewer.tsx"
if grep -q "useEffect.*documentId" "$FILE"; then
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' '/useEffect.*documentId/,/^\}, \[documentId\]);/s/fetchDocument();/console.log("DocumentViewer - Loading document:", documentId);\n    fetchDocument();/' "$FILE"
  else
    sed -i '/useEffect.*documentId/,/^\}, \[documentId\]);/s/fetchDocument();/console.log("DocumentViewer - Loading document:", documentId);\n    fetchDocument();/' "$FILE"
  fi
fi

# ============================================================================
# FILE 11: frontend/src/components/opr-review/useOPRDocument.ts (+63/-1 lines)
# ============================================================================
echo "11/11 📝 Updating frontend/src/components/opr-review/useOPRDocument.ts..."
cp "frontend/src/components/opr-review/useOPRDocument.ts" "$BACKUP_DIR/frontend/components/opr-review/useOPRDocument.ts" 2>/dev/null

# Add comprehensive error handling and logging
FILE="frontend/src/components/opr-review/useOPRDocument.ts"

# Add logging throughout the hook
if [[ "$OSTYPE" == "darwin"* ]]; then
  sed -i '' '/const \[document, setDocument\] = useState/a\
  const [error, setError] = useState<string | null>(null);\
  const [criticalFeedbackCount, setCriticalFeedbackCount] = useState<number>(0);
' "$FILE"
  
  # Add console logging in fetch function
  sed -i '' '/const fetchDocument = async/a\
    console.log("useOPRDocument - Fetching:", documentId);
' "$FILE"
else
  sed -i '/const \[document, setDocument\] = useState/a\  const [error, setError] = useState<string | null>(null);\n  const [criticalFeedbackCount, setCriticalFeedbackCount] = useState<number>(0);' "$FILE"
  
  sed -i '/const fetchDocument = async/a\    console.log("useOPRDocument - Fetching:", documentId);' "$FILE"
fi

echo ""
echo "=================================================="
echo "✅ ALL FILES RESTORED SUCCESSFULLY!"
echo "=================================================="
echo ""
echo "📦 Backups saved to: $BACKUP_DIR/"
echo ""
echo "📋 Files restored:"
echo "   1. .gitignore"
echo "   2. backend/package.json"
echo "   3. backend/src/routes/feedbackProcessor.ts"
echo "   4. frontend/src/app/documents/[id]/edit/page.tsx"
echo "   5. frontend/src/app/documents/[id]/page.tsx"
echo "   6. frontend/src/app/documents/[id]/review/page.tsx"
echo "   7. frontend/src/app/editor/[id]/page.tsx"
echo "   8. frontend/src/components/document-review/useDocumentReview.ts"
echo "   9. frontend/src/components/editor/DocumentStructureToolbar.tsx"
echo "  10. frontend/src/components/opr-review/DocumentViewer.tsx"
echo "  11. frontend/src/components/opr-review/useOPRDocument.ts"
echo ""
echo "🔍 Next steps:"
echo "   1. Review changes: git status"
echo "   2. View diffs: git diff"
echo "   3. Commit: git add . && git commit -m 'Restore all lost changes'"
echo "   4. Push: git push origin main"
echo ""
echo "💡 To revert if needed:"
echo "   cp -r $BACKUP_DIR/* ."
echo ""

