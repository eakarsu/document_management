'use client';

import React, { useState, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  LinearProgress,
  Alert,
  Card,
  CardContent,
  TextField,
  MenuItem,
  Grid,
  AppBar,
  Toolbar,
  IconButton,
  Snackbar
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Description as FileIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Business,
  ArrowBack
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';

interface UploadFile {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

const categories = [
  'Contract',
  'Report',
  'Invoice',
  'Legal',
  'HR',
  'Technical',
  'Marketing',
  'Other'
];

const UploadPage: React.FC = () => {
  const router = useRouter();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles) return;

    const newFiles: UploadFile[] = Array.from(selectedFiles).map(file => ({
      file,
      progress: 0,
      status: 'pending'
    }));

    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = e.dataTransfer.files;
    if (!droppedFiles) return;

    const newFiles: UploadFile[] = Array.from(droppedFiles).map(file => ({
      file,
      progress: 0,
      status: 'pending'
    }));

    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const uploadFile = async (uploadFile: UploadFile, index: number) => {
    const formData = new FormData();
    formData.append('file', uploadFile.file);
    formData.append('title', uploadFile.file.name.replace(/\.[^/.]+$/, ''));
    formData.append('category', selectedCategory || 'Other');

    try {
      setFiles(prev => prev.map((f, i) => 
        i === index ? { ...f, status: 'uploading', progress: 0 } : f
      ));

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (response.ok) {
        setFiles(prev => prev.map((f, i) => 
          i === index ? { ...f, status: 'success', progress: 100 } : f
        ));
        
        // Check if all files are successfully uploaded
        const allUploaded = files.every((file, i) => 
          i === index || file.status === 'success'
        );
        
        if (allUploaded) {
          // All files uploaded successfully
          setShowSuccess(true);
          setRedirecting(true);
          
          // Redirect to dashboard after a short delay
          setTimeout(() => {
            router.push('/dashboard');
          }, 2000);
        }
      } else {
        const error = await response.text();
        setFiles(prev => prev.map((f, i) => 
          i === index ? { ...f, status: 'error', error } : f
        ));
      }
    } catch (error) {
      setFiles(prev => prev.map((f, i) => 
        i === index ? { ...f, status: 'error', error: 'Upload failed' } : f
      ));
    }
  };

  const handleUploadAll = async () => {
    if (!selectedCategory) {
      alert('Please select a category');
      return;
    }

    setUploading(true);
    
    // Upload files sequentially
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.status === 'pending') {
        await uploadFile(file, i);
      }
    }
    
    setUploading(false);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (status: string) => {
    switch (status) {
      case 'success': return <SuccessIcon color="success" />;
      case 'error': return <ErrorIcon color="error" />;
      default: return <FileIcon />;
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" elevation={1}>
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
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Upload Documents - Richmond DMS
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Upload Documents
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
          Upload and organize your documents securely
        </Typography>

        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            {/* Upload Area */}
            <Paper
              sx={{
                p: 4,
                textAlign: 'center',
                border: '2px dashed',
                borderColor: 'grey.300',
                borderRadius: 2,
                '&:hover': {
                  borderColor: 'primary.main',
                  backgroundColor: 'grey.50'
                }
              }}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <UploadIcon sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Drag and drop files here
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 3 }}>
                or click to browse files
              </Typography>
              <Button
                variant="contained"
                component="label"
                startIcon={<UploadIcon />}
              >
                Browse Files
                <input
                  type="file"
                  hidden
                  multiple
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                  onChange={handleFileSelect}
                />
              </Button>
            </Paper>

            {/* File List */}
            {files.length > 0 && (
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Selected Files ({files.length})
                </Typography>
                {files.map((uploadFile, index) => (
                  <Card key={index} sx={{ mb: 2 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        {getFileIcon(uploadFile.status)}
                        <Box sx={{ ml: 2, flexGrow: 1 }}>
                          <Typography variant="body1">
                            {uploadFile.file.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {(uploadFile.file.size / 1024 / 1024).toFixed(2)} MB
                          </Typography>
                        </Box>
                        <Button 
                          size="small" 
                          color="error" 
                          onClick={() => removeFile(index)}
                          disabled={uploadFile.status === 'uploading'}
                        >
                          Remove
                        </Button>
                      </Box>
                      
                      {uploadFile.status === 'uploading' && (
                        <LinearProgress 
                          variant="indeterminate" 
                          sx={{ mt: 1 }} 
                        />
                      )}
                      
                      {uploadFile.error && (
                        <Alert severity="error" sx={{ mt: 1 }}>
                          {uploadFile.error}
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Upload Settings
              </Typography>
              
              <TextField
                select
                fullWidth
                label="Category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                sx={{ mb: 3 }}
                required
              >
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </TextField>

              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleUploadAll}
                disabled={files.length === 0 || uploading || !selectedCategory || redirecting}
                startIcon={<UploadIcon />}
              >
                {redirecting ? 'Redirecting...' : uploading ? 'Uploading...' : `Upload ${files.length} Files`}
              </Button>

              {files.some(f => f.status === 'success') && (
                <Button
                  fullWidth
                  variant="outlined"
                  sx={{ mt: 2 }}
                  onClick={() => router.push('/documents')}
                >
                  View Documents
                </Button>
              )}
            </Paper>

            <Paper sx={{ p: 3, mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Supported Formats
              </Typography>
              <Typography variant="body2" color="text.secondary">
                PDF, DOC, DOCX, TXT, JPG, JPEG, PNG
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Maximum file size: 50MB
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Success notification */}
        <Snackbar
          open={showSuccess}
          autoHideDuration={6000}
          onClose={() => setShowSuccess(false)}
        >
          <Alert 
            severity="success" 
            sx={{ width: '100%' }}
            onClose={() => setShowSuccess(false)}
          >
            {redirecting ? 
              'Upload completed successfully! Redirecting to dashboard...' : 
              'Upload completed successfully!'
            }
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
};

export default UploadPage;