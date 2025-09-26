import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    // Get token from cookies or headers
    let token = request.cookies.get('token')?.value || request.cookies.get('accessToken')?.value;

    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    // Get backend URL
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ||
                      process.env.BACKEND_URL ||
                      'http://localhost:4000';

    // Forward to backend
    const backendResponse = await fetch(`${backendUrl}/api/workflow-instances/${params.id}/advance`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });

    if (backendResponse.ok) {
      const responseData = await backendResponse.json();
      return NextResponse.json(responseData);
    } else {
      let errorData;
      const contentType = backendResponse.headers.get('content-type');

      if (contentType && contentType.includes('application/json')) {
        try {
          errorData = await backendResponse.json();
        } catch {
          errorData = {
            success: false,
            error: `Backend error: ${backendResponse.statusText}`
          };
        }
      } else {
        // If response is not JSON (like HTML error pages)
        const text = await backendResponse.text();
        console.error('Backend returned non-JSON response:', text);
        errorData = {
          success: false,
          error: 'Backend service error'
        };
      }

      return NextResponse.json(errorData, { status: backendResponse.status });
    }

  } catch (error) {
    console.error('Workflow advance API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}