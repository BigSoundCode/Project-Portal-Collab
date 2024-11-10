'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { fetchAllUsers, addUser, removeUser, updateUserOneDriveFolderId, verifyDatabaseConnection } from '@/app/lib/data';

interface User {
  id: string;
  name: string;
  email: string;
  onedrive_folder_id: string | null;
  folder_id_type?: 'direct' | 'share';
}

// Helper functions for handling folder IDs and share URLs
function isShareUrl(value: string): boolean {
  return value.includes('sharepoint.com/:f:/g/') || value.includes('1drv.ms/');
}

function getShareIdFromUrl(shareUrl: string): string {
  // Remove any trailing slashes and spaces
  const cleanUrl = shareUrl.trim().replace(/\/$/, '');
  
  // Convert the URL to base64
  const encodedUrl = Buffer.from(cleanUrl).toString('base64');
  
  // Create the format that Microsoft Graph API expects
  return `u!${encodedUrl.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}`;
}

function isValidFolderId(value: string): boolean {
  // Check if it's a share URL
  if (isShareUrl(value)) {
    return true;
  }
  
  // Check if it's a traditional folder ID
  const folderIdPattern = /^[A-Za-z0-9_]{32}$/;
  return folderIdPattern.test(value);
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [newUser, setNewUser] = useState({ name: '', email: '' });
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [folderId, setFolderId] = useState('');
  const [dbConnected, setDbConnected] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkDbAndLoadUsers() {
      if (status === 'loading') return;
      
      if (!session) {
        setError('No session available. Please log in.');
        setLoading(false);
        return;
      }

      if (!session.isAdmin) {
        setError('Access Denied. You must be an admin to view this page.');
        setLoading(false);
        return;
      }

      try {
        const isConnected = await verifyDatabaseConnection();
        setDbConnected(isConnected);
        if (isConnected) {
          await loadUsers();
        } else {
          setError('Unable to connect to the database. Please check your configuration.');
        }
      } catch (err) {
        setError(`Error: ${err instanceof Error ? err.message : 'Unknown error occurred'}`);
      } finally {
        setLoading(false);
      }
    }
    checkDbAndLoadUsers();
  }, [session, status]);

  const loadUsers = async () => {
    try {
      const fetchedUsers = await fetchAllUsers();
      setUsers(fetchedUsers);
    } catch (err) {
      setError(`Failed to load users: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addUser(newUser.name, newUser.email);
      setNewUser({ name: '', email: '' });
      await loadUsers();
    } catch (err) {
      setError(`Failed to add user: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    try {
      await removeUser(userId);
      await loadUsers();
    } catch (err) {
      setError(`Failed to remove user: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleUpdateFolderId = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUser) {
      try {
        if (!isValidFolderId(folderId)) {
          setError('Invalid OneDrive folder ID or share URL. Please check and try again.');
          return;
        }

        // Convert share URL to proper format if necessary
        const finalFolderId = isShareUrl(folderId) ? getShareIdFromUrl(folderId) : folderId;
        
        await updateUserOneDriveFolderId(selectedUser.id, finalFolderId);
        setSelectedUser(null);
        setFolderId('');
        await loadUsers();
      } catch (err) {
        setError(`Failed to update folder ID: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }
  };

  if (status === 'loading' || loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (!session) {
    return <div className="p-4">Please log in to access this page.</div>;
  }

  if (!session.isAdmin) {
    return <div className="p-4">Access Denied. You must be an admin to view this page.</div>;
  }

  if (error) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p className="text-red-500">{error}</p>
        <p className="mt-4">
          Database connected: {dbConnected ? 'Yes' : 'No'}
        </p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <main className="p-6">
      <h1 className="mb-6 text-2xl text-yellow-100 font-bold">Admin Dashboard</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Add New User</h2>
          <form onSubmit={handleAddUser} className="space-y-4">
            <div>
              <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-700">Name</label>
              <input
                id="name"
                type="text"
                value={newUser.name}
                onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                className="w-full p-2 border rounded-md"
                required
              />
            </div>
            <div>
              <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-700">Email</label>
              <input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                className="w-full p-2 border rounded-md"
                required
              />
            </div>
            <button type="submit" className="w-full p-2 bg-blue-100 text-white rounded-md hover:bg-green-600">Add User</button>
          </form>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Update OneDrive Access</h2>
          <form onSubmit={handleUpdateFolderId} className="space-y-4">
            <div>
              <label htmlFor="user-select" className="block mb-2 text-sm font-medium text-gray-700">Select User</label>
              <select
                id="user-select"
                value={selectedUser ? selectedUser.id : ''}
                onChange={(e) => setSelectedUser(users.find(user => user.id === e.target.value) || null)}
                className="w-full p-2 border rounded-md"
              >
                <option value="">Select a user</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="folder-id" className="block mb-2 text-sm font-medium text-gray-700">
                OneDrive Folder ID or Share URL
              </label>
              <input
                id="folder-id"
                type="text"
                placeholder="Enter folder ID or SharePoint sharing URL"
                value={folderId}
                onChange={(e) => setFolderId(e.target.value)}
                className="w-full p-2 border rounded-md"
              />
              <p className="mt-1 text-sm text-gray-500">
                You can enter either a folder ID or a SharePoint sharing URL
              </p>
            </div>
            <button type="submit" className="w-full p-2 bg-blue-100 text-white rounded-md hover:bg-blue-600">
              Update Folder Access
            </button>
          </form>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm col-span-2">
          <h2 className="mb-4 text-xl font-semibold">User List</h2>
          <button onClick={loadUsers} className="mb-4 p-2 bg-gray-500 text-white rounded-md hover:bg-gray-600">
            Refresh Users
          </button>
          <ul className="space-y-2">
            {users.map(user => (
              <li key={user.id} className="p-2 bg-gray-100 rounded-md flex justify-between items-center">
                <div>
                  <strong>{user.name}</strong> ({user.email})
                  <br />
                  {user.onedrive_folder_id ? (
                    <span className="text-sm">
                      Folder Access: {isShareUrl(user.onedrive_folder_id) ? 'Shared Link' : 'Direct ID'}
                      <br />
                      ID: {user.onedrive_folder_id}
                    </span>
                  ) : (
                    'Folder Access: Not set'
                  )}
                </div>
                <div>
                  <button
                    onClick={() => handleRemoveUser(user.id)}
                    className="p-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                  >
                    Remove User
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}