'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import FolderContent from '@/app/ui/dashboard/FolderContent';
import Sidebar from '@/app/ui/dashboard/Sidebar';
import { FolderProvider, useFolderContext } from '@/app/contexts/FolderContext';
import { DriveItem } from '@/app/lib/definitions';

interface PreviewData {
  type: 'image' | 'pdf';
  url: string;
  name: string;
}

const getFileType = (item: DriveItem): 'image' | 'pdf' | 'other' => {
  if (!item.file?.mimeType) return 'other';
  
  if (item.file.mimeType.startsWith('image/') || 
      ['.jpg', '.jpeg', '.png', '.gif', '.bmp'].some(ext => 
        item.name.toLowerCase().endsWith(ext))) {
    return 'image';
  }
  
  if (item.file.mimeType === 'application/pdf' || 
      item.name.toLowerCase().endsWith('.pdf')) {
    return 'pdf';
  }
  
  return 'other';
};

function DashboardContent() {
  const { data: session, status } = useSession();
  const [rootFolders, setRootFolders] = useState<DriveItem[]>([]);
  const [rootDriveId, setRootDriveId] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  
  const { 
    setCurrentItems, 
    setRootFolderName, 
    setFolderPath,
  } = useFolderContext();

  const PreviewModal = () => {
    if (!isPreviewOpen || !previewData) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-4 rounded-lg max-w-4xl max-h-[90vh] w-full relative">
          <button 
            onClick={() => setIsPreviewOpen(false)}
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 p-2 rounded hover:bg-gray-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h2 className="text-lg font-semibold mb-4 pr-12">{previewData.name}</h2>
          <div className="overflow-auto max-h-[calc(90vh-100px)]">
            {previewData.type === 'image' && (
              <img 
                src={previewData.url} 
                alt={previewData.name}
                className="max-w-full h-auto mx-auto"
                loading="lazy"
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  const getUserFolderId = async (email: string): Promise<string> => {
    const response = await fetch(`/api/getUserFolderId?email=${encodeURIComponent(email)}`);
    if (!response.ok) {
      throw new Error('Failed to fetch user folder ID');
    }
    const data = await response.json();
    return data.onedrive_folder_id;
  };

  const handleFileClick = useCallback(async (fileId: string, fileName: string, item: DriveItem) => {
    if (!session?.accessToken || !rootDriveId) {
      setError('No access token or drive ID available');
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

      const downloadUrl = fileInfo['@microsoft.graph.downloadUrl'];
      const fileType = getFileType(item);

      switch (fileType) {
        case 'image':
          setPreviewData({
            type: 'image',
            url: downloadUrl,
            name: fileName
          });
          setIsPreviewOpen(true);
          break;

        case 'pdf':
          window.open(downloadUrl, '_blank');
          break;

        default:
          const response = await fetch(downloadUrl);
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
          document.body.removeChild(a);
          break;
      }
    } catch (error) {
      console.error('Error handling file:', error);
      setError(error instanceof Error ? error.message : 'Failed to handle file. Please try again.');
    }
  }, [session?.accessToken, rootDriveId]);

  const fetchItems = useCallback(async (folderId: string, isInitialLoad: boolean = false) => {
    if (!session?.user?.email) {
      setError('Authentication error. Please try signing in again.');
      return [];
    }

    if (!isInitialLoad && !folderId) {
      setError('No folder ID available');
      return [];
    }

    if (!isInitialLoad) {
      setIsFetching(true);
    }

    try {
      let folderIdToUse = folderId;
      if (isInitialLoad) {
        folderIdToUse = await getUserFolderId(session.user.email);
        if (!folderIdToUse) {
          throw new Error('No OneDrive folder assigned to this user');
        }
      }

      const encodedFolderId = encodeURIComponent(folderIdToUse);
      const apiUrl = `/api/onedrive/folder/${encodedFolderId}`;
      
      const response = await fetch(apiUrl);

      if (!response.ok) {
        const errorData = await response.text();
        try {
          const parsedError = JSON.parse(errorData);
          throw new Error(parsedError.error || `Failed to fetch folder contents: ${response.status}`);
        } catch (e) {
          throw new Error(`Failed to fetch folder contents: ${response.status}`);
        }
      }

      const data = await response.json();

      if (isInitialLoad) {
        const driveId = data.parentReference?.driveId;
        if (driveId) {
          setRootDriveId(driveId);
          setRootFolderName(data.name);
          setFolderPath([{
            id: folderIdToUse,
            name: data.name,
            driveId: driveId
          }]);
        }
      }

      const processedItems = data.children?.map((item: DriveItem) => ({
        id: item.id,
        name: item.name,
        size: item.size,
        folder: item.folder,
        file: item.file,
        webUrl: item.webUrl,
        createdDateTime: item.createdDateTime,
        lastModifiedDateTime: item.lastModifiedDateTime,
        thumbnails: item.thumbnails
      })) || [];

      if (isInitialLoad) {
        const folders = processedItems.filter((item: DriveItem) => item.folder);
        setRootFolders(folders);
      }

      setCurrentItems(processedItems);
      return processedItems;

    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      return [];
    } finally {
      if (!isInitialLoad) {
        setIsFetching(false);
      }
    }
  }, [session, setCurrentItems, setRootFolderName, setFolderPath]);

  useEffect(() => {
    async function initializeFolderView() {
      if (status === 'authenticated' && session?.user?.email) {
        try {
          await fetchItems('initial', true);
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
        onFileClick={handleFileClick}
        rootDriveId={rootDriveId}
        isLoading={isFetching}
      />
      <PreviewModal />
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