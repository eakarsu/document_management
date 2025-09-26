import React from 'react';
import { Paper, Typography, Box, Divider, Button } from '@mui/material';
import { Edit, Preview } from '@mui/icons-material';
// Remove DOMPurify for now - will implement content sanitization later if needed

interface DocumentContentProps {
  content?: string;
  canEdit?: boolean;
  onEdit?: () => void;
  onPreview?: () => void;
}

export const DocumentContent: React.FC<DocumentContentProps> = ({
  content,
  canEdit,
  onEdit,
  onPreview
}) => {
  const sanitizedContent = content || '';

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Document Content</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {onPreview && (
            <Button
              startIcon={<Preview />}
              size="small"
              variant="outlined"
              onClick={onPreview}
            >
              Preview
            </Button>
          )}
          {canEdit && onEdit && (
            <Button
              startIcon={<Edit />}
              size="small"
              variant="contained"
              onClick={onEdit}
            >
              Edit Content
            </Button>
          )}
        </Box>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {content ? (
        <Box
          sx={{
            '& h1': { fontSize: '2rem', fontWeight: 600, mb: 2, mt: 3 },
            '& h2': { fontSize: '1.5rem', fontWeight: 600, mb: 1.5, mt: 2.5 },
            '& h3': { fontSize: '1.25rem', fontWeight: 600, mb: 1, mt: 2 },
            '& p': { mb: 1.5, lineHeight: 1.6 },
            '& ul, & ol': { mb: 1.5, pl: 3 },
            '& li': { mb: 0.5 },
            '& blockquote': {
              borderLeft: 3,
              borderColor: 'primary.main',
              pl: 2,
              ml: 0,
              fontStyle: 'italic',
              color: 'text.secondary'
            },
            '& pre': {
              bgcolor: 'grey.100',
              p: 2,
              borderRadius: 1,
              overflowX: 'auto'
            },
            '& code': {
              bgcolor: 'grey.100',
              px: 0.5,
              borderRadius: 0.5,
              fontFamily: 'monospace'
            },
            '& table': {
              width: '100%',
              borderCollapse: 'collapse',
              mb: 2
            },
            '& th': {
              borderBottom: 2,
              borderColor: 'divider',
              p: 1,
              textAlign: 'left',
              fontWeight: 600
            },
            '& td': {
              borderBottom: 1,
              borderColor: 'divider',
              p: 1
            },
            '& img': {
              maxWidth: '100%',
              height: 'auto',
              display: 'block',
              my: 2
            },
            '& hr': {
              my: 3,
              borderColor: 'divider'
            }
          }}
          dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        />
      ) : (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="body1" color="text.secondary">
            No content available for this document.
          </Typography>
          {canEdit && onEdit && (
            <Button
              startIcon={<Edit />}
              variant="contained"
              onClick={onEdit}
              sx={{ mt: 2 }}
            >
              Add Content
            </Button>
          )}
        </Box>
      )}
    </Paper>
  );
};