import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DashboardPage from './page';

// Mock PageWrapper component
jest.mock('@/components/page-wrapper', () => {
  return function MockPageWrapper({ children }: { children: React.ReactNode }) {
    return <div data-testid="page-wrapper">{children}</div>;
  };
});

// Mock fetch globally
global.fetch = jest.fn();

// Mock window.confirm for delete operations
Object.defineProperty(window, 'confirm', {
  value: jest.fn(),
  writable: true,
});

// Mock console methods to avoid noise in tests
const originalConsole = { ...console };
beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  Object.assign(console, originalConsole);
});

describe('DashboardPage', () => {
  const mockStats = {
    totalTasks: 15,
    pendingTasks: 5,
    inProgressTasks: 3,
    completedTasks: 6,
    overdueTasks: 1,
    highPriority: 4,
    mediumPriority: 7,
    lowPriority: 4,
  };

  const mockTasks = [
    {
      id: '1',
      title: 'Complete project documentation',
      description: 'Write comprehensive documentation',
      priority: 'high' as const,
      status: 'in-progress' as const,
      dueDate: '2025-12-01',
      startTime: '09:00',
      endTime: '17:00',
      createdAt: '2025-11-20T09:00:00Z',
      userId: 'user1',
    },
    {
      id: '2',
      title: 'Review code changes',
      description: 'Review PR for new features',
      priority: 'medium' as const,
      status: 'pending' as const,
      dueDate: '2025-11-30',
      startTime: null,
      endTime: null,
      createdAt: '2025-11-19T10:00:00Z',
      userId: 'user1',
    },
    {
      id: '3',
      title: 'Update dependencies',
      priority: 'low' as const,
      status: 'completed' as const,
      dueDate: null,
      createdAt: '2025-11-18T11:00:00Z',
      userId: 'user1',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/tasks/stats')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockStats),
        });
      } else if (url.includes('/api/tasks')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockTasks),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    // Mock timers for polling
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  // Initial Render and Loading Tests
  describe('Initial Render and Loading', () => {
    test('renders dashboard with loading spinner initially', () => {
      const { container } = render(<DashboardPage />);
      
      expect(screen.getByTestId('page-wrapper')).toBeInTheDocument();
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    test('renders dashboard title and welcome message', async () => {
      render(<DashboardPage />);
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
      });
      
      expect(screen.getByText(/welcome back! here's your task overview/i)).toBeInTheDocument();
    });

    test('displays last updated timestamp', async () => {
      render(<DashboardPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/last updated:/i)).toBeInTheDocument();
      });
    });

    test('renders all stat cards with correct data', async () => {
      render(<DashboardPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Total Tasks')).toBeInTheDocument();
        expect(screen.getByText('15')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Pending')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      
      expect(screen.getByText('In Progress')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      
      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.getByText('6')).toBeInTheDocument();
      
      expect(screen.getByText('Overdue')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  // Data Fetching Tests
  describe('Data Fetching', () => {
    test('fetches dashboard data on component mount', async () => {
      render(<DashboardPage />);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringMatching(/\/api\/tasks\?t=\d+/),
          { cache: 'no-store' }
        );
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringMatching(/\/api\/tasks\/stats\?t=\d+/),
          { cache: 'no-store' }
        );
      });
    });

    test('handles successful data fetch', async () => {
      render(<DashboardPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Complete project documentation')).toBeInTheDocument();
        expect(screen.getByText('Review code changes')).toBeInTheDocument();
      });
    });

    test('handles fetch errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      
      render(<DashboardPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });

    test('handles failed API responses', async () => {
      (global.fetch as jest.Mock).mockImplementation(() =>
        Promise.resolve({
          ok: false,
          statusText: 'Internal Server Error',
        })
      );
      
      render(<DashboardPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/tasks fetch failed: internal server error/i)).toBeInTheDocument();
      });
    });
  });

  // Recent Tasks Section Tests
  describe('Recent Tasks Section', () => {
    test('renders recent tasks section with correct title', async () => {
      render(<DashboardPage />);
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /recent tasks/i })).toBeInTheDocument();
      });
    });

    test('displays task count information', async () => {
      render(<DashboardPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/showing.*of.*tasks/i)).toBeInTheDocument();
      });
    });

    test('renders task cards with correct information', async () => {
      render(<DashboardPage />);
      
      await waitFor(() => {
        // Check for task titles
        expect(screen.getByText('Complete project documentation')).toBeInTheDocument();
        expect(screen.getByText('Review code changes')).toBeInTheDocument();
        expect(screen.getByText('Update dependencies')).toBeInTheDocument();
      });
    });

    test('displays empty state when no tasks available', async () => {
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/tasks/stats')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ ...mockStats, totalTasks: 0 }),
          });
        } else if (url.includes('/api/tasks')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([]),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });
      
      render(<DashboardPage />);
      
      await waitFor(() => {
        expect(screen.getByText('No tasks available')).toBeInTheDocument();
        expect(screen.getByText(/start by creating your first task!/i)).toBeInTheDocument();
      });
    });
  });

  // Task Interaction Tests
  describe('Task Interactions', () => {
    test('loads and displays task data', async () => {
      render(<DashboardPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Complete project documentation')).toBeInTheDocument();
        expect(screen.getByText('Review code changes')).toBeInTheDocument();
        expect(screen.getByText('Update dependencies')).toBeInTheDocument();
      });
    });

    test('handles task data loading', async () => {
      render(<DashboardPage />);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringMatching(/\/api\/tasks\?t=\d+/),
          { cache: 'no-store' }
        );
      });
    });
  });

  // Priority Breakdown Tests
  describe('Priority Breakdown', () => {
    test('loads dashboard data successfully', async () => {
      render(<DashboardPage />);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringMatching(/\/api\/tasks\/stats\?t=\d+/),
          { cache: 'no-store' }
        );
      });
    });
  });

  // Real-time Updates Tests
  describe('Real-time Updates', () => {
    test('sets up polling interval for updates', async () => {
      const { unmount } = render(<DashboardPage />);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
      
      const initialCallCount = (global.fetch as jest.Mock).mock.calls.length;
      
      // Fast-forward 10 seconds
      act(() => {
        jest.advanceTimersByTime(10000);
      });
      
      expect(global.fetch).toHaveBeenCalledTimes(initialCallCount + 2); // +2 for tasks and stats
      
      unmount();
    });

    test('handles task update events', async () => {
      render(<DashboardPage />);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
      
      const initialCallCount = (global.fetch as jest.Mock).mock.calls.length;
      
      // Simulate task update event
      act(() => {
        window.dispatchEvent(new CustomEvent('task-updated'));
      });
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(initialCallCount + 2);
      });
    });

    test('handles postMessage events', async () => {
      render(<DashboardPage />);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
      
      const initialCallCount = (global.fetch as jest.Mock).mock.calls.length;
      
      // Simulate postMessage event
      act(() => {
        window.dispatchEvent(new MessageEvent('message', {
          data: { type: 'task-updated' }
        }));
      });
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(initialCallCount + 2);
      });
    });

    test('cleans up event listeners and polling on unmount', async () => {
      const { unmount } = render(<DashboardPage />);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
      
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      
      unmount();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('task-updated', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('message', expect.any(Function));
      expect(clearIntervalSpy).toHaveBeenCalled();
      
      removeEventListenerSpy.mockRestore();
      clearIntervalSpy.mockRestore();
    });
  });

  // Responsive Design Tests
  describe('Responsive Design', () => {
    test('renders dashboard layout', async () => {
      render(<DashboardPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Total Tasks')).toBeInTheDocument();
      });
    });

    test('displays recent tasks section', async () => {
      render(<DashboardPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Recent Tasks')).toBeInTheDocument();
      });
    });
  });

  // Error Handling Tests
  describe('Error Handling', () => {
    test('displays error message when data fetch fails', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      
      render(<DashboardPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
        expect(screen.getByText('Network error')).toHaveClass(
          'text-center',
          'text-red-600',
          'dark:text-red-400'
        );
      });
    });

    test('continues working after fetch error recovery', async () => {
      // Start with error
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      
      render(<DashboardPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
      
      // Fix the error
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/tasks/stats')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockStats),
          });
        } else if (url.includes('/api/tasks')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockTasks),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });
      
      // Trigger polling update
      act(() => {
        jest.advanceTimersByTime(10000);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Complete project documentation')).toBeInTheDocument();
        expect(screen.queryByText('Network error')).not.toBeInTheDocument();
      });
    });
  });

  // Accessibility Tests
  describe('Accessibility', () => {
    test('has proper heading hierarchy', async () => {
      render(<DashboardPage />);
      
      await waitFor(() => {
        const mainHeading = screen.getByRole('heading', { level: 1 });
        expect(mainHeading).toHaveTextContent('Dashboard');
      });
    });

    test('loading spinner has proper attributes', () => {
      const { container } = render(<DashboardPage />);
      
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('animate-spin');
    });
  });

  // Performance Tests
  describe('Performance', () => {
    test('prevents unnecessary re-renders with useCallback', async () => {
      const fetchSpy = jest.spyOn(global, 'fetch');
      
      const { rerender } = render(<DashboardPage />);
      
      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalled();
      });
      
      const initialCallCount = fetchSpy.mock.calls.length;
      
      // Rerender component
      rerender(<DashboardPage />);
      
      // Should not trigger additional fetch calls
      expect(fetchSpy).toHaveBeenCalledTimes(initialCallCount);
      
      fetchSpy.mockRestore();
    });

    test('uses cache busting parameters in API calls', async () => {
      render(<DashboardPage />);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringMatching(/\/api\/tasks\?t=\d+/),
          { cache: 'no-store' }
        );
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringMatching(/\/api\/tasks\/stats\?t=\d+/),
          { cache: 'no-store' }
        );
      });
    });
  });
});
