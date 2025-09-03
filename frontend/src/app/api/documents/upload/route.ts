import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get access token from cookies
    const accessToken = request.cookies.get('accessToken')?.value;
    
    if (!accessToken) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    // Get form data
    const formData = await request.formData();
    
    // Forward to backend with token
    const backendResponse = await fetch(`${process.env.BACKEND_URL || 'http://localhost:4000'}/api/documents/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      body: formData
    });

    if (backendResponse.ok) {
      const responseData = await backendResponse.json();
      return NextResponse.json(responseData);
    } else {
      // Handle error responses
      let errorData;
      const contentType = backendResponse.headers.get('content-type') || '';
      
      if (contentType.includes('application/json')) {
        try {
          errorData = await backendResponse.json();
        } catch {
          errorData = { success: false, error: 'Upload failed' };
        }
      } else {
        // Handle text/HTML responses
        try {
          const errorText = await backendResponse.text();
          errorData = { 
            success: false, 
            error: 'Upload failed', 
            details: errorText.includes('Invalid file type') ? 'Invalid file type' : 'Server error' 
          };
        } catch {
          errorData = { success: false, error: 'Upload failed' };
        }
      }
      
      return NextResponse.json(errorData, { status: backendResponse.status });
    }

  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}