# Template Creation Guide - Using Existing System

## Current Template System Architecture

You already have a working template system with the following components:

### 1. Backend Template Storage
**Location:** `/backend/src/templates/documentTemplates.ts`

### 2. Frontend Template Creation API
**Location:** `/frontend/src/app/api/documents/create-with-template/route.ts`

### 3. Template Structure
```typescript
{
  'template-id': {
    name: 'Template Display Name',
    content: `HTML content with rich formatting`
  }
}
```

## How to Add New Templates to Existing System

### Step 1: Add Template to Backend

Edit `/backend/src/templates/documentTemplates.ts`:

```typescript
export const documentTemplates = {
  // Add your new template here
  'dafpd-template': {
    name: 'DAF Policy Directive (DAFPD)',
    content: `
      <h1>DAF Policy Directive</h1>
      <div class="header">
        <!-- Your template HTML content -->
      </div>
    `
  },
  // ... existing templates
};
```

### Step 2: Template Content Guidelines

Templates support:
- **HTML formatting**: `<h1>`, `<h2>`, `<p>`, `<table>`, etc.
- **Editable fields**: `<span contenteditable="true">[Field Name]</span>`
- **Dynamic dates**: `${new Date().toLocaleDateString()}`
- **Styles**: Inline CSS or style attributes
- **Tables**: For structured data
- **Forms**: Input fields, checkboxes, radio buttons

### Step 3: Make Templates Available in Frontend

The templates are automatically available through:
- `getTemplateContent(templateId)` - Returns template HTML
- `getTemplateName(templateId)` - Returns template name

## Currently Implemented Templates

### ✅ Already in System:
1. **air-force-manual** - Air Force Technical Manual
2. **operational-plan** - Operational Planning Document
3. **safety-bulletin** - Safety Bulletin
4. **meeting-minutes** - Meeting Minutes
5. **blank** - Blank Document

### ✅ Just Added Critical Templates:
6. **comment-resolution-matrix** - CRM for coordination tracking
7. **af-form-673** - Official coordination record
8. **supplement-template** - For lower-level org supplements
9. **o6-gs15-coordination** - SME review template
10. **2-letter-coordination** - Senior leadership review
11. **legal-coordination** - Legal review template

## How to Create More Templates

### Example: Adding DAFMAN Template

```typescript
// In documentTemplates.ts
'dafman-template': {
  name: 'DAF Manual (DAFMAN)',
  content: `
    <div class="dafman-template">
      <!-- Header Section -->
      <div class="header">
        <img src="/af-seal.png" alt="AF Seal" style="width: 60px;">
        <h1>DEPARTMENT OF THE AIR FORCE MANUAL</h1>
        <p>DAFMAN <span contenteditable="true">[Number]</span></p>
        <p><span contenteditable="true">[Date]</span></p>
      </div>
      
      <!-- Compliance Statement -->
      <p><strong>COMPLIANCE WITH THIS PUBLICATION IS MANDATORY</strong></p>
      
      <!-- Metadata Table -->
      <table>
        <tr>
          <td>OPR:</td>
          <td contenteditable="true">[Office Symbol]</td>
        </tr>
        <tr>
          <td>Certified by:</td>
          <td contenteditable="true">[Certifying Office]</td>
        </tr>
      </table>
      
      <!-- Content Sections -->
      <h2>Chapter 1—<span contenteditable="true">[Chapter Title]</span></h2>
      <p contenteditable="true">[Chapter content...]</p>
      
      <!-- Dynamic Elements -->
      <div class="added-section">
        <p><strong>1.1 (Added)</strong> <span contenteditable="true">[Added content]</span></p>
      </div>
    </div>
  `
}
```

## Template Categories to Implement Next

Based on the Prototype Planning Document, prioritize these:

### High Priority:
1. **DAFPD** - DAF Policy Directive
2. **DAFMAN** - DAF Manual (like DAFMAN11-402)
3. **Guidance Memorandum** - Interim guidance
4. **Waiver Request** - Exception requests

### Medium Priority:
5. **Policy Memorandum**
6. **Mission Directive**
7. **Operating Instructions**
8. **Handbook**

### Low Priority:
9. **Pamphlet**
10. **Visual Aid**
11. **TTP Documents**

## Template Features to Add

### 1. Dynamic Sections
```javascript
// Add collapsible sections
<details>
  <summary>Click to expand section</summary>
  <div>Content here...</div>
</details>
```

### 2. Auto-numbering
```css
/* CSS for automatic paragraph numbering */
.auto-number {
  counter-reset: section;
}
.auto-number h2::before {
  counter-increment: section;
  content: counter(section) ". ";
}
```

### 3. Validation
```javascript
// Add required field validation
<input required placeholder="Required field">
```

### 4. Print-friendly
```css
@media print {
  .no-print { display: none; }
  .page-break { page-break-after: always; }
}
```

## Using Template Categories System

The template categories are defined in:
`/backend/src/templates/pubOneTemplateCategories.ts`

This provides:
- Template metadata
- Required/optional sections
- Coordination requirements
- AI assist availability flags

## Integration with Document Creation

When user selects "Create with Template":
1. Frontend calls `/api/documents/create-with-template`
2. Backend uses `getTemplateContent(templateId)`
3. Document is created with template HTML as content
4. User can edit using the rich text editor

## Next Steps

1. **Add remaining critical templates** to `documentTemplates.ts`
2. **Test template rendering** in the document editor
3. **Add template preview** functionality
4. **Implement template categories** in UI
5. **Add template search** and filtering

## Testing Templates

```bash
# Test backend templates
cd backend
npm test

# Test frontend integration
cd frontend
npm run dev
# Navigate to document creation
# Select template
# Verify content loads correctly
```

## Template Best Practices

1. **Use semantic HTML** for accessibility
2. **Make fields clearly editable** with `contenteditable` or form inputs
3. **Include helpful placeholders** in brackets [Like This]
4. **Add inline instructions** where needed
5. **Use consistent styling** across all templates
6. **Test print layout** for official forms
7. **Include all required metadata** fields

## Support for Special Requirements

### For "(Added)" Paragraphs in Supplements:
```html
<p><strong>1.1 (Added)</strong> 
  <span style="background-color: #ffffcc;">
    [Highlighted added content]
  </span>
</p>
```

### For Signature Blocks:
```html
<div class="signature-block">
  <p>_________________________</p>
  <p contenteditable="true">[Name, Title]</p>
  <p>Date: ___________</p>
</div>
```

### For Coordination Tracking:
```html
<table class="coordination-table">
  <tr>
    <th>Office</th>
    <th>Date Sent</th>
    <th>Concur/Non-concur</th>
  </tr>
  <!-- Rows added dynamically -->
</table>
```

This guide shows how to use your existing template system. Simply add new templates to `documentTemplates.ts` following the same pattern!