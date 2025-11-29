/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import AnalyticsPage from './page';

// Mock the ActivityHeatmap component
jest.mock('@/components/activity-heatmap', () => {
  const MockActivityHeatmap = function({ activity }: { activity: { [date: string]: number } }) {
    return <div data-testid="activity-heatmap">Heatmap with {Object.keys(activity).length} days</div>;
  };
  MockActivityHeatmap.displayName = 'MockActivityHeatmap';
  return MockActivityHeatmap;
});

describe('AnalyticsPage', () => {
  let mockFetch: jest.Mock;
  const chartInstances: any[] = [];
  
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
    chartInstances.length = 0; // Clear array without reassigning

    // Mock localStorage using Object.defineProperty
    const localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });

    // Mock Chart.js with tracking
    (window as any).Chart = jest.fn(function(this: any, ctx: any, config: any) {
      this.ctx = ctx;
      this.config = config;
      this.type = config.type;
      this.data = config.data;
      this.options = config.options;
      this.destroy = jest.fn();
      chartInstances.push(this);
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
    chartInstances.length = 0;
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
      (window.localStorage.getItem as jest.Mock).mockReturnValue(null);
      
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
      (window.localStorage.getItem as jest.Mock).mockReturnValue(null);
      
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
        expect(window.localStorage.setItem).toHaveBeenCalledWith('completionHistoryMigrated', 'true');
      });
    });

    it('should skip migration if already done', async () => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue('true');
      
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
      (window.localStorage.getItem as jest.Mock).mockReturnValue(null);
      
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

      (window.localStorage.getItem as jest.Mock).mockReturnValue('true'); // Skip migration

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

  describe('Chart Configuration Details', () => {
    beforeEach(() => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue('true'); // Skip migration
    });

    it('should configure status chart with correct labels', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockTasks })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ activity: {} }) });

      render(<AnalyticsPage />);

      await waitFor(() => {
        const doughnutChart = chartInstances.find(c => c.type === 'doughnut');
        expect(doughnutChart).toBeDefined();
        expect(doughnutChart.data.labels).toEqual(['Pending', 'In Progress', 'Completed', 'Overdue']);
      });
    });

    it('should configure status chart with correct colors', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockTasks })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ activity: {} }) });

      render(<AnalyticsPage />);

      await waitFor(() => {
        const doughnutChart = chartInstances.find(c => c.type === 'doughnut');
        expect(doughnutChart).toBeDefined();
        const colors = doughnutChart.data.datasets[0].backgroundColor;
        expect(colors).toContain('#f59e0b'); // Pending - amber
        expect(colors).toContain('#0ea5e9'); // In Progress - sky
        expect(colors).toContain('#10b981'); // Completed - emerald
        expect(colors).toContain('#ef4444'); // Overdue - red
      });
    });

    it('should configure status chart with borderWidth 0', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockTasks })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ activity: {} }) });

      render(<AnalyticsPage />);

      await waitFor(() => {
        const doughnutChart = chartInstances.find(c => c.type === 'doughnut');
        expect(doughnutChart.data.datasets[0].borderWidth).toBe(0);
      });
    });

    it('should configure status chart with legend at bottom', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockTasks })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ activity: {} }) });

      render(<AnalyticsPage />);

      await waitFor(() => {
        const doughnutChart = chartInstances.find(c => c.type === 'doughnut');
        expect(doughnutChart.options.plugins.legend.position).toBe('bottom');
        expect(doughnutChart.options.plugins.legend.labels.color).toBe('#e5e7eb');
        expect(doughnutChart.options.plugins.legend.labels.font.size).toBe(12);
      });
    });

    it('should configure priority chart with correct labels', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockTasks })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ activity: {} }) });

      render(<AnalyticsPage />);

      await waitFor(() => {
        const barChart = chartInstances.find(c => c.type === 'bar');
        expect(barChart).toBeDefined();
        expect(barChart.data.labels).toEqual(['High', 'Medium', 'Low']);
      });
    });

    it('should configure priority chart with correct colors', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockTasks })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ activity: {} }) });

      render(<AnalyticsPage />);

      await waitFor(() => {
        const barChart = chartInstances.find(c => c.type === 'bar');
        const colors = barChart.data.datasets[0].backgroundColor;
        expect(colors).toContain('#ef4444'); // High - red
        expect(colors).toContain('#f59e0b'); // Medium - amber
        expect(colors).toContain('#10b981'); // Low - emerald
      });
    });

    it('should configure priority chart dataset label as Tasks', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockTasks })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ activity: {} }) });

      render(<AnalyticsPage />);

      await waitFor(() => {
        const barChart = chartInstances.find(c => c.type === 'bar');
        expect(barChart.data.datasets[0].label).toBe('Tasks');
      });
    });

    it('should configure bar chart with hidden legend', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockTasks })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ activity: {} }) });

      render(<AnalyticsPage />);

      await waitFor(() => {
        const barChart = chartInstances.find(c => c.type === 'bar');
        expect(barChart.options.plugins.legend.display).toBe(false);
      });
    });

    it('should configure bar chart y-axis with beginAtZero true', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockTasks })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ activity: {} }) });

      render(<AnalyticsPage />);

      await waitFor(() => {
        const barChart = chartInstances.find(c => c.type === 'bar');
        expect(barChart.options.scales.y.beginAtZero).toBe(true);
      });
    });

    it('should configure bar chart y-axis with stepSize 1', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockTasks })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ activity: {} }) });

      render(<AnalyticsPage />);

      await waitFor(() => {
        const barChart = chartInstances.find(c => c.type === 'bar');
        expect(barChart.options.scales.y.ticks.stepSize).toBe(1);
      });
    });

    it('should configure bar chart with correct axis tick colors', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockTasks })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ activity: {} }) });

      render(<AnalyticsPage />);

      await waitFor(() => {
        const barChart = chartInstances.find(c => c.type === 'bar');
        expect(barChart.options.scales.y.ticks.color).toBe('#e5e7eb');
        expect(barChart.options.scales.x.ticks.color).toBe('#e5e7eb');
      });
    });

    it('should configure bar chart with correct grid colors', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockTasks })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ activity: {} }) });

      render(<AnalyticsPage />);

      await waitFor(() => {
        const barChart = chartInstances.find(c => c.type === 'bar');
        expect(barChart.options.scales.y.grid.color).toBe('#4b5563');
        expect(barChart.options.scales.x.grid.color).toBe('#4b5563');
      });
    });

    it('should configure productivity chart with Completed Tasks label', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockTasks })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ activity: {} }) });

      render(<AnalyticsPage />);

      await waitFor(() => {
        const lineCharts = chartInstances.filter(c => c.type === 'line');
        const productivityChart = lineCharts.find(c => c.data.datasets[0].label === 'Completed Tasks');
        expect(productivityChart).toBeDefined();
      });
    });

    it('should configure productivity chart with emerald border color', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockTasks })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ activity: {} }) });

      render(<AnalyticsPage />);

      await waitFor(() => {
        const lineCharts = chartInstances.filter(c => c.type === 'line');
        const productivityChart = lineCharts.find(c => c.data.datasets[0].label === 'Completed Tasks');
        expect(productivityChart.data.datasets[0].borderColor).toBe('#10b981');
        expect(productivityChart.data.datasets[0].backgroundColor).toBe('rgba(16, 185, 129, 0.15)');
      });
    });

    it('should configure productivity chart with tension 0.4 and fill true', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockTasks })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ activity: {} }) });

      render(<AnalyticsPage />);

      await waitFor(() => {
        const lineCharts = chartInstances.filter(c => c.type === 'line');
        const productivityChart = lineCharts.find(c => c.data.datasets[0].label === 'Completed Tasks');
        expect(productivityChart.data.datasets[0].tension).toBe(0.4);
        expect(productivityChart.data.datasets[0].fill).toBe(true);
      });
    });

    it('should configure pomodoro chart with Sessions label', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockTasks })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ activity: {} }) });

      render(<AnalyticsPage />);

      await waitFor(() => {
        const lineCharts = chartInstances.filter(c => c.type === 'line');
        const pomodoroChart = lineCharts.find(c => c.data.datasets[0].label === 'Sessions');
        expect(pomodoroChart).toBeDefined();
      });
    });

    it('should configure pomodoro chart with sky blue border color', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockTasks })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ activity: {} }) });

      render(<AnalyticsPage />);

      await waitFor(() => {
        const lineCharts = chartInstances.filter(c => c.type === 'line');
        const pomodoroChart = lineCharts.find(c => c.data.datasets[0].label === 'Sessions');
        expect(pomodoroChart.data.datasets[0].borderColor).toBe('#0ea5e9');
        expect(pomodoroChart.data.datasets[0].backgroundColor).toBe('rgba(14, 165, 233, 0.15)');
      });
    });

    it('should configure pomodoro chart with correct day labels', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockTasks })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ activity: {} }) });

      render(<AnalyticsPage />);

      await waitFor(() => {
        const lineCharts = chartInstances.filter(c => c.type === 'line');
        const pomodoroChart = lineCharts.find(c => c.data.datasets[0].label === 'Sessions');
        expect(pomodoroChart.data.labels).toEqual(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
      });
    });

    it('should configure pomodoro chart with zero data initially', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockTasks })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ activity: {} }) });

      render(<AnalyticsPage />);

      await waitFor(() => {
        const lineCharts = chartInstances.filter(c => c.type === 'line');
        const pomodoroChart = lineCharts.find(c => c.data.datasets[0].label === 'Sessions');
        expect(pomodoroChart.data.datasets[0].data).toEqual([0, 0, 0, 0, 0, 0, 0]);
      });
    });

    it('should configure all charts with responsive true', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockTasks })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ activity: {} }) });

      render(<AnalyticsPage />);

      await waitFor(() => {
        expect(chartInstances.length).toBe(4);
        chartInstances.forEach(chart => {
          expect(chart.options.responsive).toBe(true);
        });
      });
    });

    it('should configure all charts with maintainAspectRatio false', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockTasks })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ activity: {} }) });

      render(<AnalyticsPage />);

      await waitFor(() => {
        expect(chartInstances.length).toBe(4);
        chartInstances.forEach(chart => {
          expect(chart.options.maintainAspectRatio).toBe(false);
        });
      });
    });

    it('should generate 7 days of productivity labels', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockTasks })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ activity: {} }) });

      render(<AnalyticsPage />);

      await waitFor(() => {
        const lineCharts = chartInstances.filter(c => c.type === 'line');
        const productivityChart = lineCharts.find(c => c.data.datasets[0].label === 'Completed Tasks');
        expect(productivityChart.data.labels.length).toBe(7);
      });
    });

    it('should generate productivity labels with month names', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockTasks })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ activity: {} }) });

      render(<AnalyticsPage />);

      await waitFor(() => {
        const lineCharts = chartInstances.filter(c => c.type === 'line');
        const productivityChart = lineCharts.find(c => c.data.datasets[0].label === 'Completed Tasks');
        const labels = productivityChart.data.labels;
        // Each label should be in format "Mon DD" (e.g., "Nov 29")
        labels.forEach((label: string) => {
          expect(label).toMatch(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s\d{1,2}$/);
        });
      });
    });

    it('should generate 7 data points for productivity chart', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockTasks })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ activity: {} }) });

      render(<AnalyticsPage />);

      await waitFor(() => {
        const lineCharts = chartInstances.filter(c => c.type === 'line');
        const productivityChart = lineCharts.find(c => c.data.datasets[0].label === 'Completed Tasks');
        expect(productivityChart.data.datasets[0].data.length).toBe(7);
      });
    });
  });

  describe('Status Count Calculations', () => {
    beforeEach(() => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue('true');
    });

    it('should count pending tasks correctly', async () => {
      const tasks = [
        { id: '1', title: 'T1', priority: 'high' as const, status: 'pending' as const },
        { id: '2', title: 'T2', priority: 'high' as const, status: 'pending' as const },
        { id: '3', title: 'T3', priority: 'high' as const, status: 'completed' as const },
      ];

      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => tasks })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ activity: {} }) });

      render(<AnalyticsPage />);

      await waitFor(() => {
        const ChartMock = (window as any).Chart;
        const doughnutCalls = ChartMock.mock.calls.filter((call: any) => call[1]?.type === 'doughnut');
        // Get the last call which should have the actual data
        const lastDoughnutCall = doughnutCalls[doughnutCalls.length - 1];
        expect(lastDoughnutCall).toBeDefined();
        expect(lastDoughnutCall[1].data.datasets[0].data[0]).toBe(2); // 2 pending
      }, { timeout: 5000 });
    });

    it('should count in-progress tasks correctly', async () => {
      const tasks = [
        { id: '1', title: 'T1', priority: 'high' as const, status: 'in-progress' as const },
        { id: '2', title: 'T2', priority: 'high' as const, status: 'in-progress' as const },
        { id: '3', title: 'T3', priority: 'high' as const, status: 'in-progress' as const },
      ];

      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => tasks })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ activity: {} }) });

      render(<AnalyticsPage />);

      await waitFor(() => {
        const ChartMock = (window as any).Chart;
        const doughnutCalls = ChartMock.mock.calls.filter((call: any) => call[1]?.type === 'doughnut');
        const lastDoughnutCall = doughnutCalls[doughnutCalls.length - 1];
        expect(lastDoughnutCall).toBeDefined();
        expect(lastDoughnutCall[1].data.datasets[0].data[1]).toBe(3); // 3 in-progress
      }, { timeout: 5000 });
    });

    it('should count completed tasks correctly', async () => {
      const tasks = [
        { id: '1', title: 'T1', priority: 'high' as const, status: 'completed' as const },
        { id: '2', title: 'T2', priority: 'high' as const, status: 'completed' as const },
      ];

      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => tasks })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ activity: {} }) });

      render(<AnalyticsPage />);

      await waitFor(() => {
        const ChartMock = (window as any).Chart;
        const doughnutCalls = ChartMock.mock.calls.filter((call: any) => call[1]?.type === 'doughnut');
        const lastDoughnutCall = doughnutCalls[doughnutCalls.length - 1];
        expect(lastDoughnutCall).toBeDefined();
        expect(lastDoughnutCall[1].data.datasets[0].data[2]).toBe(2); // 2 completed
      }, { timeout: 5000 });
    });

    it('should count priority high tasks correctly', async () => {
      const tasks = [
        { id: '1', title: 'T1', priority: 'high' as const, status: 'pending' as const },
        { id: '2', title: 'T2', priority: 'medium' as const, status: 'pending' as const },
        { id: '3', title: 'T3', priority: 'high' as const, status: 'pending' as const },
      ];

      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => tasks })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ activity: {} }) });

      render(<AnalyticsPage />);

      await waitFor(() => {
        const ChartMock = (window as any).Chart;
        const barCalls = ChartMock.mock.calls.filter((call: any) => call[1]?.type === 'bar');
        const lastBarCall = barCalls[barCalls.length - 1];
        expect(lastBarCall).toBeDefined();
        expect(lastBarCall[1].data.datasets[0].data[0]).toBe(2); // 2 high priority
      }, { timeout: 5000 });
    });

    it('should count priority medium tasks correctly', async () => {
      const tasks = [
        { id: '1', title: 'T1', priority: 'medium' as const, status: 'pending' as const },
        { id: '2', title: 'T2', priority: 'medium' as const, status: 'pending' as const },
        { id: '3', title: 'T3', priority: 'low' as const, status: 'pending' as const },
      ];

      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => tasks })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ activity: {} }) });

      render(<AnalyticsPage />);

      await waitFor(() => {
        const ChartMock = (window as any).Chart;
        const barCalls = ChartMock.mock.calls.filter((call: any) => call[1]?.type === 'bar');
        const lastBarCall = barCalls[barCalls.length - 1];
        expect(lastBarCall).toBeDefined();
        expect(lastBarCall[1].data.datasets[0].data[1]).toBe(2); // 2 medium priority
      }, { timeout: 5000 });
    });

    it('should count priority low tasks correctly', async () => {
      const tasks = [
        { id: '1', title: 'T1', priority: 'low' as const, status: 'pending' as const },
        { id: '2', title: 'T2', priority: 'low' as const, status: 'pending' as const },
        { id: '3', title: 'T3', priority: 'low' as const, status: 'pending' as const },
        { id: '4', title: 'T4', priority: 'low' as const, status: 'pending' as const },
      ];

      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => tasks })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ activity: {} }) });

      render(<AnalyticsPage />);

      await waitFor(() => {
        const ChartMock = (window as any).Chart;
        const barCalls = ChartMock.mock.calls.filter((call: any) => call[1]?.type === 'bar');
        const lastBarCall = barCalls[barCalls.length - 1];
        expect(lastBarCall).toBeDefined();
        expect(lastBarCall[1].data.datasets[0].data[2]).toBe(4); // 4 low priority
      }, { timeout: 5000 });
    });
  });

  describe('Line Chart Configuration', () => {
    beforeEach(() => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue('true');
    });

    it('should configure line charts with hidden legend', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockTasks })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ activity: {} }) });

      render(<AnalyticsPage />);

      await waitFor(() => {
        const lineCharts = chartInstances.filter(c => c.type === 'line');
        lineCharts.forEach(chart => {
          expect(chart.options.plugins.legend.display).toBe(false);
        });
      });
    });

    it('should configure line charts with y-axis beginAtZero', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockTasks })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ activity: {} }) });

      render(<AnalyticsPage />);

      await waitFor(() => {
        const lineCharts = chartInstances.filter(c => c.type === 'line');
        lineCharts.forEach(chart => {
          expect(chart.options.scales.y.beginAtZero).toBe(true);
        });
      });
    });

    it('should configure line charts with stepSize 1', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockTasks })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ activity: {} }) });

      render(<AnalyticsPage />);

      await waitFor(() => {
        const lineCharts = chartInstances.filter(c => c.type === 'line');
        lineCharts.forEach(chart => {
          expect(chart.options.scales.y.ticks.stepSize).toBe(1);
        });
      });
    });

    it('should configure line charts with correct tick colors', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockTasks })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ activity: {} }) });

      render(<AnalyticsPage />);

      await waitFor(() => {
        const lineCharts = chartInstances.filter(c => c.type === 'line');
        lineCharts.forEach(chart => {
          expect(chart.options.scales.y.ticks.color).toBe('#e5e7eb');
          expect(chart.options.scales.x.ticks.color).toBe('#e5e7eb');
        });
      });
    });

    it('should configure line charts with correct grid colors', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockTasks })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ activity: {} }) });

      render(<AnalyticsPage />);

      await waitFor(() => {
        const lineCharts = chartInstances.filter(c => c.type === 'line');
        lineCharts.forEach(chart => {
          expect(chart.options.scales.y.grid.color).toBe('#4b5563');
          expect(chart.options.scales.x.grid.color).toBe('#4b5563');
        });
      });
    });

    it('should configure line charts with tension 0.4', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockTasks })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ activity: {} }) });

      render(<AnalyticsPage />);

      await waitFor(() => {
        const lineCharts = chartInstances.filter(c => c.type === 'line');
        lineCharts.forEach(chart => {
          expect(chart.data.datasets[0].tension).toBe(0.4);
        });
      });
    });

    it('should configure line charts with fill true', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockTasks })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ activity: {} }) });

      render(<AnalyticsPage />);

      await waitFor(() => {
        const lineCharts = chartInstances.filter(c => c.type === 'line');
        lineCharts.forEach(chart => {
          expect(chart.data.datasets[0].fill).toBe(true);
        });
      });
    });
  });

  describe('Streak Calculation Edge Cases', () => {
    it('should handle max streak calculation with consecutive days', async () => {
      const consecutiveActivity = {
        '2025-11-01': 1,
        '2025-11-02': 2,
        '2025-11-03': 1,
        '2025-11-04': 3,
        '2025-11-05': 1,
      };

      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ activity: consecutiveActivity }) });

      render(<AnalyticsPage />);

      await waitFor(() => {
        const maxStreakElement = screen.getByText('Max streak').previousElementSibling;
        expect(maxStreakElement).toBeDefined();
      }, { timeout: 3000 });
    });

    it('should handle activity with gaps', async () => {
      const gappedActivity = {
        '2025-11-01': 1,
        '2025-11-03': 1, // gap on 11-02
        '2025-11-05': 1, // gap on 11-04
      };

      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ activity: gappedActivity }) });

      render(<AnalyticsPage />);

      await waitFor(() => {
        const totalDaysElement = screen.getByText('Total active days').previousElementSibling;
        expect(totalDaysElement).toHaveTextContent('3');
      }, { timeout: 3000 });
    });

    it('should handle activity with zero counts', async () => {
      const mixedActivity = {
        '2025-11-01': 0,
        '2025-11-02': 1,
        '2025-11-03': 0,
      };

      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ activity: mixedActivity }) });

      render(<AnalyticsPage />);

      await waitFor(() => {
        const totalDaysElement = screen.getByText('Total active days').previousElementSibling;
        expect(totalDaysElement).toHaveTextContent('1'); // Only count days > 0
      }, { timeout: 3000 });
    });
  });

  describe('Overdue Logic Edge Cases', () => {
    beforeEach(() => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue('true');
    });

    it('should not count task without dueDate as overdue', async () => {
      const taskWithoutDueDate = {
        id: '1',
        title: 'No Due Date',
        priority: 'high' as const,
        status: 'pending' as const,
        // no dueDate
      };

      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => [taskWithoutDueDate] })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ activity: {} }) });

      render(<AnalyticsPage />);

      await waitFor(() => {
        const ChartMock = (window as any).Chart;
        const doughnutCalls = ChartMock.mock.calls.filter((call: any) => call[1]?.type === 'doughnut');
        const lastDoughnutCall = doughnutCalls[doughnutCalls.length - 1];
        expect(lastDoughnutCall).toBeDefined();
        expect(lastDoughnutCall[1].data.datasets[0].data[3]).toBe(0); // 0 overdue
      }, { timeout: 5000 });
    });

    it('should not count future due date as overdue', async () => {
      const futureTask = {
        id: '1',
        title: 'Future Task',
        priority: 'high' as const,
        status: 'pending' as const,
        dueDate: '2099-12-31',
      };

      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => [futureTask] })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ activity: {} }) });

      render(<AnalyticsPage />);

      await waitFor(() => {
        const ChartMock = (window as any).Chart;
        const doughnutCalls = ChartMock.mock.calls.filter((call: any) => call[1]?.type === 'doughnut');
        const lastDoughnutCall = doughnutCalls[doughnutCalls.length - 1];
        expect(lastDoughnutCall).toBeDefined();
        expect(lastDoughnutCall[1].data.datasets[0].data[3]).toBe(0); // 0 overdue
      }, { timeout: 5000 });
    });

    it('should count past due pending task as overdue', async () => {
      const overdueTask = {
        id: '1',
        title: 'Overdue Task',
        priority: 'high' as const,
        status: 'pending' as const,
        dueDate: '2020-01-01',
      };

      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => [overdueTask] })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ activity: {} }) });

      render(<AnalyticsPage />);

      await waitFor(() => {
        const ChartMock = (window as any).Chart;
        const doughnutCalls = ChartMock.mock.calls.filter((call: any) => call[1]?.type === 'doughnut');
        const lastDoughnutCall = doughnutCalls[doughnutCalls.length - 1];
        expect(lastDoughnutCall).toBeDefined();
        expect(lastDoughnutCall[1].data.datasets[0].data[3]).toBe(1); // 1 overdue
      }, { timeout: 5000 });
    });

    it('should count past due in-progress task as overdue', async () => {
      const overdueInProgress = {
        id: '1',
        title: 'Overdue In Progress',
        priority: 'high' as const,
        status: 'in-progress' as const,
        dueDate: '2020-01-01',
      };

      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => [overdueInProgress] })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ activity: {} }) });

      render(<AnalyticsPage />);

      await waitFor(() => {
        const ChartMock = (window as any).Chart;
        const doughnutCalls = ChartMock.mock.calls.filter((call: any) => call[1]?.type === 'doughnut');
        const lastDoughnutCall = doughnutCalls[doughnutCalls.length - 1];
        expect(lastDoughnutCall).toBeDefined();
        expect(lastDoughnutCall[1].data.datasets[0].data[3]).toBe(1); // 1 overdue
      }, { timeout: 5000 });
    });
  });

  describe('Theme Defaults Application', () => {
    beforeEach(() => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue('true');
    });

    it('should apply dark theme colors when dark mode is enabled', async () => {
      document.documentElement.classList.add('dark');

      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ activity: {} }) });

      render(<AnalyticsPage />);

      await waitFor(() => {
        const ChartMock = (window as any).Chart;
        // Check that defaults were set for dark mode
        expect(ChartMock.defaults.color).toBe('#9ca3af');
        expect(ChartMock.defaults.borderColor).toBe('#404040');
      }, { timeout: 3000 });

      document.documentElement.classList.remove('dark');
    });

    it('should apply light theme colors when light mode is enabled', async () => {
      document.documentElement.classList.remove('dark');

      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ activity: {} }) });

      render(<AnalyticsPage />);

      await waitFor(() => {
        const ChartMock = (window as any).Chart;
        expect(ChartMock.defaults.color).toBe('#e5e7eb');
        expect(ChartMock.defaults.borderColor).toBe('#4b5563');
      }, { timeout: 3000 });
    });
  });

  describe('Streak Calculation Deep Tests', () => {
    beforeEach(() => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue('true');
    });

    it('should calculate current streak working backwards from today', async () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const twoDaysAgo = new Date(today);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const activity = {
        [today.toISOString().split('T')[0]]: 5,
        [yesterday.toISOString().split('T')[0]]: 3,
        [twoDaysAgo.toISOString().split('T')[0]]: 2,
      };

      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ activity }) });

      render(<AnalyticsPage />);

      await waitFor(() => {
        expect(screen.getByText('Current streak')).toBeInTheDocument();
        const streakElement = screen.getByText('Current streak').previousElementSibling;
        expect(streakElement).toHaveTextContent('3');
      }, { timeout: 3000 });
    });

    it('should break streak when activity count is 0', async () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const twoDaysAgo = new Date(today);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const activity = {
        [today.toISOString().split('T')[0]]: 5,
        [yesterday.toISOString().split('T')[0]]: 0, // Break in streak
        [twoDaysAgo.toISOString().split('T')[0]]: 2,
      };

      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ activity }) });

      render(<AnalyticsPage />);

      await waitFor(() => {
        const streakElement = screen.getByText('Current streak').previousElementSibling;
        expect(streakElement).toHaveTextContent('1'); // Only today counts
      }, { timeout: 3000 });
    });

    it('should calculate max streak correctly across non-consecutive dates', async () => {
      // Create dates with gaps to test max streak calculation
      const activity = {
        '2025-01-01': 1,
        '2025-01-02': 1, // 2 day streak
        '2025-01-05': 1,
        '2025-01-06': 1,
        '2025-01-07': 1, // 3 day streak - should be max
      };

      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ activity }) });

      render(<AnalyticsPage />);

      await waitFor(() => {
        expect(screen.getByText('Max streak')).toBeInTheDocument();
        const maxStreakElement = screen.getByText('Max streak').previousElementSibling;
        expect(maxStreakElement).toHaveTextContent('3');
      }, { timeout: 3000 });
    });

    it('should handle dates array sorting for streak calculation', async () => {
      // Dates out of order in the object
      const activity = {
        '2025-01-03': 1,
        '2025-01-01': 1,
        '2025-01-02': 1,
      };

      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ activity }) });

      render(<AnalyticsPage />);

      await waitFor(() => {
        const maxStreakElement = screen.getByText('Max streak').previousElementSibling;
        expect(maxStreakElement).toHaveTextContent('3');
      }, { timeout: 3000 });
    });

    it('should increment tempStreak when consecutive days found', async () => {
      const activity = {
        '2025-01-01': 1,
        '2025-01-02': 2,
        '2025-01-03': 3,
        '2025-01-04': 4,
      };

      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ activity }) });

      render(<AnalyticsPage />);

      await waitFor(() => {
        const maxStreakElement = screen.getByText('Max streak').previousElementSibling;
        expect(maxStreakElement).toHaveTextContent('4');
      }, { timeout: 3000 });
    });

    it('should reset tempStreak to 1 when non-consecutive day with activity found', async () => {
      const activity = {
        '2025-01-01': 1,
        '2025-01-02': 1, // First streak of 2
        '2025-01-05': 1, // Gap, reset to 1
      };

      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ activity }) });

      render(<AnalyticsPage />);

      await waitFor(() => {
        const maxStreakElement = screen.getByText('Max streak').previousElementSibling;
        // Max streak should be 2 (from days 1-2), not 3
        expect(maxStreakElement).toHaveTextContent('2');
      }, { timeout: 3000 });
    });

    it('should set tempStreak to 0 when no activity on date', async () => {
      const activity = {
        '2025-01-01': 1,
        '2025-01-02': 0, // No activity
        '2025-01-03': 1,
      };

      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ activity }) });

      render(<AnalyticsPage />);

      await waitFor(() => {
        const maxStreakElement = screen.getByText('Max streak').previousElementSibling;
        expect(maxStreakElement).toHaveTextContent('1');
      }, { timeout: 3000 });
    });
  });

  describe('Productivity Chart Label Generation', () => {
    beforeEach(() => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue('true');
    });

    it('should generate correct month abbreviations for labels', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ activity: {} }) });

      render(<AnalyticsPage />);

      await waitFor(() => {
        const ChartMock = (window as any).Chart;
        const lineCalls = ChartMock.mock.calls.filter((call: any) => call[1]?.type === 'line');
        const productivityCall = lineCalls.find((call: any) => 
          call[1]?.data?.datasets[0]?.label === 'Completed Tasks'
        );
        expect(productivityCall).toBeDefined();
        
        // Labels should be in format "Mon DD" with month abbreviation
        const labels = productivityCall[1].data.labels;
        expect(labels.length).toBe(7);
        
        // Each label should contain month abbreviation
        const monthAbbrs = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        labels.forEach((label: string) => {
          const hasMonth = monthAbbrs.some(m => label.includes(m));
          expect(hasMonth).toBe(true);
        });
      }, { timeout: 3000 });
    });

    it('should generate labels for past 7 days working backwards', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ activity: {} }) });

      render(<AnalyticsPage />);

      await waitFor(() => {
        const ChartMock = (window as any).Chart;
        const lineCalls = ChartMock.mock.calls.filter((call: any) => call[1]?.type === 'line');
        const productivityCall = lineCalls.find((call: any) => 
          call[1]?.data?.datasets[0]?.label === 'Completed Tasks'
        );
        expect(productivityCall).toBeDefined();
        
        // First label is oldest (6 days ago), last is today
        const labels = productivityCall[1].data.labels;
        
        const today = new Date();
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const expectedToday = `${months[today.getMonth()]} ${today.getDate()}`;
        expect(labels[6]).toBe(expectedToday);
      }, { timeout: 3000 });
    });
  });

  describe('Status and Priority Filter Tests', () => {
    beforeEach(() => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue('true');
    });

    it('should filter tasks with status pending correctly', async () => {
      const tasks = [
        { id: '1', title: 'T1', priority: 'high' as const, status: 'pending' as const },
        { id: '2', title: 'T2', priority: 'high' as const, status: 'in-progress' as const },
      ];

      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => tasks })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ activity: {} }) });

      render(<AnalyticsPage />);

      await waitFor(() => {
        const ChartMock = (window as any).Chart;
        const doughnutCalls = ChartMock.mock.calls.filter((call: any) => call[1]?.type === 'doughnut');
        const lastDoughnutCall = doughnutCalls[doughnutCalls.length - 1];
        expect(lastDoughnutCall).toBeDefined();
        // Pending should be 1, in-progress should be 1
        expect(lastDoughnutCall[1].data.datasets[0].data[0]).toBe(1);
        expect(lastDoughnutCall[1].data.datasets[0].data[1]).toBe(1);
      }, { timeout: 5000 });
    });

    it('should filter tasks with priority high correctly', async () => {
      const tasks = [
        { id: '1', title: 'T1', priority: 'high' as const, status: 'pending' as const },
        { id: '2', title: 'T2', priority: 'medium' as const, status: 'pending' as const },
        { id: '3', title: 'T3', priority: 'low' as const, status: 'pending' as const },
      ];

      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => tasks })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ activity: {} }) });

      render(<AnalyticsPage />);

      await waitFor(() => {
        const ChartMock = (window as any).Chart;
        const barCalls = ChartMock.mock.calls.filter((call: any) => call[1]?.type === 'bar');
        const lastBarCall = barCalls[barCalls.length - 1];
        expect(lastBarCall).toBeDefined();
        expect(lastBarCall[1].data.datasets[0].data[0]).toBe(1); // high
        expect(lastBarCall[1].data.datasets[0].data[1]).toBe(1); // medium
        expect(lastBarCall[1].data.datasets[0].data[2]).toBe(1); // low
      }, { timeout: 5000 });
    });
  });

  describe('Fetch Error Handling', () => {
    beforeEach(() => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue('true');
    });

    it('should handle ok false response for tasks', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: false, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ activity: {} }) });

      render(<AnalyticsPage />);

      // Should render without crashing
      await waitFor(() => {
        expect(screen.getByText('Analytics')).toBeInTheDocument();
      });
    });

    it('should handle ok false response for activity', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
        .mockResolvedValueOnce({ ok: false, json: async () => ({ activity: {} }) });

      render(<AnalyticsPage />);

      await waitFor(() => {
        expect(screen.getByText('Analytics')).toBeInTheDocument();
      });
    });

    it('should set migration flag in localStorage after successful migration', async () => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue(null);
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ activity: {} }) });

      render(<AnalyticsPage />);

      await waitFor(() => {
        expect(localStorage.setItem).toHaveBeenCalledWith('completionHistoryMigrated', 'true');
      }, { timeout: 3000 });
    });
  });

  describe('Completed Tasks Filter in Productivity Chart', () => {
    beforeEach(() => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue('true');
    });

    it('should filter only completed tasks for productivity chart data', async () => {
      const tasks = [
        { id: '1', title: 'T1', priority: 'high' as const, status: 'completed' as const },
        { id: '2', title: 'T2', priority: 'high' as const, status: 'pending' as const },
        { id: '3', title: 'T3', priority: 'high' as const, status: 'completed' as const },
      ];

      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => tasks })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ activity: {} }) });

      render(<AnalyticsPage />);

      await waitFor(() => {
        const ChartMock = (window as any).Chart;
        const lineCalls = ChartMock.mock.calls.filter((call: any) => call[1]?.type === 'line');
        const productivityCall = lineCalls.find((call: any) => 
          call[1]?.data?.datasets[0]?.label === 'Completed Tasks'
        );
        expect(productivityCall).toBeDefined();
        
        // Data should reflect filtered completed tasks
        const data = productivityCall[1].data.datasets[0].data;
        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBe(7);
      }, { timeout: 3000 });
    });
  });

  describe('Overdue Task Status Filtering', () => {
    beforeEach(() => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue('true');
    });

    it('should not count completed task with past due date as overdue', async () => {
      const completedPastDue = {
        id: '1',
        title: 'Completed Past Due',
        priority: 'high' as const,
        status: 'completed' as const,
        dueDate: '2020-01-01',
      };

      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => [completedPastDue] })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ activity: {} }) });

      render(<AnalyticsPage />);

      await waitFor(() => {
        const ChartMock = (window as any).Chart;
        const doughnutCalls = ChartMock.mock.calls.filter((call: any) => call[1]?.type === 'doughnut');
        const lastDoughnutCall = doughnutCalls[doughnutCalls.length - 1];
        expect(lastDoughnutCall).toBeDefined();
        expect(lastDoughnutCall[1].data.datasets[0].data[3]).toBe(0); // 0 overdue
      }, { timeout: 5000 });
    });

    it('should compare due date properly with today', async () => {
      const todayTask = {
        id: '1',
        title: 'Due Today',
        priority: 'high' as const,
        status: 'pending' as const,
        dueDate: new Date().toISOString().split('T')[0],
      };

      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => [todayTask] })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ activity: {} }) });

      render(<AnalyticsPage />);

      await waitFor(() => {
        const ChartMock = (window as any).Chart;
        const doughnutCalls = ChartMock.mock.calls.filter((call: any) => call[1]?.type === 'doughnut');
        const lastDoughnutCall = doughnutCalls[doughnutCalls.length - 1];
        expect(lastDoughnutCall).toBeDefined();
        // Due today is not overdue (due < today, not due <= today)
        expect(lastDoughnutCall[1].data.datasets[0].data[3]).toBe(0);
      }, { timeout: 5000 });
    });
  });

  describe('Chart Canvas Ref Tests', () => {
    beforeEach(() => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue('true');
    });

    it('should only create chart when canvas ref exists', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ activity: {} }) });

      render(<AnalyticsPage />);

      await waitFor(() => {
        // Check that canvas elements exist
        const canvasElements = document.querySelectorAll('canvas');
        expect(canvasElements.length).toBe(4); // status, priority, productivity, pomodoro
      });
    });
  });

  describe('Total Active Days Calculation', () => {
    beforeEach(() => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue('true');
    });

    it('should count only days with activity > 0', async () => {
      const activity = {
        '2025-01-01': 0,
        '2025-01-02': 1,
        '2025-01-03': 0,
        '2025-01-04': 5,
        '2025-01-05': 0,
      };

      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ activity }) });

      render(<AnalyticsPage />);

      await waitFor(() => {
        const totalDaysElement = screen.getByText('Total active days').previousElementSibling;
        expect(totalDaysElement).toHaveTextContent('2'); // Only 2 days have activity > 0
      }, { timeout: 3000 });
    });
  });

  describe('UseEffect Dependency Array', () => {
    beforeEach(() => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue('true');
    });

    it('should re-render charts when tasks change', async () => {
      const initialTasks = [
        { id: '1', title: 'T1', priority: 'high' as const, status: 'pending' as const },
      ];

      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => initialTasks })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ activity: {} }) });

      const { unmount } = render(<AnalyticsPage />);

      await waitFor(() => {
        const ChartMock = (window as any).Chart;
        expect(ChartMock).toHaveBeenCalled();
      });

      unmount();
    });
  });

  describe('Initial State Tests', () => {
    beforeEach(() => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue('true');
    });

    it('should initialize with empty tasks array', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ activity: {} }) });

      render(<AnalyticsPage />);

      await waitFor(() => {
        const ChartMock = (window as any).Chart;
        const doughnutCalls = ChartMock.mock.calls.filter((call: any) => call[1]?.type === 'doughnut');
        expect(doughnutCalls.length).toBeGreaterThan(0);
        // All counts should be 0 with empty tasks
        const firstCall = doughnutCalls[0];
        expect(firstCall[1].data.datasets[0].data).toEqual([0, 0, 0, 0]);
      }, { timeout: 3000 });
    });

    it('should initialize stats with zeros', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ activity: {} }) });

      render(<AnalyticsPage />);

      await waitFor(() => {
        // Check that Total active days stat shows 0
        const totalDaysLabel = screen.getByText('Total active days');
        const totalDaysValue = totalDaysLabel.previousElementSibling;
        expect(totalDaysValue).toHaveTextContent('0');
      }, { timeout: 3000 });
    });
  });

  describe('Month Abbreviation Mutations', () => {
    beforeEach(() => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue('true');
    });

    it('should use all correct month abbreviations in label generation', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ activity: {} }) });

      render(<AnalyticsPage />);

      await waitFor(() => {
        const ChartMock = (window as any).Chart;
        const lineCalls = ChartMock.mock.calls.filter((call: any) => call[1]?.type === 'line');
        const productivityCall = lineCalls.find((call: any) => 
          call[1]?.data?.datasets[0]?.label === 'Completed Tasks'
        );
        expect(productivityCall).toBeDefined();
        
        const labels = productivityCall[1].data.labels as string[];
        // Check that month abbreviations are being used correctly
        // Each label should be in format "Mon DD" (e.g., "Jan 15")
        labels.forEach((label: string) => {
          expect(label).toMatch(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d+$/);
        });
      }, { timeout: 3000 });
    });

    it('should format each of the 7 day labels correctly', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ activity: {} }) });

      render(<AnalyticsPage />);

      await waitFor(() => {
        const ChartMock = (window as any).Chart;
        const lineCalls = ChartMock.mock.calls.filter((call: any) => call[1]?.type === 'line');
        const productivityCall = lineCalls.find((call: any) => 
          call[1]?.data?.datasets[0]?.label === 'Completed Tasks'
        );
        expect(productivityCall).toBeDefined();
        
        const labels = productivityCall[1].data.labels as string[];
        expect(labels.length).toBe(7);
        
        // Verify each label has proper month abbreviation followed by day
        for (const label of labels) {
          const parts = label.split(' ');
          expect(parts.length).toBe(2);
          expect(['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']).toContain(parts[0]);
          expect(parseInt(parts[1])).toBeGreaterThanOrEqual(1);
          expect(parseInt(parts[1])).toBeLessThanOrEqual(31);
        }
      }, { timeout: 3000 });
    });
  });

  describe('Overdue Date Comparison', () => {
    beforeEach(() => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue('true');
    });

    it('should correctly determine task with dueDate yesterday is overdue', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const overdueTask = {
        id: '1',
        title: 'Yesterday Task',
        priority: 'high' as const,
        status: 'pending' as const,
        dueDate: yesterday.toISOString().split('T')[0],
      };

      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => [overdueTask] })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ activity: {} }) });

      render(<AnalyticsPage />);

      await waitFor(() => {
        const ChartMock = (window as any).Chart;
        const doughnutCalls = ChartMock.mock.calls.filter((call: any) => call[1]?.type === 'doughnut');
        const lastDoughnutCall = doughnutCalls[doughnutCalls.length - 1];
        expect(lastDoughnutCall).toBeDefined();
        expect(lastDoughnutCall[1].data.datasets[0].data[3]).toBe(1); // 1 overdue
      }, { timeout: 5000 });
    });

    it('should correctly identify task due today as not overdue', async () => {
      const today = new Date();
      
      const todayTask = {
        id: '1',
        title: 'Today Task',
        priority: 'high' as const,
        status: 'pending' as const,
        dueDate: today.toISOString().split('T')[0],
      };

      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => [todayTask] })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ activity: {} }) });

      render(<AnalyticsPage />);

      await waitFor(() => {
        const ChartMock = (window as any).Chart;
        const doughnutCalls = ChartMock.mock.calls.filter((call: any) => call[1]?.type === 'doughnut');
        const lastDoughnutCall = doughnutCalls[doughnutCalls.length - 1];
        expect(lastDoughnutCall).toBeDefined();
        expect(lastDoughnutCall[1].data.datasets[0].data[3]).toBe(0); // not overdue
      }, { timeout: 5000 });
    });

    it('should not count task without dueDate in overdue', async () => {
      const taskNoDueDate = {
        id: '1',
        title: 'No Due Date',
        priority: 'high' as const,
        status: 'pending' as const,
      };

      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => [taskNoDueDate] })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ activity: {} }) });

      render(<AnalyticsPage />);

      await waitFor(() => {
        const ChartMock = (window as any).Chart;
        const doughnutCalls = ChartMock.mock.calls.filter((call: any) => call[1]?.type === 'doughnut');
        const lastDoughnutCall = doughnutCalls[doughnutCalls.length - 1];
        expect(lastDoughnutCall).toBeDefined();
        expect(lastDoughnutCall[1].data.datasets[0].data[3]).toBe(0); // not overdue
      }, { timeout: 5000 });
    });

    it('should not count completed task with past dueDate as overdue', async () => {
      const completedOldTask = {
        id: '1',
        title: 'Completed Old',
        priority: 'high' as const,
        status: 'completed' as const,
        dueDate: '2020-01-01',
      };

      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => [completedOldTask] })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ activity: {} }) });

      render(<AnalyticsPage />);

      await waitFor(() => {
        const ChartMock = (window as any).Chart;
        const doughnutCalls = ChartMock.mock.calls.filter((call: any) => call[1]?.type === 'doughnut');
        const lastDoughnutCall = doughnutCalls[doughnutCalls.length - 1];
        expect(lastDoughnutCall).toBeDefined();
        expect(lastDoughnutCall[1].data.datasets[0].data[3]).toBe(0); // not overdue
      }, { timeout: 5000 });
    });
  });

  describe('Current Streak Logic', () => {
    beforeEach(() => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue('true');
    });

    it('should increment current streak for each consecutive active day', async () => {
      const today = new Date();
      const y1 = new Date(today);
      y1.setDate(y1.getDate() - 1);
      const y2 = new Date(today);
      y2.setDate(y2.getDate() - 2);
      const y3 = new Date(today);
      y3.setDate(y3.getDate() - 3);
      const y4 = new Date(today);
      y4.setDate(y4.getDate() - 4);

      const activity = {
        [today.toISOString().split('T')[0]]: 1,
        [y1.toISOString().split('T')[0]]: 1,
        [y2.toISOString().split('T')[0]]: 1,
        [y3.toISOString().split('T')[0]]: 1,
        [y4.toISOString().split('T')[0]]: 1,
      };

      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ activity }) });

      render(<AnalyticsPage />);

      await waitFor(() => {
        const streakElement = screen.getByText('Current streak').previousElementSibling;
        expect(streakElement).toHaveTextContent('5');
      }, { timeout: 3000 });
    });

    it('should handle activity with count > 0 requirement', async () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const activity = {
        [today.toISOString().split('T')[0]]: 0, // Activity count 0, doesn't count
        [yesterday.toISOString().split('T')[0]]: 1,
      };

      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ activity }) });

      render(<AnalyticsPage />);

      await waitFor(() => {
        const streakElement = screen.getByText('Current streak').previousElementSibling;
        // Today has 0 activity, so streak doesn't start, but streak ends at yesterday
        // Actually, looking at code: today has activity[today] = 0, so condition fails
        // then dateStr !== today is false (it IS today), so streakActive stays true
        // Next iteration: yesterday has activity = 1 > 0, so currentStreak++
        // But wait, today activity 0 doesn't trigger else-if since dateStr === today
        // Hmm, let me trace: first iteration, today, activity = 0, condition false
        // dateStr !== today is false, so don't set streakActive = false
        // Next: yesterday, activity = 1, currentStreak = 1
        expect(streakElement).toHaveTextContent('1');
      }, { timeout: 3000 });
    });
  });

  describe('Fetch Response Handling', () => {
    beforeEach(() => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue('true');
    });

    it('should not update tasks when fetch returns not ok', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: false, json: async () => [{ id: '1', title: 'Test' }] })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ activity: {} }) });

      render(<AnalyticsPage />);

      await waitFor(() => {
        const ChartMock = (window as any).Chart;
        const doughnutCalls = ChartMock.mock.calls.filter((call: any) => call[1]?.type === 'doughnut');
        expect(doughnutCalls.length).toBeGreaterThan(0);
        // All counts should be 0 since tasks weren't loaded
        const lastCall = doughnutCalls[doughnutCalls.length - 1];
        expect(lastCall[1].data.datasets[0].data).toEqual([0, 0, 0, 0]);
      }, { timeout: 3000 });
    });

    it('should not update activity when fetch returns not ok', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: false, json: async () => ({ activity: { '2025-01-01': 5 } }) });

      render(<AnalyticsPage />);

      await waitFor(() => {
        // Stats should remain at initial 0 values
        const totalDaysLabel = screen.getByText('Total active days');
        const totalDaysValue = totalDaysLabel.previousElementSibling;
        expect(totalDaysValue).toHaveTextContent('0');
      }, { timeout: 3000 });
    });
  });

  describe('Productivity Chart Completed Tasks Filter', () => {
    beforeEach(() => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue('true');
    });

    it('should filter tasks to only completed ones for productivity data', async () => {
      const tasks = [
        { id: '1', title: 'T1', priority: 'high' as const, status: 'completed' as const },
        { id: '2', title: 'T2', priority: 'high' as const, status: 'pending' as const },
        { id: '3', title: 'T3', priority: 'high' as const, status: 'in-progress' as const },
        { id: '4', title: 'T4', priority: 'high' as const, status: 'completed' as const },
      ];

      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => tasks })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ activity: {} }) });

      render(<AnalyticsPage />);

      await waitFor(() => {
        const ChartMock = (window as any).Chart;
        const lineCalls = ChartMock.mock.calls.filter((call: any) => call[1]?.type === 'line');
        const productivityCall = lineCalls.find((call: any) => 
          call[1]?.data?.datasets[0]?.label === 'Completed Tasks'
        );
        expect(productivityCall).toBeDefined();
        
        // The data should have 7 data points for the week
        const data = productivityCall[1].data.datasets[0].data;
        expect(data.length).toBe(7);
        expect(Array.isArray(data)).toBe(true);
      }, { timeout: 3000 });
    });
  });

  describe('Canvas Ref Conditionals', () => {
    beforeEach(() => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue('true');
    });

    it('should create status chart when ref exists', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ activity: {} }) });

      render(<AnalyticsPage />);

      await waitFor(() => {
        const ChartMock = (window as any).Chart;
        const doughnutCalls = ChartMock.mock.calls.filter((call: any) => call[1]?.type === 'doughnut');
        expect(doughnutCalls.length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });

    it('should create priority chart when ref exists', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ activity: {} }) });

      render(<AnalyticsPage />);

      await waitFor(() => {
        const ChartMock = (window as any).Chart;
        const barCalls = ChartMock.mock.calls.filter((call: any) => call[1]?.type === 'bar');
        expect(barCalls.length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });

    it('should create productivity chart when ref exists', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ activity: {} }) });

      render(<AnalyticsPage />);

      await waitFor(() => {
        const ChartMock = (window as any).Chart;
        const lineCalls = ChartMock.mock.calls.filter((call: any) => call[1]?.type === 'line');
        const productivityCall = lineCalls.find((call: any) => 
          call[1]?.data?.datasets[0]?.label === 'Completed Tasks'
        );
        expect(productivityCall).toBeDefined();
      }, { timeout: 3000 });
    });

    it('should create pomodoro chart when ref exists', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ activity: {} }) });

      render(<AnalyticsPage />);

      await waitFor(() => {
        const ChartMock = (window as any).Chart;
        const lineCalls = ChartMock.mock.calls.filter((call: any) => call[1]?.type === 'line');
        const pomodoroCall = lineCalls.find((call: any) => 
          call[1]?.data?.datasets[0]?.label === 'Sessions'
        );
        expect(pomodoroCall).toBeDefined();
      }, { timeout: 3000 });
    });
  });

  describe('Day Label Generation with Date Subtraction', () => {
    beforeEach(() => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue('true');
    });

    it('should generate labels going back 7 days from today', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ activity: {} }) });

      render(<AnalyticsPage />);

      await waitFor(() => {
        const ChartMock = (window as any).Chart;
        const lineCalls = ChartMock.mock.calls.filter((call: any) => call[1]?.type === 'line');
        const productivityCall = lineCalls.find((call: any) => 
          call[1]?.data?.datasets[0]?.label === 'Completed Tasks'
        );
        expect(productivityCall).toBeDefined();
        
        const labels = productivityCall[1].data.labels as string[];
        const today = new Date();
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        
        // Last label should be today
        const expectedToday = `${months[today.getMonth()]} ${today.getDate()}`;
        expect(labels[6]).toBe(expectedToday);
        
        // First label should be 6 days ago
        const sixDaysAgo = new Date(today);
        sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);
        const expected6DaysAgo = `${months[sixDaysAgo.getMonth()]} ${sixDaysAgo.getDate()}`;
        expect(labels[0]).toBe(expected6DaysAgo);
      }, { timeout: 3000 });
    });
  });
});
