import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const documentId = params.id;
    const body = await request.json();
    
    // Get auth token from cookies
    const authToken = request.cookies.get('auth-token')?.value;
    
    if (!authToken) {
      return NextResponse.json(
        { success: false, message: 'No auth token found' },
        { status: 401 }
      );
    }

    // Forward request to backend
    const response = await fetch(`${BACKEND_URL}/api/editor/documents/${documentId}/supplement/ai-generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: data.message || 'Failed to generate AI suggestions' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error generating AI supplement suggestions:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}