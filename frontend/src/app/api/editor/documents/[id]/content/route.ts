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

    // Return document with content from customFields or empty
    const content = data.document.customFields?.content || 
                   data.document.content || 
                   '';
    
    return NextResponse.json({
      success: true,
      document: {
        id: data.document.id,
        title: data.document.title,
        content: content,
        category: data.document.category,
        status: data.document.status,
        currentVersion: data.document.currentVersion
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