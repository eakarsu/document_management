# Testing Collaborative Document Workflow
# Multi-User Publishing with Binary Diff Tracking

This guide shows how to test the complete collaborative workflow where multiple people make changes and the system publishes a final document that tracks all changes through binary diff analysis.

## 🔄 **Document Workflow States**

```
DRAFT → IN_REVIEW → APPROVED → PUBLISHED
```

Each state change is tracked with binary diff analytics showing what changed between versions.

## 👥 **Demo Users Available for Testing**

From your system, you have these users with different permissions:

```
👑 Admin:    admin@richmond-dms.com / admin123
   • Can create, edit, approve, and publish documents
   • Can see all binary diff analytics
   • Has full workflow permissions

👔 Manager:  manager@richmond-dms.com / manager123  
   • Can create and edit documents
   • Can approve documents from contributors
   • Can view diff analytics for approval decisions

👤 User:     user@richmond-dms.com / user123
   • Can create and edit documents
   • Cannot approve or publish
   • Can see diff analytics on their own documents
```

## 🧪 **Collaborative Testing Scenarios**

### **Scenario 1: Multi-User Document Evolution**

**Step 1: User Creates Initial Document**
1. Login as `user@richmond-dms.com / user123`
2. Upload a document (use Resume.docx or test-document.txt)
3. Status: `DRAFT` (Version 1)

**Step 2: User Submits for Review**  
1. Go to document detail page
2. Document Actions → Change Status → `IN_REVIEW`
3. Binary diff tracks: No changes (still version 1)

**Step 3: Manager Reviews and Makes Changes**
1. Logout and login as `manager@richmond-dms.com / manager123`
2. Go to same document
3. Document Actions → Edit → Upload modified version
4. Status automatically: `IN_REVIEW` (Version 2)
5. **Binary diff shows**: `MINOR/MAJOR changes | X% changed | Y% similarity`

**Step 4: Admin Makes Additional Changes**
1. Logout and login as `admin@richmond-dms.com / admin123` 
2. Download current version
3. Make more changes and upload (Version 3)
4. **Binary diff shows**: Changes from Version 2 → Version 3

**Step 5: Admin Approves Document**
1. In Version History, click `[Approve]` on latest version
2. Status changes to: `APPROVED`
3. System tracks which version is approved

**Step 6: Admin Publishes Final Document**
1. Document Actions → Publish Document
2. Status changes to: `PUBLISHED`
3. **Final published document contains all changes from all users**

### **Scenario 2: Multiple Contributors with Rejections**

**Simulating Real-World Collaboration:**

**A) User 1 Contribution:**
```bash
# Login as user@richmond-dms.com
# Upload initial document
# Submit for review (IN_REVIEW)
```

**B) Manager Review & Changes:**
```bash  
# Login as manager@richmond-dms.com
# Download document, make changes
# Upload new version
# Binary diff: Shows manager's changes vs user's original
```

**C) Admin Rejects Manager's Version:**
```bash
# Login as admin@richmond-dms.com  
# In Version History → [Reject] on manager's version
# Status back to DRAFT
# Binary diff analytics preserved for audit trail
```

**D) Manager Revises:**
```bash
# Manager makes different changes
# Uploads revised version  
# Binary diff: Shows new changes vs original + what was rejected
```

**E) Admin Approves & Publishes:**
```bash
# Admin approves final version
# Publishes document
# Final published version = combination of all approved changes
```

## 📊 **What You'll See in Binary Diff Analytics**

