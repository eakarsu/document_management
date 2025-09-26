import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Avatar
} from '@mui/material';
import {
  Security,
  Person,
  AdminPanelSettings,
  Edit,
  Visibility,
  Block
} from '@mui/icons-material';

interface DocumentPermission {
  id: string;
  userId: string;
  permission: 'READ' | 'WRITE' | 'ADMIN';
  user?: {
    firstName: string;
    lastName: string;
    email: string;
    role?: string;
  };
}

interface DocumentPermissionsProps {
  permissions?: DocumentPermission[];
  canManagePermissions?: boolean;
  documentOwner?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export const DocumentPermissions: React.FC<DocumentPermissionsProps> = ({
  permissions = [],
  canManagePermissions = false,
  documentOwner
}) => {
  const getPermissionIcon = (permission: string) => {
    switch (permission) {
      case 'ADMIN':
        return <AdminPanelSettings color="error" />;
      case 'WRITE':
        return <Edit color="warning" />;
      case 'READ':
        return <Visibility color="info" />;
      default:
        return <Block color="disabled" />;
    }
  };

  const getPermissionColor = (permission: string): 'error' | 'warning' | 'info' | 'default' => {
    switch (permission) {
      case 'ADMIN':
        return 'error';
      case 'WRITE':
        return 'warning';
      case 'READ':
        return 'info';
      default:
        return 'default';
    }
  };

  const getPermissionLabel = (permission: string) => {
    switch (permission) {
      case 'ADMIN':
        return 'Full Access';
      case 'WRITE':
        return 'Edit Access';
      case 'READ':
        return 'View Only';
      default:
        return 'No Access';
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        <Security sx={{ mr: 1, verticalAlign: 'middle' }} />
        Document Permissions
      </Typography>

      <Divider sx={{ mb: 3 }} />

      {/* Document Owner */}
      {documentOwner && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" color="primary" gutterBottom>
            Document Owner
          </Typography>
          <ListItem sx={{ px: 0, py: 1, bgcolor: 'primary.light', borderRadius: 1 }}>
            <ListItemIcon>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                {getInitials(documentOwner.firstName, documentOwner.lastName)}
              </Avatar>
            </ListItemIcon>
            <ListItemText
              primary={`${documentOwner.firstName} ${documentOwner.lastName}`}
              secondary={documentOwner.email}
            />
            <Chip
              label="Owner"
              color="primary"
              size="small"
              icon={<AdminPanelSettings />}
            />
          </ListItem>
        </Box>
      )}

      {/* Shared Permissions */}
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Shared Access
      </Typography>

      {permissions.length > 0 ? (
        <List>
          {permissions.map((permission) => (
            <ListItem key={permission.id} sx={{ px: 0 }}>
              <ListItemIcon>
                <Avatar sx={{ bgcolor: 'grey.300' }}>
                  {permission.user ?
                    getInitials(permission.user.firstName, permission.user.lastName) :
                    <Person />
                  }
                </Avatar>
              </ListItemIcon>
              <ListItemText
                primary={
                  permission.user ?
                    `${permission.user.firstName} ${permission.user.lastName}` :
                    'Unknown User'
                }
                secondary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      {permission.user?.email || 'No email'}
                    </Typography>
                    {permission.user?.role && (
                      <Chip
                        label={permission.user.role}
                        size="small"
                        variant="outlined"
                        sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                    )}
                  </Box>
                }
              />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {getPermissionIcon(permission.permission)}
                <Chip
                  label={getPermissionLabel(permission.permission)}
                  color={getPermissionColor(permission.permission)}
                  size="small"
                />
              </Box>
            </ListItem>
          ))}
        </List>
      ) : (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" color="text.secondary">
            This document is not shared with anyone.
          </Typography>
          {canManagePermissions && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Use the sharing options to grant access to other users.
            </Typography>
          )}
        </Box>
      )}

      {/* Permission Legend */}
      <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', mb: 1, display: 'block' }}>
          Permission Levels:
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Visibility color="info" fontSize="small" />
            <Typography variant="caption">View Only</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Edit color="warning" fontSize="small" />
            <Typography variant="caption">Edit Access</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <AdminPanelSettings color="error" fontSize="small" />
            <Typography variant="caption">Full Access</Typography>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};