'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface DriveItem {
  id: string;
  name: string;
  folder?: { childCount: number };
  file?: { 
    mimeType?: string;
    thumbnails?: Array<{
      large?: {
        url: string;
      };
    }>;
  };
}

const UserName: React.FC = () => {
  const { data: session } = useSession();
  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold">{session?.user?.name || 'User'}</h2>
    </div>
  );
};

const FolderList: React.FC<{
  folders: DriveItem[];
  onFolderClick: (id: string, name: string) => void;
}> = React.memo(({ folders, onFolderClick }) => (
  <nav className="mt-4">
    {folders.map((folder, index) => (
      <React.Fragment key={folder.id}>
        <button 
          className="w-full text-left px-4 py-2 hover:bg-yellow-100 transition-colors duration-200"
          onClick={() => onFolderClick(folder.id, folder.name)}
        >
          {folder.name}
        </button>
        {index < folders.length - 1 && (
          <hr className="my-2 mx-4 border-t border-black" />
        )}
      </React.Fragment>
    ))}
  </nav>
));

FolderList.displayName = 'FolderList';

const ItemList: React.FC<{
  items: DriveItem[];
  onFolderClick: (id: string, name: string) => void;
  onFileClick: (id: string, name: string) => void;
}> = React.memo(({ items, onFolderClick, onFileClick }) => {
  const isImage = (item: DriveItem) => {
    return item.file?.mimeType?.startsWith('image/') || 
           ['.jpg', '.jpeg', '.png', '.gif', '.bmp'].some(ext => item.name.toLowerCase().endsWith(ext));
  };

  const getThumbUrl = (item: DriveItem) => {
    return item.file?.thumbnails?.[0]?.large?.url;
  };

  const sortedItems = [...items].sort((a, b) => {
    if (isImage(a) && !isImage(b)) return -1;
    if (!isImage(a) && isImage(b)) return 1;
    return 0;
  });

  return (
    <ul className="space-y-2">
      {sortedItems.map((item, index) => (
        <React.Fragment key={item.id}>
          <li className="flex items-center">
            {item.folder ? (
              <button 
                onClick={() => onFolderClick(item.id, item.name)}
                className="flex items-center space-x-2 px-4 py-2 hover:bg-yellow-100 rounded transition-colors duration-200 w-full text-left"
              >
                <span role="img" aria-label="Folder">📁</span>
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
            <hr className="my-2 border-t border-black" />
          )}
        </React.Fragment>
      ))}
    </ul>
  );
});

ItemList.displayName = 'ItemList';

export default function Page() {
  const { data: session, status } = useSession();
  const [rootFolders, setRootFolders] = useState<DriveItem[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [currentItems, setCurrentItems] = useState<DriveItem[]>([]);
  const [folderPath, setFolderPath] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async (accessToken: string, folderId: string | null = null) => {
    setIsLoading(true);
    try {
      const endpoint = folderId
        ? `https://graph.microsoft.com/v1.0/me/drive/items/${folderId}/children`
        : 'https://graph.microsoft.com/v1.0/me/drive/root/children';

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch items: ${response.status}`);
      }

      const data = await response.json();
      return data.value;
    } catch (error) {
      console.error('Error in fetchItems:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      return [];
    } finally {
      setIsLoading(false);
    }
    console.log('Fetching items with token:', accessToken.substring(0, 10) + '...');
  }, []);

  useEffect(() => {
    if (status === 'authenticated' && session?.accessToken) {
      fetchItems(session.accessToken).then(items => {
        setRootFolders(items.filter((item: DriveItem) => item.folder));
        setCurrentItems(items);
      });
    }
  }, [status, session, fetchItems]);

  const handleFolderClick = useCallback((folderId: string, folderName: string) => {
    if (session?.accessToken) {
      setFolderPath(prev => [...prev, { id: folderId, name: folderName }]);
      setCurrentFolderId(folderId);
      fetchItems(session.accessToken, folderId).then(setCurrentItems);
    }
  }, [session, fetchItems]);

  const handleBackClick = useCallback(() => {
    if (folderPath.length > 0 && session?.accessToken) {
      const newPath = [...folderPath];
      newPath.pop();
      setFolderPath(newPath);
      const parentFolderId = newPath.length > 0 ? newPath[newPath.length - 1].id : null;
      setCurrentFolderId(parentFolderId);
      fetchItems(session.accessToken, parentFolderId).then(setCurrentItems);
    }
  }, [session, fetchItems, folderPath]);

  const downloadFile = async (fileId: string, fileName: string) => {
    if (!session?.accessToken) return;

    try {
      const response = await fetch(`/api/download-file?fileId=${fileId}`, {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  if (status === 'loading' || isLoading) {
    return <div>Loading...</div>;
  }

  if (status === 'unauthenticated') {
    return <div>Please log in to access OneDrive files.</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  const currentFolderName = folderPath.length > 0 
    ? folderPath[folderPath.length - 1].name 
    : 'Home';

  return (
    <>
      <aside className="w-64 bg-white border-r border-black overflow-y-auto">
        <UserName />
        <hr className="border-t border-black my-4" />
        <FolderList folders={rootFolders} onFolderClick={handleFolderClick} />
      </aside>
      <main className="flex-grow p-6 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">{currentFolderName}</h1>
          {folderPath.length > 0 && (
            <button 
              onClick={handleBackClick}
              className="px-4 py-2 bg-yellow-100 text-black rounded hover:bg-blue-600 hover:text-white transition-colors duration-200"
            >
              Back
            </button>
          )}
        </div>
        
        <ItemList 
          items={currentItems} 
          onFolderClick={handleFolderClick} 
          onFileClick={downloadFile}
        />
      </main>
    </>
  );

  useEffect(() => {
    console.log('Session status:', status);
    console.log('Session data:', session);
  }, [status, session]);
  
}

