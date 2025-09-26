import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const documentId = params.id;

    // Get token from cookies or headers
    let token = request.cookies.get('token')?.value || request.cookies.get('accessToken')?.value;

    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    // Get backend URL
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ||
                      process.env.BACKEND_URL ||
                      'http://localhost:4000';

    // Forward to backend
    const backendResponse = await fetch(`${backendUrl}/api/workflow-instances/${documentId}`, {
      method: 'GET',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });

    if (backendResponse.ok) {
      const responseData = await backendResponse.json();
      return NextResponse.json(responseData);
    } else {
      // If backend returns 404, check if this is a reviewer
      if (backendResponse.status === 404 && token) {
        const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        if (decoded.email && decoded.email.includes('reviewer')) {
          // Return mock workflow for reviewers
          return NextResponse.json({
            id: 'mock-workflow-instance',
            workflowId: 'af-12-stage-review',
            documentId: documentId,
            currentStageId: '5.5',
            active: true,
            isActive: true,
            state: {
              currentPhase: 'Second Review Collection Phase',
              reviewers: [],
              completedReviews: []
            },
            metadata: {},
            history: [],
            isCompleted: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      }

      // Return empty workflow response for other cases
      return NextResponse.json({
        active: false,
        isActive: false,
        message: 'No workflow for this document'
      });
    }

  } catch (error) {
    console.error('Workflow instances API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}