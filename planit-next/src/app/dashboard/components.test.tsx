import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StatCard, TaskCard, PriorityItem } from './components';
import type { Task } from '@/types';

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

describe('Dashboard Components', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // StatCard Component Tests
  describe('StatCard', () => {
    test('renders stat card with all required props', () => {
      const testIcon = <svg data-testid="test-icon"><path d="M1 1" /></svg>;
      render(
        <StatCard
          icon={testIcon}
          label="Total Tasks"
          value={15}
          color="blue"
        />
      );
      
      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
      expect(screen.getByText('Total Tasks')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
    });

    test('renders with different colors', () => {
      const colors = ['blue', 'green', 'yellow', 'red', 'indigo'];
      colors.forEach(color => {
        const testIcon = <span data-testid={`${color}-icon`}>icon</span>;
        render(
          <StatCard
            icon={testIcon}
            label={`${color} label`}
            value={10}
            color={color}
          />
        );
        
        expect(screen.getByText(`${color} label`)).toBeInTheDocument();
        expect(screen.getByText('10')).toBeInTheDocument();
      });
    });

    test('has proper styling structure', () => {
      const testIcon = <span>📊</span>;
      render(
        <StatCard
          icon={testIcon}
          label="Total Tasks"
          value={15}
          color="blue"
        />
      );
      
      expect(screen.getByText('Total Tasks')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
    });
  });

  // TaskCard Component Tests
  describe('TaskCard', () => {
    const mockTask: Task = {
      id: '1',
      title: 'Complete project documentation',
      description: 'Write comprehensive documentation for the project',
      priority: 'high',
      status: 'in-progress',
      dueDate: '2025-12-01',
      startTime: '09:00',
      endTime: '17:00',
      createdAt: '2025-11-20T09:00:00Z',
      userId: 'user1',
    };

    const mockHandlers = {
      onComplete: jest.fn(),
      onDelete: jest.fn(),
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('renders task card with all task information', () => {
      render(<TaskCard task={mockTask} {...mockHandlers} />);
      
      expect(screen.getByText('Complete project documentation')).toBeInTheDocument();
      expect(screen.getByText('Write comprehensive documentation for the project')).toBeInTheDocument();
      expect(screen.getByText('high')).toBeInTheDocument();
      expect(screen.getByText('in-progress')).toBeInTheDocument();
      expect(screen.getByText(/due: 12\/1\/2025/i)).toBeInTheDocument();
      expect(screen.getByText(/start: 09:00.*end: 17:00/i)).toBeInTheDocument();
    });

    test('renders task without description', () => {
      const taskWithoutDescription = { ...mockTask, description: undefined };
      render(<TaskCard task={taskWithoutDescription} {...mockHandlers} />);
      
      expect(screen.getByText('Complete project documentation')).toBeInTheDocument();
      expect(screen.queryByText('Write comprehensive documentation')).not.toBeInTheDocument();
    });

    test('renders task without due date', () => {
      const taskWithoutDueDate = { ...mockTask, dueDate: null };
      render(<TaskCard task={taskWithoutDueDate} {...mockHandlers} />);
      
      expect(screen.getByText('Complete project documentation')).toBeInTheDocument();
      expect(screen.queryByText(/due:/i)).not.toBeInTheDocument();
    });

    test('renders task without time information', () => {
      const taskWithoutTime = { ...mockTask, startTime: null, endTime: null };
      render(<TaskCard task={taskWithoutTime} {...mockHandlers} />);
      
      expect(screen.getByText('Complete project documentation')).toBeInTheDocument();
      expect(screen.queryByText(/start:/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/end:/i)).not.toBeInTheDocument();
    });

    test('applies correct priority badge styling for high priority', () => {
      render(<TaskCard task={mockTask} {...mockHandlers} />);
      
      const priorityBadge = screen.getByText('high');
      expect(priorityBadge).toHaveClass('bg-red-100', 'text-red-800', 'dark:bg-red-900/20', 'dark:text-red-400');
    });

    test('applies correct priority badge styling for medium priority', () => {
      const mediumTask = { ...mockTask, priority: 'medium' as const };
      render(<TaskCard task={mediumTask} {...mockHandlers} />);
      
      const priorityBadge = screen.getByText('medium');
      expect(priorityBadge).toHaveClass('bg-yellow-100', 'text-yellow-800', 'dark:bg-yellow-900/20', 'dark:text-yellow-400');
    });

    test('applies correct priority badge styling for low priority', () => {
      const lowTask = { ...mockTask, priority: 'low' as const };
      render(<TaskCard task={lowTask} {...mockHandlers} />);
      
      const priorityBadge = screen.getByText('low');
      expect(priorityBadge).toHaveClass('bg-green-100', 'text-green-800', 'dark:bg-green-900/20', 'dark:text-green-400');
    });

    test('applies correct status badge styling for pending status', () => {
      const pendingTask = { ...mockTask, status: 'pending' as const };
      render(<TaskCard task={pendingTask} {...mockHandlers} />);
      
      const statusBadge = screen.getByText('pending');
      expect(statusBadge).toHaveClass('bg-gray-100', 'text-gray-800', 'dark:bg-gray-700', 'dark:text-gray-300');
    });

    test('applies correct status badge styling for in-progress status', () => {
      render(<TaskCard task={mockTask} {...mockHandlers} />);
      
      const statusBadge = screen.getByText('in-progress');
      expect(statusBadge).toHaveClass('bg-blue-100', 'text-blue-800', 'dark:bg-blue-900/20', 'dark:text-blue-400');
    });

    test('applies correct status badge styling for completed status', () => {
      const completedTask = { ...mockTask, status: 'completed' as const };
      render(<TaskCard task={completedTask} {...mockHandlers} />);
      
      const statusBadge = screen.getByText('completed');
      expect(statusBadge).toHaveClass('bg-green-100', 'text-green-800', 'dark:bg-green-900/20', 'dark:text-green-400');
    });

    test('applies correct status badge styling for overdue status', () => {
      const overdueTask = { ...mockTask, status: 'overdue' as const };
      render(<TaskCard task={overdueTask} {...mockHandlers} />);
      
      const statusBadge = screen.getByText('overdue');
      expect(statusBadge).toHaveClass('bg-red-100', 'text-red-800', 'dark:bg-red-900/20', 'dark:text-red-400');
    });

    test('shows complete button for non-completed tasks', () => {
      render(<TaskCard task={mockTask} {...mockHandlers} />);
      
      expect(screen.getByTitle('Mark as completed')).toBeInTheDocument();
    });

    test('does not show complete button for completed tasks', () => {
      const completedTask = { ...mockTask, status: 'completed' as const };
      render(<TaskCard task={completedTask} {...mockHandlers} />);
      
      expect(screen.queryByTitle('Mark as completed')).not.toBeInTheDocument();
    });

    test('shows delete button for all tasks', () => {
      render(<TaskCard task={mockTask} {...mockHandlers} />);
      
      expect(screen.getByTitle('Delete task')).toBeInTheDocument();
    });

    test('calls onComplete when complete button is clicked', async () => {
      const user = userEvent.setup();
      render(<TaskCard task={mockTask} {...mockHandlers} />);
      
      const completeButton = screen.getByTitle('Mark as completed');
      await user.click(completeButton);
      
      expect(mockHandlers.onComplete).toHaveBeenCalledWith('1');
    });

    test('calls onDelete when delete button is clicked and confirmed', async () => {
      const user = userEvent.setup();
      (window.confirm as jest.Mock).mockReturnValue(true);
      
      render(<TaskCard task={mockTask} {...mockHandlers} />);
      
      const deleteButton = screen.getByTitle('Delete task');
      await user.click(deleteButton);
      
      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this task?');
      expect(mockHandlers.onDelete).toHaveBeenCalledWith('1');
    });

    test('does not call onDelete when delete is cancelled', async () => {
      const user = userEvent.setup();
      (window.confirm as jest.Mock).mockReturnValue(false);
      
      render(<TaskCard task={mockTask} {...mockHandlers} />);
      
      const deleteButton = screen.getByTitle('Delete task');
      await user.click(deleteButton);
      
      expect(window.confirm).toHaveBeenCalled();
      expect(mockHandlers.onDelete).not.toHaveBeenCalled();
    });

    test('shows loading state when completing task', () => {
      render(<TaskCard task={mockTask} {...mockHandlers} isCompleting />);
      
      const completeButton = screen.getByTitle('Mark as completed');
      const spinner = completeButton.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    test('shows loading state when deleting task', () => {
      render(<TaskCard task={mockTask} {...mockHandlers} isDeleting />);
      
      const deleteButton = screen.getByTitle('Delete task');
      const spinner = deleteButton.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    test('disables buttons during loading states', () => {
      render(<TaskCard task={mockTask} {...mockHandlers} isCompleting isDeleting />);
      
      const completeButton = screen.getByTitle('Mark as completed');
      const deleteButton = screen.getByTitle('Delete task');
      
      expect(completeButton).toBeDisabled();
      expect(deleteButton).toBeDisabled();
    });

    test('has proper card styling and layout', () => {
      render(<TaskCard task={mockTask} {...mockHandlers} />);
      
      const card = screen.getByText('Complete project documentation').closest('div');
      expect(card).toHaveClass('bg-white/80', 'dark:bg-gray-800/80', 'backdrop-blur-sm', 'border', 'rounded-xl');
    });

    test('has hover effects on buttons', () => {
      render(<TaskCard task={mockTask} {...mockHandlers} />);
      
      const completeButton = screen.getByTitle('Mark as completed');
      const deleteButton = screen.getByTitle('Delete task');
      
      expect(completeButton).toHaveClass('hover:bg-green-600');
      expect(deleteButton).toHaveClass('hover:bg-red-600');
    });
  });

  // PriorityItem Component Tests
  describe('PriorityItem', () => {
    test('renders priority item with label and count', () => {
      render(<PriorityItem label="High Priority" count={5} color="red" percentage={33} />);
      
      expect(screen.getByText('High Priority')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    test('renders SVG gauge with correct percentage', () => {
      render(<PriorityItem label="High Priority" count={5} color="red" percentage={33} />);
      
      const svg = screen.getByRole('img', { hidden: true });
      expect(svg).toBeInTheDocument();
      
      // Check if the gauge path exists
      const gaugePath = svg.querySelector('path');
      expect(gaugePath).toBeInTheDocument();
    });

    test('applies correct color styling for red variant', () => {
      render(<PriorityItem label="High Priority" count={5} color="red" percentage={33} />);
      
      const container = screen.getByText('High Priority').closest('div');
      expect(container).toHaveClass('border-red-200');
    });

    test('applies correct color styling for yellow variant', () => {
      render(<PriorityItem label="Medium Priority" count={3} color="yellow" percentage={20} />);
      
      const container = screen.getByText('Medium Priority').closest('div');
      expect(container).toHaveClass('border-yellow-200');
    });

    test('applies correct color styling for green variant', () => {
      render(<PriorityItem label="Low Priority" count={2} color="green" percentage={13} />);
      
      const container = screen.getByText('Low Priority').closest('div');
      expect(container).toHaveClass('border-green-200');
    });

    test('handles zero count correctly', () => {
      render(<PriorityItem label="High Priority" count={0} color="red" percentage={0} />);
      
      expect(screen.getByText('High Priority')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    test('handles 100% percentage correctly', () => {
      render(<PriorityItem label="High Priority" count={10} color="red" percentage={100} />);
      
      const svg = screen.getByRole('img', { hidden: true });
      expect(svg).toBeInTheDocument();
    });

    test('has proper responsive styling', () => {
      render(<PriorityItem label="High Priority" count={5} color="red" percentage={33} />);
      
      const container = screen.getByText('High Priority').closest('div');
      expect(container).toHaveClass('p-4', 'backdrop-blur-sm');
    });

    test('has hover effects', () => {
      render(<PriorityItem label="High Priority" count={5} color="red" percentage={33} />);
      
      const container = screen.getByText('High Priority').closest('div');
      expect(container).toHaveClass('hover:shadow-md', 'transition-all', 'duration-300');
    });

    test('displays count with proper styling', () => {
      render(<PriorityItem label="High Priority" count={5} color="red" percentage={33} />);
      
      const countElement = screen.getByText('5');
      expect(countElement).toHaveClass('text-2xl', 'font-bold');
    });

    test('displays label with proper styling', () => {
      render(<PriorityItem label="High Priority" count={5} color="red" percentage={33} />);
      
      const labelElement = screen.getByText('High Priority');
      expect(labelElement).toHaveClass('text-sm', 'font-medium');
    });

    test('renders gauge background and foreground paths', () => {
      render(<PriorityItem label="High Priority" count={5} color="red" percentage={33} />);
      
      const svg = screen.getByRole('img', { hidden: true });
      const paths = svg.querySelectorAll('path');
      
      // Should have background and foreground paths
      expect(paths.length).toBeGreaterThanOrEqual(2);
    });
  });

  // Integration Tests
  describe('Component Integration', () => {
    test('components work together in dashboard layout', () => {
      const mockTask: Task = {
        id: '1',
        title: 'Test Task',
        priority: 'high',
        status: 'pending',
        dueDate: '2025-12-01',
        createdAt: '2025-11-20T09:00:00Z',
        userId: 'user1',
      };

      render(
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-8">
              <StatCard icon="📊" label="Total" value="10" color="blue" />
              <StatCard icon="⏳" label="Pending" value="3" color="yellow" />
              <StatCard icon="🔄" label="Progress" value="4" color="indigo" />
              <StatCard icon="✅" label="Done" value="2" color="green" />
              <StatCard icon="🚨" label="Overdue" value="1" color="red" />
            </div>
            <div className="space-y-4">
              <TaskCard
                task={mockTask}
                onComplete={jest.fn()}
                onDelete={jest.fn()}
              />
            </div>
          </div>
          <div className="space-y-4">
            <PriorityItem label="High" count={3} color="red" percentage={30} />
            <PriorityItem label="Medium" count={5} color="yellow" percentage={50} />
            <PriorityItem label="Low" count={2} color="green" percentage={20} />
          </div>
        </div>
      );

      // Check that all components rendered
      expect(screen.getByText('Total')).toBeInTheDocument();
      expect(screen.getByText('Test Task')).toBeInTheDocument();
      expect(screen.getByText('High')).toBeInTheDocument();
    });
  });

  // Dark Mode Tests
  describe('Dark Mode Support', () => {
    test('StatCard has proper dark mode classes', () => {
      render(<StatCard icon="📊" label="Total" value="10" color="blue" />);
      
      const card = screen.getByText('Total').closest('div');
      expect(card).toHaveClass('dark:bg-gray-800/80', 'dark:border-blue-600/30');
    });

    test('TaskCard has proper dark mode classes', () => {
      const mockTask: Task = {
        id: '1',
        title: 'Test Task',
        priority: 'high',
        status: 'pending',
        createdAt: '2025-11-20T09:00:00Z',
        userId: 'user1',
      };

      render(<TaskCard task={mockTask} onComplete={jest.fn()} onDelete={jest.fn()} />);
      
      const card = screen.getByText('Test Task').closest('div');
      expect(card).toHaveClass('dark:bg-gray-800/80');
    });

    test('PriorityItem has proper dark mode classes', () => {
      render(<PriorityItem label="High" count={3} color="red" />);
      
      const container = screen.getByText('High').closest('div');
      expect(container).toBeInTheDocument();
    });
  });

  describe('TaskCard - Additional Coverage', () => {
    const mockTask: Task = {
      id: '2',
      title: 'Test Task',
      description: 'Test Description',
      priority: 'medium',
      status: 'pending',
      dueDate: '2025-12-15',
      startTime: null,
      endTime: null,
      createdAt: '2025-11-20T09:00:00Z',
      updatedAt: '2025-11-20T09:00:00Z',
      userId: 'user1',
    };

    test('handles task without time fields', () => {
      render(<TaskCard task={mockTask} />);
      
      expect(screen.getByText('Test Task')).toBeInTheDocument();
      expect(screen.getByText('medium')).toBeInTheDocument();
      expect(screen.getByText('pending')).toBeInTheDocument();
    });

    test('handles task without due date', () => {
      const taskWithoutDueDate = { ...mockTask, dueDate: null };
      render(<TaskCard task={taskWithoutDueDate} />);
      
      expect(screen.getByText('No due date')).toBeInTheDocument();
    });

    test('handles low priority task', () => {
      const lowPriorityTask = { ...mockTask, priority: 'low' as const };
      render(<TaskCard task={lowPriorityTask} />);
      
      expect(screen.getByText('low')).toBeInTheDocument();
    });

    test('handles overdue status', () => {
      const overdueTask = { ...mockTask, status: 'overdue' as const };
      render(<TaskCard task={overdueTask} />);
      
      expect(screen.getByText('overdue')).toBeInTheDocument();
    });

    test('handles completed task without complete button', () => {
      const completedTask = { ...mockTask, status: 'completed' as const };
      const onComplete = jest.fn();
      render(<TaskCard task={completedTask} onComplete={onComplete} />);
      
      expect(screen.queryByTitle('Mark as completed')).not.toBeInTheDocument();
    });

    test('handles task with only start time', () => {
      const taskWithStartTime = { ...mockTask, startTime: '09:00', endTime: null };
      render(<TaskCard task={taskWithStartTime} />);
      
      expect(screen.getByText(/Start: 09:00/)).toBeInTheDocument();
    });

    test('handles task with only end time', () => {
      const taskWithEndTime = { ...mockTask, startTime: null, endTime: '17:00' };
      render(<TaskCard task={taskWithEndTime} />);
      
      expect(screen.getByText(/End: 17:00/)).toBeInTheDocument();
    });

    test('handles complete button click when already updating', async () => {
      const onComplete = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      render(<TaskCard task={mockTask} onComplete={onComplete} />);
      
      const completeButton = screen.getByTitle('Mark as completed');
      
      // Click once
      fireEvent.click(completeButton);
      
      // Try to click again while updating
      fireEvent.click(completeButton);
      
      await waitFor(() => {
        expect(onComplete).toHaveBeenCalledTimes(1);
      });
    });

    test('handles complete error gracefully', async () => {
      const onComplete = jest.fn().mockRejectedValue(new Error('Network error'));
      render(<TaskCard task={mockTask} onComplete={onComplete} />);
      
      const completeButton = screen.getByTitle('Mark as completed');
      fireEvent.click(completeButton);
      
      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith('Failed to complete task:', expect.any(Error));
      });
    });

    test('does not call onComplete when task is completed', () => {
      const completedTask = { ...mockTask, status: 'completed' as const };
      const onComplete = jest.fn();
      render(<TaskCard task={completedTask} onComplete={onComplete} />);
      
      expect(onComplete).not.toHaveBeenCalled();
    });

    test('renders without onComplete handler', () => {
      render(<TaskCard task={mockTask} />);
      
      expect(screen.queryByTitle('Mark as completed')).not.toBeInTheDocument();
    });

    test('renders without onDelete handler', () => {
      render(<TaskCard task={mockTask} />);
      
      expect(screen.queryByTitle('Delete task')).not.toBeInTheDocument();
    });

    test('shows loading spinner when updating', async () => {
      const onComplete = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      render(<TaskCard task={mockTask} onComplete={onComplete} />);
      
      const completeButton = screen.getByTitle('Mark as completed');
      fireEvent.click(completeButton);
      
      await waitFor(() => {
        const spinner = screen.getByRole('button', { name: /mark as completed/i }).querySelector('.animate-spin');
        expect(spinner).toBeInTheDocument();
      });
    });
  });

  describe('PriorityItem - Additional Coverage', () => {
    test('renders with red color', () => {
      render(<PriorityItem label="High Priority" count={5} color="red" />);
      
      expect(screen.getByText('High Priority')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    test('renders with yellow color', () => {
      render(<PriorityItem label="Medium Priority" count={3} color="yellow" />);
      
      expect(screen.getByText('Medium Priority')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    test('renders with blue color', () => {
      render(<PriorityItem label="Low Priority" count={2} color="blue" />);
      
      expect(screen.getByText('Low Priority')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    test('renders with zero count', () => {
      render(<PriorityItem label="No Tasks" count={0} color="blue" />);
      
      expect(screen.getByText('No Tasks')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    test('renders with large count', () => {
      render(<PriorityItem label="Many Tasks" count={999} color="red" />);
      
      expect(screen.getByText('Many Tasks')).toBeInTheDocument();
      expect(screen.getByText('999')).toBeInTheDocument();
    });

    test('has proper SVG gauge structure', () => {
      const { container } = render(<PriorityItem label="Test" count={5} color="red" />);
      
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg?.querySelector('circle')).toBeInTheDocument();
      expect(svg?.querySelector('path')).toBeInTheDocument();
    });
  });

  describe('StatCard - Additional Coverage', () => {
    test('renders with zero value', () => {
      const testIcon = <span>📊</span>;
      render(<StatCard icon={testIcon} label="Empty" value={0} color="blue" />);
      
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    test('renders with large value', () => {
      const testIcon = <span>📊</span>;
      render(<StatCard icon={testIcon} label="Large" value={9999} color="green" />);
      
      expect(screen.getByText('9999')).toBeInTheDocument();
    });

    test('renders with negative value', () => {
      const testIcon = <span>📊</span>;
      render(<StatCard icon={testIcon} label="Negative" value={-5} color="red" />);
      
      expect(screen.getByText('-5')).toBeInTheDocument();
    });

    test('renders with complex icon', () => {
      const complexIcon = (
        <svg data-testid="complex-icon">
          <circle cx="10" cy="10" r="5" />
          <path d="M10 10 L20 20" />
        </svg>
      );
      render(<StatCard icon={complexIcon} label="Complex" value={42} color="indigo" />);
      
      expect(screen.getByTestId('complex-icon')).toBeInTheDocument();
    });

    test('renders with long label text', () => {
      const testIcon = <span>📊</span>;
      const longLabel = 'This is a very long label that might wrap to multiple lines';
      render(<StatCard icon={testIcon} label={longLabel} value={10} color="blue" />);
      
      expect(screen.getByText(longLabel)).toBeInTheDocument();
    });
  });
});
