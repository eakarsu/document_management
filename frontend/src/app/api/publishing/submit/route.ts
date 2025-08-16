import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
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
      return NextResponse.json(
        { error: 'Authorization token required', code: 'MISSING_TOKEN' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Forward to backend publishing service
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:4000';
    const response = await fetch(`${backendUrl}/api/publishing/submit`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.text();
      let parsedError;
      try {
        parsedError = JSON.parse(errorData);
      } catch {
        parsedError = { error: errorData || 'Publishing submission failed' };
      }
      
      return NextResponse.json(parsedError, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Publishing submit API error:', error);
    return NextResponse.json(
      { error: 'Failed to submit for publishing' },
      { status: 500 }
    );
  }
}