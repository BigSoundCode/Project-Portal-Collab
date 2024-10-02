'use client';

import React, { useEffect, useState } from 'react';
import { fetchAllUsers, addUser, removeUser, updateUserOneDriveFolderId, verifyDatabaseConnection } from '@/app/lib/data';

interface User {
  id: string;
  name: string;
  email: string;
  onedrive_folder_id: string | null;
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [newUser, setNewUser] = useState({ name: '', email: '' });
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [folderId, setFolderId] = useState('');
  const [dbConnected, setDbConnected] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkDbAndLoadUsers() {
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
  }, []);

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
        await updateUserOneDriveFolderId(selectedUser.id, folderId);
        setSelectedUser(null);
        setFolderId('');
        await loadUsers();
      } catch (err) {
        setError(`Failed to update folder ID: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  if (!dbConnected) {
    return <div className="p-4">Error: Database connection failed. Please check your configuration.</div>;
  }

  return (
    <main className="p-6">
      <h1 className="mb-6 text-2xl font-bold">Admin Dashboard</h1>
      
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
            <button type="submit" className="w-full p-2 bg-green-500 text-white rounded-md hover:bg-green-600">Add User</button>
          </form>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Update OneDrive Folder ID</h2>
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
              <label htmlFor="folder-id" className="block mb-2 text-sm font-medium text-gray-700">OneDrive Folder ID</label>
              <input
                id="folder-id"
                type="text"
                placeholder="OneDrive Folder ID"
                value={folderId}
                onChange={(e) => setFolderId(e.target.value)}
                className="w-full p-2 border rounded-md"
              />
            </div>
            <button type="submit" className="w-full p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">Update Folder ID</button>
          </form>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm col-span-2">
          <h2 className="mb-4 text-xl font-semibold">User List</h2>
          <button onClick={loadUsers} className="mb-4 p-2 bg-gray-500 text-white rounded-md hover:bg-gray-600">Refresh Users</button>
          <ul className="space-y-2">
            {users.map(user => (
              <li key={user.id} className="p-2 bg-gray-100 rounded-md flex justify-between items-center">
                <div>
                  <strong>{user.name}</strong> ({user.email})
                  <br />
                  Folder ID: {user.onedrive_folder_id || 'Not set'}
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