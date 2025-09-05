import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get access token from cookies or headers
    let accessToken = request.cookies.get('accessToken')?.value;

    // If no cookie, try Authorization header
    if (!accessToken) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        accessToken = authHeader.substring(7);
      }
    }
    
    if (!accessToken) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    // Forward to backend with token for document details
    const backendResponse = await fetch(`${process.env.BACKEND_URL || 'http://localhost:4000'}/api/documents/${params.id}`, {
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
      const errorData = await backendResponse.json();
      return NextResponse.json(errorData, { status: backendResponse.status });
    }

  } catch (error) {
    console.error('Document details API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get access token from cookies or headers
    let accessToken = request.cookies.get('accessToken')?.value;

    // If no cookie, try Authorization header
    if (!accessToken) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        accessToken = authHeader.substring(7);
      }
    }
    
    if (!accessToken) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    // Forward to backend with token
    const backendResponse = await fetch(`${process.env.BACKEND_URL || 'http://localhost:4000'}/api/documents/${params.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      }
    });

    if (backendResponse.ok) {
      const responseData = await backendResponse.json();
      return NextResponse.json(responseData);
    } else {
      const errorData = await backendResponse.json();
      return NextResponse.json(errorData, { status: backendResponse.status });
    }

  } catch (error) {
    console.error('Delete API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    // Get current document directly from database
    const currentDoc = await prisma.document.findUnique({
      where: { id: params.id }
    });

    if (!currentDoc) {
      return NextResponse.json({ 
        success: false, 
        error: "Document not found" 
      }, { status: 404 });
    }
    
    // Merge customFields
    const currentCustomFields = currentDoc.customFields as any || {};
    const updatedCustomFields = {
      ...currentCustomFields,
      ...(body.customFields || {})
    };

    // Update document directly in database
    const updatedDocument = await prisma.document.update({
      where: { id: params.id },
      data: {
        customFields: updatedCustomFields
      }
    });

    return NextResponse.json({
      success: true,
      document: updatedDocument
    });

  } catch (error) {
    console.error("PATCH API error:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Internal server error" 
    }, { status: 500 });
  }
}
