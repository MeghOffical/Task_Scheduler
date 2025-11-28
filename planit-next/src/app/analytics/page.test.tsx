import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AnalyticsPage from './page';

// Mock the ActivityHeatmap component
jest.mock('@/components/activity-heatmap', () => {
  return function MockActivityHeatmap({ activity }: { activity: { [date: string]: number } }) {
    return <div data-testid="activity-heatmap">Heatmap with {Object.keys(activity).length} days</div>;
  };
});

describe('AnalyticsPage', () => {
  let mockFetch: jest.Mock;
  const mockTasks = [
    {
      id: '1',
      title: 'Task 1',
      priority: 'high' as const,
      status: 'pending' as const,
      dueDate: '2025-12-31',
      createdAt: '2025-11-01',
    },
    {
      id: '2',
      title: 'Task 2',
      priority: 'medium' as const,
      status: 'in-progress' as const,
      dueDate: '2025-12-15',
      createdAt: '2025-11-02',
    },
    {
      id: '3',
      title: 'Task 3',
      priority: 'low' as const,
      status: 'completed' as const,
      dueDate: '2025-11-20',
      createdAt: '2025-11-03',
    },
    {
      id: '4',
      title: 'Task 4',
      priority: 'high' as const,
      status: 'pending' as const,
      dueDate: '2025-11-01', // Overdue task
      createdAt: '2025-10-20',
    },
  ];

  const mockActivity = {
    '2025-11-01': 2,
    '2025-11-02': 1,
    '2025-11-03': 3,
    '2025-11-04': 1,
    '2025-11-05': 2,
  };

  beforeEach(() => {
    mockFetch = jest.fn();
    global.fetch = mockFetch;

    // Mock localStorage
    Storage.prototype.getItem = jest.fn();
    Storage.prototype.setItem = jest.fn();

    // Mock Chart.js
    (window as any).Chart = jest.fn(function(this: any, ctx: any, config: any) {
      this.ctx = ctx;
      this.config = config;
      this.destroy = jest.fn();
    });
    (window as any).Chart.defaults = {
      color: '#9ca3af',
      borderColor: '#404040',
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    delete (window as any).Chart;
  });

  describe('Initial Render', () => {
    it('should render the page title', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockTasks,
      });

      render(<AnalyticsPage />);
      
      expect(screen.getByText('Analytics')).toBeInTheDocument();
    });

    it('should render the daily activity section', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockTasks,
      });

      render(<AnalyticsPage />);
      
      expect(screen.getByText('Daily Activity')).toBeInTheDocument();
      expect(screen.getByText('Your task completion activity over the past year')).toBeInTheDocument();
    });

    it('should render all chart sections', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockTasks,
      });

      render(<AnalyticsPage />);
      
      expect(screen.getByText('Tasks by Status')).toBeInTheDocument();
      expect(screen.getByText('Tasks by Priority')).toBeInTheDocument();
      expect(screen.getByText('Pomodoro Sessions This Week')).toBeInTheDocument();
      expect(screen.getByText('Productivity Trend')).toBeInTheDocument();
    });

    it('should render stat cards', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockTasks,
      });

      render(<AnalyticsPage />);
      
      expect(screen.getByText('Total active days')).toBeInTheDocument();
      expect(screen.getByText('Max streak')).toBeInTheDocument();
      expect(screen.getByText('Current streak')).toBeInTheDocument();
    });
  });

  describe('Data Fetching', () => {
    it('should fetch tasks on mount', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockTasks,
      });

      render(<AnalyticsPage />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/tasks', { cache: 'no-store' });
      });
    });

    it('should fetch activity data on mount', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTasks,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ activity: mockActivity }),
        });

      render(<AnalyticsPage />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/analytics/activity', { cache: 'no-store' });
      });
    });

    it('should handle tasks fetch failure gracefully', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
      });

      render(<AnalyticsPage />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/tasks', { cache: 'no-store' });
      });

      // Should not crash
      expect(screen.getByText('Analytics')).toBeInTheDocument();
    });

    it('should handle activity fetch failure gracefully', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTasks,
        })
        .mockResolvedValueOnce({
          ok: false,
        });

      render(<AnalyticsPage />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/analytics/activity', { cache: 'no-store' });
      });

      // Should not crash
      expect(screen.getByText('Analytics')).toBeInTheDocument();
    });

    it('should handle fetch errors gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      render(<AnalyticsPage />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      // Should not crash
      expect(screen.getByText('Analytics')).toBeInTheDocument();
    });
  });

  describe('Migration Logic', () => {
    it('should attempt migration if not done before', async () => {
      (Storage.prototype.getItem as jest.Mock).mockReturnValue(null);
      
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTasks,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ activity: mockActivity }),
        });

      render(<AnalyticsPage />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/analytics/migrate-history', {
          method: 'POST',
          cache: 'no-store',
        });
      });
    });

    it('should set migration flag after successful migration', async () => {
      (Storage.prototype.getItem as jest.Mock).mockReturnValue(null);
      
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTasks,
        })
        .mockResolvedValueOnce({
          ok: true,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ activity: mockActivity }),
        });

      render(<AnalyticsPage />);

      await waitFor(() => {
        expect(Storage.prototype.setItem).toHaveBeenCalledWith('completionHistoryMigrated', 'true');
      });
    });

    it('should skip migration if already done', async () => {
      (Storage.prototype.getItem as jest.Mock).mockReturnValue('true');
      
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTasks,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ activity: mockActivity }),
        });

      render(<AnalyticsPage />);

      await waitFor(() => {
        expect(mockFetch).not.toHaveBeenCalledWith('/api/analytics/migrate-history', expect.any(Object));
      });
    });

    it('should handle migration errors gracefully', async () => {
      (Storage.prototype.getItem as jest.Mock).mockReturnValue(null);
      
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTasks,
        })
        .mockRejectedValueOnce(new Error('Migration failed'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ activity: mockActivity }),
        });

      render(<AnalyticsPage />);

      // Should still fetch activity even if migration fails
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/analytics/activity', { cache: 'no-store' });
      });
    });
  });

  describe('Statistics Calculation', () => {
    it('should calculate total active days', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTasks,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ activity: mockActivity }),
        });

      render(<AnalyticsPage />);

      await waitFor(() => {
        const activeDaysElement = screen.getByText('Total active days').previousElementSibling;
        expect(activeDaysElement).toHaveTextContent('5'); // 5 days with activity
      }, { timeout: 3000 });
    });

    it('should calculate current streak', async () => {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const recentActivity = {
        [today]: 2,
        [yesterdayStr]: 1,
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTasks,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ activity: recentActivity }),
        });

      render(<AnalyticsPage />);

      await waitFor(() => {
        const currentStreakElement = screen.getByText('Current streak').previousElementSibling;
        expect(currentStreakElement).toBeInTheDocument();
      });
    });

    it('should handle empty activity data', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTasks,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ activity: {} }),
        });

      render(<AnalyticsPage />);

      await waitFor(() => {
        const activeDaysElement = screen.getByText('Total active days').previousElementSibling;
        expect(activeDaysElement).toHaveTextContent('0'); // 0 total days
      }, { timeout: 3000 });
    });
  });

  describe('Activity Heatmap', () => {
    it('should render ActivityHeatmap component', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTasks,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ activity: mockActivity }),
        });

      render(<AnalyticsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('activity-heatmap')).toBeInTheDocument();
      });
    });

    it('should pass activity data to ActivityHeatmap', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTasks,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ activity: mockActivity }),
        });

      render(<AnalyticsPage />);

      await waitFor(() => {
        expect(screen.getByText(/Heatmap with 5 days/)).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('Chart Rendering', () => {
    it('should load Chart.js from CDN when not present', async () => {
      delete (window as any).Chart;
      const appendChildSpy = jest.spyOn(document.body, 'appendChild');

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockTasks,
      });

      render(<AnalyticsPage />);

      await waitFor(() => {
        const scriptCalls = appendChildSpy.mock.calls.filter(call => {
          const element = call[0];
          return element instanceof HTMLScriptElement && element.src.includes('chart.js');
        });
        expect(scriptCalls.length).toBeGreaterThan(0);
      });

      appendChildSpy.mockRestore();
    });

    it('should render status chart with correct data', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockTasks,
      });

      const MockChart = jest.fn(function(this: any, ctx: any, config: any) {
        this.config = config;
        this.destroy = jest.fn();
      });
      (window as any).Chart = MockChart;
      (window as any).Chart.defaults = { color: '#9ca3af', borderColor: '#404040' };

      render(<AnalyticsPage />);

      await waitFor(() => {
        const statusChartCall = MockChart.mock.calls.find(call => 
          call[1]?.type === 'doughnut'
        );
        expect(statusChartCall).toBeDefined();
      });
    });

    it('should render priority chart as bar chart', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockTasks,
      });

      const MockChart = jest.fn(function(this: any, ctx: any, config: any) {
        this.config = config;
        this.destroy = jest.fn();
      });
      (window as any).Chart = MockChart;
      (window as any).Chart.defaults = { color: '#9ca3af', borderColor: '#404040' };

      render(<AnalyticsPage />);

      await waitFor(() => {
        const priorityChartCall = MockChart.mock.calls.find(call => 
          call[1]?.type === 'bar'
        );
        expect(priorityChartCall).toBeDefined();
      });
    });

    it('should render productivity chart as line chart', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockTasks,
      });

      const MockChart = jest.fn(function(this: any, ctx: any, config: any) {
        this.config = config;
        this.destroy = jest.fn();
      });
      (window as any).Chart = MockChart;
      (window as any).Chart.defaults = { color: '#9ca3af', borderColor: '#404040' };

      render(<AnalyticsPage />);

      await waitFor(() => {
        const lineChartCalls = MockChart.mock.calls.filter(call => 
          call[1]?.type === 'line'
        );
        expect(lineChartCalls.length).toBeGreaterThan(0);
      });
    });

    it('should destroy charts on unmount', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockTasks,
      });

      const destroyMock = jest.fn();
      const MockChart = jest.fn(function(this: any) {
        this.destroy = destroyMock;
      });
      (window as any).Chart = MockChart;
      (window as any).Chart.defaults = { color: '#9ca3af', borderColor: '#404040' };

      const { unmount } = render(<AnalyticsPage />);

      await waitFor(() => {
        expect(MockChart).toHaveBeenCalled();
      });

      unmount();

      expect(destroyMock).toHaveBeenCalled();
    });
  });

  describe('Overdue Task Detection', () => {
    it('should identify overdue tasks', async () => {
      const overdueTask = {
        id: '5',
        title: 'Overdue Task',
        priority: 'high' as const,
        status: 'pending' as const,
        dueDate: '2020-01-01',
      };

      (Storage.prototype.getItem as jest.Mock).mockReturnValue('true'); // Skip migration

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [overdueTask],
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ activity: {} }),
        });

      const MockChart = jest.fn(function(this: any, ctx: any, config: any) {
        this.config = config;
        this.destroy = jest.fn();
      });
      (window as any).Chart = MockChart;
      (window as any).Chart.defaults = { color: '#9ca3af', borderColor: '#404040' };

      render(<AnalyticsPage />);

      await waitFor(() => {
        // Verify that status chart is created with overdue as a category
        const statusChartCall = MockChart.mock.calls.find(call => 
          call[1]?.type === 'doughnut'
        );
        expect(statusChartCall).toBeDefined();
        // Verify labels include "Overdue"
        const labels = statusChartCall?.[1]?.data?.labels;
        expect(labels).toContain('Overdue');
      }, { timeout: 3000 });
    });

    it('should not mark completed tasks as overdue', async () => {
      const completedTask = {
        id: '6',
        title: 'Completed Task',
        priority: 'high' as const,
        status: 'completed' as const,
        dueDate: '2020-01-01',
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => [completedTask],
      });

      const MockChart = jest.fn(function(this: any, ctx: any, config: any) {
        this.config = config;
        this.destroy = jest.fn();
      });
      (window as any).Chart = MockChart;
      (window as any).Chart.defaults = { color: '#9ca3af', borderColor: '#404040' };

      render(<AnalyticsPage />);

      await waitFor(() => {
        const statusChartCall = MockChart.mock.calls.find(call => 
          call[1]?.type === 'doughnut'
        );
        expect(statusChartCall).toBeDefined();
        // Overdue count should be 0
        const overdueData = statusChartCall?.[1]?.data?.datasets?.[0]?.data?.[3];
        expect(overdueData).toBe(0);
      });
    });
  });

  describe('Layout and Styling', () => {
    it('should have proper spacing classes', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockTasks,
      });

      const { container } = render(<AnalyticsPage />);
      
      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv).toHaveClass('space-y-8');
    });

    it('should use glass-panel styling for cards', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockTasks,
      });

      const { container } = render(<AnalyticsPage />);
      
      const glassPanels = container.querySelectorAll('.glass-panel');
      expect(glassPanels.length).toBeGreaterThan(0);
    });

    it('should use responsive grid layout', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockTasks,
      });

      const { container } = render(<AnalyticsPage />);
      
      const gridContainer = container.querySelector('.grid');
      expect(gridContainer).toHaveClass('grid-cols-1', 'lg:grid-cols-2');
    });

    it('should have proper height for chart containers', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockTasks,
      });

      const { container } = render(<AnalyticsPage />);
      
      const chartContainers = container.querySelectorAll('.h-72');
      expect(chartContainers.length).toBe(4); // 4 charts
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockTasks,
      });

      render(<AnalyticsPage />);
      
      const h1 = screen.getByRole('heading', { level: 1, name: 'Analytics' });
      expect(h1).toBeInTheDocument();

      const h2Headings = screen.getAllByRole('heading', { level: 2 });
      expect(h2Headings.length).toBeGreaterThan(0);
    });

    it('should have descriptive section headings', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockTasks,
      });

      render(<AnalyticsPage />);
      
      expect(screen.getByRole('heading', { name: 'Daily Activity' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Tasks by Status' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Tasks by Priority' })).toBeInTheDocument();
    });

    it('should have semantic stat labels', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockTasks,
      });

      render(<AnalyticsPage />);
      
      expect(screen.getByText('Total active days')).toBeInTheDocument();
      expect(screen.getByText('Max streak')).toBeInTheDocument();
      expect(screen.getByText('Current streak')).toBeInTheDocument();
    });
  });

  describe('Theme Integration', () => {
    it('should apply dark theme defaults to charts', async () => {
      document.documentElement.classList.add('dark');

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockTasks,
      });

      const MockChart = jest.fn(function(this: any) {
        this.destroy = jest.fn();
      });
      (window as any).Chart = MockChart;
      (window as any).Chart.defaults = { color: '#9ca3af', borderColor: '#404040' };

      render(<AnalyticsPage />);

      await waitFor(() => {
        expect((window as any).Chart.defaults.color).toBeDefined();
      });

      document.documentElement.classList.remove('dark');
    });

    it('should listen for storage events to rerender charts', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockTasks,
      });

      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

      render(<AnalyticsPage />);

      await waitFor(() => {
        const storageListenerCalls = addEventListenerSpy.mock.calls.filter(
          call => call[0] === 'storage'
        );
        expect(storageListenerCalls.length).toBeGreaterThan(0);
      });

      addEventListenerSpy.mockRestore();
    });

    it('should remove storage listener on unmount', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockTasks,
      });

      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      const { unmount } = render(<AnalyticsPage />);

      await waitFor(() => {
        expect(screen.getByText('Analytics')).toBeInTheDocument();
      });

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('storage', expect.any(Function));

      removeEventListenerSpy.mockRestore();
    });
  });

  describe('Content Validation', () => {
    it('should display all required sections', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockTasks,
      });

      render(<AnalyticsPage />);
      
      expect(screen.getByText('Analytics')).toBeInTheDocument();
      expect(screen.getByText('Daily Activity')).toBeInTheDocument();
      expect(screen.getByText('Tasks by Status')).toBeInTheDocument();
      expect(screen.getByText('Tasks by Priority')).toBeInTheDocument();
      expect(screen.getByText('Pomodoro Sessions This Week')).toBeInTheDocument();
      expect(screen.getByText('Productivity Trend')).toBeInTheDocument();
    });

    it('should display activity description text', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockTasks,
      });

      render(<AnalyticsPage />);
      
      expect(screen.getByText('Your task completion activity over the past year')).toBeInTheDocument();
    });
  });

  describe('Canvas Elements', () => {
    it('should render canvas elements for all charts', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockTasks,
      });

      const { container } = render(<AnalyticsPage />);
      
      const canvasElements = container.querySelectorAll('canvas');
      expect(canvasElements.length).toBe(4); // Status, Priority, Productivity, Pomodoro
    });
  });
});
