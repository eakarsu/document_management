import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    // Forward to backend with token  
    const backendResponse = await fetch(`${process.env.BACKEND_URL || 'http://localhost:4000'}/api/documents/${params.id}/view`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    });

    if (backendResponse.ok) {
      // Get the file content and headers
      const fileBuffer = await backendResponse.arrayBuffer();
      const contentType = backendResponse.headers.get('Content-Type') || 'application/octet-stream';
      const contentDisposition = backendResponse.headers.get('Content-Disposition') || 'inline';
      
      // Create response with file content
      const response = new NextResponse(fileBuffer);
      response.headers.set('Content-Type', contentType);
      response.headers.set('Content-Disposition', contentDisposition);
      response.headers.set('Cache-Control', 'no-cache');
      
      return response;
    } else {
      const errorData = await backendResponse.json();
      return NextResponse.json(errorData, { status: backendResponse.status });
    }

  } catch (error) {
    console.error('View API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}