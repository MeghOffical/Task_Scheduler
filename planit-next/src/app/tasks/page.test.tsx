import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TasksPage from './page';
import { createTask, updateTask, deleteTask } from '@/lib/tasks';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  })),
  usePathname: jest.fn(() => '/tasks'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}));

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

// Mock the task library functions
jest.mock('@/lib/tasks', () => ({
  createTask: jest.fn(),
  updateTask: jest.fn(),
  deleteTask: jest.fn(),
}));

describe('TasksPage', () => {
  const mockTasks = [
    {
      id: '1',
      title: 'Test Task 1',
      description: 'Description 1',
      priority: 'high' as const,
      status: 'pending' as const,
      dueDate: '2025-12-31',
      startTime: '09:00',
      endTime: '10:00',
      userId: 'user1',
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
    },
    {
      id: '2',
      title: 'Test Task 2',
      description: 'Description 2',
      priority: 'medium' as const,
      status: 'in-progress' as const,
      dueDate: '2025-12-25',
      startTime: '',
      endTime: '',
      userId: 'user1',
      createdAt: '2025-01-02',
      updatedAt: '2025-01-02',
    },
    {
      id: '3',
      title: 'Test Task 3',
      description: '',
      priority: 'low' as const,
      status: 'completed' as const,
      dueDate: '2025-11-30',
      userId: 'user1',
      createdAt: '2025-01-03',
      updatedAt: '2025-01-03',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockTasks,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initial Render and Loading', () => {
    it('should render loading spinner initially', () => {
      render(<TasksPage />);
      expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument();
    });

    it('should fetch and display tasks', async () => {
      render(<TasksPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Task 1')).toBeInTheDocument();
        expect(screen.getByText('Test Task 2')).toBeInTheDocument();
        expect(screen.getByText('Test Task 3')).toBeInTheDocument();
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/tasks');
    });

    it('should display page title', async () => {
      render(<TasksPage />);

      await waitFor(() => {
        expect(screen.getByText('Tasks')).toBeInTheDocument();
      });
    });

    it('should handle fetch error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        text: async () => 'Failed to fetch',
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(<TasksPage />);

      await waitFor(() => {
        expect(screen.queryByText('Test Task 1')).not.toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Task Creation', () => {
    it('should open create task modal', async () => {
      const user = userEvent.setup();
      render(<TasksPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Task 1')).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /add task/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      });
    });

    it('should create a new task', async () => {
      const user = userEvent.setup();
      (createTask as jest.Mock).mockResolvedValueOnce({});
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTasks,
      }).mockResolvedValueOnce({
        ok: true,
        json: async () => [...mockTasks, { id: '4', title: 'New Task', priority: 'medium', status: 'pending', dueDate: '2025-12-01', userId: 'user1', createdAt: '2025-01-04', updatedAt: '2025-01-04' }],
      });

      render(<TasksPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Task 1')).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /add task/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      });

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'New Task');

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(createTask).toHaveBeenCalled();
      });
    });

    it('should handle create task error', async () => {
      const user = userEvent.setup();
      (createTask as jest.Mock).mockRejectedValueOnce(new Error('Create failed'));

      render(<TasksPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Task 1')).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /add task/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      });

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'New Task');

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/create failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Task Editing', () => {
    it('should open edit modal with task data', async () => {
      const user = userEvent.setup();
      render(<TasksPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Task 1')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByTestId('pencil-icon');
      await user.click(editButtons[0].parentElement as HTMLElement);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Task 1')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Description 1')).toBeInTheDocument();
      });
    });

    it('should update an existing task', async () => {
      const user = userEvent.setup();
      (updateTask as jest.Mock).mockResolvedValueOnce({});
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTasks,
      }).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTasks,
      });

      render(<TasksPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Task 1')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByTestId('pencil-icon');
      await user.click(editButtons[0].parentElement as HTMLElement);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Task 1')).toBeInTheDocument();
      });

      const titleInput = screen.getByDisplayValue('Test Task 1');
      await user.clear(titleInput);
      await user.type(titleInput, 'Updated Task');

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(updateTask).toHaveBeenCalledWith('1', expect.objectContaining({
          title: 'Updated Task',
        }));
      });
    });

    it('should handle update task error', async () => {
      const user = userEvent.setup();
      (updateTask as jest.Mock).mockRejectedValueOnce(new Error('Update failed'));

      render(<TasksPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Task 1')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByTestId('pencil-icon');
      await user.click(editButtons[0].parentElement as HTMLElement);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Task 1')).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/update failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Task Deletion', () => {
    it('should delete a task after confirmation', async () => {
      const user = userEvent.setup();
      window.confirm = jest.fn(() => true);
      (deleteTask as jest.Mock).mockResolvedValueOnce({});
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTasks,
      }).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTasks.slice(1),
      });

      render(<TasksPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Task 1')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByTestId('trash-icon');
      await user.click(deleteButtons[0].parentElement as HTMLElement);

      await waitFor(() => {
        expect(deleteTask).toHaveBeenCalledWith('1');
      });
    });

    it('should not delete task if confirmation is cancelled', async () => {
      const user = userEvent.setup();
      window.confirm = jest.fn(() => false);

      render(<TasksPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Task 1')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByTestId('trash-icon');
      await user.click(deleteButtons[0].parentElement as HTMLElement);

      expect(deleteTask).not.toHaveBeenCalled();
    });

    it('should handle delete task error', async () => {
      const user = userEvent.setup();
      window.confirm = jest.fn(() => true);
      (deleteTask as jest.Mock).mockRejectedValueOnce(new Error('Delete failed'));

      render(<TasksPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Task 1')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByTestId('trash-icon');
      await user.click(deleteButtons[0].parentElement as HTMLElement);

      await waitFor(() => {
        expect(screen.getByText(/delete failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Search and Filters', () => {
    it('should filter tasks by search query', async () => {
      const user = userEvent.setup();
      render(<TasksPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Task 1')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search tasks/i);
      await user.type(searchInput, 'Task 1');

      await waitFor(() => {
        expect(screen.getByText('Test Task 1')).toBeInTheDocument();
        expect(screen.queryByText('Test Task 2')).not.toBeInTheDocument();
        expect(screen.queryByText('Test Task 3')).not.toBeInTheDocument();
      });
    });

    it('should filter tasks by status', async () => {
      const user = userEvent.setup();
      render(<TasksPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Task 1')).toBeInTheDocument();
      });

      const statusSelect = screen.getByLabelText(/status/i);
      await user.selectOptions(statusSelect, 'completed');

      await waitFor(() => {
        expect(screen.getByText('Test Task 3')).toBeInTheDocument();
        expect(screen.queryByText('Test Task 1')).not.toBeInTheDocument();
        expect(screen.queryByText('Test Task 2')).not.toBeInTheDocument();
      });
    });

    it('should filter tasks by priority', async () => {
      const user = userEvent.setup();
      render(<TasksPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Task 1')).toBeInTheDocument();
      });

      const prioritySelect = screen.getByLabelText(/priority/i);
      await user.selectOptions(prioritySelect, 'high');

      await waitFor(() => {
        expect(screen.getByText('Test Task 1')).toBeInTheDocument();
        expect(screen.queryByText('Test Task 2')).not.toBeInTheDocument();
        expect(screen.queryByText('Test Task 3')).not.toBeInTheDocument();
      });
    });
  });

  describe('CSV Import/Export', () => {
    it('should render import CSV button', async () => {
      render(<TasksPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Task 1')).toBeInTheDocument();
      });

      expect(screen.getByText(/import csv/i)).toBeInTheDocument();
    });

    it('should render export CSV button', async () => {
      render(<TasksPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Task 1')).toBeInTheDocument();
      });

      expect(screen.getByText(/export csv/i)).toBeInTheDocument();
    });

    it('should export tasks to CSV', async () => {
      const user = userEvent.setup();
      const createElementSpy = jest.spyOn(document, 'createElement');
      const appendChildSpy = jest.spyOn(document.body, 'appendChild').mockImplementation();
      const removeChildSpy = jest.spyOn(document.body, 'removeChild').mockImplementation();

      render(<TasksPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Task 1')).toBeInTheDocument();
      });

      const exportButton = screen.getByText(/export csv/i);
      await user.click(exportButton);

      expect(createElementSpy).toHaveBeenCalledWith('a');
      
      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });

    it('should handle CSV import', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTasks,
      }).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      }).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTasks,
      });

      render(<TasksPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Task 1')).toBeInTheDocument();
      });

      const file = new File(['title,description,dueDate\nTask,Desc,2025-12-01'], 'tasks.csv', { type: 'text/csv' });
      const input = screen.getByTestId('document-arrow-down-icon').parentElement?.querySelector('input');

      if (input) {
        fireEvent.change(input, { target: { files: [file] } });

        await waitFor(() => {
          expect(global.fetch).toHaveBeenCalledWith('/api/tasks/import', expect.objectContaining({
            method: 'POST',
          }));
        });
      }
    });

    it('should handle CSV import error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTasks,
      }).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Import failed' }),
      });

      render(<TasksPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Task 1')).toBeInTheDocument();
      });

      const file = new File(['invalid'], 'tasks.csv', { type: 'text/csv' });
      const input = screen.getByTestId('document-arrow-down-icon').parentElement?.querySelector('input');

      if (input) {
        fireEvent.change(input, { target: { files: [file] } });

        await waitFor(() => {
          expect(screen.getByText(/import failed/i)).toBeInTheDocument();
        });
      }
    });
  });

  describe('Priority and Status Classes', () => {
    it('should display high priority badge', async () => {
      render(<TasksPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Task 1')).toBeInTheDocument();
      });

      const highPriorityBadge = screen.getByText(/high/i);
      expect(highPriorityBadge).toHaveClass('text-red-700');
    });

    it('should display completed status badge', async () => {
      render(<TasksPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Task 3')).toBeInTheDocument();
      });

      const completedBadge = screen.getByText(/completed/i);
      expect(completedBadge).toHaveClass('text-green-700');
    });
  });

  describe('Modal Interactions', () => {
    it('should close modal on cancel', async () => {
      const user = userEvent.setup();
      render(<TasksPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Task 1')).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /add task/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('should reset form when closing modal', async () => {
      const user = userEvent.setup();
      render(<TasksPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Task 1')).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /add task/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      });

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'Test');

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      await user.click(addButton);

      await waitFor(() => {
        const resetInput = screen.getByLabelText(/title/i) as HTMLInputElement;
        expect(resetInput.value).toBe('');
      });
    });
  });
});
