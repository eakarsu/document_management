// Comprehensive Document Management Workflow Task Types

export enum DocumentTaskType {
  // Document Creation & Ingestion
  CREATE_DOCUMENT = 'CREATE_DOCUMENT',
  UPLOAD_DOCUMENT = 'UPLOAD_DOCUMENT',
  SCAN_DOCUMENT = 'SCAN_DOCUMENT',
  IMPORT_FROM_EMAIL = 'IMPORT_FROM_EMAIL',
  GENERATE_FROM_TEMPLATE = 'GENERATE_FROM_TEMPLATE',
  AI_GENERATE_DOCUMENT = 'AI_GENERATE_DOCUMENT',
  
  // Document Processing
  OCR_EXTRACTION = 'OCR_EXTRACTION',
  METADATA_EXTRACTION = 'METADATA_EXTRACTION',
  CLASSIFY_DOCUMENT = 'CLASSIFY_DOCUMENT',
  TAG_DOCUMENT = 'TAG_DOCUMENT',
  EXTRACT_ENTITIES = 'EXTRACT_ENTITIES',
  VALIDATE_FORMAT = 'VALIDATE_FORMAT',
  CONVERT_FORMAT = 'CONVERT_FORMAT',
  SPLIT_DOCUMENT = 'SPLIT_DOCUMENT',
  MERGE_DOCUMENTS = 'MERGE_DOCUMENTS',
  WATERMARK_DOCUMENT = 'WATERMARK_DOCUMENT',
  REDACT_SENSITIVE_DATA = 'REDACT_SENSITIVE_DATA',
  
  // Review & Approval
  MANUAL_REVIEW = 'MANUAL_REVIEW',
  AUTOMATED_REVIEW = 'AUTOMATED_REVIEW',
  APPROVAL_REQUEST = 'APPROVAL_REQUEST',
  MULTI_LEVEL_APPROVAL = 'MULTI_LEVEL_APPROVAL',
  LEGAL_REVIEW = 'LEGAL_REVIEW',
  COMPLIANCE_CHECK = 'COMPLIANCE_CHECK',
  QUALITY_ASSURANCE = 'QUALITY_ASSURANCE',
  
  // Collaboration
  ASSIGN_TO_USER = 'ASSIGN_TO_USER',
  ASSIGN_TO_TEAM = 'ASSIGN_TO_TEAM',
  REQUEST_FEEDBACK = 'REQUEST_FEEDBACK',
  COLLABORATIVE_EDITING = 'COLLABORATIVE_EDITING',
  ADD_COMMENTS = 'ADD_COMMENTS',
  TRACK_CHANGES = 'TRACK_CHANGES',
  VERSION_CONTROL = 'VERSION_CONTROL',
  
  // Notifications & Communications
  SEND_EMAIL = 'SEND_EMAIL',
  SEND_SMS = 'SEND_SMS',
  SEND_NOTIFICATION = 'SEND_NOTIFICATION',
  WEBHOOK_NOTIFICATION = 'WEBHOOK_NOTIFICATION',
  SLACK_MESSAGE = 'SLACK_MESSAGE',
  TEAMS_MESSAGE = 'TEAMS_MESSAGE',
  
  // Data Operations
  DATABASE_QUERY = 'DATABASE_QUERY',
  DATABASE_INSERT = 'DATABASE_INSERT',
  DATABASE_UPDATE = 'DATABASE_UPDATE',
  API_CALL = 'API_CALL',
  ELASTICSEARCH_INDEX = 'ELASTICSEARCH_INDEX',
  CACHE_OPERATION = 'CACHE_OPERATION',
  
  // Document Storage & Retrieval
  STORE_DOCUMENT = 'STORE_DOCUMENT',
  ARCHIVE_DOCUMENT = 'ARCHIVE_DOCUMENT',
  RETRIEVE_DOCUMENT = 'RETRIEVE_DOCUMENT',
  BACKUP_DOCUMENT = 'BACKUP_DOCUMENT',
  MOVE_TO_FOLDER = 'MOVE_TO_FOLDER',
  SET_RETENTION_POLICY = 'SET_RETENTION_POLICY',
  
