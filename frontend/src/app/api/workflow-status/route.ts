import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const documentId = searchParams.get('documentId');
  const action = searchParams.get('action') || 'get_status';
  
  if (!documentId) {
    return NextResponse.json({ 
      success: false, 
      error: 'Document ID is required' 
    }, { status: 400 });
  }

  try {
    // Get access token from cookies
    const accessToken = request.cookies.get('accessToken')?.value;
    
    if (!accessToken) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    // Forward to backend workflow endpoint
    const backendUrl = `${process.env.BACKEND_URL || 'http://localhost:4000'}/api/workflow/8-stage/document/${documentId}`;

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
        error: 'Workflow operation failed' 
      }, { status: backendResponse.status });
    }

  } catch (error) {
    console.error('Workflow status API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

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
    const { documentId, action } = body;

    if (!documentId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Document ID is required' 
      }, { status: 400 });
    }

    // Forward to backend workflow endpoint
    let backendUrl = '';
    let method = 'GET';
    let requestBody = null;

    switch (action) {
      case 'get_status':
        backendUrl = `${process.env.BACKEND_URL || 'http://localhost:4000'}/api/workflow/8-stage/document/${documentId}`;
        method = 'GET';
        break;
      case 'start_workflow':
        backendUrl = `${process.env.BACKEND_URL || 'http://localhost:4000'}/api/workflow/8-stage/start/${documentId}`;
        method = 'POST';
        requestBody = JSON.stringify({ documentId });
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
      ...(requestBody && { body: requestBody })
    });

    if (backendResponse.ok) {
      const responseData = await backendResponse.json();
      return NextResponse.json(responseData);
    } else if (backendResponse.status === 401) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication failed' 
      }, { status: 401 });
    } else {
      // Handle error responses
      let errorData;
      const contentType = backendResponse.headers.get('content-type') || '';
      
      if (contentType.includes('application/json')) {
        try {
          errorData = await backendResponse.json();
        } catch {
          errorData = { success: false, error: 'Workflow operation failed' };
        }
      } else {
        errorData = { success: false, error: 'Workflow operation failed' };
      }
      
      return NextResponse.json(errorData, { status: backendResponse.status });
    }

  } catch (error) {
    console.error('Workflow status API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}