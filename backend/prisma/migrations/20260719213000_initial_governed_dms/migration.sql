-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED', 'DELETED');

-- CreateEnum
CREATE TYPE "ClassificationLevel" AS ENUM ('PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED');

-- CreateEnum
CREATE TYPE "MalwareScanStatus" AS ENUM ('PENDING', 'CLEAN', 'INFECTED', 'ERROR');

-- CreateEnum
CREATE TYPE "DelegationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "AIReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'ESCALATED');

-- CreateEnum
CREATE TYPE "DeletionJobStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'BLOCKED_LEGAL_HOLD');

-- CreateEnum
CREATE TYPE "VersionChangeType" AS ENUM ('MAJOR', 'MINOR', 'PATCH');

-- CreateEnum
CREATE TYPE "PermissionType" AS ENUM ('READ', 'WRITE', 'DELETE', 'SHARE', 'ADMIN');

-- CreateEnum
CREATE TYPE "WorkflowStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'FAILED');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'OVERDUE');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "PublishingWorkflowType" AS ENUM ('DOCUMENT_APPROVAL', 'EMERGENCY_PUBLISH', 'SCHEDULED_PUBLISH', 'COLLABORATIVE_REVIEW', 'COMPLIANCE_REVIEW');

-- CreateEnum
CREATE TYPE "PublishingStatus" AS ENUM ('PENDING_APPROVAL', 'IN_APPROVAL', 'APPROVED', 'REJECTED', 'PUBLISHED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED', 'DELEGATED');

-- CreateEnum
CREATE TYPE "ApprovalDecision" AS ENUM ('APPROVE', 'REJECT', 'APPROVE_WITH_CONDITIONS', 'REQUEST_CHANGES');

-- CreateEnum
CREATE TYPE "PublishingUrgency" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "TemplateType" AS ENUM ('STANDARD', 'EXECUTIVE', 'TECHNICAL', 'MARKETING', 'LEGAL', 'COMPLIANCE');

-- CreateEnum
CREATE TYPE "DestinationType" AS ENUM ('WEB_PORTAL', 'EMAIL_DISTRIBUTION', 'PRINT_QUEUE', 'EXTERNAL_API', 'FILE_SHARE', 'SOCIAL_MEDIA');

-- CreateEnum
CREATE TYPE "DestinationStatus" AS ENUM ('PENDING', 'PUBLISHING', 'PUBLISHED', 'FAILED', 'RETRYING');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('APPROVAL_REQUEST', 'APPROVAL_RECEIVED', 'REJECTION_RECEIVED', 'PUBLICATION_SUCCESS', 'PUBLICATION_FAILED', 'DEADLINE_APPROACHING', 'WORKFLOW_COMPLETED');

-- CreateEnum
CREATE TYPE "DeliveryMethod" AS ENUM ('IN_APP', 'EMAIL', 'SMS', 'PUSH_NOTIFICATION');

-- CreateEnum
CREATE TYPE "DistributionMethod" AS ENUM ('EMAIL', 'SECURE_LINK', 'DIRECT_DOWNLOAD', 'API_PUSH', 'PRINT_DISTRIBUTION');

-- CreateEnum
CREATE TYPE "RecipientType" AS ENUM ('INDIVIDUAL_USERS', 'USER_GROUPS', 'EXTERNAL_CONTACTS', 'PUBLIC_DISTRIBUTION', 'DEPARTMENT_WIDE');

-- CreateEnum
CREATE TYPE "DistributionStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'PARTIALLY_FAILED', 'FAILED');

