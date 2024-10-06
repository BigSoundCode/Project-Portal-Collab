'use client'

import React, { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface DriveItem {
  id: string;
  name: string;
  folder?: { childCount: number };
  file?: { mimeType: string };
}

interface OneDriveProps {
  initialFolderId?: string;
}

const OneDrive: React.FC<OneDriveProps> = ({ initialFolderId }) => {
  console.log('OneDrive component initialized with initialFolderId:', initialFolderId);

  const { data: session, status } = useSession();
  const [items, setItems] = useState<DriveItem[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(initialFolderId || null);
  const [folderPath, setFolderPath] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  console.log('Initial currentFolderId state:', currentFolderId);

  const fetchItems = useCallback(async (accessToken: string, folderId: string | null = null) => {
    console.log('fetchItems called with folderId:', folderId);
    setIsLoading(true);
    try {
      const endpoint = folderId
        ? `https://graph.microsoft.com/v1.0/me/drive/items/${folderId}/children`
        : 'https://graph.microsoft.com/v1.0/me/drive/root/children';
  
      console.log('Fetching from endpoint:', endpoint);
  
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
  
      console.log('Response status:', response.status);
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to fetch items: ${response.status} ${errorText}`);
      }
  
      const data = await response.json();
      console.log('Fetched data:', data);
      setItems(data.value);
      setCurrentFolderId(folderId);
    } catch (error) {
      console.error('Error in fetchItems:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleFolderClick = useCallback((folderId: string, folderName: string) => {
    console.log('Folder clicked:', folderId, folderName);
    setFolderPath(prev => [...prev, { id: folderId, name: folderName }]);
    fetchItems(session?.accessToken as string, folderId);
  }, [session, fetchItems]);

  const handleBackClick = useCallback(() => {
    console.log('Back button clicked');
    if (folderPath.length > 0) {
      const newPath = [...folderPath];
      newPath.pop();
      setFolderPath(newPath);
      const parentFolderId = newPath.length > 0 ? newPath[newPath.length - 1].id : null;
      console.log('Navigating to parent folder:', parentFolderId);
      fetchItems(session?.accessToken as string, parentFolderId);
    }
  }, [session, fetchItems, folderPath]);

  useEffect(() => {
    console.log('useEffect triggered. Status:', status, 'CurrentFolderId:', currentFolderId);
    if (status === 'authenticated' && session?.accessToken) {
      console.log('Calling fetchItems with currentFolderId:', currentFolderId);
      fetchItems(session.accessToken, currentFolderId);
    }
  }, [status, session, fetchItems, currentFolderId]);

  const downloadFile = async (fileId: string, fileName: string) => {
    console.log('Attempting to download file:', fileName, 'with ID:', fileId);
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
      console.log('File download initiated for:', fileName);
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

  return (
    <div>
      <h2>OneDrive Items</h2>
      {folderPath.length > 0 && (
        <div>
          <button onClick={handleBackClick}>Back</button>
          <p>Current path: {folderPath.map(folder => folder.name).join(' > ')}</p>
        </div>
      )}
      {items.length === 0 ? (
        <p>No items found in this folder.</p>
      ) : (
        <ul>
          {items.map((item) => (
            <li key={item.id}>
              {item.folder ? (
                <button onClick={() => handleFolderClick(item.id, item.name)}>
                  📁 {item.name} ({item.folder.childCount} items)
                </button>
              ) : (
                <a 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    downloadFile(item.id, item.name);
                  }}
                >
                  📄 {item.name}
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default OneDrive;