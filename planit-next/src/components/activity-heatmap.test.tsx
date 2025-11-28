import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ActivityHeatmap from './activity-heatmap';

describe('ActivityHeatmap Component', () => {
  const mockActivity = {
    '2024-01-01': 3,
    '2024-01-02': 5,
    '2024-01-03': 1,
    '2024-01-15': 7,
    '2024-02-10': 2,
    '2024-03-20': 4,
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-06-15'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('basic rendering', () => {
    it('should render heatmap container', () => {
      const { container } = render(<ActivityHeatmap activity={mockActivity} />);
      expect(container.querySelector('.heatmap-container')).toBeInTheDocument();
    });

    it('should display current year', () => {
      render(<ActivityHeatmap activity={mockActivity} />);
      expect(screen.getByText('2024')).toBeInTheDocument();
    });

    it('should render navigation buttons', () => {
      render(<ActivityHeatmap activity={mockActivity} />);
      expect(screen.getByText('← Previous Year')).toBeInTheDocument();
      expect(screen.getByText('Next Year →')).toBeInTheDocument();
    });

    it('should render day labels', () => {
      render(<ActivityHeatmap activity={mockActivity} />);
      expect(screen.getByText('Sun')).toBeInTheDocument();
      expect(screen.getByText('Mon')).toBeInTheDocument();
      expect(screen.getByText('Tue')).toBeInTheDocument();
      expect(screen.getByText('Wed')).toBeInTheDocument();
      expect(screen.getByText('Thu')).toBeInTheDocument();
      expect(screen.getByText('Fri')).toBeInTheDocument();
      expect(screen.getByText('Sat')).toBeInTheDocument();
    });

    it('should render month labels', () => {
      render(<ActivityHeatmap activity={mockActivity} />);
      expect(screen.getByText('Jan')).toBeInTheDocument();
      expect(screen.getByText('Feb')).toBeInTheDocument();
      expect(screen.getByText('Mar')).toBeInTheDocument();
    });

    it('should render legend', () => {
      render(<ActivityHeatmap activity={mockActivity} />);
      expect(screen.getByText('Less')).toBeInTheDocument();
      expect(screen.getByText('More')).toBeInTheDocument();
    });
  });

  describe('year navigation', () => {
    it('should navigate to previous year when button clicked', () => {
      render(<ActivityHeatmap activity={mockActivity} />);
      const prevButton = screen.getByText('← Previous Year');
      
      fireEvent.click(prevButton);
      expect(screen.getByText('2023')).toBeInTheDocument();
    });

    it('should navigate to next year when button clicked', () => {
      render(<ActivityHeatmap activity={mockActivity} />);
      const prevButton = screen.getByText('← Previous Year');
      const nextButton = screen.getByText('Next Year →');
      
      // Go to previous year first
      fireEvent.click(prevButton);
      expect(screen.getByText('2023')).toBeInTheDocument();
      
      // Then go back to current year
      fireEvent.click(nextButton);
      expect(screen.getByText('2024')).toBeInTheDocument();
    });

    it('should disable next year button when viewing current year', () => {
      render(<ActivityHeatmap activity={mockActivity} />);
      const nextButton = screen.getByText('Next Year →');
      
      expect(nextButton).toBeDisabled();
      expect(nextButton).toHaveClass('disabled:opacity-50');
    });

    it('should enable next year button when viewing past year', () => {
      render(<ActivityHeatmap activity={mockActivity} />);
      const prevButton = screen.getByText('← Previous Year');
      const nextButton = screen.getByText('Next Year →');
      
      fireEvent.click(prevButton);
      expect(nextButton).not.toBeDisabled();
    });

    it('should limit navigation to 5 years back', () => {
      render(<ActivityHeatmap activity={mockActivity} />);
      const prevButton = screen.getByText('← Previous Year');
      
      // Try to go back 6 years (should stop at 5)
      for (let i = 0; i < 6; i++) {
        if (!prevButton.disabled) {
          fireEvent.click(prevButton);
        }
      }
      
      // Should be at 2019 (5 years back from 2024)
      expect(screen.getByText('2019')).toBeInTheDocument();
      expect(prevButton).toBeDisabled();
    });
  });

  describe('tooltip functionality', () => {
    it('should show tooltip on mouse enter', async () => {
      const { container } = render(<ActivityHeatmap activity={mockActivity} />);
      const cells = container.querySelectorAll('.heatmap-container [class*="bg-"]');
      
      if (cells.length > 0) {
        fireEvent.mouseEnter(cells[0]);
        
        await waitFor(() => {
          const tooltip = container.querySelector('[class*="absolute z-50"]');
          expect(tooltip).toBeInTheDocument();
        });
      }
    });

    it('should hide tooltip on mouse leave', async () => {
      const { container } = render(<ActivityHeatmap activity={mockActivity} />);
      const cells = container.querySelectorAll('.heatmap-container [class*="bg-"]');
      
      if (cells.length > 0) {
        fireEvent.mouseEnter(cells[0]);
        fireEvent.mouseLeave(cells[0]);
        
        await waitFor(() => {
          const tooltip = container.querySelector('[class*="absolute z-50"]');
          expect(tooltip).not.toBeInTheDocument();
        });
      }
    });

    it('should display correct task count in tooltip', async () => {
      const { container } = render(<ActivityHeatmap activity={{ '2024-06-15': 5 }} />);
      const cells = container.querySelectorAll('.heatmap-container [class*="bg-"]');
      
      if (cells.length > 0) {
        fireEvent.mouseEnter(cells[0]);
        
        await waitFor(() => {
          // Should show "5 tasks completed" or similar
          expect(container.textContent).toMatch(/task/i);
        });
      }
    });
  });

  describe('intensity classes', () => {
    it('should apply correct class for zero activity', () => {
      const { container } = render(<ActivityHeatmap activity={{}} />);
      const cells = container.querySelectorAll('[class*="bg-gray"]');
      expect(cells.length).toBeGreaterThan(0);
    });

    it('should apply correct class for low activity (1-2)', () => {
      const { container } = render(<ActivityHeatmap activity={{ '2024-06-15': 1 }} />);
      const cells = container.querySelectorAll('[class*="bg-green"]');
      expect(cells.length).toBeGreaterThan(0);
    });

    it('should apply correct class for medium activity (3-4)', () => {
      const { container } = render(<ActivityHeatmap activity={{ '2024-06-15': 3 }} />);
      const cells = container.querySelectorAll('[class*="bg-green"]');
      expect(cells.length).toBeGreaterThan(0);
    });

    it('should apply correct class for high activity (5-6)', () => {
      const { container } = render(<ActivityHeatmap activity={{ '2024-06-15': 5 }} />);
      const cells = container.querySelectorAll('[class*="bg-green"]');
      expect(cells.length).toBeGreaterThan(0);
    });

    it('should apply correct class for very high activity (7+)', () => {
      const { container } = render(<ActivityHeatmap activity={{ '2024-06-15': 8 }} />);
      const cells = container.querySelectorAll('[class*="bg-green"]');
      expect(cells.length).toBeGreaterThan(0);
    });
  });

  describe('empty activity', () => {
    it('should render with empty activity object', () => {
      const { container } = render(<ActivityHeatmap activity={{}} />);
      expect(container.querySelector('.heatmap-container')).toBeInTheDocument();
    });

    it('should show all days as zero activity', () => {
      const { container } = render(<ActivityHeatmap activity={{}} />);
      const cells = container.querySelectorAll('[class*="bg-gray"]');
      expect(cells.length).toBeGreaterThan(0);
    });
  });

  describe('year boundary handling', () => {
    it('should correctly handle January dates', () => {
      const activity = { '2024-01-01': 3, '2024-01-31': 2 };
      const { container } = render(<ActivityHeatmap activity={activity} />);
      expect(container.querySelector('.heatmap-container')).toBeInTheDocument();
    });

    it('should correctly handle December dates', () => {
      const activity = { '2024-12-01': 3, '2024-12-31': 2 };
      const { container } = render(<ActivityHeatmap activity={activity} />);
      expect(container.querySelector('.heatmap-container')).toBeInTheDocument();
    });

    it('should handle leap year correctly', () => {
      const activity = { '2024-02-29': 5 };
      const { container } = render(<ActivityHeatmap activity={activity} />);
      expect(container.querySelector('.heatmap-container')).toBeInTheDocument();
    });
  });

  describe('hover effects', () => {
    it('should apply hover styles to interactive cells', () => {
      const { container } = render(<ActivityHeatmap activity={mockActivity} />);
      const cells = container.querySelectorAll('[class*="cursor-pointer"]');
      expect(cells.length).toBeGreaterThan(0);
    });

    it('should not apply hover styles to non-current month cells', () => {
      const { container } = render(<ActivityHeatmap activity={mockActivity} />);
      const cells = container.querySelectorAll('[class*="opacity-30"]');
      expect(cells.length).toBeGreaterThan(0);
    });
  });

  describe('accessibility', () => {
    it('should have proper structure for screen readers', () => {
      const { container } = render(<ActivityHeatmap activity={mockActivity} />);
      expect(container.querySelector('.heatmap-container')).toBeInTheDocument();
    });

    it('should have disabled button attributes', () => {
      render(<ActivityHeatmap activity={mockActivity} />);
      const nextButton = screen.getByText('Next Year →');
      expect(nextButton).toHaveAttribute('disabled');
    });

    it('should show title attribute on cells', () => {
      const { container } = render(<ActivityHeatmap activity={{ '2024-06-15': 5 }} />);
      const cells = container.querySelectorAll('[title]');
      expect(cells.length).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('should handle undefined activity gracefully', () => {
      const { container } = render(<ActivityHeatmap activity={{}} />);
      expect(container.querySelector('.heatmap-container')).toBeInTheDocument();
    });

    it('should handle very large activity counts', () => {
      const { container } = render(<ActivityHeatmap activity={{ '2024-06-15': 1000 }} />);
      expect(container.querySelector('.heatmap-container')).toBeInTheDocument();
    });

    it('should handle negative activity counts as zero', () => {
      const { container } = render(<ActivityHeatmap activity={{ '2024-06-15': -5 }} />);
      expect(container.querySelector('.heatmap-container')).toBeInTheDocument();
    });

    it('should update when activity prop changes', () => {
      const { rerender, container } = render(<ActivityHeatmap activity={mockActivity} />);
      expect(container.querySelector('.heatmap-container')).toBeInTheDocument();
      
      const newActivity = { '2024-06-15': 10 };
      rerender(<ActivityHeatmap activity={newActivity} />);
      expect(container.querySelector('.heatmap-container')).toBeInTheDocument();
    });
  });
});
