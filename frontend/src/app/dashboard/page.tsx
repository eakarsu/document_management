'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Tabs,
  Tab,
  Badge,
  Collapse,
  ListSubheader,
  Checkbox,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Description as DocumentIcon,
  AccountCircle,
  Folder as FolderIcon,
  Search as SearchIcon,
  BarChart as AnalyticsIcon,
  Logout as LogoutIcon,
  Business,
  Upload as UploadIcon,
  Delete as DeleteIcon,
  MoreVert as MoreIcon,
  Publish as PublishIcon,
  Psychology as AIIcon,
  Speed as OptimizeIcon,
  Insights as InsightsIcon,
  Timeline as MonitorIcon,
  Lightbulb as RecommendIcon,
  Gavel as DecisionIcon,
  Assessment as ContentIcon,
  Group as TeamIcon,
  Visibility as RealtimeIcon,
  AutoFixHigh as SmartIcon,
  Create as CreateIcon,
  AccountTree as WorkflowBuilderIcon,
  ArrowDropDown as ArrowDropDownIcon,
  AdminPanelSettings as AdminIcon,
  PostAdd as PostAddIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import WorkflowTasks from '../../components/WorkflowTasks';
import ReviewerTasks from '../../components/ReviewerTasks';

interface DashboardData {
  totalDocuments: number;
  totalUsers: number;
  recentDocuments: Array<{
    id: string;
    title: string;
    category: string;
    status: string;
    createdAt: string;
    createdBy: {
      firstName: string;
      lastName: string;
    };
  }>;
}

// Reusable Paragraph Component
const SelectableParagraph: React.FC<{
  paragraph: any;
  selectedSection: string;
  onSelect: (id: string, title: string) => void;
  marginLeft: number;
}> = ({ paragraph, selectedSection, onSelect, marginLeft }) => {
  const isSelected = selectedSection === paragraph.id;

  return (
    <ListItem
      button
      selected={isSelected}
      onClick={() => onSelect(paragraph.id, paragraph.fullText || paragraph.title)}
      sx={{
        ml: marginLeft,
        border: '1px solid',
        borderColor: isSelected ? 'primary.main' : 'divider',
        bgcolor: isSelected ? 'primary.light' : 'background.paper',
        borderRadius: 1,
        mb: 1,
        p: 1.5,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        '&:hover': {
          bgcolor: isSelected ? 'primary.light' : 'action.hover'
        }
      }}
    >
      <Box sx={{ width: '100%' }}>
        <ListItemText
          primary={paragraph.fullText || paragraph.title}
          primaryTypographyProps={{
            color: isSelected ? 'primary.main' : 'text.primary',
            fontWeight: isSelected ? 'bold' : 'normal',
            fontSize: '0.875rem'
          }}
          sx={{
            '& .MuiTypography-root': {
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }
          }}
        />
        {isSelected && (
          <Chip label="Selected" color="primary" size="small" sx={{ mt: 1 }} />
        )}
      </Box>
    </ListItem>
  );
};

