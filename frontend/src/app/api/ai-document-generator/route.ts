import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Generate realistic Air Force document content
function generateDocumentContent(template: string, pages: number, subject: string): string {
  const sections = [];

  // Introduction
  sections.push(`
    <h1>1. INTRODUCTION</h1>
    <p>This document establishes policies and procedures for ${subject}. It provides comprehensive guidance to ensure standardized implementation across all units and organizations.</p>
    <p>The procedures outlined herein are designed to enhance operational effectiveness while maintaining compliance with applicable regulations and directives.</p>
  `);

  // Scope
  sections.push(`
    <h2>2. SCOPE AND APPLICABILITY</h2>
    <p>This instruction applies to all Air Force personnel, including Active Duty, Air Force Reserve, and Air National Guard units. Contractors and civilian employees shall comply with applicable sections as determined by their supervisory chain.</p>
    <p>Ensure all records created as a result of processes prescribed in this publication are maintained in accordance with Air Force Manual (AFMAN) 33-363, Management of Records.</p>
  `);

  // Responsibilities
  sections.push(`
    <h2>3. RESPONSIBILITIES</h2>
    <h3>3.1 Headquarters Air Force</h3>
    <p>Develops policy and provides oversight for implementation across Major Commands (MAJCOMs). Conducts periodic reviews to ensure compliance and effectiveness.</p>
    <h3>3.2 Major Commands</h3>
    <p>Implement headquarters guidance and develop supplemental instructions as needed. Provide training and resources to subordinate units.</p>
    <h3>3.3 Wing Commanders</h3>
    <p>Ensure compliance within their organizations. Appoint qualified personnel to manage program implementation.</p>
  `);

  // Procedures
  sections.push(`
    <h2>4. PROCEDURES</h2>
    <h3>4.1 Initial Implementation</h3>
    <p>Units shall establish local operating procedures within 90 days of publication. These procedures must align with the requirements specified in this instruction while addressing unique mission requirements.</p>
    <h3>4.2 Training Requirements</h3>
    <p>All personnel must complete initial training within 60 days of assignment. Annual refresher training is mandatory for all assigned personnel.</p>
    <h3>4.3 Documentation</h3>
    <p>Maintain all required documentation in accordance with records management guidelines. Documentation must be readily accessible for inspection and audit purposes.</p>
  `);

  // Compliance
  sections.push(`
    <h2>5. COMPLIANCE AND ENFORCEMENT</h2>
    <p>Compliance with this instruction is mandatory. Violations may result in administrative or disciplinary action under the Uniform Code of Military Justice (UCMJ).</p>
    <p>Unit commanders shall conduct quarterly reviews to ensure compliance. Discrepancies must be documented and corrective actions implemented within 30 days.</p>
  `);

  // Add more sections based on page count
  if (pages > 3) {
    sections.push(`
      <h2>6. QUALITY ASSURANCE</h2>
      <p>Establish quality assurance programs to monitor effectiveness and identify areas for improvement. Metrics shall be reported quarterly through appropriate channels.</p>
      <p>Continuous process improvement initiatives should be documented and shared across the enterprise for potential implementation.</p>
    `);
  }

  if (pages > 5) {
    sections.push(`
      <h2>7. RESOURCES AND SUPPORT</h2>
      <p>Resources required for implementation shall be identified during the planning phase. Funding requirements must be submitted through appropriate budget channels.</p>
      <p>Technical support is available through the designated help desk. Additional guidance can be obtained from the functional area manager.</p>
    `);
  }

  // Summary
  sections.push(`
    <h2>8. SUMMARY</h2>
    <p>This instruction provides the framework for effective implementation of ${subject} procedures. Adherence to these guidelines ensures operational excellence and regulatory compliance.</p>
    <p>Questions regarding this instruction should be directed to the Office of Primary Responsibility (OPR) listed in the document header.</p>
  `);

  return sections.join('\n');
}

export async function POST(request: NextRequest) {
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
    const { template, pages, feedbackCount, headerData } = body;

    // Generate document content
    const content = generateDocumentContent(
      template,
      pages || 5,
      headerData?.subject || 'Air Force Operations'
    );

    // Generate unique checksum for the document
    const checksum = `ai-${template}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const storagePath = `/ai-generated/${userId}/${checksum}.html`;

    // Create document in database
    const newDocument = await prisma.document.create({
      data: {
        title: headerData?.documentType || 'AIR FORCE INSTRUCTION',
        description: headerData?.subject || 'AI Generated Document',
        fileName: `${template}-${Date.now()}.html`,
        originalName: `${template}-document.html`,
        mimeType: 'text/html',
        fileSize: content.length,
        checksum: checksum,
        storagePath: storagePath,
        storageProvider: 'local',
        status: 'DRAFT',
        category: template.toUpperCase(),
        ocrText: content, // Store the generated content here
        ocrProcessed: true,
        aiClassification: template,
        aiTags: ['ai-generated', template, 'military', 'instruction'],
        aiConfidence: 0.95,
        createdById: userId,
        organizationId: decoded.organizationId,
        customFields: {
          headerData,
          template,
          pages,
          feedbackCount,
          isAIGenerated: true,
          generatedAt: new Date().toISOString()
        }
      }
    });

    // Add some sample feedback if requested
    if (feedbackCount > 0) {
      const feedbackItems = [];
      for (let i = 0; i < feedbackCount; i++) {
        feedbackItems.push({
          id: `feedback_${i}`,
          commentType: i % 3 === 0 ? 'C' : i % 2 === 0 ? 'S' : 'A',
          content: `Sample feedback comment ${i + 1}`,
          section: `Section ${Math.floor(i / 2) + 1}`,
          status: 'pending',
          createdAt: new Date().toISOString()
        });
      }

      await prisma.document.update({
        where: { id: newDocument.id },
        data: {
          customFields: {
            ...newDocument.customFields as any,
            crmFeedback: feedbackItems,
            hasCriticalComments: feedbackItems.some(f => f.commentType === 'C'),
            totalComments: feedbackItems.length
          }
        }
      });
    }

    return NextResponse.json({
      documentId: newDocument.id,
      title: newDocument.title,
      feedbackCount: feedbackCount || 0,
      message: 'Document generated successfully'
    });

  } catch (error) {
    console.error('Error generating AI document:', error);
    return NextResponse.json(
      { error: 'Failed to generate document' },
      { status: 500 }
    );
  }
}