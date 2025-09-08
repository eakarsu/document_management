import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Get access token from cookies
    const accessToken = request.cookies.get('accessToken')?.value;
    
    if (!accessToken) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    // Forward DIRECTLY to backend without ANY modifications
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:4000';
    const backendResponse = await fetch(`${backendUrl}/api/feedback-processor/merge`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });

    // Return the backend response AS-IS without any modifications
    const data = await backendResponse.json();
    return NextResponse.json(data, { status: backendResponse.status });

  } catch (error) {
    console.error('Backend proxy error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to proxy request to backend' 
    }, { status: 500 });
  }
}