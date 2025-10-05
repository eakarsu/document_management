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
      await api.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    }

    // Clear ALL storage regardless of API response
    localStorage.clear();
    sessionStorage.clear();

    // Clear cookies from client side
    document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

    // Hard redirect to login
    window.location.href = '/login';
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