  // Security & Compliance
  ENCRYPT_DOCUMENT = 'ENCRYPT_DOCUMENT',
  DECRYPT_DOCUMENT = 'DECRYPT_DOCUMENT',
  DIGITAL_SIGNATURE = 'DIGITAL_SIGNATURE',
  VERIFY_SIGNATURE = 'VERIFY_SIGNATURE',
  AUDIT_LOG = 'AUDIT_LOG',
  COMPLIANCE_VALIDATION = 'COMPLIANCE_VALIDATION',
  ACCESS_CONTROL = 'ACCESS_CONTROL',
  
  // Analytics & Reporting
  GENERATE_REPORT = 'GENERATE_REPORT',
  ANALYTICS_PROCESSING = 'ANALYTICS_PROCESSING',
  DASHBOARD_UPDATE = 'DASHBOARD_UPDATE',
  METRICS_CALCULATION = 'METRICS_CALCULATION',
  TREND_ANALYSIS = 'TREND_ANALYSIS',
  
  // Integration Tasks
  SHAREPOINT_SYNC = 'SHAREPOINT_SYNC',
  SALESFORCE_SYNC = 'SALESFORCE_SYNC',
  SAP_INTEGRATION = 'SAP_INTEGRATION',
  ERP_SYNC = 'ERP_SYNC',
  CRM_UPDATE = 'CRM_UPDATE',
  
  // Workflow Control
  CONDITIONAL_ROUTING = 'CONDITIONAL_ROUTING',
  PARALLEL_PROCESSING = 'PARALLEL_PROCESSING',
  SEQUENTIAL_PROCESSING = 'SEQUENTIAL_PROCESSING',
  LOOP_ITERATION = 'LOOP_ITERATION',
  WAIT_TIMER = 'WAIT_TIMER',
  SCHEDULE_TASK = 'SCHEDULE_TASK',
  TRIGGER_WORKFLOW = 'TRIGGER_WORKFLOW',
  END_WORKFLOW = 'END_WORKFLOW',
  
  // AI & Machine Learning
  AI_CLASSIFICATION = 'AI_CLASSIFICATION',
  AI_EXTRACTION = 'AI_EXTRACTION',
  AI_TRANSLATION = 'AI_TRANSLATION',
  AI_SUMMARIZATION = 'AI_SUMMARIZATION',
  AI_SENTIMENT_ANALYSIS = 'AI_SENTIMENT_ANALYSIS',
  AI_ANOMALY_DETECTION = 'AI_ANOMALY_DETECTION',
  AI_PREDICTION = 'AI_PREDICTION',
  
  // Export & Distribution
  EXPORT_PDF = 'EXPORT_PDF',
  EXPORT_WORD = 'EXPORT_WORD',
  EXPORT_EXCEL = 'EXPORT_EXCEL',
  PRINT_DOCUMENT = 'PRINT_DOCUMENT',
  FAX_DOCUMENT = 'FAX_DOCUMENT',
  PUBLISH_TO_PORTAL = 'PUBLISH_TO_PORTAL',
  
  // Custom & Scripting
  CUSTOM_SCRIPT = 'CUSTOM_SCRIPT',
  BUSINESS_RULE = 'BUSINESS_RULE',
  FORMULA_CALCULATION = 'FORMULA_CALCULATION',
  REGEX_VALIDATION = 'REGEX_VALIDATION'
}

export interface TaskConfiguration {
  type: DocumentTaskType;
  name: string;
  description: string;
  category: string;
  icon: string;
  color: string;
  inputs: TaskInput[];
  outputs: TaskOutput[];
  settings: TaskSettings;
}

export interface TaskInput {
  name: string;
  type: 'document' | 'text' | 'number' | 'boolean' | 'date' | 'user' | 'team' | 'file' | 'array' | 'object';
  required: boolean;
  description: string;
  defaultValue?: any;
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    enum?: any[];
  };
}

export interface TaskOutput {
  name: string;
  type: 'document' | 'text' | 'number' | 'boolean' | 'date' | 'array' | 'object' | 'status';
  description: string;
}

export interface TaskSettings {
  timeout?: number;
  retryCount?: number;
  retryDelay?: number;
  parallelExecution?: boolean;
  requiresAuth?: boolean;
  requiresApproval?: boolean;
  auditLog?: boolean;
  notifications?: {
    onStart?: boolean;
    onComplete?: boolean;
    onError?: boolean;
  };
}

// Task Categories for UI Organization
export const TaskCategories = {
  INGESTION: {
    name: 'Document Ingestion',
    icon: '📥',
    color: '#4CAF50',
    tasks: [
      DocumentTaskType.CREATE_DOCUMENT,
      DocumentTaskType.UPLOAD_DOCUMENT,
      DocumentTaskType.SCAN_DOCUMENT,
      DocumentTaskType.IMPORT_FROM_EMAIL,
      DocumentTaskType.GENERATE_FROM_TEMPLATE,
      DocumentTaskType.AI_GENERATE_DOCUMENT
    ]
  },
  PROCESSING: {
    name: 'Document Processing',
    icon: '⚙️',
    color: '#2196F3',
    tasks: [
      DocumentTaskType.OCR_EXTRACTION,
      DocumentTaskType.METADATA_EXTRACTION,
      DocumentTaskType.CLASSIFY_DOCUMENT,
      DocumentTaskType.TAG_DOCUMENT,
      DocumentTaskType.EXTRACT_ENTITIES,
      DocumentTaskType.VALIDATE_FORMAT,
      DocumentTaskType.CONVERT_FORMAT,
      DocumentTaskType.SPLIT_DOCUMENT,
      DocumentTaskType.MERGE_DOCUMENTS,
      DocumentTaskType.WATERMARK_DOCUMENT,
      DocumentTaskType.REDACT_SENSITIVE_DATA
    ]
  },
  REVIEW: {
    name: 'Review & Approval',
    icon: '✅',
    color: '#FF9800',
    tasks: [
      DocumentTaskType.MANUAL_REVIEW,
      DocumentTaskType.AUTOMATED_REVIEW,
      DocumentTaskType.APPROVAL_REQUEST,
      DocumentTaskType.MULTI_LEVEL_APPROVAL,
      DocumentTaskType.LEGAL_REVIEW,
      DocumentTaskType.COMPLIANCE_CHECK,
      DocumentTaskType.QUALITY_ASSURANCE
    ]
  },
  COLLABORATION: {
    name: 'Collaboration',
    icon: '👥',
    color: '#9C27B0',
    tasks: [
      DocumentTaskType.ASSIGN_TO_USER,
      DocumentTaskType.ASSIGN_TO_TEAM,
      DocumentTaskType.REQUEST_FEEDBACK,
      DocumentTaskType.COLLABORATIVE_EDITING,
      DocumentTaskType.ADD_COMMENTS,
      DocumentTaskType.TRACK_CHANGES,
      DocumentTaskType.VERSION_CONTROL
    ]
  },
  NOTIFICATIONS: {
    name: 'Notifications',
    icon: '🔔',
    color: '#00BCD4',
    tasks: [
      DocumentTaskType.SEND_EMAIL,
      DocumentTaskType.SEND_SMS,
      DocumentTaskType.SEND_NOTIFICATION,
      DocumentTaskType.WEBHOOK_NOTIFICATION,
      DocumentTaskType.SLACK_MESSAGE,
      DocumentTaskType.TEAMS_MESSAGE
    ]
  },
  DATA: {
    name: 'Data Operations',
    icon: '💾',
    color: '#795548',
    tasks: [
      DocumentTaskType.DATABASE_QUERY,
      DocumentTaskType.DATABASE_INSERT,
      DocumentTaskType.DATABASE_UPDATE,
      DocumentTaskType.API_CALL,
      DocumentTaskType.ELASTICSEARCH_INDEX,
      DocumentTaskType.CACHE_OPERATION
    ]
  },
  STORAGE: {
    name: 'Storage & Retrieval',
    icon: '🗄️',
    color: '#607D8B',
    tasks: [
      DocumentTaskType.STORE_DOCUMENT,
      DocumentTaskType.ARCHIVE_DOCUMENT,
      DocumentTaskType.RETRIEVE_DOCUMENT,
      DocumentTaskType.BACKUP_DOCUMENT,
      DocumentTaskType.MOVE_TO_FOLDER,
      DocumentTaskType.SET_RETENTION_POLICY
    ]
  },
  SECURITY: {
    name: 'Security & Compliance',
    icon: '🔒',
    color: '#F44336',
    tasks: [
      DocumentTaskType.ENCRYPT_DOCUMENT,
      DocumentTaskType.DECRYPT_DOCUMENT,
      DocumentTaskType.DIGITAL_SIGNATURE,
      DocumentTaskType.VERIFY_SIGNATURE,
      DocumentTaskType.AUDIT_LOG,
      DocumentTaskType.COMPLIANCE_VALIDATION,
      DocumentTaskType.ACCESS_CONTROL
    ]
  },
  ANALYTICS: {
    name: 'Analytics & Reporting',
    icon: '📊',
    color: '#3F51B5',
    tasks: [
      DocumentTaskType.GENERATE_REPORT,
      DocumentTaskType.ANALYTICS_PROCESSING,
      DocumentTaskType.DASHBOARD_UPDATE,
      DocumentTaskType.METRICS_CALCULATION,
      DocumentTaskType.TREND_ANALYSIS
    ]
  },
  INTEGRATION: {
    name: 'Integrations',
    icon: '🔗',
    color: '#009688',
    tasks: [
      DocumentTaskType.SHAREPOINT_SYNC,
      DocumentTaskType.SALESFORCE_SYNC,
      DocumentTaskType.SAP_INTEGRATION,
      DocumentTaskType.ERP_SYNC,
      DocumentTaskType.CRM_UPDATE
    ]
  },
  CONTROL: {
    name: 'Workflow Control',
    icon: '🎯',
    color: '#E91E63',
    tasks: [
      DocumentTaskType.CONDITIONAL_ROUTING,
      DocumentTaskType.PARALLEL_PROCESSING,
      DocumentTaskType.SEQUENTIAL_PROCESSING,
      DocumentTaskType.LOOP_ITERATION,
      DocumentTaskType.WAIT_TIMER,
      DocumentTaskType.SCHEDULE_TASK,
      DocumentTaskType.TRIGGER_WORKFLOW,
      DocumentTaskType.END_WORKFLOW
    ]
  },
  AI: {
    name: 'AI & Machine Learning',
    icon: '🤖',
    color: '#673AB7',
    tasks: [
      DocumentTaskType.AI_CLASSIFICATION,
      DocumentTaskType.AI_EXTRACTION,
      DocumentTaskType.AI_TRANSLATION,
      DocumentTaskType.AI_SUMMARIZATION,
      DocumentTaskType.AI_SENTIMENT_ANALYSIS,
      DocumentTaskType.AI_ANOMALY_DETECTION,
      DocumentTaskType.AI_PREDICTION
    ]
  },
  EXPORT: {
    name: 'Export & Distribution',
    icon: '📤',
    color: '#FF5722',
    tasks: [
      DocumentTaskType.EXPORT_PDF,
      DocumentTaskType.EXPORT_WORD,
      DocumentTaskType.EXPORT_EXCEL,
      DocumentTaskType.PRINT_DOCUMENT,
      DocumentTaskType.FAX_DOCUMENT,
      DocumentTaskType.PUBLISH_TO_PORTAL
    ]
  },
  CUSTOM: {
    name: 'Custom & Scripting',
    icon: '⚡',
    color: '#9E9E9E',
    tasks: [
      DocumentTaskType.CUSTOM_SCRIPT,
      DocumentTaskType.BUSINESS_RULE,
      DocumentTaskType.FORMULA_CALCULATION,
      DocumentTaskType.REGEX_VALIDATION
    ]
  }
};

