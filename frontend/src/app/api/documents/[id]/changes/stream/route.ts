import { NextRequest } from 'next/server';

// Server-Sent Events proxy for real-time change updates
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id: documentId } = params;
  
  try {
    const token = request.nextUrl.searchParams.get('token') || request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return new Response(JSON.stringify({
        error: 'Authentication token required for change stream'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Proxy the stream to the backend
    const backendResponse = await fetch(`${BACKEND_URL}/api/editor/documents/${documentId}/changes/stream`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'text/event-stream',
      },
    });

    if (!backendResponse.ok) {
      return new Response(JSON.stringify({
        error: 'Backend stream connection failed',
        status: backendResponse.status
      }), {
        status: backendResponse.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Return the proxied stream response
    return new Response(backendResponse.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
      },
    });

  } catch (error) {
    console.error('Error setting up change stream proxy:', error);
    return new Response(JSON.stringify({
      error: 'Failed to set up change stream proxy',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}