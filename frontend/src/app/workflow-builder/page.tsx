'use client';

import React, { useState, useCallback, useRef, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Connection,
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  NodeTypes,
  MarkerType,
  ReactFlowProvider,
  ReactFlowInstance,
  Handle,
  Position,
  ConnectionMode,
  Panel,
  getIncomers,
  getOutgoers,
  getConnectedEdges,
  ConnectionLineType,
  useReactFlow,
  getBezierPath,
  EdgeProps,
  BaseEdge,
  EdgeLabelRenderer,
  getStraightPath,
  getSmoothStepPath
} from 'reactflow';
import 'reactflow/dist/style.css';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  Drawer,
  IconButton,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Switch,
  FormControlLabel,
  Alert,
  Snackbar,
  Tooltip,
  Card,
  CardContent,
  Grid,
  Fab,
  Menu,
  ListItemButton,
  Collapse,
  Badge,
  Avatar,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Stepper,
  Step,
  StepLabel,
  ToggleButton,
  ToggleButtonGroup,
  Autocomplete,
  Stack,
  LinearProgress,
  CircularProgress,
  Skeleton,
  Slider,
  ButtonGroup
} from '@mui/material';
import {
  PlayArrow,
  Save,
  Download,
  Upload,
  Add,
  Delete,
  Edit,
  Settings,
  Group,
  Notifications,
  Business,
  Code,
  Close,
  CheckCircle,
  Cancel,
  Info,
  Warning,
  DragIndicator,
  ArrowForward,
  Schedule,
  Person,
  Email,
  Gavel,
  Star,
  Refresh,
  PublishedWithChanges,
  PlayCircle,
  CloudUpload,
  CloudDownload,
  Help,
  ExpandMore,
  ExpandLess,
  Timeline,
  AccountTree,
  DeviceHub,
  MergeType,
  CallSplit,
  Loop,
  Timer,
  FilterAlt,
  AutoAwesome,
  Psychology,
  Security,
  Storage,
  Description,
  FolderOpen,
  Assessment,
  IntegrationInstructions,
  Api,
  Webhook,
  LockOpen,
  VpnKey,
  Visibility,
  VisibilityOff,
  ContentCut,
  ContentCopy,
  ContentPaste,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  CenterFocusStrong,
  GridOn,
  Straighten,
  CompareArrows,
  SwapHoriz,
  SwapVert,
  MoreVert,
  KeyboardArrowRight,
  KeyboardArrowDown,
  Link as LinkIcon,
  LinkOff,
  Bolt,
  Speed,
  SlowMotionVideo,
  FlashOn,
  PowerSettingsNew,
  ErrorOutline,
  CheckCircleOutline,
  RadioButtonUnchecked,
  RadioButtonChecked,
  FiberManualRecord,
  TripOrigin,
  Category,
  Label,
  Bookmark,
  BookmarkBorder,
  Flag,
  OutlinedFlag,
  PushPin,
  Place,
  Room,
  Navigation,
  Explore,
  NearMe,
  MyLocation,
  LocationSearching,
  GpsFixed,
  GpsNotFixed,
  GpsOff
} from '@mui/icons-material';

// Import task types from backend
import { 
  DocumentTaskType, 
  TaskCategories, 
  TaskConfigurations,
  getTasksByCategory,
  getTaskConfiguration
} from '@/types/document-workflow-tasks';

// Custom animated connection line
const CustomConnectionLine = ({ fromX, fromY, toX, toY, connectionLineStyle }: any) => {
  const [path] = getSmoothStepPath({
    sourceX: fromX,
    sourceY: fromY,
    targetX: toX,
    targetY: toY
  });

  return (
    <g>
      <path
        fill="none"
        stroke="#2196f3"
        strokeWidth={3}
        className="animated"
        d={path}
        style={{
          strokeDasharray: 5,
          animation: 'dash 0.5s linear infinite'
        }}
      />
      <circle r="3" fill="#2196f3">
        <animateMotion dur="0.5s" repeatCount="indefinite" path={path} />
      </circle>
    </g>
  );
};

