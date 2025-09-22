'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
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
  const searchParams = useSearchParams();
  const templateFromUrl = searchParams.get('template');
  
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
  const [documentTemplate, setDocumentTemplate] = useState(templateFromUrl || 'af-manual');
  const [documentPages, setDocumentPages] = useState(5);
  const [feedbackCount, setFeedbackCount] = useState(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDocument, setGeneratedDocument] = useState<any>(null);
  const [error, setError] = useState('');

  // Update template when URL parameter changes
  useEffect(() => {
    if (templateFromUrl) {
      setDocumentTemplate(templateFromUrl);
      
      // Auto-update header fields based on template
      const defaults = getTemplateDefaults(templateFromUrl);
      setDocumentInfo(prev => ({
        ...prev,
        secretaryText: defaults.secretary || prev.secretaryText,
        byOrderText: 'BY ORDER OF THE'
      }));
    }
  }, [templateFromUrl]);

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

  // Helper function to get seal path and organization based on template
  const getTemplateDefaults = (template: string) => {
    const templateMap: Record<string, { seal: string; organization: string; secretary?: string }> = {
      'af-manual': { 
        seal: '/images/air-force-seal.png', 
        organization: 'DEPARTMENT OF THE AIR FORCE',
        secretary: 'SECRETARY OF THE AIR FORCE'
      },
      'afi': { 
        seal: '/images/air-force-seal.png', 
        organization: 'DEPARTMENT OF THE AIR FORCE',
        secretary: 'SECRETARY OF THE AIR FORCE'
      },
      'afpd': { 
        seal: '/images/air-force-seal.png', 
        organization: 'DEPARTMENT OF THE AIR FORCE',
        secretary: 'SECRETARY OF THE AIR FORCE'
      },
      'afman': { 
        seal: '/images/air-force-seal.png', 
        organization: 'DEPARTMENT OF THE AIR FORCE',
        secretary: 'SECRETARY OF THE AIR FORCE'
      },
      'afjqs': { 
        seal: '/images/air-force-seal.png', 
        organization: 'DEPARTMENT OF THE AIR FORCE',
        secretary: 'SECRETARY OF THE AIR FORCE'
      },
      'afto': { 
        seal: '/images/air-force-seal.png', 
        organization: 'DEPARTMENT OF THE AIR FORCE',
        secretary: 'SECRETARY OF THE AIR FORCE'
      },
      'afva': { 
        seal: '/images/air-force-seal.png', 
        organization: 'DEPARTMENT OF THE AIR FORCE',
        secretary: 'SECRETARY OF THE AIR FORCE'
      },
      'afh': { 
        seal: '/images/air-force-seal.png', 
        organization: 'DEPARTMENT OF THE AIR FORCE',
        secretary: 'SECRETARY OF THE AIR FORCE'
      },
      'afgm': { 
        seal: '/images/air-force-seal.png', 
        organization: 'DEPARTMENT OF THE AIR FORCE',
        secretary: 'SECRETARY OF THE AIR FORCE'
      },
      'afmd': { 
        seal: '/images/air-force-seal.png', 
        organization: 'DEPARTMENT OF THE AIR FORCE',
        secretary: 'SECRETARY OF THE AIR FORCE'
      },
      'dafi': { 
        seal: '/images/air-force-seal.png', 
        organization: 'DEPARTMENT OF THE AIR FORCE',
        secretary: 'SECRETARY OF THE AIR FORCE'
      },
      'dafman': { 
        seal: '/images/air-force-seal.png', 
        organization: 'DEPARTMENT OF THE AIR FORCE',
        secretary: 'SECRETARY OF THE AIR FORCE'
      },
      'dafpd': { 
        seal: '/images/air-force-seal.png', 
        organization: 'DEPARTMENT OF THE AIR FORCE',
        secretary: 'SECRETARY OF THE AIR FORCE'
      },
      'dodd': { 
        seal: '/images/dod-seal.png', 
        organization: 'DEPARTMENT OF DEFENSE',
        secretary: 'SECRETARY OF DEFENSE'
      },
      'dodi': { 
        seal: '/images/dod-seal.png', 
        organization: 'DEPARTMENT OF DEFENSE',
        secretary: 'SECRETARY OF DEFENSE'
      },
      'cjcs': { 
        seal: '/images/joint-chiefs-seal.png', 
        organization: 'JOINT CHIEFS OF STAFF',
        secretary: 'CHAIRMAN OF THE JOINT CHIEFS OF STAFF'
      },
      'army': { 
        seal: '/images/army-seal.png', 
        organization: 'DEPARTMENT OF THE ARMY',
        secretary: 'SECRETARY OF THE ARMY'
      },
      'navy': { 
        seal: '/images/navy-seal.png', 
        organization: 'DEPARTMENT OF THE NAVY',
        secretary: 'SECRETARY OF THE NAVY'
      },
      'marine': { 
        seal: '/images/marine-corps-seal.png', 
        organization: 'UNITED STATES MARINE CORPS',
        secretary: 'COMMANDANT OF THE MARINE CORPS'
      },
      'spaceforce': { 
        seal: '/images/space-force-seal.png', 
        organization: 'UNITED STATES SPACE FORCE',
        secretary: 'CHIEF OF SPACE OPERATIONS'
      },
      // Default for other templates
      'technical': { 
        seal: '/images/air-force-seal.png', 
        organization: 'DEPARTMENT OF THE AIR FORCE',
        secretary: 'SECRETARY OF THE AIR FORCE'
      },
      'policy': { 
        seal: '/images/air-force-seal.png', 
        organization: 'DEPARTMENT OF THE AIR FORCE',
        secretary: 'SECRETARY OF THE AIR FORCE'
      },
      'training': { 
        seal: '/images/air-force-seal.png', 
        organization: 'DEPARTMENT OF THE AIR FORCE',
        secretary: 'SECRETARY OF THE AIR FORCE'
      },
      'sop': { 
        seal: '/images/air-force-seal.png', 
        organization: 'DEPARTMENT OF THE AIR FORCE',
        secretary: 'SECRETARY OF THE AIR FORCE'
      },
      'oplan': { 
        seal: '/images/dod-seal.png', 
        organization: 'DEPARTMENT OF DEFENSE',
        secretary: 'SECRETARY OF DEFENSE'
      },
      'opord': { 
        seal: '/images/dod-seal.png', 
        organization: 'DEPARTMENT OF DEFENSE',
        secretary: 'SECRETARY OF DEFENSE'
      },
      'conops': { 
        seal: '/images/dod-seal.png', 
        organization: 'DEPARTMENT OF DEFENSE',
        secretary: 'SECRETARY OF DEFENSE'
      },
      'ttp': { 
        seal: '/images/dod-seal.png', 
        organization: 'DEPARTMENT OF DEFENSE',
        secretary: 'SECRETARY OF DEFENSE'
      }
    };
    
    return templateMap[template] || templateMap['technical'];
  };

  const generateAIDocument = async () => {
    setIsGenerating(true);
    setError('');

    try {
      // Get template defaults
      const templateDefaults = getTemplateDefaults(documentTemplate);
      
      // Prepare seal image if uploaded, otherwise use template default
      let sealImage = null;
      if (sealFile) {
        const reader = new FileReader();
        sealImage = await new Promise<string>((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(sealFile);
        });
      } else {
        // Load the default seal for this template
        const response = await fetch(templateDefaults.seal);
        const blob = await response.blob();
        const reader = new FileReader();
        sealImage = await new Promise<string>((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(blob);
        });
      }

      // Prepare header data with template-specific organization
      const headerData = {
        organization: templateDefaults.organization,
        documentType: documentInfo.instructionTitle,
        secretary: documentInfo.secretaryText || templateDefaults.secretary,
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
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/ai-document-generator`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
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
                {/* Air Force Documents */}
                <MenuItem value="af-manual">Air Force Manual (AFM)</MenuItem>
                <MenuItem value="afi">Air Force Instruction (AFI)</MenuItem>
                <MenuItem value="afpd">Air Force Policy Directive (AFPD)</MenuItem>
                <MenuItem value="afman">Air Force Manual (AFMAN)</MenuItem>
                <MenuItem value="afjqs">Air Force Job Qualification Standard (AFJQS)</MenuItem>
                <MenuItem value="afto">Air Force Technical Order (AFTO)</MenuItem>
                <MenuItem value="afva">Air Force Visual Aid (AFVA)</MenuItem>
                <MenuItem value="afh">Air Force Handbook (AFH)</MenuItem>
                <MenuItem value="afgm">Air Force Guidance Memorandum (AFGM)</MenuItem>
                <MenuItem value="afmd">Air Force Mission Directive (AFMD)</MenuItem>
                <MenuItem value="dafi">Department of the Air Force Instruction (DAFI)</MenuItem>
                <MenuItem value="dafman">Department of the Air Force Manual (DAFMAN)</MenuItem>
                <MenuItem value="dafpd">Department of the Air Force Policy Directive (DAFPD)</MenuItem>
                
                {/* Space Force Documents */}
                <MenuItem value="spaceforce">Space Force Instruction (SFI)</MenuItem>
                
                {/* Army Documents */}
                <MenuItem value="army">Army Regulation (AR)</MenuItem>
                
                {/* Navy Documents */}
                <MenuItem value="navy">Navy Instruction (OPNAVINST)</MenuItem>
                
                {/* Marine Corps Documents */}
                <MenuItem value="marine">Marine Corps Order (MCO)</MenuItem>
                
                {/* Joint/DoD Documents */}
                <MenuItem value="dodd">Department of Defense Directive (DODD)</MenuItem>
                <MenuItem value="dodi">Department of Defense Instruction (DODI)</MenuItem>
                <MenuItem value="cjcs">Chairman Joint Chiefs of Staff Instruction (CJCSI)</MenuItem>
                
                {/* Operational Documents */}
                <MenuItem value="oplan">Operation Plan (OPLAN)</MenuItem>
                <MenuItem value="opord">Operation Order (OPORD)</MenuItem>
                <MenuItem value="conops">Concept of Operations (CONOPS)</MenuItem>
                
                {/* Generic Documents */}
                <MenuItem value="technical">Technical Documentation</MenuItem>
                <MenuItem value="policy">Policy Document</MenuItem>
                <MenuItem value="training">Training Manual</MenuItem>
                <MenuItem value="sop">Standard Operating Procedure (SOP)</MenuItem>
                <MenuItem value="ttp">Tactics, Techniques, and Procedures (TTP)</MenuItem>
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
                secretaryText={documentInfo.secretaryText || getTemplateDefaults(documentTemplate).secretary}
                complianceText={documentInfo.complianceText}
                opr={documentInfo.opr}
                certifiedBy={documentInfo.certifiedBy}
                pages={documentInfo.pages}
                sealImagePath={sealPreview || getTemplateDefaults(documentTemplate).seal}
                organizationName={getTemplateDefaults(documentTemplate).organization}
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