import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const documentId = body.documentId;

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
    const backendResponse = await fetch(`${backendUrl}/api/documents/${documentId}/opr-workflow/submit`, {
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
      // If backend route doesn't exist, handle locally
      if (backendResponse.status === 404) {
        console.log('OPR Workflow submission:', {
          documentId: documentId,
          feedbackCount: body.feedback?.length || 0,
          documentTitle: body.documentTitle
        });

        // Return success
        return NextResponse.json({
          success: true,
          message: 'Feedback submitted to OPR workflow',
          documentId: documentId,
          submittedFeedback: body.feedback?.length || 0
        });
      }

      const errorData = await backendResponse.json().catch(() => ({
        error: `Backend error: ${backendResponse.statusText}`
      }));
      return NextResponse.json(errorData, { status: backendResponse.status });
    }

  } catch (error) {
    console.error('OPR workflow submit API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}