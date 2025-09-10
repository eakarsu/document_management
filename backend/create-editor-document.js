#!/usr/bin/env node

/**
 * Editor-Style Document Generator
 * Creates documents that simulate TipTap editor output with rich formatting
 * 
 * Usage:
 *   node create-editor-document.js <template> <size_kb> <feedbacks> [title]
 * 
 * Examples:
 *   node create-editor-document.js technical 30 10
 *   node create-editor-document.js af-manual 50 20 "My Custom Title"
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length < 3 || args.includes('--help') || args.includes('-h')) {
  console.log(`
📝 Editor-Style Document Generator

Usage: node create-editor-document.js <template> <size_kb> <feedbacks> [title]

Arguments:
  template   - Template type: af-manual, technical, policy, training, sop
  size_kb    - Target document size in KB (10-500)
  feedbacks  - Number of feedback entries to create (0-1000)  
  title      - Optional: Custom document title

Examples:
  node create-editor-document.js technical 30 10       (creates ~9 page document)
  node create-editor-document.js af-manual 50 20       (creates ~15 page document)
  node create-editor-document.js policy 100 30         (creates ~30 page document)
  
Note: Creates documents with rich formatting as if created in TipTap editor
      Includes tables, lists, bold/italic text, and code blocks
      Content quality is higher than CLI generators but takes same time
  `);
  process.exit(0);
}

const template = args[0];
const targetSizeKB = parseInt(args[1]);
const feedbacks = parseInt(args[2]);
const customTitle = args[3] || null;

// Validate inputs
if (!['af-manual', 'technical', 'policy', 'training', 'sop'].includes(template)) {
  console.error('❌ Invalid template. Choose: af-manual, technical, policy, training, sop');
  process.exit(1);
}

if (isNaN(targetSizeKB) || targetSizeKB < 10 || targetSizeKB > 500) {
  console.error('❌ Size must be between 10 and 500 KB');
  process.exit(1);
}

if (isNaN(feedbacks) || feedbacks < 0 || feedbacks > 1000) {
  console.error('❌ Feedbacks must be a number between 0 and 1000');
  process.exit(1);
}

// Convert KB to bytes
const targetSizeBytes = targetSizeKB * 1024;

// Content generation functions with rich formatting
function generateRichParagraph() {
  const sentenceTemplates = [
    'The <strong>{noun}</strong> provides a {adjective} foundation for {goal}.',
    'Users can leverage <em>{feature}</em> to optimize their {process} and increase {metric}.',
    'The <strong>{phase}</strong> requires {requirement} and <em>{consideration}</em>.',
    '{metric} show <strong>{improvement}</strong> in {area} and {area2}.',
    '{document} should be <em>{quality1}</em>, and <strong>{quality2}</strong> for all {stakeholders}.',
    '{security} include <strong>{method1}</strong>, <em>{method2}</em>, and {method3}.',
    'The <strong>{framework}</strong> ensures {quality} through <em>{validation}</em>.',
    '{strategy} focus on <strong>{goal1}</strong> and {goal2}.'
  ];
  
  const replacements = {
    noun: ['system architecture', 'data pipeline', 'service layer', 'network topology', 'database schema'],
    adjective: ['robust', 'scalable', 'flexible', 'reliable', 'efficient'],
    goal: ['scalable applications', 'high performance', 'data integrity', 'system reliability', 'operational efficiency'],
    feature: ['advanced analytics', 'real-time monitoring', 'automated workflows', 'intelligent caching', 'predictive algorithms'],
    process: ['workflow', 'operations', 'development cycle', 'deployment pipeline', 'testing procedures'],
    metric: ['productivity', 'efficiency', 'throughput', 'response time', 'accuracy'],
    phase: ['implementation phase', 'design phase', 'testing phase', 'deployment phase', 'planning phase'],
    requirement: ['careful planning', 'thorough analysis', 'detailed documentation', 'comprehensive testing', 'stakeholder approval'],
    consideration: ['attention to detail', 'risk assessment', 'resource allocation', 'timeline management', 'quality assurance'],
    improvement: ['significant improvements', 'measurable gains', 'notable enhancements', 'substantial progress', 'marked advancement'],
    area: ['processing speed', 'data throughput', 'system stability', 'error rates', 'user satisfaction'],
    area2: ['efficiency', 'reliability', 'maintainability', 'scalability', 'performance'],
    document: ['Documentation', 'Specifications', 'Requirements', 'Procedures', 'Guidelines'],
    quality1: ['clear, concise', 'detailed', 'accurate', 'up-to-date', 'well-organized'],
    quality2: ['comprehensive', 'accessible', 'actionable', 'verifiable', 'traceable'],
    stakeholders: ['stakeholders', 'team members', 'developers', 'operators', 'management'],
    security: ['Security measures', 'Protection mechanisms', 'Safety protocols', 'Access controls', 'Defense strategies'],
    method1: ['encryption', 'tokenization', 'hashing', 'digital signatures', 'secure channels'],
    method2: ['authentication', 'authorization', 'verification', 'validation', 'certification'],
    method3: ['access control', 'audit logging', 'intrusion detection', 'threat monitoring', 'compliance checking'],
    framework: ['testing framework', 'development framework', 'security framework', 'monitoring framework', 'deployment framework'],
    quality: ['code quality', 'data quality', 'service quality', 'process quality', 'output quality'],
    validation: ['automated validation', 'continuous testing', 'real-time verification', 'comprehensive checks', 'systematic review'],
    strategy: ['Deployment strategies', 'Migration strategies', 'Backup strategies', 'Recovery strategies', 'Optimization strategies'],
    goal1: ['zero-downtime updates', 'seamless transitions', 'data consistency', 'service continuity', 'minimal disruption'],
    goal2: ['rollback capabilities', 'disaster recovery', 'fault tolerance', 'load balancing', 'auto-scaling']
  };
  
  let paragraph = '';
  const numSentences = 3 + Math.floor(Math.random() * 3);
  for (let i = 0; i < numSentences; i++) {
    let template = sentenceTemplates[Math.floor(Math.random() * sentenceTemplates.length)];
    // Replace all placeholders
    template = template.replace(/{(\w+)}/g, (match, key) => {
      const options = replacements[key];
      return options ? options[Math.floor(Math.random() * options.length)] : match;
    });
    paragraph += template + ' ';
  }
  return `<p>${paragraph.trim()}</p>`;
}

function generateTable() {
  const headers = ['Parameter', 'Value', 'Description', 'Status'];
  const rows = [
    ['Performance', '98%', 'System efficiency metric', '<strong>Optimal</strong>'],
    ['Uptime', '99.9%', 'Service availability', '<em>Excellent</em>'],
    ['Response Time', '<50ms', 'Average latency', '<strong>Fast</strong>'],
    ['Throughput', '10K req/s', 'Request processing rate', 'Normal'],
    ['Memory Usage', '2.1 GB', 'RAM consumption', '<em>Acceptable</em>']
  ];
  
  let table = '<table>\n<thead>\n<tr>\n';
  for (let i = 0; i < 3; i++) {
    table += `<th>${headers[i]}</th>\n`;
  }
  table += '</tr>\n</thead>\n<tbody>\n';
  
  const numRows = 3 + Math.floor(Math.random() * 3);
  for (let i = 0; i < numRows; i++) {
    const row = rows[i % rows.length];
    table += '<tr>\n';
    for (let j = 0; j < 3; j++) {
      table += `<td>${row[j]}</td>\n`;
    }
    table += '</tr>\n';
  }
  table += '</tbody>\n</table>';
  
  return table;
}

function generateList(ordered = false) {
  const items = [
    'Configure the <strong>primary database</strong> connection',
    'Set up <em>authentication middleware</em> for security',
    'Initialize the <strong>caching layer</strong> for performance',
    'Deploy <em>monitoring tools</em> for system health',
    'Implement <strong>backup procedures</strong> for data safety',
    'Configure <em>load balancing</em> for scalability',
    'Set up <strong>logging infrastructure</strong> for debugging',
    'Enable <em>rate limiting</em> to prevent abuse'
  ];
  
  const tag = ordered ? 'ol' : 'ul';
  let list = `<${tag}>\n`;
  
  const numItems = 3 + Math.floor(Math.random() * 4);
  for (let i = 0; i < numItems; i++) {
    list += `<li>${items[Math.floor(Math.random() * items.length)]}</li>\n`;
  }
  list += `</${tag}>`;
  
  return list;
}

function generateCodeBlock() {
  const codeExamples = [
    `// Configuration example
const config = {
  database: {
    host: 'localhost',
    port: 5432,
    name: 'production_db'
  },
  cache: {
    enabled: true,
    ttl: 3600
  }
};`,
    `// Function implementation
function processDocument(doc) {
  const validated = validateStructure(doc);
  const processed = applyTransformations(validated);
  return saveToDatabase(processed);
}`,
    `// API endpoint
app.post('/api/documents', async (req, res) => {
  try {
    const result = await createDocument(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});`,
    `// Testing example
describe('Document Service', () => {
  test('should create document', async () => {
    const doc = await service.create(testData);
    expect(doc).toBeDefined();
    expect(doc.id).toBeTruthy();
  });
});`
  ];
  
  return `<pre><code>${codeExamples[Math.floor(Math.random() * codeExamples.length)]}</code></pre>`;
}

// Template-specific content generators
function generateAFManualSection(sectionNum) {
  const chapterNames = ['Flight Operations', 'Emergency Procedures', 'Systems Management', 'Maintenance Procedures', 'Performance Data'];
  const chapterName = chapterNames[sectionNum % chapterNames.length];
  
  return `
    <h1>Chapter ${sectionNum}: ${chapterName}</h1>
    
    <h2>Section ${sectionNum}.1 - Overview</h2>
    ${generateRichParagraph()}
    
    <h3>${sectionNum}.1.1 General Information</h3>
    ${generateRichParagraph()}
    
    <div style="border: 2px solid red; padding: 10px; margin: 20px 0;">
      <strong>⚠️ WARNING:</strong> Critical safety information must be reviewed before operation. 
      Failure to comply may result in <em>equipment damage</em> or <strong>personal injury</strong>.
    </div>
    
    <h3>${sectionNum}.1.2 System Components</h3>
    ${generateRichParagraph()}
    ${generateTable()}
    
    <h2>Section ${sectionNum}.2 - Procedures</h2>
    <p>Follow these <strong>mandatory steps</strong> in the exact order specified:</p>
    ${generateList(true)}
    
    <h3>${sectionNum}.2.1 Pre-Operation Checklist</h3>
    ${generateList(true)}
    
    <div style="border: 2px solid orange; padding: 10px; margin: 20px 0;">
      <strong>⚡ CAUTION:</strong> Ensure all <em>safety protocols</em> are followed during operation.
    </div>
    
    <h3>${sectionNum}.2.2 Normal Operation</h3>
    ${generateRichParagraph()}
    ${generateRichParagraph()}
  `;
}

function generateTechnicalSection(sectionNum) {
  return `
    <h2>${sectionNum}. Technical Implementation</h2>
    
    <h3>${sectionNum}.1 Overview</h3>
    ${generateRichParagraph()}
    
    <h3>${sectionNum}.2 Architecture Design</h3>
    ${generateRichParagraph()}
    ${generateTable()}
    
    <h3>${sectionNum}.3 Implementation Details</h3>
    <p>The following <strong>code example</strong> demonstrates the core functionality:</p>
    ${generateCodeBlock()}
    
    <h3>${sectionNum}.4 Configuration Requirements</h3>
    <p>Essential configuration parameters include:</p>
    ${generateList(false)}
    
    <h3>${sectionNum}.5 Performance Considerations</h3>
    ${generateRichParagraph()}
    
    <h3>${sectionNum}.6 Testing Approach</h3>
    ${generateRichParagraph()}
    <p><strong>Unit tests</strong> should cover all <em>critical paths</em> in the application.</p>
  `;
}

function generatePolicySection(sectionNum) {
  return `
    <h2>${sectionNum}. Operational Guidelines</h2>
    
    <h3>${sectionNum}.1 Purpose</h3>
    ${generateRichParagraph()}
    
    <h3>${sectionNum}.2 Scope and Applicability</h3>
    ${generateRichParagraph()}
    
    <h3>${sectionNum}.3 Responsibilities</h3>
    <p>The following <strong>stakeholders</strong> have defined responsibilities:</p>
    <ul>
      <li><strong>Management:</strong> Ensure policy compliance and resource allocation</li>
      <li><strong>Department Heads:</strong> Implement procedures within their teams</li>
      <li><strong>Employees:</strong> Follow all <em>established guidelines</em></li>
      <li><strong>Auditors:</strong> Verify compliance through <em>regular assessments</em></li>
    </ul>
    
    <h3>${sectionNum}.4 Compliance Requirements</h3>
    ${generateRichParagraph()}
    ${generateTable()}
    
    <h3>${sectionNum}.5 Enforcement Procedures</h3>
    ${generateList(true)}
    
    <h3>${sectionNum}.6 Review and Updates</h3>
    ${generateRichParagraph()}
  `;
}

function generateTrainingSection(sectionNum) {
  return `
    <h2>${sectionNum}. Professional Development Module</h2>
    
    <h3>${sectionNum}.1 Learning Objectives</h3>
    <p>Upon completion, participants will be able to:</p>
    ${generateList(false)}
    
    <h3>${sectionNum}.2 Course Content</h3>
    ${generateRichParagraph()}
    
    <h3>${sectionNum}.3 Practical Examples</h3>
    <p>The following <strong>code demonstration</strong> illustrates key concepts:</p>
    ${generateCodeBlock()}
    
    <h3>${sectionNum}.4 Interactive Exercises</h3>
    ${generateRichParagraph()}
    ${generateTable()}
    
    <h3>${sectionNum}.5 Assessment Criteria</h3>
    <p>Students will be evaluated on:</p>
    ${generateList(true)}
    
    <h3>${sectionNum}.6 Additional Resources</h3>
    ${generateRichParagraph()}
  `;
}

function generateSOPSection(sectionNum) {
  return `
    <h2>${sectionNum}. Standard Operating Procedure</h2>
    
    <h3>${sectionNum}.1 Purpose and Scope</h3>
    ${generateRichParagraph()}
    
    <h3>${sectionNum}.2 Prerequisites</h3>
    <p>Before beginning, ensure the following <strong>requirements</strong> are met:</p>
    ${generateList(false)}
    
    <h3>${sectionNum}.3 Step-by-Step Instructions</h3>
    <p>Follow these steps <em>exactly as specified</em>:</p>
    ${generateList(true)}
    
    <h3>${sectionNum}.4 Quality Control Checkpoints</h3>
    ${generateTable()}
    
    <h3>${sectionNum}.5 Safety Considerations</h3>
    <div style="border: 2px solid red; padding: 10px; margin: 10px 0;">
      <strong>⚠️ SAFETY WARNING:</strong> Always wear appropriate <em>protective equipment</em>.
    </div>
    ${generateRichParagraph()}
    
    <h3>${sectionNum}.6 Documentation Requirements</h3>
    ${generateRichParagraph()}
  `;
}

// Generate feedback entries
function generateFeedbackEntries(documentId, count) {
  const feedbacks = [];
  
  // These are ACTUAL phrases from the document content
  const changeFromOptions = [
    'system architecture',
    'automated validation',
    'clear, concise',
    'measurable gains',
    'backup procedures',
    'monitoring tools',
    'data consistency',
    'testing framework'
  ];
  
  const changeToOptions = [
    'system design',
    'automatic validation',
    'clear and concise',
    'significant gains',
    'backup protocols',
    'monitoring infrastructure',
    'data integrity',
    'test framework'
  ];
  
  const feedbackTypes = ['Substantive (Important)', 'Substantive (Recommended)', 'Administrative', 'Critical'];
  const components = ['Technical Review', 'Safety Review', 'Operations Review', 'Training Review'];
  const pocNames = ['Maj Smith', 'Capt Johnson', 'Lt Brown', 'MSgt Davis', 'TSgt Wilson'];
  const pocPhones = ['555-0101', '555-0102', '555-0103', '555-0104', '555-0105'];
  const pocEmails = ['smith.j@af.mil', 'johnson.m@af.mil', 'brown.k@af.mil', 'davis.r@af.mil', 'wilson.t@af.mil'];
  
  // For technical template, the DocumentNumbering component creates:
  // Section 1 (main), then 1.1, 1.2, 1.3 etc as H2 subsections
  // Paragraphs under 1.1 become 1.1.1, 1.1.2, etc
  // Paragraphs under 1.2 become 1.2.1, 1.2.2, etc
  
  for (let i = 0; i < count; i++) {
    const idx = i % changeFromOptions.length;
    const pocIdx = i % pocNames.length;
    
    // Technical template has sections: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6
    const subsectionNum = (i % 6) + 1;  // Cycles through 1-6
    const paragraphNum = 1;  // First paragraph in each section (could randomize if needed)
    
    feedbacks.push({
      id: `fb_${documentId}_${i+1}`,
      type: feedbackTypes[i % feedbackTypes.length],
      component: components[i % components.length],
      pocName: pocNames[pocIdx],
      pocPhone: pocPhones[pocIdx],
      pocEmail: pocEmails[pocIdx],
      page: Math.floor(i / 3) + 1,
      paragraphNumber: `1.${subsectionNum}.${paragraphNum}`,  // e.g., 1.1.1, 1.2.1, 1.3.1
      lineNumber: Math.floor(Math.random() * 20) + 1,
      changeFrom: changeFromOptions[idx],
      changeTo: changeToOptions[idx],
      coordinatorComment: 'Recommend updating for clarity and technical accuracy',
      coordinatorJustification: 'Improves document readability and maintains Air Force standards',
      status: 'pending'
    });
  }
  
  return feedbacks;
}

// Main function
async function createEditorDocument() {
  console.log('\n📝 Creating Editor-Style Document...\n');
  console.log(`Template: ${template}`);
  console.log(`Target Size: ${targetSizeKB} KB`);
  console.log(`Estimated Pages: ~${Math.ceil(targetSizeKB / 3.3)}`);
  console.log(`Feedbacks: ${feedbacks}`);
  console.log(`Title: ${customTitle || 'Auto-generated'}\n`);
  
  try {
    // Get first user
    const user = await prisma.user.findFirst();
    if (!user) {
      console.error('❌ No users found in database');
      process.exit(1);
    }

    // Generate content based on template and target size
    let content = '';
    
    // Add document header based on template
    switch(template) {
      case 'af-manual':
        content = `
          <div class="header-info">
            <p>TO 1F-16C-1</p>
            <p>USAF SERIES</p>
          </div>
          <h1>AIR FORCE TECHNICAL MANUAL</h1>
          <p class="subtitle">FLIGHT MANUAL</p>
        `;
        break;
      case 'technical':
        content = '<h1>Technical Documentation</h1>';
        break;
      case 'policy':
        content = '<h1>Policy Document</h1>';
        break;
      case 'training':
        content = '<h1>Training Manual</h1>';
        break;
      case 'sop':
        content = `
          <h1>Standard Operating Procedure</h1>
          ${generateTable()}
        `;
        break;
    }
    
    // Add table of contents
    content += '\n<h2>Table of Contents</h2>\n';
    content += generateList(true);
    
    // Generate sections until target size reached
    let sectionNum = 1;
    while (Buffer.byteLength(content, 'utf8') < targetSizeBytes && sectionNum <= 200) {
      switch(template) {
        case 'af-manual':
          content += generateAFManualSection(sectionNum);
          break;
        case 'technical':
          content += generateTechnicalSection(sectionNum);
          break;
        case 'policy':
          content += generatePolicySection(sectionNum);
          break;
        case 'training':
          content += generateTrainingSection(sectionNum);
          break;
        case 'sop':
          content += generateSOPSection(sectionNum);
          break;
      }
      sectionNum++;
    }
    
    // Add conclusion
    content += `
      <h2>Conclusion</h2>
      ${generateRichParagraph()}
      <p>This document was generated with <strong>rich formatting</strong> to simulate 
      content created in the <em>TipTap editor</em>.</p>
    `;
    
    // Generate document ID
    const documentId = `doc_editor_${template.replace('-', '_')}_${Math.random().toString(36).substring(2, 10)}`;
    const title = customTitle || `Editor-Style ${template.toUpperCase()} - ${new Date().toISOString().split('T')[0]}`;
    
    // Calculate size and checksum
    const fileSize = Buffer.byteLength(content, 'utf8');
    const checksum = crypto.createHash('md5').update(content).digest('hex');
    
    // Generate feedback if requested
    let feedbackItems = [];
    if (feedbacks > 0) {
      console.log(`💬 Generating ${feedbacks} feedback items...`);
      feedbackItems = generateFeedbackEntries(documentId, feedbacks);
    }
    
    // Create document
    console.log('💾 Saving document to database...');
    const document = await prisma.document.create({
      data: {
        id: documentId,
        title: title,
        fileName: `${documentId}.html`,
        originalName: `editor_${template}_document.html`,
        mimeType: 'text/html',
        fileSize: fileSize,
        checksum: checksum,
        storagePath: `uploads/${documentId}.html`,
        category: 'Technical Manual',
        status: 'DRAFT',
        createdBy: {
          connect: { id: user.id }
        },
        organization: {
          connect: { id: user.organizationId }
        },
        customFields: {
          content: content,
          draftFeedback: feedbackItems,
          template: template,
          targetSizeKB: targetSizeKB,
          createdVia: 'editor-style-generator',
          editorVersion: 'TipTap 2.x simulation',
          opr: 'A1/Training',
          publicationType: template === 'af-manual' ? 'DAFMAN' : 'GENERAL',
          publicationNumber: `${Math.floor(Math.random() * 90) + 10}-${Math.floor(Math.random() * 900) + 100}`,
          metadata: {
            generatedAt: new Date().toISOString(),
            generator: 'editor-style-cli',
            hasFormatting: true,
            hasTables: true,
            hasLists: true,
            hasCodeBlocks: template === 'technical' || template === 'training',
            totalFeedback: feedbacks
          }
        }
      }
    });

    const actualSizeKB = (fileSize / 1024).toFixed(2);
    const estimatedPages = Math.ceil(actualSizeKB / 3.3);
    
    console.log('\n✅ Editor-Style Document Created Successfully!\n');
    console.log(`Document ID: ${documentId}`);
    console.log(`Title: ${title}`);
    console.log(`Target Size: ${targetSizeKB} KB`);
    console.log(`Actual Size: ${actualSizeKB} KB`);
    console.log(`Estimated Pages: ~${estimatedPages}`);
    console.log(`Feedback Entries: ${feedbacks}`);
    console.log('\nFeatures:');
    console.log('✅ Rich formatting (bold, italic, underline)');
    console.log('✅ Tables with structured data');
    console.log('✅ Ordered and unordered lists');
    console.log('✅ Code blocks (technical/training templates)');
    console.log('✅ Warning/caution boxes');
    console.log('✅ Clean HTML structure');
    console.log('\n📋 Access URLs:');
    console.log(`View: http://localhost:3000/documents/${documentId}`);
    console.log(`Edit: http://localhost:3000/editor/${documentId}`);
    console.log(`Review: http://localhost:3000/documents/${documentId}/opr-review\n`);
    
    await prisma.$disconnect();
    return documentId;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Export for comparison script
if (require.main === module) {
  createEditorDocument();
} else {
  module.exports = createEditorDocument;
}