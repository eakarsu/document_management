import React from 'react';
import {
  Menu,
  MenuItem
} from '@mui/material';
import { Person, Assignment, Schedule } from '@mui/icons-material';

interface MemberActionsMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  selectedMemberId: string | null;
}

const MemberActionsMenu: React.FC<MemberActionsMenuProps> = ({
  anchorEl,
  open,
  onClose,
  selectedMemberId
}) => {
  const handleMenuItemClick = (action: string) => {
    // Handle the action based on the selected member
    console.log(`Action ${action} for member ${selectedMemberId}`);
    onClose();
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
    >
      <MenuItem onClick={() => handleMenuItemClick('view-details')}>
        <Person sx={{ mr: 1 }} />
        View Details
      </MenuItem>
      <MenuItem onClick={() => handleMenuItemClick('assign-tasks')}>
        <Assignment sx={{ mr: 1 }} />
        Assign Tasks
      </MenuItem>
      <MenuItem onClick={() => handleMenuItemClick('schedule-meeting')}>
        <Schedule sx={{ mr: 1 }} />
        Schedule 1:1
      </MenuItem>
    </Menu>
  );
};

export default MemberActionsMenu;