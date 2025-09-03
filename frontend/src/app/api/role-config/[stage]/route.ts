import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: { stage: string } }) {
  try {
    const { stage } = params;
    
    const accessToken = request.cookies.get('accessToken')?.value;
    if (!accessToken) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const backendUrl = `${process.env.BACKEND_URL || 'http://localhost:4000'}/api/workflow/8-stage/role-config/${stage}`;
    
    const backendResponse = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      }
    });

    const data = await backendResponse.json();
    
    if (!backendResponse.ok) {
      return NextResponse.json(data, { status: backendResponse.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error getting role config:', error);
    return NextResponse.json(
      { error: 'Failed to get role configuration' },
      { status: 500 }
    );
  }
}