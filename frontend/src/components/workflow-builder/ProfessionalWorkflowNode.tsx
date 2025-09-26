import React, { useMemo } from 'react';
import { Handle, Position } from 'reactflow';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Avatar
} from '@mui/material';
import {
  CloudUpload,
  Settings,
  CheckCircle,
  Group,
  Notifications,
  Storage,
  FolderOpen,
  Security,
  Assessment,
  Api,
  AccountTree,
  Psychology,
  CloudDownload,
  Code,
  PlayCircle,
  FiberManualRecord
} from '@mui/icons-material';
import {
  DocumentTaskType,
  TaskCategories
} from '@/types/document-workflow-tasks';
import { ProfessionalNodeProps } from './types';

export const ProfessionalWorkflowNode: React.FC<ProfessionalNodeProps> = ({
  data,
  selected,
  isConnectable
}) => {
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

export default ProfessionalWorkflowNode;