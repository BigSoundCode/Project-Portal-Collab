'use client';

import React from 'react';
import { DriveItem, FolderReference } from '@/app/lib/definitions';
import { useFolderContext } from '@/app/contexts/FolderContext';

interface FolderContentProps {
  fetchItems: (folderId: string, isInitialLoad?: boolean) => Promise<DriveItem[]>;
  onFileClick: (id: string, name: string, item: DriveItem) => void;
  onDownload: (id: string, name: string) => void;
  rootDriveId: string | null;
  isLoading?: boolean;
}

const FolderContent = React.memo(({ fetchItems, onFileClick, onDownload, rootDriveId, isLoading }: FolderContentProps) => {
  const { 
    currentItems, 
    folderPath, 
    rootFolderName,
    setCurrentItems,
    setCurrentFolderId,
    setFolderPath
  } = useFolderContext();

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
        return '/icons/folder.svg';
    }
  };

  const isImage = (item: DriveItem) => {
    return item.file?.mimeType?.startsWith('image/') || 
           ['.jpg', '.jpeg', '.png', '.gif', '.bmp'].some(ext => 
             item.name.toLowerCase().endsWith(ext));
  };

  const getThumbUrl = (item: DriveItem) => {
    return item.thumbnails?.[0]?.large?.url;
  };
  const isPDF = (item: DriveItem) => {
    return item.file?.mimeType === 'application/pdf' || 
           item.name.toLowerCase().endsWith('.pdf');
  };

  const handleFolderClick = React.useCallback(async (folderId: string, folderName: string) => {
    if (rootDriveId) {
      setCurrentFolderId(folderId);
      const newFolder: FolderReference = {
        id: folderId,
        name: folderName,
        driveId: rootDriveId  // Make sure to always include rootDriveId
      };
      setFolderPath(prevPath => {
        // Check if we're already in this folder to prevent duplicates
        if (prevPath.some(folder => folder.id === folderId)) {
          return prevPath;
        }
        return [...prevPath, newFolder];
      });
      const items = await fetchItems(folderId);
      setCurrentItems(items);
    }
  }, [rootDriveId, fetchItems, setCurrentFolderId, setFolderPath, setCurrentItems]);

  const handleBackClick = React.useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    
    console.log('Current folder path:', folderPath);
  
    if (folderPath.length > 1) {
      try {
        // Remove duplicates from path first
        const uniquePath = folderPath.filter((folder, index, self) =>
          index === self.findIndex(f => f.id === folder.id)
        );
        
        // Remove the current folder from the path
        const newPath = [...uniquePath];
        newPath.pop();
        
        // Get the parent folder
        const parentFolder = newPath[newPath.length - 1];
        
        console.log('Navigating to:', parentFolder);
        
        // Update states
        setFolderPath(newPath);
        setCurrentFolderId(parentFolder.id);
        const items = await fetchItems(parentFolder.id);
        setCurrentItems(items);
      } catch (error) {
        console.error('Error during back navigation:', error);
      }
    }
  }, [folderPath, fetchItems, setFolderPath, setCurrentFolderId, setCurrentItems]);

  const sortedItems = React.useMemo(() => {
    return [...currentItems].sort((a, b) => {
      if (a.folder && !b.folder) return -1;
      if (!a.folder && b.folder) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [currentItems]);

  const isRootFolder = folderPath.length <= 1;

  if (isLoading) {
    return (
      <main className="flex-1 flex flex-col min-w-0 w-full bg-white">
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className="h-12 bg-gray-100 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  console.log('Current state:', {
    rootFolderName,
    folderPath,
    isRootFolder,
    currentItems
  });

  return (
    <main className="flex-1 flex flex-col min-w-0 w-full bg-white">
      <div className="flex justify-between items-center p-6 border-b border-black">
  <div className="flex flex-1 items-center">
    <h1 className="text-2xl font-bold">
      {isRootFolder ? (rootFolderName || 'Root Folder') : folderPath[folderPath.length - 1]?.name}
    </h1>
    <div className="ml-4 text-sm text-gray-500">
  {/* Show root folder name only if we're not in root */}
  {!isRootFolder && rootFolderName && (
    <span>{rootFolderName}</span>
  )}
  {/* Filter out any empty or duplicate paths before mapping */}
  {folderPath
    .slice(1) // Skip the root folder since we handled it above
    .filter(folder => folder.name && folder.name !== rootFolderName) // Filter out empty names and duplicates
    .map((folder: FolderReference, index: number) => (
      <span key={folder.id}>
        {" > "}
        {folder.name}
      </span>
    ))}
</div>
  </div>
  {!isRootFolder && (
  <button 
    onClick={(e) => handleBackClick(e)}
    className="ml-4 px-4 py-2 bg-yellow-100 text-black rounded hover:bg-blue-600 hover:text-white transition-colors duration-200"
  >
    Back
  </button>
)}
</div>
      <div className="flex-1 overflow-y-auto p-6">
        <ul className="space-y-2 w-full">
          {sortedItems.map((item, index) => (
            <React.Fragment key={item.id}>
              <li className="flex items-center w-full">
                {item.folder ? (
                  <button 
                    onClick={() => handleFolderClick(item.id, item.name)}
                    className="flex items-center space-x-2 px-4 py-2 hover:bg-yellow-100 rounded transition-colors duration-200 w-full text-left"
                  >
                    <div className="w-5 h-5 flex items-center justify-center">
                      <img 
                        src={getIconPath(item.name)}
                        alt=""
                        className="w-full h-full"
                        onError={(e) => {
                          console.error(`Failed to load icon for ${item.name}`);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                    <span>{item.name}</span>
                  </button>
                ) : (
                  <div className="flex items-center justify-between w-full px-4 py-2 hover:bg-yellow-100 rounded transition-colors duration-200">
                    <button 
                      onClick={() => onFileClick(item.id, item.name, item)}
                      className="flex items-center space-x-2 text-left flex-grow"
                    >
                      {isImage(item) && getThumbUrl(item) ? (
  <img 
    src={getThumbUrl(item)} 
    alt={item.name} 
    className="w-10 h-10 object-cover rounded"
  />
) : (
  isPDF(item) ? (
    <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ) : (
    <span role="img" aria-label="File">📄</span>
  )
)}
                      <span>{item.name}</span>
                    </button>
                    <button
                      onClick={() => onDownload(item.id, item.name)}
                      className="ml-4 p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100"
                      title="Download file"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </button>
                  </div>
                )}
              </li>
              {index < sortedItems.length - 1 && (
                <hr className="border-t border-black w-full" />
              )}
            </React.Fragment>
          ))}
        </ul>
      </div>
    </main>
  );
});

FolderContent.displayName = 'FolderContent';

export default FolderContent;