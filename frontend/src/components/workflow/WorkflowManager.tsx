import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Chip,
  Grid,
  Paper,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Upload,
  Delete,
  Edit,
  Visibility,
  CloudUpload,
  CheckCircle,
  Cancel,
  Download,
  Settings
} from '@mui/icons-material';
import { api } from '../../lib/api';

interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  type: string;
  stageCount?: number;
}

export const WorkflowManager: React.FC = () => {
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadDialog, setUploadDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<any>(null);
  const [jsonContent, setJsonContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch all workflows
  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/workflows');
      if (!response.ok) throw new Error('Failed to fetch workflows');
      const data = await response.json();
      setWorkflows(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workflows');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const parsed = JSON.parse(content);
          setJsonContent(JSON.stringify(parsed, null, 2));
          setError(null);
        } catch (err) {
          setError('Invalid JSON file');
        }
      };
      reader.readAsText(file);
    }
  };

  // Save workflow
  const handleSaveWorkflow = async () => {
    try {
      const workflowData = JSON.parse(jsonContent);
      
      // Validate required fields
      if (!workflowData.id || !workflowData.name) {
        setError('Workflow must have an ID and name');
        return;
      }

      const response = await api.post('/api/workflows', workflowData);
      if (!response.ok) throw new Error('Failed to save workflow');
      
      setSuccess(`Workflow "${workflowData.name}" saved successfully`);
      setUploadDialog(false);
      setJsonContent('');
      fetchWorkflows();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save workflow');
    }
  };

  // View workflow details
  const handleViewWorkflow = async (workflowId: string) => {
    try {
      const response = await api.get(`/api/workflows/${workflowId}`);
      if (!response.ok) throw new Error('Failed to fetch workflow');
      const data = await response.json();
      setSelectedWorkflow(data);
      setViewDialog(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workflow');
    }
  };

  // Download workflow as JSON
  const handleDownloadWorkflow = (workflow: any) => {
    const blob = new Blob([JSON.stringify(workflow, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workflow.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Workflow Management
      </Typography>

      {/* Success/Error Messages */}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Upload New Workflow Button */}
      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<CloudUpload />}
          onClick={() => setUploadDialog(true)}
          size="large"
        >
          Upload New Workflow
        </Button>
      </Box>

      {/* Workflows List */}
      <Grid container spacing={3}>
        {loading ? (
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          </Grid>
        ) : workflows.length === 0 ? (
          <Grid item xs={12}>
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                No workflows available
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Upload a workflow JSON file to get started
              </Typography>
            </Paper>
          </Grid>
        ) : (
          workflows.map((workflow) => (
            <Grid item xs={12} md={6} lg={4} key={workflow.id}>
              <Card 
                sx={{ 
                  height: '100%',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)'
                  }
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" component="h3">
                      {workflow.name}
                    </Typography>
                    <Chip 
                      label={`v${workflow.version}`} 
                      size="small" 
                      color="primary"
                    />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {workflow.description}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Chip 
                      label={workflow.type} 
                      size="small" 
                      variant="outlined"
                    />
                    <Chip 
                      label={`${workflow.stageCount} stages`} 
                      size="small" 
                      variant="outlined"
                    />
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="View Details">
                      <IconButton 
                        color="primary" 
                        onClick={() => handleViewWorkflow(workflow.id)}
                      >
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Download JSON">
                      <IconButton 
                        color="default"
                        onClick={() => handleViewWorkflow(workflow.id).then(() => {
                          if (selectedWorkflow) handleDownloadWorkflow(selectedWorkflow);
                        })}
                      >
                        <Download />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      {/* Upload Dialog */}
      <Dialog 
        open={uploadDialog} 
        onClose={() => setUploadDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Upload Workflow JSON</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Button
              variant="outlined"
              component="label"
              startIcon={<Upload />}
              fullWidth
            >
              Select JSON File
              <input
                type="file"
                accept=".json"
                hidden
                onChange={handleFileUpload}
              />
            </Button>
          </Box>
          
          {jsonContent && (
            <TextField
              fullWidth
              multiline
              rows={15}
              value={jsonContent}
              onChange={(e) => setJsonContent(e.target.value)}
              variant="outlined"
              label="Workflow JSON"
              sx={{ fontFamily: 'monospace' }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setUploadDialog(false);
            setJsonContent('');
            setError(null);
          }}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveWorkflow}
            variant="contained"
            disabled={!jsonContent}
          >
            Save Workflow
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog 
        open={viewDialog} 
        onClose={() => setViewDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              {selectedWorkflow?.name}
            </Typography>
            <IconButton 
              onClick={() => handleDownloadWorkflow(selectedWorkflow)}
              color="primary"
            >
              <Download />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={20}
            value={selectedWorkflow ? JSON.stringify(selectedWorkflow, null, 2) : ''}
            variant="outlined"
            InputProps={{ readOnly: true }}
            sx={{ fontFamily: 'monospace' }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};