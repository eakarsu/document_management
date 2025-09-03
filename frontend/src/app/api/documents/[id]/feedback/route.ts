import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get auth token
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    const userId = decoded.userId;

    // Get request body
    const body = await request.json();
    const { comments, userRole } = body;
    const documentId = params.id;

    // Get the document
    const document = await prisma.document.findUnique({
      where: { id: documentId }
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Save feedback to document's customFields
    const existingFeedback = document.customFields as any || {};
    const crmFeedback = existingFeedback.crmFeedback || [];
    
    // Add new comments with metadata
    const newFeedback = comments.map((comment: any) => ({
      ...comment,
      id: `crm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      userRole,
      createdAt: new Date().toISOString(),
      status: 'pending'
    }));

    // Merge with existing feedback
    const updatedFeedback = [...crmFeedback, ...newFeedback];

    // Check for critical comments
    const hasCritical = newFeedback.some((c: any) => c.commentType === 'C');
    
    // Update document with new feedback
    const updatedDocument = await prisma.document.update({
      where: { id: documentId },
      data: {
        customFields: {
          ...existingFeedback,
          crmFeedback: updatedFeedback,
          hasCriticalComments: hasCritical || existingFeedback.hasCriticalComments,
          lastFeedbackAt: new Date().toISOString(),
          totalComments: updatedFeedback.length
        }
      }
    });

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        action: 'CRM_FEEDBACK_ADDED',
        entityType: 'Document',
        entityId: documentId,
        userId,
        metadata: {
          commentCount: newFeedback.length,
          hasCritical,
          commentTypes: newFeedback.map((c: any) => c.commentType)
        }
      }
    });

    // If there are critical comments, update document status
    if (hasCritical) {
      await prisma.document.update({
        where: { id: documentId },
        data: {
          customFields: {
            ...updatedDocument.customFields as any,
            requiresAttention: true,
            criticalIssuesFound: true
          }
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'CRM feedback submitted successfully',
      feedbackCount: updatedFeedback.length,
      hasCritical
    });

  } catch (error) {
    console.error('Error saving CRM feedback:', error);
    return NextResponse.json(
      { error: 'Failed to save feedback' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const documentId = params.id;

    // Get the document
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      select: {
        customFields: true
      }
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const customFields = document.customFields as any || {};
    const crmFeedback = customFields.crmFeedback || [];

    return NextResponse.json({
      feedback: crmFeedback,
      totalComments: crmFeedback.length,
      hasCritical: crmFeedback.some((c: any) => c.commentType === 'C')
    });

  } catch (error) {
    console.error('Error fetching CRM feedback:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feedback' },
      { status: 500 }
    );
  }
}