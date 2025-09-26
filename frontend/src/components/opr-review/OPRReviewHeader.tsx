import React from 'react';
import { useRouter } from 'next/navigation';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Button,
  Menu,
  MenuItem,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  ArrowBack,
  Description as DocumentIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Download as DownloadIcon,
  PictureAsPdf as PdfIcon,
  TextFields as TextIcon,
  Code as HtmlIcon,
} from '@mui/icons-material';

interface OPRReviewHeaderProps {
  documentTitle?: string;
  isEditingDocument: boolean;
  savingDocument: boolean;
  exporting: boolean;
  exportAnchorEl: HTMLElement | null;
  onEditToggle: () => void;
  onSaveDocument: () => void;
  onExport: (format: string, includeTrackChanges?: boolean) => void;
  onExportMenuOpen: (event: React.MouseEvent<HTMLElement>) => void;
  onExportMenuClose: () => void;
}

const OPRReviewHeader: React.FC<OPRReviewHeaderProps> = ({
  documentTitle,
  isEditingDocument,
  savingDocument,
  exporting,
  exportAnchorEl,
  onEditToggle,
  onSaveDocument,
  onExport,
  onExportMenuOpen,
  onExportMenuClose,
}) => {
  const router = useRouter();

  return (
    <AppBar position="sticky" color="primary">
      <Toolbar>
        <IconButton edge="start" color="inherit" onClick={() => router.push('/dashboard')}>
          <ArrowBack />
        </IconButton>
        <DocumentIcon sx={{ ml: 2, mr: 1 }} />
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          OPR Review: {documentTitle || 'Loading...'}
        </Typography>
        <Button
          color="inherit"
          variant={isEditingDocument ? "contained" : "outlined"}
          onClick={onEditToggle}
          startIcon={<EditIcon />}
          sx={{ mr: 2 }}
        >
          {isEditingDocument ? 'View Mode' : 'Edit Document'}
        </Button>
        {isEditingDocument && (
          <Button
            color="inherit"
            variant="contained"
            onClick={onSaveDocument}
            disabled={savingDocument}
            startIcon={savingDocument ? <CircularProgress size={20} /> : <SaveIcon />}
            sx={{ mr: 2 }}
          >
            Save Document
          </Button>
        )}
        <Button
          color="inherit"
          variant="outlined"
          onClick={onExportMenuOpen}
          disabled={exporting}
          startIcon={exporting ? <CircularProgress size={20} /> : <DownloadIcon />}
        >
          Export
        </Button>
        <Menu
          anchorEl={exportAnchorEl}
          open={Boolean(exportAnchorEl)}
          onClose={onExportMenuClose}
        >
          <MenuItem onClick={() => onExport('pdf')}>
            <PdfIcon sx={{ mr: 1 }} /> Export as PDF
          </MenuItem>
          <MenuItem onClick={() => onExport('pdf', true)}>
            <PdfIcon sx={{ mr: 1, color: 'warning.main' }} /> Export PDF with Track Changes
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => onExport('docx')}>
            <DocumentIcon sx={{ mr: 1 }} /> Export as Word
          </MenuItem>
          <MenuItem onClick={() => onExport('docx', true)}>
            <DocumentIcon sx={{ mr: 1, color: 'warning.main' }} /> Export Word with Track Changes
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => onExport('txt')}>
            <TextIcon sx={{ mr: 1 }} /> Export as Text
          </MenuItem>
          <MenuItem onClick={() => onExport('html')}>
            <HtmlIcon sx={{ mr: 1 }} /> Export as HTML
          </MenuItem>
          <MenuItem onClick={() => onExport('html', true)}>
            <HtmlIcon sx={{ mr: 1, color: 'warning.main' }} /> Export HTML with Track Changes
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default OPRReviewHeader;