'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Tooltip,
  Menu,
  MenuItem as MenuOption
} from '@mui/material';
import {
  Schedule,
  PlayArrow,
  Pause,
  Stop,
  Edit,
  Delete,
  MoreVert,
  AccessTime,
  CheckCircle,
  Error,
  Visibility,
  CalendarToday
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { api } from '@/lib/api';

interface ScheduledPublication {
  id: string;
  documentId: string;
  document: {
    title: string;
    fileName: string;
  };
  scheduledPublishAt: string;
  publishingStatus: string;
  urgencyLevel: string;
  publishingNotes?: string;
  createdAt: string;
  submittedBy: {
    firstName: string;
    lastName: string;
  };
}

interface RescheduleDialogProps {
  open: boolean;
  onClose: () => void;
  publication: ScheduledPublication | null;
  onReschedule: (id: string, newDate: Date, notes?: string) => void;
}

function RescheduleDialog({ open, onClose, publication, onReschedule }: RescheduleDialogProps) {
  const [newDate, setNewDate] = useState<Date | null>(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (publication && open) {
      setNewDate(new Date(publication.scheduledPublishAt));
      setNotes('');
    }
  }, [publication, open]);

  const handleSubmit = () => {
    if (publication && newDate) {
      onReschedule(publication.id, newDate, notes);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Reschedule Publication</DialogTitle>
      <DialogContent>
        {publication && (
          <Box sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Document: {publication.document.title}
            </Typography>
            <Box sx={{ mt: 2 }}>
              <DateTimePicker
                label="New Scheduled Date"
                value={newDate}
                onChange={setNewDate}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true
                  }
                }}
              />
            </Box>
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Reschedule Reason (Optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                multiline
                rows={3}
                placeholder="Reason for rescheduling..."
              />
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained"
          disabled={!newDate}
        >
          Reschedule
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function PublicationScheduler() {
  const [scheduledPublications, setScheduledPublications] = useState<ScheduledPublication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTimeRange, setSelectedTimeRange] = useState('upcoming'); // upcoming, today, week, month
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedPublication, setSelectedPublication] = useState<ScheduledPublication | null>(null);
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);

  useEffect(() => {
    loadScheduledPublications();
  }, [selectedTimeRange]);

  const loadScheduledPublications = async () => {
    try {
      setLoading(true);
      // This would need to be implemented in your API
      // const response = await api.get(`/api/publishing/scheduled?range=${selectedTimeRange}`);
      // setScheduledPublications(response.data.publications || []);
      
      // Mock data for demo
      setScheduledPublications([
        {
          id: '1',
          documentId: 'doc1',
          document: {
            title: 'Q4 Financial Report',
            fileName: 'q4-report.pdf'
          },
          scheduledPublishAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          publishingStatus: 'APPROVED',
          urgencyLevel: 'HIGH',
          publishingNotes: 'Quarterly board meeting',
          createdAt: new Date().toISOString(),
          submittedBy: {
            firstName: 'John',
            lastName: 'Doe'
          }
        }
      ]);
    } catch (error: any) {
      setError(error.message || 'Failed to load scheduled publications');
    } finally {
      setLoading(false);
    }
  };

  const handlePublishNow = async (publicationId: string) => {
    try {
      await api.post(`/api/publishing/${publicationId}/publish`);
      await loadScheduledPublications();
      setError('');
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to publish document');
    }
  };

  const handleCancelSchedule = async (publicationId: string) => {
    try {
      // This would need to be implemented in your API
      // await api.delete(`/api/publishing/scheduled/${publicationId}`);
      await loadScheduledPublications();
      setError('');
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to cancel scheduled publication');
    }
  };

  const handleReschedule = async (publicationId: string, newDate: Date, notes?: string) => {
    try {
      // This would need to be implemented in your API
      // await api.put(`/api/publishing/scheduled/${publicationId}`, {
      //   scheduledPublishAt: newDate.toISOString(),
      //   rescheduleNotes: notes
      // });
      await loadScheduledPublications();
      setError('');
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to reschedule publication');
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, publication: ScheduledPublication) => {
    setAnchorEl(event.currentTarget);
    setSelectedPublication(publication);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedPublication(null);
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'success';
      case 'PENDING_APPROVAL': return 'warning';
      case 'REJECTED': return 'error';
      case 'PUBLISHED': return 'info';
      default: return 'default';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'EMERGENCY': return 'error';
      case 'URGENT': return 'error';
      case 'HIGH': return 'warning';
      case 'NORMAL': return 'primary';
      case 'LOW': return 'default';
      default: return 'default';
    }
  };

  const isOverdue = (scheduledDate: string) => {
    return new Date(scheduledDate) < new Date();
  };

  const timeUntilPublication = (scheduledDate: string) => {
    const now = new Date();
    const scheduled = new Date(scheduledDate);
    const diffMs = scheduled.getTime() - now.getTime();
    
    if (diffMs < 0) return 'Overdue';
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" component="h1">
            Publication Scheduler
          </Typography>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              label="Time Range"
            >
              <MenuItem value="upcoming">Upcoming</MenuItem>
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="week">This Week</MenuItem>
              <MenuItem value="month">This Month</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Schedule color="primary" />
                  <Box sx={{ ml: 2 }}>
                    <Typography variant="h6">
                      {scheduledPublications.filter(p => p.publishingStatus === 'APPROVED').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Ready to Publish
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AccessTime color="warning" />
                  <Box sx={{ ml: 2 }}>
                    <Typography variant="h6">
                      {scheduledPublications.filter(p => isOverdue(p.scheduledPublishAt)).length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Overdue
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CalendarToday color="info" />
                  <Box sx={{ ml: 2 }}>
                    <Typography variant="h6">
                      {scheduledPublications.filter(p => {
                        const scheduled = new Date(p.scheduledPublishAt);
                        const today = new Date();
                        return scheduled.toDateString() === today.toDateString();
                      }).length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Today
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CheckCircle color="success" />
                  <Box sx={{ ml: 2 }}>
                    <Typography variant="h6">
                      {scheduledPublications.filter(p => p.publishingStatus === 'PUBLISHED').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Published
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Scheduled Publications List */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Scheduled Publications
            </Typography>
            
            {scheduledPublications.length > 0 ? (
              <List>
                {scheduledPublications.map((publication, index) => {
                  const { date, time } = formatDateTime(publication.scheduledPublishAt);
                  const overdue = isOverdue(publication.scheduledPublishAt);
                  const timeUntil = timeUntilPublication(publication.scheduledPublishAt);
                  
                  return (
                    <ListItem 
                      key={publication.id} 
                      divider={index < scheduledPublications.length - 1}
                      sx={{ 
                        bgcolor: overdue ? 'error.light' : 'transparent',
                        opacity: overdue ? 0.9 : 1
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle1" fontWeight="medium">
                              {publication.document.title}
                            </Typography>
                            <Chip
                              label={publication.publishingStatus}
                              color={getStatusColor(publication.publishingStatus) as any}
                              size="small"
                            />
                            <Chip
                              label={publication.urgencyLevel}
                              color={getUrgencyColor(publication.urgencyLevel) as any}
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              File: {publication.document.fileName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Scheduled: {date} at {time}
                            </Typography>
                            <Typography 
                              variant="body2" 
                              color={overdue ? 'error' : 'text.secondary'}
                              fontWeight={overdue ? 'medium' : 'normal'}
                            >
                              {overdue ? '⚠️ ' : ''}Time until publication: {timeUntil}
                            </Typography>
                            {publication.publishingNotes && (
                              <Typography variant="body2" color="text.secondary">
                                Notes: {publication.publishingNotes}
                              </Typography>
                            )}
                            <Typography variant="caption" color="text.secondary">
                              Submitted by: {publication.submittedBy.firstName} {publication.submittedBy.lastName}
                            </Typography>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {publication.publishingStatus === 'APPROVED' && (
                            <Tooltip title="Publish Now">
                              <IconButton
                                color="success"
                                onClick={() => handlePublishNow(publication.id)}
                              >
                                <PlayArrow />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="View Document">
                            <IconButton
                              onClick={() => {
                                // Navigate to document view
                              }}
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                          <IconButton
                            onClick={(e) => handleMenuClick(e, publication)}
                          >
                            <MoreVert />
                          </IconButton>
                        </Box>
                      </ListItemSecondaryAction>
                    </ListItem>
                  );
                })}
              </List>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Schedule sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No Scheduled Publications
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Documents scheduled for publication will appear here
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Action Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuOption
            onClick={() => {
              setRescheduleDialogOpen(true);
              handleMenuClose();
            }}
          >
            <Edit sx={{ mr: 1 }} /> Reschedule
          </MenuOption>
          <MenuOption
            onClick={() => {
              if (selectedPublication) {
                handleCancelSchedule(selectedPublication.id);
              }
              handleMenuClose();
            }}
          >
            <Stop sx={{ mr: 1 }} /> Cancel Schedule
          </MenuOption>
          <MenuOption
            onClick={() => {
              // View publication details
              handleMenuClose();
            }}
          >
            <Visibility sx={{ mr: 1 }} /> View Details
          </MenuOption>
        </Menu>

        {/* Reschedule Dialog */}
        <RescheduleDialog
          open={rescheduleDialogOpen}
          onClose={() => setRescheduleDialogOpen(false)}
          publication={selectedPublication}
          onReschedule={handleReschedule}
        />
      </Box>
    </LocalizationProvider>
  );
}