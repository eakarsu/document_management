import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const documentId = params.id;
    console.log('Preview route called with ID:', documentId);

    // No auth check for preview - allow viewing
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        createdBy: true,
        organization: true
      }
    });

    if (!document) {
      return new NextResponse('Document not found', { status: 404 });
    }

    // Get content from customFields
    const customFields = document.customFields as any || {};
    const content = customFields.content || '';

    // Create HTML page with document content
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${document.title}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #ffffff;
            padding: 40px;
            max-width: 900px;
            margin: 0 auto;
          }
          
          .document-header {
            border-bottom: 3px solid #1976d2;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          
          .document-title {
            font-size: 2.5rem;
            font-weight: bold;
            color: #1976d2;
            margin-bottom: 10px;
          }
          
          .document-meta {
            font-size: 0.9rem;
            color: #666;
            display: flex;
            gap: 20px;
            flex-wrap: wrap;
          }
          
          .meta-item {
            display: flex;
            align-items: center;
            gap: 5px;
          }
          
          .document-content {
            font-size: 1.1rem;
            line-height: 1.8;
          }
          
          /* Content styling */
          h1 {
            font-size: 2.2rem;
            font-weight: bold;
            margin: 30px 0 20px 0;
            color: #1976d2;
            border-bottom: 2px solid #e0e0e0;
            padding-bottom: 10px;
          }
          
          h2 {
            font-size: 1.8rem;
            font-weight: bold;
            margin: 25px 0 15px 0;
            color: #1565c0;
          }
          
          h3 {
            font-size: 1.4rem;
            font-weight: bold;
            margin: 20px 0 10px 0;
            color: #333;
          }
          
          h4 {
            font-size: 1.2rem;
            font-weight: bold;
            margin: 15px 0 10px 0;
            color: #555;
          }
          
          p {
            margin: 0 0 15px 0;
            text-align: justify;
          }
          
          ul, ol {
            margin: 0 0 15px 0;
            padding-left: 30px;
          }
          
          li {
            margin-bottom: 8px;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          
          th, td {
            border: 1px solid #ddd;
            padding: 10px;
            text-align: left;
          }
          
          th {
            background-color: #f5f5f5;
            font-weight: bold;
          }
          
          blockquote {
            border-left: 4px solid #1976d2;
            padding-left: 20px;
            margin: 20px 0;
            font-style: italic;
            color: #555;
          }
          
          code {
            background-color: #f5f5f5;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
          }
          
          pre {
            background-color: #f5f5f5;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
            margin: 15px 0;
          }
          
          strong {
            font-weight: 600;
            color: #000;
          }
          
          em {
            font-style: italic;
          }
          
          hr {
            border: none;
            border-top: 2px solid #e0e0e0;
            margin: 30px 0;
          }
          
          /* Page numbers for printing */
          @media print {
            body {
              padding: 20px;
            }
            
            .document-header {
              page-break-after: avoid;
            }
            
            h1, h2, h3 {
              page-break-after: avoid;
            }
          }
          
          /* Line numbers (if needed for feedback) */
          .line-number {
            color: #999;
            font-size: 0.85rem;
            margin-right: 10px;
            user-select: none;
          }
          
          /* Empty content message */
          .no-content {
            text-align: center;
            padding: 60px 20px;
            color: #999;
          }
          
          .no-content-icon {
            font-size: 48px;
            margin-bottom: 20px;
          }
        </style>
      </head>
      <body>
        <div class="document-header">
          <h1 class="document-title">${document.title}</h1>
          <div class="document-meta">
            <div class="meta-item">
              <strong>Category:</strong> ${document.category || 'Not specified'}
            </div>
            <div class="meta-item">
              <strong>Version:</strong> ${document.currentVersion || '1'}
            </div>
            <div class="meta-item">
              <strong>Status:</strong> ${document.status}
            </div>
            <div class="meta-item">
              <strong>Author:</strong> ${document.createdBy?.firstName} ${document.createdBy?.lastName}
            </div>
            <div class="meta-item">
              <strong>Organization:</strong> ${document.organization?.name}
            </div>
          </div>
        </div>
        
        <div class="document-content">
          ${content ? content : `
            <div class="no-content">
              <div class="no-content-icon">📄</div>
              <h2>No content available</h2>
              <p>This document does not have any content to display.</p>
              <p style="margin-top: 20px;">
                <em>Document ID: ${document.id}</em>
              </p>
            </div>
          `}
        </div>
      </body>
      </html>
    `;

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html'
      }
    });

  } catch (error) {
    console.error('Error generating preview:', error);
    return new NextResponse('Error generating preview', { status: 500 });
  }
}
