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
  const [mergeResultContent, setMergeResultContent] = useState<string>('');
  const [highlightedText, setHighlightedText] = useState<string>(''); // Store text to highlight // Store actual content separately
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

  // Effect to handle highlighting when text needs to be highlighted
  useEffect(() => {
    if (highlightedText && !showMergeDialog) {
      // Wait for editor to be ready and content to be rendered
      const attemptHighlight = () => {
        const editorElement = document.querySelector('.ck-editor__editable');
        if (editorElement) {
          // Strip HTML tags from the text to search
          const searchText = highlightedText.replace(/<[^>]*>/g, '').trim();
          
          if (searchText) {
            // Create a tree walker to find the text node
            const walker = document.createTreeWalker(
              editorElement,
              NodeFilter.SHOW_TEXT,
              null
            );
            
            let node;
            let found = false;
            
            while (node = walker.nextNode()) {
              const textNode = node as Text;
              const nodeText = textNode.textContent || '';
              
              if (nodeText.includes(searchText)) {
                // Found the text, create a range to select it
                const range = document.createRange();
                const startIndex = nodeText.indexOf(searchText);
                
                range.setStart(textNode, startIndex);
                range.setEnd(textNode, startIndex + searchText.length);
                
                // Create highlight element
                const highlightSpan = document.createElement('span');
                highlightSpan.style.backgroundColor = '#ffeb3b';
                highlightSpan.style.padding = '2px 4px';
                highlightSpan.style.borderRadius = '3px';
                highlightSpan.style.transition = 'all 0.3s ease';
                highlightSpan.className = 'merge-highlight';
                
                try {
                  // Wrap the text in highlight span
                  range.surroundContents(highlightSpan);
                  
                  // Scroll to the highlighted text
                  highlightSpan.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center',
                    inline: 'nearest'
                  });
                  
                  // Also focus the editor
                  if (editorElement instanceof HTMLElement) {
                    editorElement.focus();
                  }
                  
                  // Remove highlight after 5 seconds
                  setTimeout(() => {
                    highlightSpan.style.backgroundColor = 'transparent';
                    
                    setTimeout(() => {
                      // Unwrap the span
                      const parent = highlightSpan.parentNode;
                      while (highlightSpan.firstChild) {
                        parent?.insertBefore(highlightSpan.firstChild, highlightSpan);
                      }
                      parent?.removeChild(highlightSpan);
                    }, 300);
                  }, 5000);
                  
                  found = true;
                  break;
                } catch (e) {
                  console.log('Could not wrap text, trying alternative method');
                  
                  // Alternative: Just scroll to the position
                  const rect = range.getBoundingClientRect();
                  window.scrollTo({
                    top: window.scrollY + rect.top - window.innerHeight / 2,
                    behavior: 'smooth'
                  });
                  
                  found = true;
                  break;
                }
              }
            }
            
            if (!found) {
              console.log('Text not found in editor:', searchText);
            }
          }
          
          // Clear the highlighted text state
          setHighlightedText('');
        }
      };
      
      // Try multiple times with delays to ensure content is rendered
      setTimeout(attemptHighlight, 100);
      setTimeout(attemptHighlight, 500);
      setTimeout(attemptHighlight, 1000);
    }
  }, [highlightedText, showMergeDialog]);

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
        // Use the backend proxy to avoid HTML corruption
        const response = await authTokenService.authenticatedFetch('/api/backend-proxy/feedback-processor/merge', {
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
      
      // Only remove feedback immediately for AI and manual modes
      // For hybrid mode, wait for user decision
      if (mergeMode !== 'hybrid') {
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
      } else {
        console.log('📝 HYBRID MODE - Not removing feedback yet, waiting for user decision');
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
          {mergeMode === 'hybrid' && !processingMerge && mergeResultContent ? (
            <>
              <Button 
                onClick={() => {
                  // Reject - just close without applying
                  setShowMergeDialog(false);
                  setMergeResult('');
                  setMergeResultContent('');
                }}
                color="error"
              >
                Reject
              </Button>
              <Button 
                onClick={async () => {
                  // Apply to editor
                  setEditableContent(mergeResultContent);
                  
                  // Store what we need to find and highlight
                  // For hybrid mode with AI changes, we need to search for the AI-improved text
                  // which is in mergeResultContent, not the original changeTo
                  let searchForText = '';
                  
                  if (mergeMode === 'hybrid' && mergeResultContent) {
                    // Extract the actual changed text from the AI result
                    // The AI returns the improved version, so we need to find what was actually changed
                    if (selectedFeedback?.changeFrom) {
                      // Find where the change was made in the result
                      const startIdx = mergeResultContent.indexOf(selectedFeedback.changeFrom);
                      if (startIdx >= 0) {
                        // The AI replaced this text, so find what it was replaced with
                        // Look for text around the same position
                        const beforeText = mergeResultContent.substring(Math.max(0, startIdx - 100), startIdx);
                        const afterText = mergeResultContent.substring(startIdx, Math.min(mergeResultContent.length, startIdx + 200));
                        searchForText = afterText || selectedFeedback.changeTo || '';
                      } else {
                        // The AI might have significantly changed the text
                        // Try to find any part of the changeTo text
                        searchForText = selectedFeedback.changeTo || '';
                      }
                    } else {
                      searchForText = selectedFeedback.changeTo || '';
                    }
                  } else {
                    searchForText = selectedFeedback?.changeTo || selectedFeedback?.changeFrom || '';
                  }
                  
                  const feedbackLocation = {
                    paragraph: selectedFeedback?.paragraphNumber,
                    line: selectedFeedback?.lineNumber,
                    page: selectedFeedback?.page
                  };
                  
                  console.log('Edit in Document - Search Info:', {
                    mode: mergeMode,
                    searchForText: searchForText.substring(0, 50),
                    location: feedbackLocation,
                    hasAIContent: !!mergeResultContent
                  });
                  
                  // Close dialog
                  setShowMergeDialog(false);
                  setMergeResult('');
                  setMergeResultContent('');
                  
                  // Function to highlight and scroll
                  const performHighlightAndScroll = () => {
                    // Find the DocumentNumbering container or text editor
                    let editorElement = document.querySelector('[data-document-content]') as HTMLElement;
                    
                    // If not found, try other selectors
                    if (!editorElement) {
                      // Look for the DocumentNumbering component's container
                      const docNumberingBox = document.querySelector('.MuiBox-root');
                      if (docNumberingBox && docNumberingBox.innerHTML.includes('<h1') || docNumberingBox?.innerHTML.includes('<p')) {
                        editorElement = docNumberingBox as HTMLElement;
                      }
                    }
                    
                    // If still not found, look for any element with document content
                    if (!editorElement) {
                      const allDivs = document.querySelectorAll('div');
                      for (const div of allDivs) {
                        if (div.innerHTML.includes('AIR FORCE') || 
                            div.innerHTML.includes('SECTION') ||
                            (selectedFeedback?.changeFrom && div.textContent?.includes(selectedFeedback.changeFrom))) {
                          editorElement = div as HTMLElement;
                          break;
                        }
                      }
                    }
                    
                    if (!editorElement) {
                      console.log('Editor/Document element not found');
                      return false;
                    }
                    
                    console.log('Found editor element:', editorElement.className || 'no-class');
                    
                    // Remove any existing highlights first
                    const existingHighlights = editorElement.querySelectorAll('.merge-highlight-mark');
                    existingHighlights.forEach(el => {
                      const parent = el.parentNode;
                      while (el.firstChild) {
                        parent?.insertBefore(el.firstChild, el);
                      }
                      parent?.removeChild(el);
                    });
                    
                    // Clean search text
                    const cleanSearchText = searchForText.replace(/<[^>]*>/g, '').trim();
                    if (!cleanSearchText || cleanSearchText.length < 3) {
                      console.log('Search text too short or empty');
                      return false;
                    }
                    
                    // Try multiple search strategies
                    const searchStrategies = [
                      cleanSearchText, // Full text
                      cleanSearchText.substring(0, 50), // First 50 chars
                      cleanSearchText.substring(0, 30), // First 30 chars
                      cleanSearchText.split('.')[0], // First sentence
                      cleanSearchText.split(' ').slice(0, 10).join(' '), // First 10 words
                      cleanSearchText.split(' ').slice(0, 5).join(' '), // First 5 words
                      cleanSearchText.split(' ').slice(0, 3).join(' '), // First 3 words
                      // Also try from the end in case AI added text at the beginning
                      cleanSearchText.split(' ').slice(-10).join(' '), // Last 10 words
                      cleanSearchText.split(' ').slice(-5).join(' '), // Last 5 words
                    ].filter(str => str && str.length >= 3); // Filter out empty or too short strings
                    
                    console.log('Search strategies to try:', searchStrategies.length);
                    
                    for (const searchStr of searchStrategies) {
                      if (!searchStr || searchStr.length < 3) continue;
                      
                      console.log('Trying search strategy:', searchStr.substring(0, Math.min(30, searchStr.length)) + (searchStr.length > 30 ? '...' : ''));
                      
                      // Walk through all text nodes
                      const walker = document.createTreeWalker(
                        editorElement,
                        NodeFilter.SHOW_TEXT,
                        {
                          acceptNode: (node) => {
                            // Skip empty text nodes
                            return node.textContent && node.textContent.trim() 
                              ? NodeFilter.FILTER_ACCEPT 
                              : NodeFilter.FILTER_SKIP;
                          }
                        }
                      );
                      
                      let textNode;
                      let found = false;
                      
                      while (textNode = walker.nextNode()) {
                        const nodeText = textNode.textContent || '';
                        const searchIndex = nodeText.toLowerCase().indexOf(searchStr.toLowerCase());
                        
                        if (searchIndex >= 0) {
                          console.log('Found text in node!');
                          
                          try {
                            // Create range for the found text
                            const range = document.createRange();
                            const endIndex = Math.min(searchIndex + searchStr.length, nodeText.length);
                            
                            range.setStart(textNode, searchIndex);
                            range.setEnd(textNode, endIndex);
                            
                            // Create highlight element
                            const highlightMark = document.createElement('mark');
                            highlightMark.className = 'merge-highlight-mark';
                            highlightMark.style.cssText = `
                              background-color: #ffeb3b !important;
                              padding: 2px 4px !important;
                              border-radius: 3px !important;
                              box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
                              animation: pulse 1s ease-in-out !important;
                            `;
                            
                            // Add CSS animation
                            if (!document.querySelector('#merge-highlight-styles')) {
                              const style = document.createElement('style');
                              style.id = 'merge-highlight-styles';
                              style.textContent = `
                                @keyframes pulse {
                                  0% { transform: scale(1); }
                                  50% { transform: scale(1.05); }
                                  100% { transform: scale(1); }
                                }
                              `;
                              document.head.appendChild(style);
                            }
                            
                            // Wrap the found text
                            range.surroundContents(highlightMark);
                            
                            // Scroll to the highlighted text with offset for better visibility
                            setTimeout(() => {
                              const rect = highlightMark.getBoundingClientRect();
                              const absoluteTop = window.scrollY + rect.top;
                              const targetScroll = absoluteTop - (window.innerHeight / 3); // Position at 1/3 from top
                              
                              window.scrollTo({
                                top: targetScroll,
                                behavior: 'smooth'
                              });
                              
                              // Also ensure horizontal scroll if needed
                              if (rect.left < 0 || rect.right > window.innerWidth) {
                                highlightMark.scrollIntoView({ 
                                  behavior: 'smooth', 
                                  block: 'center',
                                  inline: 'center'
                                });
                              }
                            }, 100);
                            
                            // Focus the editor and position cursor near the highlight
                            if (editorElement instanceof HTMLElement) {
                              editorElement.focus();
                              
                              // Try to position cursor at the highlighted text
                              const selection = window.getSelection();
                              selection?.removeAllRanges();
                              const newRange = document.createRange();
                              newRange.selectNodeContents(highlightMark);
                              newRange.collapse(false); // Collapse to end
                              selection?.addRange(newRange);
                            }
                            
                            // Fade out highlight after 5 seconds
                            setTimeout(() => {
                              highlightMark.style.transition = 'background-color 2s ease-out';
                              highlightMark.style.backgroundColor = 'rgba(255, 235, 59, 0.3)';
                              
                              setTimeout(() => {
                                highlightMark.style.backgroundColor = 'transparent';
                                
                                // Remove the mark element after fade
                                setTimeout(() => {
                                  const parent = highlightMark.parentNode;
                                  while (highlightMark.firstChild) {
                                    parent?.insertBefore(highlightMark.firstChild, highlightMark);
                                  }
                                  parent?.removeChild(highlightMark);
                                }, 2000);
                              }, 3000);
                            }, 5000);
                            
                            found = true;
                            return true;
                          } catch (e) {
                            console.error('Error highlighting text:', e);
                            
                            // Fallback: at least scroll to the general area
                            try {
                              const tempRange = document.createRange();
                              tempRange.selectNode(textNode);
                              const rect = tempRange.getBoundingClientRect();
                              
                              window.scrollTo({
                                top: window.scrollY + rect.top - window.innerHeight / 3,
                                behavior: 'smooth'
                              });
                              
                              found = true;
                            } catch (scrollError) {
                              console.error('Error scrolling:', scrollError);
                            }
                          }
                          
                          break;
                        }
                      }
                      
                      if (found) {
                        console.log('Successfully found and highlighted text');
                        return true;
                      }
                    }
                    
                    console.log('Text not found with any strategy');
                    
                    // Last resort: scroll to paragraph/line number if available
                    if (feedbackLocation.paragraph || feedbackLocation.line) {
                      console.log('Falling back to paragraph/line number scroll:', feedbackLocation);
                      
                      // Try to find the paragraph by data-paragraph attribute first
                      let targetElement = null;
                      
                      if (feedbackLocation.paragraph) {
                        // Look for elements with matching data-paragraph attribute
                        targetElement = editorElement.querySelector(`[data-paragraph="${feedbackLocation.paragraph}"]`);
                        
                        if (!targetElement) {
                          // Try partial match (e.g., "1.2.3" might be stored as "1.2.3.1")
                          const allParas = editorElement.querySelectorAll('[data-paragraph]');
                          for (const para of allParas) {
                            const paraNum = para.getAttribute('data-paragraph');
                            if (paraNum && paraNum.startsWith(feedbackLocation.paragraph)) {
                              targetElement = para;
                              break;
                            }
                          }
                        }
                      }
                      
                      // If still not found, try by index
                      if (!targetElement) {
                        const paragraphs = editorElement.querySelectorAll('p, .numbered-paragraph');
                        const targetIndex = parseInt(feedbackLocation.line || '1') - 1;
                        if (paragraphs[targetIndex]) {
                          targetElement = paragraphs[targetIndex];
                        }
                      }
                      
                      if (targetElement) {
                        console.log('Found element to scroll to by paragraph/line number');
                        targetElement.scrollIntoView({ 
                          behavior: 'smooth', 
                          block: 'center' 
                        });
                        
                        // Add a temporary border to show the paragraph
                        const elem = targetElement as HTMLElement;
                        elem.style.border = '3px solid #ffeb3b';
                        elem.style.borderRadius = '4px';
                        elem.style.padding = '8px';
                        elem.style.backgroundColor = 'rgba(255, 235, 59, 0.1)';
                        
                        setTimeout(() => {
                          elem.style.transition = 'all 1s ease-out';
                          elem.style.border = 'none';
                          elem.style.padding = '0';
                          elem.style.backgroundColor = 'transparent';
                        }, 3000);
                        
                        // Return false because we didn't actually find and highlight the text
                        // This is just a fallback scroll
                        console.log('Scrolled to paragraph/line but text not highlighted');
                        return false;
                      }
                    }
                    
                    console.log('Could not find element to scroll to');
                    return false;
                  };
                  
                  // Try multiple times to ensure content is loaded
                  let attempts = 0;
                  const maxAttempts = 5;
                  
                  const attemptHighlight = () => {
                    attempts++;
                    console.log(`Highlight attempt ${attempts}/${maxAttempts}`);
                    
                    if (performHighlightAndScroll()) {
                      console.log('Successfully highlighted on attempt', attempts);
                    } else if (attempts < maxAttempts) {
                      setTimeout(attemptHighlight, 500 * attempts); // Exponential backoff
                    } else {
                      console.log('Could not find text after', maxAttempts, 'attempts');
                      
                      // Final fallback: just focus the document area
                      const docArea = document.querySelector('[data-document-content]') || 
                                      document.querySelector('.MuiBox-root');
                      if (docArea instanceof HTMLElement) {
                        docArea.focus();
                        // Scroll to top of document
                        docArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }
                  };
                  
                  // Start attempting after a short delay for editor to update
                  setTimeout(attemptHighlight, 300);
                }}
              >
                Edit in Document
              </Button>
              <Button 
                variant="contained" 
                onClick={() => {
                  // Apply and save
                  setEditableContent(mergeResultContent);
                  
                  // Also remove the feedback from the list and save to database
                  const updatedFeedback = feedback.filter(f => f.id !== selectedFeedback?.id);
                  setFeedback(updatedFeedback);
                  
                  // Save to database
                  authTokenService.authenticatedFetch(`/api/documents/${documentId}`, {
                    method: 'PATCH',
                    body: JSON.stringify({
                      customFields: {
                        content: mergeResultContent,
                        draftFeedback: updatedFeedback,
                        lastHybridMerge: new Date().toISOString()
                      }
                    })
                  });
                  
                  setShowMergeDialog(false);
                  setMergeResult('');
                  setMergeResultContent('');
                }}
                color="success"
              >
                Apply & Save
              </Button>
            </>
          ) : (
            <Button onClick={() => setShowMergeDialog(false)}>Close</Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};

export default OPRReviewPage;