'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { authTokenService } from '../../../../lib/authTokenService';
import DocumentNumbering from '../../../../components/DocumentNumbering';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  MenuItem,
  Grid,
  Alert,
  AppBar,
  Toolbar,
  IconButton,
  Chip,
  List,
  ListItem,
  Divider,
  FormControl,
  InputLabel,
  Select,
  FormGroup,
  FormControlLabel,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Tooltip,
  Menu
} from '@mui/material';
import {
  ArrowBack,
  Delete as DeleteIcon,
  Send as SendIcon,
  Description as DocumentIcon,
  Comment as CommentIcon,
  Merge as MergeIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  AutoAwesome as AIIcon,
  Build as ManualIcon,
  Psychology as HybridIcon,
  Download as DownloadIcon,
  PictureAsPdf as PdfIcon,
  TextFields as TextIcon,
  Code as HtmlIcon,
  CheckCircle as AcceptIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
  Add as AddIcon
} from '@mui/icons-material';

interface CRMComment {
  id?: string;
  component: string;
  pocName: string;
  pocPhone: string;
  pocEmail: string;
  commentType: string;
  page: string;
  paragraphNumber: string;
  lineNumber: string;
  coordinatorComment: string;
  changeFrom: string;
  changeTo: string;
  coordinatorJustification: string;
  resolution?: string;
  originatorJustification?: string;
  status?: 'pending' | 'accepted' | 'rejected' | 'merged';
}

