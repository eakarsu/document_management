  # Hierarchical Distributed Workflow Testing Manual

## Overview
This manual provides comprehensive testing procedures for the 10-stage hierarchical distributed Air Force document review workflow with organizational gatekeepers and ownership transfer capabilities.

## Recent Updates (September 16, 2025)
- ✅ Fixed OPR user permissions - added `document:view` permission
- ✅ Implemented generic workflow reset functionality
- ✅ Fixed action button labels display issue
- ✅ Added generic workflow definition detection from multiple sources
- ✅ Backend now supports database-stored workflows (not just file-based)
- ✅ Hot reload enabled for both frontend and backend development
- ✅ Action buttons now display proper labels (Submit to PCM, Approve for Coordination, etc.)

## Workflow Configuration
- **Workflow ID**: `hierarchical-distributed-review` or `hierarchical-distributed-workflow`
- **Total Stages**: 10
- **Key Features**:
  - Generic workflow management (works with any workflow type)
  - Ownership transfer between Action Officers
  - PCM gatekeeper at OPR level
  - Front Office gatekeepers at organization level
  - Two coordination rounds with feedback incorporation
  - Legal review with post-legal update
  - Leadership signature requirement
  - AFDPO final publication
  - Reset to start functionality
  - Hot reload for development

## Test Accounts
All test accounts use password: `testpass123`

### Stage 1: Action Officers
- **ao1@airforce.mil** - Primary Action Officer
- **ao2@airforce.mil** - Secondary Action Officer (for transfer testing)

### Stage 2: PCM Gatekeeper
- **pcm@airforce.mil** - Program Control Manager

### Stage 3 & 5: Front Office Gatekeepers
- **ops.frontoffice@airforce.mil** - Operations Front Office
- **log.frontoffice@airforce.mil** - Logistics Front Office
- **fin.frontoffice@airforce.mil** - Finance Front Office
- **per.frontoffice@airforce.mil** - Personnel Front Office

### Stage 3 & 5: Coordinator
- **coordinator1@airforce.mil** - Primary Coordinator

### Stage 3 & 5: Sub-Reviewers
- **ops.reviewer1@airforce.mil** - Operations Sub-Reviewer
- **ops.reviewer2@airforce.mil** - Operations Sub-Reviewer
- **log.reviewer1@airforce.mil** - Logistics Sub-Reviewer
- **fin.reviewer1@airforce.mil** - Finance Sub-Reviewer
- **per.reviewer1@airforce.mil** - Personnel Sub-Reviewer

### Stage 7: Legal
- **legal.reviewer@airforce.mil** - Legal Compliance Officer

### Stage 9: Leadership
- **opr.leadership@airforce.mil** - OPR Commander

### Stage 10: AFDPO
- **afdpo.publisher@airforce.mil** - AFDPO Publisher

## Stage-by-Stage Testing Procedures

### Stage 1: Initial Draft Preparation
**Actor**: Action Officer (ao1@airforce.mil)

1. **Login** as ao1@airforce.mil
2. **Create New Document**:
   - Navigate to Documents page
   - Click "New Document"
   - Enter title: "AF Policy Directive Test [Date]"
   - Enter content: Sample policy content
   - Save document

3. **Test Ownership Transfer** (Optional):
   - Click "Transfer Ownership" button
   - Select ao2@airforce.mil as new owner
   - Confirm transfer
   - Verify: Document now shows ao2 as owner
   - Login as ao2@airforce.mil to verify access

4. **Submit to PCM**:
   - Click "Submit to PCM" button
   - Add submission note: "Initial draft ready for PCM review"
   - Confirm submission
   - Verify: Document status changes to "Pending PCM Review"

### Stage 2: PCM Review (OPR Gatekeeper)
**Actor**: PCM (pcm@airforce.mil)

1. **Login** as pcm@airforce.mil
2. **Review Document**:
   - Check dashboard for pending review task
   - Click on document to review
   - Examine content for completeness

