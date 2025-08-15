import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get token from Authorization header or cookies
    let token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      token = request.cookies.get('accessToken')?.value;
    }

    // Forward logout request to backend if we have a token
    if (token) {
      try {
        await fetch(`${process.env.BACKEND_URL || 'http://localhost:4000'}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      } catch (error) {
        // Continue with logout even if backend request fails
        console.error('Backend logout error:', error);
      }
    }

    // Clear cookies regardless of backend response
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });

    response.cookies.delete('accessToken');
    response.cookies.delete('refreshToken');

    return response;

  } catch (error) {
    console.error('Logout API error:', error);
    
    // Still clear cookies and return success even on error
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });

    response.cookies.delete('accessToken');
    response.cookies.delete('refreshToken');

    return response;
  }
}