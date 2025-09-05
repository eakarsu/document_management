'use client';

import React, { useState, useEffect } from 'react';
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
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import {
  ArrowBack,
  Business,
  Description as DocumentIcon,
  Create as CreateIcon,
  Assignment as AssignmentIcon,
  Gavel as LegalIcon,
  School as ManualIcon,
  Policy as PolicyIcon
} from '@mui/icons-material';
import { api } from '../../../lib/api';

// Templates matching backend template IDs
const documentTemplates = [
  // CRITICAL TEMPLATES - Coordination & Workflow
  {
    id: 'comment-resolution-matrix',
    name: 'Comment Resolution Matrix (CRM)',
    description: 'Track and resolve coordination comments',
    icon: AssignmentIcon,
    sections: ['Header Info', 'Comments', 'Resolutions', 'Coordinator Concurrence'],
    hasBiography: false
  },
  {
    id: 'af-form-673',
    name: 'AF Form 673 - Coordination Record',
    description: 'Official coordination and approval record',
    icon: LegalIcon,
    sections: ['Publication Info', 'Coordination List', 'Signatures', 'Concurrence'],
    hasBiography: false
  },
  {
    id: 'supplement-template',
    name: 'Supplement Template',
    description: 'Supplement to existing publication',
    icon: DocumentIcon,
    sections: ['Parent Pub Reference', 'Added Paragraphs', 'Modified Paragraphs', 'Local Procedures'],
    hasBiography: false
  },
  {
    id: 'o6-gs15-coordination',
    name: 'O6/GS15 Coordination',
    description: 'SME review and coordination template',
    icon: AssignmentIcon,
    sections: ['Document Info', 'SME Review', 'Technical Comments', 'Resolution'],
    hasBiography: false
  },
  {
    id: '2-letter-coordination',
    name: '2-Letter Coordination',
    description: 'Senior leadership review template',
    icon: PolicyIcon,
    sections: ['Executive Summary', 'Key Issues', 'Recommendations', 'Leadership Decision'],
    hasBiography: false
  },
  {
    id: 'legal-coordination',
    name: 'Legal Coordination',
    description: 'Legal review and compliance template',
    icon: LegalIcon,
    sections: ['Legal Requirements', 'Compliance Check', 'Statutory Review', 'Legal Approval'],
    hasBiography: false
  },
  
  // HIGH PRIORITY TEMPLATES - Policy Documents
  {
    id: 'dafpd-template',
    name: 'DAF Policy Directive (DAFPD)',
    description: 'Department of Air Force Policy Directive',
    icon: PolicyIcon,
    sections: ['Overview', 'Policy', 'Roles & Responsibilities', 'Summary', 'Attachments'],
    hasBiography: false
  },
  {
    id: 'dafman-template',
    name: 'DAF Manual (DAFMAN)',
    description: 'Department of Air Force Manual template',
    icon: ManualIcon,
    sections: ['General Information', 'Responsibilities', 'Procedures', 'Glossary'],
    hasBiography: false
  },
  {
    id: 'guidance-memorandum',
    name: 'Guidance Memorandum',
    description: 'Interim guidance pending formal publication update',
    icon: PolicyIcon,
    sections: ['Purpose', 'Background', 'Guidance', 'Specific Changes', 'Expiration'],
    hasBiography: false
  },
  {
    id: 'waiver-request',
    name: 'Waiver Request',
    description: 'Request for waiver from existing requirements',
    icon: LegalIcon,
    sections: ['Request', 'Justification', 'Alternative Compliance', 'Risk Assessment', 'Approval'],
    hasBiography: false
  },
  
  // EXISTING TEMPLATES
  {
    id: 'air-force-manual',
    name: 'Air Force Technical Manual',
    description: 'Comprehensive technical manual with procedures',
    icon: ManualIcon,
    sections: ['Introduction', 'Purpose', 'Scope', 'Safety Procedures', 'PPE Requirements'],
    hasBiography: false
  },
  {
    id: 'operational-plan',
    name: 'Operational Planning Document',
    description: 'Strategic and tactical planning template',
    icon: AssignmentIcon,
    sections: ['Executive Summary', 'Mission Statement', 'Strategic Objectives', 'Resources', 'Timeline'],
    hasBiography: false
  },
  {
    id: 'safety-bulletin',
    name: 'Safety Bulletin',
    description: 'High-priority safety communications',
    icon: PolicyIcon,
    sections: ['Priority', 'Immediate Actions', 'Background', 'Requirements', 'Compliance'],
    hasBiography: false
  },
  {
    id: 'meeting-minutes',
    name: 'Meeting Minutes',
    description: 'Standard meeting documentation',
    icon: DocumentIcon,
    sections: ['Attendees', 'Agenda Items', 'Discussion', 'Action Items', 'Next Meeting'],
    hasBiography: false
  },
  {
    id: 'blank',
    name: 'Blank Document',
    description: 'Start with a blank document',
    icon: CreateIcon,
    sections: ['Custom Content'],
    hasBiography: false
  }
];

const steps = ['Select Template', 'Document Details', 'Create'];

