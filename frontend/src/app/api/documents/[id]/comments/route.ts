import { NextRequest, NextResponse } from 'next/server';

// Simple GET endpoint that returns empty array to avoid 404
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Return empty comments array to avoid 404 errors
  // This prevents the frontend from throwing errors
  return NextResponse.json([]);
}

// Simple POST endpoint for adding comments
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    // For now, just return success
    return NextResponse.json({
      success: true,
      message: 'Comment endpoint placeholder'
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process comment' },
      { status: 500 }
    );
  }
}