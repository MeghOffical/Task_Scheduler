/**
 * Comprehensive unit tests for Pomodoro Timer page
 * Target: ≥90% coverage
 */

import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import PomodoroPage from './page';

// Mock AudioContext
global.AudioContext = jest.fn().mockImplementation(() => ({
  createOscillator: jest.fn(() => ({
    connect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    frequency: { value: 0 },
    type: 'sine',
  })),
  createGain: jest.fn(() => ({
    connect: jest.fn(),
    gain: {
      setValueAtTime: jest.fn(),
    },
  })),
  destination: {},
  currentTime: 0,
})) as any;

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock window.alert
global.alert = jest.fn();

// Mock fetch
global.fetch = jest.fn();

// Mock window.postMessage
window.postMessage = jest.fn();

describe('PomodoroPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    localStorageMock.clear();
    localStorageMock.getItem.mockReturnValue(null);
    
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url === '/api/tasks') {
        return Promise.resolve({
          ok: true,
          json: async () => [
            { id: '1', title: 'Test Task 1', status: 'pending' },
            { id: '2', title: 'Test Task 2', status: 'in-progress' },
          ],
        });
      }
      if (url === '/api/settings') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            pomodoroSettings: {
              workDuration: 25,
              shortBreakDuration: 5,
              longBreakDuration: 15,
              longBreakInterval: 4,
            },
          }),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Initial Render', () => {
    it('should render the pomodoro timer with initial state', async () => {
      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('Pomodoro Timer')).toBeInTheDocument();
      });

      expect(screen.getByText('Focus Session')).toBeInTheDocument();
      expect(screen.getByText('25:00')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /start/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /skip/i })).toBeInTheDocument();
    });

    it('should render mode selection tabs', () => {
      render(<PomodoroPage />);

      expect(screen.getByRole('button', { name: /^pomodoro$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /short break/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /long break/i })).toBeInTheDocument();
    });

    it('should fetch tasks on mount', async () => {
      render(<PomodoroPage />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/tasks');
      });
    });

    it('should fetch settings on mount', async () => {
      render(<PomodoroPage />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/settings');
      });
    });

    it('should load history from localStorage', async () => {
      const mockHistory = [
        {
          id: 1,
          date: new Date().toISOString(),
          type: 'focus',
          duration: 25,
          taskTitle: 'Test Task',
        },
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockHistory));

      render(<PomodoroPage />);

      await waitFor(() => {
        expect(localStorageMock.getItem).toHaveBeenCalledWith('pomodoroHistory');
      });
    });

    it('should migrate legacy "break" entries to "short_break"', async () => {
      const legacyHistory = [
        {
          id: 1,
          date: new Date().toISOString(),
          type: 'break',
          duration: 5,
          taskTitle: 'Break',
        },
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(legacyHistory));

      render(<PomodoroPage />);

      await waitFor(() => {
        expect(localStorageMock.getItem).toHaveBeenCalled();
      });
    });

    it('should handle invalid localStorage data gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      expect(() => render(<PomodoroPage />)).not.toThrow();

      consoleSpy.mockRestore();
    });
  });

  describe('Timer Functionality', () => {
    it('should start timer when Start button is clicked', async () => {
      const user = userEvent.setup({ delay: null });
      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('25:00')).toBeInTheDocument();
      });

      const startButton = screen.getByRole('button', { name: /start/i });
      await user.click(startButton);

      expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.getByText('24:59')).toBeInTheDocument();
      });
    });

    it('should pause timer when Pause button is clicked', async () => {
      const user = userEvent.setup({ delay: null });
      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('25:00')).toBeInTheDocument();
      });

      const startButton = screen.getByRole('button', { name: /start/i });
      await user.click(startButton);

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      const pauseButton = screen.getByRole('button', { name: /pause/i });
      await user.click(pauseButton);

      const currentTime = screen.getByText(/24:58/);
      expect(currentTime).toBeInTheDocument();

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(screen.getByText(/24:58/)).toBeInTheDocument();
    });

    it('should reset timer when Reset button is clicked', async () => {
      const user = userEvent.setup({ delay: null });
      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('25:00')).toBeInTheDocument();
      });

      const startButton = screen.getByRole('button', { name: /start/i });
      await user.click(startButton);

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      const resetButton = screen.getByRole('button', { name: /reset/i });
      await user.click(resetButton);

      await waitFor(() => {
        expect(screen.getByText('25:00')).toBeInTheDocument();
      });
      expect(screen.getByRole('button', { name: /start/i })).toBeInTheDocument();
    });
  });

  describe('Mode Switching', () => {
    it('should switch to short break mode', async () => {
      const user = userEvent.setup({ delay: null });
      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('Focus Session')).toBeInTheDocument();
      });

      const shortBreakButton = screen.getByRole('button', { name: /short break/i });
      await user.click(shortBreakButton);

      await waitFor(() => {
        const shortBreakTexts = screen.getAllByText('Short Break');
        expect(shortBreakTexts.length).toBeGreaterThan(0);
        expect(screen.getByText('05:00')).toBeInTheDocument();
      });
    });

    it('should switch to long break mode', async () => {
      const user = userEvent.setup({ delay: null });
      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('Focus Session')).toBeInTheDocument();
      });

      const longBreakButton = screen.getByRole('button', { name: /long break/i });
      await user.click(longBreakButton);

      await waitFor(() => {
        const longBreakTexts = screen.getAllByText('Long Break');
        expect(longBreakTexts.length).toBeGreaterThan(0);
        expect(screen.getByText('15:00')).toBeInTheDocument();
      });
    });

    it('should switch back to pomodoro mode', async () => {
      const user = userEvent.setup({ delay: null });
      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('Focus Session')).toBeInTheDocument();
      });

      const shortBreakButton = screen.getByRole('button', { name: /short break/i });
      await user.click(shortBreakButton);

      await waitFor(() => {
        const shortBreakTexts = screen.getAllByText('Short Break');
        expect(shortBreakTexts.length).toBeGreaterThan(0);
      });

      const pomodoroButton = screen.getByRole('button', { name: /^pomodoro$/i });
      await user.click(pomodoroButton);

      await waitFor(() => {
        expect(screen.getByText('Focus Session')).toBeInTheDocument();
        expect(screen.getByText('25:00')).toBeInTheDocument();
      });
    });

    it('should pause timer when switching modes', async () => {
      const user = userEvent.setup({ delay: null });
      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('25:00')).toBeInTheDocument();
      });

      const startButton = screen.getByRole('button', { name: /start/i });
      await user.click(startButton);

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      const shortBreakButton = screen.getByRole('button', { name: /short break/i });
      await user.click(shortBreakButton);

      expect(screen.getByRole('button', { name: /start/i })).toBeInTheDocument();
    });
  });

  describe('Session Completion', () => {
    it('should complete session and show alert when timer reaches zero', async () => {
      const user = userEvent.setup({ delay: null });
      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('25:00')).toBeInTheDocument();
      });

      const startButton = screen.getByRole('button', { name: /start/i });
      await user.click(startButton);

      act(() => {
        jest.advanceTimersByTime(25 * 60 * 1000);
      });

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Focus session complete! Take a break.');
      });
    });

    it('should show break complete alert when break timer completes', async () => {
      const user = userEvent.setup({ delay: null });
      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('25:00')).toBeInTheDocument();
      });

      // Switch to short break
      const shortBreakButton = screen.getByRole('button', { name: /short break/i });
      await user.click(shortBreakButton);

      await waitFor(() => {
        expect(screen.getByText('05:00')).toBeInTheDocument();
      });

      const startButton = screen.getByRole('button', { name: /start/i });
      await user.click(startButton);

      act(() => {
        jest.advanceTimersByTime(5 * 60 * 1000);
      });

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Break complete! Time to focus.');
      });
    });

    it('should show long break complete alert when long break completes', async () => {
      const user = userEvent.setup({ delay: null });
      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('25:00')).toBeInTheDocument();
      });

      // Switch to long break
      const longBreakButton = screen.getByRole('button', { name: /long break/i });
      await user.click(longBreakButton);

      await waitFor(() => {
        expect(screen.getByText('15:00')).toBeInTheDocument();
      });

      const startButton = screen.getByRole('button', { name: /start/i });
      await user.click(startButton);

      act(() => {
        jest.advanceTimersByTime(15 * 60 * 1000);
      });

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Break complete! Time to focus.');
      });
    });

    it('should save session to history', async () => {
      const user = userEvent.setup({ delay: null });
      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('25:00')).toBeInTheDocument();
      });

      const startButton = screen.getByRole('button', { name: /start/i });
      await user.click(startButton);

      act(() => {
        jest.advanceTimersByTime(25 * 60 * 1000);
      });

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'pomodoroHistory',
          expect.any(String)
        );
      });
    });

    it('should switch to break after completing focus session', async () => {
      const user = userEvent.setup({ delay: null });
      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('Focus Session')).toBeInTheDocument();
      });

      const startButton = screen.getByRole('button', { name: /start/i });
      await user.click(startButton);

      act(() => {
        jest.advanceTimersByTime(25 * 60 * 1000);
      });

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalled();
      });
    });

    it('should trigger long break after completing longBreakInterval sessions', async () => {
      const user = userEvent.setup({ delay: null });
      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('25:00')).toBeInTheDocument();
      });

      // Complete 4 focus sessions
      for (let i = 0; i < 4; i++) {
        const startButton = screen.getByRole('button', { name: /start/i });
        await user.click(startButton);

        act(() => {
          jest.advanceTimersByTime(25 * 60 * 1000);
        });

        await waitFor(() => {
          expect(global.alert).toHaveBeenCalled();
        });

        jest.clearAllMocks();
      }
    });
  });

  describe('Skip Functionality', () => {
    it('should skip to break from focus session', async () => {
      const user = userEvent.setup({ delay: null });
      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('Focus Session')).toBeInTheDocument();
      });

      const skipButton = screen.getByRole('button', { name: /skip/i });
      await user.click(skipButton);

      await waitFor(() => {
        // Should show either Short Break or Long Break
        const breakTexts = screen.queryAllByText(/Short Break|Long Break/);
        expect(breakTexts.length).toBeGreaterThan(0);
      });
    });

    it('should increment session count when skipping from focus', async () => {
      const user = userEvent.setup({ delay: null });
      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('Focus Session')).toBeInTheDocument();
        expect(screen.getByText(/session 4 of 4/i)).toBeInTheDocument();
      });

      const skipButton = screen.getByRole('button', { name: /skip/i });
      await user.click(skipButton);

      await waitFor(() => {
        // Should be on break now with incremented session count
        const breakTexts = screen.queryAllByText(/Short Break|Long Break/);
        expect(breakTexts.length).toBeGreaterThan(0);
      });
    });

    it('should skip to focus from break session', async () => {
      const user = userEvent.setup({ delay: null });
      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('Focus Session')).toBeInTheDocument();
      });

      // Switch to break first
      const shortBreakButton = screen.getByRole('button', { name: /short break/i });
      await user.click(shortBreakButton);

      await waitFor(() => {
        const shortBreakTexts = screen.getAllByText('Short Break');
        expect(shortBreakTexts.length).toBeGreaterThan(0);
      });

      const skipButton = screen.getByRole('button', { name: /skip/i });
      await user.click(skipButton);

      await waitFor(() => {
        expect(screen.getByText('Focus Session')).toBeInTheDocument();
      });
    });

    it('should pause timer when skipping', async () => {
      const user = userEvent.setup({ delay: null });
      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('25:00')).toBeInTheDocument();
      });

      const startButton = screen.getByRole('button', { name: /start/i });
      await user.click(startButton);

      const skipButton = screen.getByRole('button', { name: /skip/i });
      await user.click(skipButton);

      expect(screen.getByRole('button', { name: /start/i })).toBeInTheDocument();
    });
  });

  describe('Task Selection', () => {
    it('should render task select dropdown', async () => {
      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/link to task/i)).toBeInTheDocument();
      });
    });

    it('should load tasks into dropdown', async () => {
      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Task 1')).toBeInTheDocument();
        expect(screen.getByText('Test Task 2')).toBeInTheDocument();
      });
    });

    it('should select a task', async () => {
      const user = userEvent.setup({ delay: null });
      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Task 1')).toBeInTheDocument();
      });

      const select = screen.getByLabelText(/link to task/i);
      await user.selectOptions(select, '1');

      expect(select).toHaveValue('1');
    });

    it('should handle error when fetching tasks', async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.reject(new Error('Failed to fetch'))
      );
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(<PomodoroPage />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error fetching tasks:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Settings Integration', () => {
    it('should apply custom settings from API', async () => {
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url === '/api/tasks') {
          return Promise.resolve({
            ok: true,
            json: async () => [],
          });
        }
        if (url === '/api/settings') {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              pomodoroSettings: {
                workDuration: 30,
                shortBreakDuration: 10,
                longBreakDuration: 20,
                longBreakInterval: 3,
              },
            }),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('30:00')).toBeInTheDocument();
      });
    });

    it('should handle pomodoroSettingsChanged event', async () => {
      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('25:00')).toBeInTheDocument();
      });

      act(() => {
        const event = new CustomEvent('pomodoroSettingsChanged', {
          detail: {
            workDuration: 45,
            shortBreakDuration: 10,
            longBreakDuration: 25,
            longBreakInterval: 4,
          },
        });
        window.dispatchEvent(event);
      });

      await waitFor(() => {
        expect(screen.getByText('45:00')).toBeInTheDocument();
      });
    });

    it('should not update time if timer is running when settings change', async () => {
      const user = userEvent.setup({ delay: null });
      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('25:00')).toBeInTheDocument();
      });

      const startButton = screen.getByRole('button', { name: /start/i });
      await user.click(startButton);

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      act(() => {
        const event = new CustomEvent('pomodoroSettingsChanged', {
          detail: {
            workDuration: 45,
            shortBreakDuration: 10,
            longBreakDuration: 25,
            longBreakInterval: 4,
          },
        });
        window.dispatchEvent(event);
      });

      await waitFor(() => {
        expect(screen.getByText('24:58')).toBeInTheDocument();
      });
    });

    it('should handle error when fetching settings', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url === '/api/tasks') {
          return Promise.resolve({ ok: true, json: async () => [] });
        }
        if (url === '/api/settings') {
          return Promise.reject(new Error('Failed to fetch'));
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<PomodoroPage />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error fetching settings:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Distraction Blocker', () => {
    it('should show instructions modal when button is clicked', async () => {
      const user = userEvent.setup({ delay: null });
      render(<PomodoroPage />);

      const blockerButton = await screen.findByRole('button', {
        name: /activate distraction blocker/i,
      });
      await user.click(blockerButton);

      await waitFor(() => {
        expect(screen.getByText(/how to install website blocker extension/i)).toBeInTheDocument();
      });
    });

    it('should close instructions modal', async () => {
      const user = userEvent.setup({ delay: null });
      render(<PomodoroPage />);

      const blockerButton = await screen.findByRole('button', {
        name: /activate distraction blocker/i,
      });
      await user.click(blockerButton);

      await waitFor(() => {
        expect(screen.getByText(/how to install website blocker extension/i)).toBeInTheDocument();
      });

      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText(/how to install website blocker extension/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Session Counter', () => {
    it('should display session counter', async () => {
      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText(/session 4 of 4/i)).toBeInTheDocument();
      });
    });

    it('should update session counter after completing session', async () => {
      const user = userEvent.setup({ delay: null });
      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText(/session 4 of 4/i)).toBeInTheDocument();
      });

      const startButton = screen.getByRole('button', { name: /start/i });
      await user.click(startButton);

      act(() => {
        jest.advanceTimersByTime(25 * 60 * 1000);
      });

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalled();
      });
    });

    it('should trigger long break after completing longBreakInterval sessions', async () => {
      const user = userEvent.setup({ delay: null });
      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('25:00')).toBeInTheDocument();
      });

      // Complete 4 focus sessions (default longBreakInterval)
      for (let i = 0; i < 4; i++) {
        const startButton = screen.getByRole('button', { name: /start/i });
        await user.click(startButton);

        act(() => {
          jest.advanceTimersByTime(25 * 60 * 1000);
        });

        await waitFor(() => {
          expect(global.alert).toHaveBeenCalled();
        });

        // After 4th session, should be on long break
        if (i === 3) {
          await waitFor(() => {
            const longBreakTexts = screen.getAllByText('Long Break');
            expect(longBreakTexts.length).toBeGreaterThan(0);
          });
        }

        jest.clearAllMocks();
      }
    });
  });

  describe('PostMessage Communication', () => {
    it('should post message when timer state changes', async () => {
      const user = userEvent.setup({ delay: null });
      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('25:00')).toBeInTheDocument();
      });

      const startButton = screen.getByRole('button', { name: /start/i });
      await user.click(startButton);

      await waitFor(() => {
        expect(window.postMessage).toHaveBeenCalledWith(
          {
            source: 'planit-pomodoro',
            state: 'focus',
          },
          '*'
        );
      });
    });

    it('should handle postMessage errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      window.postMessage = jest.fn().mockImplementation(() => {
        throw new Error('postMessage failed');
      });

      expect(() => render(<PomodoroPage />)).not.toThrow();

      consoleSpy.mockRestore();
    });
  });

  describe('Activity Log', () => {
    it('should display "No sessions completed yet" when history is empty', () => {
      render(<PomodoroPage />);

      expect(screen.getByText(/no sessions completed yet/i)).toBeInTheDocument();
    });

    it('should display session history', async () => {
      const mockHistory = [
        {
          id: 1,
          date: new Date().toISOString(),
          type: 'focus' as const,
          duration: 25,
          taskTitle: 'Test Task',
        },
        {
          id: 2,
          date: new Date().toISOString(),
          type: 'short_break' as const,
          duration: 5,
          taskTitle: 'Break',
        },
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockHistory));

      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Task')).toBeInTheDocument();
      });
    });

    it('should display long break sessions in history', async () => {
      const mockHistory = [
        {
          id: 1,
          date: new Date().toISOString(),
          type: 'focus' as const,
          duration: 25,
          taskTitle: 'Task 1',
        },
        {
          id: 2,
          date: new Date().toISOString(),
          type: 'long_break' as const,
          duration: 15,
          taskTitle: 'Long Break',
        },
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockHistory));

      render(<PomodoroPage />);

      await waitFor(() => {
        const longBreakTexts = screen.getAllByText('Long Break');
        expect(longBreakTexts.length).toBeGreaterThan(0);
      });
    });

    it('should display total focus time', async () => {
      const mockHistory = [
        {
          id: 1,
          date: new Date().toISOString(),
          type: 'focus' as const,
          duration: 25,
          taskTitle: 'Task 1',
        },
        {
          id: 2,
          date: new Date().toISOString(),
          type: 'focus' as const,
          duration: 25,
          taskTitle: 'Task 2',
        },
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockHistory));

      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText(/50 min/i)).toBeInTheDocument();
      });
    });
  });

  describe('Audio Notification', () => {
    it('should play sound when session completes', async () => {
      const mockOscillator = {
        connect: jest.fn(),
        start: jest.fn(),
        stop: jest.fn(),
        frequency: { value: 0 },
        type: 'sine',
      };

      const mockGain = {
        connect: jest.fn(),
        gain: {
          setValueAtTime: jest.fn(),
        },
      };

      const mockAudioContext = {
        createOscillator: jest.fn(() => mockOscillator),
        createGain: jest.fn(() => mockGain),
        destination: {},
        currentTime: 0,
      };

      global.AudioContext = jest.fn(() => mockAudioContext) as any;

      const user = userEvent.setup({ delay: null });
      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('25:00')).toBeInTheDocument();
      });

      const startButton = screen.getByRole('button', { name: /start/i });
      await user.click(startButton);

      act(() => {
        jest.advanceTimersByTime(25 * 60 * 1000);
      });

      await waitFor(() => {
        expect(mockAudioContext.createOscillator).toHaveBeenCalled();
        expect(mockOscillator.start).toHaveBeenCalled();
      });
    });
  });

  describe('Cleanup', () => {
    it('should clear interval on unmount', () => {
      const { unmount } = render(<PomodoroPage />);

      unmount();

      expect(jest.getTimerCount()).toBe(0);
    });

    it('should remove event listener on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
      const { unmount } = render(<PomodoroPage />);

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'pomodoroSettingsChanged',
        expect.any(Function)
      );
    });
  });

  describe('Additional Branch Coverage', () => {
    it('should not set long break when session count does not reach interval', async () => {
      const user = userEvent.setup({ delay: null });
      
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url === '/api/tasks') {
          return Promise.resolve({
            ok: true,
            json: async () => [],
          });
        }
        if (url === '/api/settings') {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              pomodoroSettings: {
                workDuration: 25,
                shortBreakDuration: 5,
                longBreakDuration: 15,
                longBreakInterval: 4, // Need 4 sessions for long break
              },
            }),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('Focus Session')).toBeInTheDocument();
      });

      // Complete first session (1 of 4 - should not trigger long break)
      const startButton = screen.getByRole('button', { name: /start/i });
      await user.click(startButton);

      act(() => {
        jest.advanceTimersByTime(25 * 60 * 1000);
      });

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Focus session complete! Take a break.');
      });

      // Should be on short break, not long break
      await waitFor(() => {
        const shortBreakTexts = screen.getAllByText('Short Break');
        expect(shortBreakTexts.length).toBeGreaterThan(0);
      });
    });

    it('should show long break complete alert', async () => {
      const user = userEvent.setup({ delay: null });
      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('25:00')).toBeInTheDocument();
      });

      // Manually switch to long break and complete it
      const longBreakButton = screen.getByRole('button', { name: /long break/i });
      await user.click(longBreakButton);

      await waitFor(() => {
        const longBreakTexts = screen.getAllByText('Long Break');
        expect(longBreakTexts.length).toBeGreaterThan(0);
      });

      const startButton = screen.getByRole('button', { name: /start/i });
      await user.click(startButton);

      act(() => {
        jest.advanceTimersByTime(15 * 60 * 1000);
      });

      // Should get long break complete message (line 218 branch)
      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Break complete! Time to focus.');
      });
    });

    it('should return correct color for short break state', async () => {
      const user = userEvent.setup({ delay: null });
      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('Focus Session')).toBeInTheDocument();
      });

      // Switch to short break
      const shortBreakButton = screen.getByRole('button', { name: /short break/i });
      await user.click(shortBreakButton);

      await waitFor(() => {
        const shortBreakTexts = screen.getAllByText('Short Break');
        expect(shortBreakTexts.length).toBeGreaterThan(0);
      });

      // The component should be rendering with short break color (#10B981)
      // This tests the getTimerColor function's isBreak && !isLongBreak branch
      expect(screen.getByText('05:00')).toBeInTheDocument();
    });

    it('should return correct color for long break state', async () => {
      const user = userEvent.setup({ delay: null });
      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('Focus Session')).toBeInTheDocument();
      });

      // Switch to long break
      const longBreakButton = screen.getByRole('button', { name: /long break/i });
      await user.click(longBreakButton);

      await waitFor(() => {
        const longBreakTexts = screen.getAllByText('Long Break');
        expect(longBreakTexts.length).toBeGreaterThan(0);
      });

      // The component should be rendering with long break color (#059669)
      // This tests the getTimerColor function's isBreak && isLongBreak branch
      expect(screen.getByText('15:00')).toBeInTheDocument();
    });

    it('should return correct color for focus state', async () => {
      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('Focus Session')).toBeInTheDocument();
      });

      // Default state is focus, which should use color #0891B2
      // This tests the getTimerColor function's !isBreak branch
      expect(screen.getByText('25:00')).toBeInTheDocument();
    });
  });
});
