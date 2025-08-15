'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  CloudArrowUpIcon,
  FolderPlusIcon,
  MagnifyingGlassIcon,
  DocumentDuplicateIcon,
  UserPlusIcon,
  CogIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../providers/AuthProvider';

interface QuickAction {
  name: string;
  description: string;
  href?: string;
  icon: React.ComponentType<any>;
  color: string;
  permission?: string;
  onClick?: () => void;
}

const QuickActions: React.FC = () => {
  const router = useRouter();
  const { hasPermission } = useAuth();

  const quickActions: QuickAction[] = [
    {
      name: 'Upload Files',
      description: 'Add new documents',
      href: '/documents/upload',
      icon: CloudArrowUpIcon,
      color: 'text-blue-600 bg-blue-50 hover:bg-blue-100',
    },
    {
      name: 'Create Folder',
      description: 'Organize documents',
      href: '/folders/new',
      icon: FolderPlusIcon,
      color: 'text-green-600 bg-green-50 hover:bg-green-100',
    },
    {
      name: 'Advanced Search',
      description: 'Find documents quickly',
      href: '/search',
      icon: MagnifyingGlassIcon,
      color: 'text-purple-600 bg-purple-50 hover:bg-purple-100',
    },
    {
      name: 'Bulk Operations',
      description: 'Manage multiple files',
      href: '/documents/bulk',
      icon: DocumentDuplicateIcon,
      color: 'text-orange-600 bg-orange-50 hover:bg-orange-100',
    },
    {
      name: 'Invite Users',
      description: 'Add team members',
      href: '/users/invite',
      icon: UserPlusIcon,
      color: 'text-pink-600 bg-pink-50 hover:bg-pink-100',
      permission: 'USER_MANAGEMENT',
    },
    {
      name: 'Settings',
      description: 'Configure system',
      href: '/settings',
      icon: CogIcon,
      color: 'text-gray-600 bg-gray-50 hover:bg-gray-100',
      permission: 'SYSTEM_SETTINGS',
    },
  ];

  const filteredActions = quickActions.filter(action => 
    !action.permission || hasPermission(action.permission) || hasPermission('*')
  );

  const handleActionClick = (action: QuickAction) => {
    if (action.onClick) {
      action.onClick();
    } else if (action.href) {
      router.push(action.href);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
      </div>

      <div className="card-content">
        <div className="grid grid-cols-2 gap-4">
          {filteredActions.map((action) => (
            <button
              key={action.name}
              onClick={() => handleActionClick(action)}
              className={`
                p-4 rounded-lg border border-gray-200 hover:border-gray-300 
                transition-all duration-200 text-left group hover:shadow-sm
                ${action.color}
              `}
            >
              <div className="flex items-center">
                <action.icon className="h-6 w-6 flex-shrink-0" />
                <div className="ml-3">
                  <p className="text-sm font-medium">{action.name}</p>
                  <p className="text-xs opacity-75">{action.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuickActions;