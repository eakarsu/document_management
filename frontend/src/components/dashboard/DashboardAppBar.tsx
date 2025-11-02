'use client';

import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem
} from '@mui/material';
import {
  AccountCircle,
  Business,
  Logout as LogoutIcon
} from '@mui/icons-material';

interface DashboardAppBarProps {
  anchorEl: null | HTMLElement;
  onProfileMenuOpen: (event: React.MouseEvent<HTMLElement>) => void;
  onMenuClose: () => void;
  onLogout: () => void;
}

export const DashboardAppBar: React.FC<DashboardAppBarProps> = ({
  anchorEl,
  onProfileMenuOpen,
  onMenuClose,
  onLogout
}) => {
  return (
    <AppBar position="static" elevation={1}>
      <Toolbar>
        <Business sx={{ mr: 2 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          PubOne by MissionSynchAI
        </Typography>
        <IconButton
          size="large"
          edge="end"
          aria-label="account of current user"
          onClick={onProfileMenuOpen}
          color="inherit"
        >
          <AccountCircle />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={onMenuClose}
        >
          <MenuItem onClick={onLogout}>
            <LogoutIcon sx={{ mr: 1 }} />
            Logout
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};