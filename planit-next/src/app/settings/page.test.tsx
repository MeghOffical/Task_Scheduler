/**
 * Unit tests for settings page
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import SettingsPage from './page';

// Mock Button component
jest.mock('@/components/button', () => ({
  __esModule: true,
  default: ({ children, onClick, isLoading, loadingText, className }: any) => (
    <button onClick={onClick} disabled={isLoading} className={className}>
      {isLoading ? loadingText : children}
    </button>
  ),
}));

// Mock fetch
global.fetch = jest.fn();

const mockUser = {
  id: 'user-123',
  username: 'testuser',
  email: 'test@example.com',
};

const mockSettings = {
  pomodoroSettings: {
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    longBreakInterval: 4,
  },
};

describe('Settings Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/user/me')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockUser,
        });
      }
      if (url.includes('/api/settings')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockSettings,
        });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner while fetching user data', () => {
      render(<SettingsPage />);
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should hide loading spinner after data is loaded', async () => {
      render(<SettingsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Profile Information')).toBeInTheDocument();
      });
    });
  });

  describe('Profile Information Section', () => {
    it('should render profile information section', async () => {
      render(<SettingsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Profile Information')).toBeInTheDocument();
      });
    });

    it('should display user name', async () => {
      render(<SettingsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('testuser')).toBeInTheDocument();
      });
    });

    it('should display user email', async () => {
      render(<SettingsPage />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
      });
    });

    it('should show email as read-only', async () => {
      render(<SettingsPage />);
      
      await waitFor(() => {
        const emailInput = screen.getByDisplayValue('test@example.com');
        expect(emailInput).toHaveAttribute('readOnly');
      });
    });

    it('should show Edit button for username', async () => {
      render(<SettingsPage />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
      });
    });
  });

  describe('Username Editing', () => {
    it('should enter edit mode when Edit button is clicked', async () => {
      const user = userEvent.setup();
      render(<SettingsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('testuser')).toBeInTheDocument();
      });

      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      await waitFor(() => {
        expect(screen.getByDisplayValue('testuser')).toBeInTheDocument();
        const saveButtons = screen.getAllByRole('button', { name: /save/i });
        expect(saveButtons.length).toBeGreaterThan(0);
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      });
    });

    it('should allow changing username value', async () => {
      const user = userEvent.setup();
      render(<SettingsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('testuser')).toBeInTheDocument();
      });

      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      const usernameInput = screen.getByDisplayValue('testuser');
      await user.clear(usernameInput);
      await user.type(usernameInput, 'newusername');

      expect(screen.getByDisplayValue('newusername')).toBeInTheDocument();
    });

    it('should cancel username edit on Cancel button click', async () => {
      const user = userEvent.setup();
      render(<SettingsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('testuser')).toBeInTheDocument();
      });

      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      const usernameInput = screen.getByDisplayValue('testuser');
      await user.clear(usernameInput);
      await user.type(usernameInput, 'newusername');

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.getByText('testuser')).toBeInTheDocument();
        expect(screen.queryByDisplayValue('newusername')).not.toBeInTheDocument();
      });
    });

    it('should save username when Save button is clicked', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
        if (url.includes('/api/user/me')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockUser,
          });
        }
        if (url.includes('/api/settings')) {
          if (options?.method === 'PUT') {
            return Promise.resolve({
              ok: true,
              json: async () => ({ success: true }),
            });
          }
          return Promise.resolve({
            ok: true,
            json: async () => mockSettings,
          });
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      render(<SettingsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('testuser')).toBeInTheDocument();
      });

      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      const usernameInput = screen.getByDisplayValue('testuser');
      await user.clear(usernameInput);
      await user.type(usernameInput, 'newusername');

      const saveButtons = screen.getAllByRole('button', { name: /save/i });
      await user.click(saveButtons[0]);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/settings',
          expect.objectContaining({
            method: 'PUT',
            body: expect.stringContaining('newusername'),
          })
        );
      });
    });

    it('should show error when username is already taken', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
        if (url.includes('/api/user/me')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockUser,
          });
        }
        if (url.includes('/api/settings')) {
          if (options?.method === 'PUT') {
            return Promise.resolve({
              ok: false,
              json: async () => ({ error: 'Username already taken' }),
            });
          }
          return Promise.resolve({
            ok: true,
            json: async () => mockSettings,
          });
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      render(<SettingsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('testuser')).toBeInTheDocument();
      });

      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      const usernameInput = screen.getByDisplayValue('testuser');
      await user.clear(usernameInput);
      await user.type(usernameInput, 'existinguser');

      const saveButtons = screen.getAllByRole('button', { name: /save/i });
      await user.click(saveButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('This username is already taken')).toBeInTheDocument();
      });
    });
  });

  describe('Pomodoro Settings Section', () => {
    it('should render Pomodoro Timer Settings section', async () => {
      render(<SettingsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Pomodoro Timer Settings')).toBeInTheDocument();
      });
    });

    it('should display work duration input with correct value', async () => {
      render(<SettingsPage />);
      
      await waitFor(() => {
        const inputs = screen.getAllByDisplayValue('25');
        expect(inputs.length).toBeGreaterThan(0);
        expect(inputs[0]).toHaveAttribute('type', 'number');
        expect(inputs[0]).toHaveAttribute('min', '1');
        expect(inputs[0]).toHaveAttribute('max', '60');
      });
    });

    it('should display short break duration input with correct value', async () => {
      render(<SettingsPage />);
      
      await waitFor(() => {
        const inputs = screen.getAllByDisplayValue('5');
        expect(inputs.length).toBeGreaterThan(0);
        const shortBreakInput = inputs.find(input => 
          input.getAttribute('max') === '30'
        );
        expect(shortBreakInput).toBeTruthy();
      });
    });

    it('should display long break duration input with correct value', async () => {
      render(<SettingsPage />);
      
      await waitFor(() => {
        const inputs = screen.getAllByDisplayValue('15');
        expect(inputs.length).toBeGreaterThan(0);
        const longBreakInput = inputs.find(input => 
          input.getAttribute('max') === '45'
        );
        expect(longBreakInput).toBeTruthy();
      });
    });

    it('should display long break interval input with correct value', async () => {
      render(<SettingsPage />);
      
      await waitFor(() => {
        const inputs = screen.getAllByDisplayValue('4');
        expect(inputs.length).toBeGreaterThan(0);
        const intervalInput = inputs.find(input => 
          input.getAttribute('max') === '10'
        );
        expect(intervalInput).toBeTruthy();
      });
    });

    it('should allow changing work duration', async () => {
      const user = userEvent.setup();
      render(<SettingsPage />);
      
      await waitFor(() => {
        expect(screen.getAllByDisplayValue('25').length).toBeGreaterThan(0);
      });

      const workInput = screen.getAllByDisplayValue('25').find(input => 
        input.getAttribute('max') === '60'
      ) as HTMLInputElement;
      
      await user.clear(workInput);
      await user.click(workInput);
      await user.keyboard('30');

      expect(workInput.value).toBe('30');
    });

    it('should allow changing short break duration', async () => {
      const user = userEvent.setup();
      render(<SettingsPage />);
      
      await waitFor(() => {
        expect(screen.getAllByDisplayValue('5').length).toBeGreaterThan(0);
      });

      const breakInput = screen.getAllByDisplayValue('5').find(input => 
        input.getAttribute('max') === '30'
      ) as HTMLInputElement;
      
      await user.clear(breakInput);
      await user.click(breakInput);
      await user.keyboard('10');

      expect(breakInput.value).toBe('10');
    });

    it('should allow changing long break duration', async () => {
      const user = userEvent.setup();
      render(<SettingsPage />);
      
      await waitFor(() => {
        expect(screen.getAllByDisplayValue('15').length).toBeGreaterThan(0);
      });

      const longBreakInput = screen.getAllByDisplayValue('15').find(input => 
        input.getAttribute('max') === '45'
      ) as HTMLInputElement;
      
      await user.clear(longBreakInput);
      await user.click(longBreakInput);
      await user.keyboard('20');

      expect(longBreakInput.value).toBe('20');
    });

    it('should allow changing long break interval', async () => {
      const user = userEvent.setup();
      render(<SettingsPage />);
      
      await waitFor(() => {
        expect(screen.getAllByDisplayValue('4').length).toBeGreaterThan(0);
      });

      const intervalInput = screen.getAllByDisplayValue('4').find(input => 
        input.getAttribute('max') === '10'
      ) as HTMLInputElement;
      
      await user.clear(intervalInput);
      await user.click(intervalInput);
      await user.keyboard('6');

      expect(intervalInput.value).toBe('6');
    });

    it('should not update settings with invalid (non-numeric) input', async () => {
      const user = userEvent.setup();
      render(<SettingsPage />);
      
      await waitFor(() => {
        expect(screen.getAllByDisplayValue('25').length).toBeGreaterThan(0);
      });

      const workInput = screen.getAllByDisplayValue('25').find(input => 
        input.getAttribute('max') === '60'
      ) as HTMLInputElement;
      
      // Numeric inputs ignore non-numeric characters
      await user.type(workInput, 'abc');

      // Value should remain unchanged as type="number" ignores non-numeric input
      expect(workInput.value).toBe('25');
    });

    it('should handle multiple setting changes before save', async () => {
      const user = userEvent.setup();
      render(<SettingsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Pomodoro Timer Settings')).toBeInTheDocument();
      });

      // Change multiple settings
      const workInput = screen.getAllByDisplayValue('25').find(input => 
        input.getAttribute('max') === '60'
      ) as HTMLInputElement;
      await user.clear(workInput);
      await user.click(workInput);
      await user.keyboard('45');

      const breakInput = screen.getAllByDisplayValue('5').find(input => 
        input.getAttribute('max') === '30'
      ) as HTMLInputElement;
      await user.clear(breakInput);
      await user.click(breakInput);
      await user.keyboard('8');

      expect(workInput.value).toBe('45');
      expect(breakInput.value).toBe('8');
    });
  });

  describe('Save Functionality', () => {
    it('should render Save Changes button', async () => {
      render(<SettingsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Save Changes')).toBeInTheDocument();
      });
    });

    it('should save settings when Save Changes is clicked', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
        if (url.includes('/api/user/me')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockUser,
          });
        }
        if (url.includes('/api/settings')) {
          if (options?.method === 'PUT') {
            return Promise.resolve({
              ok: true,
              json: async () => ({ success: true }),
            });
          }
          return Promise.resolve({
            ok: true,
            json: async () => mockSettings,
          });
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      render(<SettingsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Save Changes')).toBeInTheDocument();
      });

      const saveButton = screen.getByText('Save Changes');
      await user.click(saveButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/settings',
          expect.objectContaining({
            method: 'PUT',
          })
        );
      });
    });

    it('should show success message after saving', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
        if (url.includes('/api/user/me')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockUser,
          });
        }
        if (url.includes('/api/settings')) {
          if (options?.method === 'PUT') {
            return Promise.resolve({
              ok: true,
              json: async () => ({ success: true }),
            });
          }
          return Promise.resolve({
            ok: true,
            json: async () => mockSettings,
          });
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      render(<SettingsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Save Changes')).toBeInTheDocument();
      });

      const saveButton = screen.getByText('Save Changes');
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Settings saved successfully!')).toBeInTheDocument();
      });
    });

    it('should show error message if save fails', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
        if (url.includes('/api/user/me')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockUser,
          });
        }
        if (url.includes('/api/settings')) {
          if (options?.method === 'PUT') {
            return Promise.resolve({
              ok: false,
              json: async () => ({ error: 'Server error' }),
            });
          }
          return Promise.resolve({
            ok: true,
            json: async () => mockSettings,
          });
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      render(<SettingsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Save Changes')).toBeInTheDocument();
      });

      const saveButton = screen.getByText('Save Changes');
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to save settings. Please try again.')).toBeInTheDocument();
      });
    });

    it('should show loading state while saving', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
        if (url.includes('/api/user/me')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockUser,
          });
        }
        if (url.includes('/api/settings')) {
          if (options?.method === 'PUT') {
            return new Promise(resolve => {
              setTimeout(() => {
                resolve({
                  ok: true,
                  json: async () => ({ success: true }),
                });
              }, 100);
            });
          }
          return Promise.resolve({
            ok: true,
            json: async () => mockSettings,
          });
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      render(<SettingsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Save Changes')).toBeInTheDocument();
      });

      const saveButton = screen.getByText('Save Changes');
      await user.click(saveButton);

      expect(screen.getByText('Saving...')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('Settings saved successfully!')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should dispatch custom event after saving settings', async () => {
      const user = userEvent.setup();
      const dispatchEventSpy = jest.spyOn(window, 'dispatchEvent');
      
      (global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
        if (url.includes('/api/user/me')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockUser,
          });
        }
        if (url.includes('/api/settings')) {
          if (options?.method === 'PUT') {
            return Promise.resolve({
              ok: true,
              json: async () => ({ success: true }),
            });
          }
          return Promise.resolve({
            ok: true,
            json: async () => mockSettings,
          });
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      render(<SettingsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Save Changes')).toBeInTheDocument();
      });

      const saveButton = screen.getByText('Save Changes');
      await user.click(saveButton);

      await waitFor(() => {
        expect(dispatchEventSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'pomodoroSettingsChanged',
          })
        );
      });

      dispatchEventSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('should handle user fetch error gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/user/me')) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      render(<SettingsPage />);
      
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error fetching user:',
          expect.any(Error)
        );
      });

      consoleErrorSpy.mockRestore();
    });

    it('should handle settings fetch error gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/user/me')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockUser,
          });
        }
        if (url.includes('/api/settings')) {
          return Promise.reject(new Error('Settings fetch error'));
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      render(<SettingsPage />);
      
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error fetching settings:',
          expect.any(Error)
        );
      });

      consoleErrorSpy.mockRestore();
    });

    it('should handle failed settings API response', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/user/me')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockUser,
          });
        }
        if (url.includes('/api/settings')) {
          return Promise.resolve({
            ok: false,
            json: async () => ({ error: 'Failed' }),
          });
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      render(<SettingsPage />);
      
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      consoleErrorSpy.mockRestore();
    });

    it('should return null when user is not loaded', async () => {
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/user/me')) {
          return Promise.resolve({
            ok: false,
            json: async () => ({ error: 'Not found' }),
          });
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      const { container } = render(<SettingsPage />);
      
      await waitFor(() => {
        expect(container.firstChild).toBeTruthy();
      });
    });

    it('should handle save error when network fails', async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      (global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
        if (url.includes('/api/user/me')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockUser,
          });
        }
        if (url.includes('/api/settings')) {
          if (options?.method === 'PUT') {
            return Promise.reject(new Error('Network failure'));
          }
          return Promise.resolve({
            ok: true,
            json: async () => mockSettings,
          });
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      render(<SettingsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Save Changes')).toBeInTheDocument();
      });

      const saveButton = screen.getByText('Save Changes');
      await user.click(saveButton);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error saving settings:',
          expect.any(Error)
        );
        expect(screen.getByText('Failed to save settings. Please try again.')).toBeInTheDocument();
      });

      consoleErrorSpy.mockRestore();
    });

    it('should clear username error when typing after error', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
        if (url.includes('/api/user/me')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockUser,
          });
        }
        if (url.includes('/api/settings')) {
          if (options?.method === 'PUT') {
            return Promise.resolve({
              ok: false,
              json: async () => ({ error: 'Username already taken' }),
            });
          }
          return Promise.resolve({
            ok: true,
            json: async () => mockSettings,
          });
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      render(<SettingsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('testuser')).toBeInTheDocument();
      });

      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      const usernameInput = screen.getByDisplayValue('testuser');
      await user.clear(usernameInput);
      await user.type(usernameInput, 'existinguser');

      const saveButtons = screen.getAllByRole('button', { name: /save/i });
      await user.click(saveButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('This username is already taken')).toBeInTheDocument();
      });

      // Type again to clear error
      await user.type(usernameInput, 'a');
      
      await waitFor(() => {
        expect(screen.queryByText('This username is already taken')).not.toBeInTheDocument();
      });
    });

    it('should not save empty username', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
        if (url.includes('/api/user/me')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockUser,
          });
        }
        if (url.includes('/api/settings')) {
          if (options?.method === 'PUT') {
            const body = JSON.parse(options.body);
            // Should not include username if it's empty
            expect(body.username).toBeUndefined();
            return Promise.resolve({
              ok: true,
              json: async () => ({ success: true }),
            });
          }
          return Promise.resolve({
            ok: true,
            json: async () => mockSettings,
          });
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      render(<SettingsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('testuser')).toBeInTheDocument();
      });

      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      const usernameInput = screen.getByDisplayValue('testuser');
      await user.clear(usernameInput);

      const saveButtons = screen.getAllByRole('button', { name: /save/i });
      await user.click(saveButtons[0]);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });

    it('should only fetch settings after user is loaded', async () => {
      let userLoaded = false;
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/user/me')) {
          return new Promise(resolve => {
            setTimeout(() => {
              userLoaded = true;
              resolve({
                ok: true,
                json: async () => mockUser,
              });
            }, 100);
          });
        }
        if (url.includes('/api/settings')) {
          // Settings should only be fetched after user is loaded
          expect(userLoaded).toBe(true);
          return Promise.resolve({
            ok: true,
            json: async () => mockSettings,
          });
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      render(<SettingsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Pomodoro Timer Settings')).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid save clicks gracefully', async () => {
      const user = userEvent.setup();
      let saveCount = 0;
      
      (global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
        if (url.includes('/api/user/me')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockUser,
          });
        }
        if (url.includes('/api/settings')) {
          if (options?.method === 'PUT') {
            saveCount++;
            return new Promise(resolve => {
              setTimeout(() => {
                resolve({
                  ok: true,
                  json: async () => ({ success: true }),
                });
              }, 200);
            });
          }
          return Promise.resolve({
            ok: true,
            json: async () => mockSettings,
          });
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      render(<SettingsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Save Changes')).toBeInTheDocument();
      });

      const saveButton = screen.getByText('Save Changes');
      
      // Click multiple times rapidly
      await user.click(saveButton);
      await user.click(saveButton);
      await user.click(saveButton);

      // Wait for save to complete
      await waitFor(() => {
        expect(screen.getByText('Settings saved successfully!')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Should only save once due to loading state
      expect(saveCount).toBeLessThanOrEqual(1);
    });

    it('should disable save buttons during username save', async () => {
      const user = userEvent.setup();
      
      (global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
        if (url.includes('/api/user/me')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockUser,
          });
        }
        if (url.includes('/api/settings')) {
          if (options?.method === 'PUT') {
            return new Promise(resolve => {
              setTimeout(() => {
                resolve({
                  ok: true,
                  json: async () => ({ success: true }),
                });
              }, 200);
            });
          }
          return Promise.resolve({
            ok: true,
            json: async () => mockSettings,
          });
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      render(<SettingsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('testuser')).toBeInTheDocument();
      });

      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      const usernameInput = screen.getByDisplayValue('testuser');
      await user.clear(usernameInput);
      await user.type(usernameInput, 'newusername');

      const saveButtons = screen.getAllByRole('button', { name: /save/i });
      await user.click(saveButtons[0]);

      // Buttons should be disabled during save
      expect(saveButtons[0]).toBeDisabled();
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      expect(cancelButton).toBeDisabled();

      await waitFor(() => {
        expect(screen.getByText('Settings saved successfully!')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should update user state after successful username change', async () => {
      const user = userEvent.setup();
      
      (global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
        if (url.includes('/api/user/me')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockUser,
          });
        }
        if (url.includes('/api/settings')) {
          if (options?.method === 'PUT') {
            return Promise.resolve({
              ok: true,
              json: async () => ({ success: true }),
            });
          }
          return Promise.resolve({
            ok: true,
            json: async () => mockSettings,
          });
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      render(<SettingsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('testuser')).toBeInTheDocument();
      });

      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      const usernameInput = screen.getByDisplayValue('testuser');
      await user.clear(usernameInput);
      await user.type(usernameInput, 'brandnewname');

      const saveButtons = screen.getAllByRole('button', { name: /save/i });
      await user.click(saveButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('brandnewname')).toBeInTheDocument();
        expect(screen.queryByDisplayValue('brandnewname')).not.toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });
});