const DashboardPage: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalDocuments: 0,
    totalUsers: 0,
    recentDocuments: []
  });
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState<{open: boolean, docId: string, docTitle: string}>({
    open: false,
    docId: '',
    docTitle: ''
  });
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false);
  const [userRole, setUserRole] = useState<string>('');
  const [supplementDialog, setSupplementDialog] = useState(false);
  const [supplementStep, setSupplementStep] = useState(1);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedSectionTitle, setSelectedSectionTitle] = useState('');
  const [documentStructure, setDocumentStructure] = useState<any>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [loadingStructure, setLoadingStructure] = useState(false);
  const [allDocuments, setAllDocuments] = useState<any[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const router = useRouter();

  // Authentication is handled by middleware - no need to check here

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch current user to get role
        const userResponse = await api.get('/api/auth/me');
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUserRole(userData.role || '');
        }

        // Fetch dashboard stats (token will be read from HTTP-only cookies server-side)
        const statsResponse = await api.get('/api/dashboard/stats');

        if (statsResponse.ok) {
          const statsData = await statsResponse.json();

          // Fetch recent documents (token will be read from HTTP-only cookies server-side)
          const docsResponse = await api.get('/api/documents/search?limit=5');

          let recentDocuments = [];
          if (docsResponse.ok) {
            const docsData = await docsResponse.json();
            recentDocuments = docsData.documents || [];
          }

          setDashboardData({
            totalDocuments: statsData.stats?.totalDocuments || 0,
            totalUsers: statsData.stats?.totalUsers || 0,
            recentDocuments: recentDocuments.slice(0, 5)
          });
        } else {
          console.error('Failed to fetch dashboard stats:', statsResponse.status);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [router]);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      // Call logout API to clear cookies
      await api.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    }

    // Clear ALL storage regardless of API response
    localStorage.clear();
    sessionStorage.clear();

    // Clear cookies from client side
    document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

    // Hard redirect to login
    window.location.href = '/login';
  };

  const handleUploadDocument = () => {
    router.push('/upload');
  };

  const handleBrowseFolders = () => {
    router.push('/documents');
  };

  const handleSearchDocuments = () => {
    router.push('/search');
  };

  const handleViewAnalytics = () => {
    router.push('/analytics');
  };

  const handlePublishing = () => {
    router.push('/publishing');
  };

  const handleDocumentClick = (documentId: string) => {
    // Only navigate if not selecting
    if (selectedDocuments.size === 0) {
      router.push(`/documents/${documentId}`);
    }
  };

  const handleSelectDocument = (documentId: string) => {
    const newSelected = new Set(selectedDocuments);
    if (newSelected.has(documentId)) {
      newSelected.delete(documentId);
    } else {
      newSelected.add(documentId);
    }
    setSelectedDocuments(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedDocuments.size === dashboardData.recentDocuments.length) {
      setSelectedDocuments(new Set());
    } else {
      const allIds = new Set(dashboardData.recentDocuments.map(doc => doc.id));
      setSelectedDocuments(allIds);
    }
  };

  const handleDeleteDocument = (documentId: string, documentTitle: string) => {
    setDeleteDialog({
      open: true,
      docId: documentId,
      docTitle: documentTitle
    });
  };

  const handleBulkDelete = () => {
    if (selectedDocuments.size > 0) {
      setBulkDeleteDialog(true);
    }
  };

  const confirmDelete = async () => {
    try {
      const response = await api.delete(`/api/documents/${deleteDialog.docId}`);

      if (response.ok) {
        // Refresh dashboard data to reflect the deletion
        const fetchDashboardData = async () => {
          try {
            const statsResponse = await api.get('/api/dashboard/stats');

            if (statsResponse.ok) {
              const statsData = await statsResponse.json();
              
              const docsResponse = await api.get('/api/documents/search?limit=5');

              let recentDocuments = [];
              if (docsResponse.ok) {
                const docsData = await docsResponse.json();
                recentDocuments = docsData.documents || [];
              }

              setDashboardData({
                totalDocuments: statsData.stats?.totalDocuments || 0,
                totalUsers: statsData.stats?.totalUsers || 0,
                recentDocuments: recentDocuments.slice(0, 5)
              });
            }
          } catch (error) {
            console.error('Failed to refresh dashboard data:', error);
          }
        };

        await fetchDashboardData();
        setDeleteDialog({ open: false, docId: '', docTitle: '' });
      } else {
        const error = await response.json();
        console.error('Delete failed:', error);
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const cancelDelete = () => {
    setDeleteDialog({ open: false, docId: '', docTitle: '' });
  };

  const confirmBulkDelete = async () => {
    try {
      // Delete all selected documents from database
      const deletePromises = Array.from(selectedDocuments).map(async (docId) => {
        try {
          const response = await api.delete(`/api/documents/${docId}`);
          if (!response.ok) {
            console.error(`Failed to delete document ${docId}`);
            return { success: false, docId };
          }
          return { success: true, docId };
        } catch (error) {
          console.error(`Error deleting document ${docId}:`, error);
          return { success: false, docId };
        }
      });

      const results = await Promise.all(deletePromises);
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;

      if (successCount > 0) {
        console.log(`Successfully deleted ${successCount} document(s)`);
      }
      if (failCount > 0) {
        console.error(`Failed to delete ${failCount} document(s)`);
      }

      // Refresh dashboard data after bulk deletion
      const fetchDashboardData = async () => {
        try {
          const statsResponse = await api.get('/api/dashboard/stats');
          const docsResponse = await api.get('/api/documents/search?limit=5');

          if (statsResponse.ok && docsResponse.ok) {
            const statsData = await statsResponse.json();
            const docsData = await docsResponse.json();

            const recentDocuments = docsData.documents || [];

            setDashboardData({
              totalDocuments: statsData.stats?.totalDocuments || 0,
              totalUsers: statsData.stats?.totalUsers || 0,
              recentDocuments: recentDocuments.slice(0, 5)
            });
          }
        } catch (error) {
          console.error('Failed to refresh dashboard data:', error);
        }
      };

      await fetchDashboardData();
      setSelectedDocuments(new Set());
      setBulkDeleteDialog(false);
    } catch (error) {
      console.error('Bulk delete error:', error);
      alert('An error occurred while deleting documents. Please try again.');
    }
  };

  const handleAIWorkflow = () => {
    router.push('/ai-workflow');
  };

  const handleAIDocumentGenerator = () => {
    router.push('/ai-document-generator');
  };

  const handleWorkflowBuilder = () => {
    router.push('/workflow-builder');
  };

  const handleCreateSupplement = async () => {
    setSupplementDialog(true);
    setSupplementStep(1);
    setSelectedDocument(null);
    setSelectedSection('');
    setLoadingDocuments(true);

    try {
      // Fetch ALL documents (not just recent)
      const response = await api.get('/api/documents/search?limit=1000');
      if (response.ok) {
        const data = await response.json();
        setAllDocuments(data.documents || []);
      }
    } catch (error) {
      console.error('Failed to fetch all documents:', error);
    } finally {
      setLoadingDocuments(false);
    }
  };

  const handleDocumentSelect = async (doc: any) => {
    setSelectedDocument(doc);
    setLoadingStructure(true);

    try {
      console.log('=== Fetching document ===');
      console.log('Document ID:', doc.id);
      console.log('Document Title:', doc.title);

      // Fetch the document content to extract structure
      const response = await api.get(`/api/documents/${doc.id}`);
      console.log('API Response status:', response.status, response.ok);

      if (response.ok) {
        const documentData = await response.json();
        console.log('=== Document Data Received ===');
        console.log('Full document data:', documentData);

        // Parse document structure from content
        const structure = parseDocumentStructure(documentData);
        console.log('=== Parsed Structure ===');
        console.log('Structure:', structure);
        setDocumentStructure(structure);
      } else {
        console.error('Response not OK:', response.status);
        const errorText = await response.text();
        console.error('Error response:', errorText);
        alert(`Failed to load document: ${response.status}`);
      }
    } catch (error) {
      console.error('=== ERROR fetching document ===');
      console.error('Error details:', error);
      alert(`Error loading document: ${error}`);
    } finally {
      setLoadingStructure(false);
      setSupplementStep(2);
    }
  };

  const parseDocumentStructure = (documentData: any) => {
    // The API returns { success: true, document: {...} }
    const doc = documentData.document || documentData;

    console.log('=== Parsing Document Structure ===');
    console.log('Document object:', doc);
    console.log('Custom Fields:', doc.customFields);
    console.log('All document keys:', Object.keys(doc));

    // Get content from customFields - try all possible locations
    const content =
      doc.customFields?.htmlContent ||
      doc.customFields?.editableContent ||
      doc.customFields?.content ||
      doc.customFields?.documentContent ||
      doc.content ||
      doc.editableContent ||
      doc.htmlContent ||
      '';

    console.log('Content extracted:', content ? `${content.length} chars` : 'EMPTY');
    if (content) {
      console.log('Content preview:', content.substring(0, 1000));
    } else {
      console.error('NO CONTENT FOUND! Checked all fields.');
    }

    // Create a temporary div to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;

    // Debug: Log ALL elements with their text content
    console.log('=== ALL HTML ELEMENTS ===');
    const allElements = tempDiv.querySelectorAll('*');
    console.log('Total elements:', allElements.length);

    // Show first 100 elements to understand structure
    for (let i = 0; i < Math.min(100, allElements.length); i++) {
      const el = allElements[i];
      const text = el.textContent?.trim().substring(0, 100) || '';
      const className = el.className ? ` class="${el.className}"` : '';
      const id = el.id ? ` id="${el.id}"` : '';
      console.log(`${i}: <${el.tagName.toLowerCase()}${className}${id}> ${text}`);
    }

    // Search specifically for elements containing "2.1.2"
    console.log('=== SEARCHING FOR 2.1.2 ===');
    const searchText = '2.1.2';
    for (let i = 0; i < allElements.length; i++) {
      const el = allElements[i];
      const text = el.textContent?.trim() || '';
      if (text.includes(searchText) && text.length < 200) {
        console.log(`Found "${searchText}" in <${el.tagName.toLowerCase()}> class="${el.className}" id="${el.id}": ${text.substring(0, 150)}`);
      }
    }

    const structure: any = { chapters: [] };
    let currentChapter: any = null;
    let currentSection: any = null;
    let currentSubsection: any = null;
    let currentSubSubsection: any = null; // New level for H5

    // Find all heading elements (h1, h2, h3, h4, h5, h6) and paragraph elements
    const elements = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6, p');
    console.log('=== HEADINGS AND PARAGRAPHS ===');
    console.log('Total headings/paragraphs found:', elements.length);

    elements.forEach((element, index) => {
      const text = element.textContent?.trim() || '';
      const tagName = element.tagName.toLowerCase();

      if (!text) return; // Skip empty elements

      // Detect numbering level: 1. = chapter, 1.1. = section, 1.1.1. = subsection, 1.1.1.1. = paragraph
      const numberMatch = text.match(/^(\d+(?:\.\d+)*)\.\s*/);
      const numberingLevel = numberMatch ? (numberMatch[1].match(/\./g) || []).length : -1;

      console.log(`Element ${index}: ${tagName} - "${text.substring(0, 50)}" - Level: ${numberingLevel}`);

      // H1 or H2 = Chapter (single digit like "1." or "Chapter X")
      if (tagName === 'h1' || tagName === 'h2') {
        currentChapter = {
          id: `ch-${index}`,
          title: text,
          sections: [],
          paragraphs: []
        };
        structure.chapters.push(currentChapter);
        currentSection = null;
        currentSubsection = null;
        console.log(`  → Created chapter: ${text}`);
      }
      // H3 = Section (like "1.1." or any H3)
      else if (tagName === 'h3') {
        if (currentChapter) {
          currentSection = {
            id: `sec-${index}`,
            title: text,
            subsections: [],
            paragraphs: []
          };
          currentChapter.sections.push(currentSection);
          currentSubsection = null;
          console.log(`  → Created section: ${text}`);
        }
      }
      // H4 = Subsection (like "2.1.2 Transportation Coordination")
      else if (tagName === 'h4') {
        if (currentSection) {
          currentSubsection = {
            id: `subsec-${index}`,
            title: text,
            subsubsections: [], // H5 elements will go here
            paragraphs: []
          };
          currentSection.subsections.push(currentSubsection);
          currentSubSubsection = null; // Reset sub-subsection
          console.log(`  → Created subsection (H4): ${text}`);
        } else if (currentChapter) {
          // Subsection without section - create a default section
          currentSection = {
            id: `sec-auto-${index}`,
            title: 'Section',
            subsections: [],
            paragraphs: []
          };
          currentChapter.sections.push(currentSection);
          currentSubsection = {
            id: `subsec-${index}`,
            title: text,
            subsubsections: [],
            paragraphs: []
          };
          currentSection.subsections.push(currentSubsection);
          currentSubSubsection = null;
          console.log(`  → Created auto section + subsection (H4): ${text}`);
        }
      }
      // H5 = Sub-subsection (like "2.1.2.1 Inter-Departmental Coordination")
      else if (tagName === 'h5') {
        if (currentSubsection) {
          currentSubSubsection = {
            id: `subsubsec-${index}`,
            title: text,
            paragraphs: []
          };
          currentSubsection.subsubsections.push(currentSubSubsection);
          console.log(`  → Created sub-subsection (H5): ${text}`);
        } else if (currentSection) {
          // H5 without H4 - treat as paragraph
          if (!currentSection.paragraphs) currentSection.paragraphs = [];
          currentSection.paragraphs.push({
            id: `para-h5-${index}`,
            title: text,
            fullText: text,
            isHeading: true
          });
          console.log(`  → Added H5 as paragraph to section (no H4): ${text}`);
        }
      }
      // H6 = Treat as paragraph under current context
      else if (tagName === 'h6') {
        const paragraph = {
          id: `para-h6-${index}`,
          title: text,
          fullText: text,
          isHeading: true
        };

        if (currentSubSubsection) {
          currentSubSubsection.paragraphs.push(paragraph);
          console.log(`  → Added H6 as paragraph to sub-subsection: ${text}`);
        } else if (currentSubsection) {
          currentSubsection.paragraphs.push(paragraph);
          console.log(`  → Added H6 as paragraph to subsection: ${text}`);
        } else if (currentSection) {
          if (!currentSection.paragraphs) currentSection.paragraphs = [];
          currentSection.paragraphs.push(paragraph);
          console.log(`  → Added H6 as paragraph to section: ${text}`);
        }
      }
      // P = Paragraph (like "2.1.2.1.1. Effective coordination...")
      else if (tagName === 'p') {
        if (text.length > 5) {
          const paragraphTitle = text.length > 80 ? text.substring(0, 80) + '...' : text;
          const paragraph = {
            id: `para-${index}`,
            title: paragraphTitle,
            fullText: text
          };

          // Add to deepest available level
          if (currentSubSubsection) {
            currentSubSubsection.paragraphs.push(paragraph);
            console.log(`  → Added paragraph to sub-subsection (H5)`);
          } else if (currentSubsection) {
            currentSubsection.paragraphs.push(paragraph);
            console.log(`  → Added paragraph to subsection (H4)`);
          } else if (currentSection) {
            currentSection.paragraphs.push(paragraph);
            console.log(`  → Added paragraph to section (H3)`);
          } else if (currentChapter) {
            currentChapter.paragraphs.push(paragraph);
            console.log(`  → Added paragraph to chapter (H2)`);
          }
        }
      }
    });

    // If no structure was found, return a basic structure
    console.log('=== Final Structure ===');
    console.log('Chapters found:', structure.chapters.length);
    structure.chapters.forEach((ch: any, i: number) => {
      console.log(`Chapter ${i + 1}: ${ch.title} (${ch.sections?.length || 0} sections)`);
    });

    if (structure.chapters.length === 0) {
      console.warn('No chapters found in document! Returning empty structure.');
      return {
        chapters: []
      };
    }

    return structure;
  };

  // REMOVED: No more mock data - we only use real document content from database

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const handleSectionSelect = (sectionId: string, sectionTitle: string) => {
    setSelectedSection(sectionId);
    setSelectedSectionTitle(sectionTitle); // Store the title separately
  };

  const handleSupplementCreate = () => {
    // Navigate to document creation with supplement parameters - pass the title which has the number
    router.push(`/ai-document-generator?mode=manual&supplement=true&documentId=${selectedDocument.id}&section=${encodeURIComponent(selectedSectionTitle || selectedSection)}`);
    setSupplementDialog(false);
  };

  const handleSupplementDialogClose = () => {
    setSupplementDialog(false);
    setSupplementStep(1);
    setSelectedDocument(null);
    setSelectedSection('');
  };

  const handleUsersManagement = () => {
    router.push('/users');
  };


  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* App Bar */}
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
            onClick={handleProfileMenuOpen}
            color="inherit"
          >
            <AccountCircle />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={() => { handleMenuClose(); router.push('/profile'); }}>
              <AccountCircle sx={{ mr: 1 }} />
              Profile
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <LogoutIcon sx={{ mr: 1 }} />
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Welcome Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Welcome to PubOne by MissionSynchAI
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            Your enterprise document management system with AI-powered workflow automation is ready to use
          </Typography>
          
          {/* AI Features Highlight */}
          <Box sx={{ mt: 2, p: 2, bgcolor: 'primary.light', borderRadius: 2, display: 'flex', alignItems: 'center' }}>
            <AIIcon sx={{ mr: 2, color: 'primary.main', fontSize: 30 }} />
            <Box>
              <Typography variant="subtitle2" color="primary.main" gutterBottom>
                🚀 NEW: AI Workflow Assistant Available!
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Access 8 powerful AI features including smart recommendations, real-time monitoring, 
                decision support, and predictive analytics. Click the AI Features card or button to explore.
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Create New Document and Create Supplement - Large Featured Buttons */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                  transform: 'translateY(-4px)',
                  boxShadow: 6
                }
              }}
              onClick={() => router.push('/ai-document-generator?mode=manual')}
            >
              <CardContent sx={{ textAlign: 'center', p: 5 }}>
                <CreateIcon sx={{ fontSize: 72, color: 'white', mb: 2 }} />
                <Typography variant="h4" gutterBottom>
                  Create New Document
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.9)', fontSize: '1.1rem' }}>
                  Start creating a new document with our powerful editor
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                  transform: 'translateY(-4px)',
                  boxShadow: 6
                }
              }}
              onClick={handleCreateSupplement}
            >
              <CardContent sx={{ textAlign: 'center', p: 5 }}>
                <PostAddIcon sx={{ fontSize: 72, color: 'white', mb: 2 }} />
                <Typography variant="h4" gutterBottom>
                  Create Supplement
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.9)', fontSize: '1.1rem' }}>
                  Add supplemental content to an existing document
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Quick Actions */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Recent Documents
                </Typography>
                {selectedDocuments.size > 0 && (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip
                      label={`${selectedDocuments.size} selected`}
                      color="primary"
                      size="small"
                    />
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      startIcon={<DeleteIcon />}
                      onClick={handleBulkDelete}
                    >
                      Delete Selected
                    </Button>
                  </Box>
                )}
              </Box>
              {dashboardData.recentDocuments.length > 0 ? (
                <>
                  {dashboardData.recentDocuments.length > 1 && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, pl: 2 }}>
                      <Checkbox
                        checked={selectedDocuments.size === dashboardData.recentDocuments.length}
                        indeterminate={selectedDocuments.size > 0 && selectedDocuments.size < dashboardData.recentDocuments.length}
                        onChange={handleSelectAll}
                      />
                      <Typography variant="body2" color="text.secondary">
                        Select All
                      </Typography>
                    </Box>
                  )}
                  <List>
                  {dashboardData.recentDocuments.map((doc, index) => (
                    <React.Fragment key={doc.id}>
                      <ListItem
                        button
                        onClick={() => handleDocumentClick(doc.id)}
                        selected={selectedDocuments.has(doc.id)}
                        sx={{
                          '&:hover': {
                            backgroundColor: 'rgba(0, 0, 0, 0.04)'
                          },
                          backgroundColor: selectedDocuments.has(doc.id) ? 'rgba(25, 118, 210, 0.08)' : 'transparent'
                        }}
                      >
                        <ListItemIcon>
                          <Checkbox
                            edge="start"
                            checked={selectedDocuments.has(doc.id)}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectDocument(doc.id);
                            }}
                          />
                        </ListItemIcon>
                        <ListItemIcon>
                          <DocumentIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary={doc.title}
                          secondary={`${doc.createdBy?.firstName || 'Unknown'} ${doc.createdBy?.lastName || 'User'} • ${new Date(doc.createdAt).toLocaleDateString()}`}
                        />
                        <Chip 
                          label={doc.category} 
                          size="small" 
                          color="primary" 
                          variant="outlined"
                          sx={{ mr: 1 }}
                        />
                        <IconButton
                          edge="end"
                          color="error"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDocument(doc.id, doc.title);
                          }}
                          sx={{ ml: 1 }}
                          title="Delete document"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItem>
                      {index < dashboardData.recentDocuments.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
                </>
              ) : (
                <Typography color="text.secondary" sx={{ py: 2 }}>
                  No documents found. Start by uploading your first document!
                </Typography>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CreateIcon />
                Quick Actions
              </Typography>
              <Stack spacing={2}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<SmartIcon />}
                  size="large"
                  onClick={handleAIDocumentGenerator}
                  sx={{
                    borderColor: 'primary.main',
                    '&:hover': {
                      backgroundColor: 'primary.light'
                    }
                  }}
                >
                  Generate with AI
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<UploadIcon />}
                  size="large"
                  onClick={handleUploadDocument}
                >
                  Upload Files
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<FolderIcon />}
                  size="large"
                  onClick={handleBrowseFolders}
                >
                  Browse Documents
                </Button>
              </Stack>

              <Divider sx={{ my: 3 }} />

              <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AnalyticsIcon sx={{ fontSize: 18 }} />
                System Overview
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
                  <Typography variant="body2" color="text.secondary">Documents</Typography>
                  <Chip size="small" label={dashboardData.totalDocuments} color="primary" variant="outlined" />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
                  <Typography variant="body2" color="text.secondary">Active Users</Typography>
                  <Chip size="small" label={dashboardData.totalUsers} color="secondary" variant="outlined" />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
                  <Typography variant="body2" color="text.secondary">Published</Typography>
                  <Chip
                    size="small"
                    label={dashboardData.recentDocuments.filter(doc => doc.status === 'PUBLISHED').length}
                    color="success"
                    variant="outlined"
                  />
                </Box>
              </Box>
            </Paper>
          </Grid>

            {/* Admin Workflow Controls Section - Only visible to admin users */}
            {(userRole === 'ADMIN' || userRole === 'Admin' || userRole === 'WORKFLOW_ADMIN') && (
              <Grid item xs={12} md={6} lg={4}>
                <Paper sx={{ p: 3, height: '100%', bgcolor: 'background.paper' }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                    <AdminIcon sx={{ color: 'error.main' }} />
                    Admin Workflow Controls (Review Collection Phase)
                  </Typography>
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Button
                        fullWidth
                        variant="contained"
                        color="primary"
                        size="large"
                        onClick={async () => {
                          // Submit review functionality
                          try {
                            const response = await api.post('/api/workflow/submit-review');
                            if (response.ok) {
                              alert('Review submitted successfully');
                            } else {
                              alert('Failed to submit review');
                            }
                          } catch (error) {
                            console.error('Error submitting review:', error);
                            alert('Error submitting review');
                          }
                        }}
                      >
                        Submit Review
                      </Button>
                      <Button
                        fullWidth
                        variant="contained"
                        color="success"
                        size="large"
                        onClick={async () => {
                          // All reviews complete - advance workflow
                          try {
                            const response = await api.post('/api/workflow/all-reviews-complete');
                            if (response.ok) {
                              alert('Workflow advanced successfully - All reviews marked as complete');
                            } else {
                              alert('Failed to advance workflow');
                            }
                          } catch (error) {
                            console.error('Error advancing workflow:', error);
                            alert('Error advancing workflow');
                          }
                        }}
                      >
                        All Reviews Complete
                      </Button>
                    </Box>
                    <Divider />
                    <Typography variant="caption" color="text.secondary">
                      Use "Submit Review" to submit your own review. Use "All Reviews Complete" when all reviewers have submitted their feedback to advance the workflow to the next stage.
                    </Typography>
                  </Stack>
                </Paper>
              </Grid>
            )}
        </Grid>

          {/* Workflow Tasks - Pending Approvals */}
          <Box sx={{ mt: 3 }}>
            <WorkflowTasks showHeader={true} maxTasks={5} />
          </Box>

          {/* Reviewer Tasks - For Sub-Reviewers */}
          <Box sx={{ mt: 3 }}>
            <ReviewerTasks />
          </Box>

        {/* System Status */}
        <Box sx={{ mt: 4 }}>
          <Paper sx={{ p: 3, background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <MonitorIcon />
              System Status
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">Backend API</Typography>
                  <Chip label="Online" color="success" size="small" sx={{ mt: 0.5 }} />
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">Database</Typography>
                  <Chip label="Connected" color="success" size="small" sx={{ mt: 0.5 }} />
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">AI Services</Typography>
                  <Chip label="Available" color="success" size="small" sx={{ mt: 0.5 }} />
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Box>
      </Container>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={cancelDelete}
      >
        <DialogTitle>Delete Document</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{deleteDialog.docTitle}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDelete} color="primary">
            Cancel
          </Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog
        open={bulkDeleteDialog}
        onClose={() => setBulkDeleteDialog(false)}
      >
        <DialogTitle>Delete Multiple Documents</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to permanently delete {selectedDocuments.size} selected document{selectedDocuments.size > 1 ? 's' : ''}?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkDeleteDialog(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={confirmBulkDelete} color="error" variant="contained">
            Delete All
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Supplement Dialog */}
      <Dialog
        open={supplementDialog}
        onClose={handleSupplementDialogClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PostAddIcon color="primary" />
          {supplementStep === 1 ? 'Step 1 of 2: Select Document' : 'Step 2 of 2: Select Section/Paragraph'}
        </DialogTitle>
        <DialogContent>
          {supplementStep === 1 ? (
            <>
              <DialogContentText sx={{ mb: 2 }}>
                Select the original document you want to create a supplement for:
              </DialogContentText>
              {loadingDocuments ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Box sx={{ maxHeight: '400px', overflow: 'auto' }}>
                  <List>
                    {allDocuments.map((doc) => (
                      <ListItem
                        key={doc.id}
                        button
                        selected={selectedDocument?.id === doc.id}
                        onClick={() => handleDocumentSelect(doc)}
                        sx={{
                          border: '1px solid',
                          borderColor: selectedDocument?.id === doc.id ? 'primary.main' : 'divider',
                          borderRadius: 1,
                          mb: 1,
                          '&:hover': {
                            backgroundColor: 'action.hover'
                          }
                        }}
                      >
                        <ListItemIcon>
                          <DocumentIcon color={selectedDocument?.id === doc.id ? 'primary' : 'inherit'} />
                        </ListItemIcon>
                        <ListItemText
                          primary={doc.title}
                          secondary={`Category: ${doc.category} | Status: ${doc.status} | Created: ${new Date(doc.createdAt).toLocaleDateString()}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </>
          ) : (
            <>
              <DialogContentText sx={{ mb: 2 }}>
                Drill down to select the specific paragraph you want to supplement:
              </DialogContentText>
              <Box sx={{ mb: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                <Typography variant="subtitle2" color="primary">
                  Selected Document: {selectedDocument?.title}
                </Typography>
              </Box>

              {loadingStructure ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Box sx={{ maxHeight: '400px', overflow: 'auto' }}>
                  {!documentStructure || documentStructure.chapters.length === 0 ? (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      No structure found in this document. The document may not have chapters, sections, or formatted headings.
                      <br /><br />
                      Please check the browser console for details about what content was loaded.
                    </Alert>
                  ) : (
                    documentStructure.chapters.map((chapter: any) => (
                    <Box key={chapter.id}>
                      {/* Chapter Level - Now Selectable */}
                      <ListItem
                        button
                        selected={selectedSection === chapter.id}
                        sx={{
                          bgcolor: selectedSection === chapter.id ? 'primary.light' : 'grey.100',
                          border: selectedSection === chapter.id ? '2px solid' : '1px solid',
                          borderColor: selectedSection === chapter.id ? 'primary.main' : 'grey.300',
                          mb: 1,
                          borderRadius: 1,
                          '&:hover': { bgcolor: selectedSection === chapter.id ? 'primary.light' : 'grey.200' }
                        }}
                      >
                        <ListItemIcon onClick={() => toggleSection(chapter.id)}>
                          {expandedSections.has(chapter.id) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </ListItemIcon>
                        <ListItemText
                          primary={chapter.title}
                          primaryTypographyProps={{
                            fontWeight: 'bold',
                            color: selectedSection === chapter.id ? 'primary.main' : 'text.primary'
                          }}
                          onClick={() => handleSectionSelect(chapter.id, chapter.title)}
                        />
                        {selectedSection === chapter.id && (
                          <Chip label="Selected" color="primary" size="small" />
                        )}
                      </ListItem>

                      {/* Sections Level or Paragraphs directly under Chapter */}
                      <Collapse in={expandedSections.has(chapter.id)} timeout="auto">
                        {chapter.sections && chapter.sections.length > 0 ? (
                          chapter.sections.map((section: any) => (
                          <Box key={section.id} sx={{ ml: 2 }}>
                            <ListItem
                              button
                              selected={selectedSection === section.id}
                              sx={{
                                bgcolor: selectedSection === section.id ? 'primary.light' : 'grey.50',
                                border: selectedSection === section.id ? '2px solid' : '1px solid',
                                borderColor: selectedSection === section.id ? 'primary.main' : 'grey.200',
                                mb: 0.5,
                                borderRadius: 1,
                                '&:hover': { bgcolor: selectedSection === section.id ? 'primary.light' : 'grey.100' }
                              }}
                            >
                              <ListItemIcon onClick={() => toggleSection(section.id)}>
                                {expandedSections.has(section.id) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                              </ListItemIcon>
                              <ListItemText
                                primary={section.title}
                                primaryTypographyProps={{
                                  fontWeight: '500',
                                  color: selectedSection === section.id ? 'primary.main' : 'text.primary'
                                }}
                                onClick={() => handleSectionSelect(section.id, section.title)}
                              />
                              {selectedSection === section.id && (
                                <Chip label="Selected" color="primary" size="small" />
                              )}
                            </ListItem>

                            {/* Subsections Level (H4) - Now Selectable */}
                            <Collapse in={expandedSections.has(section.id)} timeout="auto">
                              {section.subsections && section.subsections.length > 0 ? (
                                section.subsections.map((subsection: any) => (
                                  <Box key={subsection.id} sx={{ ml: 2 }}>
                                    <ListItem
                                      button
                                      selected={selectedSection === subsection.id}
                                      sx={{
                                        bgcolor: selectedSection === subsection.id ? 'primary.light' : 'background.paper',
                                        border: selectedSection === subsection.id ? '2px solid' : '1px solid',
                                        borderColor: selectedSection === subsection.id ? 'primary.main' : 'divider',
                                        mb: 0.5,
                                        borderRadius: 1,
                                        '&:hover': { bgcolor: selectedSection === subsection.id ? 'primary.light' : 'grey.50' }
                                      }}
                                    >
                                      <ListItemIcon onClick={() => toggleSection(subsection.id)}>
                                        {expandedSections.has(subsection.id) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                      </ListItemIcon>
                                      <ListItemText
                                        primary={subsection.title}
                                        onClick={() => handleSectionSelect(subsection.id, subsection.title)}
                                        primaryTypographyProps={{
                                          color: selectedSection === subsection.id ? 'primary.main' : 'text.primary',
                                          fontWeight: selectedSection === subsection.id ? 'bold' : 'normal'
                                        }}
                                      />
                                      {selectedSection === subsection.id && (
                                        <Chip label="Selected" color="primary" size="small" />
                                      )}
                                    </ListItem>

                                    {/* Sub-subsections (H5) and Paragraphs under Subsection (H4) */}
                                    <Collapse in={expandedSections.has(subsection.id)} timeout="auto">
                                      {/* Render sub-subsections if they exist */}
                                      {subsection.subsubsections && subsection.subsubsections.length > 0 ? (
                                        subsection.subsubsections.map((subsubsection: any) => (
                                          <Box key={subsubsection.id} sx={{ ml: 3 }}>
                                            <ListItem
                                              button
                                              selected={selectedSection === subsubsection.id}
                                              sx={{
                                                bgcolor: selectedSection === subsubsection.id ? 'primary.light' : 'grey.50',
                                                border: selectedSection === subsubsection.id ? '2px solid' : '1px solid',
                                                borderColor: selectedSection === subsubsection.id ? 'primary.main' : 'divider',
                                                mb: 0.5,
                                                borderRadius: 1,
                                                '&:hover': { bgcolor: selectedSection === subsubsection.id ? 'primary.light' : 'action.hover' }
                                              }}
                                            >
                                              <ListItemIcon onClick={() => toggleSection(subsubsection.id)}>
                                                {expandedSections.has(subsubsection.id) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                              </ListItemIcon>
                                              <ListItemText
                                                primary={subsubsection.title}
                                                onClick={() => handleSectionSelect(subsubsection.id, subsubsection.title)}
                                                primaryTypographyProps={{
                                                  color: selectedSection === subsubsection.id ? 'primary.main' : 'text.primary',
                                                  fontWeight: selectedSection === subsubsection.id ? 'bold' : 'normal',
                                                  fontSize: '0.9rem'
                                                }}
                                              />
                                              {selectedSection === subsubsection.id && (
                                                <Chip label="Selected" color="primary" size="small" />
                                              )}
                                            </ListItem>

                                            {/* Paragraphs under Sub-subsection */}
                                            <Collapse in={expandedSections.has(subsubsection.id)} timeout="auto">
                                              {subsubsection.paragraphs?.map((paragraph: any) => (
                                                <SelectableParagraph
                                                  key={paragraph.id}
                                                  paragraph={paragraph}
                                                  selectedSection={selectedSection}
                                                  onSelect={handleSectionSelect}
                                                  marginLeft={5}
                                                />
                                              ))}
                                            </Collapse>
                                          </Box>
                                        ))
                                      ) : (
                                        // Paragraphs directly under Subsection (no sub-subsections)
                                        subsection.paragraphs?.map((paragraph: any) => (
                                          <SelectableParagraph
                                            key={paragraph.id}
                                            paragraph={paragraph}
                                            selectedSection={selectedSection}
                                            onSelect={handleSectionSelect}
                                            marginLeft={4}
                                          />
                                        ))
                                      )}
                                    </Collapse>
                                  </Box>
                                ))
                              ) : (
                                // Paragraphs directly under Section (no subsections)
                                section.paragraphs?.map((paragraph: any) => (
                                  <SelectableParagraph
                                    key={paragraph.id}
                                    paragraph={paragraph}
                                    selectedSection={selectedSection}
                                    onSelect={handleSectionSelect}
                                    marginLeft={2}
                                  />
                                ))
                              )}
                            </Collapse>
                          </Box>
                          ))
                        ) : (
                          // Paragraphs directly under Chapter (no sections)
                          chapter.paragraphs?.map((paragraph: any) => (
                            <SelectableParagraph
                              key={paragraph.id}
                              paragraph={paragraph}
                              selectedSection={selectedSection}
                              onSelect={handleSectionSelect}
                              marginLeft={1}
                            />
                          ))
                        )}
                      </Collapse>
                    </Box>
                    ))
                  )}
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={handleSupplementDialogClose}
            color="inherit"
            variant="outlined"
          >
            Cancel
          </Button>
          <Box sx={{ flex: 1 }} />
          {supplementStep === 2 && (
            <Button
              onClick={() => setSupplementStep(1)}
              color="primary"
              variant="outlined"
              startIcon={<ArrowBackIcon />}
            >
              Previous
            </Button>
          )}
          <Button
            onClick={supplementStep === 1 ? () => setSupplementStep(2) : handleSupplementCreate}
            color="primary"
            variant="contained"
            disabled={supplementStep === 1 ? !selectedDocument : !selectedSection}
            endIcon={supplementStep === 1 ? <ArrowForwardIcon /> : <AddIcon />}
          >
            {supplementStep === 1 ? 'Next' : 'Create Supplement'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DashboardPage;