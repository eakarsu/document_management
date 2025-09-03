'use client';

import React, { useState } from 'react';
import {
  DocumentIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  PencilSquareIcon,
  TrashIcon,
  ShareIcon,
  EllipsisVerticalIcon,
  CalendarIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { useToast } from '../providers/ToastProvider';

interface Document {
  id: string;
  title: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    firstName: string;
    lastName: string;
  };
  category?: string;
  tags: string[];
  status: string;
}

interface DocumentsListProps {
  viewMode: 'list' | 'grid';
  filters: {
    search: string;
    category: string;
    tags: string[];
    dateRange: { from: Date; to: Date } | null;
  };
}

const DocumentsList: React.FC<DocumentsListProps> = ({ viewMode, filters }) => {
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const { success, error: showError } = useToast();

  // Mock data - in a real app, this would come from GraphQL/API
  const documents: Document[] = [
    {
      id: '1',
      title: 'Q4 Financial Report 2024',
      fileName: 'financial-report-q4-2024.pdf',
      mimeType: 'application/pdf',
      fileSize: 2457600,
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-15T14:20:00Z',
      createdBy: {
        firstName: 'John',
        lastName: 'Smith',
      },
      category: 'Financial',
      tags: ['quarterly', 'financial', 'report'],
      status: 'PUBLISHED',
    },
    {
      id: '2',
      title: 'Employee Handbook 2024',
      fileName: 'employee-handbook-2024.pdf',
      mimeType: 'application/pdf',
      fileSize: 5242880,
      createdAt: '2024-01-14T14:20:00Z',
      updatedAt: '2024-01-14T16:45:00Z',
      createdBy: {
        firstName: 'Sarah',
        lastName: 'Johnson',
      },
      category: 'HR',
      tags: ['handbook', 'hr', 'policies'],
      status: 'APPROVED',
    },
    {
      id: '3',
      title: 'Project Proposal - DMS Enhancement',
      fileName: 'dms-enhancement-proposal.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileSize: 1048576,
      createdAt: '2024-01-13T09:15:00Z',
      updatedAt: '2024-01-13T11:30:00Z',
      createdBy: {
        firstName: 'Mike',
        lastName: 'Davis',
      },
      category: 'Technical',
      tags: ['proposal', 'enhancement', 'dms'],
      status: 'DRAFT',
    },
    {
      id: '4',
      title: 'Marketing Campaign Analysis',
      fileName: 'marketing-campaign-analysis.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      fileSize: 3145728,
      createdAt: '2024-01-12T16:45:00Z',
      updatedAt: '2024-01-12T18:20:00Z',
      createdBy: {
        firstName: 'Emily',
        lastName: 'Brown',
      },
      category: 'Marketing',
      tags: ['marketing', 'campaign', 'analysis'],
      status: 'IN_REVIEW',
    },
  ];

  // Filter and sort documents
  const filteredDocuments = documents
    .filter(doc => {
      if (filters.search && !doc.title.toLowerCase().includes(filters.search.toLowerCase()) &&
          !doc.fileName.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      if (filters.category && doc.category !== filters.category) {
        return false;
      }
      if (filters.tags.length > 0 && !filters.tags.some(tag => doc.tags.includes(tag))) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      const aValue = a[sortBy as keyof Document];
      const bValue = b[sortBy as keyof Document];
      const order = sortOrder === 'asc' ? 1 : -1;
      
      if (aValue < bValue) return -1 * order;
      if (aValue > bValue) return 1 * order;
      return 0;
    });

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
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word')) return '📝';
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return '📊';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '📈';
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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-800',
      IN_REVIEW: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-blue-100 text-blue-800',
      PUBLISHED: 'bg-green-100 text-green-800',
      ARCHIVED: 'bg-gray-100 text-gray-600',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const handleSelectDocument = (id: string) => {
    setSelectedDocuments(prev => 
      prev.includes(id) ? prev.filter(docId => docId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedDocuments.length === filteredDocuments.length) {
      setSelectedDocuments([]);
    } else {
      setSelectedDocuments(filteredDocuments.map(doc => doc.id));
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleDocumentAction = (action: string, documentId: string) => {
    switch (action) {
      case 'view':
        success('Opening document...', 'Document viewer will open');
        break;
      case 'download':
        success('Downloading...', 'Document download started');
        break;
      case 'edit':
        success('Opening editor...', 'Document editor will open');
        break;
      case 'delete':
        showError('Delete confirmation', 'Are you sure you want to delete this document?');
        break;
      case 'share':
        success('Share options', 'Document sharing options will open');
        break;
    }
  };

  if (viewMode === 'grid') {
    return (
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Documents ({filteredDocuments.length})
            </h2>
            {selectedDocuments.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {selectedDocuments.length} selected
                </span>
                <button className="btn btn-sm btn-secondary">Bulk Actions</button>
              </div>
            )}
          </div>
        </div>

        <div className="card-content">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredDocuments.map((document) => (
              <div
                key={document.id}
                className="group relative bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="text-3xl">
                    {getFileIcon(document.mimeType)}
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedDocuments.includes(document.id)}
                    onChange={() => handleSelectDocument(document.id)}
                    className="rounded border-gray-300"
                  />
                </div>

                <div className="mb-3">
                  <h3 className="text-sm font-medium text-gray-900 truncate" title={document.title}>
                    {document.title}
                  </h3>
                  <p className="text-xs text-gray-500 truncate mt-1" title={document.fileName}>
                    {document.fileName}
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  <span>{formatFileSize(document.fileSize)}</span>
                  <span>{formatDate(document.updatedAt)}</span>
                </div>

                <div className="flex items-center justify-between mb-3">
                  {document.category && (
                    <span className={`badge text-xs ${getCategoryColor(document.category)}`}>
                      {document.category}
                    </span>
                  )}
                  <span className={`badge text-xs ${getStatusColor(document.status)}`}>
                    {document.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Hover Actions */}
                <div className="absolute inset-x-0 bottom-0 bg-white border-t border-gray-200 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center justify-center space-x-2 p-2">
                    <button
                      onClick={() => handleDocumentAction('view', document.id)}
                      className="p-2 text-gray-400 hover:text-blue-600 rounded-md hover:bg-blue-50"
                      title="Preview"
                    >
                      <EyeIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDocumentAction('download', document.id)}
                      className="p-2 text-gray-400 hover:text-green-600 rounded-md hover:bg-green-50"
                      title="Download"
                    >
                      <ArrowDownTrayIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDocumentAction('edit', document.id)}
                      className="p-2 text-gray-400 hover:text-yellow-600 rounded-md hover:bg-yellow-50"
                      title="Edit"
                    >
                      <PencilSquareIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDocumentAction('share', document.id)}
                      className="p-2 text-gray-400 hover:text-purple-600 rounded-md hover:bg-purple-50"
                      title="Share"
                    >
                      <ShareIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredDocuments.length === 0 && (
            <div className="text-center py-12">
              <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No documents found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search criteria or upload some documents to get started.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // List View
  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Documents ({filteredDocuments.length})
          </h2>
          {selectedDocuments.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {selectedDocuments.length} selected
              </span>
              <button className="btn btn-sm btn-secondary">Bulk Actions</button>
            </div>
          )}
        </div>
      </div>

      <div className="card-content">
        <div className="overflow-hidden">
          <table className="table">
            <thead>
              <tr>
                <th className="w-12">
                  <input
                    type="checkbox"
                    checked={selectedDocuments.length === filteredDocuments.length}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th
                  className="cursor-pointer hover:text-gray-900"
                  onClick={() => handleSort('title')}
                >
                  <div className="flex items-center">
                    Name
                    {sortBy === 'title' && (
                      <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th>Category</th>
                <th>Status</th>
                <th
                  className="cursor-pointer hover:text-gray-900"
                  onClick={() => handleSort('fileSize')}
                >
                  <div className="flex items-center">
                    Size
                    {sortBy === 'fileSize' && (
                      <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th>Created By</th>
                <th
                  className="cursor-pointer hover:text-gray-900"
                  onClick={() => handleSort('updatedAt')}
                >
                  <div className="flex items-center">
                    Modified
                    {sortBy === 'updatedAt' && (
                      <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocuments.map((document) => (
                <tr key={document.id} className="hover:bg-gray-50">
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedDocuments.includes(document.id)}
                      onChange={() => handleSelectDocument(document.id)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td>
                    <div className="flex items-center">
                      <div className="text-xl mr-3">
                        {getFileIcon(document.mimeType)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{document.title}</div>
                        <div className="text-sm text-gray-500">{document.fileName}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    {document.category && (
                      <span className={`badge ${getCategoryColor(document.category)}`}>
                        {document.category}
                      </span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${getStatusColor(document.status)}`}>
                      {document.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="text-sm text-gray-500">
                    {formatFileSize(document.fileSize)}
                  </td>
                  <td>
                    <div className="flex items-center text-sm text-gray-500">
                      <UserIcon className="w-4 h-4 mr-1" />
                      {document.createdBy.firstName} {document.createdBy.lastName}
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center text-sm text-gray-500">
                      <CalendarIcon className="w-4 h-4 mr-1" />
                      {formatDate(document.updatedAt)}
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleDocumentAction('view', document.id)}
                        className="p-1 text-gray-400 hover:text-blue-600 rounded"
                        title="Preview"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDocumentAction('download', document.id)}
                        className="p-1 text-gray-400 hover:text-green-600 rounded"
                        title="Download"
                      >
                        <ArrowDownTrayIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDocumentAction('edit', document.id)}
                        className="p-1 text-gray-400 hover:text-yellow-600 rounded"
                        title="Edit"
                      >
                        <PencilSquareIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDocumentAction('share', document.id)}
                        className="p-1 text-gray-400 hover:text-purple-600 rounded"
                        title="Share"
                      >
                        <ShareIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredDocuments.length === 0 && (
            <div className="text-center py-12">
              <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No documents found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search criteria or upload some documents to get started.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentsList;