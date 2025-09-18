import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get backend URL - use multiple fallbacks for reliability
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ||
                       process.env.NEXT_PUBLIC_API_URL ||
                       process.env.BACKEND_URL ||
                       'http://localhost:4000';

    // Get the authentication token from headers (passed by client)
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Fallback to cookies
      const cookies = request.headers.get('cookie') || '';
      const tokenMatch = cookies.match(/token=([^;]+)/);
      const token = tokenMatch ? tokenMatch[1] : null;

      if (!token) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      // Forward with cookie token
      const backendResponse = await fetch(`${backendUrl}/api/tasks`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!backendResponse.ok) {
        const errorData = await backendResponse.json().catch(() => ({ error: 'Failed to parse error' }));
        return NextResponse.json(
          { error: errorData.error || 'Failed to fetch tasks' },
          { status: backendResponse.status }
        );
      }

      const tasks = await backendResponse.json();
      return NextResponse.json(tasks);
    }

    // Forward the request to the backend with the same auth header
    const backendResponse = await fetch(`${backendUrl}/api/tasks`, {
      headers: {
        'Authorization': authHeader,
      },
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({ error: 'Failed to parse error' }));
      return NextResponse.json(
        { error: errorData.error || 'Failed to fetch tasks' },
        { status: backendResponse.status }
      );
    }

    const tasks = await backendResponse.json();
    return NextResponse.json(tasks);

  } catch (error) {
    console.error('Tasks fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}