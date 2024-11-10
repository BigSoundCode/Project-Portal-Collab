'use client';

import React from 'react';
import { DriveItem, FolderReference } from '@/app/lib/definitions';
import { useFolderContext } from '@/app/contexts/FolderContext';

interface FolderContentProps {
  fetchItems: (folderId: string, isInitialLoad?: boolean) => Promise<DriveItem[]>;
  onFileClick: (id: string, name: string) => void;
  rootDriveId: string | null;
  isLoading?: boolean; // Add this
}


const FolderContent = React.memo(({ fetchItems, onFileClick, rootDriveId }: FolderContentProps) => {
  const { 
    currentItems, 
    folderPath, 
    rootFolderName,
    setCurrentItems,
    setCurrentFolderId,
    setFolderPath
  } = useFolderContext();

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

  const isImage = (item: DriveItem) => {
    return item.file?.mimeType?.startsWith('image/') || 
           ['.jpg', '.jpeg', '.png', '.gif', '.bmp'].some(ext => 
             item.name.toLowerCase().endsWith(ext));
  };

  const getThumbUrl = (item: DriveItem) => {
    return item.file?.thumbnails?.[0]?.large?.url;
  };

  const handleFolderClick = React.useCallback(async (folderId: string, folderName: string) => {
    if (rootDriveId) {
      setCurrentFolderId(folderId);
      const newFolder: FolderReference = {
        id: folderId,
        name: folderName,
        driveId: rootDriveId
      };
      setFolderPath((prevPath: FolderReference[]) => [...prevPath, newFolder]);
      const items = await fetchItems(folderId);
      setCurrentItems(items);
    }
  }, [rootDriveId, fetchItems, setCurrentFolderId, setFolderPath, setCurrentItems]);

  const handleBackClick = React.useCallback(async () => {
    if (folderPath.length > 1) {
      const newPath = [...folderPath];
      newPath.pop();
      setFolderPath(newPath);
      const parentFolder = newPath[newPath.length - 1];
      setCurrentFolderId(parentFolder.id);
      const items = await fetchItems(parentFolder.id);
      setCurrentItems(items);
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
  const currentFolderName = folderPath[folderPath.length - 1]?.name || rootFolderName;

  return (
    <main className="flex-1 flex flex-col min-w-0 w-full bg-white">
      <div className="flex justify-between items-center p-6 border-b border-black">
        <div className="flex flex-1 items-center">
          <h1 className="text-2xl font-bold">
            {isRootFolder ? rootFolderName : currentFolderName}
          </h1>
          {!isRootFolder && (
            <div className="ml-4 text-sm text-gray-500">
              {folderPath.map((folder: FolderReference, index: number) => (
                <span key={folder.id}>
                  {index > 0 && " > "}
                  {index === 0 ? rootFolderName : folder.name}
                </span>
              ))}
            </div>
          )}
        </div>
        {folderPath.length > 1 && (
          <button 
            onClick={handleBackClick}
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
                      {getIconPath(item.name) ? (
                        <img 
                          src={getIconPath(item.name)}
                          alt=""
                          className="w-full h-full"
                          onError={(e) => {
                            console.error(`Failed to load icon for ${item.name}`);
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <span role="img" aria-label="Folder">📁</span>
                      )}
                    </div>
                    <span>{item.name}</span>
                  </button>
                ) : isImage(item) && getThumbUrl(item) ? (
                  <button 
                    onClick={() => onFileClick(item.id, item.name)}
                    className="flex items-center space-x-2 px-4 py-2 hover:bg-yellow-100 rounded transition-colors duration-200 w-full text-left"
                  >
                    <img src={getThumbUrl(item)} alt={item.name} className="w-10 h-10 object-cover" />
                    <span>{item.name}</span>
                  </button>
                ) : (
                  <button 
                    onClick={() => onFileClick(item.id, item.name)}
                    className="flex items-center space-x-2 px-4 py-2 hover:bg-yellow-100 rounded transition-colors duration-200 w-full text-left"
                  >
                    <span role="img" aria-label="File">📄</span>
                    <span>{item.name}</span>
                  </button>
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