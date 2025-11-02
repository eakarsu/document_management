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
import { Upload, AutoAwesome, Article, Preview, NavigateNext, NavigateBefore } from '@mui/icons-material';
import AirForceDocumentHeader from '@/components/documents/AirForceDocumentHeader';

interface DocumentInfo {
  instructionTitle: string;
  date: string;
  subject: string;
  responsibilities: string;
  byOrderText: string;
  complianceStatement: string;
  opr: string;
  certifiedBy: string;
  pages: number;
  releasabilityStatement: string;
  oprOfficeName: string;
  certifiedByOrganization: string;
  serviceAuthorityOrganization: string;
  supersedes: string;
  pageNumber: string;
  antecedentPublicationStatement: string;
  applicabilityStatement: string;
  privacyActStatement: string;
  copyrightStatement: string;
  paperworkReductionActStatement: string;
  punitiveLanguageStatement: string;
  otherStatuaryRequirements: string;
  recordsManagementStatement: string;
  recommendedChangesStatement: string;
  allowImplementingOrSupplementingStatement: string;
}

const AIDocumentGenerator: React.FC = () => {
  const searchParams = useSearchParams();
  const templateFromUrl = searchParams.get('template');
  const modeFromUrl = searchParams.get('mode');
  const isManualMode = modeFromUrl === 'manual';
  const isSupplementMode = searchParams.get('supplement') === 'true';
  const isEditMode = searchParams.get('editMode') === 'true';
  const supplementDocumentId = searchParams.get('documentId');
  const supplementSection = searchParams.get('section');

  const [sealFile, setSealFile] = useState<File | null>(null);
  const [sealPreview, setSealPreview] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);

  // Supplement-specific state
  const [supplementOrganization, setSupplementOrganization] = useState('');
  const [supplementParagraphNumber, setSupplementParagraphNumber] = useState('');
  const [supplementContent, setSupplementContent] = useState('');
  const [parentDocumentTitle, setParentDocumentTitle] = useState('');
  const [supplementElementType, setSupplementElementType] = useState('');

  // Auto-generate paragraph number and determine element type when supplement mode is active
  useEffect(() => {
    if (isSupplementMode && supplementSection) {
      const decodedSection = decodeURIComponent(supplementSection);
      console.log('📝 Processing supplement section:', decodedSection);

      // Extract paragraph number from section (e.g., "2.1 Transportation Planning" -> "2.1")
      const match = decodedSection.match(/^([\d.]+)/);

      if (match) {
        const baseNumber = match[1];
        console.log('🔢 Extracted base number:', baseNumber);

        // Determine element type based on number format
        const levels = baseNumber.split('.').filter(n => n).length;
        let elementType = 'Section';

        if (levels === 1) {
          elementType = 'Chapter';
        } else if (levels === 2) {
          elementType = 'Section';
        } else if (levels === 3) {
          elementType = 'Subsection';
        } else if (levels === 4) {
          elementType = 'Sub-subsection';
        } else if (levels >= 5) {
          elementType = 'Paragraph';
        }

        console.log('📋 Element type:', elementType, '(levels:', levels, ')');
        setSupplementElementType(elementType);

        // Auto-generate next paragraph number (e.g., "2.1" -> "2.1.1")
        const supplementNumber = `${baseNumber}.1`;
        console.log('✅ Generated supplement number:', supplementNumber);
        setSupplementParagraphNumber(supplementNumber);
      } else {
        console.warn('⚠️ No number found in section, using default');
        setSupplementElementType('Section');
        setSupplementParagraphNumber('1.1');
      }
    }
  }, [isSupplementMode, supplementSection]);

  // Fetch parent document details OR load supplement for editing
  useEffect(() => {
    if (isSupplementMode && supplementDocumentId) {
      const fetchDocument = async () => {
        try {
          const response = await fetch(`/api/documents/${supplementDocumentId}`);
          if (response.ok) {
            const data = await response.json();
            const doc = data.document || data;

            if (isEditMode) {
              // Editing existing supplement - pre-fill form
              console.log('Loading supplement for editing:', doc);
              setParentDocumentTitle(doc.title || '');
              setSupplementOrganization(doc.customFields?.organization || doc.supplementOrganization || '');
              setSupplementParagraphNumber(doc.customFields?.paragraphNumber || '');
              setSupplementContent(extractContentFromHTML(doc.customFields?.content || doc.customFields?.editableContent || ''));

              // Pre-fill OPR and Certified By
              if (doc.customFields?.opr) {
                setDocumentInfo(prev => ({ ...prev, opr: doc.customFields.opr }));
              }
              if (doc.customFields?.certifiedBy) {
                setDocumentInfo(prev => ({ ...prev, certifiedBy: doc.customFields.certifiedBy }));
              }
            } else {
              // Creating new supplement - get parent title and header information
              setParentDocumentTitle(doc.title || '');

              // Extract header information from parent document to use in supplement
              if (doc.customFields?.headerData) {
                console.log('📋 Using parent document header data:', doc.customFields.headerData);
                const headerData = doc.customFields.headerData;
                setDocumentInfo(prev => ({
                  ...prev,
                  instructionTitle: headerData.documentType || doc.title || prev.instructionTitle,
                  subject: headerData.subject || prev.subject,
                  responsibilities: headerData.category || prev.responsibilities,
                  byOrderText: headerData.byOrderOf || prev.byOrderText,
                  complianceStatement: headerData.compliance || prev.complianceStatement,
                  opr: headerData.opr || prev.opr,
                  certifiedBy: headerData.certifiedBy || prev.certifiedBy,
                  serviceAuthorityOrganization: headerData.secretary || prev.serviceAuthorityOrganization
                }));
              }
            }
          }
        } catch (error) {
          console.error('Failed to fetch document:', error);
        }
      };
      fetchDocument();
    }
  }, [isSupplementMode, isEditMode, supplementDocumentId]);

  // Helper function to extract plain text content from HTML
  const extractContentFromHTML = (html: string): string => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // Remove the (Added)(ORG) heading
    const headings = tempDiv.querySelectorAll('h4, h3, h2');
    headings.forEach(h => h.remove());

    // Get remaining text
    return tempDiv.textContent?.trim() || '';
  };

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
    complianceStatement: 'COMPLIANCE WITH THIS PUBLICATION IS MANDATORY',
    opr: 'SAF/IG',
    certifiedBy: 'AF/CV (General Larry O. Spencer)',
    pages: 6,
    releasabilityStatement: '',
    oprOfficeName: '',
    certifiedByOrganization: '',
    serviceAuthorityOrganization: '',
    supersedes: '',
    pageNumber: '',
    antecedentPublicationStatement: '',
    applicabilityStatement: '',
    privacyActStatement: '',
    copyrightStatement: '',
    paperworkReductionActStatement: '',
    punitiveLanguageStatement: '',
    otherStatuaryRequirements: '',
    recordsManagementStatement: '',
    recommendedChangesStatement: '',
    allowImplementingOrSupplementingStatement: ''
  });
  const [documentTemplate, setDocumentTemplate] = useState(templateFromUrl || 'af-manual');
  const [documentPages, setDocumentPages] = useState(5);
  const [feedbackCount, setFeedbackCount] = useState(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDocument, setGeneratedDocument] = useState<any>(null);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Update template when URL parameter changes or documentTemplate changes
  useEffect(() => {
    const template = templateFromUrl || documentTemplate;
    if (template) {
      // Auto-update header fields based on template
      const defaults = getTemplateDefaults(template);
      setDocumentInfo(prev => ({
        ...prev,
        byOrderText: 'BY ORDER OF THE',
        serviceAuthorityOrganization: defaults.secretary || prev.serviceAuthorityOrganization
      }));
    }
  }, [templateFromUrl, documentTemplate]);

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

  const generateSupplement = async () => {
    setIsGenerating(true);
    setError('');
    setFieldErrors({});

    try {
      // Validate required fields
      const errors: Record<string, string> = {};

      if (!supplementOrganization) {
        errors.organization = 'Organization is required';
      }
      if (!supplementParagraphNumber) {
        errors.paragraphNumber = 'Paragraph number is required';
      }
      if (!documentInfo.opr) {
        errors.opr = 'OPR is required';
      }
      if (!documentInfo.certifiedBy) {
        errors.certifiedBy = 'Certified By is required';
      }

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        throw new Error('Please fill in all required fields');
      }

      const token = localStorage.getItem('accessToken');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

      if (isEditMode) {
        // UPDATE existing supplement
        const updateData = {
          organization: supplementOrganization,
          paragraphNumber: supplementParagraphNumber,
          content: supplementContent,
          opr: documentInfo.opr,
          certifiedBy: documentInfo.certifiedBy
        };

        console.log('Updating supplement with data:', updateData);

        const response = await fetch(`${backendUrl}/api/documents/${supplementDocumentId}/update-supplement`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(updateData)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || 'Failed to update supplement');
        }

        const result = await response.json();

        setGeneratedDocument({
          id: supplementDocumentId,
          title: parentDocumentTitle,
          type: 'supplement'
        });

        // Redirect to the updated supplement
        setTimeout(() => {
          window.location.href = `/documents/${supplementDocumentId}`;
        }, 1500);

      } else {
        // CREATE new supplement with header structure (minimal content placeholder)
        const supplementData = {
          parentDocumentId: supplementDocumentId,
          supplementSection: decodeURIComponent(supplementSection || ''),
          organization: supplementOrganization,
          paragraphNumber: supplementParagraphNumber,
          content: '<p>[Content to be added in editor]</p>', // Minimal placeholder
          opr: documentInfo.opr,
          certifiedBy: documentInfo.certifiedBy,
          supplementType: 'standalone',
          // Auto-generate title
          title: `${parentDocumentTitle} - ${supplementOrganization} Supplement`,
          description: `Supplement to ${supplementSection} by ${supplementOrganization}`,
          category: 'supplement',
          // Pass header data from parent document
          headerData: {
            documentType: documentInfo.instructionTitle,
            subject: documentInfo.subject,
            category: documentInfo.responsibilities,
            byOrderOf: documentInfo.byOrderText,
            compliance: documentInfo.complianceStatement,
            opr: documentInfo.opr,
            certifiedBy: documentInfo.certifiedBy,
            secretary: documentInfo.serviceAuthorityOrganization,
            organization: supplementOrganization
          }
        };

        console.log('Creating supplement with data:', supplementData);

        const response = await fetch(`${backendUrl}/api/documents/create-supplement`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(supplementData)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || 'Failed to create supplement');
        }

        const result = await response.json();
        const documentId = result.document?.id || result.id;

        setGeneratedDocument({
          id: documentId,
          title: supplementData.title,
          type: 'supplement'
        });

        // Redirect to the editor instead of document view
        setTimeout(() => {
          window.location.href = `/editor/${documentId}`;
        }, 1500);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to ' + (isEditMode ? 'update' : 'create') + ' supplement');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateAIDocument = async () => {
    setIsGenerating(true);
    setError('');

    try {
      // For manual mode, create document without AI
      if (isManualMode) {
        const token = localStorage.getItem('accessToken');
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

        const response = await fetch(`${backendUrl}/api/documents/create-with-template`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            title: documentInfo.instructionTitle || 'New Document',
            description: documentInfo.subject || 'Manual document creation',
            templateId: documentTemplate,
            category: 'instruction'
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || 'Failed to create document');
        }

        const result = await response.json();
        const documentId = result.document?.id || result.id;

        setGeneratedDocument({
          id: documentId,
          pages: documentInfo.pages,
          feedbackCount: 0,
          title: documentInfo.instructionTitle || 'New Document'
        });

        setTimeout(() => {
          window.location.href = `/documents/${documentId}`;
        }, 2000);

        setIsGenerating(false);
        return;
      }

      // Get template defaults (for AI mode)
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
        secretary: documentInfo.serviceAuthorityOrganization || templateDefaults.secretary,
        subject: documentInfo.subject,
        category: documentInfo.responsibilities,
        opr: documentInfo.opr,
        certifiedBy: documentInfo.certifiedBy.split('(')[0].trim(),
        certifiedByName: documentInfo.certifiedBy.includes('(') ?
          '(' + documentInfo.certifiedBy.split('(')[1] : '',
        documentDate: documentInfo.date.toUpperCase(),
        compliance: documentInfo.complianceStatement,
        byOrderOf: documentInfo.byOrderText
      };

      // Call our Next.js API route
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/ai-document-generator', {
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
        {isManualMode ? <Article color="primary" /> : <AutoAwesome color="primary" />}
        {isManualMode ? 'Air Force Document Generator' : 'AI-Powered Air Force Document Generator'}
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        {isManualMode
          ? 'Upload your Air Force seal and provide document details. The system will generate a complete, properly formatted Air Force document with official header.'
          : 'Upload your Air Force seal and provide document details. AI will generate a complete, properly formatted Air Force document with official header.'}
      </Typography>

      {/* Supplement Mode Indicator */}
      {isSupplementMode && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            <strong>Creating Supplement Document</strong>
          </Typography>
          <Typography variant="body2">
            Original Document ID: {supplementDocumentId}
            <br />
            Supplementing Section: <strong>{decodeURIComponent(supplementSection || '')}</strong>
          </Typography>
        </Alert>
      )}

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

            {/* Show simplified supplement form OR full document form */}
            {isSupplementMode ? (
              /* ========== SIMPLIFIED SUPPLEMENT FORM ========== */
              <>
                <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', mt: 2 }}>
                  Supplement Information
                </Typography>

                {/* Parent Document (Read-only) */}
                <TextField
                  label="Parent Document"
                  value={parentDocumentTitle}
                  fullWidth
                  disabled
                  sx={{ mb: 2, bgcolor: 'grey.50' }}
                  helperText="The document being supplemented"
                />

                {/* Element Type (Read-only) */}
                <TextField
                  label="Supplementing Element Type"
                  value={supplementElementType}
                  fullWidth
                  disabled
                  sx={{ mb: 2, bgcolor: 'grey.50' }}
                  helperText="The type of element being supplemented"
                />

                {/* Supplementing Section (Read-only) */}
                <TextField
                  label="Supplementing Section"
                  value={decodeURIComponent(supplementSection || '')}
                  fullWidth
                  disabled
                  sx={{ mb: 2, bgcolor: 'grey.50' }}
                  helperText="The section where the supplement will be attached"
                />

                {/* Organization (Dropdown) */}
                <TextField
                  select
                  label="Organization"
                  value={supplementOrganization}
                  onChange={(e) => {
                    setSupplementOrganization(e.target.value);
                    setFieldErrors(prev => ({ ...prev, organization: '' }));
                  }}
                  fullWidth
                  required
                  error={!!fieldErrors.organization}
                  sx={{ mb: 2 }}
                  helperText={fieldErrors.organization || "Select the organization creating this supplement"}
                  InputLabelProps={{ shrink: true }}
                >
                  <MenuItem value="AMC">AMC (Air Mobility Command)</MenuItem>
                  <MenuItem value="AETC">AETC (Air Education and Training Command)</MenuItem>
                  <MenuItem value="ACC">ACC (Air Combat Command)</MenuItem>
                  <MenuItem value="AFMC">AFMC (Air Force Materiel Command)</MenuItem>
                  <MenuItem value="AFGSC">AFGSC (Air Force Global Strike Command)</MenuItem>
                  <MenuItem value="AFSOC">AFSOC (Air Force Special Operations Command)</MenuItem>
                  <MenuItem value="AFSPC">AFSPC (Air Force Space Command)</MenuItem>
                  <MenuItem value="PACAF">PACAF (Pacific Air Forces)</MenuItem>
                  <MenuItem value="USAFE">USAFE (United States Air Forces in Europe)</MenuItem>
                  <MenuItem value="AFRC">AFRC (Air Force Reserve Command)</MenuItem>
                  <MenuItem value="ANG">ANG (Air National Guard)</MenuItem>
                  <MenuItem value="USSF">USSF (United States Space Force)</MenuItem>
                  <MenuItem value="DAF">DAF (Department of the Air Force)</MenuItem>
                  <MenuItem value="USAF">USAF (United States Air Force)</MenuItem>
                </TextField>

                {/* OPR */}
                <TextField
                  label="OPR (Office of Primary Responsibility)"
                  value={documentInfo.opr}
                  onChange={(e) => {
                    handleInputChange('opr', e.target.value);
                    setFieldErrors(prev => ({ ...prev, opr: '' }));
                  }}
                  fullWidth
                  required
                  error={!!fieldErrors.opr}
                  sx={{ mb: 2 }}
                  placeholder="SAF/IG"
                  helperText={fieldErrors.opr || "The office responsible for this supplement"}
                  InputLabelProps={{ shrink: true }}
                />

                {/* Certified By */}
                <TextField
                  label="Certified By"
                  value={documentInfo.certifiedBy}
                  onChange={(e) => {
                    handleInputChange('certifiedBy', e.target.value);
                    setFieldErrors(prev => ({ ...prev, certifiedBy: '' }));
                  }}
                  fullWidth
                  required
                  error={!!fieldErrors.certifiedBy}
                  sx={{ mb: 2 }}
                  placeholder="AF/CV (General Larry O. Spencer)"
                  helperText={fieldErrors.certifiedBy || "The certifying official"}
                  InputLabelProps={{ shrink: true }}
                />

                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>Note:</strong> This supplement will be created as a <strong>standalone document</strong> with the same header format as the original document.
                    <br />
                    <strong>Supplementing:</strong> {supplementElementType} - {decodeURIComponent(supplementSection || '')}
                    <br />
                    <strong>Tag:</strong> {supplementParagraphNumber}. (Added)({supplementOrganization || 'ORG'})
                    <br />
                    <br />
                    After creating the supplement, you will be redirected to the editor where you can add chapters and content with the proper document structure.
                  </Typography>
                </Alert>
              </>
            ) : (
              /* ========== FULL DOCUMENT FORM ========== */
              <>
                {/* Document Template - Moved to top */}
                <TextField
                  select
                  label="Document Template"
                  value={documentTemplate}
                  onChange={(e) => setDocumentTemplate(e.target.value)}
                  fullWidth
                  sx={{ mb: 2 }}
                  helperText="Select the document type/template"
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
            </TextField>

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
              label="Compliance Statement"
              value={documentInfo.complianceStatement}
              onChange={(e) => handleInputChange('complianceStatement', e.target.value)}
              fullWidth
              sx={{ mb: 2 }}
              placeholder="COMPLIANCE WITH THIS PUBLICATION IS MANDATORY"
              helperText="Compliance statement that appears below the header"
            />

            <Divider sx={{ my: 2 }} />

            {/* Page 1: Document Details */}
            {currentPage === 1 && (
              <>
                <Typography variant="h6" gutterBottom>Document Details - Page 1</Typography>

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

                <Grid container spacing={2} sx={{ mb: 2 }}>
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

                <TextField
                  label="OPR Office Name"
                  value={documentInfo.oprOfficeName}
                  onChange={(e) => handleInputChange('oprOfficeName', e.target.value)}
                  fullWidth
                  sx={{ mb: 2 }}
                  helperText="Office name for OPR"
                  InputLabelProps={{ shrink: true }}
                />

                <TextField
                  label="Certified by Organization"
                  value={documentInfo.certifiedByOrganization}
                  onChange={(e) => handleInputChange('certifiedByOrganization', e.target.value)}
                  fullWidth
                  sx={{ mb: 2 }}
                  helperText="Organization that certified the document"
                  InputLabelProps={{ shrink: true }}
                />

                <TextField
                  label="Service Authority Organization"
                  value={documentInfo.serviceAuthorityOrganization}
                  onChange={(e) => handleInputChange('serviceAuthorityOrganization', e.target.value)}
                  fullWidth
                  sx={{ mb: 2 }}
                  helperText="Authority organization (e.g., SECRETARY OF THE AIR FORCE)"
                  InputLabelProps={{ shrink: true }}
                />

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Button
                    variant="contained"
                    endIcon={<NavigateNext />}
                    onClick={() => setCurrentPage(2)}
                  >
                    Next Page
                  </Button>
                </Box>
              </>
            )}

            {/* Page 2: Additional Statements */}
            {currentPage === 2 && (
              <>
                <Typography variant="h6" gutterBottom>Additional Statements - Page 2</Typography>

                <TextField
                  label="Releasability Statement"
                  value={documentInfo.releasabilityStatement}
                  onChange={(e) => handleInputChange('releasabilityStatement', e.target.value)}
                  fullWidth
                  sx={{ mb: 2 }}
                  helperText="Document releasability information"
                  InputLabelProps={{ shrink: true }}
                />

                <TextField
                  label="Supersedes"
                  value={documentInfo.supersedes}
                  onChange={(e) => handleInputChange('supersedes', e.target.value)}
                  fullWidth
                  sx={{ mb: 2 }}
                  helperText="Previous document this supersedes"
                  InputLabelProps={{ shrink: true }}
                />

                <TextField
                  label="Page Number"
                  value={documentInfo.pageNumber}
                  onChange={(e) => handleInputChange('pageNumber', e.target.value)}
                  fullWidth
                  sx={{ mb: 2 }}
                  helperText="Page numbering format"
                  InputLabelProps={{ shrink: true }}
                />

                <TextField
                  label="Antecedent Publication Statement"
                  value={documentInfo.antecedentPublicationStatement}
                  onChange={(e) => handleInputChange('antecedentPublicationStatement', e.target.value)}
                  fullWidth
                  sx={{ mb: 2 }}
                  helperText="Previous publication information"
                  InputLabelProps={{ shrink: true }}
                />

                <TextField
                  label="Applicability Statement"
                  value={documentInfo.applicabilityStatement}
                  onChange={(e) => handleInputChange('applicabilityStatement', e.target.value)}
                  fullWidth
                  sx={{ mb: 2 }}
                  helperText="Who this document applies to"
                  InputLabelProps={{ shrink: true }}
                />

                <TextField
                  label="Privacy Act Statement"
                  value={documentInfo.privacyActStatement}
                  onChange={(e) => handleInputChange('privacyActStatement', e.target.value)}
                  fullWidth
                  sx={{ mb: 2 }}
                  helperText="Privacy Act compliance statement"
                  InputLabelProps={{ shrink: true }}
                />

                <TextField
                  label="Copyright Statement"
                  value={documentInfo.copyrightStatement}
                  onChange={(e) => handleInputChange('copyrightStatement', e.target.value)}
                  fullWidth
                  sx={{ mb: 2 }}
                  helperText="Copyright information"
                  InputLabelProps={{ shrink: true }}
                />

                <TextField
                  label="Paperwork Reduction Act Statement"
                  value={documentInfo.paperworkReductionActStatement}
                  onChange={(e) => handleInputChange('paperworkReductionActStatement', e.target.value)}
                  fullWidth
                  sx={{ mb: 2 }}
                  helperText="Paperwork Reduction Act compliance"
                  InputLabelProps={{ shrink: true }}
                />

                <TextField
                  label="Punitive Language Statement"
                  value={documentInfo.punitiveLanguageStatement}
                  onChange={(e) => handleInputChange('punitiveLanguageStatement', e.target.value)}
                  fullWidth
                  sx={{ mb: 2 }}
                  helperText="Punitive language disclaimer"
                  InputLabelProps={{ shrink: true }}
                />

                <TextField
                  label="Other Statuary Requirements"
                  value={documentInfo.otherStatuaryRequirements}
                  onChange={(e) => handleInputChange('otherStatuaryRequirements', e.target.value)}
                  fullWidth
                  sx={{ mb: 2 }}
                  helperText="Additional statutory requirements"
                  InputLabelProps={{ shrink: true }}
                />

                <TextField
                  label="Records Management Statement"
                  value={documentInfo.recordsManagementStatement}
                  onChange={(e) => handleInputChange('recordsManagementStatement', e.target.value)}
                  fullWidth
                  sx={{ mb: 2 }}
                  helperText="Records management requirements"
                  InputLabelProps={{ shrink: true }}
                />

                <TextField
                  label="Recommended Changes Statement"
                  value={documentInfo.recommendedChangesStatement}
                  onChange={(e) => handleInputChange('recommendedChangesStatement', e.target.value)}
                  fullWidth
                  sx={{ mb: 2 }}
                  helperText="How to recommend changes"
                  InputLabelProps={{ shrink: true }}
                />

                <TextField
                  label="Allow Implementing or Supplementing Statement"
                  value={documentInfo.allowImplementingOrSupplementingStatement}
                  onChange={(e) => handleInputChange('allowImplementingOrSupplementingStatement', e.target.value)}
                  fullWidth
                  sx={{ mb: 2 }}
                  helperText="Implementation/supplementing guidance"
                  InputLabelProps={{ shrink: true }}
                />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<NavigateBefore />}
                    onClick={() => setCurrentPage(1)}
                  >
                    Previous Page
                  </Button>
                </Box>
              </>
            )}
              </>
            )}
            {/* End of conditional full document form */}

            <Divider sx={{ my: 2 }} />

            {/* Generation Settings - Only show in AI mode, not manual mode */}
            {!isManualMode && (
              <>
                <Typography variant="h6" gutterBottom>
                  AI Generation Settings
                </Typography>

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
              </>
            )}

            <Button
              variant="contained"
              size="large"
              onClick={isSupplementMode ? generateSupplement : generateAIDocument}
              disabled={isGenerating}
              fullWidth
              sx={{ mb: 2 }}
            >
              {isGenerating ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  {isSupplementMode ? (isEditMode ? 'Updating Supplement...' : 'Creating Supplement...') : 'Generating Document...'}
                </>
              ) : (
                <>
                  {isSupplementMode ? <Article sx={{ mr: 1 }} /> : (isManualMode ? <Article sx={{ mr: 1 }} /> : <AutoAwesome sx={{ mr: 1 }} />)}
                  {isSupplementMode ? (isEditMode ? 'Update Supplement' : 'Create Supplement') : (isManualMode ? 'Generate Document' : 'Generate AI Document')}
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
                secretaryText={documentInfo.serviceAuthorityOrganization || getTemplateDefaults(documentTemplate).secretary}
                complianceText={documentInfo.complianceStatement}
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
                    <Chip label={`${generatedDocument.feedbackCount} ${isManualMode ? 'suggestions' : 'AI suggestions'}`} size="small" sx={{ mr: 1 }} />
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