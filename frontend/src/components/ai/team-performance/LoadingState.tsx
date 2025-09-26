import React from 'react';
import {
  Card,
  CardContent,
  Box,
  CircularProgress,
  Typography
} from '@mui/material';

interface LoadingStateProps {
  message?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Analyzing team performance with AI...'
}) => {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4 }}>
          <CircularProgress sx={{ mr: 2 }} />
          <Typography>{message}</Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default LoadingState;