#       AI Document Generation & Export System Documentation

## Table of Contents
1. [Overview](#overview)
2. [AI Document Generation](#ai-document-generation)
3. [Export Functionality](#export-functionality)
4. [Architecture](#architecture)
5. [Implementation Guide](#implementation-guide)
6. [API Reference](#api-reference)
7. [Troubleshooting](#troubleshooting)

## Overview

This document management system provides comprehensive AI-powered document generation with military-standard formatting (specifically Air Force documents) and multi-format export capabilities (PDF, DOCX, HTML, TXT).

### Key Features
- **AI-Powered Generation**: Creates military-standard documents using OpenAI API
- **Air Force Document Templates**: Authentic formatting with headers, seals, and standard layouts
- **Multi-Format Export**: PDF (perfect quality), DOCX (via PDF conversion), HTML, and TXT
- **Rich Text Editor**: TipTap-based editor with full formatting capabilities
- **Real-time Preview**: WYSIWYG editing experience

## AI Document Generation

### 1. Frontend Implementation

#### AI Document Generator Page
**Location**: `/frontend/src/app/ai-document-generator/page.tsx`

This is the main interface for AI document generation:

```typescript
// Key components:
- DocumentTypeSelector: Choose document type (Air Force Instruction, Policy, etc.)
- AI Generation Form: Input requirements for document
- Preview Panel: Real-time document preview
- Export Options: Direct export from generator
```

#### API Route for AI Generation
**Location**: `/frontend/src/app/api/generate-ai-document/route.ts`

```typescript
export async function POST(request: NextRequest) {
  const { documentType, title, requirements } = await request.json();
  
  // Call backend AI service
  const response = await fetch('http://localhost:4000/api/ai/generate-document', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: documentType,
      title,
      requirements,
      format: 'air-force' // Specifies military formatting
    })
  });
  
  return NextResponse.json(await response.json());
}
```

### 2. Backend AI Service

#### OpenRouter Integration
**Location**: `/backend/src/services/OpenRouterService.ts`

```typescript
export class OpenRouterService {
  private apiKey: string;
  private baseURL = 'https://openrouter.ai/api/v1';
  
  async generateDocument(params: {
    type: string;
    title: string;
    requirements: string;
    format: string;
  }): Promise<GeneratedDocument> {
    // Construct prompt for military document
    const prompt = this.buildMilitaryDocumentPrompt(params);
    
    // Call OpenRouter API (using GPT-4 or Claude)
    const completion = await this.createCompletion({
      model: 'openai/gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert military document writer...'
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    });
    
    // Parse and format response
    return this.formatAsAirForceDocument(completion);
  }
  
  private formatAsAirForceDocument(content: string): GeneratedDocument {
    // Add Air Force header structure
    const header = `
      <div class="air-force-document-header">
        <img src="/images/air-force-seal.png" alt="Air Force Seal" />
        <div class="by-order">BY ORDER OF THE</div>
        <div class="secretary">SECRETARY OF THE AIR FORCE</div>
        <div class="title">AIR FORCE INSTRUCTION 36-2903</div>
        <div class="date">${new Date().toLocaleDateString()}</div>
      </div>
    `;
    
    return {
      html: header + content,
      metadata: { /* document metadata */ }
    };
  }
}
```

#### Air Force Document Templates
**Location**: `/backend/src/templates/airForceTemplates.ts`

```typescript
export const airForceTemplates = {
  instruction: {
    header: {
      seal: '/images/air-force-seal.png',
      byOrder: 'BY ORDER OF THE SECRETARY OF THE AIR FORCE',
      classification: 'AIR FORCE INSTRUCTION',
      number: '36-2903',
      date: 'current',
      title: 'DRESS AND APPEARANCE STANDARDS'
    },
    sections: [
      { number: '1', title: 'GENERAL INFORMATION' },
      { number: '2', title: 'RESPONSIBILITIES' },
      { number: '3', title: 'STANDARDS' }
    ],
    formatting: {
      font: 'Times New Roman',
      fontSize: '12pt',
      margins: '1in',
      lineSpacing: 1.5
    }
  }
};
```

## Export Functionality

### 1. Export Pipeline Architecture

```
HTML Document → Export API → Backend Processing → File Download
                     ↓              ↓
                PDF Export    DOCX Export
                     ↓              ↓
                Puppeteer     Puppeteer → PDF → LibreOffice → DOCX
```

### 2. Frontend Export Implementation

#### Editor Page with Export
**Location**: `/frontend/src/app/editor/[id]/page.tsx`

```typescript
const handleExport = async () => {
  const content = editor?.getHTML();
  const title = documentData?.title || 'document';
  
  // Check for Air Force header
  const airForceHeader = {
    hasHeader: content.includes('air-force-document-header'),
    headerHtml: extractAirForceHeader(content),
    documentStyles: getAirForceStyles()
  };
  
  switch (exportFormat) {
    case 'pdf':
      const fullHtmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>${title}</title>
          <style>
            body { font-family: 'Times New Roman', serif; }
            .air-force-document-header { text-align: center; }
            /* Air Force specific styles */
          </style>
        </head>
        <body>
          ${airForceHeader.headerHtml}
          ${content}
        </body>
        </html>
      `;
      
      const response = await fetch('/api/export-pdf', {
        method: 'POST',
        body: JSON.stringify({ content: fullHtmlContent, title })
      });
      
      // Trigger download
      const blob = await response.blob();
      downloadBlob(blob, `${title}.pdf`);
      break;
      
    case 'docx':
      // Similar process for DOCX
      break;
  }
};
```

### 3. Backend Export Services

#### PDF Export Route
**Location**: `/backend/src/routes/export.ts`

```typescript
import puppeteer from 'puppeteer';

router.post('/pdf', async (req, res) => {
  const { html, title } = req.body;
  
  // Launch headless Chrome
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Set HTML content
  await page.setContent(html, { waitUntil: 'networkidle0' });
  
  // Generate PDF with perfect rendering
  const pdfBuffer = await page.pdf({
    format: 'Letter',
    margin: {
      top: '0.5in',
      right: '0.5in',
      bottom: '0.5in',
      left: '0.5in'
    },
    printBackground: true, // Important for backgrounds and images
    displayHeaderFooter: false
  });
  
  await browser.close();
  
  // Send PDF
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${title}.pdf"`);
  res.end(pdfBuffer);
});
```

#### Perfect DOCX Export (PDF → DOCX)
**Location**: `/backend/src/routes/export-perfect.ts`

```typescript
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

router.post('/docx-perfect', async (req, res) => {
  const { html, title } = req.body;
  
  // Step 1: Generate PDF using Puppeteer (same as above)
  const pdfBuffer = await generatePDF(html);
  
  // Step 2: Save PDF to temp file
  const tempDir = os.tmpdir();
  const pdfPath = path.join(tempDir, `temp_${Date.now()}.pdf`);
  const docxPath = path.join(tempDir, `temp_${Date.now()}.docx`);
  
  fs.writeFileSync(pdfPath, pdfBuffer);
  
  // Step 3: Convert PDF to DOCX using LibreOffice
  const command = `soffice --headless --convert-to docx:"MS Word 2007 XML" --outdir "${tempDir}" "${pdfPath}"`;
  
  await execAsync(command);
  
  // Step 4: Read and send DOCX
  const docxBuffer = fs.readFileSync(docxPath);
  
  // Clean up temp files
  fs.unlinkSync(pdfPath);
  fs.unlinkSync(docxPath);
  
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  res.setHeader('Content-Disposition', `attachment; filename="${title}.docx"`);
  res.end(docxBuffer);
});
```

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                   │
├─────────────────────────────────────────────────────────────┤
│  • AI Document Generator (/ai-document-generator)            │
│  • Document Editor (/editor/[id])                           │
│  • Export Dialog Component                                   │
│  • API Routes (/api/export-pdf, /api/export-docx)          │
└─────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────┐
│                      Backend (Express/Node.js)               │
├─────────────────────────────────────────────────────────────┤
│  • OpenRouter Service (AI Generation)                        │
│  • Export Routes (/api/export/pdf, /api/export-perfect/docx)│
│  • Puppeteer (HTML → PDF rendering)                         │
│  • LibreOffice (PDF → DOCX conversion)                      │
│  • Template System (Air Force formats)                       │
└─────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────┐
│                    External Services                         │
├─────────────────────────────────────────────────────────────┤
│  • OpenRouter AI API                                         │
│  • LibreOffice (soffice binary)                             │
│  • Puppeteer/Chromium                                       │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Guide

### Prerequisites

1. **Install Dependencies**
```bash
# Frontend
cd frontend
npm install @tiptap/react @tiptap/starter-kit @mui/material

# Backend
cd backend
npm install puppeteer express html-to-docx libreoffice-convert
npm install @types/node typescript ts-node
```

2. **Install LibreOffice**
```bash
# macOS
brew install libreoffice

# Ubuntu/Debian
sudo apt-get install libreoffice

# Windows
# Download from https://www.libreoffice.org/download/
```

3. **Environment Variables**
```env
# Backend .env
OPENROUTER_API_KEY=your_api_key_here
PORT=4000

# Frontend .env.local
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
```

### Step-by-Step Setup

1. **Create AI Document Generation Route**
```typescript
// /backend/src/routes/ai-document.ts
import { OpenRouterService } from '../services/OpenRouterService';

router.post('/generate', async (req, res) => {
  const service = new OpenRouterService();
  const document = await service.generateDocument(req.body);
  res.json(document);
});
```

2. **Implement Export Routes**
```typescript
// /backend/src/routes/export.ts
// See complete implementation above
```

3. **Setup Frontend Pages**
```typescript
// /frontend/src/app/ai-document-generator/page.tsx
// /frontend/src/app/editor/[id]/page.tsx
// See implementations above
```

4. **Configure Server**
```typescript
// /backend/src/server.ts
import exportRouter from './routes/export';
import exportPerfectRouter from './routes/export-perfect';

app.use('/api/export', exportRouter);
app.use('/api/export-perfect', exportPerfectRouter);
```

## API Reference

### AI Generation Endpoints

#### Generate AI Document
```
POST /api/ai/generate-document
Content-Type: application/json

{
  "type": "air-force-instruction",
  "title": "Dress and Appearance Standards",
  "requirements": "Create comprehensive dress code policy",
  "format": "air-force"
}

Response:
{
  "html": "<div class='air-force-document-header'>...</div>",
  "metadata": { ... }
}
```

### Export Endpoints

#### Export as PDF
```
POST /api/export/pdf
Content-Type: application/json

{
  "html": "<html>...</html>",
  "title": "AFI 36-2903"
}

Response: Binary PDF file
```

#### Export as DOCX (Perfect Quality)
```
POST /api/export-perfect/docx-perfect
Content-Type: application/json

{
  "html": "<html>...</html>",
  "title": "AFI 36-2903"
}

Response: Binary DOCX file
```

## Troubleshooting

### Common Issues and Solutions

1. **PDF Export Shows Blank Pages**
   - Ensure `printBackground: true` in Puppeteer options
   - Check that HTML includes complete DOCTYPE and head tags

2. **DOCX Missing Images/Layout**
   - Verify LibreOffice is installed: `which soffice`
   - Check temp directory permissions
   - Ensure PDF generates correctly first

3. **AI Generation Errors**
   - Verify OpenRouter API key is set
   - Check API rate limits
   - Ensure prompt is within token limits

4. **Export Authentication Errors (401)**
   - Remove authentication middleware from export routes
   - Use direct backend URLs bypassing auth

### Debug Commands

```bash
# Test LibreOffice
soffice --version

# Test PDF generation
curl -X POST http://localhost:4000/api/export/pdf \
  -H "Content-Type: application/json" \
  -d '{"html": "<h1>Test</h1>", "title": "test"}' \
  --output test.pdf

# Check Puppeteer installation
node -e "require('puppeteer').launch().then(b => { console.log('Works!'); b.close(); })"
```

## Best Practices

1. **Always use Puppeteer for PDF** - Provides perfect HTML rendering
2. **Use PDF as intermediate for DOCX** - Preserves formatting better than direct conversion
3. **Include complete HTML structure** - DOCTYPE, head, styles for proper rendering
4. **Handle temp files properly** - Clean up after conversions
5. **Provide fallbacks** - If DOCX conversion fails, offer PDF
6. **Cache AI responses** - Avoid regenerating identical documents

## Conclusion

This system provides enterprise-grade document generation and export capabilities with:
- Military-standard formatting (Air Force documents)
- AI-powered content generation
- Perfect PDF rendering using Puppeteer
- High-quality DOCX conversion via LibreOffice
- Scalable architecture with clear separation of concerns

For additional support or customization, refer to the source code locations provided above.
