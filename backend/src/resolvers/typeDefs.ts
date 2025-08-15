import { gql } from 'apollo-server-express';

export const typeDefs = gql`
  scalar DateTime
  scalar Upload
  scalar JSON

  # Enums
  enum DocumentStatus {
    DRAFT
    IN_REVIEW
    APPROVED
    PUBLISHED
    ARCHIVED
    DELETED
  }

  enum PermissionType {
    READ
    WRITE
    DELETE
    SHARE
    ADMIN
  }

  enum WorkflowStatus {
    PENDING
    IN_PROGRESS
    COMPLETED
    CANCELLED
    FAILED
  }

  enum TaskStatus {
    PENDING
    IN_PROGRESS
    COMPLETED
    CANCELLED
    OVERDUE
  }

  # User Types
  type User {
    id: ID!
    email: String!
    firstName: String!
    lastName: String!
    avatar: String
    department: String
    jobTitle: String
    isActive: Boolean!
    role: Role!
    organization: Organization!
    createdAt: DateTime!
    lastLogin: DateTime
  }

  type Role {
    id: ID!
    name: String!
    description: String
    permissions: [String!]!
    organization: Organization!
  }

  type Organization {
    id: ID!
    name: String!
    domain: String!
    settings: JSON
    isActive: Boolean!
    createdAt: DateTime!
  }

  # Document Types
  type Document {
    id: ID!
    title: String!
    description: String
    fileName: String!
    originalName: String!
    mimeType: String!
    fileSize: Int!
    checksum: String!
    status: DocumentStatus!
    category: String
    tags: [String!]!
    customFields: JSON!
    documentNumber: String
    qrCode: String
    storagePath: String!
    
    # Relationships
    createdBy: User!
    organization: Organization!
    folder: Folder
    parentDocument: Document
    childDocuments: [Document!]!
    versions: [DocumentVersion!]!
    currentVersion: Int!
    permissions: [DocumentPermission!]!
    comments: [Comment!]!
    workflows: [DocumentWorkflow!]!
    
    # AI Processing
    ocrProcessed: Boolean!
    ocrText: String
    aiClassification: String
    aiTags: [String!]!
    aiConfidence: Float
    
    # Metadata
    createdAt: DateTime!
    updatedAt: DateTime!
    lastAccessedAt: DateTime
    
    # Computed fields
    downloadUrl: String
    thumbnailUrl: String
    versionsCount: Int!
    commentsCount: Int!
  }

  type DocumentVersion {
    id: ID!
    versionNumber: Int!
    title: String!
    description: String
    fileName: String!
    fileSize: Int!
    checksum: String!
    changeNotes: String
    createdBy: User!
    createdAt: DateTime!
    downloadUrl: String
  }

  type Folder {
    id: ID!
    name: String!
    description: String
    color: String
    icon: String
    fullPath: String!
    depth: Int!
    parentFolder: Folder
    subFolders: [Folder!]!
    documents: [Document!]!
    permissions: [FolderPermission!]!
    organization: Organization!
    customFields: JSON!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type DocumentPermission {
    id: ID!
    permission: PermissionType!
    user: User!
    document: Document!
    grantedAt: DateTime!
    expiresAt: DateTime
  }

  type FolderPermission {
    id: ID!
    permission: PermissionType!
    user: User!
    folder: Folder!
    grantedAt: DateTime!
    expiresAt: DateTime
  }

  type Comment {
    id: ID!
    content: String!
    isResolved: Boolean!
    pageNumber: Int
    positionX: Float
    positionY: Float
    author: User!
    document: Document!
    parentComment: Comment
    replies: [Comment!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Workflow {
    id: ID!
    name: String!
    description: String
    definition: JSON!
    isActive: Boolean!
    organization: Organization!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type DocumentWorkflow {
    id: ID!
    status: WorkflowStatus!
    currentStep: Int!
    totalSteps: Int!
    document: Document!
    workflow: Workflow!
    startedAt: DateTime!
    completedAt: DateTime
    updatedAt: DateTime!
  }

  type AuditLog {
    id: ID!
    action: String!
    resource: String!
    resourceId: String!
    oldValues: JSON
    newValues: JSON
    user: User!
    ipAddress: String!
    userAgent: String!
    createdAt: DateTime!
  }

  # Search Types
  type SearchResult {
    documents: [Document!]!
    total: Int!
    page: Int!
    limit: Int!
    totalPages: Int!
    aggregations: JSON
  }

  type SearchSuggestion {
    text: String!
    score: Float!
  }

  # Input Types
  input LoginInput {
    email: String!
    password: String!
  }

  input RegisterInput {
    email: String!
    password: String!
    firstName: String!
    lastName: String!
    organizationId: String!
    roleId: String
  }

  input CreateDocumentInput {
    title: String!
    description: String
    file: Upload!
    category: String
    tags: [String!]
    customFields: JSON
    folderId: String
    parentDocumentId: String
  }

  input UpdateDocumentInput {
    title: String
    description: String
    category: String
    tags: [String!]
    customFields: JSON
    status: DocumentStatus
    folderId: String
  }

  input SearchDocumentsInput {
    query: String
    category: String
    tags: [String!]
    status: DocumentStatus
    folderId: String
    mimeType: String
    dateRange: DateRangeInput
    page: Int
    limit: Int
    sortBy: String
    sortOrder: String
  }

  input DateRangeInput {
    from: DateTime!
    to: DateTime!
  }

  input CreateFolderInput {
    name: String!
    description: String
    color: String
    icon: String
    parentFolderId: String
    customFields: JSON
  }

  input UpdateFolderInput {
    name: String
    description: String
    color: String
    icon: String
    customFields: JSON
  }

  input CreateCommentInput {
    content: String!
    documentId: String!
    pageNumber: Int
    positionX: Float
    positionY: Float
    parentCommentId: String
  }

  input UpdateCommentInput {
    content: String
    isResolved: Boolean
  }

  input GrantPermissionInput {
    userId: String!
    permission: PermissionType!
    expiresAt: DateTime
  }

  # Response Types
  type AuthResponse {
    success: Boolean!
    user: User
    accessToken: String
    refreshToken: String
    error: String
  }

  type UploadResponse {
    success: Boolean!
    document: Document
    error: String
  }

  type DeleteResponse {
    success: Boolean!
    error: String
  }

  # Queries
  type Query {
    # Authentication
    me: User

    # Documents
    document(id: ID!): Document
    documents(input: SearchDocumentsInput!): SearchResult!
    documentVersions(documentId: ID!): [DocumentVersion!]!
    documentPermissions(documentId: ID!): [DocumentPermission!]!
    
    # Folders
    folder(id: ID!): Folder
    folders(parentId: String): [Folder!]!
    folderTree: [Folder!]!
    
    # Search
    searchDocuments(input: SearchDocumentsInput!): SearchResult!
    searchSuggestions(query: String!, field: String): [SearchSuggestion!]!
    
    # Comments
    documentComments(documentId: ID!): [Comment!]!
    
    # Audit
    auditLogs(resourceId: String, action: String, page: Int, limit: Int): [AuditLog!]!
    
    # Statistics
    dashboardStats: JSON!
  }

  # Mutations
  type Mutation {
    # Authentication
    login(input: LoginInput!): AuthResponse!
    register(input: RegisterInput!): AuthResponse!
    refreshToken(refreshToken: String!): AuthResponse!
    logout: Boolean!
    
    # Document Management
    createDocument(input: CreateDocumentInput!): UploadResponse!
    updateDocument(id: ID!, input: UpdateDocumentInput!): Document!
    deleteDocument(id: ID!, permanent: Boolean): DeleteResponse!
    restoreDocument(id: ID!): Document!
    
    # Document Versioning
    createDocumentVersion(documentId: ID!, file: Upload!, changeNotes: String): DocumentVersion!
    rollbackToVersion(documentId: ID!, versionNumber: Int!): Document!
    
    # Folder Management
    createFolder(input: CreateFolderInput!): Folder!
    updateFolder(id: ID!, input: UpdateFolderInput!): Folder!
    deleteFolder(id: ID!, permanent: Boolean): DeleteResponse!
    moveDocument(documentId: ID!, folderId: String): Document!
    moveFolder(folderId: ID!, parentFolderId: String): Folder!
    
    # Permissions
    grantDocumentPermission(documentId: ID!, input: GrantPermissionInput!): DocumentPermission!
    revokeDocumentPermission(documentId: ID!, userId: ID!): Boolean!
    grantFolderPermission(folderId: ID!, input: GrantPermissionInput!): FolderPermission!
    revokeFolderPermission(folderId: ID!, userId: ID!): Boolean!
    
    # Comments
    createComment(input: CreateCommentInput!): Comment!
    updateComment(id: ID!, input: UpdateCommentInput!): Comment!
    deleteComment(id: ID!): Boolean!
    resolveComment(id: ID!): Comment!
    
    # AI Processing
    processDocumentOCR(documentId: ID!): Document!
    classifyDocument(documentId: ID!): Document!
    extractDocumentData(documentId: ID!, extractionTypes: [String!]!): JSON!
    analyzeDocument(documentId: ID!, analysisTypes: [String!]!): JSON!
    
    # Search
    reindexDocuments: Boolean!
  }

  # Subscriptions
  type Subscription {
    documentUpdated(documentId: ID!): Document!
    commentAdded(documentId: ID!): Comment!
    workflowStatusChanged(documentId: ID!): DocumentWorkflow!
  }
`;