import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Chip,
  Alert,
  Divider
} from '@mui/material';
import {
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  Close as CloseIcon,
  Info as InfoIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon
} from '@mui/icons-material';

interface SupplementableSection {
  id: string;
  sectionNumber: string;
  sectionTitle: string;
  isSupplementable: boolean;
  restrictions?: string;
  allowedActions?: ('ADD' | 'MODIFY' | 'REPLACE' | 'DELETE')[];
}

interface SupplementableSectionMarkerProps {
  documentId: string;
  editor: any; // TipTap editor instance
  isParentDocument?: boolean;
}

export const SupplementableSectionMarker: React.FC<SupplementableSectionMarkerProps> = ({
  documentId,
  editor,
  isParentDocument = true
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sections, setSections] = useState<SupplementableSection[]>([]);
  const [selectedText, setSelectedText] = useState('');
  const [showFloatingButton, setShowFloatingButton] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0 });
  const [currentSection, setCurrentSection] = useState<Partial<SupplementableSection>>({
    sectionNumber: '',
    sectionTitle: '',
    isSupplementable: true,
    allowedActions: ['ADD', 'MODIFY', 'REPLACE', 'DELETE']
  });

  // Listen for text selection in the editor
  useEffect(() => {
    if (!editor || !isParentDocument) return;

    const updateSelection = () => {
      const { from, to } = editor.state.selection;
      const text = editor.state.doc.textBetween(from, to, ' ');
      
      if (text && text.length > 0) {
        setSelectedText(text);
        
        // Get selection coordinates for floating button
        const coords = editor.view.coordsAtPos(from);
        
        setButtonPosition({
          x: coords.left,
          y: coords.top - 50
        });
        setShowFloatingButton(true);
      } else {
        setShowFloatingButton(false);
      }
    };

    editor.on('selectionUpdate', updateSelection);
    return () => {
      editor.off('selectionUpdate', updateSelection);
    };
  }, [editor, isParentDocument]);

  const handleMarkAsSupplementable = () => {
    // Try to extract section number from selected text
    const sectionMatch = selectedText.match(/^(\d+(?:\.\d+)*)/);
    const sectionNumber = sectionMatch ? sectionMatch[1] : '';
    
    setCurrentSection({
      ...currentSection,
      sectionNumber,
      sectionTitle: selectedText.substring(0, 50), // First 50 chars as title
    });
    setDialogOpen(true);
    setShowFloatingButton(false);
  };

  const handleSaveSection = () => {
    if (!currentSection.sectionNumber) {
      alert('Please provide a section number');
      return;
    }

    const newSection: SupplementableSection = {
      id: `section_${Date.now()}`,
      sectionNumber: currentSection.sectionNumber!,
      sectionTitle: currentSection.sectionTitle || '',
      isSupplementable: currentSection.isSupplementable !== false,
      restrictions: currentSection.restrictions,
      allowedActions: currentSection.allowedActions || ['ADD', 'MODIFY', 'REPLACE', 'DELETE']
    };

    // Apply visual marking to the selected text
    if (editor) {
      editor.chain().focus().setMark('supplementMark', {
        class: 'supplementable-section',
        'data-supplementable': 'true',
        'data-section-number': currentSection.sectionNumber,
        'data-allowed-actions': (currentSection.allowedActions || []).join(',')
      }).run();
    }

    setSections([...sections, newSection]);
    setDialogOpen(false);
    setCurrentSection({
      sectionNumber: '',
      sectionTitle: '',
      isSupplementable: true,
      allowedActions: ['ADD', 'MODIFY', 'REPLACE', 'DELETE']
    });
  };

  if (!isParentDocument) {
    return null; // Only show for parent documents
  }

  return (
    <>
      {/* Floating Mark Button */}
      {showFloatingButton && (
        <Paper
          elevation={4}
          sx={{
            position: 'fixed',
            left: `${buttonPosition.x}px`,
            top: `${buttonPosition.y}px`,
            zIndex: 99999,
            p: 0.5,
            backgroundColor: 'primary.main',
            border: '2px solid',
            borderColor: 'primary.dark',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          }}
        >
          <Tooltip title="Mark as Supplementable Section">
            <IconButton
              size="small"
              sx={{ color: 'white' }}
              onClick={handleMarkAsSupplementable}
            >
              <BookmarkIcon />
            </IconButton>
          </Tooltip>
        </Paper>
      )}

      {/* Section Configuration Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Mark Section as Supplementable
          <IconButton
            sx={{ position: 'absolute', right: 8, top: 8 }}
            onClick={() => setDialogOpen(false)}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <Alert severity="info">
              Marking this section as supplementable allows subordinate organizations to add supplements to it.
            </Alert>

            <TextField
              label="Section Number"
              placeholder="e.g., 2.3.1"
              value={currentSection.sectionNumber}
              onChange={(e) => setCurrentSection({
                ...currentSection,
                sectionNumber: e.target.value
              })}
              required
              fullWidth
              helperText="The official section number in your document"
            />

            <TextField
              label="Section Title"
              placeholder="e.g., Dress and Appearance Standards"
              value={currentSection.sectionTitle}
              onChange={(e) => setCurrentSection({
                ...currentSection,
                sectionTitle: e.target.value
              })}
              fullWidth
            />

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Allowed Supplement Actions:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {['ADD', 'MODIFY', 'REPLACE', 'DELETE'].map((action) => (
                  <Chip
                    key={action}
                    label={action}
                    color={
                      currentSection.allowedActions?.includes(action as any) 
                        ? 'primary' 
                        : 'default'
                    }
                    onClick={() => {
                      const current = currentSection.allowedActions || [];
                      if (current.includes(action as any)) {
                        setCurrentSection({
                          ...currentSection,
                          allowedActions: current.filter(a => a !== action)
                        });
                      } else {
                        setCurrentSection({
                          ...currentSection,
                          allowedActions: [...current, action as any]
                        });
                      }
                    }}
                    sx={{ cursor: 'pointer' }}
                  />
                ))}
              </Box>
            </Box>

            <TextField
              label="Restrictions or Guidance (Optional)"
              placeholder="Any specific restrictions for supplements"
              value={currentSection.restrictions}
              onChange={(e) => setCurrentSection({
                ...currentSection,
                restrictions: e.target.value
              })}
              multiline
              rows={2}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveSection}
            disabled={!currentSection.sectionNumber}
          >
            Mark as Supplementable
          </Button>
        </DialogActions>
      </Dialog>

      {/* Supplementable Sections List */}
      {sections.length > 0 && (
        <Paper
          sx={{
            position: 'fixed',
            left: 20,
            top: 100,
            width: 280,
            maxHeight: 400,
            overflow: 'auto',
            p: 2,
            zIndex: 1000,
            backgroundColor: 'background.paper',
            border: '2px solid',
            borderColor: 'primary.main'
          }}
          elevation={3}
        >
          <Typography variant="h6" gutterBottom>
            Supplementable Sections ({sections.length})
          </Typography>
          <Alert severity="info" sx={{ mb: 2, fontSize: '0.75rem' }}>
            These sections can be supplemented by subordinate organizations. 
            The tags show which supplement actions are allowed.
          </Alert>
          <List dense>
            {sections.map((section) => (
              <React.Fragment key={section.id}>
                <ListItem>
                  <ListItemIcon>
                    <Tooltip title="This section can be supplemented">
                      <BookmarkIcon color="primary" />
                    </Tooltip>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight="bold">
                          Section {section.sectionNumber}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 0.5 }}>
                        {section.sectionTitle && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                            {section.sectionTitle}
                          </Typography>
                        )}
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 0.5 }}>
                          <Typography variant="caption" sx={{ mr: 1 }}>
                            Allowed:
                          </Typography>
                          {section.allowedActions?.map(action => (
                            <Chip
                              key={action}
                              label={action}
                              size="small"
                              color={
                                action === 'ADD' ? 'success' :
                                action === 'MODIFY' ? 'warning' :
                                action === 'REPLACE' ? 'info' :
                                'error'
                              }
                              sx={{ 
                                fontSize: '0.65rem', 
                                height: 18,
                                opacity: 0.8,
                                cursor: 'default'
                              }}
                            />
                          ))}
                        </Box>
                        {section.restrictions && (
                          <Typography variant="caption" sx={{ fontStyle: 'italic', display: 'block', color: 'text.secondary' }}>
                            ⚠️ {section.restrictions}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={() => {
                        // Remove this supplementable marking
                        setSections(sections.filter(s => s.id !== section.id));
                        // Also remove the mark from the editor
                        if (editor) {
                          const doc = editor.state.doc;
                          let found = false;
                          doc.descendants((node, pos) => {
                            if (!found && node.marks.some(mark => 
                              mark.type.name === 'supplementMark' && 
                              mark.attrs['data-section-number'] === section.sectionNumber
                            )) {
                              editor.chain()
                                .focus()
                                .setTextSelection({ from: pos, to: pos + node.nodeSize })
                                .unsetMark('supplementMark')
                                .run();
                              found = true;
                            }
                          });
                        }
                      }}
                      title="Remove supplementable marking"
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}
    </>
  );
};

export default SupplementableSectionMarker;