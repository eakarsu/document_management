import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; versionId: string } }
) {
  try {
    const cookieStore = cookies();
    const accessToken = cookieStore.get('accessToken')?.value;

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:4000';
    const response = await fetch(`${backendUrl}/api/documents/${params.id}/versions/${params.versionId}/download`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (response.status === 404) {
        return NextResponse.json({ error: 'Version not found' }, { status: 404 });
      }
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    // Get the file content and headers from backend
    const fileBlob = await response.blob();
    const contentDisposition = response.headers.get('Content-Disposition');
    const contentType = response.headers.get('Content-Type');

    // Create response with the file
    const fileResponse = new NextResponse(fileBlob);
    
    if (contentDisposition) {
      fileResponse.headers.set('Content-Disposition', contentDisposition);
    }
    if (contentType) {
      fileResponse.headers.set('Content-Type', contentType);
    }

    return fileResponse;

  } catch (error) {
    console.error('Document version download API error:', error);
    return NextResponse.json(
      { error: 'Failed to download document version' },
      { status: 500 }
    );
  }
}