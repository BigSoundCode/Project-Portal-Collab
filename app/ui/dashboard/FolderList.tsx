// app/ui/dashboard/FolderList.tsx
'use client';

import React from 'react';
import { DriveItem } from '@/app/lib/definitions';

interface FolderListProps {
  folders: DriveItem[];
  onFolderClick: (id: string, name: string) => void;
  currentFolderId: string | null;
}

const FolderList = React.memo(({ folders, onFolderClick, currentFolderId }: FolderListProps) => {
  const getIconPath = (folderName: string): string | null => {
    switch (folderName) {
      case 'Customer Inspiration':
        return '/icons/customer-inspiration.svg';  // Note the leading slash
      case 'Progress Photos':
        return '/icons/progress-photos.svg';
      case 'Contracts':
        return '/icons/contracts.svg';
      case 'Drawings':
        return '/icons/drawings.svg';
      case 'Permit Info':
        return '/icons/permit-info.svg';
      case 'Schedule':
        return '/icons/schedule.svg';
      case 'Budget':
        return '/icons/budget.svg';
      default:
        return null;
    }
  };

  return (
    <nav className="mt-4 space-y-2">
      {folders.map((folder) => {
        const iconPath = getIconPath(folder.name);
        console.log('Loading icon from:', iconPath, 'for folder:', folder.name);
        
        return (
          <button 
            key={folder.id}
            className={`w-full text-left px-4 py-2 hover:bg-yellow-100 rounded transition-colors duration-200 flex items-center ${
              folder.id === currentFolderId ? 'bg-yellow-100' : ''
            }`}
            onClick={() => onFolderClick(folder.id, folder.name)}
          >
            <div className="w-5 h-5 mr-2 flex-shrink-0 text-gray-700">
              {iconPath ? (
                <img 
                  src={iconPath}
                  alt=""
                  className="w-full h-full"
                  onError={(e) => {
                    console.error('Failed to load icon:', iconPath);
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <span role="img" aria-label="Folder">📁</span>
              )}
            </div>
            <span>{folder.name}</span>
          </button>
        );
      })}
    </nav>
  );
});

FolderList.displayName = 'FolderList';

export default FolderList;