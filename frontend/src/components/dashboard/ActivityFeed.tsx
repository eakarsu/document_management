'use client';

import React from 'react';
import {
  CloudArrowUpIcon,
  DocumentIcon,
  FolderIcon,
  UserIcon,
  EyeIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

interface Activity {
  id: string;
  type: 'upload' | 'view' | 'edit' | 'delete' | 'create_folder' | 'share';
  user: {
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  target: {
    name: string;
    type: 'document' | 'folder';
  };
  timestamp: string;
  description: string;
}

const ActivityFeed: React.FC = () => {
  // Mock data - in a real app, this would come from an API
  const activities: Activity[] = [
    {
      id: '1',
      type: 'upload',
      user: {
        firstName: 'John',
        lastName: 'Smith',
      },
      target: {
        name: 'Q4 Financial Report',
        type: 'document',
      },
      timestamp: '2024-01-15T10:30:00Z',
      description: 'uploaded a new document',
    },
    {
      id: '2',
      type: 'edit',
      user: {
        firstName: 'Sarah',
        lastName: 'Johnson',
      },
      target: {
        name: 'Employee Handbook',
        type: 'document',
      },
      timestamp: '2024-01-15T09:15:00Z',
      description: 'updated the document',
    },
    {
      id: '3',
      type: 'create_folder',
      user: {
        firstName: 'Mike',
        lastName: 'Davis',
      },
      target: {
        name: 'Project Documents',
        type: 'folder',
      },
      timestamp: '2024-01-14T16:45:00Z',
      description: 'created a new folder',
    },
    {
      id: '4',
      type: 'view',
      user: {
        firstName: 'Emily',
        lastName: 'Brown',
      },
      target: {
        name: 'Marketing Campaign',
        type: 'document',
      },
      timestamp: '2024-01-14T14:20:00Z',
      description: 'viewed the document',
    },
    {
      id: '5',
      type: 'share',
      user: {
        firstName: 'Alex',
        lastName: 'Wilson',
      },
      target: {
        name: 'System Architecture',
        type: 'document',
      },
      timestamp: '2024-01-14T11:30:00Z',
      description: 'shared the document',
    },
    {
      id: '6',
      type: 'delete',
      user: {
        firstName: 'David',
        lastName: 'Lee',
      },
      target: {
        name: 'Old Template',
        type: 'document',
      },
      timestamp: '2024-01-13T08:45:00Z',
      description: 'deleted the document',
    },
  ];

  const getActivityIcon = (type: Activity['type']) => {
    const iconClasses = "h-5 w-5";
    switch (type) {
      case 'upload':
        return <CloudArrowUpIcon className={`${iconClasses} text-green-600`} />;
      case 'edit':
        return <PencilSquareIcon className={`${iconClasses} text-blue-600`} />;
      case 'view':
        return <EyeIcon className={`${iconClasses} text-gray-600`} />;
      case 'delete':
        return <TrashIcon className={`${iconClasses} text-red-600`} />;
      case 'create_folder':
        return <FolderIcon className={`${iconClasses} text-purple-600`} />;
      case 'share':
        return <UserIcon className={`${iconClasses} text-orange-600`} />;
      default:
        return <DocumentIcon className={`${iconClasses} text-gray-600`} />;
    }
  };

  const getRelativeTime = (timestamp: string): string => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    }
  };

  const getUserInitials = (firstName: string, lastName: string): string => {
    return `${firstName[0]}${lastName[0]}`;
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          <button className="text-sm font-medium text-primary-600 hover:text-primary-500 transition-colors">
            View all
          </button>
        </div>
      </div>

      <div className="card-content">
        <div className="flow-root">
          <ul className="-mb-8">
            {activities.map((activity, activityIdx) => (
              <li key={activity.id}>
                <div className="relative pb-8">
                  {activityIdx !== activities.length - 1 ? (
                    <span
                      className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                      aria-hidden="true"
                    />
                  ) : null}
                  <div className="relative flex space-x-3">
                    <div>
                      <span className="bg-white h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white">
                        {getActivityIcon(activity.type)}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                      <div>
                        <div className="flex items-center space-x-2">
                          {activity.user.avatar ? (
                            <img
                              className="h-6 w-6 rounded-full"
                              src={activity.user.avatar}
                              alt={`${activity.user.firstName} ${activity.user.lastName}`}
                            />
                          ) : (
                            <div className="h-6 w-6 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-xs font-medium text-gray-700">
                                {getUserInitials(activity.user.firstName, activity.user.lastName)}
                              </span>
                            </div>
                          )}
                          <p className="text-sm text-gray-900">
                            <span className="font-medium">
                              {activity.user.firstName} {activity.user.lastName}
                            </span>{' '}
                            {activity.description}{' '}
                            <span className="font-medium text-gray-900">
                              "{activity.target.name}"
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="text-right text-sm whitespace-nowrap text-gray-500">
                        <time dateTime={activity.timestamp}>
                          {getRelativeTime(activity.timestamp)}
                        </time>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {activities.length === 0 && (
          <div className="text-center py-8">
            <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">No recent activity</p>
            <p className="text-xs text-gray-400">Activity will appear here as users interact with documents</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;