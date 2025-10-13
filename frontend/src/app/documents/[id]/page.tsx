'use client';

import React from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  Grid,
  Chip,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Divider,
  TextField,
  Stack
} from '@mui/material';
import {
  ArrowBack,
  Download as DownloadIcon,
  Description as DocumentIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Category as CategoryIcon,
  Visibility as ViewIcon,
  RateReview as ReviewIcon,
  Edit as EditIcon,
  History as HistoryIcon,
  Assignment as AssignmentIcon,
  CheckCircle,
  PlayArrow as StartWorkflowIcon,
  Send as SubmitIcon
} from '@mui/icons-material';
import { useRouter, useParams } from 'next/navigation';
import DocumentVersionsWithComparison from '../../../components/DocumentVersionsWithComparison';
import WorkflowTasks from '../../../components/WorkflowTasks';
import OPRFeedbackProcessor from '../../../components/feedback/OPRFeedbackProcessor';
import { api } from '@/lib/api';
import { JsonWorkflowDisplay } from '../../../components/workflow/JsonWorkflowDisplay';
import { useDocumentView } from '@/components/document-view/useDocumentView';
import { workflowSteps, stageRoles } from '@/components/document-view/workflowConstants';

const DocumentViewPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const documentId = params?.id as string;

  const {
    documentData,
    currentUserId,
    userRole,
    uiState,
    workflowState,
    feedbackState,
    jsonWorkflowResetRef,
    setFeedbackState,
    fetchDocumentData,
    startWorkflow,
    handleWorkflowAdvancement,
    getStageNumber,
    canUserAdvanceFromStage,
    getStageRequirementMessage,
    isWorkflowNotStarted
  } = useDocumentView(documentId);

  // Render workflow progress indicator
  const renderWorkflowProgress = () => {
    // Don't show this old progress indicator - JsonWorkflowDisplay handles it
    return null;
  };

  // Render workflow action buttons
  const renderWorkflowButtons = () => {
    // Don't show old workflow buttons - JsonWorkflowDisplay handles all workflow actions
    return null;
  };

  // Render feedback display
  const renderFeedbackDisplay = () => {
    if (!feedbackState.actualCoordinatorFeedback && !feedbackState.actualLegalFeedback) return null;

    return (
      <Card sx={{ mb: 2, bgcolor: 'info.light' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📝 Workflow Feedback
          </Typography>
          {feedbackState.actualCoordinatorFeedback && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Coordinator Feedback:
              </Typography>
              <Typography variant="body2" sx={{ bgcolor: 'background.paper', p: 1, borderRadius: 1 }}>
                {feedbackState.actualCoordinatorFeedback}
              </Typography>
            </Box>
          )}
          {feedbackState.actualLegalFeedback && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Legal Review Feedback:
              </Typography>
              <Typography variant="body2" sx={{ bgcolor: 'background.paper', p: 1, borderRadius: 1 }}>
                {feedbackState.actualLegalFeedback}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  if (uiState.loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading document...
        </Typography>
      </Box>
    );
  }

  if (uiState.error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{uiState.error}</Alert>
      </Container>
    );
  }

  if (!documentData) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning">Document not found</Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => router.push('/dashboard')}
            sx={{ mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          <DocumentIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Document Details
          </Typography>
          <Chip
            label={userRole?.roleType || userRole?.role || 'Loading...'}
            sx={{ bgcolor: 'white', color: 'primary.main', fontWeight: 'bold' }}
            icon={<PersonIcon />}
          />
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* Page Title and Quick Actions */}
        <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.main', color: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                📄 {documentData.title}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Chip
                  label={documentData.status}
                  sx={{
                    bgcolor: documentData.status === 'PUBLISHED' ? 'success.light' :
                            documentData.status === 'IN_REVIEW' ? 'warning.light' : 'info.light',
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                />
                <Chip
                  label={`Version ${documentData.currentVersion || 1}`}
                  sx={{ bgcolor: 'white', color: 'primary.main' }}
                  icon={<HistoryIcon />}
                />
                <Chip
                  label={documentData.category || 'Uncategorized'}
                  sx={{ bgcolor: 'white', color: 'primary.main' }}
                  icon={<CategoryIcon />}
                />
              </Box>
            </Box>
          </Box>
        </Paper>

        {/* Quick Actions Bar */}
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50', border: '2px solid', borderColor: 'primary.main' }}>
          <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 'bold' }}>
            🚀 Quick Actions
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={<EditIcon />}
                  onClick={() => router.push(`/editor/${documentId}`)}
                  sx={{ minWidth: 150 }}
                >
                  Edit Document
                </Button>

                <Button
                  variant="contained"
                  color="secondary"
                  size="large"
                  startIcon={<ReviewIcon />}
                  onClick={() => router.push(`/documents/${documentId}/review`)}
                  sx={{ minWidth: 150 }}
                >
                  Review & CRM
                </Button>

                {(() => {
                  // Show OPR Review button for OPR/Action Officer/Leadership roles
                  const userRoleStr = userRole?.role || userRole?.roleType || '';
                  const userEmail = userRole?.email || '';

                  // Check if user is OPR, Action Officer, Leadership, or has OPR in email
                  const canAccessOPRReview = userRoleStr.toLowerCase().includes('opr') ||
                    userRoleStr.toLowerCase().includes('action') ||
                    userRoleStr.toLowerCase().includes('ao') ||
                    userRoleStr.toLowerCase().includes('leadership') ||
                    userEmail.toLowerCase().includes('opr') ||
                    userRoleStr === 'ADMIN' ||
                    userRoleStr === 'Admin';

                  return canAccessOPRReview && (
                    <Button
                      variant="contained"
                      color="primary"
                      size="large"
                      startIcon={<AssignmentIcon />}
                      onClick={() => router.push(`/documents/${documentId}/opr-review`)}
                      sx={{ minWidth: 150 }}
                    >
                      OPR Review
                    </Button>
                  );
                })()}

                <Button
                  variant="outlined"
                  color="primary"
                  size="large"
                  startIcon={<HistoryIcon />}
                  onClick={() => {
                    const element = document.getElementById('version-history');
                    element?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  sx={{ minWidth: 150 }}
                >
                  Versions
                </Button>
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<ViewIcon />}
                  onClick={() => {
                    const element = document.getElementById('document-preview');
                    element?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Preview
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<DownloadIcon />}
                  onClick={async () => {
                    const response = await api.get(`/api/documents/${documentId}/download`);
                    if (response.ok) {
                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = documentData?.title || 'document';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      window.URL.revokeObjectURL(url);
                    }
                  }}
                >
                  Download
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        <Grid container spacing={3}>
          {/* Main Content */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'flex-start', mb: 3 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h4" gutterBottom>
                    {documentData.title}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Chip
                      label={documentData.status}
                      color={
                        documentData.status === 'PUBLISHED' ? 'success' :
                        documentData.status === 'IN_REVIEW' ? 'warning' :
                        documentData.status === 'DRAFT' ? 'info' : 'default'
                      }
                      sx={{ mr: 1 }}
                    />
                    {workflowState.active && (
                      <Chip
                        label={`Workflow: ${workflowState.stage}`}
                        color="primary"
                        variant="outlined"
                      />
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <PersonIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                    Created by {documentData.createdBy.firstName} {documentData.createdBy.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <CalendarIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                    {new Date(documentData.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* JSON-Based Workflow System - Shows the 12-stage workflow */}
              <JsonWorkflowDisplay
                documentId={documentId}
                userRole={userRole?.roleType || userRole?.role || 'USER'}
                canEdit={true}
                onWorkflowUpdate={fetchDocumentData}
              />

              {/* Workflow Action Buttons */}
              {renderWorkflowButtons()}

              {/* Feedback Display */}
              {renderFeedbackDisplay()}

              {/* Document Content Display */}
              {feedbackState.savedDocumentContent && (
                <Card sx={{ mb: 2, bgcolor: 'success.light' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      📄 Saved Document Content
                    </Typography>
                    <Typography variant="body2" sx={{
                      bgcolor: 'background.paper',
                      p: 2,
                      borderRadius: 1,
                      whiteSpace: 'pre-wrap'
                    }}>
                      {feedbackState.savedDocumentContent}
                    </Typography>
                  </CardContent>
                </Card>
              )}
            </Paper>

            {/* Document Viewer */}
            <Paper id="document-preview" sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                📄 Document Preview
              </Typography>

              {/* Display formatted header if available */}
              {documentData.customFields?.headerHtml && (
                <>
                  {/* Extract and apply styles from headerHtml */}
                  {(() => {
                    const styleMatch = documentData.customFields.headerHtml.match(/<style>([\s\S]*?)<\/style>/);
                    if (styleMatch) {
                      return <style dangerouslySetInnerHTML={{ __html: styleMatch[1] }} />;
                    }
                    return null;
                  })()}

                  {/* Display the header */}
                  <Box
                    sx={{
                      mb: 3,
                      backgroundColor: 'white',
                      padding: '20px',
                      '& .header-table': {
                        width: '100%',
                        marginBottom: '20px'
                      },
                      '& .header-table td': {
                        verticalAlign: 'top',
                        padding: '10px'
                      },
                      '& .left-column': {
                        width: '35%',
                        textAlign: 'center'
                      },
                      '& .right-column': {
                        width: '65%',
                        textAlign: 'right'
                      },
                      '& .seal-container img': {
                        width: '100px',
                        height: '100px',
                        display: 'block',
                        margin: '0 auto'
                      },
                      '& .compliance-section': {
                        textAlign: 'center',
                        fontWeight: 'bold',
                        fontSize: '10pt',
                        margin: '30px 0',
                        padding: '10px 0',
                        borderTop: '2px solid #000',
                        borderBottom: '2px solid #000'
                      },
                      '& .info-table': {
                        width: '100%',
                        borderCollapse: 'collapse',
                        marginTop: '20px'
                      },
                      '& .info-table td': {
                        padding: '8px',
                        borderTop: '1px solid #000',
                        fontSize: '10pt',
                        verticalAlign: 'top'
                      }
                    }}
                    dangerouslySetInnerHTML={{ __html: documentData.customFields.headerHtml }}
                  />
                </>
              )}

              {/* Display document content */}
              <Box
                dangerouslySetInnerHTML={{
                  __html: documentData.customFields?.editableContent ||
                          documentData.customFields?.content ||
                          documentData.content ||
                          '<p>No content available</p>'
                }}
                sx={{
                  '& h1, & h2, & h3, & h4, & h5, & h6': {
                    fontWeight: 'bold',
                    marginTop: '1em',
                    marginBottom: '0.5em'
                  },
                  '& p': {
                    marginBottom: '1em',
                    lineHeight: 1.6
                  }
                }}
              />
            </Paper>

            {/* OPR Feedback Processor */}
            {(workflowState.stage?.includes('OPR') ||
              workflowState.stage?.includes('Draft') ||
              workflowState.stage?.includes('Feedback') ||
              userRole?.role === 'ADMIN' ||
              userRole?.role === 'Admin') && (
              <Paper sx={{ p: 2, mt: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                  🤖 AI-Powered Feedback Processing
                </Typography>
                <OPRFeedbackProcessor documentId={documentId} documentTitle={documentData?.title || ''} />
              </Paper>
            )}
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Document Details
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Category
                </Typography>
                <Typography variant="body1">
                  {documentData.category || 'Uncategorized'}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  File Size
                </Typography>
                <Typography variant="body1">
                  {documentData.fileSize ? `${(documentData.fileSize / 1024).toFixed(2)} KB` : 'Unknown'}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Type
                </Typography>
                <Typography variant="body1">
                  {documentData.mimeType || 'Unknown'}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Version
                </Typography>
                <Typography variant="body1">
                  {documentData.currentVersion || 1}
                </Typography>
              </Box>
            </Paper>

            {/* Workflow Tasks Component */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <WorkflowTasks />
            </Paper>

            {/* Document Versions */}
            <Paper id="version-history" sx={{ p: 3 }}>
              {documentData && currentUserId ? (
                <DocumentVersionsWithComparison
                  documentId={documentId}
                  document={documentData}
                  currentUserId={currentUserId}
                  onVersionUpdate={fetchDocumentData}
                />
              ) : (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <CircularProgress size={24} />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Loading version history...
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default DocumentViewPage;