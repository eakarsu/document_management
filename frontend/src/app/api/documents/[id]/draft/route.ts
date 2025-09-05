import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // This is a draft endpoint - allow without auth for testing
    const body = await request.json();
    
    // Get current document
    const document = await prisma.document.findUnique({
      where: { id: params.id }
    });

    if (!document) {
      return NextResponse.json({ 
        success: false, 
        error: 'Document not found' 
      }, { status: 404 });
    }

    // Merge customFields
    const currentCustomFields = document.customFields as any || {};
    const updatedCustomFields = {
      ...currentCustomFields,
      ...body.customFields
    };

    // Update document
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
    console.error('PATCH error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // This is a draft endpoint - allow without auth for testing
    const document = await prisma.document.findUnique({
      where: { id: params.id },
      select: { customFields: true }
    });

    if (!document) {
      return NextResponse.json({ 
        success: false, 
        error: 'Document not found' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      customFields: document.customFields
    });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}