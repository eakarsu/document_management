import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const authorization = request.headers.get('authorization');
    
    if (!authorization) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      );
    }

    // Forward to backend AI service - using health/real-time for monitoring
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const response = await fetch(`${backendUrl}/api/ai-workflow/health/real-time`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authorization,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend AI service error:', response.status, errorText);
      return NextResponse.json(
        { error: 'AI monitoring service error', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error in monitor-workflow:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to monitor workflow' },
      { status: 500 }
    );
  }
}