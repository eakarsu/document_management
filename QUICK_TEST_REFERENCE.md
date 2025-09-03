# 🚀 Quick Test Reference Card

## 🔐 Test User Credentials
| Role | Email | Password |
|------|-------|----------|
| **OPR** | `opr@demo.mil` | `password123` |
| **ICU** | `icu@demo.mil` | `password123` |
| **Technical** | `technical@demo.mil` | `password123` |
| **Legal** | `legal@demo.mil` | `password123` |
| **Publisher** | `publisher@demo.mil` | `password123` |
| **Admin** | `admin@demo.mil` | `password123` |

## 🔄 Workflow Stages & Permissions

### Stage 1: DRAFT_CREATION
- **Who**: OPR, Admin
- **Buttons**: "Submit for Coordination", "Save Draft"
- **Next**: INTERNAL_COORDINATION

### Stage 2: INTERNAL_COORDINATION
- **Who**: ICU Reviewer, Technical Reviewer, Admin
- **Buttons**: "Approve", "Request Changes", "Add Comments"
- **Next**: OPR_REVISIONS or EXTERNAL_COORDINATION

### Stage 3: OPR_REVISIONS
- **Who**: OPR, Admin
- **Purpose**: Address reviewer feedback
- **Next**: Back to coordination stages

### Stage 4: EXTERNAL_COORDINATION
- **Who**: Technical Reviewer, Admin
- **Purpose**: External stakeholder review
- **Next**: OPR_FINAL

### Stage 5: OPR_FINAL
- **Who**: OPR, Admin
- **Purpose**: Final OPR review before legal
- **Next**: LEGAL_REVIEW

### Stage 6: LEGAL_REVIEW
- **Who**: Legal Reviewer, Admin
- **Buttons**: "Legal Approve", "Request Legal Changes"
- **Next**: OPR_LEGAL or FINAL_PUBLISHING

### Stage 7: OPR_LEGAL
- **Who**: OPR, Admin
- **Purpose**: Address legal feedback
- **Next**: FINAL_PUBLISHING

### Stage 8: FINAL_PUBLISHING
- **Who**: Publisher, Admin
- **Buttons**: "Publish Document", "Schedule Publishing"
- **Next**: PUBLISHED

### Stage 9: PUBLISHED
- **Final state** - workflow complete

## ⚡ Quick Test Sequence

### 5-Minute Full Workflow Test
1. **OPR**: Login → Start Workflow → Submit for Coordination
2. **ICU**: Login → Add Feedback → Request Changes  
3. **OPR**: Login → Make Revisions → Resubmit
4. **Technical**: Login → Review → Approve to External
5. **Legal**: Login → Legal Review → Approve
6. **Publisher**: Login → Final Publishing → Publish
7. **Admin**: Login → Test Backward Movement

### Role Permission Test (2 minutes each)
1. **Login as each role**
2. **Check buttons available**
3. **Try unauthorized action** (should fail)
4. **Submit feedback** (should work)

## 🎯 Key URLs
- **Login**: `http://localhost:3000/login`
- **Dashboard**: `http://localhost:3000/dashboard`
- **Document Details**: `http://localhost:3000/documents/[id]`

## 🔍 What to Look For

### ✅ Success Indicators
- Role-specific buttons appear
- Unauthorized buttons hidden/disabled
- Feedback submissions work
- Stage progression follows rules
- Admin can access everything

### ❌ Failure Indicators  
- Wrong buttons for role
- Can access unauthorized stages
- Feedback not saving
- Workflow stuck
- Admin restrictions

## 🛠️ Quick Troubleshooting
- **Login fails**: Check servers running (ports 3000, 4000)
- **No buttons**: Refresh page, check role
- **Stage stuck**: Check permissions, try admin login
- **Errors**: Check browser console + backend logs

## 📊 Test Completion Checklist
- [ ] All 6 users login ✓
- [ ] Role-specific UI ✓
- [ ] Workflow progression ✓
- [ ] Feedback system ✓
- [ ] Admin overrides ✓
- [ ] Error handling ✓

---
*Use this alongside the full WORKFLOW_TESTING_GUIDE.md*