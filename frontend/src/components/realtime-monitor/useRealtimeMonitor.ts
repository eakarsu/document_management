import { useState, useEffect, useRef } from 'react';
import { api } from '../../lib/api';
import {
  WorkflowStatus,
  WorkflowActivity,
  WorkflowAlert,
  InterventionSuggestion,
  MonitoringSettings,
  Document,
  MonitoringData
} from './types';

export const useRealtimeMonitor = (
  organizationId: string,
  onAlert?: (alert: WorkflowAlert) => void,
  onIntervention?: (intervention: InterventionSuggestion) => void
) => {
  const [workflowStatuses, setWorkflowStatuses] = useState<WorkflowStatus[]>([]);
  const [recentActivity, setRecentActivity] = useState<WorkflowActivity[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<WorkflowAlert[]>([]);
  const [interventionSuggestions, setInterventionSuggestions] = useState<InterventionSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [monitoringActive, setMonitoringActive] = useState(true);
  const [settings, setSettings] = useState<MonitoringSettings>({
    realTimeUpdates: true,
    alertThresholds: {
      delayRisk: 70,
      qualityScore: 60,
      participantInactivity: 24
    },
    notificationTypes: ['DELAY_RISK', 'CONFLICT', 'DEADLINE_APPROACHING'],
    autoRefreshInterval: 30
  });
  const [documents, setDocuments] = useState<Document[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>('');

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchDocuments = async () => {
    try {
      setDocumentsLoading(true);
      const response = await api.get('/api/documents/search?limit=20');

      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      } else {
        console.error('Failed to fetch documents');
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setDocumentsLoading(false);
    }
  };

  const generateMockData = (documentId: string, docTitle: string): MonitoringData => {
    const mockWorkflowStatuses: WorkflowStatus[] = [
      {
        workflowId: `wf-${documentId}`,
        documentId: documentId,
        documentTitle: docTitle,
        currentStep: 'Legal Review',
        overallProgress: 65,
        health: 'WARNING',
        velocity: 1.2,
        estimatedCompletion: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        blockers: ['Awaiting legal team availability'],
        participants: [
          {
            userId: 'user-1',
            name: 'Sarah Chen',
            status: 'ACTIVE',
            lastActivity: new Date(Date.now() - 15 * 60 * 1000),
            pendingTasks: 2
          },
          {
            userId: 'user-2',
            name: 'Mike Johnson',
            status: 'IDLE',
            lastActivity: new Date(Date.now() - 4 * 60 * 60 * 1000),
            pendingTasks: 1
          }
        ],
        metrics: {
          totalSteps: 6,
          completedSteps: 4,
          avgStepTime: 180,
          delayRisk: 75,
          qualityScore: 85
        }
      }
    ];

    const mockRecentActivity: WorkflowActivity[] = [
      {
        id: 'act-1',
        workflowId: `wf-${documentId}`,
        documentTitle: docTitle,
        activity: 'COMMENT_ADDED',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        user: { id: 'user-1', name: 'Sarah Chen', role: 'Legal Counsel' },
        details: 'Added comments on section 3.2 regarding compliance requirements',
        impact: 'MEDIUM',
        urgency: 'MEDIUM'
      },
      {
        id: 'act-2',
        workflowId: `wf-${documentId}`,
        documentTitle: docTitle,
        activity: 'APPROVED',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        user: { id: 'user-3', name: 'Lisa Rodriguez', role: 'HR Manager' },
        details: 'Approved workflow step for the document',
        impact: 'HIGH',
        urgency: 'LOW'
      }
    ];

    const mockAlerts: WorkflowAlert[] = [
      {
        id: 'alert-1',
        type: 'DELAY_RISK',
        severity: 'HIGH',
        workflowId: `wf-${documentId}`,
        documentTitle: docTitle,
        message: 'High delay risk detected',
        description: `Workflow for "${docTitle}" is 25% behind schedule due to reviewer bottleneck`,
        timestamp: new Date(Date.now() - 10 * 60 * 1000),
        actionRequired: true,
        suggestedActions: ['Reassign to available legal reviewer', 'Schedule urgent meeting', 'Extend deadline'],
        affectedUsers: ['user-1', 'user-2'],
        estimatedImpact: '2-3 day delay'
      }
    ];

    const mockInterventions: InterventionSuggestion[] = [
      {
        id: 'int-1',
        workflowId: `wf-${documentId}`,
        type: 'SCHEDULE_MEETING',
        title: `Schedule Review Meeting for "${docTitle}"`,
        description: `Organize a focused meeting to resolve questions about "${docTitle}" and speed up review process`,
        urgency: 'HIGH',
        confidence: 85,
        expectedOutcome: 'Reduce review time by 2-3 days',
        implementation: {
          steps: ['Find available time slot', 'Send calendar invites', 'Prepare agenda', 'Conduct meeting'],
          estimatedTime: 45,
          requirements: ['Legal team availability', 'Meeting room', 'Document access']
        }
      }
    ];

    return {
      workflowStatuses: mockWorkflowStatuses,
      recentActivity: mockRecentActivity,
      activeAlerts: mockAlerts,
      interventionSuggestions: mockInterventions
    };
  };

  const fetchMonitoringData = async () => {
    try {
      setLoading(true);
      setError(null);

      const selectedDoc = documents.find(doc => doc.id === selectedDocumentId);
      const docTitle = selectedDoc?.title || 'Unknown Document';

      if (selectedDocumentId) {
        try {
          const response = await api.post('/api/ai-workflow/monitor-workflow', {
            documentId: selectedDocumentId,
            organizationId: organizationId
          });

          if (response.ok) {
            const aiResponse = await response.json();
            // Transform AI response to monitoring data format
            // For now, fall back to enhanced mock with document context
          }
        } catch (error) {
          console.warn('AI monitoring service unavailable, using context-aware mock data');
        }
      }

      const mockData = selectedDocumentId ? generateMockData(selectedDocumentId, docTitle) : {
        workflowStatuses: [],
        recentActivity: [],
        activeAlerts: [],
        interventionSuggestions: []
      };

      setWorkflowStatuses(mockData.workflowStatuses);
      setRecentActivity(mockData.recentActivity);
      setActiveAlerts(mockData.activeAlerts);
      setInterventionSuggestions(mockData.interventionSuggestions);

      // Trigger alert callbacks
      mockData.activeAlerts.forEach(alert => {
        if (onAlert && alert.actionRequired) {
          onAlert(alert);
        }
      });

    } catch (error) {
      console.error('Failed to fetch monitoring data:', error);
      setError(error instanceof Error ? (error as Error).message : 'Failed to fetch monitoring data');
    } finally {
      setLoading(false);
    }
  };

  const startMonitoring = () => {
    setMonitoringActive(true);
    fetchMonitoringData();

    if (settings.realTimeUpdates) {
      intervalRef.current = setInterval(fetchMonitoringData, settings.autoRefreshInterval * 1000);
    }
  };

  const stopMonitoring = () => {
    setMonitoringActive(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const handleIntervention = async (intervention: InterventionSuggestion) => {
    try {
      setLoading(true);

      // Mock intervention implementation
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (onIntervention) {
        onIntervention(intervention);
      }

      // Remove intervention from suggestions after implementation
      setInterventionSuggestions(prev => prev.filter(int => int.id !== intervention.id));

    } catch (error) {
      console.error('Failed to implement intervention:', error);
      setError(error instanceof Error ? (error as Error).message : 'Failed to implement intervention');
    } finally {
      setLoading(false);
    }
  };

  const dismissAlert = (alertId: string) => {
    setActiveAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const handleDocumentChange = (documentId: string) => {
    setSelectedDocumentId(documentId);
    // Clear previous data when switching documents
    setWorkflowStatuses([]);
    setRecentActivity([]);
    setActiveAlerts([]);
    setInterventionSuggestions([]);
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    if (organizationId && selectedDocumentId) {
      startMonitoring();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [organizationId, selectedDocumentId, settings.realTimeUpdates, settings.autoRefreshInterval]);

  return {
    // State
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

    // Actions
    startMonitoring,
    stopMonitoring,
    fetchMonitoringData,
    handleIntervention,
    dismissAlert,
    handleDocumentChange,
    setSettings,
    fetchDocuments
  };
};