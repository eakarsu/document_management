# 📘 Supplemental Document User Manual
## Military Document Management System

---

## Table of Contents
1. [Overview](#overview)
2. [What are Supplemental Documents?](#what-are-supplemental-documents)
3. [Authority Hierarchy](#authority-hierarchy)
4. [Creating a Supplement](#creating-a-supplement)
5. [Editing Supplement Content](#editing-supplement-content)
6. [Viewing Options](#viewing-options)
7. [Rules and Restrictions](#rules-and-restrictions)
8. [Best Practices](#best-practices)
9. [Common Use Cases](#common-use-cases)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

Supplemental documents allow military organizations at different command levels to add location-specific or unit-specific guidance to base documents without modifying the original. This ensures local requirements are met while maintaining the integrity of higher-level directives.

### Key Benefits:
- ✅ **Preserve Original**: Base documents remain unchanged
- ✅ **Local Flexibility**: Commands can address unique requirements
- ✅ **Clear Hierarchy**: Higher directives always take precedence
- ✅ **Audit Trail**: All supplements are tracked and attributed
- ✅ **Easy Updates**: Supplements can be modified independently

---

## 📋 What are Supplemental Documents?

Supplemental documents are official additions to base military publications that:
- Add local implementation guidance
- Clarify procedures for specific locations
- Include additional requirements (more restrictive only)
- Address unique environmental or operational factors

### Example:
- **Base Document**: AFI 36-2903 (Dress and Appearance)
- **MAJCOM Supplement**: AFI 36-2903_PACAFSUP (Pacific-specific requirements)
- **Base Supplement**: AFI 36-2903_PACAFSUP_KADENAAB (Kadena-specific additions)

---

## 🏛️ Authority Hierarchy

Supplements follow a strict hierarchical structure:

```
Level 1: Service Level (Air Force)
    ↓ Can supplement
Level 2: MAJCOM (Major Command)
    ↓ Can supplement
Level 3: Wing/Base
    ↓ Can supplement
Level 4: Squadron/Unit
```

### Important Rules:
1. **Lower levels CANNOT contradict higher levels**
2. **Can be MORE restrictive, never LESS**
3. **Must comply with all parent document requirements**
4. **Each level inherits all higher-level supplements**

---

## 🚀 Creating a Supplement

### Step 1: Open the Parent Document
1. Navigate to the document you want to supplement
2. Click on the document to open it in the editor
3. Ensure you have the appropriate permissions for your organization level

### Step 2: Click "Create Supplement" Button
Location: In the editor toolbar, next to the Save button

![Create Supplement Button]
```
[Save] [Create Supplement] [View: Base ▼]
```

### Step 3: Fill in Supplement Details

When the dialog opens, provide:

#### **Supplement Type** (Required)
Select one of:
- **MAJCOM** - Major Command supplement
- **BASE** - Base or Wing supplement
- **UNIT** - Squadron or Unit supplement
- **INTERIM_CHANGE** - Temporary modification

#### **Supplement Level** (Required)
Choose the appropriate hierarchy level:
- **Level 1** - Service (rarely used)
- **Level 2** - MAJCOM (e.g., PACAF, ACC, AMC)
- **Level 3** - Wing/Base (e.g., Kadena AB, Travis AFB)
- **Level 4** - Squadron/Unit (e.g., 36th Wing)

#### **Organization** (Required)
Enter your organization identifier:
- Examples: "PACAF", "Kadena AB", "36th Wing", "ACC"
- This will be used in the document title and labels

### Step 4: Click "Create Supplement"
The system will:
1. Create a new supplement document
2. Link it to the parent document
3. Open the editor with a helpful template
4. Display guidance for adding supplement content

---

## ✏️ Editing Supplement Content

### Initial Template Structure

When you create a supplement, you'll see:

1. **📋 Guidelines Box** (Blue)
   - Shows document name and metadata
   - Displays your authority level
   - Lists the supplement type

2. **⚠️ Rules Box** (Orange)
   - Critical rules to follow
   - What you can and cannot do
   - Compliance requirements

3. **✅ Instructions Box** (Green)
   - Step-by-step how to add content
   - Formatting requirements
   - Best practices

4. **Example Sections**
   - Pre-formatted examples
   - Shows proper numbering
   - Includes rationale sections

### 🎯 NEW: Section Marking Feature

The system now includes an **advanced section marking tool** that allows you to visually mark and annotate specific text sections within your supplement document.

#### How to Mark Sections:

1. **Select Text**: Highlight any text in your supplement document that you want to mark
2. **Floating Toolbar**: A floating toolbar will appear with 4 action buttons:
   - 🟢 **Add** (Green plus icon) - For new content
   - 🟠 **Modify** (Orange edit icon) - For modifications
   - 🔵 **Replace** (Blue swap icon) - For replacements
   - 🔴 **Delete** (Red trash icon) - For deletions

3. **Click Action**: Choose the appropriate action for your supplement
4. **Fill Dialog**: A dialog will open asking for:
   - **Parent Section Number** (Required): e.g., "2.3.1"
   - **Parent Section Title** (Optional): e.g., "Dress Standards"
   - **Rationale** (Required): Why this supplement is needed
   - The selected text is shown for reference

5. **Save**: Click "Mark Section" to apply the marking

#### Visual Indicators:

Once marked, the text will show:
- 🟢 **Green highlight** with underline for ADDITIONS
- 🟠 **Orange highlight** with underline for MODIFICATIONS
- 🔵 **Blue highlight** with underline for REPLACEMENTS
- 🔴 **Red strikethrough** with reduced opacity for DELETIONS

**Hover** over any marked text to see:
- The action type and organization
- The rationale for the change

#### Marked Sections Sidebar:

A floating sidebar appears on the right showing:
- Total count of marked sections
- List of all marked sections with:
  - Action icon and section number
  - Action type and organization
  - Rationale for each change

#### Tips for Effective Marking:

1. **Be Specific**: Select only the exact text that needs supplementation
2. **Clear Rationale**: Provide detailed justification for each mark
3. **Consistent Numbering**: Use the same section numbering as the parent document
4. **Review Marks**: Check the sidebar to ensure all marks are correct

### Adding Your Content (Traditional Method)

#### Format for New Sections (ADD):
```
2.3.1.1 (Added-PACAF) Tropical Uniform Requirements
Personnel assigned to PACAF installations in tropical locations must:
- Wear moisture-wicking undergarments
- Carry additional hydration
Rationale: High humidity and temperature requirements
```

#### Format for Modifications (MODIFY):
```
3.1.2 (Modified-PACAF) Reporting Timeline
In addition to standard 72-hour reporting, PACAF units must:
- Submit preliminary report within 24 hours
- Include weather impact assessment
Rationale: Typhoon season operational requirements
```

#### Format for Replacements (REPLACE):
```
4.2.1 (Replaced-PACAF) Communication Procedures
[Original section replaced]
New procedure: Use PACAF Form 123 instead of AF Form 456
Rationale: Theater-specific communication requirements
```

#### Format for Deletions (DELETE):
```
5.3.2 (Deleted-PACAF) Cold Weather Procedures
This section does not apply to PACAF installations.
Rationale: Tropical climate eliminates cold weather concerns
```

### Numbering Convention

Always use:
1. Parent section number (e.g., "2.3.1")
2. Your sub-number if adding (e.g., ".1")
3. Action indicator (e.g., "Added-PACAF")

Example: `2.3.1.1 (Added-PACAF)`

---

## 👁️ Viewing Options

Once supplements exist, you'll see view toggle buttons:

### Base View
- Shows only the original document
- No supplements visible
- Clean, unmodified content

### Integrated View
- Shows base + all applicable supplements
- Color-coded indicators:
  - 🟢 Green = Additions
  - 🟠 Orange = Modifications
  - 🔵 Blue = Replacements
  - 🔴 Red = Deletions
- Labels show which organization made changes

### Supplements Only
- Shows only the supplemental content
- Hides base document text
- Useful for reviewing your additions

---

## 📜 Rules and Restrictions

### ✅ YOU CAN:
1. **Add** new requirements specific to your organization
2. **Clarify** implementation details for your location
3. **Make MORE restrictive** requirements
4. **Delete** sections that don't apply (with justification)
5. **Provide additional** guidance and examples

### ❌ YOU CANNOT:
1. **Contradict** parent document requirements
2. **Make LESS restrictive** requirements
3. **Change** fundamental policies
4. **Remove** mandatory requirements
5. **Alter** legal or regulatory compliance items

### 🔴 CRITICAL RULES:
- **Must provide rationale** for all changes
- **Must coordinate** with higher headquarters for major changes
- **Must maintain** proper numbering hierarchy
- **Must identify** your organization in all additions
- **Must review** when parent document updates

---

## 💡 Best Practices

### 1. Clear Identification
Always clearly mark your supplements:
```
Good: "2.3.1.1 (Added-PACAF) Heat Stress Prevention"
Bad: "2.3.1.1 Additional Requirements"
```

### 2. Provide Context
Explain why the supplement is needed:
```
Good: "Rationale: Average temperature exceeds 95°F for 6 months"
Bad: "Rationale: Local requirement"
```

### 3. Be Specific
Reference your unique conditions:
```
Good: "Due to proximity to ocean (within 500m)..."
Bad: "Due to local conditions..."
```

### 4. Maintain Consistency
Use the same format throughout:
- Same action tags (Added-ORG, Modified-ORG)
- Consistent numbering depth
- Uniform rationale placement

### 5. Regular Review
- Review supplements when parent updates
- Remove obsolete supplements
- Update for changing conditions

---

## 📚 Common Use Cases

### Use Case 1: Climate Adaptations
**Scenario**: Base in Alaska needs cold weather additions to uniform regulation

**Supplement**:
```
2.5.1.1 (Added-JBER) Extreme Cold Weather Gear
When temperature falls below -20°F:
- Authorized N-3B parka over ABUs
- Required thermal undergarments
- Mandatory face protection below -40°F
Rationale: Arctic climate safety requirements
```

### Use Case 2: Local Hazards
**Scenario**: Base near volcano needs additional safety procedures

**Supplement**:
```
3.2.1.1 (Added-YOKOTA) Volcanic Ash Procedures
During ash fall warnings:
- All personnel must carry N95 masks
- Vehicle operations require pre-filters
- Aircraft operations cease immediately
Rationale: Mt. Fuji volcanic activity risk
```

### Use Case 3: Mission-Specific Requirements
**Scenario**: Training base needs additional student requirements

**Supplement**:
```
4.1.1.1 (Added-AETC) Student Pilot Requirements
All student pilots must:
- Complete additional 10 hours simulator time
- Pass night vision assessment
- Maintain 90% academic average
Rationale: Enhanced training standards for pilot production
```

---

## 🔧 Troubleshooting

### Problem: "Failed to create supplement"
**Solutions:**
1. Ensure you have proper permissions for your organization level
2. Verify all required fields are filled
3. Check that organization name doesn't contain special characters
4. Try refreshing the page and logging in again

### Problem: Cannot see "Create Supplement" button
**Solutions:**
1. Verify you have editor permissions
2. Check if document allows supplements (some may be restricted)
3. Ensure you're in edit mode, not read-only mode
4. Contact administrator to verify role permissions

### Problem: Supplement not showing in integrated view
**Solutions:**
1. Save the supplement first
2. Refresh the page
3. Check view mode is set to "Integrated"
4. Verify supplement was created for correct parent document

### Problem: Cannot edit existing supplement
**Solutions:**
1. Verify you belong to the organization that created it
2. Check if supplement is locked for review
3. Ensure you have appropriate role (OPR, Admin, etc.)
4. Confirm supplement isn't archived or published

### Problem: Numbering conflicts
**Solutions:**
1. Check if section number already exists
2. Use next available sub-number (.2, .3, etc.)
3. Verify parent section exists
4. Follow 5-level hierarchy (X.X.X.X.X)

---

## 📞 Support Contacts

- **Technical Support**: helpdeks@yourdomain.mil
- **Policy Questions**: policy@yourdomain.mil
- **Training Requests**: training@yourdomain.mil
- **Bug Reports**: Submit through system feedback

---

## 🔄 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Jan 2025 | Initial release |
| 1.1 | Jan 2025 | Added guidance template |
| 1.2 | Jan 2025 | Enhanced error handling |
| 2.0 | Jan 2025 | Added Section Marking Feature with visual indicators |

---

## 📌 Quick Reference Card

### Keyboard Shortcuts
- `Ctrl+S` - Save supplement
- `Ctrl+B` - Bold selected text
- `Ctrl+I` - Italic selected text
- `Ctrl+Z` - Undo
- `Ctrl+Y` - Redo

### Action Tags
- `(Added-ORG)` - New content
- `(Modified-ORG)` - Changed content
- `(Replaced-ORG)` - Substituted content
- `(Deleted-ORG)` - Removed content

### View Modes
- **Base** - Original only
- **Integrated** - Combined view
- **Supplement** - Additions only

### Color Codes
- 🟢 **Green** - Additions
- 🟠 **Orange** - Modifications
- 🔵 **Blue** - Replacements
- 🔴 **Red** - Deletions

---

*This manual is maintained by the Document Management System team. For updates or corrections, contact the documentation team.*

**Classification:** UNCLASSIFIED  
**Distribution:** All Users  
**Last Updated:** January 2025