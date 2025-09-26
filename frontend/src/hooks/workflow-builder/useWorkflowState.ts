import { useState, useCallback } from 'react';
import { Node, Edge, useNodesState, useEdgesState } from 'reactflow';
import { WorkflowSettings, NotificationState } from '@/types/workflow-builder';

export const useWorkflowState = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [workflowName, setWorkflowName] = useState('Professional Workflow');
  const [workflowDescription, setWorkflowDescription] = useState('');

  // UI State
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [propertiesOpen, setPropertiesOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  // Settings
  const [settings, setSettings] = useState<WorkflowSettings>({
    connectionMode: 'loose',
    edgeType: 'smart',
    gridSize: 15,
    snapToGrid: true
  });

  // Notifications
  const [notification, setNotification] = useState<NotificationState>({
    showSuccess: false,
    successMessage: ''
  });

  const showSuccessMessage = useCallback((message: string) => {
    setNotification({
      showSuccess: true,
      successMessage: message
    });
  }, []);

  const hideSuccessMessage = useCallback(() => {
    setNotification({
      showSuccess: false,
      successMessage: ''
    });
  }, []);

  const updateSettings = useCallback((newSettings: Partial<WorkflowSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const toggleCategory = useCallback((category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  }, []);

  return {
    // Workflow State
    nodes,
    setNodes,
    onNodesChange,
    edges,
    setEdges,
    onEdgesChange,
    selectedNode,
    setSelectedNode,
    selectedEdge,
    setSelectedEdge,
    workflowName,
    setWorkflowName,
    workflowDescription,
    setWorkflowDescription,

    // UI State
    drawerOpen,
    setDrawerOpen,
    propertiesOpen,
    setPropertiesOpen,
    tabValue,
    setTabValue,
    expandedCategories,
    toggleCategory,

    // Settings
    settings,
    updateSettings,

    // Notifications
    notification,
    showSuccessMessage,
    hideSuccessMessage
  };
};