const CreateDocumentPage: React.FC = () => {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [documentData, setDocumentData] = useState({
    title: '',
    description: '',
    category: '',
    publicationNumber: '',
    opr: '',
    certifyingOfficial: '',
    supersedes: ''
  });
  const [loading, setLoading] = useState(false);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = documentTemplates.find(t => t.id === templateId);
    if (template) {
      setDocumentData(prev => ({ 
        ...prev, 
        category: template.name.includes('DAFPD') ? 'Policy' : 
                 template.name.includes('Instruction') ? 'Instruction' :
                 template.name.includes('Manual') ? 'Manual' : 'Document'
      }));
    }
  };

  const handleCreateDocument = async () => {
    if (!selectedTemplate || !documentData.title) {
      alert('Please fill in required fields');
      return;
    }

    setLoading(true);
    try {
      const template = documentTemplates.find(t => t.id === selectedTemplate);
      if (!template) return;

      // Create document with the ACTUAL template content from backend
      const response = await api.post('/api/documents/create-with-template', {
        title: documentData.title,
        description: documentData.description || `${template.name}: ${documentData.title}`,
        category: documentData.category,
        templateId: selectedTemplate,
        tags: ['air-force', template.name.toLowerCase()]
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.document) {
          // DO NOT overwrite the template content!
          // The backend already has the proper HTML template content
          // Just navigate to the editor
          alert('Document created successfully with template content!');
          // Navigate to the document view/edit page
          router.push(`/documents/${data.document.id}`);
        } else {
          throw new Error('Failed to create document');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create document');
      }
    } catch (error) {
      console.error('Error creating document:', error);
      alert('Failed to create document. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Choose Document Template
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Select from our available templates (4 include biography sections)
            </Typography>
            <Grid container spacing={3}>
              {documentTemplates.map((template) => (
                <Grid item xs={12} md={6} key={template.id}>
                  <Card 
                    sx={{ 
                      cursor: 'pointer',
                      border: selectedTemplate === template.id ? 2 : 1,
                      borderColor: selectedTemplate === template.id ? 'primary.main' : 'divider',
                      '&:hover': { boxShadow: 3 }
                    }}
                    onClick={() => handleTemplateSelect(template.id)}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <template.icon sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="h6">
                          {template.name}
                        </Typography>
                        {template.hasBiography && (
                          <Chip 
                            label="Biography Section" 
                            size="small" 
                            color="secondary" 
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {template.description}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                        Includes:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {template.sections.map((section) => (
                          <Chip 
                            key={section}
                            label={section}
                            size="small"
                            variant="outlined"
                            color={section.toLowerCase().includes('biograph') ? 'secondary' : 'default'}
                          />
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Document Information
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Provide the basic details for your document
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Document Title"
                  value={documentData.title}
                  onChange={(e) => setDocumentData(prev => ({ ...prev, title: e.target.value }))}
                  required
                  placeholder="Enter the full title of your publication"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Publication Number"
                  value={documentData.publicationNumber}
                  onChange={(e) => setDocumentData(prev => ({ ...prev, publicationNumber: e.target.value }))}
                  placeholder="e.g., DAFPD 10-1, AFI 36-2903"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Office of Primary Responsibility (OPR)"
                  value={documentData.opr}
                  onChange={(e) => setDocumentData(prev => ({ ...prev, opr: e.target.value }))}
                  placeholder="e.g., AF/A1, SAF/MR"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Certifying Official"
                  value={documentData.certifyingOfficial}
                  onChange={(e) => setDocumentData(prev => ({ ...prev, certifyingOfficial: e.target.value }))}
                  placeholder="Name and title of certifying official"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Supersedes (if applicable)"
                  value={documentData.supersedes}
                  onChange={(e) => setDocumentData(prev => ({ ...prev, supersedes: e.target.value }))}
                  placeholder="Previous publication being replaced"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Description"
                  value={documentData.description}
                  onChange={(e) => setDocumentData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the publication's purpose and scope"
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 2:
        const selectedTemplateObj = documentTemplates.find(t => t.id === selectedTemplate);
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Ready to Create
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Review your selections and create the document
            </Typography>
            
            <Alert severity="info" sx={{ mb: 3 }}>
              Your document will be created with the selected template structure. 
              {selectedTemplateObj?.hasBiography && ' The biography section will be included with guidance for completion.'}
            </Alert>

            <Paper sx={{ p: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">Template:</Typography>
                  <Typography variant="body1">{selectedTemplateObj?.name}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">Title:</Typography>
                  <Typography variant="body1">{documentData.title}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">Publication Number:</Typography>
                  <Typography variant="body1">{documentData.publicationNumber || 'To be assigned'}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">OPR:</Typography>
                  <Typography variant="body1">{documentData.opr || 'To be specified'}</Typography>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => router.push('/documents')}
            sx={{ mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          <Business sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Create Document - Richmond DMS
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Create New Document
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Create a new Air Force publication using our template system (includes biography sections)
          </Typography>
        </Box>

        <Paper sx={{ p: 4 }}>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Box sx={{ minHeight: 400 }}>
            {renderStepContent(activeStep)}
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
            >
              Back
            </Button>
            <Box>
              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleCreateDocument}
                  disabled={loading || !documentData.title || !selectedTemplate}
                  startIcon={<CreateIcon />}
                >
                  {loading ? 'Creating...' : 'Create Document'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={activeStep === 0 && !selectedTemplate}
                >
                  Next
                </Button>
              )}
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default CreateDocumentPage;