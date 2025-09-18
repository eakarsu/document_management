'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Box,
  Typography,
  Chip,
  Grid,
  Alert,
  Autocomplete,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Publish,
  Schedule,
  Add,
  Delete,
  ExpandMore,
  Description,
  Email,
  Link,
  Print,
  CloudUpload
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { api } from '@/lib/api';

interface DocumentPublishFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (publishData: any) => void;
  workflows: any[];
  preSelectedDocument?: any;
}

interface Destination {
  destinationType: string;
  destinationName: string;
  destinationConfig: any;
}

const DESTINATION_TYPES = [
  { value: 'WEB_PORTAL', label: 'Web Portal', icon: <Link /> },
  { value: 'EMAIL_DISTRIBUTION', label: 'Email Distribution', icon: <Email /> },
  { value: 'PRINT_QUEUE', label: 'Print Queue', icon: <Print /> },
  { value: 'EXTERNAL_API', label: 'External API', icon: <CloudUpload /> },
  { value: 'FILE_SHARE', label: 'File Share', icon: <Description /> }
];

const URGENCY_LEVELS = [
  { value: 'LOW', label: 'Low', color: 'default' },
  { value: 'NORMAL', label: 'Normal', color: 'primary' },
  { value: 'HIGH', label: 'High', color: 'warning' },
  { value: 'URGENT', label: 'Urgent', color: 'error' },
  { value: 'EMERGENCY', label: 'Emergency', color: 'error' }
];

