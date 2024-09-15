'use client'

import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';

const CLIENT_ID = '459867de-d646-4804-86dd-af9095ed5fdf';
const REDIRECT_URI = 'http://localhost:3000/dashboard';
const AUTH_ENDPOINT = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';
const SCOPE = 'files.readwrite offline_access';

interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  error: string | null;
}

interface DriveItem {
  id: string;
  name: string;
  folder?: { childCount: number };
  file?: { mimeType: string };
}

const OneDrive: React.FC = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    accessToken: null,
    error: null,
  });
  const [items, setItems] = useState<DriveItem[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  const searchParams = useSearchParams();

  const generateCodeVerifier = () => {
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    return btoa(String.fromCharCode.apply(null, array))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
      .substr(0, 128);
  };

  const generateCodeChallenge = async (codeVerifier: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode.apply(null, new Uint8Array(digest)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  };

  const initiateAuth = useCallback(async () => {
    const codeVerifier = generateCodeVerifier();
    localStorage.setItem('code_verifier', codeVerifier);
    
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const authUrl = `${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPE)}&code_challenge=${codeChallenge}&code_challenge_method=S256`;
    
    window.location.href = authUrl;
  }, []);

  const exchangeCodeForToken = useCallback(async (code: string, codeVerifier: string) => {
    const response = await fetch('/api/token-exchange', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code, codeVerifier }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Failed to exchange code for token: ${JSON.stringify(data)}`);
    }

    return data.accessToken;
  }, []);

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
        throw new Error(`Failed to fetch items: ${await response.text()}`);
      }

      const data = await response.json();
      setItems(data.value);
      setCurrentFolderId(folderId);
    } catch (error) {
      setAuthState(prev => ({ ...prev, error: 'Failed to fetch items' }));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleFolderClick = useCallback((folderId: string, folderName: string) => {
    setFolderPath(prev => [...prev, { id: folderId, name: folderName }]);
    fetchItems(authState.accessToken!, folderId);
  }, [authState.accessToken, fetchItems]);

  const handleBackClick = useCallback(() => {
    if (folderPath.length > 0) {
      const newPath = [...folderPath];
      newPath.pop();
      setFolderPath(newPath);
      const parentFolderId = newPath.length > 0 ? newPath[newPath.length - 1].id : null;
      fetchItems(authState.accessToken!, parentFolderId);
    }
  }, [authState.accessToken, fetchItems, folderPath]);

  const handleAuthentication = useCallback(async () => {
    const code = searchParams.get('code');
    const codeVerifier = localStorage.getItem('code_verifier');

    if (code && codeVerifier) {
      try {
        setIsLoading(true);
        const accessToken = await exchangeCodeForToken(code, codeVerifier);
        localStorage.setItem('access_token', accessToken);
        setAuthState({ isAuthenticated: true, accessToken, error: null });
        await fetchItems(accessToken);
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (error) {
        setAuthState({ isAuthenticated: false, accessToken: null, error: error.message });
      } finally {
        setIsLoading(false);
        localStorage.removeItem('code_verifier');
      }
    } else {
      const storedToken = localStorage.getItem('access_token');
      if (storedToken) {
        setAuthState({ isAuthenticated: true, accessToken: storedToken, error: null });
        fetchItems(storedToken);
      } else {
        setIsLoading(false);
      }
    }
  }, [searchParams, exchangeCodeForToken, fetchItems]);

  useEffect(() => {
    handleAuthentication();
  }, [handleAuthentication]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    setAuthState({ isAuthenticated: false, accessToken: null, error: null });
    setItems([]);
    setFolderPath([]);
    setCurrentFolderId(null);
  };

  const downloadFile = async (fileId: string, fileName: string) => {
    if (!authState.accessToken) return;

    try {
      const response = await fetch(`/api/download-file?fileId=${fileId}`, {
        headers: {
          'Authorization': `Bearer ${authState.accessToken}`
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

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>OneDrive Integration</h1>
      {authState.error && (
        <div>
          <p>Error: {authState.error}</p>
          <button onClick={initiateAuth}>Try Again</button>
        </div>
      )}
      {!authState.isAuthenticated ? (
        <button onClick={initiateAuth}>Login with OneDrive</button>
      ) : (
        <div>
          <h2>OneDrive Items</h2>
          <button onClick={handleLogout}>Logout</button>
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
      )}
    </div>
  );
};

export default OneDrive;