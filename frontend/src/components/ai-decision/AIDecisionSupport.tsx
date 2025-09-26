'use client';

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material';
import {
  Psychology,
  Gavel,
  Analytics,
  Refresh,
  EmojiObjects
} from '@mui/icons-material';

import { AIDecisionSupportProps } from './types';
import { useAIDecision } from './useAIDecision';
import { calculateWeightedScore, getUrgencyColor } from './utils';
import { DocumentSelector } from './DocumentSelector';
import { DecisionFactorsPanel } from './DecisionFactorsPanel';
import { DecisionOptionCard } from './DecisionOptionCard';
import { DecisionConfirmDialog } from './DecisionConfirmDialog';

const AIDecisionSupport: React.FC<AIDecisionSupportProps> = ({
  documentId,
  workflowId,
  publishingId,
  organizationId,
  currentStep,
  onDecisionMade
}) => {
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const {
    analysis,
    loading,
    error,
    selectedOption,
    decisionRationale,
    decisionConditions,
    documents,
    documentsLoading,
    selectedDocumentId,
    analyzeDecision,
    makeDecision,
    handleDocumentChange,
    setSelectedOption,
    setDecisionRationale,
    setDecisionConditions
  } = useAIDecision(organizationId, documentId, onDecisionMade);

  const handleMakeDecision = async () => {
    await makeDecision();
    setConfirmDialogOpen(false);
  };

  if (loading && !analysis) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4 }}>
            <CircularProgress sx={{ mr: 2 }} />
            <Typography>Analyzing decision factors with AI...</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error" action={
            <Button color="inherit" size="small" onClick={analyzeDecision}>
              Retry
            </Button>
          }>
            {error}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!selectedDocumentId) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <Gavel sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              AI Decision Support
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Select a document to get AI-powered decision analysis and recommendations
            </Typography>

            <Box sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
              <DocumentSelector
                documents={documents}
                selectedDocumentId={selectedDocumentId}
                onDocumentChange={handleDocumentChange}
                loading={documentsLoading}
                showDetails={true}
                minWidth={300}
              />
            </Box>

            {documentsLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                <Typography variant="caption">Loading documents...</Typography>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <Gavel sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              AI Decision Support
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Get AI-powered analysis and recommendations for complex decisions
            </Typography>
            <Button variant="contained" onClick={analyzeDecision} startIcon={<Analytics />}>
              Analyze Decision
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  }

  const sortedOptions = [...analysis.options].sort((a, b) =>
    calculateWeightedScore(b) - calculateWeightedScore(a)
  );

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center' }}>
          <Psychology sx={{ mr: 1, color: 'primary.main' }} />
          AI Decision Support
          {loading && <CircularProgress size={20} sx={{ ml: 2 }} />}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <DocumentSelector
            documents={documents}
            selectedDocumentId={selectedDocumentId}
            onDocumentChange={handleDocumentChange}
            loading={documentsLoading}
            size="small"
          />
          <Button variant="outlined" size="small" onClick={analyzeDecision} startIcon={<Refresh />} disabled={!selectedDocumentId}>
            Re-analyze
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={() => setConfirmDialogOpen(true)}
            disabled={!selectedOption}
            startIcon={<Gavel />}
          >
            Make Decision
          </Button>
        </Box>
      </Box>

      {/* Context & Urgency */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Decision Context</Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <Typography variant="caption" color="text.secondary">Document Type</Typography>
              <Typography variant="body2">{analysis.context.documentType}</Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="caption" color="text.secondary">Urgency</Typography>
              <Chip
                label={analysis.context.urgency}
                size="small"
                color={getUrgencyColor(analysis.context.urgency) as any}
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="caption" color="text.secondary">Business Impact</Typography>
              <Typography variant="body2">{analysis.context.businessImpact}</Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="caption" color="text.secondary">Time to Decision</Typography>
              <Typography variant="body2" color="warning.main">
                {analysis.predictiveInsights.timeToDecision} hours
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Decision Factors */}
        <Grid item xs={12} lg={4}>
          <DecisionFactorsPanel factors={analysis.factors} />
        </Grid>

        {/* Decision Options */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <Analytics sx={{ mr: 1 }} />
                Decision Options
              </Typography>

              {/* AI Recommendation */}
              {analysis.recommendation && (
                <Alert
                  severity="info"
                  sx={{ mb: 3 }}
                  icon={<EmojiObjects />}
                >
                  <Typography variant="subtitle2" gutterBottom>AI Recommendation</Typography>
                  <Typography variant="body2">
                    {analysis.recommendation.reasoning}
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Chip
                      label={`${analysis.recommendation.confidence}% confidence`}
                      size="small"
                      color="info"
                    />
                  </Box>
                </Alert>
              )}

              {sortedOptions.map((option) => (
                <DecisionOptionCard
                  key={option.id}
                  option={option}
                  isSelected={selectedOption === option.id}
                  isRecommended={analysis.recommendation.optionId === option.id}
                  onSelect={() => setSelectedOption(option.id)}
                />
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Decision Confirmation Dialog */}
      <DecisionConfirmDialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        selectedOption={analysis.options.find(opt => opt.id === selectedOption) || null}
        decisionRationale={decisionRationale}
        onRationaleChange={setDecisionRationale}
        decisionConditions={decisionConditions}
        onConditionsChange={setDecisionConditions}
        onConfirm={handleMakeDecision}
        loading={loading}
      />
    </Box>
  );
};

export default AIDecisionSupport;