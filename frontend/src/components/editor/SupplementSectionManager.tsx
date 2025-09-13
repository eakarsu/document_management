import React, { useState, useEffect } from 'react';
import { authTokenService } from '../../lib/authTokenService';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Chip,
  IconButton,
  Tooltip,
  Paper,
  Typography,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
  Stack
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  SwapHoriz as ReplaceIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  AutoAwesome as AIIcon,
  CheckCircle as ApplyIcon
} from '@mui/icons-material';

interface SupplementSection {
  id: string;
  parentSectionNumber: string;
  parentSectionTitle: string;
  action: 'ADD' | 'MODIFY' | 'REPLACE' | 'DELETE';
  content: string;
  rationale: string;
  organization: string;
  startIndex?: number;
  endIndex?: number;
}

interface SupplementSectionManagerProps {
  documentId: string;
  isSupplementDocument: boolean;
  organization?: string;
  editor: any; // TipTap editor instance
  onSectionMarked?: (section: SupplementSection) => void;
}

export const SupplementSectionManager: React.FC<SupplementSectionManagerProps> = ({
  documentId,
  isSupplementDocument,
  organization = '',
  editor,
  onSectionMarked
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sections, setSections] = useState<SupplementSection[]>([]);
  const [currentSection, setCurrentSection] = useState<Partial<SupplementSection>>({
    action: 'ADD',
    parentSectionNumber: '',
    parentSectionTitle: '',
    content: '',
    rationale: '',
    organization: organization
  });
  const [selectedText, setSelectedText] = useState('');
  const [showActionPopup, setShowActionPopup] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [organizationDetails, setOrganizationDetails] = useState({
    location: '',
    climate: '',
    mission: ''
  });

  // Listen for text selection in the editor
  useEffect(() => {
    if (!editor) return;

    const updateSelection = () => {
      const { from, to } = editor.state.selection;
      const text = editor.state.doc.textBetween(from, to, ' ');
      
      if (text && text.length > 0) {
        setSelectedText(text);
        setShowActionPopup(true);
      } else {
        setShowActionPopup(false);
      }
    };

    editor.on('selectionUpdate', updateSelection);
    return () => {
      editor.off('selectionUpdate', updateSelection);
    };
  }, [editor]);

  const handleMarkAsSuplement = async (action: 'ADD' | 'MODIFY' | 'REPLACE' | 'DELETE', useAI: boolean = false) => {
    setCurrentSection({
      ...currentSection,
      action,
      content: selectedText,
      organization: organization
    });
    
    if (useAI) {
      await generateAISuggestions(action);
    }
    
    setDialogOpen(true);
    setShowActionPopup(false);
  };

  const generateAISuggestions = async (action?: 'ADD' | 'MODIFY' | 'REPLACE' | 'DELETE') => {
    setLoadingAI(true);
    setShowAISuggestions(false);
    
    try {
      const response = await authTokenService.authenticatedFetch(
        `/api/editor/documents/${documentId}/supplement/ai-generate`,
        {
          method: 'POST',
          body: JSON.stringify({
            selectedText,
            sectionNumber: currentSection.parentSectionNumber,
            organization: organization,
            organizationType: 'BASE', // Could be dynamic
            location: organizationDetails.location,
            climate: organizationDetails.climate,
            mission: organizationDetails.mission,
            action: action,
            generateComplete: !!action
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAiSuggestions(data.suggestions || []);
        
        if (data.completeContent) {
          // If we have complete content, pre-fill the form
          setCurrentSection(prev => ({
            ...prev,
            content: data.completeContent.content,
            rationale: data.completeContent.rationale
          }));
        }
        
        setShowAISuggestions(true);
      }
    } catch (error) {
      console.error('Error generating AI suggestions:', error);
    } finally {
      setLoadingAI(false);
    }
  };

  const applyAISuggestion = (suggestion: any) => {
    setCurrentSection(prev => ({
      ...prev,
      action: suggestion.action,
      content: suggestion.content,
      rationale: suggestion.rationale,
      parentSectionNumber: suggestion.sectionNumber || prev.parentSectionNumber
    }));
    setShowAISuggestions(false);
  };

  const handleSaveSection = async () => {
    if (!currentSection.parentSectionNumber || !currentSection.rationale) {
      alert('Please fill in all required fields');
      return;
    }

    const newSection: SupplementSection = {
      id: `section_${Date.now()}`,
      parentSectionNumber: currentSection.parentSectionNumber!,
      parentSectionTitle: currentSection.parentSectionTitle || '',
      action: currentSection.action!,
      content: currentSection.content!,
      rationale: currentSection.rationale!,
      organization: currentSection.organization!
    };

    // Add visual marking to the selected text in the editor
    if (editor) {
      const { from, to } = editor.state.selection;
      
      // Apply custom mark/decoration based on action type
      const className = `supplement-${currentSection.action?.toLowerCase()}`;
      const label = `${currentSection.action}-${currentSection.organization}`;
      
      // Wrap selected text with a span that has the appropriate class
      editor.chain().focus().setMark('supplementMark', {
        class: className,
        'data-supplement': label,
        'data-section': currentSection.parentSectionNumber,
        'data-action': currentSection.action,
        'data-rationale': currentSection.rationale
      }).run();
    }

    setSections([...sections, newSection]);
    
    // Call parent callback if provided
    if (onSectionMarked) {
      onSectionMarked(newSection);
    }

    // Reset and close
    setDialogOpen(false);
    setCurrentSection({
      action: 'ADD',
      parentSectionNumber: '',
      parentSectionTitle: '',
      content: '',
      rationale: '',
      organization: organization
    });
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'ADD': return <AddIcon color="success" />;
      case 'MODIFY': return <EditIcon color="warning" />;
      case 'REPLACE': return <ReplaceIcon color="info" />;
      case 'DELETE': return <DeleteIcon color="error" />;
      default: return <BookmarkIcon />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'ADD': return 'success';
      case 'MODIFY': return 'warning';
      case 'REPLACE': return 'info';
      case 'DELETE': return 'error';
      default: return 'default';
    }
  };

  if (!isSupplementDocument) {
    return null; // Only show for supplement documents
  }

  return (
    <>
      {/* Action Selection Popup */}
      <Dialog
        open={showActionPopup}
        onClose={() => setShowActionPopup(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: 'visible'
          }
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', pt: 3 }}>
          <Typography variant="h5" fontWeight="bold">
            Select Supplement Action
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Choose how to mark the selected text
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pb: 3 }}>
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr',
            gap: 2,
            mt: 2
          }}>
            {/* ADD Button */}
            <Paper
              elevation={3}
              sx={{
                p: 3,
                cursor: 'pointer',
                transition: 'all 0.3s',
                background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
                color: 'white',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 20px rgba(76, 175, 80, 0.3)'
                }
              }}
              onClick={() => handleMarkAsSuplement('ADD')}
            >
              <Box sx={{ textAlign: 'center' }}>
                <AddIcon sx={{ fontSize: 48, mb: 1 }} />
                <Typography variant="h6" fontWeight="bold">
                  🟢 ADD
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, opacity: 0.95 }}>
                  Add new requirements after this section
                </Typography>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<AIIcon />}
                  sx={{ 
                    mt: 1.5, 
                    backgroundColor: 'rgba(255,255,255,0.3)',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.4)'
                    }
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMarkAsSuplement('ADD', true);
                  }}
                >
                  Generate with AI
                </Button>
              </Box>
            </Paper>

            {/* MODIFY Button */}
            <Paper
              elevation={3}
              sx={{
                p: 3,
                cursor: 'pointer',
                transition: 'all 0.3s',
                background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
                color: 'white',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 20px rgba(255, 152, 0, 0.3)'
                }
              }}
              onClick={() => handleMarkAsSuplement('MODIFY')}
            >
              <Box sx={{ textAlign: 'center' }}>
                <EditIcon sx={{ fontSize: 48, mb: 1 }} />
                <Typography variant="h6" fontWeight="bold">
                  🟠 MODIFY
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, opacity: 0.95 }}>
                  Add clarifications or restrictions
                </Typography>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<AIIcon />}
                  sx={{ 
                    mt: 1.5, 
                    backgroundColor: 'rgba(255,255,255,0.3)',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.4)'
                    }
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMarkAsSuplement('MODIFY', true);
                  }}
                >
                  Generate with AI
                </Button>
              </Box>
            </Paper>

            {/* REPLACE Button */}
            <Paper
              elevation={3}
              sx={{
                p: 3,
                cursor: 'pointer',
                transition: 'all 0.3s',
                background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
                color: 'white',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 20px rgba(33, 150, 243, 0.3)'
                }
              }}
              onClick={() => handleMarkAsSuplement('REPLACE')}
            >
              <Box sx={{ textAlign: 'center' }}>
                <ReplaceIcon sx={{ fontSize: 48, mb: 1 }} />
                <Typography variant="h6" fontWeight="bold">
                  🔵 REPLACE
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, opacity: 0.95 }}>
                  Replace with org-specific content
                </Typography>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<AIIcon />}
                  sx={{ 
                    mt: 1.5, 
                    backgroundColor: 'rgba(255,255,255,0.3)',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.4)'
                    }
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMarkAsSuplement('REPLACE', true);
                  }}
                >
                  Generate with AI
                </Button>
              </Box>
            </Paper>

            {/* DELETE Button */}
            <Paper
              elevation={3}
              sx={{
                p: 3,
                cursor: 'pointer',
                transition: 'all 0.3s',
                background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
                color: 'white',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 20px rgba(244, 67, 54, 0.3)'
                }
              }}
              onClick={() => handleMarkAsSuplement('DELETE')}
            >
              <Box sx={{ textAlign: 'center' }}>
                <DeleteIcon sx={{ fontSize: 48, mb: 1 }} />
                <Typography variant="h6" fontWeight="bold">
                  🔴 DELETE
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, opacity: 0.95 }}>
                  Mark as not applicable
                </Typography>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<AIIcon />}
                  sx={{ 
                    mt: 1.5, 
                    backgroundColor: 'rgba(255,255,255,0.3)',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.4)'
                    }
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMarkAsSuplement('DELETE', true);
                  }}
                >
                  Generate with AI
                </Button>
              </Box>
            </Paper>
          </Box>

          {/* Selected Text Preview */}
          <Paper variant="outlined" sx={{ p: 2, mt: 3, backgroundColor: 'grey.50' }}>
            <Typography variant="caption" color="text.secondary" fontWeight="bold">
              SELECTED TEXT:
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
              "{selectedText.substring(0, 150)}
              {selectedText.length > 150 && '...'}"
            </Typography>
          </Paper>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
          <Button 
            variant="outlined" 
            onClick={() => setShowActionPopup(false)}
            size="large"
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Section Marking Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Mark as Supplemental Section
          <IconButton
            sx={{ position: 'absolute', right: 8, top: 8 }}
            onClick={() => setDialogOpen(false)}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            {/* Action Type Display */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {getActionIcon(currentSection.action!)}
              <Chip
                label={currentSection.action}
                color={getActionColor(currentSection.action!)}
                variant="filled"
              />
              <Typography variant="body2" color="text.secondary">
                for {currentSection.organization || organization}
              </Typography>
            </Box>

            {/* Supplement Content Text Area - Added for AI-filled content */}
            {currentSection.content && currentSection.content !== selectedText && (
              <TextField
                label="Supplement Content"
                value={currentSection.content}
                onChange={(e) => setCurrentSection({
                  ...currentSection,
                  content: e.target.value
                })}
                multiline
                rows={6}
                fullWidth
                helperText="AI-generated or custom supplement content"
              />
            )}

            {/* Parent Section Number */}
            <TextField
              label="Parent Section Number"
              placeholder="e.g., 2.3.1"
              value={currentSection.parentSectionNumber}
              onChange={(e) => setCurrentSection({
                ...currentSection,
                parentSectionNumber: e.target.value
              })}
              helperText="Enter the section number from the parent document this relates to"
              required
              fullWidth
            />

            {/* Parent Section Title (Optional) */}
            <TextField
              label="Parent Section Title (Optional)"
              placeholder="e.g., Dress and Appearance Standards"
              value={currentSection.parentSectionTitle}
              onChange={(e) => setCurrentSection({
                ...currentSection,
                parentSectionTitle: e.target.value
              })}
              fullWidth
            />

            {/* Organization Context for AI */}
            <Paper variant="outlined" sx={{ p: 2, backgroundColor: 'info.light', color: 'white' }}>
              <Typography variant="caption" fontWeight="bold">ENHANCE AI SUGGESTIONS (OPTIONAL):</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, mt: 1 }}>
                <TextField
                  size="small"
                  placeholder="Location (e.g., Guam)"
                  value={organizationDetails.location}
                  onChange={(e) => setOrganizationDetails(prev => ({ ...prev, location: e.target.value }))}
                  sx={{ backgroundColor: 'white' }}
                />
                <TextField
                  size="small"
                  placeholder="Climate (e.g., Tropical)"
                  value={organizationDetails.climate}
                  onChange={(e) => setOrganizationDetails(prev => ({ ...prev, climate: e.target.value }))}
                  sx={{ backgroundColor: 'white' }}
                />
                <TextField
                  size="small"
                  placeholder="Mission (e.g., Strategic)"
                  value={organizationDetails.mission}
                  onChange={(e) => setOrganizationDetails(prev => ({ ...prev, mission: e.target.value }))}
                  sx={{ backgroundColor: 'white' }}
                />
              </Box>
            </Paper>

            {/* Selected Content Preview */}
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Selected Content:
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                {selectedText.substring(0, 200)}
                {selectedText.length > 200 && '...'}
              </Typography>
            </Paper>

            {/* Rationale */}
            <TextField
              label="Rationale"
              placeholder="Explain why this supplement is needed"
              value={currentSection.rationale}
              onChange={(e) => setCurrentSection({
                ...currentSection,
                rationale: e.target.value
              })}
              multiline
              rows={3}
              helperText="Required: Provide justification for this supplemental section"
              required
              fullWidth
            />

            {/* AI Generation Button */}
            {!loadingAI && !showAISuggestions && (
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  startIcon={<AIIcon />}
                  onClick={() => generateAISuggestions(currentSection.action)}
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white'
                  }}
                >
                  Generate AI Suggestions
                </Button>
              </Box>
            )}

            {/* Loading AI */}
            {loadingAI && (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
                <CircularProgress size={24} />
                <Typography>Generating AI suggestions...</Typography>
              </Box>
            )}

            {/* AI Suggestions */}
            {showAISuggestions && aiSuggestions.length > 0 && (
              <Box>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AIIcon color="primary" />
                  AI Suggestions
                </Typography>
                <Stack spacing={2}>
                  {aiSuggestions.map((suggestion, index) => (
                    <Card key={index} variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Chip
                            label={suggestion.action}
                            color={getActionColor(suggestion.action)}
                            size="small"
                          />
                          <Typography variant="caption" color="text.secondary">
                            Confidence: {suggestion.confidence}%
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          {suggestion.content.substring(0, 200)}
                          {suggestion.content.length > 200 && '...'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          <strong>Rationale:</strong> {suggestion.rationale}
                        </Typography>
                      </CardContent>
                      <CardActions>
                        <Button
                          size="small"
                          startIcon={<ApplyIcon />}
                          onClick={() => applyAISuggestion(suggestion)}
                          color="primary"
                        >
                          Apply This Suggestion
                        </Button>
                      </CardActions>
                    </Card>
                  ))}
                </Stack>
              </Box>
            )}

            {/* Action-specific guidance */}
            <Alert severity="info">
              {currentSection.action === 'ADD' && (
                <>
                  <strong>Adding Content:</strong> This will add new requirements or guidance after section {currentSection.parentSectionNumber}. 
                  The content will be numbered as {currentSection.parentSectionNumber}.1 (Added-{organization}).
                </>
              )}
              {currentSection.action === 'MODIFY' && (
                <>
                  <strong>Modifying Content:</strong> This will add additional requirements to section {currentSection.parentSectionNumber}. 
                  The original content remains, with your modifications clearly marked.
                </>
              )}
              {currentSection.action === 'REPLACE' && (
                <>
                  <strong>Replacing Content:</strong> This will completely replace section {currentSection.parentSectionNumber} with new content. 
                  Use only when the original doesn't apply to your organization.
                </>
              )}
              {currentSection.action === 'DELETE' && (
                <>
                  <strong>Deleting Content:</strong> This marks section {currentSection.parentSectionNumber} as not applicable. 
                  The section will be struck through with your rationale displayed.
                </>
              )}
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveSection}
            disabled={!currentSection.parentSectionNumber || !currentSection.rationale}
          >
            Mark Section
          </Button>
        </DialogActions>
      </Dialog>

      {/* Marked Sections List (Optional - can be shown in a sidebar) */}
      {sections.length > 0 && (
        <Paper
          sx={{
            position: 'fixed',
            right: 20,
            top: 100,
            width: 300,
            maxHeight: 400,
            overflow: 'auto',
            p: 2,
            zIndex: 1000
          }}
          elevation={3}
        >
          <Typography variant="h6" gutterBottom>
            Marked Sections ({sections.length})
          </Typography>
          <List dense>
            {sections.map((section) => (
              <React.Fragment key={section.id}>
                <ListItem
                  button
                  onClick={() => {
                    // Find and scroll to the marked text in the editor
                    const marked = document.querySelector(`[data-section="${section.parentSectionNumber}"]`);
                    if (marked) {
                      marked.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      // Add a brief highlight animation
                      marked.classList.add('newly-added');
                      setTimeout(() => marked.classList.remove('newly-added'), 1000);
                    }
                  }}
                  sx={{
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    }
                  }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getActionIcon(section.action)}
                        <Typography variant="body2">
                          {section.parentSectionNumber}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="caption" component="div">
                          {section.action} - {section.organization}
                        </Typography>
                        <Typography variant="caption" component="div" sx={{ fontStyle: 'italic' }}>
                          {section.rationale}
                        </Typography>
                      </>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Remove this section
                        setSections(sections.filter(s => s.id !== section.id));
                        // Also remove the mark from the editor
                        if (editor) {
                          const doc = editor.state.doc;
                          let found = false;
                          doc.descendants((node, pos) => {
                            if (!found && node.marks.some(mark => 
                              mark.type.name === 'supplementMark' && 
                              mark.attrs['data-section'] === section.parentSectionNumber
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
                      title="Remove this marking"
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

export default SupplementSectionManager;