3. **Decision Point**:
   - **Approve**: Click "Approve for Coordination"
     - Document advances to Stage 3
   - **Reject**: Click "Return to AO"
     - Add feedback comments
     - Document returns to Stage 1

### Stage 3: First Coordination - Distribution Phase
**Actor**: Coordinator (coordinator1@airforce.mil)

1. **Login** as coordinator1@airforce.mil
2. **Review Distribution Task**:
   - Check dashboard for distribution task
   - Click "Distribute to Sub-Reviewers"

3. **Select Organizations**:
   - Select front offices to distribute to:
     - ✓ Operations Front Office
     - ✓ Logistics Front Office
     - ✓ Finance Front Office
     - ✓ Personnel Front Office
   - Click "Distribute"

#### Sub-Stage 3.1-3.4: Front Office Reviews
**Actors**: Front Office Gatekeepers

For each organization (Operations, Logistics, Finance, Personnel):

1. **Login** as [org].frontoffice@airforce.mil
2. **Review Document**:
   - Check inbox for document
   - Review for organizational impact

3. **Decision**:
   - **Approve and Route**: Click "Approve and Route to Sub-Reviewers"
   - **Reject**: Click "Reject" with feedback

#### Sub-Stage 3.1.1-3.4.1: Department Sub-Reviews
**Actors**: Sub-Reviewers

1. **Login** as [org].reviewer1@airforce.mil
2. **Review Document**:
   - Check for department-specific issues
   - Add feedback comments
   - Click "Submit Feedback"

### Stage 4: OPR Feedback Incorporation
**Actor**: Action Officer (ao1@airforce.mil or current owner)

1. **Login** as Action Officer
2. **Review All Feedback**:
   - View consolidated feedback from all reviewers
   - Download feedback report

3. **Incorporate Changes**:
   - Edit document based on feedback
   - Track changes made
   - Create updated version

4. **Submit Updated Draft**:
   - Click "Submit Updated Draft"
   - Add revision notes
   - Document advances to Stage 5

### Stage 5: Second Coordination - Distribution Phase
**Actor**: Coordinator (coordinator1@airforce.mil)

1. **Repeat Stage 3 Process**:
   - Distribute updated draft to same organizations
   - Front offices review changes
   - Sub-reviewers verify feedback incorporation

### Stage 6: OPR Second Update
**Actor**: Action Officer

1. **Review Second Round Feedback**:
   - Check for any remaining issues
   - Make final updates

2. **Submit to Legal**:
   - Click "Submit to Legal Review"
   - Document advances to Stage 7

### Stage 7: Legal Review & Approval
**Actor**: Legal Reviewer (legal.reviewer@airforce.mil)

1. **Login** as legal.reviewer@airforce.mil
2. **Legal Compliance Check**:
   - Review for legal issues
   - Check regulatory compliance
   - Verify proper citations

3. **Decision**:
   - **Approve**: Click "Legal Approval"
   - **Reject**: Click "Return with Legal Concerns"

### Stage 8: Post-Legal OPR Update
**Actor**: Action Officer

1. **Address Legal Feedback**:
   - Incorporate any legal requirements
   - Make final adjustments

2. **Prepare for Leadership**:
   - Create executive summary
   - Prepare signature package

3. **Submit to Leadership**:
   - Click "Submit to OPR Leadership"

### Stage 9: OPR Leadership Final Review & Signature
**Actor**: OPR Leadership (opr.leadership@airforce.mil)

1. **Login** as opr.leadership@airforce.mil
2. **Final Review**:
   - Review complete package
   - Check executive summary

3. **Decision**:
   - **Sign and Approve**: Apply digital signature
   - **Reject**: Return to Stage 8 with guidance

### Stage 10: AFDPO Publication
**Actor**: AFDPO Publisher (afdpo.publisher@airforce.mil)

