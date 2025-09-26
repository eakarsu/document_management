import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const documentId = params.id;
    const { content } = await request.json();

    // First check if document exists
    const existingDoc = await prisma.document.findUnique({
      where: { id: documentId }
    });

    if (!existingDoc) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Update with provided content or default content using ocrText field
    const updatedDocument = await prisma.document.update({
      where: { id: documentId },
      data: {
        ocrText: content || existingDoc.ocrText || 'This is a sample document content. You can edit this content.'
      }
    });

    // Return with content field for backward compatibility
    return NextResponse.json({
      ...updatedDocument,
      content: updatedDocument.ocrText
    });
  } catch (error) {
    console.error('Error updating document content:', error);
    return NextResponse.json(
      { error: 'Failed to update document content' },
      { status: 500 }
    );
  }
}

// Add GET method to fetch document content
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const documentId = params.id;

    const document = await prisma.document.findUnique({
      where: { id: documentId },
      select: {
        id: true,
        title: true,
        ocrText: true
      }
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Get content from ocrText field
    const documentContent = document.ocrText;

    // Ensure document has content
    if (!documentContent) {
      // Update document with default content if empty
      const updated = await prisma.document.update({
        where: { id: documentId },
        data: {
          ocrText: 'This is a sample document content. You can edit this content.'
        }
      });
      return NextResponse.json({
        ...updated,
        content: updated.ocrText
      });
    }

    // Return with content field for backward compatibility
    return NextResponse.json({
      ...document,
      content: documentContent
    });
  } catch (error) {
    console.error('Error fetching document content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch document content' },
      { status: 500 }
    );
  }
}