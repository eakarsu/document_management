# Permanent Workflow System Fixes

## Overview
This document outlines all permanent fixes applied to the Air Force Document Management System's hierarchical distributed workflow to ensure proper functionality.

## Key Problems Addressed

### 1. Workflow Stage Display Issue
**Problem**: Workflow showed Stage 1 even when actually at Stage 3.5/4
**Permanent Fix**:
- Added `order` field (1-11) to all stages in `/backend/workflows/hierarchical-distributed-workflow.json`
- Updated frontend API route to proxy directly to backend for proper stage data
- Location: `/frontend/src/app/api/workflow-instances/[documentId]/route.ts`

### 2. Workflow Start/Reset Issue
**Problem**: Workflows jumped to Stage 4 instead of starting at Stage 1
**Permanent Fixes**:
- **WorkflowManager.startWorkflow()**: Always resets to Stage 1 when starting
- **cleanup-workflows.js**: Resets workflows to Stage 1 when deactivating
- Location: `/backend/src/services/WorkflowManager.ts` (lines 112-131)

### 3. Reviewer Access Issue
**Problem**: Reviewers couldn't access documents or see tasks
**Permanent Fixes**:
- **Distribution endpoint** creates proper reviewer users with SUB_REVIEWER role
- **Automatic permission granting** when distributing documents
- **Password creation** for new reviewer accounts (testpass123)
- Location: `/backend/src/routes/workflows.ts` (lines 517-597)

## Workflow Process Flow

### Stage Progression
1. **Stage 1**: Initial Draft (AO)
2. **Stage 2**: PCM Review
3. **Stage 3**: Coordinator Distribution
4. **Stage 3.5**: Review Collection (SUB_REVIEWER)
5. **Stage 4**: OPR Feedback Incorporation
6. **Stages 5-10**: Second coordination, legal, leadership, publication

### Role Mappings
```javascript
ACTION_OFFICER -> Creates/edits documents
PCM -> Gatekeeper approval
COORDINATOR -> Distributes to reviewers
SUB_REVIEWER -> Reviews documents (ops.reviewer1@airforce.mil)
LEGAL -> Legal review
LEADERSHIP -> Final approval
AFDPO -> Publication
```

## Distribution Process

When coordinator distributes documents:
1. Creates reviewer users if they don't exist
2. Assigns SUB_REVIEWER role
3. Grants READ permissions on document
4. Creates WorkflowTask for each reviewer
5. Advances workflow to Stage 3.5

## Authentication & Permissions

### Reviewer Creation
```javascript
// Automatic creation during distribution
- Email parsing for name extraction
- Organization detection from email domain
- SUB_REVIEWER role assignment
- Password: bcrypt.hash('testpass123', 10)
```

### Document Permissions
```javascript
// Granted automatically on distribution
{
  documentId: documentId,
  userId: reviewerUser.id,
  permission: 'READ'
}
```

## Testing Workflow

### As Coordinator (coordinator1@airforce.mil):
1. Login and navigate to document
2. Click "Distribute to Reviewers"
3. Select reviewers (e.g., ops.reviewer1@airforce.mil)
4. Click "Distribute Document"

### As Reviewer (ops.reviewer1@airforce.mil):
1. Login with password: testpass123
2. Dashboard shows ReviewerTasks component
3. Click "Review" to access document
4. Submit feedback through workflow

## Database Schema

### Key Tables
- `JsonWorkflowInstance`: Tracks workflow state
- `WorkflowTask`: Reviewer assignments
- `DocumentPermission`: Access control
- `User`: Reviewer accounts with SUB_REVIEWER role

## API Endpoints

### Critical Endpoints
- `GET /api/tasks`: Returns pending tasks for logged-in user
- `POST /api/workflows/documents/:id/distribute`: Distributes to reviewers
- `GET /api/workflow-instances/:id`: Returns workflow state with stageOrder
- `POST /api/workflow-instances/:id/reset`: Resets workflow to Stage 1
- `POST /api/workflow-instances/:id/start`: Starts workflow at Stage 1

## Configuration Files

### Updated Files
1. `/backend/workflows/hierarchical-distributed-workflow.json` - Added order fields
2. `/backend/src/services/WorkflowManager.ts` - Fixed start/reset logic
3. `/backend/src/routes/workflows.ts` - Fixed distribution & reviewer creation
4. `/frontend/src/app/api/workflow-instances/[documentId]/route.ts` - Proxy to backend
5. `/backend/cleanup-workflows.js` - Reset to Stage 1 on cleanup

## Environment Requirements

### Backend
- Node.js with TypeScript
- Prisma ORM
- PostgreSQL database
- bcryptjs for password hashing

### Frontend
- Next.js 14+
- Material-UI components
- ReviewerTasks component on dashboard

## Common Issues & Solutions

### Issue: Reviewer can't see tasks
**Solution**: Ensure SUB_REVIEWER role exists in database and user has this role

### Issue: 500 error on /api/tasks
**Solution**: Restart backend server, ensure TypeScript compiles without errors

### Issue: Workflow shows wrong stage
**Solution**: Check that workflow JSON has order fields and frontend proxies to backend

### Issue: Workflow doesn't start at Stage 1
**Solution**: WorkflowManager.startWorkflow() must set currentStageId: '1'

### Issue: TypeScript compilation errors in workflows.ts
**Solution**: Fixed schema mismatches:
- Organization doesn't have 'code' field - removed from creation
- Role requires 'organizationId' field - added during creation
- User uses 'passwordHash' not 'password' - corrected field name

## Maintenance Notes

1. Always use SUB_REVIEWER role for reviewers, not "Reviewer"
2. Document permissions must be granted during distribution
3. Workflow stages must have order fields for proper display
4. Backend must be running for tasks API to work
5. All fixes are in code, not temporary database changes

## Contact
For issues with the workflow system, check:
1. Backend logs for distribution errors
2. Frontend console for API errors
3. Database for proper role/permission setup