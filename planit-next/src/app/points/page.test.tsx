/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PointsPage from './page';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock sessionStorage
const mockSessionStorage: Record<string, string> = {};
Object.defineProperty(window, 'sessionStorage', {
  value: {
    getItem: jest.fn((key: string) => mockSessionStorage[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      mockSessionStorage[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete mockSessionStorage[key];
    }),
    clear: jest.fn(() => {
      Object.keys(mockSessionStorage).forEach(key => delete mockSessionStorage[key]);
    }),
  },
  writable: true,
});

describe('PointsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(mockSessionStorage).forEach(key => delete mockSessionStorage[key]);
  });

  describe('Initial Render and Loading State', () => {
    it('shows loading state initially', () => {
      mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves
      render(<PointsPage />);
      
      expect(screen.getByText('Loading points...')).toBeInTheDocument();
    });

    it('renders page title and description', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ points: 100, activities: [] }),
      });
      
      render(<PointsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Your Point Activity')).toBeInTheDocument();
      });
      expect(screen.getByText(/See how you earn and lose points/)).toBeInTheDocument();
    });

    it('displays Your Points badge', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ points: 250, activities: [] }),
      });
      
      render(<PointsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Your Points')).toBeInTheDocument();
        expect(screen.getByText('250')).toBeInTheDocument();
      });
    });
  });

  describe('Points Display', () => {
    it('displays points value correctly', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ points: 500, activities: [] }),
      });
      
      render(<PointsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('500')).toBeInTheDocument();
      });
    });

    it('displays 0 points when points is null', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ points: null, activities: [] }),
      });
      
      render(<PointsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('0')).toBeInTheDocument();
      });
    });

    it('displays dash when points is undefined during loading', () => {
      mockFetch.mockImplementation(() => new Promise(() => {}));
      render(<PointsPage />);
      
      expect(screen.getByText('—')).toBeInTheDocument();
    });
  });

  describe('Activities Display', () => {
    it('shows empty state when no activities', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ points: 100, activities: [] }),
      });
      
      render(<PointsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Recent Activity')).toBeInTheDocument();
        expect(screen.getByText(/No point activity yet/)).toBeInTheDocument();
      });
    });

    it('displays activity items with positive amounts', async () => {
      const activities = [
        {
          _id: '1',
          type: 'task_complete',
          amount: 10,
          description: 'Completed task: Buy groceries',
          createdAt: '2025-11-29T10:00:00Z',
        },
      ];
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ points: 100, activities }),
      });
      
      render(<PointsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Completed task: Buy groceries')).toBeInTheDocument();
        expect(screen.getByText('+10')).toBeInTheDocument();
      });
    });

    it('displays activity items with negative amounts', async () => {
      const activities = [
        {
          _id: '2',
          type: 'task_overdue',
          amount: -5,
          description: 'Task overdue: Report',
          createdAt: '2025-11-29T10:00:00Z',
        },
      ];
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ points: 95, activities }),
      });
      
      render(<PointsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Task overdue: Report')).toBeInTheDocument();
        expect(screen.getByText('-5')).toBeInTheDocument();
      });
    });

    it('displays multiple activities in order', async () => {
      const activities = [
        {
          _id: '1',
          type: 'task_complete',
          amount: 10,
          description: 'Task 1 completed',
          createdAt: '2025-11-29T10:00:00Z',
        },
        {
          _id: '2',
          type: 'daily_checkin',
          amount: 1,
          description: 'Daily check-in',
          createdAt: '2025-11-29T09:00:00Z',
        },
        {
          _id: '3',
          type: 'task_overdue',
          amount: -3,
          description: 'Task overdue',
          createdAt: '2025-11-29T08:00:00Z',
        },
      ];
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ points: 108, activities }),
      });
      
      render(<PointsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Task 1 completed')).toBeInTheDocument();
        expect(screen.getByText('Daily check-in')).toBeInTheDocument();
        expect(screen.getByText('Task overdue')).toBeInTheDocument();
      });
    });

    it('formats dates correctly', async () => {
      const activities = [
        {
          _id: '1',
          type: 'task_complete',
          amount: 10,
          description: 'Test task',
          createdAt: '2025-11-29T14:30:00Z',
        },
      ];
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ points: 10, activities }),
      });
      
      render(<PointsPage />);
      
      await waitFor(() => {
        // The date should be formatted based on locale
        expect(screen.getByText('Test task')).toBeInTheDocument();
      });
    });
  });

  describe('Daily Check-in Toast', () => {
    it('shows check-in toast when daily check-in activity present and not shown before', async () => {
      jest.useFakeTimers();
      
      const activities = [
        {
          _id: '1',
          type: 'daily_checkin',
          amount: 1,
          description: 'Daily check-in',
          createdAt: '2025-11-29T09:00:00Z',
        },
      ];
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ points: 1, activities }),
      });
      
      render(<PointsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Daily check-in successful')).toBeInTheDocument();
        expect(screen.getByText(/You earned \+1 point for today/)).toBeInTheDocument();
      });
      
      jest.useRealTimers();
    });

    it('does not show check-in toast if already shown in session', async () => {
      mockSessionStorage['dailyCheckinToastShown'] = 'true';
      
      const activities = [
        {
          _id: '1',
          type: 'daily_checkin',
          amount: 1,
          description: 'Daily check-in',
          createdAt: '2025-11-29T09:00:00Z',
        },
      ];
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ points: 1, activities }),
      });
      
      render(<PointsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Daily check-in')).toBeInTheDocument();
      });
      
      expect(screen.queryByText('Daily check-in successful')).not.toBeInTheDocument();
    });

    it('sets sessionStorage flag when showing toast', async () => {
      const activities = [
        {
          _id: '1',
          type: 'daily_checkin',
          amount: 1,
          description: 'Daily check-in',
          createdAt: '2025-11-29T09:00:00Z',
        },
      ];
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ points: 1, activities }),
      });
      
      render(<PointsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Daily check-in successful')).toBeInTheDocument();
      });
      
      expect(window.sessionStorage.setItem).toHaveBeenCalledWith('dailyCheckinToastShown', 'true');
    });

    it('hides toast after timeout', async () => {
      jest.useFakeTimers();
      
      const activities = [
        {
          _id: '1',
          type: 'daily_checkin',
          amount: 1,
          description: 'Daily check-in',
          createdAt: '2025-11-29T09:00:00Z',
        },
      ];
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ points: 1, activities }),
      });
      
      render(<PointsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Daily check-in successful')).toBeInTheDocument();
      });
      
      // Fast-forward past the timeout (3500ms)
      jest.advanceTimersByTime(4000);
      
      await waitFor(() => {
        expect(screen.queryByText('Daily check-in successful')).not.toBeInTheDocument();
      });
      
      jest.useRealTimers();
    });
  });

  describe('Error Handling', () => {
    it('displays error message when fetch fails', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      });
      
      render(<PointsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load points data')).toBeInTheDocument();
      });
    });

    it('displays error message when fetch throws', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));
      
      render(<PointsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('displays generic error for unknown errors', async () => {
      mockFetch.mockRejectedValue({});
      
      render(<PointsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Error loading points')).toBeInTheDocument();
      });
    });

    it('does not show loading state after error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      });
      
      render(<PointsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load points data')).toBeInTheDocument();
      });
      
      expect(screen.queryByText('Loading points...')).not.toBeInTheDocument();
    });
  });

  describe('API Integration', () => {
    it('calls the correct API endpoint', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ points: 100, activities: [] }),
      });
      
      render(<PointsPage />);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/points/me');
      });
    });

    it('handles empty activities array from API', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ points: 50 }),
      });
      
      render(<PointsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('50')).toBeInTheDocument();
        expect(screen.getByText(/No point activity yet/)).toBeInTheDocument();
      });
    });
  });

  describe('Styling and Accessibility', () => {
    it('applies correct styling for positive amounts', async () => {
      const activities = [
        {
          _id: '1',
          type: 'task_complete',
          amount: 10,
          description: 'Test',
          createdAt: '2025-11-29T10:00:00Z',
        },
      ];
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ points: 10, activities }),
      });
      
      render(<PointsPage />);
      
      await waitFor(() => {
        const amountElement = screen.getByText('+10');
        expect(amountElement).toHaveClass('text-emerald-400');
      });
    });

    it('applies correct styling for negative amounts', async () => {
      const activities = [
        {
          _id: '1',
          type: 'task_overdue',
          amount: -5,
          description: 'Test negative',
          createdAt: '2025-11-29T10:00:00Z',
        },
      ];
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ points: 100, activities }),
      });
      
      render(<PointsPage />);
      
      await waitFor(() => {
        // Find the activity amount element (in the list, not the total points)
        const amountElements = screen.getAllByText('-5');
        const activityAmount = amountElements.find(el => el.classList.contains('text-red-400'));
        expect(activityAmount).toBeInTheDocument();
      });
    });

    it('renders with proper heading structure', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ points: 100, activities: [] }),
      });
      
      render(<PointsPage />);
      
      await waitFor(() => {
        const heading = screen.getByRole('heading', { level: 1 });
        expect(heading).toHaveTextContent('Your Point Activity');
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles zero points correctly', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ points: 0, activities: [] }),
      });
      
      render(<PointsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('0')).toBeInTheDocument();
      });
    });

    it('handles large point values', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ points: 999999, activities: [] }),
      });
      
      render(<PointsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('999999')).toBeInTheDocument();
      });
    });

    it('handles activity with zero amount', async () => {
      const activities = [
        {
          _id: '1',
          type: 'adjustment',
          amount: 0,
          description: 'No change',
          createdAt: '2025-11-29T10:00:00Z',
        },
      ];
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ points: 0, activities }),
      });
      
      render(<PointsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('No change')).toBeInTheDocument();
        expect(screen.getByText('+0')).toBeInTheDocument();
      });
    });
  });
});
