'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/button';

interface PomodoroSettings {
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  longBreakInterval: number;
}

interface User {
  id: string;
  username: string;
  email: string;
}

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  
  const [settings, setSettings] = useState<PomodoroSettings>({
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    longBreakInterval: 4
  });
  
  const [editUsername, setEditUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/user/me');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        if (!response.ok) throw new Error('Failed to fetch settings');
        const data = await response.json();
        setSettings(data.pomodoroSettings);
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };

    if (user) {
      fetchSettings();
    }
  }, [user]);

  if (loading) {
    return (
      <div className='flex items-center justify-center h-full'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500'></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    setUsernameError('');

    try {
      const updateData: any = { pomodoroSettings: settings };
      
      // If we're editing the username and it's not empty, include it in the update
      if (editUsername && newUsername.trim() !== '') {
        updateData.username = newUsername.trim();
      }
      
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.error === 'Username already taken') {
          setUsernameError('This username is already taken');
        }
        throw new Error('Failed to save settings');
      }
      
      // If we updated the username, update the user state and reset the edit mode
      if (editUsername && newUsername.trim() !== '') {
        setUser(prev => prev ? { ...prev, username: newUsername.trim() } : null);
        setEditUsername(false);
      }

      if (!response.ok) throw new Error('Failed to save settings');
      setSaveStatus('success');

      // Emit a custom event that the pomodoro page can listen to
      const event = new CustomEvent('pomodoroSettingsChanged', { 
        detail: settings 
      });
      window.dispatchEvent(event);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof PomodoroSettings, value: string) => {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue)) return;

    setSettings(prev => ({
      ...prev,
      [field]: numValue
    }));
  };
  
  const handleUsernameEdit = () => {
    setNewUsername(user?.username || '');
    setEditUsername(true);
    setUsernameError('');
  };
  
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewUsername(e.target.value);
    if (usernameError) setUsernameError('');
  };
  
  const cancelUsernameEdit = () => {
    setEditUsername(false);
    setUsernameError('');
  };

  return (
      <div className='space-y-8'>
      {/* User Profile Section */}
      <section className='bg-white dark:bg-gray-800 shadow rounded-lg p-6'>
        <h2 className='text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6'>Profile Information</h2>
        <div className='space-y-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>Name</label>
            <div className="relative group">
              <div className="flex items-center gap-2">
                {editUsername ? (
                  <>
                    <input
                      type="text"
                      value={newUsername}
                      onChange={handleUsernameChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                    <button
                      onClick={handleSave}
                      className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 text-sm"
                      disabled={isSaving}
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelUsernameEdit}
                      className="px-3 py-1 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 text-sm"
                      disabled={isSaving}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 px-3 py-2">
                      {user.username}
                    </span>
                    <button
                      onClick={handleUsernameEdit}
                      className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-sm"
                      type="button"
                    >
                      Edit
                    </button>
                  </>
                )}
              </div>
              {usernameError && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {usernameError}
                </p>
              )}
            </div>
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>Email</label>
            <div className="relative group">
              <input
                type='email'
                value={user.email}
                readOnly
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 cursor-not-allowed group-hover:border-red-500"
              />
              <p className="mt-1 text-sm text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                Email cannot be changed
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pomodoro Settings Section */}
      <section className='bg-white dark:bg-gray-800 shadow rounded-lg p-6'>
        <h2 className='text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6'>Pomodoro Timer Settings</h2>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
              Work Duration (minutes)
            </label>
            <input
              type='number'
              min='1'
              max='60'
              value={settings.workDuration}
              onChange={(e) => handleInputChange('workDuration', e.target.value)}
              className='mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
              Short Break Duration (minutes)
            </label>
            <input
              type='number'
              min='1'
              max='30'
              value={settings.shortBreakDuration}
              onChange={(e) => handleInputChange('shortBreakDuration', e.target.value)}
              className='mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
              Long Break Duration (minutes)
            </label>
            <input
              type='number'
              min='1'
              max='45'
              value={settings.longBreakDuration}
              onChange={(e) => handleInputChange('longBreakDuration', e.target.value)}
              className='mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
              Sessions Before Long Break
            </label>
            <input
              type='number'
              min='1'
              max='10'
              value={settings.longBreakInterval}
              onChange={(e) => handleInputChange('longBreakInterval', e.target.value)}
              className='mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
            />
          </div>
        </div>

        {/* Save Button and Status */}
        <div className='mt-6'>
          <Button
            onClick={handleSave}
            isLoading={isSaving}
            loadingText='Saving...'
            className='w-full sm:w-auto'
          >
            Save Changes
          </Button>
          
          {saveStatus === 'success' && (
            <p className='mt-2 text-sm text-green-600 dark:text-green-400'>Settings saved successfully!</p>
          )}
          {saveStatus === 'error' && (
            <p className='mt-2 text-sm text-red-600 dark:text-red-400'>Failed to save settings. Please try again.</p>
          )}
        </div>
      </section>
    </div>
  );
}