'use client';

import React from 'react';
import Link from 'next/link';
import {
  DocumentIcon,
  CalendarIcon,
  UserIcon,
  EyeIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';

interface Document {
  id: string;
  title: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
  createdBy: {
    firstName: string;
    lastName: string;
  };
  category?: string;
  tags: string[];
}

const RecentDocuments: React.FC = () => {
  // Mock data - in a real app, this would come from GraphQL/API
  const recentDocuments: Document[] = [
    {
      id: '1',
      title: 'Q4 Financial Report 2024',
      fileName: 'financial-report-q4-2024.pdf',
      mimeType: 'application/pdf',
      fileSize: 2457600,
      createdAt: '2024-01-15T10:30:00Z',
      createdBy: {
        firstName: 'John',
        lastName: 'Smith',
      },
      category: 'Financial',
      tags: ['quarterly', 'financial', 'report'],
    },
    {
      id: '2',
      title: 'Employee Handbook 2024',
      fileName: 'employee-handbook-2024.pdf',
      mimeType: 'application/pdf',
      fileSize: 5242880,
      createdAt: '2024-01-14T14:20:00Z',
      createdBy: {
        firstName: 'Sarah',
        lastName: 'Johnson',
      },
      category: 'HR',
      tags: ['handbook', 'hr', 'policies'],
    },
    {
      id: '3',
      title: 'Project Proposal - DMS Enhancement',
      fileName: 'dms-enhancement-proposal.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileSize: 1048576,
      createdAt: '2024-01-13T09:15:00Z',
      createdBy: {
        firstName: 'Mike',
        lastName: 'Davis',
      },
      category: 'Technical',
      tags: ['proposal', 'enhancement', 'dms'],
    },
    {
      id: '4',
      title: 'Marketing Campaign Analysis',
      fileName: 'marketing-campaign-analysis.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      fileSize: 3145728,
      createdAt: '2024-01-12T16:45:00Z',
      createdBy: {
        firstName: 'Emily',
        lastName: 'Brown',
      },
      category: 'Marketing',
      tags: ['marketing', 'campaign', 'analysis'],
    },
    {
      id: '5',
      title: 'System Architecture Diagram',
      fileName: 'system-architecture.png',
      mimeType: 'image/png',
      fileSize: 819200,
      createdAt: '2024-01-11T11:30:00Z',
      createdBy: {
        firstName: 'Alex',
        lastName: 'Wilson',
      },
      category: 'Technical',
      tags: ['architecture', 'diagram', 'system'],
    },
  ];

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return '🖼️';
    } else if (mimeType.includes('pdf')) {
      return '📄';
    } else if (mimeType.includes('word')) {
      return '📝';
    } else if (mimeType.includes('sheet') || mimeType.includes('excel')) {
      return '📊';
    } else if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) {
      return '📈';
    }
    return '📄';
  };

  const getCategoryColor = (category?: string) => {
    const colors: Record<string, string> = {
      Financial: 'bg-green-100 text-green-800',
      HR: 'bg-blue-100 text-blue-800',
      Technical: 'bg-purple-100 text-purple-800',
      Marketing: 'bg-pink-100 text-pink-800',
      Legal: 'bg-yellow-100 text-yellow-800',
    };
    return colors[category || ''] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Recent Documents</h2>
          <Link
            href="/documents"
            className="text-sm font-medium text-primary-600 hover:text-primary-500 transition-colors"
          >
            View all
          </Link>
        </div>
      </div>

      <div className="card-content">
        <div className="flow-root">
          <ul className="-my-3 divide-y divide-gray-200">
            {recentDocuments.map((document) => (
              <li key={document.id} className="py-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-xl">
                      {getFileIcon(document.mimeType)}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {document.title}
                      </p>
                      <div className="flex items-center space-x-2">
                        <button
                          className="p-1 text-gray-400 hover:text-gray-600 rounded"
                          title="Preview"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1 text-gray-400 hover:text-gray-600 rounded"
                          title="Download"
                        >
                          <ArrowDownTrayIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex items-center mt-1 space-x-2 text-xs text-gray-500">
                      <span>{document.fileName}</span>
                      <span>•</span>
                      <span>{formatFileSize(document.fileSize)}</span>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center">
                          <UserIcon className="w-3 h-3 mr-1" />
                          {document.createdBy.firstName} {document.createdBy.lastName}
                        </div>
                        <div className="flex items-center">
                          <CalendarIcon className="w-3 h-3 mr-1" />
                          {formatDate(document.createdAt)}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {document.category && (
                          <span className={`badge text-xs ${getCategoryColor(document.category)}`}>
                            {document.category}
                          </span>
                        )}
                      </div>
                    </div>

                    {document.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {document.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                          >
                            {tag}
                          </span>
                        ))}
                        {document.tags.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{document.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {recentDocuments.length === 0 && (
          <div className="text-center py-8">
            <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">No recent documents</p>
            <p className="text-xs text-gray-400">Upload your first document to get started</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentDocuments;