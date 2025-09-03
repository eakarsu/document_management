'use client';

import React, { useState } from 'react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';

interface DocumentFiltersProps {
  filters: {
    search: string;
    category: string;
    tags: string[];
    dateRange: { from: Date; to: Date } | null;
  };
  onFiltersChange: (filters: any) => void;
}

const DocumentFilters: React.FC<DocumentFiltersProps> = ({
  filters,
  onFiltersChange,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const categories = [
    'All Categories',
    'Financial',
    'HR',
    'Technical',
    'Marketing',
    'Legal',
    'Administrative',
    'Academic',
    'Personal',
  ];

  const popularTags = [
    'urgent',
    'quarterly',
    'report',
    'contract',
    'policy',
    'manual',
    'template',
    'draft',
    'final',
    'review',
  ];

  const handleSearchChange = (value: string) => {
    onFiltersChange({
      ...filters,
      search: value,
    });
  };

  const handleCategoryChange = (category: string) => {
    onFiltersChange({
      ...filters,
      category: category === 'All Categories' ? '' : category,
    });
  };

  const handleTagToggle = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag];
    
    onFiltersChange({
      ...filters,
      tags: newTags,
    });
  };

  const handleDateRangeChange = (type: 'from' | 'to', value: string) => {
    const date = new Date(value);
    const newDateRange = filters.dateRange || { from: new Date(), to: new Date() };
    
    onFiltersChange({
      ...filters,
      dateRange: {
        ...newDateRange,
        [type]: date,
      },
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      category: '',
      tags: [],
      dateRange: null,
    });
    setShowAdvanced(false);
  };

  const hasActiveFilters = filters.search || filters.category || filters.tags.length > 0 || filters.dateRange;

  return (
    <div className="card">
      <div className="card-content">
        <div className="space-y-4">
          {/* Search and Basic Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-4 sm:space-y-0">
            {/* Search Input */}
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search documents..."
                className="input pl-10"
                value={filters.search}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>

            {/* Category Filter */}
            <div className="sm:w-48">
              <select
                className="input"
                value={filters.category || 'All Categories'}
                onChange={(e) => handleCategoryChange(e.target.value)}
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Advanced Filters Toggle */}
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`btn btn-secondary flex items-center ${
                showAdvanced ? 'bg-primary-50 text-primary-700' : ''
              }`}
            >
              <FunnelIcon className="h-5 w-5 mr-2" />
              Filters
              {hasActiveFilters && (
                <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-primary-600 rounded-full">
                  {(filters.tags.length > 0 ? 1 : 0) + 
                   (filters.dateRange ? 1 : 0) + 
                   (filters.category ? 1 : 0) + 
                   (filters.search ? 1 : 0)}
                </span>
              )}
            </button>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="btn btn-ghost text-sm"
              >
                <XMarkIcon className="h-4 w-4 mr-1" />
                Clear
              </button>
            )}
          </div>

          {/* Advanced Filters */}
          {showAdvanced && (
            <div className="pt-4 border-t border-gray-200 space-y-4">
              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {popularTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => handleTagToggle(tag)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        filters.tags.includes(tag)
                          ? 'bg-primary-100 text-primary-800 border border-primary-300'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                {filters.tags.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500">
                      Selected: {filters.tags.join(', ')}
                    </p>
                  </div>
                )}
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Range
                </label>
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0">
                  <div className="flex-1">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <CalendarIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="date"
                        className="input pl-10"
                        value={filters.dateRange?.from.toISOString().split('T')[0] || ''}
                        onChange={(e) => handleDateRangeChange('from', e.target.value)}
                        placeholder="From date"
                      />
                    </div>
                  </div>
                  <span className="text-gray-500 text-sm">to</span>
                  <div className="flex-1">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <CalendarIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="date"
                        className="input pl-10"
                        value={filters.dateRange?.to.toISOString().split('T')[0] || ''}
                        onChange={(e) => handleDateRangeChange('to', e.target.value)}
                        placeholder="To date"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* File Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  File Types
                </label>
                <div className="flex flex-wrap gap-2">
                  {['PDF', 'Word', 'Excel', 'PowerPoint', 'Images', 'All'].map((type) => (
                    <button
                      key={type}
                      className="px-3 py-1 rounded-md text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300 transition-colors"
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Size Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  File Size
                </label>
                <div className="flex items-center space-x-4">
                  <select className="input flex-1">
                    <option>Any size</option>
                    <option>Less than 1 MB</option>
                    <option>1 MB - 10 MB</option>
                    <option>10 MB - 100 MB</option>
                    <option>More than 100 MB</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentFilters;