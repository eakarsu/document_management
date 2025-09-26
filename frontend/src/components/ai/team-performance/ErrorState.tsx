import React from 'react';
import {
  Card,
  CardContent,
  Alert,
  Button
} from '@mui/material';

interface ErrorStateProps {
  error: string;
  onRetry: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry }) => {
  return (
    <Card>
      <CardContent>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={onRetry}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </CardContent>
    </Card>
  );
};

export default ErrorState;