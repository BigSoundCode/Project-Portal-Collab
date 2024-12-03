'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import FolderContent from '@/app/ui/dashboard/FolderContent';
import Sidebar from '@/app/ui/dashboard/Sidebar';
import { FolderProvider, useFolderContext } from '@/app/contexts/FolderContext';
import { DriveItem } from '@/app/lib/definitions';
import PreviewModal from '@/app/ui/dashboard/PreviewModal';
import { useRef } from 'react';
import Loading from '@/app/dashboard/(overview)/loading';



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
  const [currentPreviewItem, setCurrentPreviewItem] = useState<DriveItem | null>(null);
  const [folderImages, setFolderImages] = useState<DriveItem[]>([]);
  
  const pdfUrlRef = useRef<string | null>(null);
  
  
  const { 
    setCurrentItems,
    currentItems,
    setRootFolderName,
    setFolderPath,
    currentFolderId,     // Add this
    setCurrentFolderId,
    rootFolderName       // Add this
  } = useFolderContext();

  

  const getUserFolderId = async (email: string): Promise<string> => {
    const response = await fetch(`/api/getUserFolderId?email=${encodeURIComponent(email)}`);
    if (!response.ok) {
      throw new Error('Failed to fetch user folder ID');
    }
    const data = await response.json();
    return data.onedrive_folder_id;
  };

  const handleNext = () => {
    if (!currentPreviewItem) return;
    const currentIndex = folderImages.findIndex(item => item.id === currentPreviewItem.id);
    if (currentIndex < folderImages.length - 1) {
      setCurrentPreviewItem(folderImages[currentIndex + 1]);
    }
  };
  
  const handlePrevious = () => {
    if (!currentPreviewItem) return;
    const currentIndex = folderImages.findIndex(item => item.id === currentPreviewItem.id);
    if (currentIndex > 0) {
      setCurrentPreviewItem(folderImages[currentIndex - 1]);
    }
  };

  const handleDownload = async (fileId: string, fileName: string) => {
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

      const response = await fetch(fileInfo['@microsoft.graph.downloadUrl']);
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
    } catch (error) {
      console.error('Error downloading file:', error);
      setError('Failed to download file. Please try again.');
    }
  };

  // Inside DashboardContent component, before fetchItems
const fetchFolderContents = async (folderId: string, folderName: string) => {
  const encodedFolderId = encodeURIComponent(folderId);
  const apiUrl = `/api/onedrive/folder/${encodedFolderId}`;
  
  const response = await fetch(apiUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch folder contents: ${response.status}`);
  }

  const data = await response.json();
  
  // Track files in this folder
  for (const item of data.children || []) {
    if (!item.folder) {  // If it's a file, not a folder
      await trackFileActivity({
        folder_id: folderId,
        folder_name: folderName,
        file_id: item.id,
        file_name: item.name,
        action_type: 'added',
        created_at: item.createdDateTime
      });
    }
  }

  // Return the items for further processing
  return data.children || [];
};

const trackFileActivity = async (activity: {
  folder_id: string;
  folder_name: string;
  file_id: string;
  file_name: string;
  action_type: string;
  created_at: string;
}) => {
  try {
    const response = await fetch('/api/fileActivity', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(activity)
    });
    const result = await response.json();
  } catch (error) {
  }
};



const fetchItems = useCallback(async (folderId: string, isInitialLoad: boolean = false) => {
  if (!isInitialLoad) {
    setCurrentFolderId(folderId);
  }

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
    

    let folderName = data.name;
    
    if (isInitialLoad) {
      const driveId = data.parentReference?.driveId;
      if (driveId) {
        const firstChildUrl = data.children[0]?.webUrl || '';
        const folderNameMatch = firstChildUrl.match(/Documents\/(.*?)\//);
        folderName = folderNameMatch ? decodeURIComponent(folderNameMatch[1]) : 'Root Folder';
        
        setRootDriveId(driveId);
        setRootFolderName(folderName);
        setFolderPath([{
          id: folderIdToUse,
          name: folderName,
          driveId: driveId
        }]);
      }
    } else {
      const newFolder = {
        id: folderIdToUse,
        name: folderName,
        driveId: rootDriveId || ''
      };
      setFolderPath(prevPath => [...prevPath, newFolder]);
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
      
      // Check contents of each folder
      console.log('Checking root folders for contents...');
      for (const folder of folders) {
        console.log(`Checking contents of folder: ${folder.name}`);
        const folderContents = await fetchFolderContents(folder.id, folder.name);
        console.log(`Found ${folderContents.length} items in ${folder.name}`);
      }
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
}, [session, setCurrentItems, setRootFolderName, setFolderPath, rootDriveId, setCurrentFolderId]);

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

    if (fileType === 'image') {
      setCurrentPreviewItem(item);
      setIsPreviewOpen(true);
    } else if (fileType === 'pdf') {
      // Simple anchor tag approach
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
      }, 0);
      return false; // Prevent any default behavior
    } else {
      handleDownload(fileId, fileName);
    }
  } catch (error) {
    console.error('Error handling file:', error);
    setError(error instanceof Error ? error.message : 'Failed to handle file. Please try again.');
  }
}, [session?.accessToken, rootDriveId, handleDownload]);

  

  // First useEffect for initialization
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

// Second useEffect for beforeUnload
useEffect(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (isPreviewOpen) {
      e.preventDefault();
      return;
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [isPreviewOpen]);

// Third useEffect for currentFolderId
useEffect(() => {
  if (currentFolderId && currentFolderId !== 'initial') {
    fetchItems(currentFolderId);
  }
}, [currentFolderId, fetchItems]);

// Fourth useEffect for folderImages
useEffect(() => {
  const images = currentItems.filter(item => getFileType(item) === 'image');
  setFolderImages(images);
}, [currentItems, currentFolderId, getFileType]);

  

  if (status === 'loading' || isInitializing) {
    return <div><Loading/></div>;
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
        onDownload={handleDownload}
        rootDriveId={rootDriveId}
        isLoading={isFetching}
      />
      <PreviewModal 
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        currentItem={currentPreviewItem}
        folderImages={folderImages}
        onDownload={handleDownload}
        onNext={handleNext}
        onPrevious={handlePrevious}
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