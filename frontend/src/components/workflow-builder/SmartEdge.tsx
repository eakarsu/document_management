import React, { useState } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
} from 'reactflow';
import { Card, Typography, Chip } from '@mui/material';
import { SmartEdgeProps } from './types';

export const SmartEdge: React.FC<SmartEdgeProps> = ({
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
}) => {
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

export default SmartEdge;