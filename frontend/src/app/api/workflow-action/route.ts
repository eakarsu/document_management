import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get access token from cookies
    const accessToken = request.cookies.get('accessToken')?.value;
    
    if (!accessToken) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    // Get request data
    const body = await request.json();
    const { action, workflowId, ...data } = body;

    if (!workflowId || !action) {
      return NextResponse.json({ 
        success: false, 
        error: 'Workflow ID and action are required' 
      }, { status: 400 });
    }

    // Determine backend URL based on action
    let backendUrl = '';
    let method = 'POST';

    switch (action) {
      case 'move_backward':
        backendUrl = `${process.env.BACKEND_URL || 'http://localhost:4000'}/api/workflow/8-stage/move-backward/${workflowId}`;
        break;
      case 'advance':
        backendUrl = `${process.env.BACKEND_URL || 'http://localhost:4000'}/api/workflow/8-stage/advance-with-validation/${workflowId}`;
        break;
      default:
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid action' 
        }, { status: 400 });
    }

    const backendResponse = await fetch(backendUrl, {
      method,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    if (backendResponse.ok) {
      const responseData = await backendResponse.json();
      return NextResponse.json(responseData);
    } else {
      // Handle error responses
      let errorData;
      const contentType = backendResponse.headers.get('content-type') || '';
      
      if (contentType.includes('application/json')) {
        try {
          errorData = await backendResponse.json();
        } catch {
          errorData = { success: false, error: 'Workflow action failed' };
        }
      } else {
        errorData = { success: false, error: 'Workflow action failed' };
      }
      
      return NextResponse.json(errorData, { status: backendResponse.status });
    }

  } catch (error) {
    console.error('Workflow action API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}