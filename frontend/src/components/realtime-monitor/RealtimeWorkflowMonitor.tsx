'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Badge,
  FormControlLabel,
  Switch,
  Tabs,
  Tab,
  Card,
  CardContent
} from '@mui/material';
import {
  Psychology,
  NotificationsActive,
  Settings,
  Refresh,
  Timeline
} from '@mui/icons-material';

import { RealtimeWorkflowMonitorProps } from './types';
import { useRealtimeMonitor } from './useRealtimeMonitor';
import { calculateCriticalAlertsCount, calculateHighAlertsCount } from './utils';
import { DocumentSelector } from './DocumentSelector';
import { WorkflowStatusCard } from './WorkflowStatusCard';
import { ActivityFeed } from './ActivityFeed';
import { AlertsPanel } from './AlertsPanel';
import { InterventionsPanel } from './InterventionsPanel';
import { SettingsDialog } from './SettingsDialog';

const RealtimeWorkflowMonitor: React.FC<RealtimeWorkflowMonitorProps> = ({
  organizationId,
  workflowIds,
  onAlert,
  onIntervention
}) => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [alertDetailOpen, setAlertDetailOpen] = useState(false);

  const {
    workflowStatuses,
    recentActivity,
    activeAlerts,
    interventionSuggestions,
    loading,
    error,
    monitoringActive,
    settings,
    documents,
    documentsLoading,
    selectedDocumentId,
    startMonitoring,
    stopMonitoring,
    fetchMonitoringData,
    handleIntervention,
    dismissAlert,
    handleDocumentChange,
    setSettings
  } = useRealtimeMonitor(organizationId, onAlert, onIntervention);

  const criticalAlertsCount = calculateCriticalAlertsCount(activeAlerts);
  const highAlertsCount = calculateHighAlertsCount(activeAlerts);

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error" action={
            <Button color="inherit" size="small" onClick={fetchMonitoringData}>
              Retry
            </Button>
          }>
            {error}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center' }}>
          <Psychology sx={{ mr: 1, color: 'primary.main' }} />
          Real-time Workflow Monitor
          <Badge badgeContent={criticalAlertsCount + highAlertsCount} color="error" sx={{ ml: 2 }}>
            <NotificationsActive />
          </Badge>
          {loading && <CircularProgress size={30} sx={{ ml: 2 }} />}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <DocumentSelector
            documents={documents}
            selectedDocumentId={selectedDocumentId}
            onDocumentChange={handleDocumentChange}
            loading={documentsLoading}
            size="small"
          />
          <FormControlLabel
            control={
              <Switch
                checked={monitoringActive}
                onChange={(e) => e.target.checked ? startMonitoring() : stopMonitoring()}
                disabled={!selectedDocumentId}
              />
            }
            label="Live Monitoring"
          />
          <Button variant="outlined" size="small" startIcon={<Settings />} onClick={() => setSettingsDialogOpen(true)}>
            Settings
          </Button>
          <Button variant="outlined" size="small" onClick={fetchMonitoringData} startIcon={<Refresh />} disabled={!selectedDocumentId}>
            Refresh
          </Button>
        </Box>
      </Box>

      {!selectedDocumentId && (
        <Card>
          <CardContent>
            <Box sx={{ textAlign: 'center', p: 4 }}>
              <Timeline sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Real-time Workflow Monitor
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 3 }}>
                Select a document to monitor its workflow in real-time
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
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 2 }}>
                  <CircularProgress size={40} sx={{ mr: 2 }} />
                  <Typography variant="body1">Loading documents...</Typography>
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Alert Summary */}
      {selectedDocumentId && activeAlerts.length > 0 && (
        <Alert
          severity={criticalAlertsCount > 0 ? 'error' : 'warning'}
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={() => setSelectedTab(2)}>
              View All
            </Button>
          }
        >
          <Typography variant="subtitle2">
            {criticalAlertsCount > 0 && `${criticalAlertsCount} critical alert${criticalAlertsCount > 1 ? 's' : ''}`}
            {criticalAlertsCount > 0 && highAlertsCount > 0 && ', '}
            {highAlertsCount > 0 && `${highAlertsCount} high priority alert${highAlertsCount > 1 ? 's' : ''}`}
            {' '}require immediate attention
          </Typography>
        </Alert>
      )}

      {/* Main Content Tabs */}
      {selectedDocumentId && (
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)}>
            <Tab label="Workflow Status" icon={<Timeline />} />
            <Tab label="Live Activity" icon={<NotificationsActive />} />
            <Tab label={`Alerts (${activeAlerts.length})`} icon={<Settings />} />
            <Tab label={`Interventions (${interventionSuggestions.length})`} icon={<Psychology />} />
          </Tabs>
        </Box>
      )}

      {/* Loading Overlay */}
      {loading && selectedDocumentId && (
        <Box sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 400,
          flexDirection: 'column'
        }}>
          <CircularProgress size={60} thickness={4} />
          <Typography variant="h6" sx={{ mt: 3 }}>Analyzing Workflow...</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Please wait while we fetch real-time data</Typography>
        </Box>
      )}

      {/* Workflow Status Tab */}
      {!loading && selectedDocumentId && selectedTab === 0 && (
        <Grid container spacing={3}>
          {workflowStatuses.map((workflow) => (
            <Grid item xs={12} lg={6} key={workflow.workflowId}>
              <WorkflowStatusCard workflow={workflow} />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Live Activity Tab */}
      {!loading && selectedDocumentId && selectedTab === 1 && (
        <ActivityFeed activities={recentActivity} />
      )}

      {/* Alerts Tab */}
      {!loading && selectedDocumentId && selectedTab === 2 && (
        <AlertsPanel
          alerts={activeAlerts}
          onDismissAlert={dismissAlert}
          selectedAlert={selectedAlert}
          onSelectAlert={setSelectedAlert}
          alertDetailOpen={alertDetailOpen}
          onToggleAlertDetail={setAlertDetailOpen}
        />
      )}

      {/* Interventions Tab */}
      {!loading && selectedDocumentId && selectedTab === 3 && (
        <InterventionsPanel
          interventions={interventionSuggestions}
          onImplementIntervention={handleIntervention}
          loading={loading}
        />
      )}

      {/* Settings Dialog */}
      <SettingsDialog
        open={settingsDialogOpen}
        onClose={() => setSettingsDialogOpen(false)}
        settings={settings}
        onUpdateSettings={setSettings}
      />
    </Box>
  );
};

export default RealtimeWorkflowMonitor;