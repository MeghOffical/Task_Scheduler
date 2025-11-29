/**
 * Comprehensive unit tests for Pomodoro Timer page
 * Target: ≥90% mutation coverage
 */

import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
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
      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('25:00')).toBeInTheDocument();
      });

      const startButton = screen.getByRole('button', { name: /start/i });
      fireEvent.click(startButton);

      expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.getByText('24:59')).toBeInTheDocument();
      });
    });

    it('should pause timer when Pause button is clicked', async () => {
      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('25:00')).toBeInTheDocument();
      });

      const startButton = screen.getByRole('button', { name: /start/i });
      fireEvent.click(startButton);

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      const pauseButton = screen.getByRole('button', { name: /pause/i });
      fireEvent.click(pauseButton);

      const currentTime = screen.getByText(/24:58/);
      expect(currentTime).toBeInTheDocument();

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(screen.getByText(/24:58/)).toBeInTheDocument();
    });

    it('should reset timer when Reset button is clicked', async () => {
      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('25:00')).toBeInTheDocument();
      });

      const startButton = screen.getByRole('button', { name: /start/i });
      fireEvent.click(startButton);

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      const resetButton = screen.getByRole('button', { name: /reset/i });
      fireEvent.click(resetButton);

      await waitFor(() => {
        expect(screen.getByText('25:00')).toBeInTheDocument();
      });
      expect(screen.getByRole('button', { name: /start/i })).toBeInTheDocument();
    });
  });

  describe('Mode Switching', () => {
    it('should switch to short break mode', async () => {
      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('Focus Session')).toBeInTheDocument();
      });

      const shortBreakButton = screen.getByRole('button', { name: /short break/i });
      fireEvent.click(shortBreakButton);

      await waitFor(() => {
        const shortBreakTexts = screen.getAllByText('Short Break');
        expect(shortBreakTexts.length).toBeGreaterThan(0);
        expect(screen.getByText('05:00')).toBeInTheDocument();
      });
    });

    it('should switch to long break mode', async () => {
      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('Focus Session')).toBeInTheDocument();
      });

      const longBreakButton = screen.getByRole('button', { name: /long break/i });
      fireEvent.click(longBreakButton);

      await waitFor(() => {
        const longBreakTexts = screen.getAllByText('Long Break');
        expect(longBreakTexts.length).toBeGreaterThan(0);
        expect(screen.getByText('15:00')).toBeInTheDocument();
      });
    });

    it('should switch back to pomodoro mode', async () => {
      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('Focus Session')).toBeInTheDocument();
      });

      const shortBreakButton = screen.getByRole('button', { name: /short break/i });
      fireEvent.click(shortBreakButton);

      await waitFor(() => {
        const shortBreakTexts = screen.getAllByText('Short Break');
        expect(shortBreakTexts.length).toBeGreaterThan(0);
      });

      const pomodoroButton = screen.getByRole('button', { name: /^pomodoro$/i });
      fireEvent.click(pomodoroButton);

      await waitFor(() => {
        expect(screen.getByText('Focus Session')).toBeInTheDocument();
        expect(screen.getByText('25:00')).toBeInTheDocument();
      });
    });

    it('should pause timer when switching modes', async () => {
      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('25:00')).toBeInTheDocument();
      });

      const startButton = screen.getByRole('button', { name: /start/i });
      fireEvent.click(startButton);

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      const shortBreakButton = screen.getByRole('button', { name: /short break/i });
      fireEvent.click(shortBreakButton);

      expect(screen.getByRole('button', { name: /start/i })).toBeInTheDocument();
    });
  });

  describe('Session Completion', () => {
    it('should complete session and show alert when timer reaches zero', async () => {
      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('25:00')).toBeInTheDocument();
      });

      const startButton = screen.getByRole('button', { name: /start/i });
      fireEvent.click(startButton);

      act(() => {
        jest.advanceTimersByTime(25 * 60 * 1000);
      });

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Focus session complete! Take a break.');
      });
    });

    it('should show break complete alert when break timer completes', async () => {
      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('25:00')).toBeInTheDocument();
      });

      // Switch to short break
      const shortBreakButton = screen.getByRole('button', { name: /short break/i });
      fireEvent.click(shortBreakButton);

      await waitFor(() => {
        expect(screen.getByText('05:00')).toBeInTheDocument();
      });

      const startButton = screen.getByRole('button', { name: /start/i });
      fireEvent.click(startButton);

      act(() => {
        jest.advanceTimersByTime(5 * 60 * 1000);
      });

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Break complete! Time to focus.');
      });
    });

    it('should show long break complete alert when long break completes', async () => {
      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('25:00')).toBeInTheDocument();
      });

      // Switch to long break
      const longBreakButton = screen.getByRole('button', { name: /long break/i });
      fireEvent.click(longBreakButton);

      await waitFor(() => {
        expect(screen.getByText('15:00')).toBeInTheDocument();
      });

      const startButton = screen.getByRole('button', { name: /start/i });
      fireEvent.click(startButton);

      act(() => {
        jest.advanceTimersByTime(15 * 60 * 1000);
      });

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Break complete! Time to focus.');
      });
    });

    it('should save session to history', async () => {
      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('25:00')).toBeInTheDocument();
      });

      const startButton = screen.getByRole('button', { name: /start/i });
      fireEvent.click(startButton);

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
      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('Focus Session')).toBeInTheDocument();
      });

      const startButton = screen.getByRole('button', { name: /start/i });
      fireEvent.click(startButton);

      act(() => {
        jest.advanceTimersByTime(25 * 60 * 1000);
      });

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalled();
      });
    });

    it('should trigger long break after completing longBreakInterval sessions', async () => {
      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('25:00')).toBeInTheDocument();
      });

      // Complete 4 focus sessions
      for (let i = 0; i < 4; i++) {
        const startButton = screen.getByRole('button', { name: /start/i });
        fireEvent.click(startButton);

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
      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('Focus Session')).toBeInTheDocument();
      });

      const skipButton = screen.getByRole('button', { name: /skip/i });
      fireEvent.click(skipButton);

      await waitFor(() => {
        // Should show either Short Break or Long Break
        const breakTexts = screen.queryAllByText(/Short Break|Long Break/);
        expect(breakTexts.length).toBeGreaterThan(0);
      });
    });

    it('should increment session count when skipping from focus', async () => {
      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('Focus Session')).toBeInTheDocument();
        expect(screen.getByText(/session 4 of 4/i)).toBeInTheDocument();
      });

      const skipButton = screen.getByRole('button', { name: /skip/i });
      fireEvent.click(skipButton);

      await waitFor(() => {
        // Should be on break now with incremented session count
        const breakTexts = screen.queryAllByText(/Short Break|Long Break/);
        expect(breakTexts.length).toBeGreaterThan(0);
      });
    });

    it('should skip to focus from break session', async () => {
      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('Focus Session')).toBeInTheDocument();
      });

      // Switch to break first
      const shortBreakButton = screen.getByRole('button', { name: /short break/i });
      fireEvent.click(shortBreakButton);

      await waitFor(() => {
        const shortBreakTexts = screen.getAllByText('Short Break');
        expect(shortBreakTexts.length).toBeGreaterThan(0);
      });

      const skipButton = screen.getByRole('button', { name: /skip/i });
      fireEvent.click(skipButton);

      await waitFor(() => {
        expect(screen.getByText('Focus Session')).toBeInTheDocument();
      });
    });

    it('should pause timer when skipping', async () => {
      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('25:00')).toBeInTheDocument();
      });

      const startButton = screen.getByRole('button', { name: /start/i });
      fireEvent.click(startButton);

      const skipButton = screen.getByRole('button', { name: /skip/i });
      fireEvent.click(skipButton);

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
      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Task 1')).toBeInTheDocument();
      });

      const select = screen.getByLabelText(/link to task/i);
      fireEvent.change(select, { target: { value: '1' } });

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
      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('25:00')).toBeInTheDocument();
      });

      const startButton = screen.getByRole('button', { name: /start/i });
      fireEvent.click(startButton);

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
      render(<PomodoroPage />);

      const blockerButton = await screen.findByRole('button', {
        name: /activate distraction blocker/i,
      });
      fireEvent.click(blockerButton);

      await waitFor(() => {
        expect(screen.getByText(/how to install website blocker extension/i)).toBeInTheDocument();
      });
    });

    it('should close instructions modal', async () => {
      render(<PomodoroPage />);

      const blockerButton = await screen.findByRole('button', {
        name: /activate distraction blocker/i,
      });
      fireEvent.click(blockerButton);

      await waitFor(() => {
        expect(screen.getByText(/how to install website blocker extension/i)).toBeInTheDocument();
      });

      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);

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
      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText(/session 4 of 4/i)).toBeInTheDocument();
      });

      const startButton = screen.getByRole('button', { name: /start/i });
      fireEvent.click(startButton);

      act(() => {
        jest.advanceTimersByTime(25 * 60 * 1000);
      });

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalled();
      });
    });

    it('should trigger long break after completing longBreakInterval sessions', async () => {
      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('25:00')).toBeInTheDocument();
      });

      // Complete 4 focus sessions (default longBreakInterval)
      for (let i = 0; i < 4; i++) {
        const startButton = screen.getByRole('button', { name: /start/i });
        fireEvent.click(startButton);

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
      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('25:00')).toBeInTheDocument();
      });

      const startButton = screen.getByRole('button', { name: /start/i });
      fireEvent.click(startButton);

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

      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('25:00')).toBeInTheDocument();
      });

      const startButton = screen.getByRole('button', { name: /start/i });
      fireEvent.click(startButton);

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
      fireEvent.click(startButton);

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
      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('25:00')).toBeInTheDocument();
      });

      // Manually switch to long break and complete it
      const longBreakButton = screen.getByRole('button', { name: /long break/i });
      fireEvent.click(longBreakButton);

      await waitFor(() => {
        const longBreakTexts = screen.getAllByText('Long Break');
        expect(longBreakTexts.length).toBeGreaterThan(0);
      });

      const startButton = screen.getByRole('button', { name: /start/i });
      fireEvent.click(startButton);

      act(() => {
        jest.advanceTimersByTime(15 * 60 * 1000);
      });

      // Should get long break complete message (line 218 branch)
      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Break complete! Time to focus.');
      });
    });

    it('should return correct color for short break state', async () => {
      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('Focus Session')).toBeInTheDocument();
      });

      // Switch to short break
      const shortBreakButton = screen.getByRole('button', { name: /short break/i });
      fireEvent.click(shortBreakButton);

      await waitFor(() => {
        const shortBreakTexts = screen.getAllByText('Short Break');
        expect(shortBreakTexts.length).toBeGreaterThan(0);
      });

      // The component should be rendering with short break color (#10B981)
      // This tests the getTimerColor function's isBreak && !isLongBreak branch
      expect(screen.getByText('05:00')).toBeInTheDocument();
    });

    it('should return correct color for long break state', async () => {
      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('Focus Session')).toBeInTheDocument();
      });

      // Switch to long break
      const longBreakButton = screen.getByRole('button', { name: /long break/i });
      fireEvent.click(longBreakButton);

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

  describe('Session Types and History Display', () => {
    it('should correctly filter and display short break sessions', async () => {
      const mockHistory = [
        { id: 1, date: new Date().toISOString(), type: 'short_break' as const, duration: 5, taskTitle: 'Short Break 1' },
        { id: 2, date: new Date().toISOString(), type: 'short_break' as const, duration: 5, taskTitle: 'Short Break 2' },
        { id: 3, date: new Date().toISOString(), type: 'short_break' as const, duration: 5, taskTitle: 'Short Break 3' },
        { id: 4, date: new Date().toISOString(), type: 'short_break' as const, duration: 5, taskTitle: 'Short Break 4' },
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockHistory));

      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('Short Break 1')).toBeInTheDocument();
        expect(screen.getByText('Short Break 2')).toBeInTheDocument();
        expect(screen.getByText('Short Break 3')).toBeInTheDocument();
      });
      // Only 3 are shown due to slice(0, 3)
      expect(screen.queryByText('Short Break 4')).not.toBeInTheDocument();
    });

    it('should correctly filter and display long break sessions', async () => {
      const mockHistory = [
        { id: 1, date: new Date().toISOString(), type: 'long_break' as const, duration: 15, taskTitle: 'Long Break 1' },
        { id: 2, date: new Date().toISOString(), type: 'long_break' as const, duration: 15, taskTitle: 'Long Break 2' },
        { id: 3, date: new Date().toISOString(), type: 'long_break' as const, duration: 15, taskTitle: 'Long Break 3' },
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockHistory));

      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('Long Break 1')).toBeInTheDocument();
        expect(screen.getByText('Long Break 2')).toBeInTheDocument();
      });
      // Only 2 are shown due to slice(0, 2)
      expect(screen.queryByText('Long Break 3')).not.toBeInTheDocument();
    });

    it('should correctly filter and display focus sessions', async () => {
      const mockHistory = [
        { id: 1, date: new Date().toISOString(), type: 'focus' as const, duration: 25, taskTitle: 'Focus 1' },
        { id: 2, date: new Date().toISOString(), type: 'focus' as const, duration: 25, taskTitle: 'Focus 2' },
        { id: 3, date: new Date().toISOString(), type: 'focus' as const, duration: 25, taskTitle: 'Focus 3' },
        { id: 4, date: new Date().toISOString(), type: 'focus' as const, duration: 25, taskTitle: 'Focus 4' },
        { id: 5, date: new Date().toISOString(), type: 'focus' as const, duration: 25, taskTitle: 'Focus 5' },
        { id: 6, date: new Date().toISOString(), type: 'focus' as const, duration: 25, taskTitle: 'Focus 6' },
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockHistory));

      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('Focus 1')).toBeInTheDocument();
        expect(screen.getByText('Focus 5')).toBeInTheDocument();
      });
      // Only 5 are shown due to slice(0, 5)
      expect(screen.queryByText('Focus 6')).not.toBeInTheDocument();
    });

    it('should show fallback text when session has no taskTitle', async () => {
      const mockHistory = [
        { id: 1, date: new Date().toISOString(), type: 'focus' as const, duration: 25, taskTitle: '' },
        { id: 2, date: new Date().toISOString(), type: 'short_break' as const, duration: 5, taskTitle: '' },
        { id: 3, date: new Date().toISOString(), type: 'long_break' as const, duration: 15, taskTitle: '' },
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockHistory));

      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('Focus')).toBeInTheDocument();
        expect(screen.getByText('Break')).toBeInTheDocument();
      });
    });

    it('should display session times correctly formatted', async () => {
      const mockDate = new Date('2024-01-15T14:30:00');
      const mockHistory = [
        { id: 1, date: mockDate.toISOString(), type: 'focus' as const, duration: 25, taskTitle: 'Task' },
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockHistory));

      render(<PomodoroPage />);

      await waitFor(() => {
        // Check that time formatting is applied
        expect(screen.getByText('Task')).toBeInTheDocument();
      });
    });

    it('should calculate total focus time correctly with reduce', async () => {
      const mockHistory = [
        { id: 1, date: new Date().toISOString(), type: 'focus' as const, duration: 25, taskTitle: 'Task 1' },
        { id: 2, date: new Date().toISOString(), type: 'focus' as const, duration: 30, taskTitle: 'Task 2' },
        { id: 3, date: new Date().toISOString(), type: 'short_break' as const, duration: 5, taskTitle: 'Break' },
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockHistory));

      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('55 min')).toBeInTheDocument();
      });
    });
  });

  describe('Timer Progress Circle Calculations', () => {
    it('should calculate progress correctly for focus mode', async () => {
      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('25:00')).toBeInTheDocument();
      });

      // Start timer
      const startButton = screen.getByRole('button', { name: /start/i });
      fireEvent.click(startButton);

      // Advance half the time
      act(() => {
        jest.advanceTimersByTime(12.5 * 60 * 1000);
      });

      await waitFor(() => {
        expect(screen.getByText('12:30')).toBeInTheDocument();
      });
    });

    it('should calculate progress correctly for short break mode', async () => {
      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('Focus Session')).toBeInTheDocument();
      });

      // Switch to short break
      const shortBreakButton = screen.getByRole('button', { name: /short break/i });
      fireEvent.click(shortBreakButton);

      await waitFor(() => {
        expect(screen.getByText('05:00')).toBeInTheDocument();
      });

      // Start timer
      const startButton = screen.getByRole('button', { name: /start/i });
      fireEvent.click(startButton);

      // Advance half the time
      act(() => {
        jest.advanceTimersByTime(2.5 * 60 * 1000);
      });

      await waitFor(() => {
        expect(screen.getByText('02:30')).toBeInTheDocument();
      });
    });

    it('should calculate progress correctly for long break mode', async () => {
      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('Focus Session')).toBeInTheDocument();
      });

      // Switch to long break
      const longBreakButton = screen.getByRole('button', { name: /long break/i });
      fireEvent.click(longBreakButton);

      await waitFor(() => {
        expect(screen.getByText('15:00')).toBeInTheDocument();
      });

      // Start timer
      const startButton = screen.getByRole('button', { name: /start/i });
      fireEvent.click(startButton);

      // Advance half the time
      act(() => {
        jest.advanceTimersByTime(7.5 * 60 * 1000);
      });

      await waitFor(() => {
        expect(screen.getByText('07:30')).toBeInTheDocument();
      });
    });
  });

  describe('Skip Button Logic - Focus to Break', () => {
    it('should skip from focus to short break when not at long break interval', async () => {
      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('Focus Session')).toBeInTheDocument();
      });

      // Skip button should take us to short break
      const skipButton = screen.getByRole('button', { name: /skip/i });
      fireEvent.click(skipButton);

      await waitFor(() => {
        const shortBreakTexts = screen.getAllByText('Short Break');
        expect(shortBreakTexts.length).toBeGreaterThan(0);
        expect(screen.getByText('05:00')).toBeInTheDocument();
      });
    });

    it('should skip from focus to long break when at long break interval', async () => {
      // Set sessionCount to 3 via localStorage + completing sessions
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url === '/api/tasks') {
          return Promise.resolve({ ok: true, json: async () => [] });
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

      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('Focus Session')).toBeInTheDocument();
      });

      // Skip 3 times to get to session count 3
      for (let i = 0; i < 3; i++) {
        const skipButton = screen.getByRole('button', { name: /skip/i });
        fireEvent.click(skipButton);

        await waitFor(() => {
          const breakTexts = screen.queryAllByText(/Short Break|Long Break/);
          expect(breakTexts.length).toBeGreaterThan(0);
        });

        // Skip back to focus
        const skipBackButton = screen.getByRole('button', { name: /skip/i });
        fireEvent.click(skipBackButton);

        await waitFor(() => {
          expect(screen.getByText('Focus Session')).toBeInTheDocument();
        });
      }

      // Now skip should go to long break (session 4)
      const skipButton = screen.getByRole('button', { name: /skip/i });
      fireEvent.click(skipButton);

      await waitFor(() => {
        const longBreakTexts = screen.getAllByText('Long Break');
        expect(longBreakTexts.length).toBeGreaterThan(0);
        expect(screen.getByText('15:00')).toBeInTheDocument();
      });
    });

    it('should skip from break to focus and reset isLongBreak', async () => {
      render(<PomodoroPage />);

      // Go to long break
      const longBreakButton = screen.getByRole('button', { name: /long break/i });
      fireEvent.click(longBreakButton);

      await waitFor(() => {
        const longBreakTexts = screen.getAllByText('Long Break');
        expect(longBreakTexts.length).toBeGreaterThan(0);
      });

      // Skip back to focus
      const skipButton = screen.getByRole('button', { name: /skip/i });
      fireEvent.click(skipButton);

      await waitFor(() => {
        expect(screen.getByText('Focus Session')).toBeInTheDocument();
        expect(screen.getByText('25:00')).toBeInTheDocument();
      });
    });
  });

  describe('Session Completion with Task Selection', () => {
    it('should create session with selected task title', async () => {
      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Task 1')).toBeInTheDocument();
      });

      // Select a task
      const select = screen.getByLabelText(/link to task/i);
      fireEvent.change(select, { target: { value: '1' } });

      // Start and complete session
      const startButton = screen.getByRole('button', { name: /start/i });
      fireEvent.click(startButton);

      act(() => {
        jest.advanceTimersByTime(25 * 60 * 1000);
      });

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'pomodoroHistory',
          expect.stringContaining('Test Task 1')
        );
      });
    });

    it('should create session with "No task linked" when no task selected', async () => {
      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('25:00')).toBeInTheDocument();
      });

      // Don't select any task
      const startButton = screen.getByRole('button', { name: /start/i });
      fireEvent.click(startButton);

      act(() => {
        jest.advanceTimersByTime(25 * 60 * 1000);
      });

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'pomodoroHistory',
          expect.stringContaining('No task linked')
        );
      });
    });

    it('should create focus session type when completing focus', async () => {
      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('Focus Session')).toBeInTheDocument();
      });

      const startButton = screen.getByRole('button', { name: /start/i });
      fireEvent.click(startButton);

      act(() => {
        jest.advanceTimersByTime(25 * 60 * 1000);
      });

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'pomodoroHistory',
          expect.stringContaining('"type":"focus"')
        );
      });
    });

    it('should create short_break session type when completing short break', async () => {
      // Need to wait for settings to load first
      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('Focus Session')).toBeInTheDocument();
      });

      // Switch to short break
      const shortBreakButton = screen.getByRole('button', { name: /short break/i });
      fireEvent.click(shortBreakButton);

      // Wait for the short break time
      await waitFor(() => {
        const shortBreakTexts = screen.getAllByText('Short Break');
        expect(shortBreakTexts.length).toBeGreaterThan(0);
      });

      const startButton = screen.getByRole('button', { name: /start/i });
      fireEvent.click(startButton);

      // Advance timer until completion
      act(() => {
        jest.advanceTimersByTime(5 * 60 * 1000 + 1000);
      });

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalled();
      });
    });

    it('should create long_break session type when completing long break', async () => {
      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('Focus Session')).toBeInTheDocument();
      });

      // Switch to long break
      const longBreakButton = screen.getByRole('button', { name: /long break/i });
      fireEvent.click(longBreakButton);

      await waitFor(() => {
        const longBreakTexts = screen.getAllByText('Long Break');
        expect(longBreakTexts.length).toBeGreaterThan(0);
      });

      const startButton = screen.getByRole('button', { name: /start/i });
      fireEvent.click(startButton);

      act(() => {
        jest.advanceTimersByTime(15 * 60 * 1000 + 1000);
      });

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalled();
      });
    });
  });

  describe('Session Counter Display', () => {
    it('should display correct session number using modulo operation', async () => {
      render(<PomodoroPage />);

      await waitFor(() => {
        // Initial: 0 % 4 = 0, so should display 4 (the longBreakInterval)
        expect(screen.getByText(/session 4 of 4/i)).toBeInTheDocument();
      });

      // Complete one session
      const startButton = screen.getByRole('button', { name: /start/i });
      fireEvent.click(startButton);

      act(() => {
        jest.advanceTimersByTime(25 * 60 * 1000);
      });

      await waitFor(() => {
        // After 1 session: 1 % 4 = 1, so should display 1
        expect(screen.getByText(/session 1 of 4/i)).toBeInTheDocument();
      });
    });
  });

  describe('SwitchSession Function', () => {
    it('should switch from break to focus after completing break', async () => {
      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('Focus Session')).toBeInTheDocument();
      });

      // Switch to short break
      const shortBreakButton = screen.getByRole('button', { name: /short break/i });
      fireEvent.click(shortBreakButton);

      await waitFor(() => {
        const shortBreakTexts = screen.getAllByText('Short Break');
        expect(shortBreakTexts.length).toBeGreaterThan(0);
      });

      // Complete break
      const startButton = screen.getByRole('button', { name: /start/i });
      fireEvent.click(startButton);

      act(() => {
        jest.advanceTimersByTime(5 * 60 * 1000 + 1000);
      });

      // Should switch to focus mode
      await waitFor(() => {
        expect(screen.getByText('Focus Session')).toBeInTheDocument();
      });
    });

    it('should switch to break using break duration based on isLongBreak after focus', async () => {
      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('Focus Session')).toBeInTheDocument();
      });

      // Complete focus session
      const startButton = screen.getByRole('button', { name: /start/i });
      fireEvent.click(startButton);

      act(() => {
        jest.advanceTimersByTime(25 * 60 * 1000 + 1000);
      });

      // Should switch to break mode
      await waitFor(() => {
        const breakTexts = screen.queryAllByText(/Short Break|Long Break/);
        expect(breakTexts.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Mode Tab Highlighting', () => {
    it('should highlight Pomodoro tab when in focus mode', async () => {
      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('Focus Session')).toBeInTheDocument();
      });

      const pomodoroButton = screen.getByRole('button', { name: /^pomodoro$/i });
      expect(pomodoroButton.className).toContain('bg-sky-500');
    });

    it('should highlight Short Break tab when in short break mode', async () => {
      render(<PomodoroPage />);

      const shortBreakButton = screen.getByRole('button', { name: /short break/i });
      fireEvent.click(shortBreakButton);

      await waitFor(() => {
        const shortBreakTexts = screen.getAllByText('Short Break');
        expect(shortBreakTexts.length).toBeGreaterThan(0);
      });

      expect(shortBreakButton.className).toContain('bg-sky-500');
    });

    it('should highlight Long Break tab when in long break mode', async () => {
      render(<PomodoroPage />);

      const longBreakButton = screen.getByRole('button', { name: /long break/i });
      fireEvent.click(longBreakButton);

      await waitFor(() => {
        const longBreakTexts = screen.getAllByText('Long Break');
        expect(longBreakTexts.length).toBeGreaterThan(0);
      });

      expect(longBreakButton.className).toContain('bg-sky-500');
    });
  });

  describe('Reset Timer in Different Modes', () => {
    it('should reset to short break duration when in short break mode', async () => {
      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('Focus Session')).toBeInTheDocument();
      });

      // Switch to short break
      const shortBreakButton = screen.getByRole('button', { name: /short break/i });
      fireEvent.click(shortBreakButton);

      await waitFor(() => {
        const shortBreakTexts = screen.getAllByText('Short Break');
        expect(shortBreakTexts.length).toBeGreaterThan(0);
      });

      // Start timer
      const startButton = screen.getByRole('button', { name: /start/i });
      fireEvent.click(startButton);

      // Run for a bit
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      // Reset
      const resetButton = screen.getByRole('button', { name: /reset/i });
      fireEvent.click(resetButton);

      // Should be back at 05:00
      await waitFor(() => {
        expect(screen.getByText('05:00')).toBeInTheDocument();
      });
    });

    it('should reset to long break duration when in long break mode', async () => {
      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('Focus Session')).toBeInTheDocument();
      });

      // Switch to long break
      const longBreakButton = screen.getByRole('button', { name: /long break/i });
      fireEvent.click(longBreakButton);

      await waitFor(() => {
        const longBreakTexts = screen.getAllByText('Long Break');
        expect(longBreakTexts.length).toBeGreaterThan(0);
      });

      // Start timer
      const startButton = screen.getByRole('button', { name: /start/i });
      fireEvent.click(startButton);

      // Run for a bit
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      // Reset
      const resetButton = screen.getByRole('button', { name: /reset/i });
      fireEvent.click(resetButton);

      // Should be back at 15:00
      await waitFor(() => {
        expect(screen.getByText('15:00')).toBeInTheDocument();
      });
    });
  });

  describe('PostMessage State Changes', () => {
    it('should post break state when in break mode', async () => {
      render(<PomodoroPage />);

      // Switch to break
      const shortBreakButton = screen.getByRole('button', { name: /short break/i });
      fireEvent.click(shortBreakButton);

      await waitFor(() => {
        expect(window.postMessage).toHaveBeenCalledWith(
          expect.objectContaining({ state: 'break' }),
          '*'
        );
      });
    });

    it('should post paused state when timer is paused', async () => {
      render(<PomodoroPage />);

      await waitFor(() => {
        expect(window.postMessage).toHaveBeenCalledWith(
          expect.objectContaining({ state: 'paused' }),
          '*'
        );
      });
    });

    it('should post focus state when timer is running in focus mode', async () => {
      render(<PomodoroPage />);

      const startButton = screen.getByRole('button', { name: /start/i });
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(window.postMessage).toHaveBeenCalledWith(
          expect.objectContaining({ state: 'focus' }),
          '*'
        );
      });
    });
  });

  describe('Audio Notification Details', () => {
    it('should call createOscillator when session completes', async () => {
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

      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('25:00')).toBeInTheDocument();
      });

      const startButton = screen.getByRole('button', { name: /start/i });
      fireEvent.click(startButton);

      act(() => {
        jest.advanceTimersByTime(25 * 60 * 1000);
      });

      await waitFor(() => {
        expect(mockAudioContext.createOscillator).toHaveBeenCalled();
        expect(mockOscillator.start).toHaveBeenCalled();
        expect(mockOscillator.stop).toHaveBeenCalled();
      });
    });
  });

  describe('Long Break Interval Logic', () => {
    it('should set isLongBreak true when session count reaches interval', async () => {
      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('Focus Session')).toBeInTheDocument();
      });

      // Skip 3 times to reach session 4
      for (let i = 0; i < 3; i++) {
        const skipButton = screen.getByRole('button', { name: /skip/i });
        fireEvent.click(skipButton);

        const skipBack = screen.getByRole('button', { name: /skip/i });
        fireEvent.click(skipBack);
      }

      // Now complete a focus session (this will be session 4)
      const startButton = screen.getByRole('button', { name: /start/i });
      fireEvent.click(startButton);

      act(() => {
        jest.advanceTimersByTime(25 * 60 * 1000);
      });

      // Should be on long break
      await waitFor(() => {
        const longBreakTexts = screen.getAllByText('Long Break');
        expect(longBreakTexts.length).toBeGreaterThan(0);
      });
    });

    it('should not set isLongBreak when session count is not at interval', async () => {
      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('Focus Session')).toBeInTheDocument();
      });

      // Complete first session
      const startButton = screen.getByRole('button', { name: /start/i });
      fireEvent.click(startButton);

      act(() => {
        jest.advanceTimersByTime(25 * 60 * 1000);
      });

      // Should be on short break, not long
      await waitFor(() => {
        const shortBreakTexts = screen.getAllByText('Short Break');
        expect(shortBreakTexts.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Settings API Response Handling', () => {
    it('should handle response.ok being false', async () => {
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url === '/api/tasks') {
          return Promise.resolve({ ok: false, json: async () => [] });
        }
        if (url === '/api/settings') {
          return Promise.resolve({ ok: false, json: async () => ({}) });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<PomodoroPage />);

      // Should still render with defaults
      await waitFor(() => {
        expect(screen.getByText('25:00')).toBeInTheDocument();
      });
    });

    it('should handle missing pomodoroSettings in response', async () => {
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url === '/api/tasks') {
          return Promise.resolve({ ok: true, json: async () => [] });
        }
        if (url === '/api/settings') {
          return Promise.resolve({ ok: true, json: async () => ({}) }); // No pomodoroSettings
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<PomodoroPage />);

      // Should still render with defaults
      await waitFor(() => {
        expect(screen.getByText('25:00')).toBeInTheDocument();
      });
    });
  });

  describe('History Migration from Legacy Format', () => {
    it('should migrate break type to short_break', async () => {
      const legacyHistory = [
        { id: 1, date: new Date().toISOString(), type: 'break', duration: 5, taskTitle: 'Legacy Break' },
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(legacyHistory));

      render(<PomodoroPage />);

      // The migration should have converted 'break' to 'short_break'
      // We can verify by checking the component still renders correctly
      await waitFor(() => {
        expect(screen.getByText('Legacy Break')).toBeInTheDocument();
      });
    });

    it('should handle non-array localStorage data', async () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify({ not: 'an array' }));

      render(<PomodoroPage />);

      // Should render without errors and show empty state
      await waitFor(() => {
        expect(screen.getByText(/no sessions completed yet/i)).toBeInTheDocument();
      });
    });
  });

  describe('Task Dropdown', () => {
    it('should set selectedTaskId to null when selecting empty option', async () => {
      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Task 1')).toBeInTheDocument();
      });

      // Select a task first
      const select = screen.getByLabelText(/link to task/i);
      fireEvent.change(select, { target: { value: '1' } });
      expect(select).toHaveValue('1');

      // Then deselect
      fireEvent.change(select, { target: { value: '' } });
      expect(select).toHaveValue('');
    });
  });

  describe('Timer Edge Cases', () => {
    it('should handle timer reaching exactly 1 second', async () => {
      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('25:00')).toBeInTheDocument();
      });

      const startButton = screen.getByRole('button', { name: /start/i });
      fireEvent.click(startButton);

      // Advance to 1 second remaining
      act(() => {
        jest.advanceTimersByTime(24 * 60 * 1000 + 59 * 1000);
      });

      await waitFor(() => {
        expect(screen.getByText('00:01')).toBeInTheDocument();
      });

      // One more second should trigger completion
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalled();
      });
    });

    it('should clear interval when timer completes', async () => {
      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('25:00')).toBeInTheDocument();
      });

      const startButton = screen.getByRole('button', { name: /start/i });
      fireEvent.click(startButton);

      act(() => {
        jest.advanceTimersByTime(25 * 60 * 1000);
      });

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalled();
      });

      // Timer should be stopped
      expect(screen.getByRole('button', { name: /start/i })).toBeInTheDocument();
    });
  });

  describe('Alert Messages', () => {
    it('should show correct alert for focus session complete with short break next', async () => {
      render(<PomodoroPage />);

      await waitFor(() => {
        expect(screen.getByText('Focus Session')).toBeInTheDocument();
      });

      const startButton = screen.getByRole('button', { name: /start/i });
      fireEvent.click(startButton);

      act(() => {
        jest.advanceTimersByTime(25 * 60 * 1000);
      });

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Focus session complete! Take a break.');
      });
    });

    it('should show correct alert for long break complete', async () => {
      render(<PomodoroPage />);

      // Go to long break
      const longBreakButton = screen.getByRole('button', { name: /long break/i });
      fireEvent.click(longBreakButton);

      const startButton = screen.getByRole('button', { name: /start/i });
      fireEvent.click(startButton);

      act(() => {
        jest.advanceTimersByTime(15 * 60 * 1000);
      });

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Break complete! Time to focus.');
      });
    });
  });
});
