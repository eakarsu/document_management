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

      // Create document content based on selected template
      let documentContent = `# ${documentData.title}\n\n`;
      
      // Add document metadata
      documentContent += `**Publication Number:** ${documentData.publicationNumber || '[To be assigned]'}\n`;
      documentContent += `**OPR:** ${documentData.opr || '[To be specified]'}\n`;
      documentContent += `**Date:** ${new Date().toLocaleDateString()}\n\n`;
      
      if (documentData.supersedes) {
        documentContent += `**Supersedes:** ${documentData.supersedes}\n\n`;
      }

      // Add template sections with content
      template.sections.forEach(section => {
        documentContent += `## ${section}\n\n`;
        
        switch (section.toLowerCase()) {
          case 'header':
            documentContent += `BY ORDER OF THE SECRETARY OF THE AIR FORCE\n\n`;
            documentContent += `${template.name.toUpperCase()} ${documentData.publicationNumber || '[NUMBER]'}\n\n`;
            documentContent += `${new Date().toLocaleDateString()}\n\n`;
            documentContent += `${documentData.title}\n\n`;
            break;
          
          case 'background/biography':
          case 'subject biography':
          case 'biography/background':
            documentContent += `**Background and Biographical Information:**\n\n`;
            documentContent += `This section provides the historical background, biographical context, and foundational information relevant to this publication. `;
            documentContent += `Please include:\n\n`;
            documentContent += `- Historical context and development\n`;
            documentContent += `- Key personnel or subject biographies\n`;
            documentContent += `- Organizational background\n`;
            documentContent += `- Previous versions and evolution\n`;
            documentContent += `- Relevant regulatory history\n\n`;
            documentContent += `[Please replace this placeholder with specific biographical and background information for your publication.]\n\n`;
            break;
          
          case 'policy statement':
            documentContent += `This directive establishes policy for [specify the subject matter]. `;
            documentContent += `It applies to all Air Force personnel and operations.\n\n`;
            break;
          
          case 'responsibilities':
            documentContent += `**Air Force Chief of Staff.** [Define responsibilities]\n\n`;
            documentContent += `**Major Commands.** [Define responsibilities]\n\n`;
            documentContent += `**Wings and Units.** [Define responsibilities]\n\n`;
            break;
          
          case 'procedures':
            documentContent += `1. [Step-by-step procedures]\n`;
            documentContent += `2. [Additional procedures]\n`;
            documentContent += `3. [More procedures as needed]\n\n`;
            break;
          
          case 'implementation':
            documentContent += `This directive is effective immediately. `;
            documentContent += `Commands will ensure compliance within [specify timeframe].\n\n`;
            break;
          
          default:
            documentContent += `[Content for ${section} - Please provide relevant information for this section.]\n\n`;
        }
      });

      // Add standard footer
      documentContent += `---\n\n`;
      documentContent += `**Certifying Official:** ${documentData.certifyingOfficial || '[Name and Title]'}\n\n`;
      documentContent += `**OPR:** ${documentData.opr || '[Office Symbol]'}\n\n`;

      // Convert markdown content to HTML for the editor
      const htmlContent = documentContent
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
        .replace(/^- (.*$)/gim, '<li>$1</li>')
        .replace(/^(\d+)\. (.*$)/gim, '<li>$2</li>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/^/, '<p>')
        .replace(/$/, '</p>');

      // Create document with content using the template endpoint
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
          // Save the HTML content to the document
          const saveResponse = await api.post(`/api/editor/documents/${data.document.id}/save`, {
            content: htmlContent,
            title: documentData.title,
            timestamp: new Date().toISOString()
          });
          
          if (saveResponse.ok) {
            alert('Document created successfully with template content!');
            // Navigate to the editor for immediate editing
            router.push(`/editor/${data.document.id}`);
          } else {
            alert('Document created but content save failed. You can still edit it.');
            router.push(`/editor/${data.document.id}`);
          }
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