// Complete Task Configurations
export const TaskConfigurations: Record<DocumentTaskType, TaskConfiguration> = {
  [DocumentTaskType.CREATE_DOCUMENT]: {
    type: DocumentTaskType.CREATE_DOCUMENT,
    name: 'Create Document',
    description: 'Create a new document from scratch',
    category: 'INGESTION',
    icon: '📄',
    color: '#4CAF50',
    inputs: [
      {
        name: 'title',
        type: 'text',
        required: true,
        description: 'Document title'
      },
      {
        name: 'content',
        type: 'text',
        required: false,
        description: 'Initial content'
      },
      {
        name: 'template',
        type: 'text',
        required: false,
        description: 'Template ID to use'
      }
    ],
    outputs: [
      {
        name: 'documentId',
        type: 'text',
        description: 'Created document ID'
      },
      {
        name: 'status',
        type: 'status',
        description: 'Creation status'
      }
    ],
    settings: {
      timeout: 30000,
      auditLog: true
    }
  },
  
  [DocumentTaskType.APPROVAL_REQUEST]: {
    type: DocumentTaskType.APPROVAL_REQUEST,
    name: 'Request Approval',
    description: 'Send document for approval',
    category: 'REVIEW',
    icon: '✅',
    color: '#FF9800',
    inputs: [
      {
        name: 'document',
        type: 'document',
        required: true,
        description: 'Document to approve'
      },
      {
        name: 'approver',
        type: 'user',
        required: true,
        description: 'User who will approve'
      },
      {
        name: 'deadline',
        type: 'date',
        required: false,
        description: 'Approval deadline'
      },
      {
        name: 'notes',
        type: 'text',
        required: false,
        description: 'Notes for approver'
      }
    ],
    outputs: [
      {
        name: 'approved',
        type: 'boolean',
        description: 'Approval decision'
      },
      {
        name: 'comments',
        type: 'text',
        description: 'Approver comments'
      },
      {
        name: 'timestamp',
        type: 'date',
        description: 'Decision timestamp'
      }
    ],
    settings: {
      requiresAuth: true,
      notifications: {
        onStart: true,
        onComplete: true
      },
      auditLog: true
    }
  },
  
  [DocumentTaskType.OCR_EXTRACTION]: {
    type: DocumentTaskType.OCR_EXTRACTION,
    name: 'OCR Text Extraction',
    description: 'Extract text from scanned documents',
    category: 'PROCESSING',
    icon: '🔍',
    color: '#2196F3',
    inputs: [
      {
        name: 'document',
        type: 'document',
        required: true,
        description: 'Document to process'
      },
      {
        name: 'language',
        type: 'text',
        required: false,
        description: 'Document language',
        defaultValue: 'en'
      },
      {
        name: 'enhanceQuality',
        type: 'boolean',
        required: false,
        description: 'Enhance image quality',
        defaultValue: true
      }
    ],
    outputs: [
      {
        name: 'extractedText',
        type: 'text',
        description: 'Extracted text content'
      },
      {
        name: 'confidence',
        type: 'number',
        description: 'OCR confidence score'
      },
      {
        name: 'metadata',
        type: 'object',
        description: 'Extraction metadata'
      }
    ],
    settings: {
      timeout: 120000,
      retryCount: 2,
      auditLog: true
    }
  },
  
  [DocumentTaskType.SEND_EMAIL]: {
    type: DocumentTaskType.SEND_EMAIL,
    name: 'Send Email',
    description: 'Send email notification',
    category: 'NOTIFICATIONS',
    icon: '✉️',
    color: '#00BCD4',
    inputs: [
      {
        name: 'to',
        type: 'text',
        required: true,
        description: 'Recipient email',
        validation: {
          pattern: '^[^@]+@[^@]+\\.[^@]+$'
        }
      },
      {
        name: 'subject',
        type: 'text',
        required: true,
        description: 'Email subject'
      },
      {
        name: 'body',
        type: 'text',
        required: true,
        description: 'Email body'
      },
      {
        name: 'attachments',
        type: 'array',
        required: false,
        description: 'Document attachments'
      }
    ],
    outputs: [
      {
        name: 'sent',
        type: 'boolean',
        description: 'Email sent status'
      },
      {
        name: 'messageId',
        type: 'text',
        description: 'Email message ID'
      }
    ],
    settings: {
      timeout: 30000,
      retryCount: 3,
      retryDelay: 5000
    }
  },
  
  [DocumentTaskType.CONDITIONAL_ROUTING]: {
    type: DocumentTaskType.CONDITIONAL_ROUTING,
    name: 'Conditional Routing',
    description: 'Route workflow based on conditions',
    category: 'CONTROL',
    icon: '🚦',
    color: '#E91E63',
    inputs: [
      {
        name: 'condition',
        type: 'text',
        required: true,
        description: 'Condition expression'
      },
      {
        name: 'trueRoute',
        type: 'text',
        required: true,
        description: 'Route if condition is true'
      },
      {
        name: 'falseRoute',
        type: 'text',
        required: true,
        description: 'Route if condition is false'
      },
      {
        name: 'context',
        type: 'object',
        required: false,
        description: 'Evaluation context'
      }
    ],
    outputs: [
      {
        name: 'selectedRoute',
        type: 'text',
        description: 'Selected route'
      },
      {
        name: 'evaluationResult',
        type: 'boolean',
        description: 'Condition evaluation result'
      }
    ],
    settings: {
      timeout: 5000
    }
  },
  
  [DocumentTaskType.AI_CLASSIFICATION]: {
    type: DocumentTaskType.AI_CLASSIFICATION,
    name: 'AI Document Classification',
    description: 'Classify documents using AI',
    category: 'AI',
    icon: '🤖',
    color: '#673AB7',
    inputs: [
      {
        name: 'document',
        type: 'document',
        required: true,
        description: 'Document to classify'
      },
      {
        name: 'categories',
        type: 'array',
        required: false,
        description: 'Possible categories'
      },
      {
        name: 'model',
        type: 'text',
        required: false,
        description: 'AI model to use',
        defaultValue: 'claude-3-haiku'
      }
    ],
    outputs: [
      {
        name: 'classification',
        type: 'text',
        description: 'Document classification'
      },
      {
        name: 'confidence',
        type: 'number',
        description: 'Classification confidence'
      },
      {
        name: 'alternativeClassifications',
        type: 'array',
        description: 'Alternative classifications'
      }
    ],
    settings: {
      timeout: 60000,
      retryCount: 2,
      auditLog: true
    }
  },
  
  // Add configurations for ALL other task types...
  // This is a sample - you would need to define all 70+ task types
  
  [DocumentTaskType.UPLOAD_DOCUMENT]: {
    type: DocumentTaskType.UPLOAD_DOCUMENT,
    name: 'Upload Document',
    description: 'Upload a document file',
    category: 'INGESTION',
    icon: '⬆️',
    color: '#4CAF50',
    inputs: [
      {
        name: 'file',
        type: 'file',
        required: true,
        description: 'File to upload'
      },
      {
        name: 'metadata',
        type: 'object',
        required: false,
        description: 'Document metadata'
      }
    ],
    outputs: [
      {
        name: 'documentId',
        type: 'text',
        description: 'Uploaded document ID'
      },
      {
        name: 'status',
        type: 'status',
        description: 'Upload status'
      }
    ],
    settings: {
      timeout: 300000,
      auditLog: true
    }
  },
  
  // ... Continue for all other task types
  // For brevity, I'll add a few more key ones
  
  [DocumentTaskType.DIGITAL_SIGNATURE]: {
    type: DocumentTaskType.DIGITAL_SIGNATURE,
    name: 'Digital Signature',
    description: 'Apply digital signature to document',
    category: 'SECURITY',
    icon: '✍️',
    color: '#F44336',
    inputs: [
      {
        name: 'document',
        type: 'document',
        required: true,
        description: 'Document to sign'
      },
      {
        name: 'signatory',
        type: 'user',
        required: true,
        description: 'Person signing'
      },
      {
        name: 'certificate',
        type: 'text',
        required: false,
        description: 'Digital certificate'
      }
    ],
    outputs: [
      {
        name: 'signedDocument',
        type: 'document',
        description: 'Signed document'
      },
      {
        name: 'signature',
        type: 'text',
        description: 'Signature hash'
      },
      {
        name: 'timestamp',
        type: 'date',
        description: 'Signing timestamp'
      }
    ],
    settings: {
      requiresAuth: true,
      auditLog: true,
      notifications: {
        onComplete: true
      }
    }
  },
  
  // Placeholder for remaining types - would need to be fully implemented
  ...Object.fromEntries(
    Object.values(DocumentTaskType)
      .filter(type => !TaskConfigurations[type as DocumentTaskType])
      .map(type => [
        type,
        {
          type: type as DocumentTaskType,
          name: type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
          description: `${type.replace(/_/g, ' ').toLowerCase()} task`,
          category: 'CUSTOM',
          icon: '📋',
          color: '#9E9E9E',
          inputs: [],
          outputs: [],
          settings: {}
        }
      ])
  ) as any
};

