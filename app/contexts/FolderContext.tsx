'use client';

import React, { createContext, useContext, useState, useCallback, Dispatch, SetStateAction } from 'react';
import { DriveItem, FolderReference } from '@/app/lib/definitions';

interface FolderContextType {
  currentItems: DriveItem[];
  currentFolderId: string | null;
  folderPath: FolderReference[];
  rootFolderName: string;
  setCurrentItems: Dispatch<SetStateAction<DriveItem[]>>;
  setCurrentFolderId: Dispatch<SetStateAction<string | null>>;
  setFolderPath: Dispatch<SetStateAction<FolderReference[]>>;
  setRootFolderName: Dispatch<SetStateAction<string>>;
}

const FolderContext = createContext<FolderContextType | null>(null);

export const useFolderContext = () => {
  const context = useContext(FolderContext);
  if (!context) {
    throw new Error('useFolderContext must be used within a FolderProvider');
  }
  return context;
};

export function FolderProvider({ children }: { children: React.ReactNode }) {
  const [currentItems, setCurrentItems] = useState<DriveItem[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<FolderReference[]>([]);
  const [rootFolderName, setRootFolderName] = useState<string>('');

  const value = {
    currentItems,
    currentFolderId,
    folderPath,
    rootFolderName,
    setCurrentItems,
    setCurrentFolderId,
    setFolderPath,
    setRootFolderName,
  };

  return (
    <FolderContext.Provider value={value}>
      {children}
    </FolderContext.Provider>
  );
}