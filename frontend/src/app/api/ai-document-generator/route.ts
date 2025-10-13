import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get auth token
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get request body
    const body = await request.json();
    console.log('Document Generator - Request body keys:', Object.keys(body));
    console.log('Document Generator - Template:', body.template);
    console.log('Document Generator - Has seal image:', !!body.sealImage);

    // Forward to backend document generator service
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:4000';
    console.log('Document Generator - Backend URL:', backendUrl);
    const backendResponse = await fetch(`${backendUrl}/api/ai-document-generator`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Backend response error:', {
        status: backendResponse.status,
        statusText: backendResponse.statusText,
        error: errorData
      });
      return NextResponse.json(
        { error: errorData.error || 'Failed to generate document', details: errorData.details },
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error generating document:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate document';
    console.error('Full error details:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}