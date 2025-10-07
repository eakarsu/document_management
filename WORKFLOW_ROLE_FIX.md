# Workflow Button Grey-out Issue - Root Cause and Fix

## Problem Summary
When ao1@airforce.mil logged in and started a workflow, all workflow action buttons immediately greyed out, making it impossible to advance the workflow.

## Root Cause
The issue was a **role type mismatch** between the database schema and frontend expectations:

### What Was Happening:
1. **Database**: Users like `ao1@airforce.mil` had a role with `name: 'User'` but no `roleType` field set
2. **Backend**: The `/api/auth/me` endpoint returned `roleType: 'USER'` (uppercase of role name)
3. **Frontend**: The workflow permission check in `useDocumentView.ts` expected `roleType: 'ACTION_OFFICER'`

### The Mismatch:
```typescript
// Frontend roleRequirements (workflowConstants.ts)
export const roleRequirements = {
  1: ['ADMIN', 'ACTION_OFFICER'],  // Stage 1 requires ACTION_OFFICER
  2: ['ADMIN', 'PCM'],               // Stage 2 requires PCM
  // ... etc
};

// Database roleType enum was missing these values:
// - ACTION_OFFICER ❌
// - PCM ❌
// - COORDINATOR ❌
// - SUB_REVIEWER ❌
// - LEGAL ❌
// - LEADERSHIP ❌
// - AFDPO ❌
// - PUBLISHER ❌
```

### Why Buttons Greyed Out:
```typescript
// In useDocumentView.ts line 59-64
const canUserAdvanceFromStage = (stageNumber: number): boolean => {
  if (!userRole) return false;
  const requiredRoles = roleRequirements[stageNumber];
  const userRoleType = userRole.roleType || userRole.role;
  return requiredRoles.includes(userRoleType);  // This always returned false!
};
```

When ao1 (Action Officer) tried to advance from Stage 1:
- Required roles: `['ADMIN', 'ACTION_OFFICER']`
- User's roleType: `'USER'`  ❌
- Result: Button disabled

## Changes Made

### 1. Added Missing RoleType Enum Values (`schema.prisma`)
```prisma
enum RoleType {
  VIEWER
  AUTHOR
  ACTION_OFFICER   // ✅ NEW
  PCM              // ✅ NEW
  COORDINATOR      // ✅ NEW
  SUB_REVIEWER     // ✅ NEW
  OPR              // ✅ NEW
  LEGAL            // ✅ NEW
  LEADERSHIP       // ✅ NEW
  AFDPO            // ✅ NEW
  PUBLISHER        // ✅ NEW
  // ... existing values
}
```

### 2. Updated Seed File (`seed-complete.ts`)
Created proper Air Force roles with correct roleType:

```typescript
const actionOfficerRole = await prisma.role.upsert({
  where: {
    roleType_organizationId: {
      roleType: 'ACTION_OFFICER',
      organizationId: airforceOrg.id
    }
  },
  create: {
    name: 'Action Officer',
    description: 'Office of Primary Responsibility Action Officer',
    permissions: ['DOCUMENT_READ', 'DOCUMENT_WRITE', 'WORKFLOW_START'],
    roleType: 'ACTION_OFFICER'  // ✅ Explicit roleType
  }
});
```

Now user assignments are correct:
```typescript
const airforceUsers = [
  { email: 'ao1@airforce.mil', role: actionOfficerRole },  // ✅ ACTION_OFFICER
  { email: 'ao2@airforce.mil', role: actionOfficerRole },  // ✅ ACTION_OFFICER
  { email: 'pcm@airforce.mil', role: pcmRole },           // ✅ PCM
  { email: 'coordinator1@airforce.mil', role: coordinatorRole }, // ✅ COORDINATOR
  // ... etc
];
```

### 3. Fixed AuthController (`authController.ts`)
Updated to use roleType from database:

```typescript
// OLD: Only used role name uppercased
const roleType = user.role?.name?.toUpperCase() || 'USER';

// NEW: Use roleType field, with fallback
const roleType = user.role?.roleType || user.role?.name?.toUpperCase() || 'USER';
```

Also added roleType to the database query:
```typescript
role: {
  select: {
    name: true,
    roleType: true,  // ✅ Now included
    permissions: true
  }
}
```

### 4. Created Database Migration
File: `backend/prisma/migrations/20251007000000_add_workflow_role_types/migration.sql`

Adds the new enum values to the database.

## How to Apply the Fix

### Step 1: Run Database Migration
```bash
cd backend
npx prisma migrate deploy
```

### Step 2: Re-seed the Database
```bash
npx prisma db seed
# or
npm run seed
```

This will:
- Create new roles with proper roleType values
- Update all Air Force users to use the correct roles

### Step 3: Rebuild Docker Images
```bash
docker compose down
docker compose build backend
docker compose up -d
```

### Step 4: Clear Browser Cache & Test
1. Clear browser cache
2. Log in as ao1@airforce.mil (password: testpass123)
3. Create/open a document
4. Start workflow
5. Verify "Submit to PCM" button is now enabled ✅

## Role Mapping Reference

| User Email | Role | roleType | Stage Permission |
|-----------|------|----------|-----------------|
| ao1@airforce.mil | Action Officer | ACTION_OFFICER | Stage 1, 4, 6, 8 |
| ao2@airforce.mil | Action Officer | ACTION_OFFICER | Stage 1, 4, 6, 8 |
| pcm@airforce.mil | PCM | PCM | Stage 2 |
| coordinator1@airforce.mil | Coordinator | COORDINATOR | Stage 3, 5 |
| ops.frontoffice@airforce.mil | Sub-Reviewer | SUB_REVIEWER | Stage 3.5, 5.5 |
| legal.reviewer@airforce.mil | Legal Reviewer | LEGAL | Stage 7 |
| opr.leadership@airforce.mil | Leadership | LEADERSHIP | Stage 9 |
| afdpo.publisher@airforce.mil | Publisher | PUBLISHER | Stage 10 |
| admin@airforce.mil | Admin | ADMIN | All stages |

## Verification

After applying the fix, you can verify it's working by:

1. **Check Database**:
```sql
SELECT u.email, r.name, r."roleType"
FROM users u
JOIN roles r ON u."roleId" = r.id
WHERE u.email = 'ao1@airforce.mil';

-- Expected output:
-- email: ao1@airforce.mil
-- name: Action Officer
-- roleType: ACTION_OFFICER
```

2. **Check API Response**:
```bash
# Login as ao1
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ao1@airforce.mil","password":"testpass123"}'

# Get user info (use accessToken from above)
curl http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Should return:
# {
#   "user": {
#     "role": {
#       "name": "Action Officer",
#       "roleType": "ACTION_OFFICER"  ✅
#     }
#   }
# }
```

3. **Check Frontend**:
Open browser DevTools Console:
```javascript
// After logging in as ao1
console.log(userRole);
// Should show: { role: "Action Officer", roleType: "ACTION_OFFICER" }
```

## Related Files Changed

1. `backend/prisma/schema.prisma` - Added new RoleType enum values
2. `backend/prisma/seed-complete.ts` - Created proper Air Force roles
3. `backend/src/controllers/auth/authController.ts` - Fixed roleType handling
4. `backend/prisma/migrations/20251007000000_add_workflow_role_types/migration.sql` - Database migration

## Notes

- The fix preserves backward compatibility by using a fallback: `roleType || name.toUpperCase()`
- Richmond DMS users (admin@richmond-dms.com, etc.) are unaffected
- All Air Force workflow users now have explicit roleType values
- The schema now supports all workflow stages from the 12-stage Air Force workflow
