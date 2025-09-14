# 📘 OPR Workflow System User Manual
## Document Management System - OPR 8-Stage Review Process

---

## Table of Contents
1. [Overview](#overview)
2. [Default OPR Workflow](#default-opr-workflow)
3. [User Roles & Testing](#user-roles--testing)
4. [Step-by-Step Testing Guide](#step-by-step-testing-guide)
5. [Using the Workflow](#using-the-workflow)
6. [Troubleshooting](#troubleshooting)
7. [API Reference](#api-reference)

---

## 🎯 Overview

The Document Management System uses an **8-Stage OPR (Office of Primary Responsibility) Review Workflow** that follows Air Force document processing procedures. This workflow ensures proper coordination, review, and approval of official documents.

### Key Features:
- **8-Stage Process** - Complete OPR workflow from author to publication
- **Role-Based Access** - Different permissions for each role
- **Multi-Round Coordination** - Multiple coordination rounds with OPR
- **Legal Review Integration** - Dedicated legal review stage
- **AFDPO Publication** - Final publication to Air Force Departmental Publishing Office
- **Complete Audit Trail** - Track all actions and decisions
- **Admin Override** - Admins can move documents through any stage

---

## 🏛️ Default OPR Workflow

### The 8-Stage OPR Process:

```
1. OPR (Author) → 2. To Coordinators (1st) → 3. Back to OPR
       ↑                                              ↓
8. To AFDPO ← 7. Back to OPR ← 6. To Legal ← 5. Back to OPR
                                              ↑
                              4. To Coordinators (2nd)
```

### Stage Details:

| Stage | Name | Role(s) | Purpose |
|-------|------|---------|---------|
| 1 | **OPR (Author)** | OPR, Admin | Document creation and initial submission |
| 2 | **To Coordinators (1st Coordination)** | Coordinator, Admin | First round of coordination review |
| 3 | **Back to OPR** | OPR, Admin | Address first coordination feedback |
| 4 | **To Coordinators (2nd Coordination)** | Coordinator, Admin | Second round of coordination review |
| 5 | **Back to OPR** | OPR, Admin | Address second coordination feedback |
| 6 | **To Legal** | Legal, Admin | Legal review and compliance check |
| 7 | **Back to OPR** | OPR, Admin | Address legal feedback |
| 8 | **To AFDPO** | AFDPO, Admin | Final publication (Complete) |

### Workflow Completion:
When a document reaches **Stage 8 (To AFDPO)**, the system displays:
- ✅ **"Document Published"** header (green background)
- **"🎉 Published & Complete"** status
- **"This document has been successfully published to AFDPO and is now complete."**

---

## 👥 User Roles & Testing

### Available Test Users:

| Role | Email | Password | Can Act On Stages |
|------|-------|----------|-------------------|
| **OPR** | `opr@demo.mil` | `password123` | 1, 3, 5, 7 |
| **Coordinator** | `coordinator.test@af.mil` | `password123` | 2, 4 |
| **Legal** | `legal@demo.mil` | `password123` | 6 |
| **AFDPO** | `afdpo.analyst@demo.mil` | `password123` | 8 |
| **Admin** | `admin@demo.mil` | `password123` | All stages (1-8) |

### Alternative Test Users by Role:

#### **OPR Users** (Can act on stages 1, 3, 5, 7):
- `opr@demo.mil` - Primary OPR user
- `opr.chief@af.mil` - OPR Chief
- `opr.deputy@af.mil` - OPR Deputy
- `test-opr@demo.mil` - Test OPR user

#### **Coordinator Users** (Can act on stages 2, 4):
- `coordinator.test@af.mil` - Primary coordinator
- `reviewer.coord1@af.mil` - Coordinator reviewer 1  
- `reviewer.coord2@af.mil` - Coordinator reviewer 2

#### **Legal Users** (Can act on stage 6):
- `legal@demo.mil` - Primary legal reviewer
- `legal.chief@af.mil` - Legal chief
- `legal.compliance@af.mil` - Legal compliance officer

#### **AFDPO Users** (Can act on stage 8):
- `afdpo.analyst@demo.mil` - Primary AFDPO analyst
- `afdpo.chief@af.mil` - AFDPO chief
- `publisher@demo.mil` - Publishing authority

#### **Admin Users** (Can override any stage):
- `admin@demo.mil` - System administrator
- `workflow.admin@demo.mil` - Workflow administrator
- `admin@af.mil` - Air Force admin

### Role Descriptions:

#### 1. **OPR (Office of Primary Responsibility)**
- **Purpose**: Document authors and owners
- **Permissions**: Can initiate workflow, make revisions based on feedback
- **Stages**: 1 (Author), 3 (Back to OPR), 5 (Back to OPR), 7 (Back to OPR)
- **Actions**: Submit for coordination, address feedback, finalize document

#### 2. **Coordinator** 
- **Purpose**: Review and coordinate document content
- **Permissions**: Review documents during coordination rounds
- **Stages**: 2 (1st Coordination), 4 (2nd Coordination)  
- **Actions**: Send back to OPR with feedback, approve for next stage

#### 3. **Legal**
- **Purpose**: Legal compliance and review
- **Permissions**: Review for legal compliance
- **Stages**: 6 (Legal Review)
- **Actions**: Approve or send back to OPR with legal concerns

#### 4. **AFDPO**
- **Purpose**: Final publication authority
- **Permissions**: Final publication approval
- **Stages**: 8 (Final Publication)
- **Actions**: Complete workflow (no buttons - automatic completion)

#### 5. **Admin**
- **Purpose**: System administrators
- **Permissions**: Can override any stage, complete administrative tasks
- **Stages**: All stages (1-8)
- **Actions**: Red "Admin: Move to [Next Stage]" buttons on every stage

---

## 🧪 Step-by-Step Testing Guide

### Complete Workflow Test (Without Admin):

#### **Phase 1: OPR Initiation**
1. **Login as OPR**: `opr@demo.mil` / `password123`
2. **Navigate to any document**
3. **Click "Start Workflow"** button
4. **Verify**: Document starts at Stage 1 "OPR (Author)"
5. **Click "Send to Coordinators"** button
6. **Verify**: Document moves to Stage 2

#### **Phase 2: First Coordination**
1. **Logout and login as Coordinator**: `coordinator.test@af.mil` / `password123`
2. **Navigate to the same document**
3. **Verify**: Document is at Stage 2 "To Coordinators (1st Coordination)"
4. **Verify**: You can see "Send Back to OPR" button
5. **Click "Send Back to OPR"**
6. **Verify**: Document moves to Stage 3

#### **Phase 3: OPR Response to First Coordination**
1. **Logout and login as OPR**: `opr@demo.mil` / `password123`
2. **Navigate to the same document**
3. **Verify**: Document is at Stage 3 "Back to OPR"
4. **Click "Send to Coordinators (2nd Round)"**
5. **Verify**: Document moves to Stage 4

#### **Phase 4: Second Coordination**
1. **Logout and login as Coordinator**: `coordinator.test@af.mil` / `password123`
2. **Navigate to the same document**
3. **Verify**: Document is at Stage 4 "To Coordinators (2nd Coordination)"
4. **Click "Send Back to OPR"**
5. **Verify**: Document moves to Stage 5

#### **Phase 5: OPR Response to Second Coordination**
1. **Logout and login as OPR**: `opr@demo.mil` / `password123`
2. **Navigate to the same document**  
3. **Verify**: Document is at Stage 5 "Back to OPR"
4. **Click "Send to Legal"**
5. **Verify**: Document moves to Stage 6

#### **Phase 6: Legal Review**
1. **Logout and login as Legal**: `legal@demo.mil` / `password123`
2. **Navigate to the same document**
3. **Verify**: Document is at Stage 6 "To Legal" 
4. **Click "Send Back to OPR"**
5. **Verify**: Document moves to Stage 7

#### **Phase 7: Final OPR Review**
1. **Logout and login as OPR**: `opr@demo.mil` / `password123`
2. **Navigate to the same document**
3. **Verify**: Document is at Stage 7 "Back to OPR"
4. **Click "Send to AFDPO"**
5. **Verify**: Document moves to Stage 8

#### **Phase 8: Publication Complete**
1. **Login as any user** and navigate to the document
2. **Verify Final State**:
   - Header shows: **"✅ Document Published"**
   - Background is **green**
   - Status shows: **"🎉 Published & Complete"**
   - Description: **"This document has been successfully published to AFDPO and is now complete."**
   - No action buttons available (workflow complete)

### **Quick Admin Test**:
1. **Login as Admin**: `admin@demo.mil` / `password123` 
2. **Start workflow on any document**
3. **Verify**: You see both regular buttons AND red "Admin: Move to [Next Stage]" buttons
4. **Click any admin button** to advance stages quickly
5. **Test**: Admin can move through all 8 stages rapidly

---

## 📋 Using the Workflow

### Starting a Workflow

#### From Document Page:
1. **Open any document**
2. **Look for "Workflow Management" section**
3. **Click "Start Workflow"** button
4. **Workflow begins at Stage 1: OPR (Author)**

#### Workflow Display:
```
┌──────────────────────────────────────┐
│ ✅ Document Published                │
│ This document has been successfully  │
│ published to AFDPO and is complete.  │
├──────────────────────────────────────┤
│ Progress: Stage 8 of 8               │
│ ████████████████████████ 100%       │
├──────────────────────────────────────┤
│ Status: 🎉 Published & Complete      │
│ Progress: 8 of 8 stages              │
│ 100% Complete                        │
└──────────────────────────────────────┘
```

### Workflow Features:

#### Progress Tracking
- **Visual progress bar** showing completion
- **Stage counter** (X of 8)
- **Percentage complete**
- **Current status** or completion message

#### Role-Based Actions
- **Regular users**: See buttons only for their authorized stages
- **Admin users**: See red "Admin: Move to [Next Stage]" buttons on all stages
- **Button colors**: 
  - Blue: Regular actions
  - Red: Admin override actions
  - Green: Approval actions
  - Orange: Reject actions

#### Stage Restrictions
- **OPR users**: Can only act on stages 1, 3, 5, 7
- **Coordinators**: Can only act on stages 2, 4
- **Legal**: Can only act on stage 6
- **AFDPO**: Stage 8 auto-completes (no actions needed)
- **Admins**: Can act on any stage

---

## 🔍 Troubleshooting

### Common Issues:

#### **Cannot See Action Buttons**
**Cause**: User role doesn't match current stage requirements
**Solution**: 
1. Check current stage and required roles
2. Login with appropriate user role
3. Or use admin account for testing

#### **Workflow Won't Start**
**Causes**:
- Already has an active workflow
- Insufficient permissions
- Workflow configuration missing

**Solutions**:
1. **Reset existing workflow**: Click "Reset Workflow" button
2. **Check permissions**: Ensure user can start workflows  
3. **Verify workflow exists**: Check that `opr-review-workflow.json` exists
4. **Check logs**: Look in browser console for errors

#### **Buttons Disabled/Grayed Out**
**Causes**:
- Comments required but not provided
- Processing in progress
- Validation rules not met

**Solutions**:
1. **Add comments** if required by workflow
2. **Wait** for processing to complete
3. **Check validation** requirements

#### **Wrong Workflow Loaded**
**Solution**:
1. **Hard refresh**: Ctrl+Shift+R (PC) or Cmd+Shift+R (Mac)
2. **Clear browser cache**
3. **Restart server** if needed

---

## 📡 API Reference

### Workflow Endpoints

#### **Get Workflow Status**
```bash
GET /api/workflow-instances/{documentId}
Authorization: Bearer {token}

Response:
{
  "active": true,
  "workflowId": "opr-review-workflow",
  "currentStageId": "3",
  "currentStageName": "Back to OPR",
  "stageOrder": 3,
  "totalStages": 8,
  "history": [...],
  "startedAt": "2025-01-14T10:30:00Z"
}
```

#### **Start OPR Workflow**
```bash
POST /api/workflow-instances/{documentId}/start
Authorization: Bearer {token}

Body:
{
  "workflowId": "opr-review-workflow"
}
```

#### **Advance to Next Stage**
```bash
POST /api/workflow-instances/{documentId}/advance
Authorization: Bearer {token}

Body:
{
  "targetStageId": "4",
  "action": "Send to Coordinators (2nd Round)",
  "metadata": {
    "comment": "Ready for second coordination"
  }
}
```

#### **Reset Workflow**
```bash
POST /api/workflow-instances/{documentId}/reset
Authorization: Bearer {token}
```

---

## 🎯 Testing Checklist

### Pre-Test Setup:
- [ ] All test users created (OPR, Coordinator, Legal, AFDPO, Admin)
- [ ] Document available for testing
- [ ] OPR workflow configured as default
- [ ] Backend server running
- [ ] Frontend application accessible

### Role-Based Testing:
- [ ] **OPR**: Can start workflow, act on stages 1,3,5,7
- [ ] **Coordinator**: Can act on stages 2,4 only
- [ ] **Legal**: Can act on stage 6 only  
- [ ] **AFDPO**: Stage 8 shows completion (no actions)
- [ ] **Admin**: Can act on all stages with red override buttons

### Complete Workflow Test:
- [ ] Stage 1: OPR starts workflow
- [ ] Stage 2: Coordinator reviews and sends back
- [ ] Stage 3: OPR addresses feedback
- [ ] Stage 4: Coordinator second review
- [ ] Stage 5: OPR addresses second feedback
- [ ] Stage 6: Legal review
- [ ] Stage 7: OPR final review
- [ ] Stage 8: AFDPO publication (green completion state)

### Admin Testing:
- [ ] Admin can see red override buttons on all stages
- [ ] Admin can advance workflow at any stage
- [ ] Admin buttons work alongside regular buttons
- [ ] Admin can reset workflow

### UI/UX Testing:
- [ ] Progress bar updates correctly
- [ ] Stage names display properly  
- [ ] Button colors match role types
- [ ] Final stage shows green "Published" state
- [ ] History shows all transitions
- [ ] No console errors

---

**Classification:** UNCLASSIFIED  
**Distribution:** All Users  
**Last Updated:** January 14, 2025  
**Workflow Version:** OPR Review v1.0.0