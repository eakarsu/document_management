'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { DashboardData } from '@/types/dashboard';

export const useDashboardData = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalDocuments: 0,
    totalUsers: 0,
    recentDocuments: []
  });
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('');
  const router = useRouter();

  const fetchDashboardData = async () => {
    try {
      // Fetch current user to get role
      const userResponse = await api.get('/api/auth/me');
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUserRole(userData.role || '');
      }

      // Fetch dashboard stats (token will be read from HTTP-only cookies server-side)
      const statsResponse = await api.get('/api/dashboard/stats');

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();

        // Fetch recent documents (token will be read from HTTP-only cookies server-side)
        const docsResponse = await api.get('/api/documents/search?limit=5');

        let recentDocuments = [];
        if (docsResponse.ok) {
          const docsData = await docsResponse.json();
          recentDocuments = docsData.documents || [];
        } else if (docsResponse.status === 401) {
          // If documents API also returns 401, redirect to login
          router.push('/login');
          return;
        }

        setDashboardData({
          totalDocuments: statsData.stats?.totalDocuments || 0,
          totalUsers: statsData.stats?.totalUsers || 0,
          recentDocuments: recentDocuments.slice(0, 5)
        });
      } else if (statsResponse.status === 401) {
        // If authentication fails, redirect to login
        router.push('/login');
      } else {
        console.error('Failed to fetch dashboard stats:', statsResponse.status);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [router]);

  const refreshDashboardData = async () => {
    try {
      const statsResponse = await api.get('/api/dashboard/stats');

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();

        const docsResponse = await api.get('/api/documents/search?limit=5');

        let recentDocuments = [];
        if (docsResponse.ok) {
          const docsData = await docsResponse.json();
          recentDocuments = docsData.documents || [];
        }

        setDashboardData({
          totalDocuments: statsData.stats?.totalDocuments || 0,
          totalUsers: statsData.stats?.totalUsers || 0,
          recentDocuments: recentDocuments.slice(0, 5)
        });
      }
    } catch (error) {
      console.error('Failed to refresh dashboard data:', error);
    }
  };

  return {
    dashboardData,
    loading,
    userRole,
    refreshDashboardData
  };
};