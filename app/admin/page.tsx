'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';


import { createUser, resetUserPassword } from '@/app/lib/actions';
import { fetchAllUsers, removeUser, updateUserOneDriveFolderId, verifyDatabaseConnection } from '@/app/lib/data';

interface User {
  id: string;
  name: string;
  email: string;
  onedrive_folder_id: string | null;
  is_admin?: boolean;
}



// Helper functions for handling folder IDs and share URLs
function isShareUrl(value: string): boolean {
  return value.includes('sharepoint.com/:f:/g/') || value.includes('1drv.ms/');
}

function getShareIdFromUrl(shareUrl: string): string {
  // Remove any trailing slashes and spaces
  const cleanUrl = shareUrl.trim().replace(/\/$/, '');
  
  // Just store the full URL for SharePoint links
  return cleanUrl;
}

function isValidFolderId(value: string): boolean {
  // Check if it's a share URL
  if (isShareUrl(value)) {
    return true;
  }
  
  // Allow any non-empty string for folder IDs as they might vary
  return value.length > 0;
}

function generateRandomPassword(): string {
  // Generate a random password with letters, numbers, and special characters
  const length = 12;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [newUser, setNewUser] = useState({ 
    name: '', 
    email: '', 
    password: ''  // Initial password for new user
  });
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [folderId, setFolderId] = useState('');
  const [dbConnected, setDbConnected] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [resetPasswordUser, setResetPasswordUser] = useState<{
    id: string;
    name: string;
    newPassword: string;
  } | null>(null);

  useEffect(() => {
    async function checkDbAndLoadUsers() {
      if (status === 'loading') return;
      
      if (!session) {
        setError('No session available. Please log in.');
        setLoading(false);
        return;
      }

      if (!session.user?.isAdmin) {
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
      setError('');
    } catch (err) {
      setError(`Failed to load users: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Generate a random initial password if none provided
      const password = newUser.password || generateRandomPassword();
      
      const createdUser = await createUser(newUser.name, newUser.email, password);
      if (createdUser) {
        alert(`User created successfully!\nInitial password: ${password}\nPlease share this with the user securely.`);
        setNewUser({ name: '', email: '', password: '' });
        await loadUsers();
      }
    } catch (err) {
      setError(`Failed to add user: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to remove this user?')) {
      try {
        await removeUser(userId);
        await loadUsers();
        setError('');
      } catch (err) {
        setError(`Failed to remove user: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }
  };

  const handleResetPassword = async (userId: string, userName: string) => {
    const newPassword = generateRandomPassword();
    setResetPasswordUser({
      id: userId,
      name: userName,
      newPassword
    });
  };

  const confirmResetPassword = async () => {
    if (!resetPasswordUser) return;

    try {
      await resetUserPassword(resetPasswordUser.id, resetPasswordUser.newPassword);
      alert(`Password has been reset for ${resetPasswordUser.name}.\nNew password: ${resetPasswordUser.newPassword}\nPlease share this with the user securely.`);
      setResetPasswordUser(null);
      setError('');
    } catch (err) {
      setError(`Failed to reset password: ${err instanceof Error ? err.message : 'Unknown error'}`);
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

        const finalFolderId = isShareUrl(folderId) ? getShareIdFromUrl(folderId) : folderId;
        
        await updateUserOneDriveFolderId(selectedUser.id, finalFolderId);
        setSelectedUser(null);
        setFolderId('');
        await loadUsers();
        setError('');
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

  if (!session.user?.isAdmin) {
    return <div className="p-4">Access Denied. You must be an admin to view this page.</div>;
  }

  return (
    <main className="p-6">
      <h1 className="mb-6 text-2xl text-yellow-100 font-bold">Admin Dashboard</h1>
      
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
          {error}
          <button 
            onClick={() => setError('')}
            className="ml-4 text-sm underline"
          >
            Dismiss
          </button>
        </div>
      )}
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Add User Form */}
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
            <div>
              <label htmlFor="initial-password" className="block mb-2 text-sm font-medium text-gray-700">
                Initial Password (Optional)
              </label>
              <input
                id="initial-password"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                className="w-full p-2 border rounded-md"
                placeholder="Leave blank for random password"
                minLength={6}
              />
              <p className="mt-1 text-sm text-gray-500">
                If left blank, a secure random password will be generated
              </p>
            </div>
            <button type="submit" className="w-full p-2 bg-blue-100 text-white rounded-md hover:bg-blue-600">
              Add User
            </button>
          </form>
        </div>

        {/* Update OneDrive Access Form */}
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
            <button 
              type="submit" 
              className="w-full p-2 bg-blue-100 text-white rounded-md hover:bg-blue-600"
              disabled={!selectedUser}
            >
              Update Folder Access
            </button>
          </form>
        </div>

        {/* User List */}
        <div className="rounded-xl bg-white p-6 shadow-sm col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">User List</h2>
            <button 
              onClick={loadUsers} 
              className="p-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              Refresh Users
            </button>
          </div>
          <div className="overflow-hidden">
            <ul className="space-y-2">
              {users.map(user => (
                <li key={user.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{user.name}</h3>
                      <p className="text-gray-600">{user.email}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {user.onedrive_folder_id ? (
                          <>
                            Folder Access: {isShareUrl(user.onedrive_folder_id) ? 'Shared Link' : 'Direct ID'}
                            <br />
                            ID: {user.onedrive_folder_id}
                          </>
                        ) : (
                          'Folder Access: Not set'
                        )}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleResetPassword(user.id, user.name)}
                        className="p-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
                        title="Reset user's password"
                      >
                        Reset Password
                      </button>
                      <button
                        onClick={() => handleRemoveUser(user.id)}
                        className="p-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                        title="Remove user"
                      >
                        Remove User
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Password Reset Confirmation Modal */}
      {resetPasswordUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Reset Password Confirmation</h3>
            <p className="mb-4">
              Are you sure you want to reset the password for {resetPasswordUser.name}?
              <br /><br />
              New password will be: <strong className="font-mono">{resetPasswordUser.newPassword}</strong>
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setResetPasswordUser(null)}
                className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={confirmResetPassword}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}