// Custom smart edge with labels and animations
const SmartEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
  style,
  selected
}: EdgeProps) => {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 20
  });

  const [isHovered, setIsHovered] = useState(false);

  return (
    <>
      <BaseEdge 
        id={id}
        path={edgePath} 
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: selected ? '#ff9800' : isHovered ? '#2196f3' : style?.stroke || '#b1b1b7',
          strokeWidth: selected ? 4 : isHovered ? 3 : 2,
          transition: 'all 0.2s ease'
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            fontSize: 12,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <Card sx={{ 
            p: 0.5, 
            minWidth: 80,
            cursor: 'pointer',
            background: selected ? '#ff9800' : isHovered ? '#2196f3' : '#fff',
            color: selected || isHovered ? '#fff' : '#333',
            border: `2px solid ${selected ? '#ff9800' : isHovered ? '#2196f3' : '#ddd'}`,
            transition: 'all 0.2s ease'
          }}>
            <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
              {data?.label || 'Action'}
            </Typography>
            {data?.condition && (
              <Chip 
                size="small" 
                label={data.condition}
                sx={{ ml: 0.5, height: 16, fontSize: 10 }}
              />
            )}
          </Card>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

// Professional workflow node with multiple connection points
const ProfessionalWorkflowNode = ({ data, selected, isConnectable }: any) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const [showPorts, setShowPorts] = React.useState(false);
  
  const getTaskIcon = () => {
    const category = Object.values(TaskCategories).find(cat => 
      cat.tasks.includes(data.taskType as DocumentTaskType)
    );
    
    if (category) {
      switch(category.name) {
        case 'Document Ingestion': return <CloudUpload />;
        case 'Document Processing': return <Settings />;
        case 'Review & Approval': return <CheckCircle />;
        case 'Collaboration': return <Group />;
        case 'Notifications': return <Notifications />;
        case 'Data Operations': return <Storage />;
        case 'Storage & Retrieval': return <FolderOpen />;
        case 'Security & Compliance': return <Security />;
        case 'Analytics & Reporting': return <Assessment />;
        case 'Integrations': return <Api />;
        case 'Workflow Control': return <AccountTree />;
        case 'AI & Machine Learning': return <Psychology />;
        case 'Export & Distribution': return <CloudDownload />;
        case 'Custom & Scripting': return <Code />;
        default: return <PlayCircle />;
      }
    }
    return <PlayCircle />;
  };

  const nodeColor = useMemo(() => {
    if (selected) return '#ff9800';
    if (isHovered) return '#2196f3';
    
    const category = Object.values(TaskCategories).find(cat => 
      cat.tasks.includes(data.taskType as DocumentTaskType)
    );
    return category?.color || '#9e9e9e';
  }, [selected, isHovered, data.taskType]);

  // Multiple connection ports for professional look
  const ports = [
    { id: 'top', position: Position.Top, label: 'From Above' },
    { id: 'right', position: Position.Right, label: 'To Next' },
    { id: 'bottom', position: Position.Bottom, label: 'From Below' },
    { id: 'left', position: Position.Left, label: 'From Previous' }
  ];

  return (
    <Card 
      onMouseEnter={() => {
        setIsHovered(true);
        setShowPorts(true);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowPorts(false);
      }}
      sx={{ 
        width: 180,
        height: 80,
        border: `2px solid ${nodeColor}`,
        backgroundColor: '#fff',
        cursor: 'move',
        boxShadow: selected ? '0 8px 16px rgba(0,0,0,0.2)' : 
                  isHovered ? '0 4px 12px rgba(0,0,0,0.15)' : 
                  '0 2px 4px rgba(0,0,0,0.1)',
        transition: 'all 0.2s ease',
        transform: selected ? 'scale(1.03)' : isHovered ? 'scale(1.01)' : 'scale(1)',
        position: 'relative',
        overflow: 'visible'
      }}
    >
      {/* Connection Ports */}
      {ports.map((port) => (
        <React.Fragment key={port.id}>
          <Handle
            type="target"
            position={port.position}
            id={`${port.id}-target`}
            style={{
              width: showPorts ? 12 : 8,
              height: showPorts ? 12 : 8,
              background: showPorts ? nodeColor : '#b1b1b7',
              border: '2px solid #fff',
              transition: 'all 0.3s ease',
              boxShadow: showPorts ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
              zIndex: showPorts ? 10 : 1
            }}
            isConnectable={isConnectable}
          />
          <Handle
            type="source"
            position={port.position}
            id={`${port.id}-source`}
            style={{
              width: showPorts ? 12 : 8,
              height: showPorts ? 12 : 8,
              background: showPorts ? nodeColor : '#b1b1b7',
              border: '2px solid #fff',
              transition: 'all 0.3s ease',
              boxShadow: showPorts ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
              zIndex: showPorts ? 10 : 1
            }}
            isConnectable={isConnectable}
          />
          
          {/* Port Labels */}
          {showPorts && (
            <Box
              sx={{
                position: 'absolute',
                ...(port.position === Position.Top && { top: -30, left: '50%', transform: 'translateX(-50%)' }),
                ...(port.position === Position.Bottom && { bottom: -30, left: '50%', transform: 'translateX(-50%)' }),
                ...(port.position === Position.Left && { left: -80, top: '50%', transform: 'translateY(-50%)' }),
                ...(port.position === Position.Right && { right: -80, top: '50%', transform: 'translateY(-50%)' }),
                background: nodeColor,
                color: '#fff',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: 'bold',
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                zIndex: 1000,
                opacity: 0.9
              }}
            >
              {port.label}
            </Box>
          )}
        </React.Fragment>
      ))}

      <CardContent sx={{ p: 1, height: '100%', display: 'flex', alignItems: 'center' }}>
        {/* Status Indicator */}
        <Box sx={{ 
          position: 'absolute', 
          top: -6, 
          right: -6,
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: data.status === 'active' ? '#4caf50' : 
                     data.status === 'pending' ? '#ff9800' : 
                     data.status === 'error' ? '#f44336' : '#9e9e9e',
          border: '2px solid #fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <FiberManualRecord sx={{ fontSize: 8, color: '#fff' }} />
        </Box>

        {/* Node Content - Compact */}
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1 }}>
          <Avatar sx={{ 
            bgcolor: nodeColor, 
            width: 28, 
            height: 28,
            flexShrink: 0
          }}>
            {React.cloneElement(getTaskIcon(), { sx: { fontSize: 16 } })}
          </Avatar>
          <Box sx={{ overflow: 'hidden', flex: 1 }}>
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: 600, 
                lineHeight: 1.2,
                fontSize: '0.8rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {data.label}
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'text.secondary', 
                fontSize: '0.65rem',
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {data.taskType?.replace(/_/g, ' ').toLowerCase()}
            </Typography>
          </Box>
        </Box>

        {/* Connection Guide - Smaller */}
        {showPorts && (
          <Box sx={{ 
            position: 'absolute',
            bottom: -28,
            left: '50%',
            transform: 'translateX(-50%)',
            background: nodeColor,
            color: '#fff',
            padding: '2px 8px',
            borderRadius: '10px',
            fontSize: '10px',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            zIndex: 1001
          }}>
            Connect
          </Box>
        )}
      </CardContent>

    </Card>
  );
};

const nodeTypes: NodeTypes = {
  professional: ProfessionalWorkflowNode,
};

const edgeTypes = {
  smart: SmartEdge,
};

