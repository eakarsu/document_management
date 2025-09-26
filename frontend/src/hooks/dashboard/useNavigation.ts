'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export const useNavigation = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const router = useRouter();

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      // Call logout API to clear cookies and notify backend
      const response = await api.post('/api/auth/logout');

      if (response.ok) {
        // Clear any localStorage data as well
        localStorage.removeItem('user');

        // Redirect to login
        router.push('/login');
      } else {
        console.error('Logout failed');
        // Still redirect to login even if logout API fails
        localStorage.removeItem('user');
        router.push('/login');
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Still redirect to login even on error
      localStorage.removeItem('user');
      router.push('/login');
    }
  };

  const handleUploadDocument = () => {
    router.push('/upload');
  };

  const handleBrowseFolders = () => {
    router.push('/documents');
  };

  const handleSearchDocuments = () => {
    router.push('/search');
  };

  const handleViewAnalytics = () => {
    router.push('/analytics');
  };

  const handlePublishing = () => {
    router.push('/publishing');
  };

  const handleAIWorkflow = () => {
    router.push('/ai-workflow');
  };

  const handleAIDocumentGenerator = () => {
    router.push('/ai-document-generator');
  };

  const handleWorkflowBuilder = () => {
    router.push('/workflow-builder');
  };

  const handleUsersManagement = () => {
    router.push('/users');
  };

  return {
    anchorEl,
    handleProfileMenuOpen,
    handleMenuClose,
    handleLogout,
    handleUploadDocument,
    handleBrowseFolders,
    handleSearchDocuments,
    handleViewAnalytics,
    handlePublishing,
    handleAIWorkflow,
    handleAIDocumentGenerator,
    handleWorkflowBuilder,
    handleUsersManagement
  };
};