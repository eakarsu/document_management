import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Forward request to backend API (health endpoint doesn't require auth)
    const backendUrl = `${process.env.BACKEND_URL || 'http://localhost:4000'}/api/search/health`;
    
    const backendResponse = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await backendResponse.json();
    return NextResponse.json(data, { status: backendResponse.status });

  } catch (error) {
    console.error('Search health API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', status: 'unhealthy' },
      { status: 500 }
    );
  }
}