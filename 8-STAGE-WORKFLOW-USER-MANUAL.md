# 📘 8-Stage Workflow User Manual
## Air Force Document Management System

---

## Table of Contents
1. [Overview](#overview)
2. [Workflow Stages](#workflow-stages)
3. [User Roles & Permissions](#user-roles--permissions)
4. [Stage-by-Stage Instructions](#stage-by-stage-instructions)
5. [Feedback Types](#feedback-types)
6. [Common Operations](#common-operations)
7. [Troubleshooting](#troubleshooting)
8. [Quick Reference](#quick-reference)

---

## 🎯 Overview

The 8-Stage Workflow is a structured document approval process designed to ensure thorough review, proper authorization, and compliance with Air Force standards. Each document progresses through eight distinct stages, with specific roles authorized to advance the document at each stage.

### Key Principles:
- **Role-Based Access**: Only authorized roles can advance stages
- **Audit Trail**: Every action is logged and traceable
- **Bidirectional Flow**: Documents can move backward if issues are found
- **Feedback Integration**: Structured feedback at each stage

---

## 📊 Workflow Stages

```
┌─────────────────────┐
│  1. DRAFT CREATION  │ ◄── Initial document creation
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│ 2. INTERNAL COORD.  │ ◄── Internal team review
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│  3. OPR REVISIONS   │ ◄── OPR addresses feedback
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│ 4. EXTERNAL COORD.  │ ◄── External stakeholder review
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│ 5. RESOLUTION REV.  │ ◄── Conflict resolution
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│  6. FINAL APPROVAL  │ ◄── Leadership approval
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│ 7. PUBLICATION DIST │ ◄── Document publication
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│ 8. IMPLEMENTATION   │ ◄── Monitoring & compliance
└─────────────────────┘
```

---

## 👥 User Roles & Permissions

### Role Definitions

| Role | Abbreviation | Primary Responsibilities | Stage Authority |
|------|--------------|-------------------------|-----------------|
| **OPR (Office of Primary Responsibility)** | OPR | Document creation and revision | Stages 1, 3 |
| **Internal Coordinator** | IC | Coordinate internal reviews | Stage 2 |
| **Reviewer** | REV | Provide technical/substantive feedback | Stage 2 (feedback only) |
| **External Coordinator** | EC | Manage external stakeholder input | Stage 4 |
| **Senior Reviewer** | SR | Resolve conflicts and critical issues | Stage 5 |
| **Approver/Commander** | CMD | Final approval authority | Stage 6 |
| **Publisher** | PUB | Document publication and distribution | Stage 7 |
| **Quality Assurance** | QA | Monitor implementation | Stage 8 |
| **Administrator** | ADMIN | System oversight | All stages (override) |

---

## 📋 Stage-by-Stage Instructions

### Stage 1: DRAFT CREATION
**Who:** OPR or Document Author  
**Duration:** Variable (typically 1-2 weeks)

#### Steps:
1. **Create New Document**
   - Click "Create AI Document" on dashboard
   - Select appropriate template (AFI, AFM, AFPD, etc.)
   - Specify number of pages and requirements
   - Generate initial draft

2. **Review Generated Content**
   - Check 5-level hierarchy (1.1.1.1.1)
   - Verify paragraph numbering
   - Ensure proper indentation

3. **Make Initial Edits**
   - Navigate to Document Editor
   - Make necessary changes
   - Save draft periodically

4. **Start Workflow**
   - Click "Start 8-Stage Workflow" button
   - Confirm document is ready for review
   - System assigns workflow ID

5. **Advance to Internal Coordination**
   - Click "Submit for Internal Review"
   - Add transition notes (optional)
   - Document moves to Stage 2

---

### Stage 2: INTERNAL COORDINATION
**Who:** Internal Coordinators and Reviewers  
**Duration:** 5-7 business days

#### For Coordinators:
1. **Access Document**
   - Login with Coordinator credentials
   - Navigate to "My Workflow Tasks"
   - Select document in Stage 2

2. **Assign Reviewers**
   - Click "Manage Reviewers"
   - Select team members by expertise area
   - Set review deadline

3. **Monitor Progress**
   - Track reviewer completion status
   - Send reminders as needed
   - Compile feedback summary

4. **Advance to OPR Revisions**
   - Ensure all reviews complete
   - Click "Send to OPR for Revisions"
   - Include consolidated feedback report

#### For Reviewers:
1. **Access Assigned Document**
   - Check email notification or dashboard
   - Click on document link

2. **Review Content**
   - Read through assigned sections
   - Check technical accuracy
   - Verify compliance with standards

3. **Submit Feedback**
   - Click "Add Feedback" button
   - Select feedback type:
     - **A** (Administrative) - Grammar, formatting
     - **S** (Substantive) - Content changes
     - **C** (Critical) - Must fix issues
   - Enter specific comments
   - Reference paragraph numbers

---

### Stage 3: OPR REVISIONS
**Who:** OPR Only  
**Duration:** 3-5 business days

#### Steps:
1. **Review All Feedback**
   - Access feedback panel
   - Sort by type (Critical first)
   - Review each comment

2. **Process Critical Feedback**
   - Critical items MUST be addressed
   - Options:
     - Accept and implement change
     - Provide written justification for rejection
     - Call reviewer to discuss (required for downgrade)

3. **Address Substantive Feedback**
   - Evaluate each suggestion
   - Implement or provide rationale
   - Update document accordingly

4. **Handle Administrative Feedback**
   - Fix grammar and formatting
   - Update paragraph numbering if needed

5. **Document Changes**
   - Use revision tracking
   - Add comments explaining major changes
   - Update version number

6. **Submit for External Review**
   - Verify all critical items resolved
   - Click "Submit to External Coordination"
   - Include revision summary

---

### Stage 4: EXTERNAL COORDINATION
**Who:** External Coordinators  
**Duration:** 10-15 business days

#### Steps:
1. **Identify Stakeholders**
   - Review distribution list
   - Add external agencies
   - Include subject matter experts

2. **Distribute for Review**
   - Generate review packages
   - Send via secure channels
   - Set response deadline

3. **Track Responses**
   - Log incoming feedback
   - Follow up on missing responses
   - Consolidate comments

4. **Categorize Feedback**
   - Group by theme/section
   - Identify conflicts
   - Prioritize by impact

5. **Prepare Resolution Package**
   - Summarize all feedback
   - Highlight conflicts
   - Recommend solutions

6. **Advance to Resolution**
   - Click "Submit for Resolution Review"
   - Attach feedback summary
   - Flag critical issues

---

### Stage 5: RESOLUTION REVIEW
**Who:** Senior Reviewers  
**Duration:** 3-5 business days

#### Steps:
1. **Review Conflict Areas**
   - Examine conflicting feedback
   - Assess organizational impacts
   - Consider policy implications

2. **Make Determinations**
   - Resolve conflicts
   - Set final direction
   - Document decisions

3. **Coordinate with Stakeholders**
   - Contact affected parties
   - Explain resolutions
   - Obtain concurrence

4. **Update Document**
   - Implement final changes
   - Ensure consistency
   - Verify compliance

5. **Prepare for Approval**
   - Create executive summary
   - Highlight key changes
   - Note any dissenting views

6. **Submit for Final Approval**
   - Click "Submit to Leadership"
   - Attach decision memorandum
   - Include implementation plan

---

### Stage 6: FINAL APPROVAL
**Who:** Commander/Approving Authority  
**Duration:** 2-3 business days

#### Steps:
1. **Review Package**
   - Read executive summary
   - Review key sections
   - Check resolution of issues

2. **Assess Compliance**
   - Verify policy alignment
   - Check legal requirements
   - Ensure mission support

3. **Make Decision**
   - **Approve**: Sign and advance
   - **Reject**: Return with guidance
   - **Conditional**: Approve with changes

4. **Sign Document**
   - Apply digital signature
   - Add approval date
   - Include any conditions

5. **Authorize Publication**
   - Click "Approve for Publication"
   - Set effective date
   - Specify distribution

---

### Stage 7: PUBLICATION & DISTRIBUTION
**Who:** Publishers/Administrators  
**Duration:** 1-2 business days

#### Steps:
1. **Prepare Final Version**
   - Apply official formatting
   - Add headers/footers
   - Insert signature blocks

2. **Generate Formats**
   - Create PDF version
   - Generate web version
   - Prepare print version

3. **Publish Document**
   - Upload to official repository
   - Update document database
   - Archive previous version

4. **Distribute**
   - Send to distribution list
   - Post notifications
   - Update relevant systems

5. **Confirm Publication**
   - Verify accessibility
   - Check all formats
   - Document publication date

6. **Advance to Monitoring**
   - Click "Begin Implementation"
   - Set monitoring parameters
   - Assign QA team

---

### Stage 8: IMPLEMENTATION MONITORING
**Who:** Quality Assurance Team  
**Duration:** Ongoing (typically 90 days initial)

#### Steps:
1. **Establish Metrics**
   - Define compliance indicators
   - Set measurement frequency
   - Create reporting schedule

2. **Monitor Adoption**
   - Track document access
   - Survey users
   - Collect feedback

3. **Identify Issues**
   - Document problems
   - Assess impacts
   - Recommend corrections

4. **Report Status**
   - Create monitoring reports
   - Brief leadership
   - Update stakeholders

5. **Initiate Updates (if needed)**
   - Document required changes
   - Start new workflow cycle
   - Link to original document

---

## 💬 Feedback Types

### Administrative (A)
- Spelling/grammar corrections
- Formatting issues
- Paragraph numbering
- Reference updates
- **Impact:** Low
- **Resolution:** OPR discretion

### Substantive (S)
- Content accuracy
- Technical corrections
- Policy clarifications
- Procedural changes
- **Impact:** Medium
- **Resolution:** OPR must address

### Critical (C)
- Legal compliance issues
- Safety concerns
- Mission impact
- Regulatory violations
- **Impact:** High
- **Resolution:** MUST be resolved or formally justified

### Critical Feedback Rules:
1. Cannot be ignored or marked as "won't fix"
2. Must either:
   - Be fully resolved with changes
   - Be downgraded after phone discussion with reviewer
3. Blocks progression if unresolved
4. Requires documentation of resolution

---

## 🔧 Common Operations

### Starting a Workflow
```
1. Open document
2. Click "Workflow" → "Start 8-Stage"
3. Confirm readiness
4. System creates workflow instance
```

### Adding Feedback
```
1. Navigate to document
2. Click "Add Feedback" button
3. Select paragraph or section
4. Choose feedback type (A/S/C)
5. Enter detailed comment
6. Submit
```

### Advancing Stages
```
1. Verify current stage completion
2. Click "Advance to Next Stage"
3. Select target stage
4. Add transition notes
5. Confirm advancement
```

### Moving Backward
```
1. Click "Return to Previous Stage"
2. Select target stage
3. REQUIRED: Enter reason
4. Add guidance for corrections
5. Submit return
```

### Checking History
```
1. Open document
2. Click "Workflow History"
3. View all transitions
4. See who did what and when
```

---

## 🔍 Troubleshooting

### Issue: Cannot Advance Stage
**Causes:**
- Insufficient permissions
- Unresolved critical feedback
- Missing required fields

**Solutions:**
1. Verify your role matches stage requirements
2. Check for unresolved critical items
3. Ensure all mandatory fields completed
4. Contact administrator if authorized but blocked

### Issue: Feedback Not Saving
**Causes:**
- Session timeout
- Network issues
- Validation errors

**Solutions:**
1. Check login status
2. Refresh page and retry
3. Ensure feedback has required fields
4. Save draft frequently

### Issue: Document Locked
**Causes:**
- Another user editing
- Workflow transition in progress
- System maintenance

**Solutions:**
1. Wait for current user to finish
2. Check with document OPR
3. Administrator can force unlock

### Issue: Cannot Access Document
**Causes:**
- Insufficient permissions
- Document in restricted stage
- Account issues

**Solutions:**
1. Verify you're assigned to document
2. Check if your role has stage access
3. Contact coordinator for assignment
4. Verify account is active

---

## 📌 Quick Reference

### Keyboard Shortcuts
- `Ctrl + S` - Save document
- `Ctrl + F` - Find in document
- `Ctrl + /` - Add comment
- `Alt + W` - Open workflow panel
- `Alt + F` - Open feedback panel

### Status Indicators
- 🟢 **Green** - Active/Ready
- 🟡 **Yellow** - Pending/Waiting
- 🔴 **Red** - Blocked/Critical
- 🔵 **Blue** - In Progress
- ⚫ **Gray** - Inactive/Complete

### Time Limits
| Stage | Standard Duration | Maximum |
|-------|------------------|---------|
| Draft Creation | 14 days | 30 days |
| Internal Coordination | 7 days | 14 days |
| OPR Revisions | 5 days | 10 days |
| External Coordination | 15 days | 30 days |
| Resolution Review | 5 days | 10 days |
| Final Approval | 3 days | 7 days |
| Publication | 2 days | 5 days |
| Implementation | 90 days | Ongoing |

### Escalation Path
1. **Level 1**: Document Coordinator
2. **Level 2**: Workflow Administrator
3. **Level 3**: System Administrator
4. **Level 4**: Program Manager

### Contact Information
- **Help Desk**: help@afdms.mil
- **Workflow Support**: workflow-support@afdms.mil
- **Technical Issues**: tech-support@afdms.mil
- **Training**: training@afdms.mil

---

## 📚 Additional Resources

- [Video Tutorials](https://afdms.mil/tutorials)
- [Template Library](https://afdms.mil/templates)
- [Policy References](https://afdms.mil/policies)
- [FAQ Database](https://afdms.mil/faq)
- [Training Schedule](https://afdms.mil/training)

---

## 🔄 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Jan 2025 | Initial release |
| 1.1 | Jan 2025 | Added critical feedback phone call requirement |
| 1.2 | Jan 2025 | Enhanced 5-level hierarchy support |

---

*This manual is maintained by the Air Force Document Management System team. For updates or corrections, contact the documentation team.*

**Classification:** UNCLASSIFIED  
**Distribution:** Authorized Users Only  
**Last Updated:** January 13, 2025