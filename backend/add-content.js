const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addContent() {
  try {
    // Get the first document
    const document = await prisma.document.findFirst();

    if (!document) {
      console.log('No documents found');
      return;
    }

    const sampleContent = `
      <h1>Air Force Document Management System</h1>
      <p>This is a sample document with rich content for testing the editor functionality.</p>

      <h2>Section 1: Introduction</h2>
      <p>This section provides an overview of the document management system and its capabilities.</p>
      <ul>
        <li>Document creation and editing</li>
        <li>Workflow management</li>
        <li>Version control</li>
        <li>Collaboration features</li>
      </ul>

      <h2>Section 2: Features</h2>
      <p>The system includes the following key features:</p>
      <ol>
        <li><strong>Rich Text Editor</strong>: Full-featured editor with formatting options</li>
        <li><strong>Document Templates</strong>: Pre-defined templates for different document types</li>
        <li><strong>Review Process</strong>: Multi-stage review and approval workflow</li>
        <li><strong>Comments and Feedback</strong>: Collaborative review with inline comments</li>
      </ol>

      <h2>Section 3: Usage Instructions</h2>
      <p>To use the editor effectively:</p>
      <blockquote>
        <p>Click the Edit button to open the document editor. You can format text, add headings, create lists, and more.</p>
      </blockquote>

      <p>For more information, contact the system administrator.</p>
    `;

    // Update the document with content
    await prisma.document.update({
      where: { id: document.id },
      data: {
        customFields: {
          ...document.customFields,
          content: sampleContent
        }
      }
    });

    console.log(`Added content to document: ${document.title} (ID: ${document.id})`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addContent();