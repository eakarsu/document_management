import { NextRequest, NextResponse } from 'next/server';
import { DynamicWorkflowService } from '../../../../../backend/src/services/DynamicWorkflowService';

const workflowService = new DynamicWorkflowService();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const category = searchParams.get('category');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    const templates = await workflowService.getWorkflowTemplates(
      organizationId,
      category || undefined
    );

    return NextResponse.json({
      success: true,
      templates
    });
  } catch (error) {
    console.error('Error fetching workflow templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflow templates' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      category,
      steps,
      roles,
      createdBy,
      organizationId,
      tags
    } = body;

    // Validate required fields
    if (!name || !description || !steps || !createdBy || !organizationId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await workflowService.createWorkflowTemplate({
      name,
      description,
      category: category || 'Custom',
      steps,
      roles: roles || [],
      createdBy,
      organizationId,
      tags
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      template: result.template
    });
  } catch (error) {
    console.error('Error creating workflow template:', error);
    return NextResponse.json(
      { error: 'Failed to create workflow template' },
      { status: 500 }
    );
  }
}