import React from 'react';
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Paper,
  Grid,
  Button,
  Stack
} from '@mui/material';
import {
  Edit,
  Download,
  Delete,
  Share,
  Lock,
  LockOpen,
  VerifiedUser,
  Shield,
  ArrowBack,
  Print,
  Archive
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { DocumentData, WorkflowStatus } from '@/hooks/useDocumentData';

interface DocumentHeaderProps {
  document: DocumentData;
  workflowStatus?: WorkflowStatus | null;
  userRole?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onDownload?: () => void;
  onShare?: () => void;
  onPrint?: () => void;
  onArchive?: () => void;
}

export const DocumentHeader: React.FC<DocumentHeaderProps> = ({
  document,
  workflowStatus,
  userRole,
  onEdit,
  onDelete,
  onDownload,
  onShare,
  onPrint,
  onArchive
}) => {
  const router = useRouter();

  const getStatusColor = (status: string): 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'success' | 'info' => {
    switch (status?.toUpperCase()) {
      case 'DRAFT':
        return 'default';
      case 'SUBMITTED':
        return 'primary';
      case 'IN_REVIEW':
        return 'warning';
      case 'APPROVED':
        return 'success';
      case 'REJECTED':
        return 'error';
      case 'PUBLISHED':
        return 'info';
      default:
        return 'default';
    }
  };

  const getClassificationIcon = (level: string) => {
    switch (level?.toUpperCase()) {
      case 'CONFIDENTIAL':
        return <Lock fontSize="small" />;
      case 'SECRET':
        return <Shield fontSize="small" />;
      case 'TOP SECRET':
        return <VerifiedUser fontSize="small" />;
      default:
        return <LockOpen fontSize="small" />;
    }
  };

  const getClassificationColor = (level: string) => {
    switch (level?.toUpperCase()) {
      case 'CONFIDENTIAL':
        return 'warning.main';
      case 'SECRET':
        return 'error.main';
      case 'TOP SECRET':
        return 'error.dark';
      default:
        return 'success.main';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box sx={{ flex: 1 }}>
              {/* Title and Back Button */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <IconButton
                  onClick={() => router.push('/documents')}
                  size="small"
                  sx={{ bgcolor: 'action.hover' }}
                >
                  <ArrowBack />
                </IconButton>
                <Typography variant="h4" component="h1">
                  {document.title}
                </Typography>
              </Box>

              {/* Description */}
              {document.description && (
                <Typography variant="body1" color="text.secondary" paragraph>
                  {document.description}
                </Typography>
              )}

              {/* Metadata Chips */}
              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
                {/* Status */}
                <Chip
                  label={document.status}
                  color={getStatusColor(document.status)}
                  size="small"
                />

                {/* Classification */}
                <Chip
                  icon={getClassificationIcon(document.classificationLevel)}
                  label={document.classificationLevel}
                  size="small"
                  sx={{
                    color: getClassificationColor(document.classificationLevel),
                    borderColor: getClassificationColor(document.classificationLevel)
                  }}
                  variant="outlined"
                />

                {/* Version */}
                <Chip
                  label={`Version ${document.version}`}
                  size="small"
                  variant="outlined"
                />

                {/* Workflow Stage */}
                {workflowStatus?.active && workflowStatus.currentStageName && (
                  <Chip
                    label={workflowStatus.currentStageName}
                    color="primary"
                    size="small"
                  />
                )}

                {/* Feedback Count */}
                {document.feedbackCount && document.feedbackCount > 0 && (
                  <Chip
                    label={`${document.feedbackCount} Feedback`}
                    color="info"
                    size="small"
                    variant="outlined"
                  />
                )}

                {/* Organization */}
                {document.organization && (
                  <Chip
                    label={document.organization}
                    size="small"
                    variant="outlined"
                  />
                )}
              </Stack>

              {/* Tags */}
              {document.tags && document.tags.length > 0 && (
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
                  {document.tags.map((tag, index) => (
                    <Chip
                      key={index}
                      label={tag}
                      size="small"
                      sx={{ bgcolor: 'action.selected' }}
                    />
                  ))}
                </Box>
              )}

              {/* Dates and Creator */}
              <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                <Typography variant="caption" color="text.secondary">
                  Created: {formatDate(document.createdAt)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Updated: {formatDate(document.updatedAt)}
                </Typography>
                {document.createdBy && (
                  <Typography variant="caption" color="text.secondary">
                    By: {document.createdBy.firstName} {document.createdBy.lastName}
                  </Typography>
                )}
              </Box>
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
              {/* Edit Button */}
              {document.canEdit && onEdit && (
                <Button
                  variant="contained"
                  startIcon={<Edit />}
                  onClick={onEdit}
                  size="small"
                >
                  Edit
                </Button>
              )}

              {/* Action Icons */}
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                {onDownload && (
                  <Tooltip title="Download">
                    <IconButton onClick={onDownload} size="small">
                      <Download />
                    </IconButton>
                  </Tooltip>
                )}

                {onPrint && (
                  <Tooltip title="Print">
                    <IconButton onClick={onPrint} size="small">
                      <Print />
                    </IconButton>
                  </Tooltip>
                )}

                {document.canEdit && onShare && (
                  <Tooltip title="Share">
                    <IconButton onClick={onShare} size="small">
                      <Share />
                    </IconButton>
                  </Tooltip>
                )}

                {userRole === 'Admin' && onArchive && (
                  <Tooltip title="Archive">
                    <IconButton onClick={onArchive} size="small">
                      <Archive />
                    </IconButton>
                  </Tooltip>
                )}

                {userRole === 'Admin' && onDelete && (
                  <Tooltip title="Delete">
                    <IconButton onClick={onDelete} size="small" color="error">
                      <Delete />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};