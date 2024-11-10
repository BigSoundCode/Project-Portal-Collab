'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import FolderContent from '@/app/ui/dashboard/FolderContent';
import Sidebar from '@/app/ui/dashboard/Sidebar';
import { FolderProvider, useFolderContext } from '@/app/contexts/FolderContext';
import { DriveItem } from '@/app/lib/definitions';

function DashboardContent() {
  const { data: session, status } = useSession();
  const [rootFolders, setRootFolders] = useState<DriveItem[]>([]);
  const [rootDriveId, setRootDriveId] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { 
    setCurrentItems, 
    setRootFolderName, 
    setFolderPath,
    folderPath 
  } = useFolderContext();

  const fetchItems = useCallback(async (folderId: string, isInitialLoad: boolean = false) => {
    console.log('==========================================');
    console.log('FETCH ITEMS STARTED');
    console.log('Folder ID:', folderId);
    console.log('Is initial load:', isInitialLoad);
    console.log('Current drive ID:', rootDriveId);
    console.log('==========================================');
  
    if (!session?.accessToken) {
      setError('Authentication error. Please try signing in again.');
      return [];
    }
  
    if (!isInitialLoad) {
      setIsFetching(true);
    }
    setError(null);
  
    try {
      // Handle root folder access
      if (folderId === session.onedriveFolderId) {
        const folderResponse = await fetch(`https://graph.microsoft.com/v1.0/shares/${folderId}/driveItem`, {
          headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'Content-Type': 'application/json'
          }
        });
  
        if (!folderResponse.ok) {
          throw new Error('Failed to access root folder');
        }
  
        const folderData = await folderResponse.json();
        const driveId = folderData.parentReference?.driveId || folderData.remoteItem?.parentReference?.driveId;
        const itemId = folderData.id || folderData.remoteItem?.id;
  
        if (!driveId || !itemId) {
          throw new Error('Could not determine folder location');
        }
  
        // Set root information only on initial load
        if (isInitialLoad) {
          setRootDriveId(driveId);
          setRootFolderName(folderData.name);
          setFolderPath([{
            id: itemId,
            name: folderData.name,
            driveId: driveId
          }]);
        }
  
        // Get root folder contents
        const contentsResponse = await fetch(
          `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${itemId}/children`,
          {
            headers: {
              'Authorization': `Bearer ${session.accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
  
        if (!contentsResponse.ok) {
          throw new Error('Failed to get folder contents');
        }
  
        const contentsData = await contentsResponse.json();
        
        // Update root folders only on initial load
        if (isInitialLoad) {
          const folders = contentsData.value.filter((item: DriveItem) => item.folder);
          setRootFolders(folders);
        }
  
        setCurrentItems(contentsData.value);
        return contentsData.value;
      } 
      // Handle subfolder access
      else {
        if (!rootDriveId) {
          throw new Error('Drive ID not found');
        }
  
        // Directly get the contents of the clicked folder
        const contentsResponse = await fetch(
          `https://graph.microsoft.com/v1.0/drives/${rootDriveId}/items/${folderId}/children`,
          {
            headers: {
              'Authorization': `Bearer ${session.accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
  
        if (!contentsResponse.ok) {
          throw new Error('Failed to access folder contents');
        }
  
        const contentsData = await contentsResponse.json();
        setCurrentItems(contentsData.value);
        return contentsData.value;
      }
    } catch (error) {
      console.error('Error in fetchItems:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      return [];
    } finally {
      if (!isInitialLoad) {
        setIsFetching(false);
      }
    }
  }, [session, rootDriveId, setCurrentItems, setRootDriveId, setRootFolderName, setFolderPath]);
  
  // Update the useEffect to use isInitialLoad
  useEffect(() => {
    async function initializeFolderView() {
      if (status === 'authenticated' && session?.accessToken && session?.onedriveFolderId) {
        try {
          const items = await fetchItems(session.onedriveFolderId, true);
          if (items.length > 0) {
            const folders = items.filter((item: DriveItem) => item.folder);
            setRootFolders(folders);
          }
        } catch (error) {
          console.error('Error initializing folder view:', error);
          setError('Failed to access folder. Please check your permissions.');
        } finally {
          setIsInitializing(false);
        }
      } else if (status !== 'loading') {
        setIsInitializing(false);
      }
    }
  
    initializeFolderView();
  }, [status, session?.accessToken, session?.onedriveFolderId]); // Remove fetchItems from dependencies

  const downloadFile = useCallback(async (fileId: string, fileName: string) => {
    if (!session?.accessToken || !rootDriveId) {
      setError('No access token or drive ID available for download');
      return;
    }
  
    try {
      const fileInfoEndpoint = `https://graph.microsoft.com/v1.0/drives/${rootDriveId}/items/${fileId}`;
      const fileInfoResponse = await fetch(fileInfoEndpoint, {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
  
      if (!fileInfoResponse.ok) {
        throw new Error(`Failed to get file information: ${fileInfoResponse.status}`);
      }
  
      const fileInfo = await fileInfoResponse.json();
      
      if (!fileInfo['@microsoft.graph.downloadUrl']) {
        throw new Error('Download URL not available');
      }
  
      const downloadResponse = await fetch(fileInfo['@microsoft.graph.downloadUrl']);
  
      if (!downloadResponse.ok) {
        throw new Error(`Download failed: ${downloadResponse.status}`);
      }
  
      const blob = await downloadResponse.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
      setError('Failed to download file. Please try again.');
    }
  }, [session?.accessToken, rootDriveId]);

  useEffect(() => {
    async function initializeFolderView() {
      if (status === 'authenticated' && session?.accessToken && session?.onedriveFolderId) {
        try {
          const items = await fetchItems(session.onedriveFolderId);
          if (items.length > 0) {
            const folders = items.filter((item: DriveItem) => item.folder);
            setRootFolders(folders);
          }
        } catch (error) {
          console.error('Error initializing folder view:', error);
          setError('Failed to access folder. Please check your permissions.');
        } finally {
          setIsInitializing(false);
        }
      } else if (status !== 'loading') {
        setIsInitializing(false);
      }
    }

    initializeFolderView();
  }, [status, session, fetchItems]);

  // Only show loading for initial load
  if (status === 'loading' || isInitializing) {
    return <div>Loading...</div>;
  }

  if (status === 'unauthenticated') {
    return <div>Please log in to access your files.</div>;
  }

  if (error) {
    return (
      <div>
        <p>Error: {error}</p>
        <button onClick={() => signIn('azure-ad')}>Try signing in again</button>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-gray-100">
      <Sidebar 
        rootFolders={rootFolders} 
        fetchItems={fetchItems}
        isLoading={isFetching}
      />
      <FolderContent 
        fetchItems={fetchItems}
        onFileClick={downloadFile}
        rootDriveId={rootDriveId}
        isLoading={isFetching}
      />
    </div>
  );
}

export default function Page() {
  return (
    <FolderProvider>
      <DashboardContent />
    </FolderProvider>
  );
}