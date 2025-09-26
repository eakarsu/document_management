import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const documentId = body.documentId;

    // Get token from cookies or headers
    let token = request.cookies.get('token')?.value || request.cookies.get('accessToken')?.value;

    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    // Get backend URL
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ||
                      process.env.BACKEND_URL ||
                      'http://localhost:4000';

    // Forward to backend
    console.log('Fetching workflow for document:', documentId);
    console.log('Using backend URL:', backendUrl);
    console.log('Token available:', !!token);

    // Don't send If-None-Match header to avoid 304 responses
    const backendResponse = await fetch(`${backendUrl}/api/workflow-instances/${documentId}`, {
      method: 'GET',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });

    console.log('Backend response status:', backendResponse.status);

    if (backendResponse.ok) {
      const responseData = await backendResponse.json();
      console.log('Backend response data:', JSON.stringify(responseData).substring(0, 200));
      return NextResponse.json(responseData);
    } else {
      // If backend route doesn't exist or returns 404
      if (backendResponse.status === 404) {
        console.log('Backend returned 404 - no workflow found for document');
        return NextResponse.json({
          active: false,
          isActive: false,
          message: 'No workflow for this document'
        });
      }

      const errorData = await backendResponse.json().catch(() => ({
        error: `Backend error: ${backendResponse.statusText}`
      }));
      return NextResponse.json(errorData, { status: backendResponse.status });
    }

  } catch (error) {
    console.error('Workflow instances get API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}