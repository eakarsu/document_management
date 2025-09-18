import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header or cookies
    let token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      token = request.cookies.get('accessToken')?.value;
    }

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'No token provided' },
        { status: 401 }
      );
    }

    // Forward request to backend API
    const backendResponse = await fetch(`${process.env.BACKEND_URL || 'http://localhost:4000'}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await backendResponse.json();

    if (!backendResponse.ok) {
      // Clear cookies if token is invalid
      if (backendResponse.status === 401) {
        const response = NextResponse.json(
          { success: false, error: data.error || 'Unauthorized' },
          { status: 401 }
        );
        response.cookies.delete('accessToken');
        response.cookies.delete('refreshToken');
        return response;
      }

      return NextResponse.json(
        { success: false, error: data.error || 'Failed to get user info' },
        { status: backendResponse.status }
      );
    }

    return NextResponse.json({
      success: true,
      user: data.user,
    });

  } catch (error) {
    console.error('Me API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}