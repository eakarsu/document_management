# Document Editor - Comprehensive User Manual

## Table of Contents
1. [Getting Started](#getting-started)
2. [Editor Interface Overview](#editor-interface-overview)
3. [Basic Text Formatting](#basic-text-formatting)
4. [Document Structure & Organization](#document-structure--organization)
5. [Advanced Features](#advanced-features)
6. [Supplemental Documents](#supplemental-documents)
7. [Collaboration Features](#collaboration-features)
8. [Export & Sharing](#export--sharing)
9. [Keyboard Shortcuts](#keyboard-shortcuts)
10. [Tips & Best Practices](#tips--best-practices)

---

## Getting Started

### Accessing the Editor
1. Navigate to your document from the documents list
2. Click the "Edit" button to open the editor
3. The editor will load with your document content

### Editor Layout
The editor consists of:
- **Top Toolbar**: Primary actions (Save, Undo/Redo, Find, Export)
- **Formatting Toolbar**: Text formatting options
- **Structure Toolbar**: Document organization tools
- **Appendix Toolbar**: References and glossary tools
- **Main Editor Area**: Where you write and edit content
- **Status Bar**: Document statistics and save status

---

## Editor Interface Overview

### Top Control Bar

#### Primary Actions (Left Side)
- **Save Button**: 
  - Blue when changes need saving
  - Shows "Saving..." during save operation
  - Auto-saves every 30 seconds of inactivity
  
- **Undo/Redo**: 
  - Undo last action (Ctrl+Z / Cmd+Z)
  - Redo undone action (Ctrl+Y / Cmd+Y)

#### Document Tools
- **Find**: Advanced search and replace with regex support
- **Export**: Download as HTML, PDF, DOCX, or TXT
- **Print**: Print document directly from browser

#### Review & Collaboration
- **Track Changes Toggle**: Enable/disable change tracking
- **Changes Badge**: Shows number of tracked changes
- **Comments Badge**: Shows number of active comments

#### View Options
- **Preview**: View document in read-only mode
- **View Modes** (when supplements exist):
  - Base: Original document only
  - Integrated: Document with supplements merged
  - Supplement: Supplements only

#### Status Bar (Right Side)
- **Save Status**: "Saved" (green) or "Unsaved" (orange)
- **Document Stats**: Page X/Y • X,XXX words • XX,XXX chars

---

## Basic Text Formatting

### Font Options
- **Font Family**: Serif, Sans-serif, Monospace, Arial, Times New Roman, etc.
- **Font Size**: 12px to 36px options

### Text Styling
- **Bold** (Ctrl+B): Make text bold
- **Italic** (Ctrl+I): Make text italic
- **Underline** (Ctrl+U): Underline text
- **Strikethrough**: Cross out text
- **Subscript** (X₂): Lower text below baseline
- **Superscript** (X²): Raise text above baseline

### Colors & Highlighting
- **Text Color**: Click color picker to change text color
- **Background Color**: Highlight text with background color
- **Highlight**: Yellow highlighting for emphasis

### Text Alignment
- **Left Align**: Align text to the left
- **Center**: Center text
- **Right Align**: Align text to the right
- **Justify**: Justify text (even margins)

### Lists
- **Bullet List**: Create unordered list
- **Numbered List**: Create ordered list
- **Task List**: Create checklist with checkboxes

### Blocks
- **Blockquote**: Indent and style as quotation
- **Code Block**: Format as code with syntax highlighting
- **Horizontal Rule**: Insert divider line

---

## Document Structure & Organization

### Section Numbering
Click the numbered buttons (1, 2, 3) to insert:
- **Chapter (1)**: Top-level sections
- **Section (2)**: Second-level sections  
- **Subsection (3)**: Third-level sections

Each prompts for:
- Section number (e.g., "1.2.3")
- Section title

### Paragraph Numbering
- **¶1.1**: Insert numbered paragraph (e.g., "1.1.1.1")
- **a.**: Insert lettered sub-paragraph
- **(1)**: Insert numbered sub-item
- **i.**: Insert roman numeral item

### Indentation
- **Increase Indent**: Move content to the right
- **Decrease Indent**: Move content to the left

### Templates
Click "Templates" button for quick insertion of:
- **Chapter Template**: Complete chapter structure
- **Section Template**: Section with paragraphs
- **List Template**: Pre-formatted list structure
- **Table Template**: 3x3 table with headers

### Page Breaks
- Insert page break to start new page
- Shows as dashed line in editor
- Forces page break when printing/exporting

---

## Advanced Features

### Tables

#### Creating Tables
1. Click "📊 Table" to insert 3x3 table
2. Tables include header row by default

#### Modifying Tables
- **+Col**: Add column after current position
- **+Row**: Add row after current position
- **×Table**: Delete entire table
- **Cell Size**: Enter width/height values and click Apply
- **Drag borders**: Manually resize columns/rows

### Images & Media

#### Adding Images
- **Upload**: Click "Image" button and select file
- **URL**: Click "🖼️ URL" and paste image link
- Supported formats: JPG, PNG, GIF, SVG

### Links
- Select text and click "🔗 Link"
- Enter URL when prompted
- Links appear blue and underlined

### Special Characters
- **Emoji**: Insert emojis with picker
- **Symbol**: Insert special characters (©, ®, ™, etc.)

### Document Formatting

#### Table of Contents
- Click "📑 TOC" to auto-generate from headings
- Updates automatically as you edit

#### Auto-Numbering
- Click "#️⃣ Number" to number all chapters/sections
- Maintains consistent numbering scheme

#### Document Template
- Click "📋 Template" to insert complete document structure
- Includes standard sections like Executive Summary, Chapters, Appendices

---

## Supplemental Documents

### What are Supplements?
Supplements allow you to add local guidance or modifications to a parent document without changing the original. Perfect for:
- Organization-specific requirements
- Location-based modifications
- Unit-level additions

### Creating Supplements

#### Method 1: Text Selection
1. **Select text** in the original document
2. **Floating buttons appear** with options:
   - "Create Supplement": Manual creation
   - "Generate with AI": AI-powered suggestions

#### Method 2: AI-Powered Generation
1. Select text and click "Generate with AI"
2. Choose action type:
   - **ADD**: Add new requirements after this section
   - **MODIFY**: Clarify or restrict the section
   - **REPLACE**: Completely replace the section
   - **DELETE**: Mark section as not applicable
3. Review AI suggestions
4. Select and apply appropriate suggestion

### Supplement Organization
Enter your organization details:
- **Organization Name**: e.g., "Randolph AFB"
- **Type**: MAJCOM, BASE, UNIT, or SQUADRON
- **Location**: Physical location
- **Climate**: Environmental conditions
- **Mission**: Specific mission requirements

### Viewing Supplements
Use View Mode buttons to switch between:
- **Base**: Original document only
- **Integrated**: Document with supplements merged
- **Supplement Only**: Just the supplement content

### Visual Indicators
- **Green highlight**: Added content
- **Yellow highlight**: Modified content
- **Red strikethrough**: Deleted/replaced content
- **Blue underline**: Sections with supplements

---

## Collaboration Features

### Comments & Annotations

#### Adding Comments
1. Select text you want to comment on
2. Click "Comments" button in toolbar
3. Type your comment in the panel
4. Click "Add Comment"

#### Managing Comments
- **Reply**: Add responses to existing comments
- **Resolve**: Mark comment as addressed
- **Edit**: Modify your own comments
- **Delete**: Remove comments you created

#### Comment Indicators
- Yellow highlight shows commented text
- Badge shows number of unresolved comments
- Click highlighted text to view comment

### Track Changes

#### Enabling Track Changes
1. Toggle "Track Changes" switch in toolbar
2. All edits will be recorded with:
   - Author name
   - Timestamp
   - Change type (insertion/deletion)

#### Reviewing Changes
1. Click the changes badge to open panel
2. View all tracked changes
3. Accept or reject individual changes
4. See who made each change and when

### Footnotes & References

#### Adding Footnotes
1. Click "¹ Footnote" button
2. Enter footnote text
3. Superscript number appears at cursor
4. Footnote content appears at page bottom

#### Cross-References
1. Click "→ Ref" button
2. Select section to reference
3. Creates clickable link like "See Section 2.3"
4. Updates automatically if section numbers change

---

## Appendix & Glossary Tools

### Creating Appendices/Attachments

#### Quick Insert
1. Click "Attachment" button
2. Choose type (Attachment or Appendix)
3. Enter number and title
4. Complete structure is inserted

### References Section

#### Adding References
1. Click "References" button
2. Choose reference type:
   - USC Law (10 USC § 9013)
   - Policy
   - Directive
   - Instruction
   - Memorandum
   - Publication
   - Form
3. Enter citation, title, and optional date
4. References are formatted automatically

### Abbreviations & Acronyms

#### Adding Abbreviations
1. Click "Abbreviations" button
2. Enter abbreviation and definition
3. Add multiple entries
4. Click "Insert" to add formatted list
5. Automatically sorted alphabetically

Format: **ABBR**—Definition

### Terms & Definitions

#### Adding Terms
1. Click "Terms" button
2. Enter term and detailed definition
3. Add multiple terms
4. Inserted in alphabetical order

### Glossary Template
Click "Glossary" for complete template including:
- References
- Prescribed Forms
- Adopted Forms
- Abbreviations and Acronyms
- Terms

---

## Export & Sharing

### Export Formats

#### HTML
- Preserves all formatting
- Includes embedded styles
- Can be opened in any browser

#### PDF
- Professional document format
- Maintains page breaks
- Ready for printing/distribution

#### DOCX
- Microsoft Word format
- Editable in Word/Google Docs
- Preserves most formatting

#### TXT
- Plain text only
- No formatting
- Maximum compatibility

### Export Process
1. Click "Export" button
2. Select desired format
3. Click "Export" to download
4. File downloads to your default folder

### Printing
1. Click "Print" button or press Ctrl+P
2. Adjust print settings if needed
3. Print or save as PDF

---

## Keyboard Shortcuts

### Essential Shortcuts
- **Save**: Ctrl+S (Cmd+S on Mac)
- **Undo**: Ctrl+Z (Cmd+Z)
- **Redo**: Ctrl+Y (Cmd+Y)
- **Find**: Ctrl+F (Cmd+F)
- **Print**: Ctrl+P (Cmd+P)

### Text Formatting
- **Bold**: Ctrl+B (Cmd+B)
- **Italic**: Ctrl+I (Cmd+I)
- **Underline**: Ctrl+U (Cmd+U)

### Navigation
- **Home**: Go to document start
- **End**: Go to document end
- **Page Up/Down**: Navigate by page

### Advanced Search
- **Enter**: Next match
- **Shift+Enter**: Previous match
- **Escape**: Close search

---

## Tips & Best Practices

### Document Organization
1. **Use Consistent Numbering**: Stick to one numbering scheme
2. **Create TOC Early**: Add table of contents for long documents
3. **Use Templates**: Start with templates for standard documents
4. **Regular Saves**: Though auto-save is active, save important changes manually

### Collaboration Best Practices
1. **Enable Track Changes**: For documents requiring review
2. **Use Comments**: Instead of inline notes for feedback
3. **Resolve Comments**: Mark addressed comments as resolved
4. **Clear Attribution**: Changes show who made them

### Supplement Management
1. **Be Specific**: Select only the text needing supplementation
2. **Use AI Suggestions**: Get started quickly with AI-generated options
3. **Provide Context**: Fill in organization details for better AI suggestions
4. **Review Integrated View**: Check how supplements merge with original

### Performance Tips
1. **Large Documents**: Use page breaks to improve performance
2. **Images**: Optimize image sizes before uploading
3. **Tables**: Keep tables under 20 rows for best performance
4. **Auto-Save**: Wait for auto-save before closing

### Formatting Guidelines
1. **Consistent Fonts**: Use 2-3 fonts maximum
2. **Heading Hierarchy**: Don't skip heading levels
3. **List Formatting**: Use built-in list tools for consistency
4. **Table Headers**: Always include header rows

### Export Recommendations
- **For Review**: Use PDF to preserve formatting
- **For Editing**: Use DOCX for Word compatibility
- **For Web**: Use HTML for online viewing
- **For Processing**: Use TXT for plain text needs

---

## Troubleshooting

### Common Issues

#### Changes Not Saving
- Check internet connection
- Look for "Unsaved" indicator
- Click Save button manually
- Check for error messages

#### Formatting Issues
- Clear formatting and reapply
- Check for conflicting styles
- Use format painter for consistency

#### Performance Problems
- Break long documents into sections
- Reduce image sizes
- Clear browser cache
- Use Chrome/Firefox for best performance

### Getting Help
- Hover over buttons for tooltips
- Check keyboard shortcuts
- Contact support for technical issues

---

## Conclusion

The Document Editor provides comprehensive tools for creating, editing, and managing professional documents with military-grade formatting capabilities. Master these features to create well-structured, compliant documents efficiently.

For additional support or feature requests, please contact your system administrator.

---

*Last Updated: January 2025*
*Version: 2.0*