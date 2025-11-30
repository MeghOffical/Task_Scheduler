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
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordChangeStatus, setPasswordChangeStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [passwordChangeMessage, setPasswordChangeMessage] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
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

  const openPasswordModal = () => {
    setPasswordChangeStatus('idle');
    setPasswordChangeMessage('');
    setShowPasswordModal(true);
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setPasswordChangeStatus('idle');
    setPasswordChangeMessage('');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleInputChange = (field: keyof PomodoroSettings, value: string) => {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue)) return;

    setSettings(prev => ({
      ...prev,
      [field]: numValue
    }));
  };

  const incrementValue = (field: keyof PomodoroSettings) => {
    const maxValues = {
      workDuration: 60,
      shortBreakDuration: 30,
      longBreakDuration: 45,
      longBreakInterval: 10
    };
    
    setSettings(prev => ({
      ...prev,
      [field]: Math.min(prev[field] + 1, maxValues[field])
    }));
  };

  const decrementValue = (field: keyof PomodoroSettings) => {
    setSettings(prev => ({
      ...prev,
      [field]: Math.max(prev[field] - 1, 1)
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

  const handlePasswordChange = async () => {
    if (!user) return;

    setPasswordChangeMessage('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordChangeStatus('error');
      setPasswordChangeMessage('Please fill in all password fields.');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordChangeStatus('error');
      setPasswordChangeMessage('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordChangeStatus('error');
      setPasswordChangeMessage('New passwords do not match.');
      return;
    }

    setPasswordChangeStatus('loading');

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update password');
      }

      setPasswordChangeStatus('success');
      setPasswordChangeMessage(data.message || 'Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setPasswordChangeStatus('error');
      setPasswordChangeMessage(
        error instanceof Error ? error.message : 'Failed to update password'
      );
    }
  };

  return (
      <div className='space-y-8'>
      {/* User Profile Section */}
      <section className='glass-panel rounded-lg p-6'>
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
        <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-base font-medium text-gray-900 dark:text-gray-100">Password</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Keep your account secure by updating your password regularly.</p>
            </div>
            <button
              type="button"
              onClick={openPasswordModal}
              className="self-start md:self-auto px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-sm"
            >
              Reset
            </button>
          </div>
        </div>
      </section>

      {/* Pomodoro Settings Section */}
      <section className='glass-panel rounded-lg p-6'>
        <h2 className='text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6'>Pomodoro Timer Settings</h2>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
              Work Duration (minutes)
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => decrementValue('workDuration')}
                className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-label="Decrease work duration"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <input
                type='number'
                min='1'
                max='60'
                value={settings.workDuration}
                readOnly
                className='flex-1 text-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 cursor-default'
              />
              <button
                type="button"
                onClick={() => incrementValue('workDuration')}
                className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-label="Increase work duration"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
              Short Break Duration (minutes)
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => decrementValue('shortBreakDuration')}
                className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-label="Decrease short break duration"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <input
                type='number'
                min='1'
                max='30'
                value={settings.shortBreakDuration}
                readOnly
                className='flex-1 text-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 cursor-default'
              />
              <button
                type="button"
                onClick={() => incrementValue('shortBreakDuration')}
                className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-label="Increase short break duration"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
              Long Break Duration (minutes)
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => decrementValue('longBreakDuration')}
                className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-label="Decrease long break duration"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <input
                type='number'
                min='1'
                max='45'
                value={settings.longBreakDuration}
                readOnly
                className='flex-1 text-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 cursor-default'
              />
              <button
                type="button"
                onClick={() => incrementValue('longBreakDuration')}
                className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-label="Increase long break duration"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
              Sessions Before Long Break
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => decrementValue('longBreakInterval')}
                className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-label="Decrease sessions before long break"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <input
                type='number'
                min='1'
                max='10'
                value={settings.longBreakInterval}
                readOnly
                className='flex-1 text-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 cursor-default'
              />
              <button
                type="button"
                onClick={() => incrementValue('longBreakInterval')}
                className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-label="Increase sessions before long break"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
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

      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 bg-black/60 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-lg p-6 relative">
            <button
              type="button"
              onClick={closePasswordModal}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              aria-label="Close password modal"
            >
              ✕
            </button>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Update password</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Enter your current password and choose a new one with at least 8 characters.
            </p>
            <div className="space-y-4">
              <div>
                <label className='text-sm font-medium text-gray-700 dark:text-gray-300'>Current password</label>
                <input
                  type='password'
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className='mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                  placeholder='Enter current password'
                />
              </div>
              <div>
                <label className='text-sm font-medium text-gray-700 dark:text-gray-300'>New password</label>
                <input
                  type='password'
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className='mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                  placeholder='At least 8 characters'
                />
              </div>
              <div>
                <label className='text-sm font-medium text-gray-700 dark:text-gray-300'>Confirm new password</label>
                <input
                  type='password'
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className='mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                  placeholder='Re-enter new password'
                />
              </div>
              {(passwordChangeStatus === 'success' || passwordChangeStatus === 'error') && (
                <p className={`text-sm ${passwordChangeStatus === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {passwordChangeMessage}
                </p>
              )}
              <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant='outline'
                  className='w-full sm:w-auto'
                  onClick={closePasswordModal}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className='w-full sm:w-auto bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                  isLoading={passwordChangeStatus === 'loading'}
                  loadingText='Updating...'
                  onClick={handlePasswordChange}
                >
                  Update password
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}