# Distributed Workflow System - Comprehensive Testing Manual

## Table of Contents
1. [Overview](#overview)
2. [Test Environment Setup](#test-environment-setup)
3. [User Roles and Test Accounts](#user-roles-and-test-accounts)
4. [Test Scenarios](#test-scenarios)
5. [Test Cases](#test-cases)
6. [Verification Checklist](#verification-checklist)
7. [Troubleshooting Guide](#troubleshooting-guide)

---

## Overview

This document provides comprehensive testing procedures for the new Distributed Review Workflow system with sub-reviewer distribution capabilities. The system supports two workflow types:
- **Standard OPR Review Workflow**: Traditional 8-stage sequential review
- **Distributed Review Workflow**: Enhanced workflow with coordinator-managed sub-reviewer distribution

### Key Features to Test
- Workflow selection during document publishing
- Sub-reviewer distribution at stages 2 and 4
- Organization-based reviewer assignment
- Parallel review processing
- Feedback aggregation
- Role-based access control

---

## Test Environment Setup

### 1. Prerequisites
```bash
# Backend Requirements
- Node.js 18+
- PostgreSQL database
- Redis server (for caching)

# Frontend Requirements
- Next.js 14+
- Modern web browser (Chrome, Firefox, Safari, Edge)
```

### 2. Start Services
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev

# Verify services
- Backend: http://localhost:4000
- Frontend: http://localhost:3000
```

### 3. Database Setup
Ensure the following tables exist:
- users (with role assignments)
- documents
- workflow_instances
- workflow_stage_history
- workflow_feedback

---

## User Roles and Test Accounts

### Required Test Users

| Role | Email | Password | Organization | Purpose |
|------|-------|----------|--------------|---------|
| OPR | opr@airforce.mil | test123 | Air Force | Document author/owner |
| Coordinator | coord1@airforce.mil | test123 | Air Force | Stage 2 coordinator |
| Coordinator | coord2@airforce.mil | test123 | Air Force | Stage 4 coordinator |
| Sub-Reviewer | ops1@airforce.mil | test123 | Operations | Operations reviewer |
| Sub-Reviewer | ops2@airforce.mil | test123 | Operations | Operations backup |
| Sub-Reviewer | log1@airforce.mil | test123 | Logistics | Logistics reviewer |
| Sub-Reviewer | fin1@airforce.mil | test123 | Finance | Finance reviewer |
| Sub-Reviewer | per1@airforce.mil | test123 | Personnel | Personnel reviewer |
| Legal | legal@airforce.mil | test123 | Legal | Legal reviewer |
| AFDPO | afdpo@airforce.mil | test123 | Publishing | Final publisher |
| Admin | admin@airforce.mil | test123 | Air Force | System admin |

---

## Test Scenarios

### Scenario 1: Complete Distributed Workflow Cycle

**Objective**: Test full document lifecycle through distributed workflow

**Steps**:
1. OPR creates and submits document
2. Coordinator at stage 2 distributes to sub-reviewers
3. Sub-reviewers complete their reviews
4. OPR reviews feedback and revises
5. Coordinator at stage 4 redistributes
6. Sub-reviewers complete second round
7. OPR finalizes document
8. Legal reviews
9. OPR addresses legal feedback
10. AFDPO publishes

### Scenario 2: Partial Distribution

**Objective**: Test distribution to subset of organizations

**Steps**:
1. Start workflow
2. At stage 2, distribute only to Operations and Finance
3. Verify other organizations don't receive document
4. Complete reviews from selected organizations
5. Verify workflow advances correctly

### Scenario 3: Parallel Review Testing

**Objective**: Verify simultaneous review capabilities

**Steps**:
1. Distribute to all 4 organizations
2. Have multiple reviewers work simultaneously
3. Submit feedback in different order than distribution
4. Verify all feedback is collected correctly

### Scenario 4: Access Control Verification

**Objective**: Ensure proper role-based restrictions

**Steps**:
1. Test sub-reviewer cannot see undistributed documents
2. Test coordinator cannot edit document content
3. Test OPR can see all feedback
4. Test Legal only sees document at stage 6

---

## Test Cases

### TC-001: Workflow Selection
**Priority**: High
**Type**: Functional

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Login as OPR | Dashboard displays | |
| 2 | Navigate to Documents | Document list shows | |
| 3 | Select a document | Document details open | |
| 4 | Click "Submit for Publishing" | Publishing dialog opens | |
| 5 | View workflow dropdown | Both workflows listed | |
| 6 | Select "Distributed Review Workflow" | Workflow details show 8 stages | |
| 7 | Submit | Workflow instance created | |

### TC-002: Stage 2 Distribution
**Priority**: High
**Type**: Functional

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Login as Coordinator | Dashboard shows pending tasks | |
| 2 | Open stage 2 document | Distribution interface loads | |
| 3 | View available organizations | 4 organizations listed | |
| 4 | Select Operations and Logistics | Checkboxes marked | |
| 5 | Choose specific reviewers | Reviewer dropdown populated | |
| 6 | Click "Distribute" | Success message appears | |
| 7 | Verify email notifications | Selected reviewers notified | |

### TC-003: Sub-Reviewer Access
**Priority**: High
**Type**: Security

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Login as ops1@airforce.mil | Sub-reviewer dashboard | |
| 2 | Check document list | Only distributed docs shown | |
| 3 | Try accessing other documents via URL | Access denied message | |
| 4 | Open distributed document | Read-only view with comment option | |
| 5 | Submit feedback | Feedback saved successfully | |
| 6 | Try to edit document | Edit buttons disabled | |

### TC-004: Feedback Aggregation
**Priority**: High
**Type**: Functional

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Complete all sub-reviews | All feedback submitted | |
| 2 | Login as Coordinator | View aggregation dashboard | |
| 3 | Click "Collect & Return" | Feedback aggregated | |
| 4 | Login as OPR | Stage 3 notification received | |
| 5 | View feedback | Organized by organization | |
| 6 | Verify all feedback present | All 4 org feedbacks shown | |

### TC-005: Stage Progression
**Priority**: High
**Type**: Functional

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Complete stage 1 (OPR) | Advances to stage 2 | |
| 2 | Complete distribution (stage 2) | Remains in stage 2 | |
| 3 | Complete all sub-reviews | Can advance to stage 3 | |
| 4 | Complete stage 3 (OPR revision) | Advances to stage 4 | |
| 5 | Repeat distribution (stage 4) | Similar to stage 2 | |
| 6 | Complete stage 5-8 | Normal progression | |

### TC-006: Deadline Management
**Priority**: Medium
**Type**: Functional

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Distribute with 24hr deadline | Deadline set correctly | |
| 2 | Wait 20 hours | Warning notification sent | |
| 3 | Wait 24 hours | Overdue status shown | |
| 4 | Complete overdue review | Still accepted | |
| 5 | Check reports | Delay documented | |

### TC-007: Workflow Comparison
**Priority**: Medium
**Type**: Functional

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Start standard workflow | 8 stages, no distribution | |
| 2 | Start distributed workflow | 8 stages with distribution | |
| 3 | Compare stage 2 | Standard: direct review, Distributed: distribution UI | |
| 4 | Compare permissions | Different based on workflow | |

### TC-008: Error Handling
**Priority**: Medium
**Type**: Negative Testing

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Try to advance without distribution | Error: distribution required | |
| 2 | Try to collect incomplete reviews | Error: pending reviews exist | |
| 3 | Submit empty feedback | Validation error | |
| 4 | Distribute to no one | Error: select at least one | |

### TC-009: Concurrent Access
**Priority**: Low
**Type**: Performance

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Two coordinators access same doc | Both can view | |
| 2 | One distributes | Other sees updated state | |
| 3 | Multiple reviewers submit simultaneously | All feedback saved | |
| 4 | Check for race conditions | No data loss | |

### TC-010: Workflow Reset
**Priority**: Low
**Type**: Functional

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Admin accesses workflow | Admin controls visible | |
| 2 | Reset to stage 1 | All progress cleared | |
| 3 | Check sub-reviewer access | Access revoked | |
| 4 | Restart workflow | Fresh start successful | |

---

## Verification Checklist

### Pre-Testing Checklist
- [ ] All test users created and active
- [ ] Sample documents uploaded
- [ ] Both workflow JSON files present in backend/workflows/
- [ ] Database migrations completed
- [ ] Email service configured (or mock enabled)

### Functional Testing
- [ ] Workflow selection in publishing form
- [ ] Both workflows appear with correct metadata
- [ ] Stage count displays correctly (8 stages)
- [ ] Workflow type shows (standard vs distributed)
- [ ] Distribution UI appears at stages 2 and 4
- [ ] Organization list populates correctly
- [ ] Sub-reviewer selection works
- [ ] Distribution confirmation received
- [ ] Email notifications sent
- [ ] Sub-reviewers can access distributed documents
- [ ] Sub-reviewers cannot access other documents
- [ ] Feedback submission works
- [ ] Feedback aggregation functions
- [ ] OPR can view all feedback
- [ ] Stage progression follows rules
- [ ] Legal review at stage 6 works
- [ ] AFDPO publishing at stage 8 works

### Security Testing
- [ ] Role-based access enforced
- [ ] Sub-reviewers have limited visibility
- [ ] Coordinators cannot edit documents
- [ ] Only assigned users can act on stages
- [ ] URL manipulation prevented
- [ ] API endpoints require authentication
- [ ] Cross-organization isolation maintained

### UI/UX Testing
- [ ] Workflow selection dropdown styled correctly
- [ ] Stage indicators clear
- [ ] Distribution interface intuitive
- [ ] Feedback display organized
- [ ] Progress tracking visible
- [ ] Error messages helpful
- [ ] Success confirmations clear
- [ ] Loading states shown
- [ ] Mobile responsive (if applicable)

### Integration Testing
- [ ] Backend API serves both workflows
- [ ] Frontend correctly displays workflow options
- [ ] Database stores workflow instances
- [ ] State transitions persist
- [ ] Feedback storage works
- [ ] Notification system triggers
- [ ] Audit trail maintained

---

## Troubleshooting Guide

### Common Issues and Solutions

#### Issue: Workflows not appearing in dropdown
**Solution**:
1. Check if workflow JSON files exist in `backend/workflows/`
2. Verify backend server is running
3. Check browser console for API errors
4. Ensure user has permission to create workflows

#### Issue: Distribution button disabled
**Solution**:
1. Verify user role is "Coordinator"
2. Check workflow is at stage 2 or 4
3. Ensure at least one organization selected
4. Verify sub-reviewers are available

#### Issue: Sub-reviewer cannot see document
**Solution**:
1. Confirm distribution was completed
2. Check sub-reviewer's organization matches
3. Verify email notification was sent
4. Ensure sub-reviewer is logged in correctly

#### Issue: Cannot advance past stage 2
**Solution**:
1. Verify all distributed reviews completed
2. Check "Collect & Return" was clicked
3. Ensure no pending sub-reviews
4. Review error messages in console

#### Issue: Feedback not aggregating
**Solution**:
1. Confirm all sub-reviews submitted
2. Check database for feedback records
3. Verify aggregation service running
4. Review coordinator permissions

### Log Locations
- Backend logs: `backend/logs/server.log`
- Frontend console: Browser Developer Tools
- Database queries: `backend/logs/queries.log`
- Workflow events: `backend/logs/workflow-events.log`

### Debug Commands
```bash
# Check workflow status
curl http://localhost:4000/api/workflow-instances/[documentId]

# List available workflows
curl http://localhost:4000/api/workflows

# View user permissions
curl http://localhost:4000/api/users/[userId]/permissions

# Check distribution status
curl http://localhost:4000/api/distributions/[stageId]
```

---

## Test Execution Log Template

### Test Session Information
- **Date**: ___________
- **Tester**: ___________
- **Environment**: ___________
- **Build Version**: ___________

### Test Results Summary
| Test Case | Status | Notes |
|-----------|--------|-------|
| TC-001 | | |
| TC-002 | | |
| TC-003 | | |
| TC-004 | | |
| TC-005 | | |
| TC-006 | | |
| TC-007 | | |
| TC-008 | | |
| TC-009 | | |
| TC-010 | | |

### Issues Found
1. **Issue ID**: ___________
   - **Severity**: High/Medium/Low
   - **Description**: ___________
   - **Steps to Reproduce**: ___________
   - **Expected Result**: ___________
   - **Actual Result**: ___________

### Sign-off
- **QA Lead**: ___________ Date: ___________
- **Development Lead**: ___________ Date: ___________
- **Product Owner**: ___________ Date: ___________

---

## Appendix A: Test Data

### Sample Document Content
```json
{
  "title": "Test Policy Document",
  "content": "This is a test document for workflow testing.",
  "type": "POLICY",
  "classification": "UNCLASSIFIED",
  "author": "opr@airforce.mil"
}
```

### Sample Feedback
```json
{
  "reviewer": "ops1@airforce.mil",
  "organization": "Operations",
  "feedback": "Recommend clarification in section 2.1",
  "recommendation": "APPROVE_WITH_CHANGES",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## Appendix B: Workflow Stage Reference

### Standard OPR Review Workflow
1. Initial Draft Preparation (OPR)
2. First Coordination Review (Coordinator) - Direct review
3. OPR Review & Revision
4. Second Coordination Review (Coordinator) - Direct review
5. OPR Final Revision
6. Legal Review & Approval
7. OPR Pre-Publication Review
8. AFDPO Publication

### Distributed Review Workflow
1. Initial Draft Preparation (OPR)
2. First Coordination - **Distribution Phase** (Coordinator)
3. OPR Review & Revision (Post 1st Coordination)
4. Second Coordination - **Distribution Phase** (Coordinator)
5. OPR Final Revision (Post 2nd Coordination)
6. Legal Review & Approval
7. OPR Pre-Publication Review
8. AFDPO Publication Review & Approval

**Key Difference**: Stages 2 and 4 involve distribution to sub-reviewers rather than direct coordinator review.

---

## Notes

- This testing manual should be updated as new features are added
- Report all bugs to the development team immediately
- Keep test data confidential and use only in test environments
- Regular regression testing should be performed after updates