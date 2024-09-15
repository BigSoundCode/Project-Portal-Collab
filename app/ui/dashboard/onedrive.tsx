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

interface File {
  id: string;
  name: string;
  webUrl: string;
}

const OneDrive: React.FC = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    accessToken: null,
    error: null,
  });
  const [files, setFiles] = useState<File[]>([]);
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

  const fetchFiles = useCallback(async (accessToken: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('https://graph.microsoft.com/v1.0/me/drive/root/children', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch files: ${await response.text()}`);
      }

      const data = await response.json();
      setFiles(data.value);
    } catch (error) {
      setAuthState(prev => ({ ...prev, error: 'Failed to fetch files' }));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleAuthentication = useCallback(async () => {
    const code = searchParams.get('code');
    const codeVerifier = localStorage.getItem('code_verifier');

    if (code && codeVerifier) {
      try {
        setIsLoading(true);
        const accessToken = await exchangeCodeForToken(code, codeVerifier);
        localStorage.setItem('access_token', accessToken);
        setAuthState({ isAuthenticated: true, accessToken, error: null });
        await fetchFiles(accessToken);
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
        fetchFiles(storedToken);
      } else {
        setIsLoading(false);
      }
    }
  }, [searchParams, exchangeCodeForToken, fetchFiles]);

  useEffect(() => {
    handleAuthentication();
  }, [handleAuthentication]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    setAuthState({ isAuthenticated: false, accessToken: null, error: null });
    setFiles([]);
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
          <h2>OneDrive Files</h2>
          <button onClick={handleLogout}>Logout</button>
          {files.length === 0 ? (
            <p>No files found in your OneDrive root.</p>
          ) : (
            <ul>
              {files.map((file) => (
                <li key={file.id}>
                  <a 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      downloadFile(file.id, file.name);
                    }}
                  >
                    {file.name}
                  </a>
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