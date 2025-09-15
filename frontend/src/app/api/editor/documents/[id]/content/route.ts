import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const documentId = params.id;

    // Get auth token from cookies
    const token = request.cookies.get('accessToken')?.value;
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Forward request to backend to get document content
    const backendResponse = await fetch(`${process.env.BACKEND_URL || 'http://localhost:4000'}/api/documents/${documentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!backendResponse.ok) {
      return NextResponse.json(
        { success: false, error: 'Failed to load document' },
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json();

    // For editor, return separated content
    // editableContent has only the main content without header/TOC
    const editableContent = data.document.customFields?.editableContent ||
                           data.document.content ||
                           '';

    // Header HTML contains the formatted header and TOC
    const headerHtml = data.document.customFields?.headerHtml || '';
    const documentStyles = data.document.customFields?.documentStyles || '';
    const hasCustomHeader = data.document.customFields?.hasCustomHeader || false;

    return NextResponse.json({
      success: true,
      document: {
        id: data.document.id,
        title: data.document.title,
        content: editableContent, // Just the editable content
        headerHtml: headerHtml, // Formatted header and TOC
        documentStyles: documentStyles, // Styles for the document
        hasCustomHeader: hasCustomHeader, // Whether it has Air Force header
        category: data.document.category,
        status: data.document.status,
        currentVersion: data.document.currentVersion,
        customFields: data.document.customFields // Include all custom fields
      }
    });
    
  } catch (error) {
    console.error('Editor content API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}