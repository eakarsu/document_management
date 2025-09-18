import { NextRequest, NextResponse } from 'next/server';

interface DistributeRequest {
  reviewerEmails: string[];
  workflowInstanceId: string;
  stageId: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { documentId: string } }
) {
  try {
    const { documentId } = params;
    const body: DistributeRequest = await request.json();
    const { reviewerEmails, workflowInstanceId, stageId } = body;

    if (!reviewerEmails || !Array.isArray(reviewerEmails) || reviewerEmails.length === 0) {
      return NextResponse.json(
        { error: 'At least one reviewer email is required' },
        { status: 400 }
      );
    }

    // Get the authentication token from cookies
    const cookies = request.headers.get('cookie') || '';
    const tokenMatch = cookies.match(/token=([^;]+)/);
    const token = tokenMatch ? tokenMatch[1] : null;

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Forward the request to the backend with Bearer token
    const backendResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/workflows/documents/${documentId}/distribute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        reviewerEmails,
        workflowInstanceId,
        stageId
      }),
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json();
      return NextResponse.json(
        { error: errorData.error || 'Distribution failed' },
        { status: backendResponse.status }
      );
    }

    const result = await backendResponse.json();
    return NextResponse.json(result);

  } catch (error) {
    console.error('Distribution error:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}