const OPRReviewPage = () => {
  const router = useRouter();
  const params = useParams();
  const documentId = params?.id as string;
  
  const [documentData, setDocumentData] = useState<any>(null);
  const [documentContent, setDocumentContent] = useState<string>('');
  const [editableContent, setEditableContent] = useState<string>('');
  const [isEditingDocument, setIsEditingDocument] = useState(false);
  const [feedback, setFeedback] = useState<CRMComment[]>([]);
  const [selectedFeedback, setSelectedFeedback] = useState<CRMComment | null>(null);
  const [mergeMode, setMergeMode] = useState<'manual' | 'ai' | 'hybrid'>('manual');
  const [exportAnchorEl, setExportAnchorEl] = useState<null | HTMLElement>(null);
  const [exporting, setExporting] = useState(false);
  const [processingMerge, setProcessingMerge] = useState(false);
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [mergeResult, setMergeResult] = useState<string>('');
  const [mergeResultContent, setMergeResultContent] = useState<string>(''); // Store actual content separately
  const [savingDocument, setSavingDocument] = useState(false);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [showParagraphNumbers, setShowParagraphNumbers] = useState(true);
  const [showPageNumbers, setShowPageNumbers] = useState(true);
  
  // OPR response fields
  const [currentComment, setCurrentComment] = useState<CRMComment>({
    component: '',
    pocName: '',
    pocPhone: '',
    pocEmail: '',
    commentType: 'S',
    page: '',
    paragraphNumber: '',
    lineNumber: '',
    coordinatorComment: '',
    changeFrom: '',
    changeTo: '',
    coordinatorJustification: '',
    resolution: '',
    originatorJustification: ''
  });

  useEffect(() => {
    // Fetch document and feedback
    const fetchDocumentAndFeedback = async () => {
      try {
        let hasFeedbackFromDoc = false;
        
        // Fetch document
        const docResponse = await authTokenService.authenticatedFetch(`/api/documents/${documentId}`);
        if (docResponse.ok) {
          const data = await docResponse.json();
          const doc = data.document || data;
          setDocumentData(doc);
          
          // Get content
          let content = '';
          if (doc.customFields?.content) {
            content = doc.customFields.content;
          } else if (doc.content) {
            content = doc.content;
          } else if (doc.description) {
            content = `<p>${doc.description}</p>`;
          }
          
          // Check for duplicates WHEN LOADING
          const h1CountOnLoad = (content.match(/<h1>/g) || []).length;
          const sectionICountOnLoad = (content.match(/SECTION I - INTRODUCTION/g) || []).length;
          
          setDocumentContent(content);
          setEditableContent(content);
          
          // DEBUG: Log what we're loading
          console.log('Loading document content:', {
            contentLength: content.length,
            hasContent: !!content,
            contentSource: doc.customFields?.content ? 'customFields.content' : 
                          doc.content ? 'content' : 
                          doc.description ? 'description' : 'unknown',
            first100: content.substring(0, 100),
            rawCustomFieldsLength: doc.customFields?.content?.length || 0,
            fullDocSize: JSON.stringify(doc).length,
            h1Count: h1CountOnLoad,
            sectionICount: sectionICountOnLoad,
            hasDuplicates: h1CountOnLoad > 1 || sectionICountOnLoad > 1 ? '❌ YES' : '✅ NO'
          });
          
          if (h1CountOnLoad > 1 || sectionICountOnLoad > 1) {
            console.error('❌ CRITICAL: Document loaded from database ALREADY HAS DUPLICATES!');
            console.error('  - H1 headers:', h1CountOnLoad);
            console.error('  - Section I occurrences:', sectionICountOnLoad);
          }
          
          // Load feedback from document's customFields
          if (doc.customFields && typeof doc.customFields === 'object') {
            const customFields = doc.customFields as any;
            
            // Check for draftFeedback (from Review & CRM page)
            if (customFields.draftFeedback && Array.isArray(customFields.draftFeedback)) {
              setFeedback(customFields.draftFeedback);
              console.log('Loaded', customFields.draftFeedback.length, 'draft feedback items from database');
              hasFeedbackFromDoc = true;
            } 
            // Also check for submitted feedback
            else if (customFields.feedback && Array.isArray(customFields.feedback)) {
              setFeedback(customFields.feedback);
              console.log('Loaded', customFields.feedback.length, 'feedback items from database');
              hasFeedbackFromDoc = true;
            }
            // Check for comments
            else if (customFields.comments && Array.isArray(customFields.comments)) {
              setFeedback(customFields.comments);
              console.log('Loaded', customFields.comments.length, 'comments from database');
              hasFeedbackFromDoc = true;
            } else {
              console.log('No feedback found in database customFields');
            }
          }
        }
        
        // Also try to fetch from feedback endpoint (for submitted feedback)
        // Only if we haven't found any feedback in customFields
        if (!hasFeedbackFromDoc) {
          try {
            const feedbackResponse = await authTokenService.authenticatedFetch(`/api/documents/${documentId}/feedback`);
            if (feedbackResponse.ok) {
              const feedbackData = await feedbackResponse.json();
              if (feedbackData.feedback && Array.isArray(feedbackData.feedback)) {
                setFeedback(feedbackData.feedback);
                console.log('Loaded feedback from API endpoint');
              } else if (feedbackData.comments && Array.isArray(feedbackData.comments)) {
                setFeedback(feedbackData.comments);
                console.log('Loaded comments from API endpoint');
              }
            }
          } catch (error) {
            console.log('Could not fetch from feedback endpoint:', error);
          }
        }
      } catch (error) {
        console.error('Error fetching document or feedback:', error);
      }
    };
    
    fetchDocumentAndFeedback();
  }, [documentId, router]);

  const handleFeedbackClick = (comment: CRMComment) => {
    setSelectedFeedback(comment);
    setCurrentComment(comment);
  };

  const handleMergeModeChange = (event: React.MouseEvent<HTMLElement>, newMode: 'manual' | 'ai' | 'hybrid' | null) => {
    if (newMode !== null) {
      setMergeMode(newMode);
    }
  };

  const handleMergeFeedback = async () => {
    if (!selectedFeedback) return;
    
    console.log('=== FRONTEND MERGE DEBUG ===');
    console.log('Selected Feedback:', selectedFeedback);
    console.log('Merge Mode:', mergeMode);
    console.log('Document Content Length:', editableContent.length);
    
    setProcessingMerge(true);
    setShowMergeDialog(true);
    
    try {
      // Get the numbered HTML from the DocumentNumbering component
      // We need to get the processed HTML with data-paragraph attributes
      // For now, we'll send the raw content but the API will process it
      // CRITICAL FIX: Always send the current editableContent which has all previous merges
      // The editableContent is the source of truth for the current state
      const documentContentToSend = editableContent;
      
      // Check document BEFORE sending to backend
      const h1CountBefore = (documentContentToSend.match(/<h1>/g) || []).length;
      const sectionICountBefore = (documentContentToSend.match(/SECTION I - INTRODUCTION/g) || []).length;
      console.log('BEFORE SENDING TO BACKEND:');
      console.log('  - H1 count:', h1CountBefore, h1CountBefore > 1 ? '❌ ALREADY HAS DUPLICATES!' : '✅');
      console.log('  - Section I count:', sectionICountBefore, sectionICountBefore > 1 ? '❌ ALREADY HAS DUPLICATES!' : '✅');
      
      if (h1CountBefore > 1 || sectionICountBefore > 1) {
        console.error('❌ CRITICAL: Sending corrupted content to backend!');
        console.error('The editableContent already has duplicates before merge!');
      }
      
      console.log('Sending to backend:', {
        mode: mergeMode,
        hasChangeFrom: !!selectedFeedback.changeFrom,
        hasChangeTo: !!selectedFeedback.changeTo,
        page: selectedFeedback.page,
        paragraph: selectedFeedback.paragraphNumber,
        line: selectedFeedback.lineNumber,
        contentSource: 'editable (current state)',
        contentLength: documentContentToSend.length,
        documentDataContentLength: documentData?.customFields?.content?.length || 0,
        editableContentLength: editableContent.length
      });
      
      if (mergeMode === 'ai') {
        // AI merge - Call the BACKEND endpoint through our proxy
        console.log('🤖 AI MERGE DEBUG - Starting AI merge');
        console.log('  - Feedback ID:', selectedFeedback.id);
        console.log('  - Current content length:', documentContentToSend.length);
        console.log('  - Current feedback count:', feedback.length);
        console.log('  - Change From:', selectedFeedback.changeFrom);
        console.log('  - Change To:', selectedFeedback.changeTo);
        
        // Create a simple proxy endpoint that just forwards to backend
        const response = await authTokenService.authenticatedFetch('/api/backend-proxy/feedback-processor/merge', {
          method: 'POST',
          body: JSON.stringify({
            documentContent: documentContentToSend,
            feedback: selectedFeedback,
            mode: 'ai'
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('AI Merge Response:', result);
          console.log('  - Merged content length:', result.mergedContent?.length);
          console.log('  - Content changed:', result.mergedContent !== documentContentToSend);
          
          // Check for duplicates in the merged content
          const h1CountAfter = (result.mergedContent.match(/<h1>/g) || []).length;
          const sectionICountAfter = (result.mergedContent.match(/SECTION I - INTRODUCTION/g) || []).length;
          console.log('  - AFTER MERGE - H1 count:', h1CountAfter, 'Section I count:', sectionICountAfter);
          
          if (h1CountAfter > 1 || sectionICountAfter > 1) {
            console.error('❌ DUPLICATE SECTIONS DETECTED IN MERGED CONTENT!');
            console.error('  - H1 headers:', h1CountAfter);
            console.error('  - Section I occurrences:', sectionICountAfter);
            console.error('  - This means the backend returned corrupted content');
          }
          
          // CRITICAL: Update BOTH editableContent AND documentData.customFields.content
          // This ensures the next merge uses the updated content, just like automated tests
          setEditableContent(result.mergedContent);
          console.log('  - Updated editableContent');
          
          // Update the document data with merged content for next merge
          if (documentData) {
            console.log('  - Updating documentData state');
            setDocumentData(prevData => ({
              ...prevData,
              customFields: {
                ...prevData.customFields,
                content: result.mergedContent  // This is critical for subsequent merges
              }
            }));
          }
          
          // Save to database immediately to ensure consistency
          // MUST save the updated feedback list too!
          const remainingFeedback = feedback.filter(f => f.id !== selectedFeedback.id);
          console.log('  - Remaining feedback count:', remainingFeedback.length);
          console.log('  - Saving to database with updated feedback list');
          
          await authTokenService.authenticatedFetch(`/api/documents/${documentId}`, {
            method: 'PATCH',
            body: JSON.stringify({
              customFields: {
                content: result.mergedContent,
                draftFeedback: remainingFeedback,
                lastAIMerge: new Date().toISOString()
              }
            })
          });
          
          console.log('  - AI merge completed successfully');
          setMergeResult('✅ AI merge completed successfully. The document has been updated with the improved content.');
          
          // Save to database like automated test does
          // Note: Frontend doesn't have a document update endpoint, so we'll skip this for now
          // The automated tests save directly via Prisma, but frontend can't do that
          console.log('Note: Document save skipped - frontend API route not available');
          // In production, you'd implement a proper update endpoint or save on final submit
        } else {
          console.error('AI Merge failed:', response.status, response.statusText);
        }
      } else if (mergeMode === 'hybrid') {
        // Hybrid merge - AI suggestion with manual review
        const response = await authTokenService.authenticatedFetch('/api/feedback-processor/merge', {
          method: 'POST',
          body: JSON.stringify({
            documentContent: documentContentToSend,
            feedback: selectedFeedback,
            mode: 'hybrid'
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          // Store the actual merged content for later application
          setMergeResultContent(result.suggestedContent || result.mergedContent);
          // Show a user-friendly message in the dialog
          setMergeResult('🤖 Hybrid AI suggestion generated successfully. The AI has analyzed the feedback and created an improved version. Click "Apply Suggestion" below to update the document.');
        }
      } else {
        // Manual merge
        console.log('🔧 MANUAL MERGE DEBUG - Starting manual merge');
        console.log('  - Feedback ID:', selectedFeedback.id);
        console.log('  - Change From:', selectedFeedback.changeFrom);
        console.log('  - Change To:', selectedFeedback.changeTo);
        console.log('  - Current content length:', editableContent.length);
        console.log('  - Current feedback count:', feedback.length);
        
        if (selectedFeedback.changeTo) {
          const occurrences = (editableContent.match(new RegExp(selectedFeedback.changeFrom?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') || '', 'g')) || []).length;
          console.log('  - Occurrences found:', occurrences);
          
          const newContent = editableContent.replaceAll(
            selectedFeedback.changeFrom || '',
            selectedFeedback.changeTo
          );
          console.log('  - New content length:', newContent.length);
          console.log('  - Content changed:', newContent !== editableContent);
          
          setEditableContent(newContent);
          
          // Update the document data with merged content for next merge
          if (documentData) {
            console.log('  - Updating documentData state');
            setDocumentData(prevData => ({
              ...prevData,
              customFields: {
                ...prevData.customFields,
                content: newContent  // Keep documentData in sync
              }
            }));
          }
          
          // Get the updated feedback list (removing current item)
          const updatedFeedback = feedback.filter(f => f.id !== selectedFeedback.id);
          console.log('  - Updated feedback count:', updatedFeedback.length);
          
          // Also save to database immediately to persist the change AND update feedback list
          console.log('  - Saving to database with updated feedback list');
          await authTokenService.authenticatedFetch(`/api/documents/${documentId}`, {
            method: 'PATCH',
            body: JSON.stringify({
              customFields: {
                content: newContent,
                draftFeedback: updatedFeedback,  // Save the updated feedback list
                lastManualMerge: new Date().toISOString()
              }
            })
          });
          
          console.log('  - Manual merge completed successfully');
          setMergeResult('✅ Manual merge completed successfully.');
        } else {
          console.log('  - No changeTo value, skipping merge');
        }
      }
      
      // REMOVE the merged feedback from the list entirely
      console.log('📝 REMOVING FEEDBACK FROM UI LIST');
      console.log('  - Before removal: feedback count =', feedback.length);
      console.log('  - Removing feedback ID:', selectedFeedback.id);
      const updatedFeedback = feedback.filter(f => f.id !== selectedFeedback.id);
      console.log('  - After removal: feedback count =', updatedFeedback.length);
      setFeedback(updatedFeedback);
      
      // Also update documentData to remove the feedback
      if (documentData) {
        console.log('  - Updating documentData.customFields.draftFeedback');
        setDocumentData(prevData => ({
          ...prevData,
          customFields: {
            ...prevData.customFields,
            draftFeedback: updatedFeedback
          }
        }));
      }
      
    } catch (error) {
      console.error('Error merging feedback:', error);
      setMergeResult('Error merging feedback');
    } finally {
      setProcessingMerge(false);
    }
  };

  const handleSaveResponse = async () => {
    if (!selectedFeedback) return;
    
    try {
      // Update feedback with OPR response
      const updatedFeedback = {
        ...currentComment,
        id: selectedFeedback.id,
        status: currentComment.resolution ? 'accepted' : 'pending'
      };
      
      // Update local state
      const updatedList = feedback.map(f => 
        f.id === selectedFeedback.id ? updatedFeedback : f
      );
      setFeedback(updatedList);
      setSelectedFeedback(updatedFeedback);
      
      // Save to database
      const response = await authTokenService.authenticatedFetch(`/api/documents/${documentId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          customFields: {
            draftFeedback: updatedList,
            lastOPRUpdate: new Date().toISOString()
          }
        })
      });
      
      if (response.ok) {
        alert('Response saved successfully');
      }
    } catch (error) {
      console.error('Error saving response:', error);
      alert('Failed to save response');
    }
  };

  const handleExport = async (format: string) => {
    setExporting(true);
    setExportAnchorEl(null);
    
    try {
      const response = await authTokenService.authenticatedFetch(`/api/documents/${documentId}/export`, {
        method: 'POST',
        body: JSON.stringify({ 
          format,
          includeNumbering: showParagraphNumbers 
        })
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // Set filename based on format
        const filename = `${documentData?.title?.replace(/[^a-z0-9]/gi, '_') || 'document'}.${format}`;
        a.download = filename;
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        alert('Failed to export document');
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export document');
    } finally {
      setExporting(false);
    }
  };

  const handleSaveDocument = async () => {
    setSavingDocument(true);
    
    try {
      const response = await authTokenService.authenticatedFetch(`/api/documents/${documentId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          customFields: {
            content: editableContent,
            lastOPRUpdate: new Date().toISOString()
          }
        })
      });
      
      if (response.ok) {
        setDocumentContent(editableContent);
        setIsEditingDocument(false);
        alert('Document updated successfully');
      } else {
        alert('Failed to save document');
      }
    } catch (error) {
      console.error('Error saving document:', error);
      alert('Error saving document');
    } finally {
      setSavingDocument(false);
    }
  };

  const getCommentTypeColor = (type: string) => {
    switch(type) {
      case 'C': return 'error';
      case 'M': return 'warning';
      case 'S': return 'info';
      case 'A': return 'success';
      default: return 'default';
    }
  };

  const getCommentTypeLabel = (type: string) => {
    switch(type) {
      case 'C': return 'Critical';
      case 'M': return 'Major';
      case 'S': return 'Substantive';
      case 'A': return 'Administrative';
      default: return type;
    }
  };

  const getStatusColor = (status?: string) => {
    switch(status) {
      case 'accepted': return 'success';
      case 'rejected': return 'error';
      case 'merged': return 'info';
      default: return 'default';
    }
  };

  return (
    <>
      <AppBar position="sticky" color="primary">
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => router.push(`/documents/${documentId}`)}>
            <ArrowBack />
          </IconButton>
          <DocumentIcon sx={{ ml: 2, mr: 1 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            OPR Review: {documentData?.title || 'Loading...'}
          </Typography>
          <Button 
            color="inherit" 
            variant={isEditingDocument ? "contained" : "outlined"}
            onClick={() => setIsEditingDocument(!isEditingDocument)}
            startIcon={<EditIcon />}
            sx={{ mr: 2 }}
          >
            {isEditingDocument ? 'View Mode' : 'Edit Document'}
          </Button>
          {isEditingDocument && (
            <Button 
              color="inherit" 
              variant="contained"
              onClick={handleSaveDocument}
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
            onClick={(e) => setExportAnchorEl(e.currentTarget)}
            disabled={exporting}
            startIcon={exporting ? <CircularProgress size={20} /> : <DownloadIcon />}
          >
            Export
          </Button>
          <Menu
            anchorEl={exportAnchorEl}
            open={Boolean(exportAnchorEl)}
            onClose={() => setExportAnchorEl(null)}
          >
            <MenuItem onClick={() => handleExport('pdf')}>
              <PdfIcon sx={{ mr: 1 }} /> Export as PDF
            </MenuItem>
            <MenuItem onClick={() => handleExport('docx')}>
              <DocumentIcon sx={{ mr: 1 }} /> Export as Word
            </MenuItem>
            <MenuItem onClick={() => handleExport('txt')}>
              <TextIcon sx={{ mr: 1 }} /> Export as Text
            </MenuItem>
            <MenuItem onClick={() => handleExport('html')}>
              <HtmlIcon sx={{ mr: 1 }} /> Export as HTML
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
        {/* Left Side: Document Viewer/Editor */}
        <Box sx={{ flex: 1, overflow: 'auto', borderRight: 2, borderColor: 'divider', bgcolor: 'grey.50' }}>
          <Paper sx={{ m: 3, p: 4, minHeight: 'calc(100% - 48px)' }}>
            {documentData ? (
              <>
                <Typography variant="h4" gutterBottom color="primary">
                  {documentData.title}
                </Typography>
                <Box sx={{ mb: 3, pb: 2, borderBottom: '2px solid', borderColor: 'primary.main' }}>
                  <Grid container spacing={2}>
                    <Grid item>
                      <Typography variant="caption" color="text.secondary">Category:</Typography>
                      <Typography variant="body2">{documentData.category || 'Not specified'}</Typography>
                    </Grid>
                    <Grid item>
                      <Typography variant="caption" color="text.secondary">Version:</Typography>
                      <Typography variant="body2">{documentData.currentVersion || '1'}</Typography>
                    </Grid>
                    <Grid item>
                      <Typography variant="caption" color="text.secondary">Status:</Typography>
                      <Typography variant="body2">{documentData.status}</Typography>
                    </Grid>
                  </Grid>
                </Box>
                
                {/* Numbering Controls */}
                {!isEditingDocument && (
                  <Box sx={{ mb: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Document Numbering for Feedback Reference:
                    </Typography>
                    <FormGroup row>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={showLineNumbers}
                            onChange={(e) => setShowLineNumbers(e.target.checked)}
                            size="small"
                          />
                        }
                        label="Line Numbers"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={showParagraphNumbers}
                            onChange={(e) => setShowParagraphNumbers(e.target.checked)}
                            size="small"
                          />
                        }
                        label="Paragraph Numbers"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={showPageNumbers}
                            onChange={(e) => setShowPageNumbers(e.target.checked)}
                            size="small"
                          />
                        }
                        label="Page Numbers"
                      />
                    </FormGroup>
                  </Box>
                )}
                
                {/* Document Content */}
                {isEditingDocument ? (
                  <TextField
                    fullWidth
                    multiline
                    value={editableContent}
                    onChange={(e) => setEditableContent(e.target.value)}
                    variant="outlined"
                    sx={{ fontFamily: 'monospace' }}
                  />
                ) : (
                  <DocumentNumbering
                    content={editableContent}
                    enableLineNumbers={showLineNumbers}
                    enableParagraphNumbers={showParagraphNumbers}
                    enablePageNumbers={showPageNumbers}
                    linesPerPage={50}
                  />
                )}
              </>
            ) : (
              <Box sx={{ p: 5, textAlign: 'center' }}>
                <CircularProgress />
                <Typography color="text.secondary" sx={{ mt: 2 }}>Loading document...</Typography>
              </Box>
            )}
          </Paper>
        </Box>

        {/* Right Side: OPR Response Form and Feedback List */}
        <Box sx={{ width: '600px', overflow: 'auto', p: 3, bgcolor: 'background.default' }}>
          {/* Merge Mode Selection */}
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Merge Mode
            </Typography>
            <ToggleButtonGroup
              value={mergeMode}
              exclusive
              onChange={handleMergeModeChange}
              fullWidth
            >
              <ToggleButton value="manual">
                <ManualIcon sx={{ mr: 1 }} />
                Manual
              </ToggleButton>
              <ToggleButton value="ai">
                <AIIcon sx={{ mr: 1 }} />
                AI-Assisted
              </ToggleButton>
              <ToggleButton value="hybrid">
                <HybridIcon sx={{ mr: 1 }} />
                Hybrid
              </ToggleButton>
            </ToggleButtonGroup>
            
            {selectedFeedback && (
              <>
                {/* Text Preview Section */}
                <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    📍 Location: Page {selectedFeedback.page || '?'}, Para {selectedFeedback.paragraphNumber || '?'}, Line {selectedFeedback.lineNumber || '?'}
                  </Typography>
                  
                  {selectedFeedback.changeFrom && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="error" fontWeight="bold">
                        ❌ Original Text (to be replaced):
                      </Typography>
                      <Paper sx={{ p: 1, mt: 0.5, bgcolor: 'error.50', border: '1px solid', borderColor: 'error.main' }}>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                          {selectedFeedback.changeFrom}
                        </Typography>
                      </Paper>
                    </Box>
                  )}
                  
                  {selectedFeedback.changeTo && (
                    <Box>
                      <Typography variant="caption" color="success.main" fontWeight="bold">
                        ✅ Replacement Text (AI will enhance this):
                      </Typography>
                      <Paper sx={{ p: 1, mt: 0.5, bgcolor: 'success.50', border: '1px solid', borderColor: 'success.main' }}>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                          {selectedFeedback.changeTo}
                        </Typography>
                      </Paper>
                    </Box>
                  )}
                  
                  {!selectedFeedback.changeFrom && !selectedFeedback.changeTo && (
                    <Alert severity="info" sx={{ mt: 1 }}>
                      <Typography variant="body2">
                        No specific text changes provided. The AI will attempt to locate and improve text at the specified paragraph location based on the feedback comment:
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                        "{selectedFeedback.coordinatorComment}"
                      </Typography>
                    </Alert>
                  )}
                  
                  {mergeMode === 'ai' && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      AI will process this feedback and generate an improved version based on the context and requirements.
                    </Alert>
                  )}
                </Box>
                
                <Button
                  variant="contained"
                  fullWidth
                  sx={{ mt: 2 }}
                  startIcon={<MergeIcon />}
                  onClick={handleMergeFeedback}
                  disabled={!selectedFeedback || processingMerge}
                >
                  {processingMerge ? 'Processing...' : 'Merge Selected Feedback'}
                </Button>
              </>
            )}
          </Paper>

          {/* OPR Response Form */}
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              OPR Response Form
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              {/* Column 1: Component and POC */}
              <Grid item xs={12}>
                <Typography variant="caption" color="primary">
                  COLUMN 1: Component & POC
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Component *"
                  value={currentComment.component}
                  onChange={(e) => setCurrentComment({ ...currentComment, component: e.target.value })}
                  placeholder="AF/A1"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="POC Name"
                  value={currentComment.pocName}
                  onChange={(e) => setCurrentComment({ ...currentComment, pocName: e.target.value })}
                  placeholder="Col Smith"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="POC Phone"
                  value={currentComment.pocPhone}
                  onChange={(e) => setCurrentComment({ ...currentComment, pocPhone: e.target.value })}
                  placeholder="555-0100"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="POC Email"
                  value={currentComment.pocEmail}
                  onChange={(e) => setCurrentComment({ ...currentComment, pocEmail: e.target.value })}
                  placeholder="smith@af.mil"
                />
              </Grid>

              {/* Column 2: Comment Type */}
              <Grid item xs={12}>
                <Typography variant="caption" color="primary">
                  COLUMN 2: Comment Type
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth size="small" required>
                  <InputLabel>Type *</InputLabel>
                  <Select
                    value={currentComment.commentType}
                    onChange={(e) => setCurrentComment({ ...currentComment, commentType: e.target.value })}
                    label="Type *"
                  >
                    <MenuItem value="C">🔴 Critical (Non-concur if not resolved)</MenuItem>
                    <MenuItem value="M">🟠 Major (Significant issue)</MenuItem>
                    <MenuItem value="S">🔵 Substantive (Important)</MenuItem>
                    <MenuItem value="A">🟢 Administrative (Minor)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Columns 3-5: Location */}
              <Grid item xs={12}>
                <Typography variant="caption" color="primary">
                  COLUMNS 3-5: Location in Document
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Page"
                  value={currentComment.page}
                  onChange={(e) => setCurrentComment({ ...currentComment, page: e.target.value })}
                  placeholder="12"
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Paragraph"
                  value={currentComment.paragraphNumber}
                  onChange={(e) => setCurrentComment({ ...currentComment, paragraphNumber: e.target.value })}
                  placeholder="3.2.1"
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Line"
                  value={currentComment.lineNumber}
                  onChange={(e) => setCurrentComment({ ...currentComment, lineNumber: e.target.value })}
                  placeholder="15-18"
                />
              </Grid>

              {/* Column 6: Comments */}
              <Grid item xs={12}>
                <Typography variant="caption" color="primary">
                  COLUMN 6: Comments & Justification
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  size="small"
                  label="Comment/Issue"
                  value={currentComment.coordinatorComment}
                  onChange={(e) => setCurrentComment({ ...currentComment, coordinatorComment: e.target.value })}
                  placeholder="Describe the issue..."
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  size="small"
                  label="Change From"
                  value={currentComment.changeFrom}
                  onChange={(e) => setCurrentComment({ ...currentComment, changeFrom: e.target.value })}
                  placeholder="Current text..."
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  size="small"
                  label="Change To"
                  value={currentComment.changeTo}
                  onChange={(e) => setCurrentComment({ ...currentComment, changeTo: e.target.value })}
                  placeholder="Suggested text..."
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  size="small"
                  label="Coordinator Justification"
                  value={currentComment.coordinatorJustification}
                  onChange={(e) => setCurrentComment({ ...currentComment, coordinatorJustification: e.target.value })}
                  placeholder="Why this change is needed..."
                />
              </Grid>

              {/* OPR Response Fields */}
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="caption" color="secondary">
                  OPR RESPONSE:
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  size="small"
                  label="OPR Resolution"
                  value={currentComment.resolution}
                  onChange={(e) => setCurrentComment({ ...currentComment, resolution: e.target.value })}
                  placeholder="How this feedback will be addressed..."
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  size="small"
                  label="Originator Justification"
                  value={currentComment.originatorJustification}
                  onChange={(e) => setCurrentComment({ ...currentComment, originatorJustification: e.target.value })}
                  placeholder="Rationale for the resolution..."
                />
              </Grid>

              <Grid item xs={12}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<SaveIcon />}
                  onClick={handleSaveResponse}
                  disabled={!selectedFeedback}
                >
                  Save OPR Response
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {/* Feedback List */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Comment Matrix ({feedback.length})
            </Typography>
            
            {feedback.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
                No feedback available
              </Box>
            ) : (
              <List>
                {feedback.map((comment, index) => (
                  <ListItem
                    key={comment.id}
                    sx={{ 
                      mb: 1, 
                      border: 1, 
                      borderColor: selectedFeedback?.id === comment.id ? 'primary.main' : 'divider',
                      borderRadius: 1,
                      display: 'block',
                      p: 2,
                      cursor: 'pointer',
                      bgcolor: selectedFeedback?.id === comment.id ? 'primary.50' : 'background.paper',
                      '&:hover': {
                        bgcolor: 'grey.50'
                      }
                    }}
                    onClick={() => handleFeedbackClick(comment)}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
                        #{index + 1} - {comment.component}
                      </Typography>
                      <Chip 
                        label={getCommentTypeLabel(comment.commentType)}
                        color={getCommentTypeColor(comment.commentType) as any}
                        size="small"
                        sx={{ mr: 1 }}
                      />
                      {comment.status && (
                        <Chip 
                          label={comment.status}
                          color={getStatusColor(comment.status) as any}
                          size="small"
                        />
                      )}
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      📍 Page {comment.page || '-'}, Para {comment.paragraphNumber || '-'}, Line {comment.lineNumber || '-'}
                    </Typography>
                    
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        mt: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}
                    >
                      {comment.coordinatorComment}
                    </Typography>
                    
                    {comment.changeFrom && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        Change requested
                      </Typography>
                    )}
                    
                    {comment.resolution && (
                      <Box sx={{ mt: 1, p: 1, bgcolor: 'info.50', borderRadius: 1 }}>
                        <Typography variant="caption" fontWeight="bold">OPR Resolution:</Typography>
                        <Typography variant="caption" display="block">{comment.resolution}</Typography>
                      </Box>
                    )}
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Box>
      </Box>

      {/* Merge Result Dialog */}
      <Dialog open={showMergeDialog} onClose={() => setShowMergeDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Merge Result</DialogTitle>
        <DialogContent>
          {processingMerge ? (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <CircularProgress />
              <Typography sx={{ mt: 2 }}>Processing merge...</Typography>
            </Box>
          ) : (
            <Box>
              <Typography variant="body1">{mergeResult}</Typography>
              {mergeMode === 'hybrid' && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  This is an AI suggestion. Please review and modify as needed in the document editor.
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowMergeDialog(false)}>Close</Button>
          {mergeMode === 'hybrid' && !processingMerge && (
            <Button 
              variant="contained" 
              onClick={() => {
                setEditableContent(mergeResultContent);
                setShowMergeDialog(false);
                setMergeResult('');
                setMergeResultContent('');
              }}
            >
              Apply Suggestion
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};

export default OPRReviewPage;