-- CreateEnum
CREATE TYPE "AFFormStatus" AS ENUM ('DRAFT', 'PENDING_SIGNATURE', 'SIGNED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('JOINED_SESSION', 'LEFT_SESSION', 'STARTED_EDITING', 'STOPPED_EDITING', 'ADDED_COMMENT', 'RESOLVED_COMMENT', 'MADE_SUGGESTION', 'APPROVED_CHANGE', 'REJECTED_CHANGE');

-- CreateEnum
CREATE TYPE "CRMStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED', 'DEFERRED', 'INCORPORATED');

-- CreateEnum
CREATE TYPE "ChangeType" AS ENUM ('INSERT', 'DELETE', 'UPDATE', 'MOVE', 'FORMAT', 'COMMENT');

-- CreateEnum
CREATE TYPE "CollaborationSessionType" AS ENUM ('EDITING', 'REVIEWING', 'PLANNING', 'BRAINSTORMING', 'FINAL_REVIEW');

-- CreateEnum
CREATE TYPE "CollaboratorPermission" AS ENUM ('READ', 'EDIT_CONTENT', 'EDIT_STRUCTURE', 'ADD_COMMENTS', 'RESOLVE_COMMENTS', 'INVITE_OTHERS', 'MANAGE_SECTIONS');

-- CreateEnum
CREATE TYPE "CollaboratorRole" AS ENUM ('PRIMARY_AUTHOR', 'CO_AUTHOR', 'SECTION_AUTHOR', 'CONTRIBUTOR', 'REVIEWER', 'OBSERVER');

-- CreateEnum
CREATE TYPE "CommentType" AS ENUM ('GENERAL', 'SUGGESTION', 'QUESTION', 'ISSUE', 'APPROVAL', 'REJECTION');

-- CreateEnum
CREATE TYPE "CoordinationType" AS ENUM ('ICU', 'ECU', 'O6_15', 'TWO_LETTER');

-- CreateEnum
CREATE TYPE "DistributionType" AS ENUM ('INTERNAL_ONLY', 'PUBLIC_RELEASE', 'CONTROLLED_DISTRIBUTION', 'EMERGENCY_BROADCAST');

-- CreateEnum
CREATE TYPE "FeedbackType" AS ENUM ('GENERAL', 'TECHNICAL', 'LEGAL', 'EDITORIAL', 'EXPERT_OPINION', 'STAKEHOLDER_INPUT');

-- CreateEnum
CREATE TYPE "PublishingPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "ReviewerAssignmentType" AS ENUM ('PRIMARY', 'SECONDARY', 'SUBJECT_MATTER_EXPERT', 'STAKEHOLDER', 'OPTIONAL');

-- CreateEnum
CREATE TYPE "ReviewerStatus" AS ENUM ('ASSIGNED', 'ACKNOWLEDGED', 'IN_PROGRESS', 'COMPLETED', 'DECLINED', 'DELEGATED');

-- CreateEnum
CREATE TYPE "RoleType" AS ENUM ('VIEWER', 'AUTHOR', 'ACTION_OFFICER', 'AO1', 'AO2', 'PCM', 'COORDINATOR', 'SUB_REVIEWER', 'OPR', 'LEGAL', 'LEADERSHIP', 'AFDPO', 'PUBLISHER', 'INTERNAL_COORDINATOR', 'O6_GS15_COORDINATOR', 'TWO_LETTER_COORDINATOR', 'LEGAL_REVIEWER', 'OPR_LEADERSHIP', 'AFDPO_ANALYST', 'TECHNICAL_REVIEWER', 'COMMANDER', 'PUBLICATIONS_OFFICE', 'ADMIN', 'SUBJECT_MATTER_EXPERT', 'REVIEWER');

-- CreateEnum
CREATE TYPE "SectionStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'PENDING_REVIEW', 'APPROVED', 'NEEDS_REVISION', 'COMPLETED');

-- CreateEnum
CREATE TYPE "SessionRole" AS ENUM ('MODERATOR', 'PARTICIPANT', 'OBSERVER');

-- CreateEnum
CREATE TYPE "WorkflowStage" AS ENUM ('DRAFT_CREATION', 'INTERNAL_COORDINATION', 'LEGAL_REVIEW', 'O6_15_COORDINATION', 'TWO_LETTER_COORDINATION', 'LEADERSHIP_APPROVAL', 'FINAL_PUBLISHING', 'PUBLISHED', 'OPR_DRAFT_CREATION', 'O6_GS15_COORDINATION', 'OPR_UPDATE_FIRST', 'OPR_UPDATE_SECOND', 'LEGAL_COORDINATION', 'OPR_FINAL_UPDATE', 'AFDPO_PUBLISHING');

-- CreateEnum
CREATE TYPE "PasswordResetStatus" AS ENUM ('PENDING', 'USED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PasswordChangeType" AS ENUM ('USER_INITIATED', 'ADMIN_RESET', 'FORCED_CHANGE', 'RECOVERY');

-- CreateEnum
CREATE TYPE "PasswordChangeStatus" AS ENUM ('SUCCESS', 'FAILED', 'PENDING', 'REVERTED');

-- CreateEnum
CREATE TYPE "ExportStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "DialogType" AS ENUM ('INFO', 'WARNING', 'DANGER', 'SUCCESS');

-- CreateEnum
CREATE TYPE "DialogSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "EmailVerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'EXPIRED', 'FAILED');

-- CreateEnum
CREATE TYPE "PasswordRuleType" AS ENUM ('MIN_LENGTH', 'MAX_LENGTH', 'REQUIRE_UPPERCASE', 'REQUIRE_LOWERCASE', 'REQUIRE_NUMBER', 'REQUIRE_SPECIAL', 'NO_COMMON_PASSWORDS', 'NO_REPEATING_CHARS', 'NO_SEQUENTIAL_CHARS', 'NO_USERNAME', 'CUSTOM_REGEX', 'MIN_UNIQUE_CHARS', 'NO_DICTIONARY_WORDS', 'EXPIRATION_DAYS', 'HISTORY_CHECK');

-- CreateEnum
CREATE TYPE "SanitizationRuleType" AS ENUM ('XSS_PREVENTION', 'SQL_INJECTION', 'HTML_ESCAPE', 'PATH_TRAVERSAL', 'COMMAND_INJECTION', 'LDAP_INJECTION', 'XML_INJECTION', 'EMAIL_VALIDATION', 'URL_VALIDATION', 'FILE_TYPE_CHECK', 'SIZE_LIMIT', 'RATE_LIMIT', 'ENCODING_CHECK', 'CUSTOM_REGEX', 'CONTENT_TYPE_CHECK');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "avatar" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "mfaSecret" TEXT,
    "backupCodes" TEXT[],
    "department" TEXT,
    "jobTitle" TEXT,
    "phone" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "language" TEXT NOT NULL DEFAULT 'en',
    "roleId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "clearanceLevel" "ClassificationLevel" NOT NULL DEFAULT 'INTERNAL',
    "accessAttributes" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "permissions" TEXT[],
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,
    "roleType" "RoleType",

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "authMethod" TEXT NOT NULL,
    "refreshTokenHash" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "mfaVerifiedAt" TIMESTAMP(3),
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "checksum" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "storageProvider" TEXT NOT NULL DEFAULT 'minio',
    "status" "DocumentStatus" NOT NULL DEFAULT 'DRAFT',
    "category" TEXT,
    "tags" TEXT[],
    "customFields" JSONB NOT NULL DEFAULT '{}',
    "qrCode" TEXT,
    "documentNumber" TEXT,
    "createdById" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "folderId" TEXT,
    "parentDocumentId" TEXT,
    "currentVersion" INTEGER NOT NULL DEFAULT 1,
    "ocrProcessed" BOOLEAN NOT NULL DEFAULT false,
    "ocrText" TEXT,
    "aiClassification" TEXT,
    "aiTags" TEXT[],
    "aiConfidence" DOUBLE PRECISION,
    "aiResults" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastAccessedAt" TIMESTAMP(3),
    "effectiveDate" TIMESTAMP(3),
    "expirationDate" TIMESTAMP(3),
    "supplementLevel" INTEGER,
    "supplementOrganization" TEXT,
    "supplementType" TEXT,
    "content" TEXT,
    "classification" "ClassificationLevel" NOT NULL DEFAULT 'INTERNAL',
    "handlingCaveats" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "retentionUntil" TIMESTAMP(3),
    "legalHoldActive" BOOLEAN NOT NULL DEFAULT false,
    "objectVersionId" TEXT,
    "deletionRequestedAt" TIMESTAMP(3),
    "storageDeletedAt" TIMESTAMP(3),

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_versions" (
    "id" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "checksum" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "changeType" "VersionChangeType" NOT NULL DEFAULT 'MINOR',
    "changeNotes" TEXT,
    "documentId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bytesChanged" INTEGER,
    "changeCategory" TEXT,
    "compressionRatio" DOUBLE PRECISION,
    "diffPath" TEXT,
    "diffSize" INTEGER,
    "patchAlgorithm" TEXT,
    "percentChanged" DOUBLE PRECISION,
    "similarity" DOUBLE PRECISION,
    "objectVersionId" TEXT,
    "malwareScan" "MalwareScanStatus" NOT NULL DEFAULT 'PENDING',
    "encryptedAtRest" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "document_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "folders" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "icon" TEXT,
    "parentFolderId" TEXT,
    "fullPath" TEXT NOT NULL,
    "depth" INTEGER NOT NULL DEFAULT 0,
    "organizationId" TEXT NOT NULL,
    "customFields" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "folders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_permissions" (
    "id" TEXT NOT NULL,
    "permission" "PermissionType" NOT NULL,
    "documentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "document_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "folder_permissions" (
    "id" TEXT NOT NULL,
    "permission" "PermissionType" NOT NULL,
    "folderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "folder_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflows" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "definition" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_workflows" (
    "id" TEXT NOT NULL,
    "status" "WorkflowStatus" NOT NULL DEFAULT 'PENDING',
    "currentStep" INTEGER NOT NULL DEFAULT 1,
    "totalSteps" INTEGER NOT NULL,
    "documentId" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_workflows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "json_workflow_instances" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "currentStageId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "json_workflow_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "json_workflow_history" (
    "id" TEXT NOT NULL,
    "workflowInstanceId" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "stageName" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "performedBy" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "json_workflow_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_tasks" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "stepNumber" INTEGER NOT NULL,
    "formData" JSONB NOT NULL DEFAULT '{}',
    "workflowId" TEXT NOT NULL,
    "assignedToId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "workflow_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "pageNumber" INTEGER,
    "positionX" DOUBLE PRECISION,
    "positionY" DOUBLE PRECISION,
    "documentId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "parentCommentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "oldValues" JSONB,
    "newValues" JSONB,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationAuthPolicy" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "oidcIssuer" TEXT,
    "oidcClientId" TEXT,
    "oidcJwksUri" TEXT,
    "requireSso" BOOLEAN NOT NULL DEFAULT false,
    "requireMfa" BOOLEAN NOT NULL DEFAULT true,
    "accessTokenMinutes" INTEGER NOT NULL DEFAULT 15,
    "idleTimeoutMinutes" INTEGER NOT NULL DEFAULT 15,
    "absoluteSessionHours" INTEGER NOT NULL DEFAULT 8,
    "maxActiveSessions" INTEGER NOT NULL DEFAULT 3,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationAuthPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalIdentity" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "issuer" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "lastAuthenticatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExternalIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalDelegation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "documentId" TEXT,
    "stepId" TEXT,
    "grantorId" TEXT NOT NULL,
    "delegateId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "DelegationStatus" NOT NULL DEFAULT 'PENDING',
    "startsAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApprovalDelegation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIReviewArtifact" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "documentVersion" INTEGER NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "modelVersion" TEXT NOT NULL,
    "promptDigest" TEXT NOT NULL,
    "sourceChecksums" TEXT[],
    "outputChecksum" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "output" JSONB NOT NULL,
    "promptDefense" JSONB NOT NULL,
    "status" "AIReviewStatus" NOT NULL DEFAULT 'PENDING',
    "createdById" TEXT NOT NULL,
    "reviewedById" TEXT,
    "reviewerRationale" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "AIReviewArtifact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SignedAuditEvent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "previousHash" TEXT,
    "eventHash" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "signingKeyId" TEXT NOT NULL,
    "retentionUntil" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SignedAuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalHold" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "matter" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "placedById" TEXT NOT NULL,
    "releasedById" TEXT,
    "placedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "releasedAt" TIMESTAMP(3),

    CONSTRAINT "LegalHold_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ObjectDeletionJob" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "objectKeys" TEXT[],
    "status" "DeletionJobStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "requestedById" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ObjectDeletionJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_index" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "lastIndexed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_index_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "isEncrypted" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "publishing_workflows" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "workflowType" "PublishingWorkflowType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "allowParallel" BOOLEAN NOT NULL DEFAULT false,
    "requiredApprovers" INTEGER NOT NULL DEFAULT 1,
    "timeoutHours" INTEGER,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "autoApprove" BOOLEAN DEFAULT false,
    "templateId" TEXT,

    CONSTRAINT "publishing_workflows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_steps" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "stepName" TEXT NOT NULL,
    "description" TEXT,
    "requiredRole" TEXT NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "canSkip" BOOLEAN NOT NULL DEFAULT false,
    "timeoutHours" INTEGER,
    "minApprovals" INTEGER NOT NULL DEFAULT 1,
    "allowDelegation" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "approval_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_step_users" (
    "id" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "canApprove" BOOLEAN NOT NULL DEFAULT true,
    "canDelegate" BOOLEAN NOT NULL DEFAULT false,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "approval_step_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_publishing" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "documentId" TEXT NOT NULL,
    "workflowId" TEXT,
    "status" TEXT DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(6),
    "publishedBy" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_publishing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_approvals" (
    "id" TEXT NOT NULL,
    "publishingId" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "delegatedById" TEXT,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "decision" "ApprovalDecision",
    "comments" TEXT,
    "reviewNotes" TEXT,
    "attachments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3),
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "document_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "publishing_templates" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "templateType" TEXT DEFAULT 'STANDARD',
    "formatting" JSONB DEFAULT '{}',
    "layout" JSONB DEFAULT '{}',
    "metadata" JSONB DEFAULT '{}',
    "requiresCoverPage" BOOLEAN DEFAULT false,
    "requiresApprovalPage" BOOLEAN DEFAULT false,
    "includeQRCode" BOOLEAN DEFAULT true,
    "includeWatermark" BOOLEAN DEFAULT false,
    "watermarkText" TEXT,
    "organizationId" TEXT NOT NULL,
    "isActive" BOOLEAN DEFAULT true,
    "usageCount" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "publishing_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "publishing_notifications" (
    "id" TEXT NOT NULL,
    "publishingId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notificationType" TEXT DEFAULT 'GENERAL',

    CONSTRAINT "publishing_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_distributions" (
    "id" TEXT NOT NULL,
    "publishingId" TEXT NOT NULL,
    "initiatedById" TEXT NOT NULL,
    "distributionType" "DistributionType" NOT NULL,
    "targetAudience" TEXT[],
    "channels" TEXT[],
    "status" "DistributionStatus" NOT NULL DEFAULT 'PENDING',
    "totalRecipients" INTEGER,
    "successCount" INTEGER,
    "failureCount" INTEGER,
    "scheduledAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "document_distributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "af_form_673" (
    "id" TEXT NOT NULL,
    "workflow_instance_id" TEXT NOT NULL,
    "form_number" TEXT NOT NULL,
    "document_title" TEXT NOT NULL,
    "document_number" TEXT,
    "opr_name" TEXT NOT NULL,
    "opr_office_symbol" TEXT NOT NULL,
    "opr_phone" TEXT,
    "certifying_official_id" TEXT NOT NULL,
    "certifying_official_signature" TEXT,
    "approval_authority_id" TEXT NOT NULL,
    "approval_authority_signature" TEXT,
    "form_status" "AFFormStatus" NOT NULL DEFAULT 'DRAFT',
    "form_data" JSONB NOT NULL DEFAULT '{}',
    "signed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "af_form_673_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_step_reviewers" (
    "id" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "assignmentType" "ReviewerAssignmentType" NOT NULL DEFAULT 'PRIMARY',
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "expertise" TEXT,
    "department" TEXT,
    "status" "ReviewerStatus" NOT NULL DEFAULT 'ASSIGNED',
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "approval_step_reviewers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "change_summaries" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "changeCount" INTEGER NOT NULL DEFAULT 0,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "sessionId" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "change_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collaboration_sessions" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "sessionName" TEXT,
    "sessionType" "CollaborationSessionType" NOT NULL DEFAULT 'EDITING',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "maxParticipants" INTEGER NOT NULL DEFAULT 10,
    "allowAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "requireInvitation" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,

    CONSTRAINT "collaboration_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comment_resolution_matrix" (
    "id" TEXT NOT NULL,
    "workflow_instance_id" TEXT,
    "stage" "WorkflowStage" NOT NULL,
    "comment_number" INTEGER,
    "page_number" INTEGER,
    "paragraph_number" INTEGER,
    "line_number" INTEGER,
    "commenter_id" TEXT,
    "commenter_organization" TEXT,
    "comment_text" TEXT,
    "comment_type" TEXT,
    "status" "CRMStatus" NOT NULL DEFAULT 'PENDING',
    "opr_response" TEXT,
    "resolution_notes" TEXT,
    "resolved_by" TEXT,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "coordinationRound" INTEGER,
    "documentId" TEXT,

    CONSTRAINT "comment_resolution_matrix_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_entries" (
    "id" TEXT NOT NULL,
    "crmId" TEXT NOT NULL,
    "lineNumber" TEXT,
    "section" TEXT,
    "originalText" TEXT,
    "comment" TEXT NOT NULL,
    "suggestedText" TEXT,
    "coordinatorId" TEXT NOT NULL,
    "coordinatorOrg" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "category" TEXT NOT NULL DEFAULT 'CONTENT',
    "oprResponse" TEXT,
    "resolution" TEXT,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,
    "suspenseDate" TIMESTAMP(3),
    "extensionRequested" BOOLEAN NOT NULL DEFAULT false,
    "extensionReason" TEXT,
    "newSuspenseDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_changes" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "changeType" TEXT NOT NULL,
    "content" TEXT,
    "position" INTEGER,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "document_changes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_collaborators" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "CollaboratorRole" NOT NULL DEFAULT 'CO_AUTHOR',
    "permissions" "CollaboratorPermission"[],
    "invitedById" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActiveAt" TIMESTAMP(3),
    "contributionSummary" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "document_collaborators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_publishings" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "submittedById" TEXT NOT NULL,
    "publishedById" TEXT,
    "currentStepNumber" INTEGER NOT NULL DEFAULT 1,
    "status" "PublishingStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "priority" "PublishingPriority" NOT NULL DEFAULT 'NORMAL',
    "dueDate" TIMESTAMP(3),
    "scheduledPublishDate" TIMESTAMP(3),
    "actualPublishDate" TIMESTAMP(3),
    "submissionNotes" TEXT,
    "rejectionReason" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_publishings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_sections" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "sectionNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "wordCount" INTEGER NOT NULL DEFAULT 0,
    "primaryAuthorId" TEXT,
    "assignedToId" TEXT,
    "status" "SectionStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "dependsOnSections" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "document_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "editor_sessions" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "charactersTyped" INTEGER NOT NULL DEFAULT 0,
    "timeSpent" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "editor_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_coordinating_users" (
    "id" TEXT NOT NULL,
    "workflow_instance_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "coordination_type" "CoordinationType" NOT NULL,
    "organization_code" TEXT,
    "assigned_by" TEXT NOT NULL,
    "response_deadline" TIMESTAMP(3) NOT NULL,
    "extension_requested" BOOLEAN DEFAULT false,
    "extension_granted_until" TIMESTAMP(3),
    "has_responded" BOOLEAN NOT NULL DEFAULT false,
    "response_received_at" TIMESTAMP(3),
    "coordination_status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "external_coordinating_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "icu_draft_versions" (
    "id" TEXT NOT NULL,
    "workflow_instance_id" TEXT NOT NULL,
    "icu_id" TEXT NOT NULL,
    "document_version_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "content_snapshot" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "icu_draft_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "icu_feedback" (
    "id" TEXT NOT NULL,
    "icu_id" TEXT NOT NULL,
    "paragraph_id" TEXT,
    "suggestion_type" TEXT NOT NULL,
    "original_content" TEXT,
    "suggested_content" TEXT,
    "rationale" TEXT,
    "is_accepted" BOOLEAN,
    "opr_response" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "icu_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "internal_coordinating_users" (
    "id" TEXT NOT NULL,
    "workflow_instance_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "assigned_by" TEXT NOT NULL,
    "draft_copy_id" TEXT,
    "has_reviewed" BOOLEAN NOT NULL DEFAULT false,
    "review_completed_at" TIMESTAMP(3),
    "feedback" TEXT,
    "suggestions" JSONB DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "internal_coordinating_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "o6_15_coordination" (
    "id" TEXT NOT NULL,
    "workflow_instance_id" TEXT NOT NULL,
    "ecu_id" TEXT NOT NULL,
    "technical_area" TEXT NOT NULL,
    "expertise_level" TEXT,
    "review_focus" TEXT[],
    "technical_comments" JSONB DEFAULT '[]',
    "concurrence_status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "o6_15_coordination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviewer_feedback" (
    "id" TEXT NOT NULL,
    "approvalId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "feedbackType" "FeedbackType" NOT NULL DEFAULT 'GENERAL',
    "summary" TEXT,
    "detailedComments" TEXT,
    "conditions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "recommendations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sectionFeedback" JSONB NOT NULL DEFAULT '{}',
    "overallRating" DOUBLE PRECISION,
    "technicalRating" DOUBLE PRECISION,
    "clarityRating" DOUBLE PRECISION,
    "completenessRating" DOUBLE PRECISION,
    "collaborativeNotes" TEXT,
    "agreesWithReviewer" TEXT,
    "disagreesWithReviewer" TEXT,
    "timeSpent" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviewer_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "section_changes" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "changeType" "ChangeType" NOT NULL,
    "content" TEXT,
    "previousContent" TEXT,
    "position" INTEGER,
    "length" INTEGER,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT,
    "wordsDelta" INTEGER,
    "charactersDelta" INTEGER,
    "changeDescription" TEXT,

    CONSTRAINT "section_changes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "section_comments" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "commentType" "CommentType" NOT NULL DEFAULT 'GENERAL',
    "position" INTEGER,
    "length" INTEGER,
    "selectedText" TEXT,
    "parentCommentId" TEXT,
    "threadId" TEXT,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "section_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sequential_workflows" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "currentStage" "WorkflowStage" NOT NULL DEFAULT 'OPR_DRAFT_CREATION',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "sequential_workflows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_activities" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "activityType" "ActivityType" NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_participants" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "SessionRole" NOT NULL DEFAULT 'PARTICIPANT',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    "isOnline" BOOLEAN NOT NULL DEFAULT true,
    "lastCursorPosition" INTEGER,
    "lastSectionId" TEXT,
    "currentActivity" TEXT,

    CONSTRAINT "session_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stage_requirements" (
    "id" TEXT NOT NULL,
    "workflow_instance_id" TEXT NOT NULL,
    "stage" "WorkflowStage" NOT NULL,
    "requirement_type" TEXT NOT NULL,
    "requirement_description" TEXT NOT NULL,
    "is_mandatory" BOOLEAN NOT NULL DEFAULT true,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_by" TEXT,
    "completed_at" TIMESTAMP(3),
    "verification_data" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stage_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stage_transitions" (
    "id" TEXT NOT NULL,
    "workflow_instance_id" TEXT NOT NULL,
    "from_stage" "WorkflowStage",
    "to_stage" "WorkflowStage" NOT NULL,
    "transitioned_by" TEXT NOT NULL,
    "transition_notes" TEXT,
    "transition_data" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stage_transitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "two_letter_coordination" (
    "id" TEXT NOT NULL,
    "workflow_instance_id" TEXT NOT NULL,
    "ecu_id" TEXT NOT NULL,
    "senior_official_id" TEXT NOT NULL,
    "organization_code" TEXT NOT NULL,
    "high_level_approval" BOOLEAN,
    "strategic_comments" TEXT,
    "policy_alignment" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "two_letter_coordination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_audit_trail" (
    "id" TEXT NOT NULL,
    "workflow_instance_id" TEXT NOT NULL,
    "action_type" TEXT NOT NULL,
    "action_description" TEXT NOT NULL,
    "performed_by" TEXT NOT NULL,
    "stage" "WorkflowStage" NOT NULL,
    "action_data" JSONB DEFAULT '{}',
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_audit_trail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_instances" (
    "id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "opr_user_id" TEXT NOT NULL,
    "current_stage" "WorkflowStage" NOT NULL DEFAULT 'DRAFT_CREATION',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "workflow_metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "workflow_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_stage_assignments" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "stage" "WorkflowStage" NOT NULL,
    "assigneeId" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "suspenseDate" TIMESTAMP(3) NOT NULL,
    "extensionRequested" BOOLEAN NOT NULL DEFAULT false,
    "extensionReason" TEXT,
    "newDueDate" TIMESTAMP(3),
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_stage_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_stage_history" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "stage" "WorkflowStage" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedById" TEXT,
    "completionNotes" TEXT,

    CONSTRAINT "workflow_stage_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_supporting_documents" (
    "id" TEXT NOT NULL,
    "workflow_instance_id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "document_type" TEXT NOT NULL,
    "stage_added" "WorkflowStage" NOT NULL,
    "added_by" TEXT NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_supporting_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplemental_sections" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "parentSectionNumber" TEXT NOT NULL,
    "parentSectionTitle" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "rationale" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "supplemental_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachments" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "storagePath" TEXT NOT NULL,
    "storageProvider" TEXT NOT NULL DEFAULT 'minio',
    "description" TEXT,
    "attachmentType" TEXT,
    "attachmentOrder" INTEGER,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedById" TEXT NOT NULL,
    "checksum" TEXT,
    "objectVersionId" TEXT,
    "malwareScan" "MalwareScanStatus" NOT NULL DEFAULT 'PENDING',
    "retentionUntil" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_plugins" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "description" TEXT,
    "organization" TEXT,
    "author" TEXT,
    "config" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_plugins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_activations" (
    "id" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "pluginId" TEXT NOT NULL,
    "activatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activatedBy" TEXT,

    CONSTRAINT "workflow_activations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_states" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "currentStage" TEXT NOT NULL,
    "previousStage" TEXT,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "data" JSONB NOT NULL DEFAULT '{}',
    "history" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "workflow_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_resets" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" "PasswordResetStatus" NOT NULL DEFAULT 'PENDING',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,

    CONSTRAINT "password_resets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_changes" (
    "id" TEXT NOT NULL,
    "changeType" "PasswordChangeType" NOT NULL,
    "status" "PasswordChangeStatus" NOT NULL DEFAULT 'PENDING',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "password_changes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "csv_exports" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "exportType" TEXT NOT NULL,
    "recordCount" INTEGER NOT NULL DEFAULT 0,
    "fileSize" INTEGER NOT NULL DEFAULT 0,
    "filePath" TEXT,
    "status" "ExportStatus" NOT NULL DEFAULT 'PENDING',
    "filters" JSONB NOT NULL DEFAULT '{}',
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "csv_exports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pdf_exports" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "exportType" TEXT NOT NULL,
    "pageCount" INTEGER NOT NULL DEFAULT 0,
    "fileSize" INTEGER NOT NULL DEFAULT 0,
    "filePath" TEXT,
    "status" "ExportStatus" NOT NULL DEFAULT 'PENDING',
    "templateUsed" TEXT,
    "orientation" TEXT NOT NULL DEFAULT 'portrait',
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "pdf_exports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "confirmation_dialogs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "confirmText" TEXT NOT NULL DEFAULT 'Confirm',
    "cancelText" TEXT NOT NULL DEFAULT 'Cancel',
    "dialogType" "DialogType" NOT NULL DEFAULT 'INFO',
    "severity" "DialogSeverity" NOT NULL DEFAULT 'MEDIUM',
    "icon" TEXT,
    "requireInput" BOOLEAN NOT NULL DEFAULT false,
    "inputLabel" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "confirmation_dialogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_verifications" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" "EmailVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "ipAddress" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,

    CONSTRAINT "email_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_strength_rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "ruleType" "PasswordRuleType" NOT NULL,
    "value" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "password_strength_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "input_sanitization_rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "ruleType" "SanitizationRuleType" NOT NULL,
    "pattern" TEXT NOT NULL,
    "replacement" TEXT NOT NULL DEFAULT '',
    "fieldTarget" TEXT NOT NULL DEFAULT '*',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "blockedCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "input_sanitization_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_domain_key" ON "organizations"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_organizationId_key" ON "roles"("name", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "roles_roleType_organizationId_key" ON "roles"("roleType", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_sessionId_key" ON "user_sessions"("sessionId");

-- CreateIndex
CREATE INDEX "user_sessions_userId_isActive_expiresAt_idx" ON "user_sessions"("userId", "isActive", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "documents_checksum_key" ON "documents"("checksum");

-- CreateIndex
CREATE UNIQUE INDEX "documents_documentNumber_key" ON "documents"("documentNumber");

-- CreateIndex
CREATE UNIQUE INDEX "document_versions_documentId_versionNumber_key" ON "document_versions"("documentId", "versionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "folders_name_parentFolderId_organizationId_key" ON "folders"("name", "parentFolderId", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "document_permissions_documentId_userId_key" ON "document_permissions"("documentId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "folder_permissions_folderId_userId_key" ON "folder_permissions"("folderId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "json_workflow_instances_documentId_isActive_key" ON "json_workflow_instances"("documentId", "isActive");

-- CreateIndex
CREATE INDEX "audit_logs_resource_resourceId_idx" ON "audit_logs"("resource", "resourceId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_createdAt_idx" ON "audit_logs"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationAuthPolicy_organizationId_key" ON "OrganizationAuthPolicy"("organizationId");

-- CreateIndex
CREATE INDEX "ExternalIdentity_organizationId_userId_idx" ON "ExternalIdentity"("organizationId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalIdentity_issuer_subject_key" ON "ExternalIdentity"("issuer", "subject");

-- CreateIndex
CREATE INDEX "ApprovalDelegation_organizationId_delegateId_status_expires_idx" ON "ApprovalDelegation"("organizationId", "delegateId", "status", "expiresAt");

-- CreateIndex
CREATE INDEX "AIReviewArtifact_organizationId_documentId_status_idx" ON "AIReviewArtifact"("organizationId", "documentId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "AIReviewArtifact_documentId_documentVersion_outputChecksum_key" ON "AIReviewArtifact"("documentId", "documentVersion", "outputChecksum");

-- CreateIndex
CREATE INDEX "SignedAuditEvent_organizationId_entityType_entityId_created_idx" ON "SignedAuditEvent"("organizationId", "entityType", "entityId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SignedAuditEvent_organizationId_eventHash_key" ON "SignedAuditEvent"("organizationId", "eventHash");

-- CreateIndex
CREATE INDEX "LegalHold_organizationId_documentId_releasedAt_idx" ON "LegalHold"("organizationId", "documentId", "releasedAt");

-- CreateIndex
CREATE INDEX "ObjectDeletionJob_organizationId_status_requestedAt_idx" ON "ObjectDeletionJob"("organizationId", "status", "requestedAt");

-- CreateIndex
CREATE UNIQUE INDEX "search_index_documentId_key" ON "search_index"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_key_key" ON "system_settings"("key");

-- CreateIndex
CREATE UNIQUE INDEX "approval_steps_workflowId_stepNumber_key" ON "approval_steps"("workflowId", "stepNumber");

-- CreateIndex
CREATE UNIQUE INDEX "approval_step_users_stepId_userId_key" ON "approval_step_users"("stepId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "document_approvals_publishingId_stepId_approverId_key" ON "document_approvals"("publishingId", "stepId", "approverId");

-- CreateIndex
CREATE UNIQUE INDEX "af_form_673_form_number_key" ON "af_form_673"("form_number");

-- CreateIndex
CREATE INDEX "af_form_673_workflow_instance_id_idx" ON "af_form_673"("workflow_instance_id");

-- CreateIndex
CREATE UNIQUE INDEX "approval_step_reviewers_stepId_reviewerId_key" ON "approval_step_reviewers"("stepId", "reviewerId");

-- CreateIndex
CREATE INDEX "comment_resolution_matrix_documentId_idx" ON "comment_resolution_matrix"("documentId");

-- CreateIndex
CREATE INDEX "comment_resolution_matrix_stage_idx" ON "comment_resolution_matrix"("stage");

-- CreateIndex
CREATE INDEX "comment_resolution_matrix_workflow_instance_id_idx" ON "comment_resolution_matrix"("workflow_instance_id");

-- CreateIndex
CREATE UNIQUE INDEX "document_collaborators_documentId_userId_key" ON "document_collaborators"("documentId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "document_sections_documentId_sectionNumber_key" ON "document_sections"("documentId", "sectionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "editor_sessions_sessionToken_key" ON "editor_sessions"("sessionToken");

-- CreateIndex
CREATE INDEX "external_coordinating_users_workflow_instance_id_idx" ON "external_coordinating_users"("workflow_instance_id");

-- CreateIndex
CREATE INDEX "internal_coordinating_users_user_id_idx" ON "internal_coordinating_users"("user_id");

-- CreateIndex
CREATE INDEX "internal_coordinating_users_workflow_instance_id_idx" ON "internal_coordinating_users"("workflow_instance_id");

-- CreateIndex
CREATE UNIQUE INDEX "reviewer_feedback_approvalId_reviewerId_key" ON "reviewer_feedback"("approvalId", "reviewerId");

-- CreateIndex
CREATE UNIQUE INDEX "sequential_workflows_documentId_key" ON "sequential_workflows"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "session_participants_sessionId_userId_key" ON "session_participants"("sessionId", "userId");

-- CreateIndex
CREATE INDEX "stage_transitions_workflow_instance_id_idx" ON "stage_transitions"("workflow_instance_id");

-- CreateIndex
CREATE INDEX "workflow_audit_trail_workflow_instance_id_idx" ON "workflow_audit_trail"("workflow_instance_id");

-- CreateIndex
CREATE INDEX "workflow_instances_current_stage_idx" ON "workflow_instances"("current_stage");

-- CreateIndex
CREATE INDEX "workflow_instances_document_id_idx" ON "workflow_instances"("document_id");

-- CreateIndex
CREATE INDEX "workflow_instances_opr_user_id_idx" ON "workflow_instances"("opr_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_plugins_name_version_key" ON "workflow_plugins"("name", "version");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_activations_documentType_key" ON "workflow_activations"("documentType");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_states_documentId_key" ON "workflow_states"("documentId");

-- CreateIndex
CREATE INDEX "workflow_states_status_idx" ON "workflow_states"("status");

-- CreateIndex
CREATE INDEX "workflow_states_workflowId_idx" ON "workflow_states"("workflowId");

-- CreateIndex
CREATE UNIQUE INDEX "password_resets_token_key" ON "password_resets"("token");

-- CreateIndex
CREATE INDEX "password_resets_email_idx" ON "password_resets"("email");

-- CreateIndex
CREATE INDEX "password_resets_token_idx" ON "password_resets"("token");

-- CreateIndex
CREATE INDEX "password_changes_userId_idx" ON "password_changes"("userId");

-- CreateIndex
CREATE INDEX "csv_exports_userId_idx" ON "csv_exports"("userId");

-- CreateIndex
CREATE INDEX "pdf_exports_userId_idx" ON "pdf_exports"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "confirmation_dialogs_name_key" ON "confirmation_dialogs"("name");

-- CreateIndex
CREATE UNIQUE INDEX "email_verifications_token_key" ON "email_verifications"("token");

-- CreateIndex
CREATE INDEX "email_verifications_email_idx" ON "email_verifications"("email");

-- CreateIndex
CREATE INDEX "email_verifications_token_idx" ON "email_verifications"("token");

-- CreateIndex
CREATE UNIQUE INDEX "password_strength_rules_name_key" ON "password_strength_rules"("name");

-- CreateIndex
CREATE UNIQUE INDEX "input_sanitization_rules_name_key" ON "input_sanitization_rules"("name");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_parentDocumentId_fkey" FOREIGN KEY ("parentDocumentId") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folders" ADD CONSTRAINT "folders_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folders" ADD CONSTRAINT "folders_parentFolderId_fkey" FOREIGN KEY ("parentFolderId") REFERENCES "folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_permissions" ADD CONSTRAINT "document_permissions_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_permissions" ADD CONSTRAINT "document_permissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folder_permissions" ADD CONSTRAINT "folder_permissions_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folder_permissions" ADD CONSTRAINT "folder_permissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflows" ADD CONSTRAINT "workflows_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_workflows" ADD CONSTRAINT "document_workflows_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_workflows" ADD CONSTRAINT "document_workflows_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "workflows"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "json_workflow_instances" ADD CONSTRAINT "json_workflow_instances_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "json_workflow_history" ADD CONSTRAINT "json_workflow_history_workflowInstanceId_fkey" FOREIGN KEY ("workflowInstanceId") REFERENCES "json_workflow_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_tasks" ADD CONSTRAINT "workflow_tasks_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_tasks" ADD CONSTRAINT "workflow_tasks_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_tasks" ADD CONSTRAINT "workflow_tasks_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "workflows"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_parentCommentId_fkey" FOREIGN KEY ("parentCommentId") REFERENCES "comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationAuthPolicy" ADD CONSTRAINT "OrganizationAuthPolicy_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalIdentity" ADD CONSTRAINT "ExternalIdentity_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalIdentity" ADD CONSTRAINT "ExternalIdentity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalDelegation" ADD CONSTRAINT "ApprovalDelegation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalDelegation" ADD CONSTRAINT "ApprovalDelegation_grantorId_fkey" FOREIGN KEY ("grantorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalDelegation" ADD CONSTRAINT "ApprovalDelegation_delegateId_fkey" FOREIGN KEY ("delegateId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIReviewArtifact" ADD CONSTRAINT "AIReviewArtifact_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIReviewArtifact" ADD CONSTRAINT "AIReviewArtifact_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIReviewArtifact" ADD CONSTRAINT "AIReviewArtifact_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIReviewArtifact" ADD CONSTRAINT "AIReviewArtifact_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignedAuditEvent" ADD CONSTRAINT "SignedAuditEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalHold" ADD CONSTRAINT "LegalHold_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalHold" ADD CONSTRAINT "LegalHold_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObjectDeletionJob" ADD CONSTRAINT "ObjectDeletionJob_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObjectDeletionJob" ADD CONSTRAINT "ObjectDeletionJob_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publishing_workflows" ADD CONSTRAINT "publishing_workflows_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_steps" ADD CONSTRAINT "approval_steps_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "publishing_workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_step_users" ADD CONSTRAINT "approval_step_users_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "approval_steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_step_users" ADD CONSTRAINT "approval_step_users_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_publishing" ADD CONSTRAINT "document_publishing_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "document_publishing" ADD CONSTRAINT "document_publishing_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "document_approvals" ADD CONSTRAINT "document_approvals_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_approvals" ADD CONSTRAINT "document_approvals_delegatedById_fkey" FOREIGN KEY ("delegatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_approvals" ADD CONSTRAINT "document_approvals_publishingId_fkey" FOREIGN KEY ("publishingId") REFERENCES "document_publishings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_approvals" ADD CONSTRAINT "document_approvals_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "approval_steps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publishing_templates" ADD CONSTRAINT "publishing_templates_organization_id_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "publishing_notifications" ADD CONSTRAINT "publishing_notifications_publishingId_fkey" FOREIGN KEY ("publishingId") REFERENCES "document_publishings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publishing_notifications" ADD CONSTRAINT "publishing_notifications_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_distributions" ADD CONSTRAINT "document_distributions_initiatedById_fkey" FOREIGN KEY ("initiatedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_distributions" ADD CONSTRAINT "document_distributions_publishingId_fkey" FOREIGN KEY ("publishingId") REFERENCES "document_publishings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "af_form_673" ADD CONSTRAINT "af_form_673_workflow_instance_id_fkey" FOREIGN KEY ("workflow_instance_id") REFERENCES "workflow_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_step_reviewers" ADD CONSTRAINT "approval_step_reviewers_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_step_reviewers" ADD CONSTRAINT "approval_step_reviewers_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "approval_steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collaboration_sessions" ADD CONSTRAINT "collaboration_sessions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collaboration_sessions" ADD CONSTRAINT "collaboration_sessions_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_resolution_matrix" ADD CONSTRAINT "comment_resolution_matrix_workflow_instance_id_fkey" FOREIGN KEY ("workflow_instance_id") REFERENCES "workflow_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_resolution_matrix" ADD CONSTRAINT "crm_document_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_resolution_matrix" ADD CONSTRAINT "crm_sequential_workflow_fkey" FOREIGN KEY ("documentId") REFERENCES "sequential_workflows"("documentId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_entries" ADD CONSTRAINT "crm_entries_coordinatorId_fkey" FOREIGN KEY ("coordinatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_entries" ADD CONSTRAINT "crm_entries_crmId_fkey" FOREIGN KEY ("crmId") REFERENCES "comment_resolution_matrix"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_entries" ADD CONSTRAINT "crm_entries_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_collaborators" ADD CONSTRAINT "document_collaborators_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_collaborators" ADD CONSTRAINT "document_collaborators_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_collaborators" ADD CONSTRAINT "document_collaborators_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_publishings" ADD CONSTRAINT "document_publishings_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_publishings" ADD CONSTRAINT "document_publishings_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_publishings" ADD CONSTRAINT "document_publishings_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_publishings" ADD CONSTRAINT "document_publishings_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "publishing_workflows"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_sections" ADD CONSTRAINT "document_sections_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_sections" ADD CONSTRAINT "document_sections_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_sections" ADD CONSTRAINT "document_sections_primaryAuthorId_fkey" FOREIGN KEY ("primaryAuthorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_coordinating_users" ADD CONSTRAINT "external_coordinating_users_workflow_instance_id_fkey" FOREIGN KEY ("workflow_instance_id") REFERENCES "workflow_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "icu_feedback" ADD CONSTRAINT "icu_feedback_icu_id_fkey" FOREIGN KEY ("icu_id") REFERENCES "internal_coordinating_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal_coordinating_users" ADD CONSTRAINT "internal_coordinating_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal_coordinating_users" ADD CONSTRAINT "internal_coordinating_users_workflow_instance_id_fkey" FOREIGN KEY ("workflow_instance_id") REFERENCES "workflow_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "o6_15_coordination" ADD CONSTRAINT "o6_15_coordination_workflow_instance_id_fkey" FOREIGN KEY ("workflow_instance_id") REFERENCES "workflow_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviewer_feedback" ADD CONSTRAINT "reviewer_feedback_approvalId_fkey" FOREIGN KEY ("approvalId") REFERENCES "document_approvals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviewer_feedback" ADD CONSTRAINT "reviewer_feedback_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "section_changes" ADD CONSTRAINT "section_changes_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "document_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "section_changes" ADD CONSTRAINT "section_changes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "section_comments" ADD CONSTRAINT "section_comments_parentCommentId_fkey" FOREIGN KEY ("parentCommentId") REFERENCES "section_comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "section_comments" ADD CONSTRAINT "section_comments_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "section_comments" ADD CONSTRAINT "section_comments_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "document_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "section_comments" ADD CONSTRAINT "section_comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sequential_workflows" ADD CONSTRAINT "sequential_workflows_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_activities" ADD CONSTRAINT "session_activities_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "collaboration_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_activities" ADD CONSTRAINT "session_activities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_participants" ADD CONSTRAINT "session_participants_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "collaboration_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_participants" ADD CONSTRAINT "session_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stage_transitions" ADD CONSTRAINT "stage_transitions_transitioned_by_fkey" FOREIGN KEY ("transitioned_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stage_transitions" ADD CONSTRAINT "stage_transitions_workflow_instance_id_fkey" FOREIGN KEY ("workflow_instance_id") REFERENCES "workflow_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "two_letter_coordination" ADD CONSTRAINT "two_letter_coordination_workflow_instance_id_fkey" FOREIGN KEY ("workflow_instance_id") REFERENCES "workflow_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_instances" ADD CONSTRAINT "workflow_instances_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_instances" ADD CONSTRAINT "workflow_instances_opr_user_id_fkey" FOREIGN KEY ("opr_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_instances" ADD CONSTRAINT "workflow_instances_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_stage_assignments" ADD CONSTRAINT "workflow_stage_assignments_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_stage_assignments" ADD CONSTRAINT "workflow_stage_assignments_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "sequential_workflows"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_stage_history" ADD CONSTRAINT "workflow_stage_history_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_stage_history" ADD CONSTRAINT "workflow_stage_history_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "sequential_workflows"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_supporting_documents" ADD CONSTRAINT "workflow_supporting_documents_workflow_instance_id_fkey" FOREIGN KEY ("workflow_instance_id") REFERENCES "workflow_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplemental_sections" ADD CONSTRAINT "supplemental_sections_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplemental_sections" ADD CONSTRAINT "supplemental_sections_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_activations" ADD CONSTRAINT "workflow_activations_pluginId_fkey" FOREIGN KEY ("pluginId") REFERENCES "workflow_plugins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_states" ADD CONSTRAINT "workflow_states_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "workflow_plugins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_changes" ADD CONSTRAINT "password_changes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "csv_exports" ADD CONSTRAINT "csv_exports_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pdf_exports" ADD CONSTRAINT "pdf_exports_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_verifications" ADD CONSTRAINT "email_verifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
