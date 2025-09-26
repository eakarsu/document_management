'use client';

import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Stack,
  Snackbar,
  Alert
} from '@mui/material';
import {
  useOPRFeedback,
  FeedbackModeToggle,
  ActionButtons,
  FeedbackTabs,
  VersionHistoryDialog,
  PreviewDialog,
  StatusIndicators,
  OPRFeedbackProcessorV2EnhancedProps
} from '../opr-feedback';

const OPRFeedbackProcessorV2Enhanced: React.FC<OPRFeedbackProcessorV2EnhancedProps> = ({
  documentId,
  documentTitle,
  documentContent,
  initialFeedback,
  onUpdate,
  onContentChange
}) => {
  // Use the main hook to manage all state and logic
  const feedbackState = useOPRFeedback(
    documentId,
    documentContent,
    initialFeedback,
    onUpdate,
    onContentChange
  );

  const {
    // State
    loading,
    saving,
    syncing,
    generatingAIFeedback,
    mounted,
    feedbackItems,
    conflicts,
    appliedChanges,
    currentVersion,
    versions,
    tabValue,
    processingProgress,
    previewContent,
    showPreview,
    showVersionHistory,
    selectAll,
    showPositionDetails,
    autoSave,
    showErrorDetails,
    feedbackMode,
    successMessage,
    errorMessage,
    errorDetails,
    performanceMetrics,
    lastSyncTime,

    // Actions
    handleSelectAll,
    handleToggleSelect,
    applySelectedFeedback,
    applyFeedback,
    resolveConflict,
    saveChanges,
    revertToVersion,
    generateAIFeedback,
    setTabValue,
    setShowVersionHistory,
    setShowPreview,
    setShowPositionDetails,
    setAutoSave,
    setShowErrorDetails,
    setFeedbackMode,
    setSuccessMessage,
    setErrorMessage
  } = feedbackState;

  return (
    <Paper sx={{ p: 3 }}>
      {/* Header with Version Control title */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Version Control Feedback Processor
        </Typography>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="body2" color="text.secondary">
            {documentTitle} - {feedbackItems.length} pending | {conflicts.length} conflicts | {appliedChanges.length} applied
          </Typography>
          {currentVersion && (
            <Chip
              label={`Version ${currentVersion.versionNumber}`}
              color="primary"
              size="small"
            />
          )}
        </Stack>
      </Box>

      {/* Status Indicators */}
      <StatusIndicators
        syncing={syncing}
        saving={saving}
        autoSave={autoSave}
        mounted={mounted}
        processingProgress={processingProgress}
        lastSyncTime={lastSyncTime}
        performanceMetrics={performanceMetrics}
        errorDetails={errorDetails}
        showErrorDetails={showErrorDetails}
        onToggleErrorDetails={() => setShowErrorDetails(!showErrorDetails)}
      />

      {/* Feedback Mode Toggle */}
      <FeedbackModeToggle
        feedbackMode={feedbackMode}
        onModeChange={setFeedbackMode}
        onGenerateAI={generateAIFeedback}
        generatingAIFeedback={generatingAIFeedback}
        loading={loading}
      />

      {/* Action Buttons */}
      <ActionButtons
        loading={loading}
        saving={saving}
        feedbackItems={feedbackItems}
        selectAll={selectAll}
        previewContent={previewContent}
        autoSave={autoSave}
        showPositionDetails={showPositionDetails}
        versionsCount={versions.length}
        onApplyAll={() => applyFeedback()}
        onApplySelected={applySelectedFeedback}
        onSelectAll={handleSelectAll}
        onShowVersionHistory={() => setShowVersionHistory(true)}
        onSaveChanges={() => saveChanges(false)}
        onTogglePreview={() => setShowPreview(!showPreview)}
        onAutoSaveChange={setAutoSave}
        onPositionDetailsChange={setShowPositionDetails}
      />

      {/* Feedback Tabs */}
      <FeedbackTabs
        tabValue={tabValue}
        loading={loading}
        feedbackItems={feedbackItems}
        conflicts={conflicts}
        appliedChanges={appliedChanges}
        showPositionDetails={showPositionDetails}
        onTabChange={setTabValue}
        onToggleSelect={handleToggleSelect}
        onApplyFeedback={applyFeedback}
        onResolveConflict={resolveConflict}
      />

      {/* Dialogs */}
      <VersionHistoryDialog
        open={showVersionHistory}
        versions={versions}
        onClose={() => setShowVersionHistory(false)}
        onRevertToVersion={revertToVersion}
      />

      <PreviewDialog
        open={showPreview}
        content={previewContent}
        onClose={() => setShowPreview(false)}
      />

      {/* Success/Error Messages */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage('')}
      >
        <Alert severity="success">{successMessage}</Alert>
      </Snackbar>

      <Snackbar
        open={!!errorMessage}
        autoHideDuration={6000}
        onClose={() => setErrorMessage('')}
      >
        <Alert severity="error">{errorMessage}</Alert>
      </Snackbar>
    </Paper>
  );
};

export default OPRFeedbackProcessorV2Enhanced;