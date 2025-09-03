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
    const { documentId, stage, workflowId, ...feedbackData } = body;

    if (!stage) {
      return NextResponse.json({ 
        success: false, 
        error: 'Stage is required' 
      }, { status: 400 });
    }

    // Use the generic feedback endpoint for all stages
    let backendUrl = '';
    
    if (workflowId) {
      // Use generic feedback endpoint with workflowId
      backendUrl = `${process.env.BACKEND_URL || 'http://localhost:4000'}/api/workflow/8-stage/${workflowId}/feedback`;
    } else if (documentId && stage === '1st Coordination') {
      // Legacy ICU feedback endpoint for backward compatibility
      backendUrl = `${process.env.BACKEND_URL || 'http://localhost:4000'}/api/workflow/8-stage/icu/${documentId}/feedback`;
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'Either workflowId or (documentId and supported stage) is required' 
      }, { status: 400 });
    }

    const backendResponse = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(feedbackData)
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
          errorData = { success: false, error: 'Feedback submission failed' };
        }
      } else {
        errorData = { success: false, error: 'Feedback submission failed' };
      }
      
      return NextResponse.json(errorData, { status: backendResponse.status });
    }

  } catch (error) {
    console.error('Workflow feedback API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}