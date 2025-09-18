import { NextRequest, NextResponse } from 'next/server';

// Proxy to backend workflow reset with proper authentication
export async function POST(
  request: NextRequest,
  { params }: { params: { documentId: string } }
) {
  try {
    const documentId = params.documentId;

    // Get auth token from request
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return NextResponse.json({
        success: false,
        error: 'No authorization header provided'
      }, { status: 401 });
    }

    // Proxy request to backend with proper authentication
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:4000';
    const response = await fetch(`${backendUrl}/api/workflow-instances/${documentId}/reset`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });

  } catch (error) {
    console.error('Reset workflow proxy error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reset workflow'
    }, { status: 500 });
  }
}