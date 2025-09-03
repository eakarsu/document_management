import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workflowId = searchParams.get('workflowId');

    if (!workflowId) {
      return NextResponse.json({ error: 'Workflow ID is required' }, { status: 400 });
    }

    // Get access token from cookies
    const accessToken = request.cookies.get('accessToken')?.value;
    
    if (!accessToken) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    // Forward to backend workflow history endpoint
    const backendUrl = `${process.env.BACKEND_URL || 'http://localhost:4000'}/api/workflow/8-stage/history/${workflowId}`;

    const backendResponse = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      }
    });

    if (backendResponse.ok) {
      const responseData = await backendResponse.json();
      return NextResponse.json(responseData);
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch workflow history' 
      }, { status: backendResponse.status });
    }

  } catch (error) {
    console.error('Workflow history API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}