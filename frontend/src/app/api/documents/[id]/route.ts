import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get token from cookies or headers - check both 'token' and 'accessToken'
    let token = request.cookies.get('token')?.value || request.cookies.get('accessToken')?.value;

    // If no cookie, try Authorization header
    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    // Also check for token in cookie header string (fallback)
    if (!token) {
      const cookieHeader = request.headers.get('cookie') || '';
      const tokenMatch = cookieHeader.match(/token=([^;]+)/);
      token = tokenMatch ? tokenMatch[1] : null;
    }

    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    // Get backend URL with fallbacks
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ||
                      process.env.NEXT_PUBLIC_API_URL ||
                      process.env.BACKEND_URL ||
                      'http://localhost:4000';

    // Forward to backend with token
    const backendResponse = await fetch(`${backendUrl}/api/documents/${params.id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    if (backendResponse.ok) {
      const responseData = await backendResponse.json();
      return NextResponse.json(responseData);
    } else {
      const errorData = await backendResponse.json();
      return NextResponse.json(errorData, { status: backendResponse.status });
    }

  } catch (error) {
    console.error('Document details API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get token from cookies or headers - check both 'token' and 'accessToken'
    let token = request.cookies.get('token')?.value || request.cookies.get('accessToken')?.value;

    // If no cookie, try Authorization header
    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    // Also check for token in cookie header string (fallback)
    if (!token) {
      const cookieHeader = request.headers.get('cookie') || '';
      const tokenMatch = cookieHeader.match(/token=([^;]+)/);
      token = tokenMatch ? tokenMatch[1] : null;
    }

    if (!token) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    // Get backend URL with fallbacks
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ||
                      process.env.NEXT_PUBLIC_API_URL ||
                      process.env.BACKEND_URL ||
                      'http://localhost:4000';

    // Forward to backend with token
    const backendResponse = await fetch(`${backendUrl}/api/documents/${params.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    if (backendResponse.ok) {
      const responseData = await backendResponse.json();
      return NextResponse.json(responseData);
    } else {
      // Try to parse error response, but handle case where it's not JSON
      let errorData;
      try {
        errorData = await backendResponse.json();
      } catch {
        errorData = {
          success: false,
          error: `Backend error: ${backendResponse.statusText}`
        };
      }
      return NextResponse.json(errorData, { status: backendResponse.status });
    }

  } catch (error) {
    console.error('Delete API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let body: any;

  try {
    body = await request.json();

    // Always forward to backend, don't try direct DB connection
    // Get token from cookies or headers
    let token = request.cookies.get('token')?.value || request.cookies.get('accessToken')?.value;

    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      const cookieHeader = request.headers.get('cookie') || '';
      const tokenMatch = cookieHeader.match(/token=([^;]+)/);
      token = tokenMatch ? tokenMatch[1] : null;
    }

    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    // Get backend URL with fallbacks
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ||
                      process.env.NEXT_PUBLIC_API_URL ||
                      process.env.BACKEND_URL ||
                      'http://localhost:4000';

    console.log('PATCH request to backend:', `${backendUrl}/api/documents/${params.id}`);
    console.log('PATCH body:', JSON.stringify(body).substring(0, 200));

    // Forward to backend with token
    const backendResponse = await fetch(`${backendUrl}/api/documents/${params.id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });

    console.log('Backend PATCH response status:', backendResponse.status);

    if (backendResponse.ok) {
      const responseData = await backendResponse.json();
      return NextResponse.json(responseData);
    } else {
      let errorData;
      try {
        errorData = await backendResponse.json();
      } catch {
        errorData = {
          success: false,
          error: `Backend error: ${backendResponse.statusText}`
        };
      }
      console.error('Backend PATCH error:', errorData);
      return NextResponse.json(errorData, { status: backendResponse.status });
    }

  } catch (error) {
    console.error("PATCH API error:", error);
    console.error("PATCH body:", body);
    console.error("Document ID:", params.id);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Internal server error"
    }, { status: 500 });
  }
}
