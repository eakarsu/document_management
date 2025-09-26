import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { Security, Warning } from '@mui/icons-material';
import { ComplianceAnalysis } from '@/types/content-analyzer';

interface ComplianceCardProps {
  compliance: ComplianceAnalysis;
}

const ComplianceCard: React.FC<ComplianceCardProps> = ({ compliance }) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <Security sx={{ mr: 1 }} />
          Compliance & Security
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>Security Classification</Typography>
          <Chip
            label={compliance.recommendedClassification}
            color={compliance.securityLevel === 'HIGH' ? 'error' : 'warning'}
          />
        </Box>

        {compliance.sensitiveDataDetected && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Sensitive data detected: {compliance.sensitiveDataTypes.join(', ')}
          </Alert>
        )}

        <Typography variant="subtitle2" gutterBottom>Compliance Flags</Typography>
        <List dense>
          {compliance.complianceFlags.map((flag, index) => (
            <ListItem key={index} sx={{ px: 0 }}>
              <ListItemIcon>
                <Warning color={flag.severity === 'CRITICAL' ? 'error' : 'warning'} />
              </ListItemIcon>
              <ListItemText
                primary={flag.type}
                secondary={flag.description}
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

export default ComplianceCard;