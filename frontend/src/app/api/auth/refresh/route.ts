import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let refreshToken = body.refreshToken;

    // If no refresh token in body, try to get from cookies
    if (!refreshToken) {
      refreshToken = request.cookies.get('refreshToken')?.value;
    }

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, error: 'No refresh token provided' },
        { status: 401 }
      );
    }

    // Forward request to backend API
    const backendResponse = await fetch(`${process.env.BACKEND_URL || 'http://backend:4000'}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refreshToken,
      }),
    });

    const data = await backendResponse.json();

    if (!backendResponse.ok) {
      // Clear cookies if refresh token is invalid
      const response = NextResponse.json(
        { success: false, error: data.error || 'Token refresh failed' },
        { status: backendResponse.status }
      );
      response.cookies.delete('accessToken');
      response.cookies.delete('refreshToken');
      return response;
    }

    // Create response with new tokens
    const response = NextResponse.json({
      success: true,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    });

    // Update HTTP-only cookies
    if (data.accessToken) {
      response.cookies.set('accessToken', data.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60, // 15 minutes
        path: '/',
      });
    }

    if (data.refreshToken) {
      response.cookies.set('refreshToken', data.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: '/',
      });
    }

    return response;

  } catch (error) {
    console.error('Refresh API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}