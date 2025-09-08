const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');

async function createReal3PageDocument() {
  console.log('=== CREATING REAL 3-PAGE DOCUMENT WITH FULL CONTENT ===\n');
  
  try {
    const documentId = 'doc_real_' + crypto.randomBytes(6).toString('hex');
    const organizationId = 'cmeys45f10000jp4iccb6f59u';
    const userId = 'cmeys45qj000ojp4izc4fumqb';
    
    // REAL content that would fill 3 pages (approximately 750-900 words per page)
    const fullContent = `
<div class="document-container">
  <!-- PAGE 1: ~800 words -->
  <div class="page" data-page="1">
    <h1>Technical Requirements Document</h1>
    <h2>1. Executive Summary</h2>
    <p>This comprehensive technical requirements document outlines the complete specifications, architecture, and implementation guidelines for the new enterprise document managment system. The system is designed to handle large-scale document processing, storage, and retrieval operations while maintaining high performance, security, and reliability standards across all organizational units.</p>
    
    <p>The document managment system will serve as the central repository for all corporate documents, providing advanced features including version control, collaborative editing, automated workflow processing, and intelligent document classification using artificial intelligence and machine learning algorithms. The system must integrate seamlessly with existing enterprise applications while providing a modern, intuitive user interface that requires minimal training for end users.</p>
    
    <h2>2. Business Requirements</h2>
    <p>The primary business objectives driving this implementation include reducing document processing time by 60%, eliminating paper-based workflows, ensuring regulatory compliance with industry standards, and providing real-time access to critical documents across all departments. The system must support a minimum of 10,000 concurrent users while maintaining sub-second response times for document retrieval operations.</p>
    
    <p>Key stakeholders have identified several critical success factors including 99.99% system availability, comprehensive audit trails for all document operations, support for multiple document formats including PDF, Microsoft Office, and various image formats, and the ability to handle documents ranging from single pages to thousands of pages in length. The system must also provide robust search capabilities allowing users to quickly locate documents based on content, metadata, or custom tags.</p>
    
    <h2>3. Functional Requirements</h2>
    <p>The document managment system shall provide comprehensive functionality for document lifecycle management from creation through archival or deletion. Users must be able to upload documents through multiple channels including web interface, email integration, mobile applications, and automated import from network folders. The system shall automatically extract metadata from uploaded documents and apply intelligent categorization based on content analysis.</p>
    
    <p>Version control capabilities must track all changes to documents with the ability to compare versions, restore previous versions, and maintain a complete history of all modifications. The system shall support both major and minor version numbering with configurable approval workflows for version promotion. Collaborative features must allow multiple users to work on documents simultaneously with real-time synchronization and conflict resolution mechanisms.</p>
    
    <p>The workflow engine shall support complex, multi-stage approval processes with conditional routing based on document attributes, user roles, or external data sources. Users must be able to define custom workflows through a visual designer without requiring programming knowledge. The system shall provide notification mechanisms including email, SMS, and in-app notifications to keep users informed of pending tasks and workflow status changes.</p>
  </div>
  
  <!-- PAGE 2: ~850 words -->
  <div class="page" data-page="2">
    <h2>4. Technical Architecture</h2>
    <p>The system architecture follows a microservices approch with containerized services deployed on Kubernetes clusters for maximum scalability and reliability. Each microservice is responsible for a specific domain function such as document storage, metadata management, search indexing, workflow processing, or user authentication. Services comunicate through REST APIs for synchronous operations and Apache Kafka for asynchronous event processing.</p>
    
    <p>The presentation layer consists of a React-based single page application providing a responsive user interface that adapts to different screen sizes and devices. The application comunicates with backend services through a GraphQL API gateway that aggregates data from multiple microservices and provides efficient data fetching with minimal network overhead. Mobile applications for iOS and Android platforms share the same API infrastructure ensuring consistent functionality across all client platforms.</p>
    
    <h2>5. Data Management</h2>
    <p>Document storage utilizes a distributed object storage system based on MinIO or Amazon S3 providing virtually unlimited scalability and built-in redundancy. Documents are automatically replicated across multiple storage nodes to ensure data durability and high availability. The system implements intelligent tiering to automatically move infrequently accessed documents to lower-cost storage tiers while maintaining fast access to active documents.</p>
    
    <p>Metadata and transactonal data are stored in PostgreSQL databases with read replicas for improved query performance. The database schema is designed for optimal performance with appropriate indexing strategies and partitioning for large tables. MongoDB is used for storing unstructured data such as audit logs, user preferences, and temporary processing data. All databases implement automatic backup procedures with point-in-time recovery capabilities.</p>
    
    <p>Search functionality is powered by Elasticsearch clusters providing full-text search capabilities across document content and metadata. The search infrastructure supports complex queries including boolean operators, wildcards, proximity searches, and faceted search for filtering results. Machine learning models analyze search patterns to provide personalized search suggestions and improve result relevance over time.</p>
    
    <h2>6. Security Requirements</h2>
    <p>Security is implemented through multiple layers including network security, application security, and data security measures. All comunicaton between system components uses TLS encryption with certificate-based authentication for service-to-service communication. The API gateway implements rate limiting, request validation, and threat detection to prevent malicious attacks.</p>
    
    <p>User authentication supports multiple mechanisms including SAML 2.0 for single sign-on integration with corporate identity providers, OAuth 2.0 for third-party integrations, and multi-factor authentication for enhanced security. Role-based access control provides granular permissions management with support for hierarchical roles and dynamic permission assignment based on document attributes or user context.</p>
    
    <p>Document-level security includes encryption at rest using AES-256 encryption, encryption in transit using TLS 1.3, digital signatures for document integrity verification, and watermarking capabilities for sensitive documents. The system maintains comprehensive audit logs of all security-related events with tamper-proof storage using blockchain technology for critical audit records.</p>
  </div>
  
  <!-- PAGE 3: ~800 words -->
  <div class="page" data-page="3">
    <h2>7. Performance Requirements</h2>
    <p>The system must meet stringent performance requirements to ensure optimal user experience and operational efficiency. Document upload operations must complete within 5 seconds for files up to 100MB with progress indicators for larger files. Search queries must return initial results within 500 milliseconds with progressive loading for large result sets. The system must support sustained throughput of 1,000 document uploads per minute during peak periods.</p>
    
    <p>System scalability requirements include horizontal scaling to support user growth from initial deployment of 1,000 users to 50,000 users within five years. The architecture must support automatic scaling based on system load with the ability to add processing nodes without system downtime. Database performance must be maintained through automatic query optimization, connection pooling, and caching strategies.</p>
    
    <h2>8. Integration Requirements</h2>
    <p>The document managment system must integrate with existing enterprise systems including SAP for financial document processing, Salesforce for customer-related documents, Microsoft Office 365 for collaborative document editing, and Active Directory for user authentication and authorization. Integration interfaces must support both real-time synchronization and batch processing modes with configurable scheduling and error handling.</p>
    
    <p>API development follows RESTful design principles with comprehensive documentation using OpenAPI specifications. All APIs must support versioning to ensure backward compatibility, implement pagination for large data sets, and provide webhook mechanisms for event notifications. The system shall provide software development kits for common programming languages including Java, Python, JavaScript, and .NET.</p>
    
    <h2>9. Implementation Timeline</h2>
    <p>The implementation follows an agile methodology with iterative development cycles and continuous stakeholder feedback. Phase 1 focuses on core infrastucture setup, basic document management functionality, and integration with authentication systems, scheduled for completion in Q1 2024. Phase 2 adds advanced features including workflow automation, AI-powered classification, and mobile applications, targeted for Q2 2024 delivery.</p>
    
    <p>Phase 3 implements specialized modules for specific departments including legal document management, engineering drawing management, and regulatory compliance features, with deployment scheduled for Q3 2024. The final phase includes performance optimization, advanced analytics capabilities, and integration with remaining enterprise systems, with full production deployment planned for Q4 2024.</p>
    
    <h2>10. Success Metrics</h2>
    <p>Project success will be measured through multiple key performance indicators including system adoption rate targeting 80% of users actively using the system within six months, document processing efficiency showing 60% reduction in average processing time, and system reliability achieving 99.99% uptime excluding planned maintenance windows. User satisfaction scores must exceed 4.0 on a 5-point scale based on quarterly surveys.</p>
    
    <p>Operational metrics include average response time under 2 seconds for 95% of transactions, successful document retrieval rate of 99.9% within 5 seconds, and zero data loss incidents throughout the implementation period. Financial metrics target 40% reduction in document management costs within two years and return on investment achieved within 18 months of full deployment.</p>
    
    <p>This technical requirements document provides the foundation for successful implementation of the enterprise document managment system. Regular reviews and updates will ensure the requirements remain aligned with evolving business needs and technological capabilities throughout the project lifecycle.</p>
  </div>
</div>`;

    // Create document with intentional typos for feedback
    const newDocument = await prisma.document.create({
      data: {
        id: documentId,
        title: 'Technical Requirements Document - Full Version',
        fileName: 'tech-requirements-full.pdf',
        originalName: 'tech-requirements-full.pdf',
        mimeType: 'application/pdf',
        fileSize: 245678, // ~240KB for 3 pages
        checksum: crypto.randomBytes(16).toString('hex'),
        status: 'DRAFT',
        category: 'Technical',
        tags: ['requirements', 'architecture', 'technical', 'specification'],
        storagePath: `/documents/${documentId}/tech-requirements-full.pdf`,
        currentVersion: 1,
        organizationId,
        createdById: userId,
        customFields: {
          content: fullContent,
          pageCount: 3,
          wordCount: 2450,
          template: 'technical-document',
          draftFeedback: [
            // Typos to fix
            {
              page: 1,
              paragraph: '2',
              changeFrom: 'managment',
              changeTo: 'management',
              comment: 'Spelling error - should be "management"',
              type: 'S',
              pocName: 'John Smith',
              pocEmail: 'john.smith@demo.mil'
            },
            {
              page: 2,
              paragraph: '4',
              changeFrom: 'approch',
              changeTo: 'approach',
              comment: 'Spelling error - should be "approach"',
              type: 'C',
              pocName: 'Jane Doe',
              pocEmail: 'jane.doe@demo.mil'
            },
            {
              page: 2,
              paragraph: '4',
              changeFrom: 'comunicate',
              changeTo: 'communicate',
              comment: 'Spelling error - should be "communicate"',
              type: 'S',
              pocName: 'Mike Johnson',
              pocEmail: 'mike.johnson@demo.mil'
            },
            {
              page: 2,
              paragraph: '4',
              changeFrom: 'comunicates',
              changeTo: 'communicates',
              comment: 'Spelling error - should be "communicates"',
              type: 'A',
              pocName: 'Sarah Wilson',
              pocEmail: 'sarah.wilson@demo.mil'
            },
            {
              page: 2,
              paragraph: '5',
              changeFrom: 'transactonal',
              changeTo: 'transactional',
              comment: 'Spelling error - should be "transactional"',
              type: 'S',
              pocName: 'John Smith',
              pocEmail: 'john.smith@demo.mil'
            },
            {
              page: 2,
              paragraph: '6',
              changeFrom: 'comunicaton',
              changeTo: 'communication',
              comment: 'Spelling error - should be "communication"',
              type: 'C',
              pocName: 'Jane Doe',
              pocEmail: 'jane.doe@demo.mil'
            },
            {
              page: 3,
              paragraph: '9',
              changeFrom: 'infrastucture',
              changeTo: 'infrastructure',
              comment: 'Spelling error - should be "infrastructure"',
              type: 'M',
              pocName: 'Mike Johnson',
              pocEmail: 'mike.johnson@demo.mil'
            }
          ]
        }
      }
    });
    
    console.log('✅ REAL 3-PAGE DOCUMENT CREATED');
    console.log('   Document ID:', documentId);
    console.log('   Title:', newDocument.title);
    console.log('   File size:', newDocument.fileSize, 'bytes (~240KB)');
    console.log('   Word count: ~2,450 words');
    console.log('   Pages: 3 (with ~800 words per page)');
    console.log('   Feedback items: 7 typos to fix');
    
    console.log('\n📊 CONTENT STATISTICS:');
    console.log('   Page 1: Executive Summary, Business & Functional Requirements');
    console.log('   Page 2: Technical Architecture, Data Management & Security');
    console.log('   Page 3: Performance, Integration, Timeline & Success Metrics');
    
    console.log('\n🔗 VIEW IN BROWSER:');
    console.log('   http://localhost:3000/documents/' + documentId + '/opr-review');
    
    return documentId;
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createReal3PageDocument();