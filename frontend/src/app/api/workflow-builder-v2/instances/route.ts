import { NextRequest, NextResponse } from 'next/server';
import { DynamicWorkflowService } from '../../../../../backend/src/services/DynamicWorkflowService';

const workflowService = new DynamicWorkflowService();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { templateId, documentId, createdBy, variables } = body;

    if (!templateId || !documentId || !createdBy) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await workflowService.startWorkflowInstance({
      templateId,
      documentId,
      createdBy,
      variables
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      instance: result.instance
    });
  } catch (error) {
    console.error('Error starting workflow instance:', error);
    return NextResponse.json(
      { error: 'Failed to start workflow instance' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { instanceId, userId, userRole, action, comments, data } = body;

    if (!instanceId || !userId || !userRole || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await workflowService.advanceWorkflow({
      instanceId,
      userId,
      userRole,
      action,
      comments,
      data
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      nextStep: result.nextStep
    });
  } catch (error) {
    console.error('Error advancing workflow:', error);
    return NextResponse.json(
      { error: 'Failed to advance workflow' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const instanceId = searchParams.get('instanceId');

    if (!instanceId) {
      return NextResponse.json(
        { error: 'Instance ID is required' },
        { status: 400 }
      );
    }

    const instance = await workflowService.getWorkflowInstance(instanceId);

    if (!instance) {
      return NextResponse.json(
        { error: 'Workflow instance not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      instance
    });
  } catch (error) {
    console.error('Error fetching workflow instance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflow instance' },
      { status: 500 }
    );
  }
}