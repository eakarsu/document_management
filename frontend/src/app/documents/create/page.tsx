'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  Grid,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Chip,
  Divider,
  CardActionArea
} from '@mui/material';
import {
  ArrowBack,
  Business,
  Description as DocumentIcon,
  Create as CreateIcon
} from '@mui/icons-material';
import { api } from '@/lib/api';

const CreateDocumentPage: React.FC = () => {
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [documentTitle, setDocumentTitle] = useState('');
  const [documentDescription, setDocumentDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const templates = [
    // Air Force Documents
    { value: 'af-manual', label: 'Air Force Manual (AFM)', category: 'Air Force' },
    { value: 'afi', label: 'Air Force Instruction (AFI)', category: 'Air Force' },
    { value: 'afpd', label: 'Air Force Policy Directive (AFPD)', category: 'Air Force' },
    { value: 'afman', label: 'Air Force Manual (AFMAN)', category: 'Air Force' },
    { value: 'afjqs', label: 'Air Force Job Qualification Standard (AFJQS)', category: 'Air Force' },
    { value: 'afto', label: 'Air Force Technical Order (AFTO)', category: 'Air Force' },
    { value: 'afva', label: 'Air Force Visual Aid (AFVA)', category: 'Air Force' },
    { value: 'afh', label: 'Air Force Handbook (AFH)', category: 'Air Force' },
    { value: 'afgm', label: 'Air Force Guidance Memorandum (AFGM)', category: 'Air Force' },
    { value: 'afmd', label: 'Air Force Mission Directive (AFMD)', category: 'Air Force' },

    // Department of the Air Force
    { value: 'dafi-template', label: 'Department of the Air Force Instruction (DAFI)', category: 'DAF' },
    { value: 'dafman-template', label: 'Department of the Air Force Manual (DAFMAN)', category: 'DAF' },
    { value: 'dafpd-template', label: 'Department of the Air Force Policy Directive (DAFPD)', category: 'DAF' },

    // Space Force
    { value: 'spaceforce', label: 'Space Force Instruction (SFI)', category: 'Space Force' },

    // Other Services
    { value: 'army', label: 'Army Regulation (AR)', category: 'Army' },
    { value: 'navy', label: 'Navy Instruction (OPNAVINST)', category: 'Navy' },
    { value: 'marine', label: 'Marine Corps Order (MCO)', category: 'Marines' },

    // Department of Defense
    { value: 'dodd', label: 'Department of Defense Directive (DODD)', category: 'DoD' },
    { value: 'dodi', label: 'Department of Defense Instruction (DODI)', category: 'DoD' },
    { value: 'cjcs', label: 'Chairman Joint Chiefs of Staff Instruction (CJCSI)', category: 'Joint' },

    // Operational Documents
    { value: 'oplan', label: 'Operation Plan (OPLAN)', category: 'Operations' },
    { value: 'opord', label: 'Operation Order (OPORD)', category: 'Operations' },
    { value: 'conops', label: 'Concept of Operations (CONOPS)', category: 'Operations' },

    // Generic Documents
    { value: 'technical', label: 'Technical Documentation', category: 'Generic' },
    { value: 'policy', label: 'Policy Document', category: 'Generic' },
    { value: 'training', label: 'Training Manual', category: 'Generic' },
    { value: 'sop', label: 'Standard Operating Procedure (SOP)', category: 'Generic' },
    { value: 'blank', label: 'Blank Document', category: 'Generic' }
  ];

  const categories = Array.from(new Set(templates.map(t => t.category)));

  const handleCreateDocument = async () => {
    if (!documentTitle || !selectedTemplate) {
      setError('Please provide a title and select a template');
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const response = await api.post('/api/documents/create-with-template', {
        title: documentTitle,
        description: documentDescription,
        templateId: selectedTemplate,
        category: 'manual'
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/editor/${data.document.id}`);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create document');
      }
    } catch (error) {
      console.error('Error creating document:', error);
      setError('Failed to create document');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => router.push('/dashboard')}
            sx={{ mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          <Business sx={{ mr: 2 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Create New Document
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Document Information */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Document Information
          </Typography>
          <TextField
            label="Document Title"
            value={documentTitle}
            onChange={(e) => setDocumentTitle(e.target.value)}
            fullWidth
            required
            sx={{ mb: 2 }}
            placeholder="Enter document title..."
          />
          <TextField
            label="Description (Optional)"
            value={documentDescription}
            onChange={(e) => setDocumentDescription(e.target.value)}
            fullWidth
            multiline
            rows={2}
            placeholder="Enter document description..."
          />
        </Paper>

        {/* Template Selection */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Select Document Template
          </Typography>

          {categories.map(category => (
            <Box key={category} sx={{ mb: 3 }}>
              <Typography variant="subtitle1" color="primary" sx={{ mb: 1, fontWeight: 600 }}>
                {category}
              </Typography>
              <Grid container spacing={2}>
                {templates
                  .filter(t => t.category === category)
                  .map(template => (
                    <Grid item xs={12} sm={6} md={4} key={template.value}>
                      <Card
                        sx={{
                          cursor: 'pointer',
                          border: selectedTemplate === template.value ? 2 : 1,
                          borderColor: selectedTemplate === template.value ? 'primary.main' : 'divider',
                          backgroundColor: selectedTemplate === template.value ? 'action.selected' : 'background.paper',
                          '&:hover': {
                            boxShadow: 3
                          }
                        }}
                      >
                        <CardActionArea onClick={() => setSelectedTemplate(template.value)}>
                          <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <DocumentIcon color={selectedTemplate === template.value ? 'primary' : 'action'} />
                              <Typography variant="body1" sx={{ fontWeight: selectedTemplate === template.value ? 600 : 400 }}>
                                {template.label}
                              </Typography>
                            </Box>
                          </CardContent>
                        </CardActionArea>
                      </Card>
                    </Grid>
                  ))}
              </Grid>
              {category !== categories[categories.length - 1] && <Divider sx={{ mt: 2 }} />}
            </Box>
          ))}
        </Paper>

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            onClick={() => router.push('/dashboard')}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleCreateDocument}
            disabled={creating || !documentTitle || !selectedTemplate}
            startIcon={<CreateIcon />}
          >
            {creating ? 'Creating...' : 'Create Document'}
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default CreateDocumentPage;