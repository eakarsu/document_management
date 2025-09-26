import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { CheckCircle } from '@mui/icons-material';

interface StrengthsCardProps {
  strengths: string[];
}

const StrengthsCard: React.FC<StrengthsCardProps> = ({ strengths }) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <CheckCircle sx={{ mr: 1 }} />
          Document Strengths
        </Typography>

        <List dense>
          {strengths.map((strength, index) => (
            <ListItem key={index} sx={{ px: 0 }}>
              <ListItemIcon>
                <CheckCircle color="success" fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={strength} />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

export default StrengthsCard;