// Helper function to get tasks by category
export function getTasksByCategory(category: keyof typeof TaskCategories): DocumentTaskType[] {
  return TaskCategories[category].tasks;
}

// Helper function to get task configuration
export function getTaskConfiguration(taskType: DocumentTaskType): TaskConfiguration {
  return TaskConfigurations[taskType];
}

// Helper function to validate task inputs
export function validateTaskInputs(
  taskType: DocumentTaskType,
  inputs: Record<string, any>
): { valid: boolean; errors: string[] } {
  const config = TaskConfigurations[taskType];
  const errors: string[] = [];
  
  for (const input of config.inputs) {
    const value = inputs[input.name];
    
    // Check required fields
    if (input.required && (value === undefined || value === null || value === '')) {
      errors.push(`${input.name} is required`);
      continue;
    }
    
    // Skip validation if not required and not provided
    if (!input.required && (value === undefined || value === null)) {
      continue;
    }
    
    // Type validation
    if (input.type === 'number' && typeof value !== 'number') {
      errors.push(`${input.name} must be a number`);
    }
    
    if (input.type === 'boolean' && typeof value !== 'boolean') {
      errors.push(`${input.name} must be a boolean`);
    }
    
    if (input.type === 'date' && !(value instanceof Date)) {
      errors.push(`${input.name} must be a date`);
    }
    
    if (input.type === 'array' && !Array.isArray(value)) {
      errors.push(`${input.name} must be an array`);
    }
    
    // Pattern validation
    if (input.validation?.pattern) {
      const regex = new RegExp(input.validation.pattern);
      if (!regex.test(value)) {
        errors.push(`${input.name} does not match required pattern`);
      }
    }
    
    // Range validation
    if (input.validation?.min !== undefined && value < input.validation.min) {
      errors.push(`${input.name} must be at least ${input.validation.min}`);
    }
    
    if (input.validation?.max !== undefined && value > input.validation.max) {
      errors.push(`${input.name} must be at most ${input.validation.max}`);
    }
    
    // Enum validation
    if (input.validation?.enum && !input.validation.enum.includes(value)) {
      errors.push(`${input.name} must be one of: ${input.validation.enum.join(', ')}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}