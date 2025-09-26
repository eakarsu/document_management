import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { authTokenService } from '@/lib/authTokenService';

const prisma = new PrismaClient();

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; feedbackId: string } }
) {
  try {
    const { id: documentId, feedbackId } = params;
    const updatedFeedback = await request.json();
    
    // Get the document
    const document = await prisma.document.findUnique({
      where: { id: documentId }
    });
    
    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }
    
    // Get existing feedback
    const customFields = document.customFields as any || {};
    const feedback = customFields.feedback || [];
    
    // Update the specific feedback item
    const updatedFeedbackList = feedback.map((item: any) => 
      item.id === feedbackId ? { ...item, ...updatedFeedback } : item
    );
    
    // Save back to database
    await prisma.document.update({
      where: { id: documentId },
      data: {
        customFields: {
          ...customFields,
          feedback: updatedFeedbackList,
          lastOPRUpdate: new Date().toISOString()
        }
      }
    });
    
    return NextResponse.json({
      success: true,
      feedback: updatedFeedback
    });
    
  } catch (error) {
    console.error('Error updating feedback:', error);
    return NextResponse.json(
      { error: 'Failed to update feedback' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; feedbackId: string } }
) {
  try {
    const { id: documentId, feedbackId } = params;
    
    // Get the document
    const document = await prisma.document.findUnique({
      where: { id: documentId }
    });
    
    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }
    
    // Get existing feedback
    const customFields = document.customFields as any || {};
    const feedback = customFields.feedback || [];
    
    // Remove the specific feedback item
    const updatedFeedbackList = feedback.filter((item: any) => item.id !== feedbackId);
    
    // Save back to database
    await prisma.document.update({
      where: { id: documentId },
      data: {
        customFields: {
          ...customFields,
          feedback: updatedFeedbackList,
          lastOPRUpdate: new Date().toISOString()
        }
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Feedback deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting feedback:', error);
    return NextResponse.json(
      { error: 'Failed to delete feedback' },
      { status: 500 }
    );
  }
}