export default function DocumentPublishForm({
  open,
  onClose,
  onSubmit,
  workflows,
  preSelectedDocument
}: DocumentPublishFormProps) {
  const [formData, setFormData] = useState({
    documentId: '',
    workflowId: '',
    scheduledPublishAt: null as Date | null,
    expiresAt: null as Date | null,
    publishingNotes: '',
    urgencyLevel: 'NORMAL',
    isEmergencyPublish: false
  });

  const [destinations, setDestinations] = useState<Destination[]>([
    {
      destinationType: 'WEB_PORTAL',
      destinationName: 'Internal Portal',
      destinationConfig: {}
    }
  ]);

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      loadDocuments();
      
      if (preSelectedDocument) {
        setFormData(prev => ({
          ...prev,
          documentId: preSelectedDocument.id
        }));
      }
    }
  }, [open, preSelectedDocument]);

  const loadDocuments = async () => {
    try {
      const response = await api.get('/api/documents/search?status=APPROVED&limit=100');
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      } else {
        setDocuments([]);
      }
    } catch (error) {
      console.error('Failed to load documents:', error);
    }
  };

  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDestinationChange = (index: number, field: string, value: any) => {
    setDestinations(prev => prev.map((dest, i) => 
      i === index ? { ...dest, [field]: value } : dest
    ));
  };

  const addDestination = () => {
    setDestinations(prev => [...prev, {
      destinationType: 'WEB_PORTAL',
      destinationName: `Destination ${prev.length + 1}`,
      destinationConfig: {}
    }]);
  };

  const removeDestination = (index: number) => {
    setDestinations(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      if (!formData.documentId || !formData.workflowId) {
        throw new Error('Please select both document and workflow');
      }

      const publishData = {
        ...formData,
        destinations
      };

      await onSubmit(publishData);
      resetForm();
      onClose();
    } catch (error: any) {
      setError(error.message || 'Failed to submit for publishing');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      documentId: '',
      workflowId: '',
      scheduledPublishAt: null,
      expiresAt: null,
      publishingNotes: '',
      urgencyLevel: 'NORMAL',
      isEmergencyPublish: false
    });
    setDestinations([
      {
        destinationType: 'WEB_PORTAL',
        destinationName: 'Internal Portal',
        destinationConfig: {}
      }
    ]);
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const selectedDocument = documents.find((doc: any) => doc.id === formData.documentId);
  const selectedWorkflow = workflows.find(wf => wf.id === formData.workflowId);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog 
        open={open} 
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { minHeight: '70vh' }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Publish />
          Submit Document for Publishing
        </DialogTitle>

        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Document Selection */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Document Selection
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <Autocomplete
                    value={selectedDocument || null}
                    onChange={(event, newValue) => {
                      handleFormChange('documentId', newValue?.id || '');
                    }}
                    options={documents}
                    getOptionLabel={(option: any) => option.title}
                    renderOption={(props, option: any) => (
                      <Box component="li" {...props}>
                        <Box>
                          <Typography variant="body1">
                            {option.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {option.fileName} • {option.status}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Select Document"
                        placeholder="Search for documents..."
                        required
                      />
                    )}
                  />
                </FormControl>
              </Grid>
              {selectedDocument && (
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent sx={{ py: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Selected: <strong>{selectedDocument.title}</strong>
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        File: {selectedDocument.fileName} • Size: {(selectedDocument.fileSize / 1024).toFixed(1)} KB
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          </Box>

          {/* Workflow Selection */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Publishing Workflow
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Select Workflow</InputLabel>
                  <Select
                    value={formData.workflowId}
                    onChange={(e) => handleFormChange('workflowId', e.target.value)}
                    label="Select Workflow"
                  >
                    {workflows.map(workflow => (
                      <MenuItem key={workflow.id} value={workflow.id}>
                        <Box>
                          <Typography variant="body1">
                            {workflow.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            {workflow.type || workflow.workflowType} • {workflow.stageCount} stages
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {workflow.description}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              {selectedWorkflow && (
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent sx={{ py: 2 }}>
                      <Typography variant="body2">
                        <strong>{selectedWorkflow.name}</strong>
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {selectedWorkflow.description}
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        <Chip 
                          label={selectedWorkflow.workflowType} 
                          size="small" 
                          sx={{ mr: 1 }}
                        />
                        {selectedWorkflow.autoApprove && (
                          <Chip 
                            label="Auto-approve" 
                            size="small" 
                            color="success"
                          />
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          </Box>

          {/* Publishing Settings */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Publishing Settings
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Urgency Level</InputLabel>
                  <Select
                    value={formData.urgencyLevel}
                    onChange={(e) => handleFormChange('urgencyLevel', e.target.value)}
                    label="Urgency Level"
                  >
                    {URGENCY_LEVELS.map(level => (
                      <MenuItem key={level.value} value={level.value}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip 
                            label={level.label} 
                            size="small" 
                            color={level.color as any}
                          />
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.isEmergencyPublish}
                      onChange={(e) => handleFormChange('isEmergencyPublish', e.target.checked)}
                    />
                  }
                  label="Emergency Publishing"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DateTimePicker
                  label="Scheduled Publish Date (Optional)"
                  value={formData.scheduledPublishAt}
                  onChange={(newValue) => handleFormChange('scheduledPublishAt', newValue)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      helperText: 'Leave empty for immediate publishing after approval'
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DateTimePicker
                  label="Expiration Date (Optional)"
                  value={formData.expiresAt}
                  onChange={(newValue) => handleFormChange('expiresAt', newValue)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      helperText: 'Date when published document should expire'
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Publishing Notes"
                  value={formData.publishingNotes}
                  onChange={(e) => handleFormChange('publishingNotes', e.target.value)}
                  multiline
                  rows={3}
                  placeholder="Add any notes for reviewers or additional publishing instructions..."
                />
              </Grid>
            </Grid>
          </Box>

          {/* Publishing Destinations */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Publishing Destinations
              </Typography>
              <Button
                startIcon={<Add />}
                onClick={addDestination}
                variant="outlined"
                size="small"
              >
                Add Destination
              </Button>
            </Box>

            {destinations.map((destination, index) => (
              <Accordion key={index} defaultExpanded={index === 0}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {DESTINATION_TYPES.find(type => type.value === destination.destinationType)?.icon}
                    <Typography>
                      {destination.destinationName}
                    </Typography>
                    <Chip 
                      label={DESTINATION_TYPES.find(type => type.value === destination.destinationType)?.label} 
                      size="small" 
                    />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Destination Type</InputLabel>
                        <Select
                          value={destination.destinationType}
                          onChange={(e) => handleDestinationChange(index, 'destinationType', e.target.value)}
                          label="Destination Type"
                        >
                          {DESTINATION_TYPES.map(type => (
                            <MenuItem key={type.value} value={type.value}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {type.icon}
                                {type.label}
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Destination Name"
                        value={destination.destinationName}
                        onChange={(e) => handleDestinationChange(index, 'destinationName', e.target.value)}
                        required
                      />
                    </Grid>
                    
                    {/* Destination-specific configuration */}
                    {destination.destinationType === 'EMAIL_DISTRIBUTION' && (
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Email Recipients"
                          placeholder="Enter email addresses separated by commas"
                          onChange={(e) => handleDestinationChange(index, 'destinationConfig', {
                            recipients: e.target.value.split(',').map(email => email.trim())
                          })}
                        />
                      </Grid>
                    )}
                    
                    {destination.destinationType === 'EXTERNAL_API' && (
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="API Endpoint URL"
                          placeholder="https://api.example.com/documents"
                          onChange={(e) => handleDestinationChange(index, 'destinationConfig', {
                            endpoint: e.target.value
                          })}
                        />
                      </Grid>
                    )}

                    {destinations.length > 1 && (
                      <Grid item xs={12}>
                        <Button
                          startIcon={<Delete />}
                          onClick={() => removeDestination(index)}
                          color="error"
                          variant="outlined"
                          size="small"
                        >
                          Remove Destination
                        </Button>
                      </Grid>
                    )}
                  </Grid>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading || !formData.documentId || !formData.workflowId}
            startIcon={loading ? <Schedule /> : <Publish />}
          >
            {loading ? 'Submitting...' : 'Submit for Publishing'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
}