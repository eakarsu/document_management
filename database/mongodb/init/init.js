// MongoDB initialization script for Document Management System

// Switch to the DMS documents database
db = db.getSiblingDB('dms_documents');

// Create admin user
db.createUser({
  user: 'dms_user',
  pwd: 'dms_password',
  roles: [
    {
      role: 'readWrite',
      db: 'dms_documents'
    }
  ]
});

// Create collections with schema validation
db.createCollection('documents', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['documentId', 'fileName', 'contentType', 'size', 'uploadDate'],
      properties: {
        documentId: {
          bsonType: 'string',
          description: 'Document ID from PostgreSQL'
        },
        fileName: {
          bsonType: 'string',
          description: 'Original file name'
        },
        contentType: {
          bsonType: 'string',
          description: 'MIME type of the document'
        },
        size: {
          bsonType: 'number',
          description: 'File size in bytes'
        },
        content: {
          bsonType: 'binData',
          description: 'Binary content of the document'
        },
        thumbnail: {
          bsonType: 'binData',
          description: 'Thumbnail image for preview'
        },
        uploadDate: {
          bsonType: 'date',
          description: 'Upload timestamp'
        },
        metadata: {
          bsonType: 'object',
          description: 'Additional metadata extracted from the document'
        },
        ocrText: {
          bsonType: 'string',
          description: 'Extracted text from OCR processing'
        },
        aiAnalysis: {
          bsonType: 'object',
          description: 'AI analysis results including classification and insights'
        }
      }
    }
  }
});

// Create collection for document versions
db.createCollection('document_versions', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['documentId', 'versionNumber', 'fileName', 'contentType', 'size', 'uploadDate'],
      properties: {
        documentId: {
          bsonType: 'string',
          description: 'Document ID from PostgreSQL'
        },
        versionNumber: {
          bsonType: 'number',
          description: 'Version number'
        },
        fileName: {
          bsonType: 'string',
          description: 'File name for this version'
        },
        contentType: {
          bsonType: 'string',
          description: 'MIME type of the document'
        },
        size: {
          bsonType: 'number',
          description: 'File size in bytes'
        },
        content: {
          bsonType: 'binData',
          description: 'Binary content of the document version'
        },
        thumbnail: {
          bsonType: 'binData',
          description: 'Thumbnail image for preview'
        },
        uploadDate: {
          bsonType: 'date',
          description: 'Upload timestamp'
        },
        changeNotes: {
          bsonType: 'string',
          description: 'Notes about changes in this version'
        }
      }
    }
  }
});

// Create collection for AI processing results
db.createCollection('ai_processing', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['documentId', 'processingType', 'status', 'createdAt'],
      properties: {
        documentId: {
          bsonType: 'string',
          description: 'Document ID from PostgreSQL'
        },
        processingType: {
          bsonType: 'string',
          enum: ['OCR', 'CLASSIFICATION', 'EXTRACTION', 'ANALYSIS'],
          description: 'Type of AI processing'
        },
        status: {
          bsonType: 'string',
          enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
          description: 'Processing status'
        },
        result: {
          bsonType: 'object',
          description: 'Processing results'
        },
        error: {
          bsonType: 'string',
          description: 'Error message if processing failed'
        },
        confidence: {
          bsonType: 'number',
          description: 'Confidence score for AI results'
        },
        processingTime: {
          bsonType: 'number',
          description: 'Processing time in milliseconds'
        },
        createdAt: {
          bsonType: 'date',
          description: 'Processing start timestamp'
        },
        updatedAt: {
          bsonType: 'date',
          description: 'Last update timestamp'
        }
      }
    }
  }
});

// Create collection for search index
db.createCollection('search_cache', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['documentId', 'searchableContent', 'lastIndexed'],
      properties: {
        documentId: {
          bsonType: 'string',
          description: 'Document ID from PostgreSQL'
        },
        searchableContent: {
          bsonType: 'string',
          description: 'Full-text searchable content'
        },
        keywords: {
          bsonType: 'array',
          items: {
            bsonType: 'string'
          },
          description: 'Extracted keywords'
        },
        entities: {
          bsonType: 'array',
          items: {
            bsonType: 'object'
          },
          description: 'Named entities extracted from content'
        },
        lastIndexed: {
          bsonType: 'date',
          description: 'Last indexing timestamp'
        }
      }
    }
  }
});

// Create indexes for performance
db.documents.createIndex({ 'documentId': 1 }, { unique: true });
db.documents.createIndex({ 'fileName': 1 });
db.documents.createIndex({ 'contentType': 1 });
db.documents.createIndex({ 'uploadDate': -1 });
db.documents.createIndex({ 'metadata.tags': 1 });

db.document_versions.createIndex({ 'documentId': 1, 'versionNumber': 1 }, { unique: true });
db.document_versions.createIndex({ 'uploadDate': -1 });

db.ai_processing.createIndex({ 'documentId': 1, 'processingType': 1 });
db.ai_processing.createIndex({ 'status': 1 });
db.ai_processing.createIndex({ 'createdAt': -1 });

db.search_cache.createIndex({ 'documentId': 1 }, { unique: true });
db.search_cache.createIndex({ '$text': { 'searchableContent': 1, 'keywords': 1 } });
db.search_cache.createIndex({ 'lastIndexed': -1 });

print('MongoDB initialization completed successfully for DMS');