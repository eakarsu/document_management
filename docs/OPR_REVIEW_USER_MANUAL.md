# OPR Review System with Track Changes - User Manual

## Table of Contents
1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Main Interface](#main-interface)
4. [Track Changes Features](#track-changes-features)
5. [Feedback Management](#feedback-management)
6. [Document Editing](#document-editing)
7. [Export Options](#export-options)
8. [Advanced Features](#advanced-features)
9. [Troubleshooting](#troubleshooting)

---

## 1. Overview

The OPR (Officer Performance Report) Review System is a comprehensive document review platform with advanced track changes capabilities. It allows multiple reviewers to provide feedback, track modifications, and manage document versions professionally.

### Key Features:
- **Real-time track changes** with visual indicators
- **Multi-level feedback system** (Critical, Major, Substantive, Administrative)
- **Version control** with undo/redo functionality
- **Side-by-side document comparison**
- **Comment threading** on specific changes
- **Export with track changes visible**
- **AI-powered, manual, and hybrid merge strategies**

---

## 2. Getting Started

### Accessing the OPR Review Page

1. Navigate to your document from the dashboard
2. Click on **"OPR Review"** to open the review interface
3. The system will load:
   - Document content on the left
   - Feedback panel on the right
   - Control toolbar at the top

### Initial Setup

When you first open a document for review:
- Document content loads automatically
- Any existing feedback appears in the right panel
- Track changes are enabled by default
- Line and page numbering can be toggled for reference

---

## 3. Main Interface

### Layout Components

#### Top Toolbar
- **Back Button**: Return to dashboard
- **Document Title**: Current document name
- **Edit Document**: Toggle between view and edit modes
- **Save Document**: Save current changes
- **Export Menu**: Download document in various formats

#### Left Panel - Document Viewer
- Shows the current document content
- Displays line/page numbers when enabled
- Highlights tracked changes
- Supports direct editing when in edit mode

#### Right Panel - Feedback Management
- **Track Changes Controls**: Undo/redo, compare, navigation
- **Batch Operations**: Accept/reject all changes
- **Feedback Strategy**: Manual, AI, or Hybrid
- **Action Buttons**: Apply changes, save, history, preview
- **Feedback List**: All feedback items with status

---

## 4. Track Changes Features

### 4.1 Undo/Redo Functionality

**How to Use:**
1. Click **Undo** button to revert last change
2. Click **Redo** button to restore undone change
3. Gray buttons indicate no more actions available

**What Gets Tracked:**
- Document content modifications
- Feedback status changes
- Applied merges
- Deleted feedback items

### 4.2 Side-by-Side Comparison

**Accessing Comparison View:**
1. Click the **Compare** button in Track Changes section
2. View opens showing:
   - **Left**: Original document (red header)
   - **Right**: Current document with changes (green header)

**Understanding the Comparison:**
- **Red strikethrough text**: Deleted/replaced content
- **Green highlighted text**: Added/modified content
- **Change Summary**: Statistics at the bottom
- **Applied Changes List**: Details of each modification

**To Exit:** Click the X button or close the dialog

### 4.3 Change Navigation

**Using Previous/Next Buttons:**
1. Click **Prev** to go to previous change
2. Click **Next** to go to next change
3. Counter shows current position (e.g., "3/10")

**What Happens:**
- Document scrolls to the change location
- Change is highlighted temporarily
- Pulse animation draws attention

### 4.4 Batch Accept/Reject

**Accept All Changes:**
1. Click **Accept All** button
2. Confirm in the dialog
3. All pending feedback is applied sequentially
4. Document updates automatically

**Reject All Changes:**
1. Click **Reject All** button
2. Confirm in the dialog
3. All pending feedback is removed
4. Only accepted/merged items remain

### 4.5 Revision History

**Viewing History:**
1. Click **History** button
2. See timeline of all document versions
3. Each entry shows:
   - Version number
   - Timestamp
   - Content length
   - Feedback count

**Restoring Previous Version:**
1. Find desired version in history
2. Click **Restore This Version**
3. Confirm restoration
4. Current state saved before reverting

---

## 5. Feedback Management

### 5.1 Feedback Types

**Critical (Red)**
- Blocks document approval
- Requires resolution or phone call
- Cannot be ignored

**Major (Orange)**
- Significant issues
- Should be addressed
- Can be downgraded if needed

**Substantive (Blue)**
- Important improvements
- Content-related changes
- Standard priority

**Administrative (Green)**
- Minor corrections
- Formatting issues
- Low priority

### 5.2 Feedback States

**Pending**
- Not yet processed
- Available for application
- Shows in normal text

**Merged**
- Successfully applied to document
- Shows with strikethrough
- Checkbox disabled
- Reduced opacity

**Accepted**
- Approved but not yet applied
- Green status badge

**Rejected**
- Declined feedback
- Red status badge
- Not applied to document

### 5.3 Working with Feedback

**Selecting Feedback:**
1. Click on any feedback item in the list
2. Details appear in the panel above
3. Shows all fields including:
   - Comment text
   - Original vs suggested text
   - Justification
   - Contact information

**Applying Feedback:**
1. Select feedback item
2. Choose merge strategy (Manual/AI/Hybrid)
3. Click **Apply** or **AI Merge** button
4. Confirm if needed
5. Feedback marked as "merged"

**Finding Feedback in Document:**
1. Select feedback item
2. Click **Find** button
3. Document scrolls to location
4. Text is highlighted temporarily

### 5.4 Comment Threading

**Adding Comments:**
1. Click comment icon on feedback item
2. Type comment in dialog
3. Click **Post Comment**
4. Thread updates with timestamp

**Viewing Threads:**
- Number badge shows comment count
- Click to open thread dialog
- See all comments chronologically
- Each shows author and timestamp

---

## 6. Document Editing

### 6.1 Edit Mode

**Entering Edit Mode:**
1. Click **Edit Document** button in toolbar
2. Document becomes editable
3. Additional tools appear

**Available Tools in Edit Mode:**
- **Generate TOC**: Create table of contents
- **Number Chapters**: Auto-number sections
- **Document Template**: Apply standard structure
- **Add Page Breaks**: Insert print breaks

**Saving Changes:**
1. Make your edits
2. Click **Save Document** or **Save Changes**
3. Wait for confirmation
4. Changes tracked in history

### 6.2 Merge Strategies

**Manual Merge**
- Simple text replacement
- Direct substitution
- No AI processing
- Fastest option

**AI Merge**
- Intelligent content integration
- Context-aware replacement
- Improves surrounding text
- May take longer

**Hybrid Merge**
- AI generates suggestion
- User reviews before applying
- Three options: Apply & Save, Edit, or Reject
- Best for complex changes

### 6.3 Document Numbering

**Toggle Options:**
- **Line Numbers**: Show line count
- **Page Numbers**: Display page breaks

**Benefits:**
- Easier feedback reference
- Precise location tracking
- Better collaboration

---

## 7. Export Options

### 7.1 Standard Export

**Available Formats:**
- PDF - Best for printing
- Word (DOCX) - For further editing
- Text (TXT) - Plain text only
- HTML - Web-ready format

**How to Export:**
1. Click **Export** button
2. Select format from menu
3. File downloads automatically
4. Check Downloads folder

### 7.2 Export with Track Changes

**Special Export Options:**
- **PDF with Track Changes**
- **Word with Track Changes**
- **HTML with Track Changes**

**What's Included:**
- Red strikethrough for deletions
- Green underline for additions
- Pending feedback as appendix
- Change summary page

**File Naming:**
- Standard: `document_title.pdf`
- With changes: `document_title_with_changes.pdf`

---

## 8. Advanced Features

### 8.1 Critical Feedback Handling

**When Blocked:**
1. System alerts about critical feedback
2. Shows contact information
3. Requires phone call confirmation

**Downgrading Process:**
1. Make phone call to reviewer
2. Check "Phone call made"
3. Enter call notes
4. Select new priority level
5. Confirm downgrade

### 8.2 Auto-Save Feature

**Enabling:**
1. Toggle **Auto-save** switch
2. Changes save automatically
3. No manual save needed

**When It Saves:**
- After applying feedback
- Every few minutes during editing
- Before major operations

### 8.3 Position Details

**Toggle Display:**
- Switch **Position Details** on/off
- Shows/hides location information
- Affects feedback list display

---

## 9. Troubleshooting

### Common Issues and Solutions

**Feedback Won't Apply**
- Check if feedback has "changeTo" text
- Verify document is not in read-only mode
- Ensure you have edit permissions

**Compare View Shows Wrong Content**
- Refresh the page
- Check if changes were saved
- Verify appliedChanges tracking

**Can't Find Text in Document**
- Text may have been modified
- Try manual search (Ctrl+F)
- Check if in correct section

**Export Fails**
- Check internet connection
- Verify backend is running
- Try different format
- Clear browser cache

**Changes Not Saving**
- Check network connection
- Verify authentication
- Look for error messages
- Try manual save

### Best Practices

1. **Regular Saves**: Save after major changes
2. **Use History**: Check history before major operations
3. **Review Before Applying**: Always review AI suggestions
4. **Comment on Changes**: Add context for other reviewers
5. **Export Regularly**: Keep local backups

### Keyboard Shortcuts

- **Ctrl+Z**: Undo (when in edit mode)
- **Ctrl+Y**: Redo (when in edit mode)
- **Ctrl+S**: Save document
- **Ctrl+F**: Find in document
- **Escape**: Close dialogs

---

## Support

For additional help:
- Contact your system administrator
- Check the application logs
- Review recent changes in history
- Export document with track changes for review

---

*Last Updated: Document Management System v2.0*
*OPR Review Module with Enhanced Track Changes*