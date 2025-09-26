import React from 'react';
import { getSmoothStepPath } from 'reactflow';
import { CustomConnectionLineProps } from './types';

export const CustomConnectionLine: React.FC<CustomConnectionLineProps> = ({
  fromX,
  fromY,
  toX,
  toY,
  connectionLineStyle
}) => {
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
          animation: 'dash 0.5s linear infinite',
          ...connectionLineStyle
        }}
      />
      <circle r="3" fill="#2196f3">
        <animateMotion dur="0.5s" repeatCount="indefinite" path={path} />
      </circle>
    </g>
  );
};

export default CustomConnectionLine;