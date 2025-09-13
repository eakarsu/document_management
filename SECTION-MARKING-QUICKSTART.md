# 🚀 Section Marking Feature - Quick Start Guide

## Prerequisites
Before using the section marking feature, ensure:
1. You have created a supplement document (see main manual)
2. You are editing the supplement in the editor
3. You have appropriate permissions for the organization

---

## 📝 Step-by-Step Usage

### Step 1: Create or Open a Supplement Document

1. Navigate to the parent document you want to supplement
2. Click **"Create Supplement"** button in the editor
3. Fill in the supplement details:
   - Type: MAJCOM, BASE, UNIT, or INTERIM_CHANGE
   - Level: 1-4 (Service to Squadron)
   - Organization: Your org identifier (e.g., "PACAF", "36th Wing")
4. Click **"Create Supplement"** to open the editor

### Step 2: Write Your Supplemental Content

Type or paste your supplemental content into the editor. This can be:
- Additional requirements
- Modified procedures
- Location-specific guidance
- Clarifications

### Step 3: Mark Sections with the Visual Tool

#### To Mark Text as a Supplement Section:

1. **Select the Text**
   - Click and drag to highlight the specific text you want to mark
   - Can be a word, sentence, paragraph, or multiple paragraphs

2. **Choose Action from Floating Toolbar**
   When text is selected, a floating toolbar appears with 4 options:
   
   | Icon | Action | Use When |
   |------|--------|----------|
   | ➕ Green | **ADD** | Adding new requirements not in parent document |
   | ✏️ Orange | **MODIFY** | Changing or clarifying existing requirements |
   | 🔄 Blue | **REPLACE** | Completely replacing a parent section |
   | 🗑️ Red | **DELETE** | Marking parent content as not applicable |

3. **Fill in the Details Dialog**
   
   After clicking an action, a dialog opens:
   
   ```
   ┌─────────────────────────────────────┐
   │ Mark as Supplemental Section        │
   ├─────────────────────────────────────┤
   │ [ADD] for PACAF                     │
   │                                     │
   │ Parent Section Number* [2.3.1    ]  │
   │ Parent Section Title   [         ]  │
   │                                     │
   │ Selected Content:                   │
   │ "Personnel must wear..."            │
   │                                     │
   │ Rationale*                          │
   │ [High humidity requires special... ]│
   │                                     │
   │ [Cancel]  [Mark Section]            │
   └─────────────────────────────────────┘
   ```
   
   - **Parent Section Number** (Required): The section in the parent document this relates to
   - **Parent Section Title** (Optional): Descriptive title for context
   - **Rationale** (Required): Why this supplement is necessary

4. **Click "Mark Section"**
   The text will be visually marked with the appropriate color and style

### Step 4: Review Marked Sections

#### Visual Indicators in Text:
- 🟢 **Green highlight + underline** = Added content
- 🟠 **Orange highlight + underline** = Modified content
- 🔵 **Blue highlight + underline** = Replaced content
- 🔴 **Red strikethrough** = Deleted content

#### Hover for Details:
Hover your mouse over any marked section to see:
- The action type (ADD/MODIFY/REPLACE/DELETE)
- The organization that made the change
- The rationale for the change

#### Marked Sections Sidebar:
A floating panel on the right shows:
```
┌────────────────────────┐
│ Marked Sections (3)    │
├────────────────────────┤
│ ➕ 2.3.1               │
│ ADD - PACAF            │
│ High humidity...       │
├────────────────────────┤
│ ✏️ 3.1.2               │
│ MODIFY - PACAF         │
│ Typhoon season...      │
├────────────────────────┤
│ 🗑️ 5.3.2               │
│ DELETE - PACAF         │
│ Tropical climate...    │
└────────────────────────┘
```

### Step 5: Save Your Work

Click the **Save** button in the editor toolbar to save:
- The document content
- All section markings
- Associated metadata

---

## 💡 Pro Tips

### Best Practices:

1. **Mark As You Write**
   - Mark sections immediately after writing them
   - Don't wait until the end - you might forget the rationale

2. **Be Precise with Selection**
   - Select only the exact text that represents the supplement
   - Don't include surrounding context unless it's part of the change

3. **Use Consistent Section Numbers**
   - Match the parent document's numbering scheme
   - If parent uses "2.3.1", don't use "II.C.1"

4. **Write Clear Rationales**
   - Good: "Tropical climate requires moisture-wicking materials year-round"
   - Bad: "Local requirement"

5. **Review Before Saving**
   - Check the sidebar to ensure all marks are correct
   - Verify section numbers match parent document
   - Confirm rationales are complete

### Common Scenarios:

#### Adding a New Requirement:
1. Type the new requirement text
2. Select it
3. Click ADD (green)
4. Enter parent section it relates to
5. Explain why it's needed

#### Modifying Existing Guidance:
1. Copy relevant text from parent
2. Edit it with your modifications
3. Select the modified text
4. Click MODIFY (orange)
5. Reference the original section
6. Explain what changed and why

#### Marking Non-Applicable Content:
1. Reference the parent section in your text
2. Select the reference
3. Click DELETE (red)
4. Enter the parent section number
5. Explain why it doesn't apply

---

## 🔍 Troubleshooting

### Floating Toolbar Not Appearing?
- Ensure you're editing a supplement document
- Try selecting different text
- Refresh the page if needed

### Can't See Visual Markings?
- Check that CSS styles are loaded
- Try a different browser
- Clear browser cache

### Sidebar Not Visible?
- Only appears after marking at least one section
- May be hidden on small screens
- Check if it's behind other windows

### Changes Not Saving?
- Ensure you clicked "Mark Section" in the dialog
- Check for network connectivity
- Look for error messages

---

## 📚 Additional Resources

- [Full User Manual](./SUPPLEMENTAL-DOCUMENT-USER-MANUAL.md)
- [Video Tutorial](#) (Coming Soon)
- [FAQs](#) (Coming Soon)

---

## 🎯 Quick Reference

| Action | Keyboard Shortcut | Visual | Use Case |
|--------|------------------|---------|----------|
| ADD | Select + Click Green | Green highlight | New requirements |
| MODIFY | Select + Click Orange | Orange highlight | Changes to existing |
| REPLACE | Select + Click Blue | Blue highlight | Complete replacement |
| DELETE | Select + Click Red | Red strikethrough | Not applicable |

---

*Last Updated: January 2025 | Version 2.0*