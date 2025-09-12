import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { template, pages, feedbacks, documentInfo } = body;

    // Validate input
    if (!template || !pages || !documentInfo) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Call the AI Air Force document generator script
    const { spawn } = require('child_process');
    const path = require('path');
    
    const backendPath = path.join(process.cwd(), '..', 'backend');
    const scriptPath = path.join(backendPath, 'create-ai-afi-document.js');

    // Prepare document info as JSON string
    const documentInfoJson = JSON.stringify(documentInfo);

    return new Promise((resolve) => {
      const child = spawn('node', [
        scriptPath,
        documentInfoJson,
        '--template', template,
        '--pages', pages.toString(),
        '--feedbacks', feedbacks.toString()
      ], {
        cwd: backendPath,
        env: { ...process.env }
      });

      let output = '';
      let errorOutput = '';

      child.stdout.on('data', (data: Buffer) => {
        output += data.toString();
      });

      child.stderr.on('data', (data: Buffer) => {
        errorOutput += data.toString();
      });

      child.on('close', (code: number) => {
        if (code === 0) {
          // Parse the output to extract document ID
          const idMatch = output.match(/ID: (af_ai_[a-zA-Z0-9_]+)/);
          const documentId = idMatch ? idMatch[1] : null;
          
          // Extract document info from output
          const sizeMatch = output.match(/Size: ([\d.]+) KB/);
          const paragraphsMatch = output.match(/Paragraphs: (\d+)/);
          const feedbackMatch = output.match(/Feedback Items: (\d+)/);
          const titleMatch = output.match(/Title: (.+)/);

          resolve(NextResponse.json({
            success: true,
            id: documentId,
            title: titleMatch ? titleMatch[1] : `${documentInfo.instructionTitle} - ${documentInfo.subject}`,
            pages: pages,
            size: sizeMatch ? sizeMatch[1] + ' KB' : 'Unknown',
            paragraphs: paragraphsMatch ? parseInt(paragraphsMatch[1]) : 0,
            feedbackCount: feedbackMatch ? parseInt(feedbackMatch[1]) : 0,
            template: template,
            documentInfo: documentInfo,
            output: output
          }));
        } else {
          console.error('AI Generator error:', errorOutput);
          resolve(NextResponse.json({
            error: 'Failed to generate AI document',
            details: errorOutput
          }, { status: 500 }));
        }
      });

      child.on('error', (error: Error) => {
        console.error('Spawn error:', error);
        resolve(NextResponse.json({
          error: 'Failed to start AI generator',
          details: error.message
        }, { status: 500 }));
      });
    });

  } catch (error) {
    console.error('Error generating AI document:', error);
    return NextResponse.json(
      { error: 'Failed to generate document' }, 
      { status: 500 }
    );
  }
}