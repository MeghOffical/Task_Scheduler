/**
 * Unit tests for settings page
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SettingsPage from './page';

// Mock PageWrapper
jest.mock('@/components/page-wrapper', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="page-wrapper">{children}</div>,
}));

// Mock fetch
global.fetch = jest.fn();

describe('Settings Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/settings')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            pomodoroWorkDuration: 25,
            pomodoroShortBreak: 5,
            pomodoroLongBreak: 15,
            emailNotifications: true,
            pushNotifications: false,
          }),
        });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });
  });

  it('should render settings page', () => {
    render(<SettingsPage />);
    expect(screen.getByTestId('page-wrapper')).toBeInTheDocument();
  });

  it('should display settings title', () => {
    render(<SettingsPage />);
    expect(screen.getByText(/settings/i)).toBeInTheDocument();
  });

  it('should fetch user settings on mount', async () => {
    render(<SettingsPage />);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/settings'));
    });
  });

  it('should display pomodoro settings section', async () => {
    render(<SettingsPage />);
    
    await waitFor(() => {
      expect(screen.getByText(/pomodoro/i)).toBeInTheDocument();
    });
  });

  it('should display notification settings section', async () => {
    render(<SettingsPage />);
    
    await waitFor(() => {
      expect(screen.getByText(/notifications/i)).toBeInTheDocument();
    });
  });
});
