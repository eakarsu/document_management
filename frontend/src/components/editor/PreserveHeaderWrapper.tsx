'use client';

import React from 'react';
import { Box } from '@mui/material';

interface PreserveHeaderWrapperProps {
  headerHtml?: string;
  documentStyles?: string;
  children: React.ReactNode;
  hasCustomHeader?: boolean;
}

export const PreserveHeaderWrapper: React.FC<PreserveHeaderWrapperProps> = ({
  headerHtml,
  documentStyles,
  children,
  hasCustomHeader
}) => {
  if (!hasCustomHeader || !headerHtml) {
    return <>{children}</>;
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* Render preserved header with original styles */}
      {documentStyles && (
        <style dangerouslySetInnerHTML={{ __html: documentStyles }} />
      )}
      
      {/* Air Force Header - Not Editable */}
      <Box 
        sx={{ 
          backgroundColor: 'white',
          borderBottom: '2px solid #e0e0e0',
          marginBottom: 2,
          pointerEvents: 'none', // Make header non-interactive
          opacity: 0.95
        }}
        dangerouslySetInnerHTML={{ __html: headerHtml }}
      />
      
      {/* Editable Content Area */}
      <Box sx={{ backgroundColor: 'white', padding: 2 }}>
        {children}
      </Box>
    </Box>
  );
};