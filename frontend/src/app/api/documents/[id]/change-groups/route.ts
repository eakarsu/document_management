import { NextRequest, NextResponse } from 'next/server';

// Proxy requests to backend server
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const token = request.headers.get('authorization');

    const response = await fetch(`${BACKEND_URL}/api/editor/documents/${id}/change-groups`, {
      method: 'GET',
      headers: {
        'Authorization': token || '',
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error proxying change groups request:', error);
    return NextResponse.json(
      { error: 'Failed to fetch change groups', groups: [] },
      { status: 500 }
    );
  }
}