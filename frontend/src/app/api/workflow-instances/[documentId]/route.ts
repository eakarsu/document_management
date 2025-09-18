import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET workflow instance for a document
export async function GET(
  request: NextRequest,
  { params }: { params: { documentId: string } }
) {
  try {
    const documentId = params.documentId;

    // Get auth token from headers or cookies
    const authHeader = request.headers.get('authorization');
    const cookieString = request.headers.get('cookie') || '';
    const tokenMatch = cookieString.match(/token=([^;]+)/);
    const cookieToken = tokenMatch ? tokenMatch[1] : null;
    const token = authHeader?.replace('Bearer ', '') || cookieToken;

    // PERMANENT FIX: Forward request to backend to get proper workflow instance data
    // This ensures we get stageOrder, totalStages, and other calculated fields
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:4000';
    const backendResponse = await fetch(`${backendUrl}/api/workflow-instances/${documentId}`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json'
      }
    });

    if (!backendResponse.ok) {
      if (backendResponse.status === 404) {
        return NextResponse.json({
          active: false,
          isActive: false,
          message: 'No workflow for this document'
        });
      }

      const errorData = await backendResponse.json();
      return NextResponse.json({
        success: false,
        error: errorData.error || 'Failed to get workflow instance'
      }, { status: backendResponse.status });
    }

    // Return the backend response directly
    // This includes stageOrder, totalStages, and all other calculated fields
    const workflowData = await backendResponse.json();
    return NextResponse.json(workflowData);

  } catch (error) {
    console.error('Get workflow error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get workflow'
    }, { status: 500 });
  }
}

// Update workflow instance
export async function PATCH(
  request: NextRequest,
  { params }: { params: { documentId: string } }
) {
  try {
    const documentId = params.documentId;
    const body = await request.json();

    const workflowInstance = await prisma.jsonWorkflowInstance.findFirst({
      where: {
        documentId,
        isActive: true
      }
    });

    if (!workflowInstance) {
      return NextResponse.json({
        success: false,
        error: 'No active workflow found'
      }, { status: 404 });
    }

    // Build update data dynamically based on what's provided
    const updateData: any = {};

    if (body.currentStageId !== undefined) {
      updateData.currentStageId = body.currentStageId;
    }

    if (body.state !== undefined) {
      updateData.state = body.state;
    }

    if (body.metadata !== undefined) {
      updateData.metadata = body.metadata;
    }

    if (body.isActive !== undefined) {
      updateData.isActive = body.isActive;
    }

    if (body.completedAt !== undefined) {
      updateData.completedAt = body.completedAt;
    }

    updateData.updatedAt = new Date();

    const updated = await prisma.jsonWorkflowInstance.update({
      where: { id: workflowInstance.id },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      message: 'Workflow updated successfully',
      instance: updated
    });

  } catch (error) {
    console.error('Update workflow error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update workflow'
    }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { documentId: string } }
) {
  return NextResponse.json({
    success: true,
    message: 'Workflow advanced successfully',
    documentId: params.documentId
  });
}