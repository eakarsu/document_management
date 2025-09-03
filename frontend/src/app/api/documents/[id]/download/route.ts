import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const documentId = params.id;
    console.log('Download route called with ID:', documentId);

    // Get access token from cookies or headers
    let accessToken = request.cookies.get('accessToken')?.value;
    
    // If no cookie, try Authorization header
    if (!accessToken) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        accessToken = authHeader.substring(7);
      }
    }
    
    if (!accessToken) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    // Get document from database
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

    // Create HTML document for download
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${document.title}</title>
    <style>
        body {
            font-family: 'Times New Roman', serif;
            line-height: 1.6;
            color: #000;
            background-color: #ffffff;
            padding: 40px;
            max-width: 8.5in;
            margin: 0 auto;
        }
        
        @page {
            size: letter;
            margin: 1in;
        }
        
        h1 {
            font-size: 24pt;
            font-weight: bold;
            margin: 20px 0;
            text-align: center;
            color: #000080;
        }
        
        h2 {
            font-size: 18pt;
            font-weight: bold;
            margin: 15px 0 10px 0;
            color: #000080;
            border-bottom: 2px solid #000080;
            padding-bottom: 5px;
        }
        
        h3 {
            font-size: 14pt;
            font-weight: bold;
            margin: 12px 0 8px 0;
            color: #000;
        }
        
        h4 {
            font-size: 12pt;
            font-weight: bold;
            margin: 10px 0 5px 0;
            color: #333;
        }
        
        p {
            margin: 10px 0;
            text-align: justify;
            text-indent: 0.5in;
        }
        
        ul, ol {
            margin: 10px 0;
            padding-left: 0.5in;
        }
        
        li {
            margin-bottom: 5px;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }
        
        th, td {
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
        }
        
        th {
            background-color: #e6e6e6;
            font-weight: bold;
        }
        
        .header-info {
            border: 2px solid #000;
            padding: 15px;
            margin-bottom: 20px;
            background-color: #f5f5f5;
        }
        
        .header-info div {
            margin: 5px 0;
        }
        
        .footer-info {
            border-top: 2px solid #000;
            margin-top: 40px;
            padding-top: 15px;
            font-size: 10pt;
        }
        
        @media print {
            body {
                padding: 0;
            }
        }
    </style>
</head>
<body>
    <div class="header-info">
        <div><strong>Document Title:</strong> ${document.title}</div>
        <div><strong>Document ID:</strong> ${document.id}</div>
        <div><strong>Category:</strong> ${document.category || 'Not specified'}</div>
        <div><strong>Version:</strong> ${document.currentVersion || '1'}</div>
        <div><strong>Status:</strong> ${document.status}</div>
        <div><strong>Author:</strong> ${document.createdBy?.firstName} ${document.createdBy?.lastName}</div>
        <div><strong>Organization:</strong> ${document.organization?.name}</div>
        <div><strong>Created:</strong> ${new Date(document.createdAt).toLocaleDateString()}</div>
        <div><strong>Last Modified:</strong> ${new Date(document.updatedAt).toLocaleDateString()}</div>
    </div>
    
    <div class="content">
        ${content || '<p>No content available for this document.</p>'}
    </div>
    
    <div class="footer-info">
        <p><strong>Classification:</strong> ${customFields.classification || 'UNCLASSIFIED'}</p>
        <p><strong>Distribution:</strong> ${customFields.distribution || 'F'}</p>
        <p>Generated on: ${new Date().toLocaleString()}</p>
    </div>
</body>
</html>`;

    // Return as downloadable HTML file
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="${document.title.replace(/[^a-z0-9]/gi, '_')}.html"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('Error generating download:', error);
    return new NextResponse('Error generating download', { status: 500 });
  }
}