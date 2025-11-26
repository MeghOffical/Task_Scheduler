/**
 * Unit tests for dashboard page
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DashboardPage from './page';

// Mock PageWrapper
jest.mock('@/components/page-wrapper', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="page-wrapper">{children}</div>,
}));

// Mock fetch
global.fetch = jest.fn();

describe('Dashboard Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/tasks/stats')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            totalTasks: 10,
            completedTasks: 5,
            pendingTasks: 3,
            inProgressTasks: 2,
            overdueTasks: 1,
            highPriority: 4,
            mediumPriority: 4,
            lowPriority: 2,
          }),
        });
      }
      if (url.includes('/api/tasks')) {
        return Promise.resolve({
          ok: true,
          json: async () => ([
            {
              _id: '1',
              title: 'Test Task',
              status: 'pending',
              priority: 'high',
              dueDate: new Date().toISOString(),
            },
          ]),
        });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });
  });

  it('should render dashboard page', () => {
    render(<DashboardPage />);
    expect(screen.getByTestId('page-wrapper')).toBeInTheDocument();
  });

  it('should display dashboard title', () => {
    render(<DashboardPage />);
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
  });

  it('should fetch and display stats', async () => {
    render(<DashboardPage />);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/tasks/stats'));
    });
  });

  it('should display task statistics cards', async () => {
    render(<DashboardPage />);
    
    await waitFor(() => {
      expect(screen.getByText(/total tasks/i)).toBeInTheDocument();
    });
  });
});