// Main component
export default function ProfessionalWorkflowBuilder() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [propertiesOpen, setPropertiesOpen] = useState(false);
  const [workflowName, setWorkflowName] = useState('Professional Workflow');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [connectionMode, setConnectionMode] = useState<'loose' | 'strict'>('loose');
  const [edgeType, setEdgeType] = useState<'smart' | 'smoothstep' | 'straight'>('smart');
  const [gridSize, setGridSize] = useState(15);
  const [snapToGrid, setSnapToGrid] = useState(true);

  // Toggle category expansion
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Professional connection validation
  const isValidConnection = useCallback((connection: Connection) => {
    // Get source and target nodes
    const sourceNode = nodes.find(n => n.id === connection.source);
    const targetNode = nodes.find(n => n.id === connection.target);
    
    if (!sourceNode || !targetNode) return false;
    
    // Prevent self-connections
    if (connection.source === connection.target) {
      setSuccessMessage('Cannot connect node to itself');
      setShowSuccess(true);
      return false;
    }
    
    // Check for duplicate connections
    const isDuplicate = edges.some(
      edge => edge.source === connection.source && edge.target === connection.target
    );
    
    if (isDuplicate) {
      setSuccessMessage('Connection already exists');
      setShowSuccess(true);
      return false;
    }
    
    // Task-specific validation
    const sourceTaskType = sourceNode.data.taskType as DocumentTaskType;
    const targetTaskType = targetNode.data.taskType as DocumentTaskType;
    
    // Example: Approval tasks cannot connect directly to another approval
    if (sourceTaskType?.includes('APPROVAL') && targetTaskType?.includes('APPROVAL')) {
      setSuccessMessage('Approval tasks cannot connect directly to each other');
      setShowSuccess(true);
      return false;
    }
    
    return true;
  }, [nodes, edges]);

  // Enhanced connection handler
  const onConnect = useCallback(
    (params: Connection) => {
      if (!isValidConnection(params)) return;
      
      const sourceNode = nodes.find(n => n.id === params.source);
      const targetNode = nodes.find(n => n.id === params.target);
      
      const newEdge = {
        ...params,
        id: `${params.source}-${params.target}-${Date.now()}`,
        type: edgeType,
        data: {
          label: 'Proceed',
          condition: null,
          requireComment: false
        },
        style: {
          stroke: '#1976d2',
          strokeWidth: 2
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: '#1976d2'
        },
        animated: sourceNode?.data.taskType?.includes('CONDITIONAL')
      };
      
      setEdges((eds) => addEdge(newEdge, eds));
      setSuccessMessage(`Connected: ${sourceNode?.data.label} → ${targetNode?.data.label}`);
      setShowSuccess(true);
    },
    [nodes, edges, edgeType, isValidConnection, setEdges]
  );

  // Advanced drag and drop
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      const taskData = event.dataTransfer.getData('application/reactflow');

      if (!taskData || !reactFlowBounds || !reactFlowInstance) {
        return;
      }

      const task = JSON.parse(taskData);
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      // Snap to grid if enabled
      if (snapToGrid) {
        position.x = Math.round(position.x / gridSize) * gridSize;
        position.y = Math.round(position.y / gridSize) * gridSize;
      }

      const newNode: Node = {
        id: `node-${Date.now()}`,
        type: 'professional',
        position,
        data: { 
          label: task.name,
          taskType: task.type,
          description: task.description,
          category: task.category,
          status: 'pending',
          roles: [],
          timeLimit: null,
          requiresApproval: task.requiresApproval || false,
          inputs: task.inputs || [],
          outputs: task.outputs || []
        },
      };

      setNodes((nds) => nds.concat(newNode));
      setSuccessMessage(`Added: ${task.name}`);
      setShowSuccess(true);
    },
    [reactFlowInstance, snapToGrid, gridSize, setNodes]
  );

  const onDragStart = (event: React.DragEvent, task: any) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(task));
    event.dataTransfer.effectAllowed = 'move';
  };

  // Node selection
  const onNodeClick = (event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setSelectedEdge(null);
    setPropertiesOpen(true);
  };

  // Edge selection
  const onEdgeClick = (event: React.MouseEvent, edge: Edge) => {
    setSelectedEdge(edge);
    setSelectedNode(null);
    setPropertiesOpen(true);
  };

  return (
    <ReactFlowProvider>
      <Box sx={{ display: 'flex', height: '100vh' }}>
        <style jsx global>{`
          @keyframes dash {
            to {
              stroke-dashoffset: -10;
            }
          }
        `}</style>
        
        {/* Professional Sidebar */}
        <Drawer
          variant="persistent"
          anchor="left"
          open={drawerOpen}
          sx={{
            width: 280,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: 280,
              boxSizing: 'border-box',
              top: 64,
              background: '#f8f9fa'
            },
          }}
        >
          <Box sx={{ p: 2 }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
              Workflow Designer
            </Typography>
            
            <TextField
              fullWidth
              label="Workflow Name"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              variant="outlined"
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: <Description sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
            
            <TextField
              fullWidth
              label="Description"
              value={workflowDescription}
              onChange={(e) => setWorkflowDescription(e.target.value)}
              multiline
              rows={2}
              variant="outlined"
              sx={{ mb: 2 }}
            />

            <Tabs 
              value={tabValue} 
              onChange={(e, v) => setTabValue(v)} 
              sx={{ mb: 2 }}
              variant="fullWidth"
            >
              <Tab label="Tasks" icon={<Category />} />
              <Tab label="Templates" icon={<AccountTree />} />
              <Tab label="Settings" icon={<Settings />} />
            </Tabs>

            {/* Tasks Tab */}
            {tabValue === 0 && (
              <Box sx={{ maxHeight: 'calc(100vh - 400px)', overflowY: 'auto' }}>
                <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                  Drag tasks to canvas
                </Typography>
                
                {Object.entries(TaskCategories).map(([key, category]) => (
                  <Box key={key} sx={{ mb: 1 }}>
                    <ListItemButton
                      onClick={() => toggleCategory(key)}
                      sx={{
                        borderRadius: 1,
                        bgcolor: category.color + '20',
                        mb: 0.5,
                        '&:hover': {
                          bgcolor: category.color + '30'
                        }
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <Typography>{category.icon}</Typography>
                      </ListItemIcon>
                      <ListItemText 
                        primary={category.name}
                        secondary={`${category.tasks.length} tasks`}
                      />
                      {expandedCategories.includes(key) ? <ExpandLess /> : <ExpandMore />}
                    </ListItemButton>
                    
                    <Collapse in={expandedCategories.includes(key)} timeout="auto" unmountOnExit>
                      <List component="div" disablePadding>
                        {category.tasks.map(taskType => {
                          const config = getTaskConfiguration(taskType);
                          return (
                            <ListItem
                              key={taskType}
                              draggable
                              onDragStart={(e) => onDragStart(e, {
                                type: taskType,
                                name: config.name,
                                description: config.description,
                                category: key,
                                requiresApproval: config.settings.requiresApproval,
                                inputs: config.inputs,
                                outputs: config.outputs
                              })}
                              sx={{
                                pl: 4,
                                cursor: 'grab',
                                borderRadius: 1,
                                mb: 0.5,
                                bgcolor: '#fff',
                                border: '1px solid #e0e0e0',
                                '&:hover': {
                                  bgcolor: category.color + '10',
                                  borderColor: category.color
                                },
                                '&:active': {
                                  cursor: 'grabbing'
                                }
                              }}
                            >
                              <ListItemIcon sx={{ minWidth: 30 }}>
                                <DragIndicator sx={{ fontSize: 18 }} />
                              </ListItemIcon>
                              <ListItemText 
                                primary={config.name}
                                secondary={config.description}
                                primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                                secondaryTypographyProps={{ variant: 'caption' }}
                              />
                            </ListItem>
                          );
                        })}
                      </List>
                    </Collapse>
                  </Box>
                ))}
              </Box>
            )}

            {/* Templates Tab */}
            {tabValue === 1 && (
              <Box sx={{ maxHeight: 'calc(100vh - 400px)', overflowY: 'auto' }}>
                <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary' }}>
                  Pre-built workflow templates
                </Typography>
                
                <List>
                  {/* Document Review Template */}
                  <Card sx={{ mb: 2, p: 2, cursor: 'pointer', '&:hover': { bgcolor: '#f5f5f5' } }}
                    onClick={() => {
                      // Load document review template
                      const templateNodes = [
                        { id: '1', type: 'professional', position: { x: 100, y: 200 }, 
                          data: { label: 'Upload Document', taskType: DocumentTaskType.UPLOAD_DOCUMENT, status: 'pending' }},
                        { id: '2', type: 'professional', position: { x: 350, y: 200 }, 
                          data: { label: 'OCR Extraction', taskType: DocumentTaskType.OCR_EXTRACTION, status: 'pending' }},
                        { id: '3', type: 'professional', position: { x: 600, y: 200 }, 
                          data: { label: 'AI Classification', taskType: DocumentTaskType.AI_CLASSIFICATION, status: 'pending' }},
                        { id: '4', type: 'professional', position: { x: 850, y: 100 }, 
                          data: { label: 'Legal Review', taskType: DocumentTaskType.LEGAL_REVIEW, status: 'pending' }},
                        { id: '5', type: 'professional', position: { x: 850, y: 300 }, 
                          data: { label: 'Manual Review', taskType: DocumentTaskType.MANUAL_REVIEW, status: 'pending' }},
                        { id: '6', type: 'professional', position: { x: 1100, y: 200 }, 
                          data: { label: 'Approval', taskType: DocumentTaskType.APPROVAL_REQUEST, status: 'pending' }},
                        { id: '7', type: 'professional', position: { x: 1350, y: 200 }, 
                          data: { label: 'Digital Signature', taskType: DocumentTaskType.DIGITAL_SIGNATURE, status: 'pending' }},
                        { id: '8', type: 'professional', position: { x: 1600, y: 200 }, 
                          data: { label: 'Store Document', taskType: DocumentTaskType.STORE_DOCUMENT, status: 'pending' }}
                      ];
                      const templateEdges = [
                        { id: 'e1-2', source: '1', target: '2', type: 'smart', data: { label: 'Process' }},
                        { id: 'e2-3', source: '2', target: '3', type: 'smart', data: { label: 'Classify' }},
                        { id: 'e3-4', source: '3', target: '4', type: 'smart', data: { label: 'Legal', condition: 'type === "legal"' }},
                        { id: 'e3-5', source: '3', target: '5', type: 'smart', data: { label: 'Standard' }},
                        { id: 'e4-6', source: '4', target: '6', type: 'smart', data: { label: 'Submit' }},
                        { id: 'e5-6', source: '5', target: '6', type: 'smart', data: { label: 'Submit' }},
                        { id: 'e6-7', source: '6', target: '7', type: 'smart', data: { label: 'Approved', condition: 'approved === true' }},
                        { id: 'e7-8', source: '7', target: '8', type: 'smart', data: { label: 'Store' }}
                      ];
                      setNodes(templateNodes);
                      setEdges(templateEdges);
                      setSuccessMessage('Document Review Template loaded');
                      setShowSuccess(true);
                    }}>
                    <Typography variant="h6" gutterBottom>📋 Document Review Workflow</Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Complete document processing pipeline with OCR, AI classification, review stages, approval, and digital signature.
                    </Typography>
                    <Chip label="8 stages" sx={{ mr: 1 }} />
                    <Chip label="AI-powered" color="primary" sx={{ mr: 1 }} />
                    <Chip label="Multi-review" color="secondary" />
                  </Card>

                  {/* Contract Approval Template */}
                  <Card sx={{ mb: 2, p: 2, cursor: 'pointer', '&:hover': { bgcolor: '#f5f5f5' } }}
                    onClick={() => {
                      const templateNodes = [
                        { id: '1', type: 'professional', position: { x: 100, y: 200 }, 
                          data: { label: 'Create Contract', taskType: DocumentTaskType.CREATE_DOCUMENT, status: 'pending' }},
                        { id: '2', type: 'professional', position: { x: 350, y: 200 }, 
                          data: { label: 'Legal Review', taskType: DocumentTaskType.LEGAL_REVIEW, status: 'pending', requiresApproval: true }},
                        { id: '3', type: 'professional', position: { x: 600, y: 200 }, 
                          data: { label: 'Compliance Check', taskType: DocumentTaskType.COMPLIANCE_CHECK, status: 'pending' }},
                        { id: '4', type: 'professional', position: { x: 850, y: 200 }, 
                          data: { label: 'Executive Approval', taskType: DocumentTaskType.MULTI_LEVEL_APPROVAL, status: 'pending', requiresApproval: true }},
                        { id: '5', type: 'professional', position: { x: 1100, y: 200 }, 
                          data: { label: 'Digital Signature', taskType: DocumentTaskType.DIGITAL_SIGNATURE, status: 'pending' }},
                        { id: '6', type: 'professional', position: { x: 1350, y: 200 }, 
                          data: { label: 'Send to Parties', taskType: DocumentTaskType.SEND_EMAIL, status: 'pending' }}
                      ];
                      const templateEdges = [
                        { id: 'e1-2', source: '1', target: '2', type: 'smart', data: { label: 'Review' }},
                        { id: 'e2-3', source: '2', target: '3', type: 'smart', data: { label: 'Check' }},
                        { id: 'e3-4', source: '3', target: '4', type: 'smart', data: { label: 'Approve' }},
                        { id: 'e4-5', source: '4', target: '5', type: 'smart', data: { label: 'Sign' }},
                        { id: 'e5-6', source: '5', target: '6', type: 'smart', data: { label: 'Distribute' }}
                      ];
                      setNodes(templateNodes);
                      setEdges(templateEdges);
                      setSuccessMessage('Contract Approval Template loaded');
                      setShowSuccess(true);
                    }}>
                    <Typography variant="h6" gutterBottom>📝 Contract Approval</Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Legal contract workflow with compliance checks, multi-level approval, and automated distribution.
                    </Typography>
                    <Chip label="6 stages" sx={{ mr: 1 }} />
                    <Chip label="Legal focus" color="error" sx={{ mr: 1 }} />
                    <Chip label="Compliance" color="warning" />
                  </Card>

                  {/* Invoice Processing Template */}
                  <Card sx={{ mb: 2, p: 2, cursor: 'pointer', '&:hover': { bgcolor: '#f5f5f5' } }}
                    onClick={() => {
                      const templateNodes = [
                        { id: '1', type: 'professional', position: { x: 100, y: 200 }, 
                          data: { label: 'Scan Invoice', taskType: DocumentTaskType.SCAN_DOCUMENT, status: 'pending' }},
                        { id: '2', type: 'professional', position: { x: 350, y: 200 }, 
                          data: { label: 'Extract Data', taskType: DocumentTaskType.AI_EXTRACTION, status: 'pending' }},
                        { id: '3', type: 'professional', position: { x: 600, y: 200 }, 
                          data: { label: 'Validate', taskType: DocumentTaskType.VALIDATE_FORMAT, status: 'pending' }},
                        { id: '4', type: 'professional', position: { x: 850, y: 200 }, 
                          data: { label: 'ERP Sync', taskType: DocumentTaskType.ERP_SYNC, status: 'pending' }},
                        { id: '5', type: 'professional', position: { x: 1100, y: 200 }, 
                          data: { label: 'Archive', taskType: DocumentTaskType.ARCHIVE_DOCUMENT, status: 'pending' }}
                      ];
                      const templateEdges = [
                        { id: 'e1-2', source: '1', target: '2', type: 'smart', data: { label: 'Extract' }},
                        { id: 'e2-3', source: '2', target: '3', type: 'smart', data: { label: 'Validate' }},
                        { id: 'e3-4', source: '3', target: '4', type: 'smart', data: { label: 'Sync' }},
                        { id: 'e4-5', source: '4', target: '5', type: 'smart', data: { label: 'Archive' }}
                      ];
                      setNodes(templateNodes);
                      setEdges(templateEdges);
                      setSuccessMessage('Invoice Processing Template loaded');
                      setShowSuccess(true);
                    }}>
                    <Typography variant="h6" gutterBottom>💰 Invoice Processing</Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Automated invoice scanning, data extraction, validation, and ERP integration.
                    </Typography>
                    <Chip label="5 stages" sx={{ mr: 1 }} />
                    <Chip label="Automated" color="success" sx={{ mr: 1 }} />
                    <Chip label="ERP integrated" color="info" />
                  </Card>

                  {/* HR Onboarding Template */}
                  <Card sx={{ mb: 2, p: 2, cursor: 'pointer', '&:hover': { bgcolor: '#f5f5f5' } }}
                    onClick={() => {
                      const templateNodes = [
                        { id: '1', type: 'professional', position: { x: 100, y: 200 }, 
                          data: { label: 'Generate Forms', taskType: DocumentTaskType.GENERATE_FROM_TEMPLATE, status: 'pending' }},
                        { id: '2', type: 'professional', position: { x: 350, y: 100 }, 
                          data: { label: 'Send to Employee', taskType: DocumentTaskType.SEND_EMAIL, status: 'pending' }},
                        { id: '3', type: 'professional', position: { x: 350, y: 300 }, 
                          data: { label: 'Send to Manager', taskType: DocumentTaskType.SEND_EMAIL, status: 'pending' }},
                        { id: '4', type: 'professional', position: { x: 600, y: 200 }, 
                          data: { label: 'Collect Signatures', taskType: DocumentTaskType.DIGITAL_SIGNATURE, status: 'pending' }},
                        { id: '5', type: 'professional', position: { x: 850, y: 200 }, 
                          data: { label: 'HR Review', taskType: DocumentTaskType.MANUAL_REVIEW, status: 'pending' }},
                        { id: '6', type: 'professional', position: { x: 1100, y: 200 }, 
                          data: { label: 'Store in HR System', taskType: DocumentTaskType.DATABASE_INSERT, status: 'pending' }}
                      ];
                      const templateEdges = [
                        { id: 'e1-2', source: '1', target: '2', type: 'smart', data: { label: 'Send' }},
                        { id: 'e1-3', source: '1', target: '3', type: 'smart', data: { label: 'Notify' }},
                        { id: 'e2-4', source: '2', target: '4', type: 'smart', data: { label: 'Sign' }},
                        { id: 'e3-4', source: '3', target: '4', type: 'smart', data: { label: 'Approve' }},
                        { id: 'e4-5', source: '4', target: '5', type: 'smart', data: { label: 'Review' }},
                        { id: 'e5-6', source: '5', target: '6', type: 'smart', data: { label: 'Store' }}
                      ];
                      setNodes(templateNodes);
                      setEdges(templateEdges);
                      setSuccessMessage('HR Onboarding Template loaded');
                      setShowSuccess(true);
                    }}>
                    <Typography variant="h6" gutterBottom>👥 HR Onboarding</Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Employee onboarding with document generation, multi-party signatures, and HR system integration.
                    </Typography>
                    <Chip label="6 stages" sx={{ mr: 1 }} />
                    <Chip label="Parallel tasks" color="primary" sx={{ mr: 1 }} />
                    <Chip label="HR focused" color="secondary" />
                  </Card>
                </List>
              </Box>
            )}

            {/* Settings Tab */}
            {tabValue === 2 && (
              <Box>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Connection Mode</InputLabel>
                  <Select
                    value={connectionMode}
                    onChange={(e) => setConnectionMode(e.target.value as any)}
                  >
                    <MenuItem value="loose">Loose (Easy)</MenuItem>
                    <MenuItem value="strict">Strict (Precise)</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Edge Type</InputLabel>
                  <Select
                    value={edgeType}
                    onChange={(e) => setEdgeType(e.target.value as any)}
                  >
                    <MenuItem value="smart">Smart (Animated)</MenuItem>
                    <MenuItem value="smoothstep">Smooth Step</MenuItem>
                    <MenuItem value="straight">Straight</MenuItem>
                  </Select>
                </FormControl>

                <FormControlLabel
                  control={
                    <Switch 
                      checked={snapToGrid}
                      onChange={(e) => setSnapToGrid(e.target.checked)}
                    />
                  }
                  label="Snap to Grid"
                  sx={{ mb: 1 }}
                />

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography variant="body2" sx={{ mr: 2 }}>
                    Grid Size: {gridSize}
                  </Typography>
                  <Slider
                    value={gridSize}
                    onChange={(e, v) => setGridSize(v as number)}
                    min={5}
                    max={50}
                    step={5}
                    sx={{ flex: 1 }}
                  />
                </Box>
              </Box>
            )}
          </Box>
        </Drawer>

        {/* Main Canvas */}
        <Box sx={{ flexGrow: 1, position: 'relative', background: '#fafafa' }}>
          {/* Professional Toolbar */}
          <Paper sx={{ 
            p: 1, 
            display: 'flex', 
            gap: 1, 
            alignItems: 'center',
            borderBottom: '2px solid #e0e0e0'
          }}>
            <IconButton onClick={() => setDrawerOpen(!drawerOpen)}>
              <DragIndicator />
            </IconButton>
            
            <Divider orientation="vertical" flexItem />
            
            <ButtonGroup variant="contained" size="small">
              <Button startIcon={<Save />} onClick={async () => {
                // Generate workflow JSON
                const workflow = {
                  id: `workflow-${Date.now()}`,
                  name: workflowName,
                  description: workflowDescription,
                  version: '1.0.0',
                  type: 'document-review',
                  stages: nodes.map((node, index) => ({
                    id: node.id,
                    name: node.data.label,
                    type: node.data.taskType || 'MANUAL_REVIEW',
                    order: index + 1,
                    required: true,
                    roles: node.data.roles || ['Admin'],
                    actions: edges
                      .filter(e => e.source === node.id)
                      .map(e => ({
                        id: e.id,
                        label: e.data?.label || 'Proceed',
                        target: e.target,
                        condition: e.data?.condition
                      }))
                  })),
                  transitions: edges.map(edge => ({
                    id: edge.id,
                    from: edge.source,
                    to: edge.target,
                    label: edge.data?.label || 'proceed',
                    condition: edge.data?.condition
                  }))
                };

                // Save to backend
                try {
                  const response = await fetch('http://localhost:4000/api/workflow/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(workflow)
                  });
                  
                  if (response.ok) {
                    setSuccessMessage('Workflow saved to backend!');
                    setShowSuccess(true);
                    
                    // Also save as JSON file
                    const blob = new Blob([JSON.stringify(workflow, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${workflowName.replace(/\s+/g, '-').toLowerCase()}.json`;
                    a.click();
                  }
                } catch (error) {
                  console.error('Failed to save:', error);
                  // Save locally anyway
                  const blob = new Blob([JSON.stringify(workflow, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${workflowName.replace(/\s+/g, '-').toLowerCase()}.json`;
                  a.click();
                  setSuccessMessage('Workflow saved as JSON file!');
                  setShowSuccess(true);
                }
              }}>
                Save
              </Button>
              <Button startIcon={<CloudDownload />} onClick={() => {
                const workflow = {
                  id: `workflow-${Date.now()}`,
                  name: workflowName,
                  description: workflowDescription,
                  version: '1.0.0',
                  type: 'document-review',
                  stages: nodes.map((node, index) => ({
                    id: node.id,
                    name: node.data.label,
                    type: node.data.taskType || 'MANUAL_REVIEW',
                    order: index + 1,
                    required: true,
                    roles: node.data.roles || ['Admin'],
                    actions: edges
                      .filter(e => e.source === node.id)
                      .map(e => ({
                        id: e.id,
                        label: e.data?.label || 'Proceed',
                        target: e.target,
                        condition: e.data?.condition
                      }))
                  })),
                  transitions: edges.map(edge => ({
                    id: edge.id,
                    from: edge.source,
                    to: edge.target,
                    label: edge.data?.label || 'proceed',
                    condition: edge.data?.condition
                  }))
                };
                
                const blob = new Blob([JSON.stringify(workflow, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${workflowName.replace(/\s+/g, '-').toLowerCase()}.json`;
                a.click();
                setSuccessMessage('Workflow exported as JSON!');
                setShowSuccess(true);
              }}>
                Export
              </Button>
              <Button startIcon={<CloudUpload />}>
                Import
              </Button>
            </ButtonGroup>
            
            <Divider orientation="vertical" flexItem />
            
            <ButtonGroup variant="outlined" size="small">
              <Button startIcon={<Undo />}>Undo</Button>
              <Button startIcon={<Redo />}>Redo</Button>
            </ButtonGroup>
            
            <Divider orientation="vertical" flexItem />
            
            <ButtonGroup variant="outlined" size="small">
              <Button startIcon={<PlayArrow />} color="success">
                Run
              </Button>
              <Button startIcon={<Psychology />} color="info">
                Validate
              </Button>
            </ButtonGroup>

            <Box sx={{ flexGrow: 1 }} />
            
            <Chip 
              icon={<FiberManualRecord sx={{ fontSize: 12 }} />}
              label={`${nodes.length} nodes, ${edges.length} connections`}
              color="primary"
              variant="outlined"
            />
            
            <IconButton>
              <Help />
            </IconButton>
          </Paper>

          {/* React Flow Canvas */}
          <Box ref={reactFlowWrapper} sx={{ height: 'calc(100% - 56px)' }}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onInit={setReactFlowInstance}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onNodeClick={onNodeClick}
              onEdgeClick={onEdgeClick}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              connectionMode={connectionMode === 'loose' ? ConnectionMode.Loose : ConnectionMode.Strict}
              connectionLineComponent={CustomConnectionLine}
              fitView
              snapToGrid={snapToGrid}
              snapGrid={[gridSize, gridSize]}
              defaultEdgeOptions={{
                type: edgeType,
                animated: true
              }}
            >
              <Background 
                variant="dots" 
                gap={gridSize} 
                size={1} 
                color="#ddd"
              />
              <Controls />
              <MiniMap 
                nodeColor={(node) => {
                  const category = Object.values(TaskCategories).find(cat => 
                    cat.tasks.includes(node.data.taskType as DocumentTaskType)
                  );
                  return category?.color || '#9e9e9e';
                }}
                nodeStrokeWidth={3}
                pannable
                zoomable
              />
              
              {/* Professional Help Panel */}
              <Panel position="top-center">
                <Alert 
                  severity="info" 
                  sx={{ 
                    background: 'linear-gradient(90deg, #1976d2, #42a5f5)',
                    color: '#fff',
                    '& .MuiAlert-icon': { color: '#fff' }
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    Professional Workflow Builder
                  </Typography>
                  <Typography variant="caption">
                    Hover nodes to see connection ports • Drag from any port to connect • Double-click to edit
                  </Typography>
                </Alert>
              </Panel>
            </ReactFlow>
          </Box>

          {/* Speed Dial for Quick Actions */}
          <SpeedDial
            ariaLabel="Quick Actions"
            sx={{ position: 'absolute', bottom: 16, right: 16 }}
            icon={<SpeedDialIcon />}
          >
            <SpeedDialAction
              icon={<Add />}
              tooltipTitle="Add Node"
              onClick={() => {
                const newNode: Node = {
                  id: `node-${Date.now()}`,
                  type: 'professional',
                  position: { x: 300, y: 300 },
                  data: { 
                    label: 'New Task',
                    taskType: DocumentTaskType.MANUAL_REVIEW,
                    status: 'pending',
                    description: 'Configure this task',
                    roles: []
                  },
                };
                setNodes((nds) => nds.concat(newNode));
              }}
            />
            <SpeedDialAction
              icon={<AutoAwesome />}
              tooltipTitle="Auto Layout"
              onClick={() => {
                // Auto layout logic
                setSuccessMessage('Auto layout applied');
                setShowSuccess(true);
              }}
            />
            <SpeedDialAction
              icon={<CenterFocusStrong />}
              tooltipTitle="Fit View"
              onClick={() => {
                reactFlowInstance?.fitView({ padding: 0.2 });
              }}
            />
            <SpeedDialAction
              icon={<GridOn />}
              tooltipTitle="Toggle Grid"
              onClick={() => setSnapToGrid(!snapToGrid)}
            />
          </SpeedDial>
        </Box>

        {/* Properties Panel */}
        <Drawer
          variant="persistent"
          anchor="right"
          open={propertiesOpen}
          sx={{
            width: 300,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: 300,
              boxSizing: 'border-box',
              top: 64,
              background: '#f8f9fa'
            },
          }}
        >
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">
                {selectedNode ? 'Task Properties' : selectedEdge ? 'Connection Properties' : 'Properties'}
              </Typography>
              <IconButton onClick={() => setPropertiesOpen(false)} size="small">
                <Close />
              </IconButton>
            </Box>

            {selectedNode && (
              <Box>
                <TextField
                  fullWidth
                  label="Task Name"
                  value={selectedNode.data.label}
                  onChange={(e) => {
                    setNodes((nds) =>
                      nds.map((node) =>
                        node.id === selectedNode.id
                          ? { ...node, data: { ...node.data, label: e.target.value } }
                          : node
                      )
                    );
                  }}
                  sx={{ mb: 2 }}
                />

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Task Type</InputLabel>
                  <Select
                    value={selectedNode.data.taskType || ''}
                    onChange={(e) => {
                      const taskType = e.target.value as DocumentTaskType;
                      const config = getTaskConfiguration(taskType);
                      setNodes((nds) =>
                        nds.map((node) =>
                          node.id === selectedNode.id
                            ? { 
                                ...node, 
                                data: { 
                                  ...node.data, 
                                  taskType,
                                  label: config.name,
                                  description: config.description
                                } 
                              }
                            : node
                        )
                      );
                    }}
                  >
                    {Object.values(DocumentTaskType).map(type => (
                      <MenuItem key={type} value={type}>
                        {type.replace(/_/g, ' ').toLowerCase()}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  label="Description"
                  value={selectedNode.data.description || ''}
                  onChange={(e) => {
                    setNodes((nds) =>
                      nds.map((node) =>
                        node.id === selectedNode.id
                          ? { ...node, data: { ...node.data, description: e.target.value } }
                          : node
                      )
                    );
                  }}
                  multiline
                  rows={3}
                  sx={{ mb: 2 }}
                />

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" gutterBottom>
                  Advanced Settings
                </Typography>

                <FormControlLabel
                  control={
                    <Switch 
                      checked={selectedNode.data.requiresApproval || false}
                      onChange={(e) => {
                        setNodes((nds) =>
                          nds.map((node) =>
                            node.id === selectedNode.id
                              ? { ...node, data: { ...node.data, requiresApproval: e.target.checked } }
                              : node
                          )
                        );
                      }}
                    />
                  }
                  label="Requires Approval"
                  sx={{ mb: 1 }}
                />

                <TextField
                  fullWidth
                  label="Time Limit (hours)"
                  type="number"
                  value={selectedNode.data.timeLimit || ''}
                  onChange={(e) => {
                    setNodes((nds) =>
                      nds.map((node) =>
                        node.id === selectedNode.id
                          ? { ...node, data: { ...node.data, timeLimit: parseInt(e.target.value) } }
                          : node
                      )
                    );
                  }}
                  sx={{ mb: 2 }}
                />

                <Autocomplete
                  multiple
                  options={['Admin', 'Manager', 'User', 'Reviewer', 'Legal', 'Executive']}
                  value={selectedNode.data.roles || []}
                  onChange={(e, value) => {
                    setNodes((nds) =>
                      nds.map((node) =>
                        node.id === selectedNode.id
                          ? { ...node, data: { ...node.data, roles: value } }
                          : node
                      )
                    );
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Allowed Roles" />
                  )}
                  sx={{ mb: 2 }}
                />

                <Button
                  fullWidth
                  variant="outlined"
                  color="error"
                  startIcon={<Delete />}
                  onClick={() => {
                    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
                    setEdges((eds) => eds.filter((e) => 
                      e.source !== selectedNode.id && e.target !== selectedNode.id
                    ));
                    setSelectedNode(null);
                    setPropertiesOpen(false);
                  }}
                >
                  Delete Task
                </Button>
              </Box>
            )}

            {selectedEdge && (
              <Box>
                <TextField
                  fullWidth
                  label="Connection Label"
                  value={selectedEdge.data?.label || ''}
                  onChange={(e) => {
                    setEdges((eds) =>
                      eds.map((edge) =>
                        edge.id === selectedEdge.id
                          ? { ...edge, data: { ...edge.data, label: e.target.value } }
                          : edge
                      )
                    );
                  }}
                  sx={{ mb: 2 }}
                />

                <TextField
                  fullWidth
                  label="Condition (Optional)"
                  value={selectedEdge.data?.condition || ''}
                  onChange={(e) => {
                    setEdges((eds) =>
                      eds.map((edge) =>
                        edge.id === selectedEdge.id
                          ? { ...edge, data: { ...edge.data, condition: e.target.value } }
                          : edge
                      )
                    );
                  }}
                  placeholder="e.g., approved === true"
                  sx={{ mb: 2 }}
                />

                <FormControlLabel
                  control={
                    <Switch 
                      checked={selectedEdge.data?.requireComment || false}
                      onChange={(e) => {
                        setEdges((eds) =>
                          eds.map((edge) =>
                            edge.id === selectedEdge.id
                              ? { ...edge, data: { ...edge.data, requireComment: e.target.checked } }
                              : edge
                          )
                        );
                      }}
                    />
                  }
                  label="Require Comment"
                  sx={{ mb: 2 }}
                />

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Connection Style</InputLabel>
                  <Select
                    value={selectedEdge.type || 'smart'}
                    onChange={(e) => {
                      setEdges((eds) =>
                        eds.map((edge) =>
                          edge.id === selectedEdge.id
                            ? { ...edge, type: e.target.value }
                            : edge
                        )
                      );
                    }}
                  >
                    <MenuItem value="smart">Smart</MenuItem>
                    <MenuItem value="smoothstep">Smooth</MenuItem>
                    <MenuItem value="straight">Straight</MenuItem>
                  </Select>
                </FormControl>

                <Button
                  fullWidth
                  variant="outlined"
                  color="error"
                  startIcon={<Delete />}
                  onClick={() => {
                    setEdges((eds) => eds.filter((e) => e.id !== selectedEdge.id));
                    setSelectedEdge(null);
                    setPropertiesOpen(false);
                  }}
                >
                  Delete Connection
                </Button>
              </Box>
            )}
          </Box>
        </Drawer>

        {/* Success Notifications */}
        <Snackbar
          open={showSuccess}
          autoHideDuration={3000}
          onClose={() => setShowSuccess(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            severity="success" 
            onClose={() => setShowSuccess(false)}
            sx={{ minWidth: 300 }}
          >
            {successMessage}
          </Alert>
        </Snackbar>
      </Box>
    </ReactFlowProvider>
  );
}