1. **Login** as afdpo.publisher@airforce.mil
2. **Final Publication Check**:
   - Verify formatting
   - Check publication standards

3. **Publish**:
   - Click "Publish Document"
   - Assign publication number
   - Archive in repository

## Test Scenarios

### Scenario 1: Happy Path
Complete all stages with approvals at each gatekeeper point.

**Expected Duration**: 45-60 minutes
**Success Criteria**: Document published with all approvals logged

### Scenario 2: PCM Rejection
PCM rejects at Stage 2, AO revises and resubmits.

**Test Points**:
- Document returns to Stage 1
- AO can edit and resubmit
- Rejection reason is logged

### Scenario 3: Front Office Rejection
Operations Front Office rejects during first coordination.

**Test Points**:
- Other front offices can still review
- Rejection feedback is captured
- AO sees rejection in Stage 4

### Scenario 4: Ownership Transfer
Transfer document ownership from ao1 to ao2 at Stage 1.

**Test Points**:
- ao2 becomes new owner
- ao1 loses edit access
- Transfer is logged in history

### Scenario 5: Legal Rejection
Legal rejects at Stage 7, document returns to Stage 6.

**Test Points**:
- Legal concerns are documented
- AO can address and resubmit
- Legal re-reviews after updates

### Scenario 6: Leadership Rejection
Leadership rejects at Stage 9, returns to Stage 8.

**Test Points**:
- Leadership guidance is captured
- AO can make executive-level changes
- Document maintains version history

## Verification Checklist

### System Features
- [ ] All 10 stages are accessible
- [ ] Gatekeepers can approve/reject
- [ ] Ownership transfer works
- [ ] Distribution to multiple reviewers works
- [ ] Feedback is properly collected
- [ ] Document versioning is maintained
- [ ] Signature capability functions
- [ ] Publication assigns proper numbering

### Access Control
- [ ] Only assigned roles can access stages
- [ ] Gatekeepers see documents in their queue
- [ ] Sub-reviewers only see distributed documents
- [ ] Ownership transfer changes permissions
- [ ] Rejected documents return to correct stage

### Notifications
- [ ] Stage completion notifications sent
- [ ] Assignment notifications received
- [ ] Rejection notifications with reasons
- [ ] Ownership transfer notifications
- [ ] Distribution notifications to sub-reviewers

### Audit Trail
- [ ] All actions are logged
- [ ] Timestamps are accurate
- [ ] User actions are attributed
- [ ] Comments and feedback are preserved
- [ ] Version history is complete

## Troubleshooting

### Common Issues

1. **Can't see document in dashboard**:
   - Verify user has correct role
   - Check workflow stage assignment
   - Ensure document is at correct stage

2. **Distribution not working**:
   - Verify front office gatekeepers exist
   - Check sub-reviewer accounts active
   - Ensure coordinator role permissions

3. **Ownership transfer fails**:
   - Target user must have ACTION_OFFICER role
   - Document must be at Stage 1
   - Original owner must initiate transfer

4. **Signature not applying**:
   - User must have LEADERSHIP role
   - Document must be at Stage 9
   - All prior stages must be complete

## Performance Metrics

Track these metrics during testing:

- **Stage Transition Time**: Average time between stages
- **Rejection Rate**: Percentage of rejections per stage
- **Feedback Volume**: Number of comments per review cycle
- **Total Workflow Duration**: Start to publication time
- **User Response Time**: Time from assignment to action

## Test Data Reset

To reset test environment:

```bash
# Clear workflow instances
node clear-workflow-instances.js

# Recreate test users
node setup-hierarchical-workflow.js

# Create fresh test document
node create-test-document.js
```

## Contact Information

For issues or questions during testing:
- Workflow Administrator: admin@airforce.mil
- Technical Support: support@airforce.mil
- Test Coordinator: test.coordinator@airforce.mil

---

Last Updated: September 16, 2025
Version: 1.1
