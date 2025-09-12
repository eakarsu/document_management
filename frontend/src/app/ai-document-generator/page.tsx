'use client';

import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  Grid, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  Alert,
  CircularProgress,
  Chip,
  Divider
} from '@mui/material';
import { Upload, AutoAwesome, Article, Preview } from '@mui/icons-material';
import AirForceDocumentHeader from '@/components/documents/AirForceDocumentHeader';

interface DocumentInfo {
  instructionTitle: string;
  date: string;
  subject: string;
  responsibilities: string;
  byOrderText: string;
  secretaryText: string;
  complianceText: string;
  opr: string;
  certifiedBy: string;
  pages: number;
}

const AIDocumentGenerator: React.FC = () => {
  const [sealFile, setSealFile] = useState<File | null>(null);
  const [sealPreview, setSealPreview] = useState<string>('');
  const [documentInfo, setDocumentInfo] = useState<DocumentInfo>({
    instructionTitle: 'AIR FORCE INSTRUCTION 36-2618',
    date: new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }),
    subject: 'The Enlisted Force Structure',
    responsibilities: 'AIRMAN AND FAMILY READINESS',
    byOrderText: 'BY ORDER OF THE',
    secretaryText: 'SECRETARY OF THE AIR FORCE',
    complianceText: 'COMPLIANCE WITH THIS PUBLICATION IS MANDATORY',
    opr: 'SAF/IG',
    certifiedBy: 'AF/CV (General Larry O. Spencer)',
    pages: 6
  });
  const [documentTemplate, setDocumentTemplate] = useState('af-manual');
  const [documentPages, setDocumentPages] = useState(5);
  const [feedbackCount, setFeedbackCount] = useState(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDocument, setGeneratedDocument] = useState<any>(null);
  const [error, setError] = useState('');

  const handleSealUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSealFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setSealPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (field: keyof DocumentInfo, value: any) => {
    setDocumentInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generateAIDocument = async () => {
    setIsGenerating(true);
    setError('');

    try {
      // Prepare seal image if uploaded
      let sealImage = null;
      if (sealFile) {
        const reader = new FileReader();
        sealImage = await new Promise<string>((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(sealFile);
        });
      }

      // Prepare header data
      const headerData = {
        organization: 'DEPARTMENT OF THE AIR FORCE',
        documentType: documentInfo.instructionTitle,
        secretary: documentInfo.secretaryText,
        subject: documentInfo.subject,
        category: documentInfo.responsibilities,
        opr: documentInfo.opr,
        certifiedBy: documentInfo.certifiedBy.split('(')[0].trim(),
        certifiedByName: documentInfo.certifiedBy.includes('(') ? 
          '(' + documentInfo.certifiedBy.split('(')[1] : '',
        documentDate: documentInfo.date.toUpperCase(),
        compliance: documentInfo.complianceText,
        byOrderOf: documentInfo.byOrderText
      };

      // Call our backend API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/ai-document-generator`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          template: documentTemplate,
          pages: documentPages,
          feedbackCount: feedbackCount,
          sealImage: sealImage,
          headerData: headerData
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate document');
      }

      const result = await response.json();
      setGeneratedDocument({
        id: result.documentId,
        pages: documentPages,
        feedbackCount: result.feedbackCount,
        title: result.title
      });

      // Redirect to document after 2 seconds
      setTimeout(() => {
        window.location.href = `/documents/${result.documentId}`;
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate document');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h3" component="h1" gutterBottom sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2,
        mb: 3
      }}>
        <AutoAwesome color="primary" />
        AI-Powered Air Force Document Generator
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Upload your Air Force seal and provide document details. AI will generate a complete, properly formatted Air Force document with official header.
      </Typography>

      <Grid container spacing={3}>
        {/* Input Section */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Upload /> Document Setup
            </Typography>

            {/* Seal Upload */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>Air Force Seal</Typography>
              <Button
                variant="outlined"
                component="label"
                fullWidth
                sx={{ mb: 2, p: 2 }}
              >
                Upload Seal Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleSealUpload}
                  hidden
                />
              </Button>
              {sealPreview && (
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <img 
                    src={sealPreview} 
                    alt="Seal Preview" 
                    style={{ maxWidth: 120, maxHeight: 120, borderRadius: 8 }}
                  />
                  <Typography variant="caption" display="block">Preview</Typography>
                </Box>
              )}
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Header Authority Section */}
            <Typography variant="h6" gutterBottom>Header Authority</Typography>
            
            <TextField
              label="By Order Of"
              value={documentInfo.byOrderText}
              onChange={(e) => handleInputChange('byOrderText', e.target.value)}
              fullWidth
              sx={{ mb: 2 }}
              placeholder="BY ORDER OF THE"
              helperText="Top line of the header (e.g., BY ORDER OF THE)"
            />

            <TextField
              label="Secretary Text"
              value={documentInfo.secretaryText}
              onChange={(e) => handleInputChange('secretaryText', e.target.value)}
              fullWidth
              sx={{ mb: 2 }}
              placeholder="SECRETARY OF THE AIR FORCE"
              helperText="Authority title (e.g., SECRETARY OF THE AIR FORCE)"
            />

            <TextField
              label="Compliance Text"
              value={documentInfo.complianceText}
              onChange={(e) => handleInputChange('complianceText', e.target.value)}
              fullWidth
              sx={{ mb: 2 }}
              placeholder="COMPLIANCE WITH THIS PUBLICATION IS MANDATORY"
              helperText="Compliance statement that appears below the header"
            />

            <Divider sx={{ my: 2 }} />

            {/* Document Details */}
            <Typography variant="h6" gutterBottom>Document Details</Typography>

            <TextField
              label="Instruction Title"
              value={documentInfo.instructionTitle}
              onChange={(e) => handleInputChange('instructionTitle', e.target.value)}
              fullWidth
              sx={{ mb: 2 }}
              helperText="Document number (e.g., AIR FORCE INSTRUCTION 36-2618)"
            />

            <TextField
              label="Date"
              value={documentInfo.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              fullWidth
              sx={{ mb: 2 }}
              helperText="Publication date (e.g., December 5, 2023)"
            />

            <TextField
              label="Subject"
              value={documentInfo.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              fullWidth
              sx={{ mb: 2 }}
              helperText="Document subject (e.g., The Enlisted Force Structure)"
            />

            <TextField
              label="Responsibilities/Category"
              value={documentInfo.responsibilities}
              onChange={(e) => handleInputChange('responsibilities', e.target.value)}
              fullWidth
              sx={{ mb: 2 }}
              helperText="Department or category (e.g., AIRMAN AND FAMILY READINESS)"
            />

            <TextField
              label="Certified By"
              value={documentInfo.certifiedBy}
              onChange={(e) => handleInputChange('certifiedBy', e.target.value)}
              fullWidth
              sx={{ mb: 2 }}
              helperText="Certifying official (e.g., AF/CV (General Larry O. Spencer))"
            />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="OPR"
                  value={documentInfo.opr}
                  onChange={(e) => handleInputChange('opr', e.target.value)}
                  fullWidth
                  helperText="Office of Primary Responsibility"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Pages"
                  type="number"
                  value={documentInfo.pages}
                  onChange={(e) => handleInputChange('pages', parseInt(e.target.value))}
                  fullWidth
                  helperText="Total page count"
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            {/* AI Generation Settings */}
            <Typography variant="h6" gutterBottom>AI Generation Settings</Typography>
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Document Template</InputLabel>
              <Select
                value={documentTemplate}
                onChange={(e) => setDocumentTemplate(e.target.value)}
              >
                <MenuItem value="af-manual">Air Force Manual</MenuItem>
                <MenuItem value="technical">Technical Documentation</MenuItem>
                <MenuItem value="policy">Policy Document</MenuItem>
                <MenuItem value="training">Training Manual</MenuItem>
                <MenuItem value="sop">Standard Operating Procedure</MenuItem>
              </Select>
            </FormControl>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6}>
                <TextField
                  label="Content Pages"
                  type="number"
                  value={documentPages}
                  onChange={(e) => setDocumentPages(parseInt(e.target.value))}
                  inputProps={{ min: 1, max: 20 }}
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="AI Feedback Items"
                  type="number"
                  value={feedbackCount}
                  onChange={(e) => setFeedbackCount(parseInt(e.target.value))}
                  inputProps={{ min: 0, max: 50 }}
                  fullWidth
                />
              </Grid>
            </Grid>

            <Button
              variant="contained"
              size="large"
              onClick={generateAIDocument}
              disabled={isGenerating}
              fullWidth
              sx={{ mb: 2 }}
            >
              {isGenerating ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Generating Document...
                </>
              ) : (
                <>
                  <AutoAwesome sx={{ mr: 1 }} />
                  Generate AI Document
                </>
              )}
            </Button>

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </Paper>
        </Grid>

        {/* Preview Section */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Preview /> Live Preview
            </Typography>

            <Box sx={{ 
              border: 1, 
              borderColor: 'grey.300', 
              borderRadius: 1, 
              p: 2, 
              backgroundColor: 'background.paper',
              maxHeight: 600,
              overflow: 'auto'
            }}>
              <AirForceDocumentHeader
                instructionTitle={documentInfo.instructionTitle}
                date={documentInfo.date}
                subject={documentInfo.subject}
                responsibilities={documentInfo.responsibilities}
                byOrderText={documentInfo.byOrderText}
                secretaryText={documentInfo.secretaryText}
                complianceText={documentInfo.complianceText}
                opr={documentInfo.opr}
                certifiedBy={documentInfo.certifiedBy}
                pages={documentInfo.pages}
                sealImagePath={sealPreview || '/images/air-force-seal.png'}
              />
            </Box>

            {generatedDocument && (
              <Box sx={{ mt: 3 }}>
                <Alert severity="success" sx={{ mb: 2 }}>
                  <Typography variant="h6">Document Generated Successfully!</Typography>
                  <Box sx={{ mt: 1 }}>
                    <Chip label={`${generatedDocument.pages} pages`} size="small" sx={{ mr: 1 }} />
                    <Chip label={`${generatedDocument.feedbackCount} AI suggestions`} size="small" sx={{ mr: 1 }} />
                    <Chip label={documentTemplate.toUpperCase()} size="small" />
                  </Box>
                </Alert>
                
                <Button
                  variant="outlined"
                  href={`/documents/${generatedDocument.id}`}
                  target="_blank"
                  startIcon={<Article />}
                  fullWidth
                  sx={{ mb: 1 }}
                >
                  View Generated Document
                </Button>
                
                <Button
                  variant="outlined"
                  href={`/editor/${generatedDocument.id}`}
                  target="_blank"
                  startIcon={<Article />}
                  fullWidth
                >
                  Edit in Document Editor
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AIDocumentGenerator;