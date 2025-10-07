import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Forward request to backend API
    const backendResponse = await fetch(`${process.env.BACKEND_URL || 'http://localhost:4000'}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': request.ip || '',
        'User-Agent': request.headers.get('user-agent') || '',
      },
      body: JSON.stringify({
        email: email.toLowerCase().trim(),
        password,
      }),
    });

    const data = await backendResponse.json();

    if (!backendResponse.ok) {
      return NextResponse.json(
        { success: false, error: data.error || 'Login failed' },
        { status: backendResponse.status }
      );
    }

    // Check X-Forwarded-Proto header to determine if connection is secure (for reverse proxy)
    const isSecure = request.headers.get('x-forwarded-proto') === 'https' ||
                     process.env.NODE_ENV === 'production';

    // Build Set-Cookie headers manually for better compatibility with nginx
    const cookieOptions = isSecure
      ? 'Secure; SameSite=Lax; Path=/'
      : 'SameSite=Lax; Path=/';

    const accessTokenCookie = `accessToken=${data.accessToken}; Max-Age=${15 * 60}; ${cookieOptions}`;
    const refreshTokenCookie = `refreshToken=${data.refreshToken}; Max-Age=${7 * 24 * 60 * 60}; ${cookieOptions}`;

    // Create response with user data and manually set cookies
    const response = NextResponse.json({
      success: true,
      user: data.user,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    });

    // Set cookies using headers (more reliable with reverse proxy)
    response.headers.append('Set-Cookie', accessTokenCookie);
    response.headers.append('Set-Cookie', refreshTokenCookie);

    return response;

  } catch (error) {
    console.error('Login API error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}