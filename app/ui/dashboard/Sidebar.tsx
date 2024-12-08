'use client';

import React from 'react';
import { DriveItem } from '@/app/lib/definitions';
import { useFolderContext } from '@/app/contexts/FolderContext';
import UserName from './UserName';

interface SidebarProps {
  rootFolders: DriveItem[];
  fetchItems: (folderId: string, isInitialLoad?: boolean) => Promise<DriveItem[]>;
  isLoading?: boolean;
  rootDriveId: string | null;  // Add this
}




// In both files, update getIconPath:
const getIconPath = (folderName: string): string => {
  switch (folderName) {
    case 'Customer Inspiration':
      return '/icons/customer-inspiration.svg';
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
      return '/icons/folder.svg'; // Default icon path
  }
};

const FolderList = React.memo(({ folders, onFolderClick, currentFolderId }: {
  folders: DriveItem[];
  onFolderClick: (id: string, name: string) => void;
  currentFolderId: string | null;
}) => (
  <nav className="mt-4 space-y-2">
    {folders.map((folder) => (
      <button 
        key={folder.id}
        className={`w-full text-left px-4 py-2 hover:bg-yellow-100 rounded transition-colors duration-200 flex items-center ${
          folder.id === currentFolderId ? 'bg-yellow-100' : ''
        }`}
        onClick={() => onFolderClick(folder.id, folder.name)}
      >
        <div className="w-5 h-5 mr-2 flex items-center justify-center">
          {getIconPath(folder.name) ? (
            <img 
              src={getIconPath(folder.name)}
              alt=""
              className="w-full h-full"
              onError={(e) => {
                console.error(`Failed to load icon for ${folder.name}`);
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <span role="img" aria-label="Folder">📁</span>
          )}
        </div>
        <span>{folder.name}</span>
      </button>
    ))}
  </nav>
));

FolderList.displayName = 'FolderList';

const Sidebar = React.memo(({ rootFolders, fetchItems, rootDriveId }: SidebarProps) => {
  const { currentFolderId, setCurrentFolderId, setCurrentItems, setFolderPath, rootFolderName, folderPath } = useFolderContext();

  const handleRootFolderClick = React.useCallback(async (id: string, name: string) => {
    const rootFolder = folderPath[0]; // Get the stored root folder
    
    setCurrentFolderId(id);
    const items = await fetchItems(id);
    setCurrentItems(items);
    
    // Set path maintaining the original root folder
    setFolderPath([
      rootFolder,  // Keep original root
      { id, name, driveId: rootFolder.driveId }
    ]);
  }, [fetchItems, setCurrentFolderId, setCurrentItems, setFolderPath, folderPath]);

  return (
    <aside className="w-64 flex-shrink-0 bg-white border-r border-black p-4">
      <UserName />
      <hr className="border-t border-black my-4" />
      <FolderList 
        folders={rootFolders} 
        onFolderClick={handleRootFolderClick}
        currentFolderId={currentFolderId}
      />
    </aside>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;