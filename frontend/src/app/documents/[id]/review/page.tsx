'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Badge,
  Snackbar,
  Alert
} from '@mui/material';
import {
  ArrowBack,
  Description as DocumentIcon,
  Comment as CommentIcon
} from '@mui/icons-material';

import { useDocumentReview } from '@/components/document-review/useDocumentReview';
import DocumentViewer from '@/components/document-review/DocumentViewer';
import WorkflowActions from '@/components/document-review/WorkflowActions';
import CommentForm from '@/components/document-review/CommentForm';
import CommentsList from '@/components/document-review/CommentsList';

const DocumentReviewPage = () => {
  const router = useRouter();
  const params = useParams();
  const documentId = params?.id as string;
  const [selectionSnackbar, setSelectionSnackbar] = useState(false);

  const {
    state,
    setState,
    currentComment,
    setCurrentComment,
    handleAddComment,
    handleDeleteComment,
    handleToggleSelect,
    handleSelectComment,
    generateAIFeedback,
    handleClearSelectedFeedback,
    handleClearAllFeedback,
    handleSubmitFeedbackToOPR,
    handleSubmitForSecondCoordination
  } = useDocumentReview(documentId);

  return (
    <>
      <AppBar position="sticky" color="primary">
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => router.push('/dashboard')}>
            <ArrowBack />
          </IconButton>
          <DocumentIcon sx={{ ml: 2, mr: 1 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Document Review: {state.documentData?.title || 'Loading...'}
          </Typography>
          <Badge badgeContent={state.comments.length} color="error" sx={{ mr: 2 }}>
            <CommentIcon />
          </Badge>
        </Toolbar>
      </AppBar>

      <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
        <DocumentViewer
          documentData={state.documentData}
          documentContent={state.documentContent}
          showLineNumbers={state.showLineNumbers}
          showPageNumbers={state.showPageNumbers}
          onToggleLineNumbers={(checked) => setState(prev => ({ ...prev, showLineNumbers: checked }))}
          onTogglePageNumbers={(checked) => setState(prev => ({ ...prev, showPageNumbers: checked }))}
          onTextSelected={(selectedText, location, pageNumber, paragraphNumber, lineNumber) => {
            // Auto-populate comment form with selected text in "Change From" field
            setCurrentComment(prev => ({
              ...prev,
              changeFrom: selectedText,  // Selected text goes to "Change From" field
              location: location,
              page: pageNumber || prev.page,
              paragraphNumber: paragraphNumber || prev.paragraphNumber,
              lineNumber: lineNumber || prev.lineNumber
            }));
            // Open the form if it's closed
            if (!state.showAddForm) {
              setState(prev => ({ ...prev, showAddForm: true }));
            }
            // Show notification
            setSelectionSnackbar(true);
          }}
        />

        <Box sx={{ width: '600px', overflow: 'auto', p: 3, bgcolor: 'background.default' }}>
          <WorkflowActions
            workflowStage={state.workflowStage}
            userRole={state.userRole}
            documentId={documentId}
            commentsCount={state.comments.length}
            onSubmitFeedback={handleSubmitFeedbackToOPR}
            onSubmitForSecondCoordination={handleSubmitForSecondCoordination}
          />

          <CommentForm
            showAddForm={state.showAddForm}
            onToggleForm={() => setState(prev => ({ ...prev, showAddForm: !prev.showAddForm }))}
            selectedComment={state.selectedComment}
            currentComment={currentComment}
            onUpdateCurrentComment={setCurrentComment}
            onAddComment={handleAddComment}
            aiFeedbackCount={state.aiFeedbackCount}
            onUpdateAIFeedbackCount={(count) => setState(prev => ({ ...prev, aiFeedbackCount: count }))}
            generatingAIFeedback={state.generatingAIFeedback}
            onGenerateAIFeedback={generateAIFeedback}
            onClearSelectedFeedback={handleClearSelectedFeedback}
            onClearAllFeedback={handleClearAllFeedback}
            hasSelectedComments={state.comments.some(c => c.selected)}
            hasAnyComments={state.comments.length > 0}
          />

          <CommentsList
            comments={state.comments}
            isAIGeneratedDoc={state.isAIGeneratedDoc}
            onSelectComment={handleSelectComment}
            onDeleteComment={handleDeleteComment}
            onToggleSelect={handleToggleSelect}
          />
        </Box>
      </Box>

      <Snackbar
        open={selectionSnackbar}
        autoHideDuration={3000}
        onClose={() => setSelectionSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSelectionSnackbar(false)} severity="success" sx={{ width: '100%' }}>
          Selected text added to comment form!
        </Alert>
      </Snackbar>
    </>
  );
};

export default DocumentReviewPage;