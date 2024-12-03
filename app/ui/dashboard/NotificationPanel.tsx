'use client';

import React from 'react';

interface Notification {
  file_name: string;
  folder_name: string;
  created_at: string;
  action_type: string;
}

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
}

const NotificationPanel = ({ isOpen, onClose, notifications }: NotificationPanelProps) => {
  if (!isOpen) return null;

  return (
    <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Notifications</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No new notifications
          </div>
        ) : (
          notifications.map((notification, index) => (
            <div 
              key={index} 
              className="p-4 border-b border-gray-100 hover:bg-gray-50"
            >
              <div className="text-sm">
                <span className="font-medium">{notification.file_name}</span>
                {' was '}
                <span className="text-blue-600">{notification.action_type}</span>
                {' in '}
                <span className="font-medium">{notification.folder_name}</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {new Date(notification.created_at).toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;