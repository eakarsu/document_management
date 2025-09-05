import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import htmlDocx from 'html-docx-js';
import { convert } from 'html-to-text';
import prisma from '../../../../../lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { format, includeNumbering = true } = await request.json();
    const documentId = parseInt(params.id);

    // Fetch document from database
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        template: true
      }
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Get the HTML content
    let htmlContent = document.content || document.template?.content || '';
    
    // Add styling for better formatting
    const styledHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 40px;
            color: #333;
          }
          h1 { 
            color: #2c3e50; 
            border-bottom: 2px solid #3498db; 
            padding-bottom: 10px;
            margin-top: 30px;
          }
          h2 { 
            color: #34495e; 
            margin-top: 25px;
          }
          h3 { 
            color: #555; 
            margin-top: 20px;
          }
          p { 
            margin: 10px 0;
            text-align: justify;
          }
          .numbered-paragraph {
            position: relative;
            ${includeNumbering ? 'margin-left: 80px;' : ''}
          }
          .numbered-paragraph::before {
            ${includeNumbering ? `
              content: attr(data-paragraph);
              position: absolute;
              left: -75px;
              color: #666;
              font-weight: bold;
              width: 70px;
              text-align: right;
              padding-right: 10px;
            ` : 'display: none;'}
          }
          table {
            border-collapse: collapse;
            width: 100%;
            margin: 20px 0;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #f2f2f2;
            font-weight: bold;
          }
          ul, ol {
            margin: 10px 0;
            padding-left: 30px;
          }
          li {
            margin: 5px 0;
          }
          .page-break {
            page-break-after: always;
          }
        </style>
      </head>
      <body>
        <h1>${document.title}</h1>
        ${document.category ? `<p><strong>Category:</strong> ${document.category}</p>` : ''}
        ${document.currentVersion ? `<p><strong>Version:</strong> ${document.currentVersion}</p>` : ''}
        <hr />
        ${htmlContent}
      </body>
      </html>
    `;

    // Convert based on format
    switch (format) {
      case 'pdf':
        // Generate PDF using Puppeteer
        const browser = await puppeteer.launch({ 
          headless: 'new',
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.setContent(styledHtml, { waitUntil: 'networkidle0' });
        
        const pdfBuffer = await page.pdf({
          format: 'A4',
          printBackground: true,
          margin: {
            top: '20mm',
            right: '20mm',
            bottom: '20mm',
            left: '20mm'
          }
        });
        
        await browser.close();
        
        return new NextResponse(pdfBuffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${document.title.replace(/[^a-z0-9]/gi, '_')}.pdf"`
          }
        });

      case 'docx':
        // Convert HTML to DOCX
        const docxBuffer = htmlDocx.asBlob(styledHtml);
        
        // Convert Blob to Buffer
        const arrayBuffer = await docxBuffer.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        return new NextResponse(buffer, {
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'Content-Disposition': `attachment; filename="${document.title.replace(/[^a-z0-9]/gi, '_')}.docx"`
          }
        });

      case 'txt':
        // Convert HTML to plain text
        const textContent = convert(htmlContent, {
          wordwrap: 80,
          selectors: [
            { selector: 'h1', options: { uppercase: true } },
            { selector: 'h2', options: { uppercase: false, leadingLineBreaks: 2 } },
            { selector: 'p', options: { leadingLineBreaks: 1 } },
            { selector: 'ul', options: { itemPrefix: '• ' } },
            { selector: 'a', options: { ignoreHref: true } }
          ]
        });
        
        const fullText = `${document.title}\n${'='.repeat(document.title.length)}\n\n` +
          (document.category ? `Category: ${document.category}\n` : '') +
          (document.currentVersion ? `Version: ${document.currentVersion}\n` : '') +
          '\n' + textContent;
        
        return new NextResponse(fullText, {
          headers: {
            'Content-Type': 'text/plain',
            'Content-Disposition': `attachment; filename="${document.title.replace(/[^a-z0-9]/gi, '_')}.txt"`
          }
        });

      case 'html':
        // Return styled HTML
        return new NextResponse(styledHtml, {
          headers: {
            'Content-Type': 'text/html',
            'Content-Disposition': `attachment; filename="${document.title.replace(/[^a-z0-9]/gi, '_')}.html"`
          }
        });

      default:
        return NextResponse.json(
          { error: 'Invalid format. Use pdf, docx, txt, or html' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to export document' },
      { status: 500 }
    );
  }
}