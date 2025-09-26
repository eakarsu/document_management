import { useState, useEffect, useRef } from 'react';
import { api } from '../../lib/api';
import {
  WorkflowStatus,
  WorkflowActivity,
  WorkflowAlert,
  InterventionSuggestion,
  MonitoringSettings,
  Document
} from '../../types/workflow-monitor';

interface UseWorkflowMonitoringProps {
  organizationId: string;
  selectedDocumentId: string;
  settings: MonitoringSettings;
  onAlert?: (alert: WorkflowAlert) => void;
  onIntervention?: (intervention: InterventionSuggestion) => void;
}

export const useWorkflowMonitoring = ({
  organizationId,
  selectedDocumentId,
  settings,
  onAlert,
  onIntervention
}: UseWorkflowMonitoringProps) => {
  const [workflowStatuses, setWorkflowStatuses] = useState<WorkflowStatus[]>([]);
  const [recentActivity, setRecentActivity] = useState<WorkflowActivity[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<WorkflowAlert[]>([]);
  const [interventionSuggestions, setInterventionSuggestions] = useState<InterventionSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [monitoringActive, setMonitoringActive] = useState(true);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);

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

  const fetchMonitoringData = async () => {
    try {
      setLoading(true);
      setError(null);

      const selectedDoc = documents.find(doc => doc.id === selectedDocumentId);
      const docTitle = selectedDoc?.title || 'Unknown Document';

      // Try to call the AI service for document-specific monitoring
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

      // Enhanced mock data with document context
      const mockWorkflowStatuses: WorkflowStatus[] = selectedDocumentId ? [
        {
          workflowId: `wf-${selectedDocumentId}`,
          documentId: selectedDocumentId,
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
        },
        {
          workflowId: 'wf-2',
          documentId: 'doc-2',
          documentTitle: 'Employee Handbook Revision',
          currentStep: 'HR Approval',
          overallProgress: 80,
          health: 'HEALTHY',
          velocity: 2.1,
          estimatedCompletion: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
          blockers: [],
          participants: [
            {
              userId: 'user-3',
              name: 'Lisa Rodriguez',
              status: 'ACTIVE',
              lastActivity: new Date(Date.now() - 5 * 60 * 1000),
              pendingTasks: 1
            }
          ],
          metrics: {
            totalSteps: 5,
            completedSteps: 4,
            avgStepTime: 120,
            delayRisk: 20,
            qualityScore: 92
          }
        },
        {
          workflowId: 'wf-3',
          documentId: 'doc-3',
          documentTitle: 'IT Security Guidelines',
          currentStep: 'Security Team Review',
          overallProgress: 45,
          health: 'CRITICAL',
          velocity: 0.8,
          estimatedCompletion: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          blockers: ['Security team overloaded', 'Technical requirements unclear'],
          participants: [
            {
              userId: 'user-4',
              name: 'David Kim',
              status: 'OFFLINE',
              lastActivity: new Date(Date.now() - 25 * 60 * 60 * 1000),
              pendingTasks: 3
            },
            {
              userId: 'user-5',
              name: 'Anna Smith',
              status: 'ACTIVE',
              lastActivity: new Date(Date.now() - 30 * 60 * 1000),
              pendingTasks: 1
            }
          ],
          metrics: {
            totalSteps: 7,
            completedSteps: 3,
            avgStepTime: 240,
            delayRisk: 90,
            qualityScore: 70
          }
        }
      ] : [];

      const mockRecentActivity: WorkflowActivity[] = selectedDocumentId ? [
        {
          id: 'act-1',
          workflowId: `wf-${selectedDocumentId}`,
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
          workflowId: `wf-${selectedDocumentId}`,
          documentTitle: docTitle,
          activity: 'APPROVED',
          timestamp: new Date(Date.now() - 15 * 60 * 1000),
          user: { id: 'user-3', name: 'Lisa Rodriguez', role: 'HR Manager' },
          details: 'Approved workflow step for the document',
          impact: 'HIGH',
          urgency: 'LOW'
        },
        {
          id: 'act-3',
          workflowId: `wf-${selectedDocumentId}`,
          documentTitle: docTitle,
          activity: 'ESCALATED',
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          user: { id: 'user-5', name: 'Anna Smith', role: 'Reviewer' },
          details: 'Escalated to team lead due to complexity in the document',
          impact: 'HIGH',
          urgency: 'HIGH'
        }
      ] : [];

      const mockAlerts: WorkflowAlert[] = selectedDocumentId ? [
        {
          id: 'alert-1',
          type: 'DELAY_RISK',
          severity: 'HIGH',
          workflowId: `wf-${selectedDocumentId}`,
          documentTitle: docTitle,
          message: 'High delay risk detected',
          description: `Workflow for "${docTitle}" is 25% behind schedule due to reviewer bottleneck`,
          timestamp: new Date(Date.now() - 10 * 60 * 1000),
          actionRequired: true,
          suggestedActions: ['Reassign to available legal reviewer', 'Schedule urgent meeting', 'Extend deadline'],
          affectedUsers: ['user-1', 'user-2'],
          estimatedImpact: '2-3 day delay'
        },
        {
          id: 'alert-2',
          type: 'PARTICIPANT_UNAVAILABLE',
          severity: 'CRITICAL',
          workflowId: `wf-${selectedDocumentId}`,
          documentTitle: docTitle,
          message: 'Key participant unavailable',
          description: `Key reviewer for "${docTitle}" has been offline for 25+ hours with pending critical tasks`,
          timestamp: new Date(Date.now() - 20 * 60 * 1000),
          actionRequired: true,
          suggestedActions: ['Reassign tasks to backup reviewer', 'Contact participant directly', 'Escalate to manager'],
          affectedUsers: ['user-4'],
          estimatedImpact: 'Potential 5+ day delay'
        }
      ] : [];

      const mockInterventions: InterventionSuggestion[] = selectedDocumentId ? [
        {
          id: 'int-1',
          workflowId: `wf-${selectedDocumentId}`,
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
        },
        {
          id: 'int-2',
          workflowId: `wf-${selectedDocumentId}`,
          type: 'REASSIGN',
          title: `Reassign Tasks for "${docTitle}"`,
          description: `Redistribute pending tasks for "${docTitle}" to available team members`,
          urgency: 'HIGH',
          confidence: 90,
          expectedOutcome: 'Resume workflow progress within 4 hours',
          implementation: {
            steps: ['Identify available reviewers', 'Transfer task ownership', 'Update assignments', 'Notify participants'],
            estimatedTime: 30,
            requirements: ['Manager approval', 'Available backup reviewers']
          }
        }
      ] : [];

      setWorkflowStatuses(mockWorkflowStatuses);
      setRecentActivity(mockRecentActivity);
      setActiveAlerts(mockAlerts);
      setInterventionSuggestions(mockInterventions);

      // Trigger alert callbacks
      mockAlerts.forEach(alert => {
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

  const clearData = () => {
    setWorkflowStatuses([]);
    setRecentActivity([]);
    setActiveAlerts([]);
    setInterventionSuggestions([]);
  };

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    workflowStatuses,
    recentActivity,
    activeAlerts,
    interventionSuggestions,
    loading,
    error,
    monitoringActive,
    documents,
    documentsLoading,
    fetchDocuments,
    fetchMonitoringData,
    startMonitoring,
    stopMonitoring,
    handleIntervention,
    dismissAlert,
    clearData,
    setMonitoringActive
  };
};