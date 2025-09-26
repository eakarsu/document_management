import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  Chip,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton
} from '@mui/material';
import {
  History as HistoryIcon,
  Undo as UndoIcon,
  Visibility as PreviewIcon
} from '@mui/icons-material';
import { DocumentVersion } from '@/types/feedback-processor';

interface VersionHistoryDialogProps {
  open: boolean;
  onClose: () => void;
  versions: DocumentVersion[];
  onRevertToVersion: (versionId: string) => void;
}

const VersionHistoryDialog: React.FC<VersionHistoryDialogProps> = ({
  open,
  onClose,
  versions,
  onRevertToVersion
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={2}>
          <HistoryIcon />
          <Typography variant="h6">Version History</Typography>
          <Chip label={`${versions.length} versions`} size="small" />
        </Stack>
      </DialogTitle>
      <DialogContent>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Version</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Changes</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {versions.map((version, index) => (
                <TableRow key={version.id}>
                  <TableCell>
                    <Chip
                      label={`v${version.versionNumber}`}
                      color={index === versions.length - 1 ? 'primary' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{new Date(version.createdAt).toLocaleString()}</TableCell>
                  <TableCell>{version.changes.length}</TableCell>
                  <TableCell>{version.description || 'No description'}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <IconButton
                        size="small"
                        onClick={() => onRevertToVersion(version.id)}
                        disabled={index === versions.length - 1}
                      >
                        <UndoIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small">
                        <PreviewIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default VersionHistoryDialog;