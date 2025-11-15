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

interface UsernameUpdateForm {
  newUsername: string;
}

interface PasswordUpdateForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface FormError {
  field: string;
  message: string;
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
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Username update state
  const [usernameForm, setUsernameForm] = useState<UsernameUpdateForm>({
    newUsername: ''
  });
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Password update state
  const [passwordForm, setPasswordForm] = useState<PasswordUpdateForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [passwordErrors, setPasswordErrors] = useState<FormError[]>([]);

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

    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pomodoroSettings: settings }),
      });

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

  const validatePasswordForm = (): boolean => {
    const errors: FormError[] = [];

    if (!passwordForm.currentPassword.trim()) {
      errors.push({ field: 'currentPassword', message: 'Current password is required' });
    }

    if (!passwordForm.newPassword.trim()) {
      errors.push({ field: 'newPassword', message: 'New password is required' });
    } else if (passwordForm.newPassword.length < 8) {
      errors.push({ field: 'newPassword', message: 'New password must be at least 8 characters' });
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.push({ field: 'confirmPassword', message: 'Passwords do not match' });
    }

    setPasswordErrors(errors);
    return errors.length === 0;
  };

  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameForm.newUsername.trim()) {
      setUsernameStatus({ type: 'error', message: 'Username cannot be empty' });
      return;
    }

    setUsernameLoading(true);
    setUsernameStatus(null);

    try {
      const response = await fetch('/api/account/update-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newUsername: usernameForm.newUsername })
      });

      const data = await response.json();

      if (!response.ok) {
        setUsernameStatus({ type: 'error', message: data.message || 'Failed to update username' });
        return;
      }

      setUsernameStatus({ type: 'success', message: 'Username updated successfully!' });
      setUser(prev => prev ? { ...prev, username: usernameForm.newUsername } : null);
      setUsernameForm({ newUsername: '' });
    } catch (error) {
      setUsernameStatus({ type: 'error', message: 'An error occurred while updating username' });
    } finally {
      setUsernameLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePasswordForm()) return;

    setPasswordLoading(true);
    setPasswordStatus(null);

    try {
      const response = await fetch('/api/account/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setPasswordStatus({ type: 'error', message: data.message || 'Failed to update password' });
        return;
      }

      setPasswordStatus({ type: 'success', message: 'Password updated successfully!' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordErrors([]);
    } catch (error) {
      setPasswordStatus({ type: 'error', message: 'An error occurred while updating password' });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
      <div className='space-y-8'>
      {/* User Profile Section */}
      <section className='bg-white dark:bg-gray-800 shadow rounded-lg p-6'>
        <h2 className='text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6'>Account Information</h2>
        <div className='space-y-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>Username</label>
            <input
              type='text'
              value={user?.username || ''}
              readOnly
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 cursor-not-allowed"
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>Email</label>
            <input
              type='email'
              value={user?.email || ''}
              readOnly
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 cursor-not-allowed"
            />
          </div>
        </div>
      </section>

      {/* Update Username Section */}
      <section className='bg-white dark:bg-gray-800 shadow rounded-lg p-6'>
        <h2 className='text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6'>Change Username</h2>
        <form onSubmit={handleUpdateUsername} className='space-y-4'>
          <div>
            <label htmlFor='newUsername' className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
              New Username
            </label>
            <input
              id='newUsername'
              type='text'
              value={usernameForm.newUsername}
              onChange={(e) => setUsernameForm({ newUsername: e.target.value })}
              placeholder='Enter new username'
              className='mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
              disabled={usernameLoading}
            />
          </div>

          <Button
            type='submit'
            isLoading={usernameLoading}
            loadingText='Updating...'
            className='w-full sm:w-auto'
          >
            Update Username
          </Button>

          {usernameStatus && (
            <p className={`text-sm ${usernameStatus.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {usernameStatus.message}
            </p>
          )}
        </form>
      </section>

      {/* Update Password Section */}
      <section className='bg-white dark:bg-gray-800 shadow rounded-lg p-6'>
        <h2 className='text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6'>Change Password</h2>
        <form onSubmit={handleUpdatePassword} className='space-y-4'>
          <div>
            <label htmlFor='currentPassword' className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
              Current Password
            </label>
            <input
              id='currentPassword'
              type='password'
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              placeholder='Enter current password'
              className='mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
              disabled={passwordLoading}
            />
            {passwordErrors.find(e => e.field === 'currentPassword') && (
              <p className='mt-1 text-sm text-red-600 dark:text-red-400'>
                {passwordErrors.find(e => e.field === 'currentPassword')?.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor='newPassword' className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
              New Password (minimum 8 characters)
            </label>
            <input
              id='newPassword'
              type='password'
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              placeholder='Enter new password'
              className='mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
              disabled={passwordLoading}
            />
            {passwordErrors.find(e => e.field === 'newPassword') && (
              <p className='mt-1 text-sm text-red-600 dark:text-red-400'>
                {passwordErrors.find(e => e.field === 'newPassword')?.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor='confirmPassword' className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
              Confirm New Password
            </label>
            <input
              id='confirmPassword'
              type='password'
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              placeholder='Confirm new password'
              className='mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
              disabled={passwordLoading}
            />
            {passwordErrors.find(e => e.field === 'confirmPassword') && (
              <p className='mt-1 text-sm text-red-600 dark:text-red-400'>
                {passwordErrors.find(e => e.field === 'confirmPassword')?.message}
              </p>
            )}
          </div>

          <Button
            type='submit'
            isLoading={passwordLoading}
            loadingText='Updating...'
            className='w-full sm:w-auto'
          >
            Update Password
          </Button>

          {passwordStatus && (
            <p className={`text-sm ${passwordStatus.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {passwordStatus.message}
            </p>
          )}
        </form>
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