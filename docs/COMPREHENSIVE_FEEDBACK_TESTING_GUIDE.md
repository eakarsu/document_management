# 📚 Comprehensive Feedback Testing Guide
## OPR 8-Stage Workflow with Manual Merge Capability

---

## 🎯 How to Use the System

### Step 1: Create a Document
1. **Login** as admin@demo.mil / password123
2. **Go to Dashboard** → Click "Create Document"
3. **Select a Template** from available options:
   - Air Force Technical Manual
   - Comment Resolution Matrix (CRM)
   - AF Form 673 Request for Approval
   - DAFPD (Department of the Air Force Policy Directive)
   - DAFMAN (Department of the Air Force Manual)
   - And 10+ more critical AF templates
4. **Fill in document details** and submit
5. Document is created in **Stage 1: OPR Creates**

### Step 2: Move Through Workflow Stages
```
Stage 1: OPR Creates → Stage 2: 1st Coordination → Stage 3: OPR Revisions → 
Stage 4: 2nd Coordination → Stage 5: OPR Final → Stage 6: Legal Review → 
Stage 7: OPR Legal → Stage 8: AFDPO Publish
```

Use the workflow controls to advance stages as needed.

---

## 📊 Feedback Capabilities by Stage

| Stage | Name | Can Leave Feedback? | Feedback Type |
|-------|------|-------------------|---------------|
| 1 | OPR Creates | ❌ No | Creation stage |
| 2 | 1st Coordination | ✅ YES | External reviewers provide feedback |
| 3 | OPR Revisions | ✅ YES | **Internal feedback** - OPR processes reviews |
| 4 | 2nd Coordination | ✅ YES | Second round external feedback |
| 5 | OPR Final | ⚠️ Limited | Critical feedback only |
| 6 | Legal Review | ✅ YES | Legal compliance feedback |
| 7 | OPR Legal | ✅ YES | **Collaborative** - OPR-Legal dialogue |
| 8 | AFDPO Publish | ❌ No | Final publication |

---

## 🔥 Key Features

### 1. Multiple Reviewers on Same Line
- In Stage 2 or 4, multiple reviewers can comment on the same line
- System automatically consolidates feedback
- Severity levels: CRITICAL > MAJOR > SUBSTANTIVE > ADMINISTRATIVE

### 2. Stage 3: Internal Feedback (OPR Team Only)
- OPR team adds decision rationale
- Process external feedback with notes
- Document why feedback was accepted/rejected
- Complete audit trail maintained

### 3. Stage 7: Collaborative Feedback (OPR-Legal)
- Back-and-forth dialogue between OPR and Legal teams
- Propose alternatives to legal requirements
- Request clarifications
- Track compliance resolutions

### 4. Manual Merge Options
When processing feedback, you have 3 merge strategies:

#### **Manual Merge**
- Full control over the final content
- Edit and merge feedback manually
- Best for complex changes requiring context

#### **AI-Assisted**
- Get AI-generated merge suggestion
- Review and apply if appropriate
- Good for straightforward improvements

#### **Hybrid**
- Start with AI suggestion
- Manually edit the result
- Best of both approaches

---

## 💻 Using the Feedback Review Interface

### Split-Screen Layout
- **Left Panel**: Document content and merge editor
- **Right Panel**: List of all feedback items

### Document Numbering System (NEW!)
- **Line Numbers**: Displayed on the left for each paragraph
- **Paragraph Numbers**: Hierarchical numbering (1.1, 1.1.1, etc.)
- **Page Numbers**: Automatic page breaks and numbering
- **Toggle Controls**: Show/hide each numbering type as needed
- **Preview Mode**: View numbering while editing documents

### Workflow:
1. **Click on feedback** in the right panel
2. **Fields auto-populate** with original and feedback content
3. **Location fields** include line, paragraph, and page numbers for precise reference
4. **Select merge strategy** from dropdown (Manual/AI/Hybrid)
5. **Edit merged content** as needed
6. **Click Accept or Reject** to process
7. **Status updates** automatically in the list

### Visual Indicators:
- 🔴 **CRITICAL** - Must be addressed
- 🟡 **MAJOR** - Important issues
- 🔵 **SUBSTANTIVE** - Suggested improvements
- ⚪ **ADMINISTRATIVE** - Minor corrections

---

## 📝 Real Workflow Example

### Creating and Processing a Document:

1. **Create Document**
   - Select "Policy Template"
   - Enter title: "New Security Policy"
   - Document starts at Stage 1

2. **Stage 2: 1st Coordination**
   - Move document to Stage 2
   - Reviewers add feedback:
     - Reviewer 1: "Line 2 needs better clarity" (MAJOR)
     - Reviewer 2: "Line 2 grammar issues" (CRITICAL)
     - Reviewer 3: "Line 2 could be improved" (SUBSTANTIVE)

3. **Stage 3: OPR Revisions**
   - Move to Stage 3
   - Open feedback review interface
   - See all 3 feedback items on Line 2
   - Select first feedback (CRITICAL)
   - Choose "Manual Merge" strategy
   - Edit: "Line 2: Enhanced with improved clarity and correct grammar"
   - Click "Accept & Apply"
   - Add internal note: "Accepted all grammar corrections"

4. **Continue Through Stages**
   - Process remaining feedback
   - Move to Stage 4 for second review
   - Continue until Stage 8 publication

---

## ✅ System Capabilities

### What's Working:
- ✅ Document creation with 15+ Air Force templates
- ✅ 8-stage workflow progression
- ✅ Multiple reviewers on same line
- ✅ Stage 3 internal feedback
- ✅ Stage 7 collaborative feedback
- ✅ Manual merge with 3 strategies
- ✅ Split-screen review interface
- ✅ Auto-population of fields
- ✅ Accept/Reject workflow
- ✅ Complete audit trail
- ✅ Automatic line, paragraph, and page numbering
- ✅ Precise feedback location tracking
- ✅ AI processes feedback with full context (location + content)
- ✅ Preview mode in editor with numbering display

### Test Users Available:
```
admin@demo.mil / password123 (Admin - Full access)
reviewer1@demo.mil / password123 (Reviewer)
reviewer2@demo.mil / password123 (Reviewer)
reviewer3@demo.mil / password123 (Reviewer)
```

---

## 🚀 Quick Testing

To quickly test the feedback system:

1. **Login** as admin@demo.mil
2. **Create a document** using any template
3. **Move to Stage 2** (1st Coordination)
4. **Switch users** to reviewers and add feedback
5. **Switch back to admin** and move to Stage 3
6. **Open feedback review** to process feedback
7. **Test different merge strategies**
8. **Continue through workflow** to Stage 8

---

## 📋 Summary

The system provides a complete document workflow with sophisticated feedback capabilities:
- Real document creation with templates
- Natural workflow progression through 8 stages
- Intuitive feedback review interface
- Multiple merge strategies for flexibility
- Complete tracking and audit trail

No test scripts needed - just use the actual system!

---

*Version: 3.1.0*
*Status: Production Ready*
*Last Updated: Added Air Force templates and automatic numbering system*