### **Version History with Multi-User Changes:**
```
Version 4 (PUBLISHED) - by admin@richmond-dms.com
📊 MINOR changes | 🔢 2.1% changed | 📈 97.9% similarity | 💾 92% compression
Status: PUBLISHED ✅ | [Download] [Compare]

Version 3 (APPROVED) - by manager@richmond-dms.com  
📊 MAJOR changes | 🔢 15.3% changed | 📈 84.7% similarity | 💾 71% compression
Status: APPROVED ✅ | [Download] [Compare] [Publish]

Version 2 (REJECTED) - by manager@richmond-dms.com
📊 STRUCTURAL changes | 🔢 42.1% changed | 📈 57.9% similarity | 💾 34% compression  
Status: REJECTED ❌ | [Download] [Compare] [Archive]

Version 1 (ORIGINAL) - by user@richmond-dms.com
📄 Original document | Status: DRAFT
[Download]
```

### **Compare Button Shows Cross-User Changes:**
```
Version 3 vs Version 1:
• Contributors: user@richmond-dms.com → manager@richmond-dms.com
• Change Category: MAJOR  
• Bytes Changed: 8.7KB
• Percent Changed: 15.3%
• Similarity: 84.7%
• Time Span: 3 hours
• Status Change: DRAFT → APPROVED
```

## 🎯 **Step-by-Step Testing Protocol**

### **Phase 1: Set Up Test Document**
1. Login as User: `user@richmond-dms.com / user123`
2. Upload Resume.docx: http://localhost:3000/documents/cmea9dvgk0021vx8chm8sogur
3. Note the document ID for testing

### **Phase 2: Multi-User Collaboration**
```bash
# Terminal 1: User session
curl -c user_cookies.txt -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@richmond-dms.com","password":"user123"}'

# Terminal 2: Manager session  
curl -c manager_cookies.txt -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"manager@richmond-dms.com","password":"manager123"}'

# Terminal 3: Admin session
curl -c admin_cookies.txt -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@richmond-dms.com","password":"admin123"}'
```

### **Phase 3: Version Creation & Approval Flow**
1. **User creates version** → Status: `DRAFT`
2. **Manager edits document** → Status: `IN_REVIEW` + Binary diff analytics
3. **Admin approves** → Status: `APPROVED`  
4. **Admin publishes** → Status: `PUBLISHED` (Final version with all changes)

### **Phase 4: Verify Binary Diff Tracking**
Check each version shows:
- Who made the changes (contributor tracking)
- What percentage changed (change analytics)
- Similarity to previous versions (diff calculations)
- Workflow status transitions (audit trail)

## 🔍 **API Testing for Collaborative Workflow**

### **Document Status Changes:**
```bash
# Submit for review
curl -X PUT http://localhost:4000/api/documents/{doc-id}/status/IN_REVIEW

# Approve version
curl -X POST http://localhost:4000/api/documents/{doc-id}/versions/{version}/approve

# Publish document  
curl -X POST http://localhost:4000/api/documents/{doc-id}/publish
```

### **Version History with Contributors:**
```bash
# Get all versions with user info and diff data
curl http://localhost:4000/api/documents/{doc-id}/versions
```

## 📈 **Expected Results**

### **✅ Successful Collaborative Workflow:**
- Multiple users can contribute to the same document
- Each version tracks contributor and changes made
- Binary diff analytics show cumulative changes
- Approval workflow tracks decision points
- Final published document represents approved changes from all contributors
- Complete audit trail of who changed what and when

### **📊 Binary Diff Benefits in Collaboration:**
- **Change Attribution**: See exactly what each person contributed
- **Impact Analysis**: Understand how much each revision changed the document
- **Decision Support**: Approval decisions based on quantified change data
- **Audit Trail**: Complete history of document evolution across contributors
- **Quality Control**: Identify major changes that need extra review

## 🎪 **Live Testing Right Now**

### **Quick Collaborative Test (5 minutes):**
1. **Login as User**: Upload a document
2. **Login as Manager**: Edit the document, upload new version
3. **Login as Admin**: Approve and publish
4. **Check Version History**: See multi-user collaboration with binary diff analytics

**Each step will show progressive changes with binary diff analysis tracking exactly what each user contributed to the final published document!**

The system tracks the complete collaborative lifecycle with intelligent change analytics! 🚀