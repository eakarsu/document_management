'use client';

import React from 'react';
import {
  DocumentIcon,
  FolderIcon,
  CloudArrowUpIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

interface StatCard {
  name: string;
  value: string;
  change: string;
  changeType: 'increase' | 'decrease';
  icon: React.ComponentType<any>;
  color: string;
}

const StatsCards: React.FC = () => {
  // In a real app, this data would come from an API call
  const stats: StatCard[] = [
    {
      name: 'Total Documents',
      value: '2,847',
      change: '+12.5%',
      changeType: 'increase',
      icon: DocumentIcon,
      color: 'bg-blue-500',
    },
    {
      name: 'Folders',
      value: '156',
      change: '+3.2%',
      changeType: 'increase',
      icon: FolderIcon,
      color: 'bg-green-500',
    },
    {
      name: 'Storage Used',
      value: '24.8 GB',
      change: '+8.1%',
      changeType: 'increase',
      icon: CloudArrowUpIcon,
      color: 'bg-purple-500',
    },
    {
      name: 'Views Today',
      value: '1,429',
      change: '-2.4%',
      changeType: 'decrease',
      icon: EyeIcon,
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <div key={stat.name} className="card hover:shadow-md transition-shadow">
          <div className="card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`${stat.color} rounded-lg p-3`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-4 flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                    <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                  </div>
                </div>
                <div className="flex items-center mt-1">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      stat.changeType === 'increase'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {stat.changeType === 'increase' ? '↗' : '↘'} {stat.change}
                  </span>
                  <span className="text-xs text-gray-500 ml-2">from last month</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;