/**
 * Comprehensive unit tests for AI Assistant page
 * Note: This page has complex AI logic that requires significant API mocking
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import AIAssistantPage from './page';

// Mock PageWrapper component
jest.mock('@/components/page-wrapper', () => {
  return function MockPageWrapper({ children }: { children: React.ReactNode }) {
    return <div data-testid="page-wrapper">{children}</div>;
  };
});

describe('AIAssistantPage', () => {
  let mockFetch: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Mock fetch globally
    mockFetch = jest.fn((url: string) => {
      if (url === '/api/user/me') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ username: 'testuser' }),
        } as Response);
      }
      return Promise.resolve({
        ok: false,
        json: async () => ({}),
      } as Response);
    });
    global.fetch = mockFetch as any;
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('Initial Render', () => {
    it('should render the AI assistant page', () => {
      render(<AIAssistantPage />);
      expect(screen.getByTestId('page-wrapper')).toBeInTheDocument();
    });

    it('should display the page title', () => {
      render(<AIAssistantPage />);
      expect(screen.getByRole('heading', { name: /ai assistant/i })).toBeInTheDocument();
    });

    it('should display the subtitle', () => {
      render(<AIAssistantPage />);
      expect(screen.getByText(/your intelligent task management helper/i)).toBeInTheDocument();
    });

    it('should render the AI assistant icon', () => {
      render(<AIAssistantPage />);
      // Check for the icon container with gradient background
      const iconContainer = document.querySelector('.bg-gradient-to-br.from-blue-600.to-purple-600');
      expect(iconContainer).toBeInTheDocument();
    });

    it('should render initial welcome message from assistant', () => {
      render(<AIAssistantPage />);
      expect(screen.getByText(/Hello! I'm your AI task assistant/i)).toBeInTheDocument();
    });

    it('should display capabilities in welcome message', () => {
      render(<AIAssistantPage />);
      expect(screen.getByText(/Create and manage tasks with due dates/i)).toBeInTheDocument();
      expect(screen.getByText(/Filter tasks by priority/i)).toBeInTheDocument();
    });

    it('should render input field with placeholder', () => {
      render(<AIAssistantPage />);
      expect(screen.getByPlaceholderText(/ask me anything about your tasks/i)).toBeInTheDocument();
    });

    it('should render send button', () => {
      render(<AIAssistantPage />);
      const sendButton = screen.getByRole('button', { name: /send/i });
      expect(sendButton).toBeInTheDocument();
    });
  });

  describe('User Info Fetching', () => {
    it('should fetch user info on mount', async () => {
      render(<AIAssistantPage />);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/user/me', { credentials: 'include' });
      });
    });

    it('should handle failed user info fetch gracefully', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url === '/api/user/me') {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({
          ok: false,
          json: async () => ({}),
        } as Response);
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      render(<AIAssistantPage />);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch user info:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Form Interaction', () => {
    it('should update input value when user types', async () => {
      const user = userEvent.setup({ delay: null });
      render(<AIAssistantPage />);
      
      const input = screen.getByPlaceholderText(/ask me anything about your tasks/i);
      await user.type(input, 'test message');
      
      expect(input).toHaveValue('test message');
    });

    it('should disable send button when input is empty', () => {
      render(<AIAssistantPage />);
      const sendButton = screen.getByRole('button', { name: /send/i });
      expect(sendButton).toBeDisabled();
    });

    it('should enable send button when input has text', async () => {
      const user = userEvent.setup({ delay: null });
      render(<AIAssistantPage />);
      
      const input = screen.getByPlaceholderText(/ask me anything about your tasks/i);
      const sendButton = screen.getByRole('button', { name: /send/i });
      
      await user.type(input, 'hello');
      
      expect(sendButton).not.toBeDisabled();
    });

    it('should clear input after submitting message', async () => {
      const user = userEvent.setup({ delay: null });
      mockFetch.mockImplementation(() => 
        Promise.resolve({
          ok: true,
          json: async () => ({ message: 'Response' }),
        } as Response)
      );

      render(<AIAssistantPage />);
      
      const input = screen.getByPlaceholderText(/ask me anything about your tasks/i);
      await user.type(input, 'hello');
      await user.click(screen.getByRole('button', { name: /send/i }));
      
      await waitFor(() => {
        expect(input).toHaveValue('');
      });
    });

    it('should show loading state while processing', async () => {
      const user = userEvent.setup({ delay: null });
      mockFetch.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ message: 'Response' }),
        } as Response), 100))
      );

      render(<AIAssistantPage />);
      
      const input = screen.getByPlaceholderText(/ask me anything about your tasks/i);
      await user.type(input, 'test');
      await user.click(screen.getByRole('button', { name: /send/i }));
      
      expect(screen.getByRole('button', { name: /send/i })).toBeDisabled();
    });

    it('should disable input while loading', async () => {
      const user = userEvent.setup({ delay: null });
      mockFetch.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ message: 'Response' }),
        } as Response), 100))
      );

      render(<AIAssistantPage />);
      
      const input = screen.getByPlaceholderText(/ask me anything about your tasks/i);
      await user.type(input, 'test');
      await user.click(screen.getByRole('button', { name: /send/i }));
      
      expect(input).toBeDisabled();
    });
  });

  describe('Message Display', () => {
    it('should display user message after submission', async () => {
      const user = userEvent.setup({ delay: null });
      mockFetch.mockImplementation(() => 
        Promise.resolve({
          ok: true,
          json: async () => ({ message: 'AI Response' }),
        } as Response)
      );

      render(<AIAssistantPage />);
      
      const input = screen.getByPlaceholderText(/ask me anything about your tasks/i);
      await user.type(input, 'test message');
      await user.click(screen.getByRole('button', { name: /send/i }));
      
      await waitFor(() => {
        expect(screen.getByText('test message')).toBeInTheDocument();
      });
    });

    it('should display user messages with blue background', async () => {
      const user = userEvent.setup({ delay: null });
      mockFetch.mockImplementation(() => 
        Promise.resolve({
          ok: true,
          json: async () => ({ message: 'Response' }),
        } as Response)
      );

      render(<AIAssistantPage />);
      
      const input = screen.getByPlaceholderText(/ask me anything about your tasks/i);
      await user.type(input, 'user test');
      await user.click(screen.getByRole('button', { name: /send/i }));
      
      await waitFor(() => {
        const userMessage = screen.getByText('user test').closest('div');
        expect(userMessage).toHaveClass('bg-blue-600');
      });
    });

    it('should display assistant messages with gray background', () => {
      render(<AIAssistantPage />);
      
      const welcomeMessage = screen.getByText(/Hello! I'm your AI task assistant/i).closest('div');
      expect(welcomeMessage).toHaveClass('bg-gray-100', 'dark:bg-gray-800');
    });

    it('should display timestamp for messages', () => {
      render(<AIAssistantPage />);
      jest.advanceTimersByTime(100);
      
      const timestamps = screen.getAllByText(/\d{1,2}:\d{2}/);
      expect(timestamps.length).toBeGreaterThan(0);
    });
  });

  describe('Create Task Intent', () => {
    it('should create task when user says "create task"', async () => {
      const user = userEvent.setup({ delay: null });
      
      mockFetch.mockImplementation((url: string, options?: RequestInit) => {
        if (url === '/api/tasks' && options?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: async () => ({ id: '123', title: 'Buy groceries', priority: 'medium' }),
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ username: 'testuser' }),
        } as Response);
      });

      render(<AIAssistantPage />);
      
      const input = screen.getByPlaceholderText(/ask me anything about your tasks/i);
      await user.type(input, 'create task buy groceries');
      await user.click(screen.getByRole('button', { name: /send/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/task created successfully/i)).toBeInTheDocument();
      });
    });

    it('should handle task creation with priority', async () => {
      const user = userEvent.setup({ delay: null });
      
      mockFetch.mockImplementation((url: string, options?: RequestInit) => {
        if (url === '/api/tasks' && options?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: async () => ({ id: '123', title: 'Urgent task', priority: 'high' }),
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ username: 'testuser' }),
        } as Response);
      });

      render(<AIAssistantPage />);
      
      const input = screen.getByPlaceholderText(/ask me anything about your tasks/i);
      await user.type(input, 'create high priority task urgent work');
      await user.click(screen.getByRole('button', { name: /send/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/task created successfully/i)).toBeInTheDocument();
      });
    });

    it('should handle failed task creation', async () => {
      const user = userEvent.setup({ delay: null });
      
      mockFetch.mockImplementation((url: string, options?: RequestInit) => {
        if (url === '/api/tasks' && options?.method === 'POST') {
          return Promise.resolve({
            ok: false,
            json: async () => ({ error: 'Failed to create' }),
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ username: 'testuser' }),
        } as Response);
      });

      render(<AIAssistantPage />);
      
      const input = screen.getByPlaceholderText(/ask me anything about your tasks/i);
      await user.type(input, 'create task test');
      await user.click(screen.getByRole('button', { name: /send/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/Failed to create task/i)).toBeInTheDocument();
      });
    });

    it('should create task with due date tomorrow', async () => {
      const user = userEvent.setup({ delay: null });
      
      mockFetch.mockImplementation((url: string, options?: RequestInit) => {
        if (url === '/api/tasks' && options?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: async () => ({ id: '123', title: 'Buy milk', priority: 'medium' }),
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ username: 'testuser' }),
        } as Response);
      });

      render(<AIAssistantPage />);
      
      const input = screen.getByPlaceholderText(/ask me anything about your tasks/i);
      await user.type(input, 'create task buy milk tomorrow');
      await user.click(screen.getByRole('button', { name: /send/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/task created successfully/i)).toBeInTheDocument();
        expect(screen.getByText(/due:/i)).toBeInTheDocument();
      });
    });

    it('should create task with due date next week', async () => {
      const user = userEvent.setup({ delay: null });
      
      mockFetch.mockImplementation((url: string, options?: RequestInit) => {
        if (url === '/api/tasks' && options?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: async () => ({ id: '123', title: 'Meeting', priority: 'medium' }),
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ username: 'testuser' }),
        } as Response);
      });

      render(<AIAssistantPage />);
      
      const input = screen.getByPlaceholderText(/ask me anything about your tasks/i);
      await user.type(input, 'add task meeting next week');
      await user.click(screen.getByRole('button', { name: /send/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/task created successfully/i)).toBeInTheDocument();
      });
    });
  });

  describe('Filter Tasks Intent', () => {
    it('should show all tasks when user says "show tasks"', async () => {
      const user = userEvent.setup({ delay: null });
      
      mockFetch.mockImplementation((url: string) => {
        if (url === '/api/tasks') {
          return Promise.resolve({
            ok: true,
            json: async () => ([
              { id: '1', title: 'Task 1', status: 'pending', priority: 'high' },
              { id: '2', title: 'Task 2', status: 'completed', priority: 'low' },
            ]),
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ username: 'testuser' }),
        } as Response);
      });

      render(<AIAssistantPage />);
      
      const input = screen.getByPlaceholderText(/ask me anything about your tasks/i);
      await user.type(input, 'show my tasks');
      await user.click(screen.getByRole('button', { name: /send/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/all tasks/i)).toBeInTheDocument();
        expect(screen.getByText(/task 1/i)).toBeInTheDocument();
      });
    });

    it('should filter high priority tasks', async () => {
      const user = userEvent.setup({ delay: null });
      
      mockFetch.mockImplementation((url: string) => {
        if (url === '/api/tasks') {
          return Promise.resolve({
            ok: true,
            json: async () => ([
              { id: '1', title: 'Urgent task', status: 'pending', priority: 'high' },
            ]),
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ username: 'testuser' }),
        } as Response);
      });

      render(<AIAssistantPage />);
      
      const input = screen.getByPlaceholderText(/ask me anything about your tasks/i);
      await user.type(input, 'show urgent tasks');
      await user.click(screen.getByRole('button', { name: /send/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/high priority/i)).toBeInTheDocument();
      });
    });

    it('should show message when no tasks exist', async () => {
      const user = userEvent.setup({ delay: null });
      
      mockFetch.mockImplementation((url: string) => {
        if (url === '/api/tasks') {
          return Promise.resolve({
            ok: true,
            json: async () => ([]),
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ username: 'testuser' }),
        } as Response);
      });

      render(<AIAssistantPage />);
      
      const input = screen.getByPlaceholderText(/ask me anything about your tasks/i);
      await user.type(input, 'show tasks');
      await user.click(screen.getByRole('button', { name: /send/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/you have no tasks yet/i)).toBeInTheDocument();
      });
    });

    it('should filter pending tasks', async () => {
      const user = userEvent.setup({ delay: null });
      
      mockFetch.mockImplementation((url: string) => {
        if (url === '/api/tasks') {
          return Promise.resolve({
            ok: true,
            json: async () => ([
              { id: '1', title: 'Pending task', status: 'pending', priority: 'medium' },
            ]),
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ username: 'testuser' }),
        } as Response);
      });

      render(<AIAssistantPage />);
      
      const input = screen.getByPlaceholderText(/ask me anything about your tasks/i);
      await user.type(input, 'show pending tasks');
      await user.click(screen.getByRole('button', { name: /send/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/pending/i)).toBeInTheDocument();
      });
    });

    it('should filter completed tasks', async () => {
      const user = userEvent.setup({ delay: null });
      
      mockFetch.mockImplementation((url: string) => {
        if (url === '/api/tasks') {
          return Promise.resolve({
            ok: true,
            json: async () => ([
              { id: '1', title: 'Done task', status: 'completed', priority: 'medium' },
            ]),
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ username: 'testuser' }),
        } as Response);
      });

      render(<AIAssistantPage />);
      
      const input = screen.getByPlaceholderText(/ask me anything about your tasks/i);
      await user.type(input, 'show completed tasks');
      await user.click(screen.getByRole('button', { name: /send/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/completed/i)).toBeInTheDocument();
      });
    });

    it('should show message when no filtered tasks found', async () => {
      const user = userEvent.setup({ delay: null });
      
      mockFetch.mockImplementation((url: string) => {
        if (url === '/api/tasks') {
          return Promise.resolve({
            ok: true,
            json: async () => ([
              { id: '1', title: 'Task', status: 'pending', priority: 'low' },
            ]),
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ username: 'testuser' }),
        } as Response);
      });

      render(<AIAssistantPage />);
      
      const input = screen.getByPlaceholderText(/ask me anything about your tasks/i);
      await user.type(input, 'show high priority tasks');
      await user.click(screen.getByRole('button', { name: /send/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/no.*tasks found/i)).toBeInTheDocument();
      });
    });
  });

  describe('Update Task Intent', () => {
    it('should update task status by number', async () => {
      const user = userEvent.setup({ delay: null });
      
      mockFetch.mockImplementation((url: string, options?: RequestInit) => {
        if (url === '/api/tasks') {
          return Promise.resolve({
            ok: true,
            json: async () => ([
              { id: '1', title: 'Task 1', status: 'pending', priority: 'medium' },
            ]),
          } as Response);
        }
        if (url.includes('/api/tasks/') && options?.method === 'PATCH') {
          return Promise.resolve({
            ok: true,
            json: async () => ({ id: '1', title: 'Task 1', status: 'completed' }),
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ username: 'testuser' }),
        } as Response);
      });

      render(<AIAssistantPage />);
      
      const input = screen.getByPlaceholderText(/ask me anything about your tasks/i);
      await user.type(input, 'mark task 1 as done');
      await user.click(screen.getByRole('button', { name: /send/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/task updated/i)).toBeInTheDocument();
      });
    });

    it('should show task selection when task not found', async () => {
      const user = userEvent.setup({ delay: null });
      
      mockFetch.mockImplementation((url: string) => {
        if (url === '/api/tasks') {
          return Promise.resolve({
            ok: true,
            json: async () => ([
              { id: '1', title: 'Task 1', status: 'pending', priority: 'medium' },
              { id: '2', title: 'Task 2', status: 'pending', priority: 'high' },
            ]),
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ username: 'testuser' }),
        } as Response);
      });

      render(<AIAssistantPage />);
      
      const input = screen.getByPlaceholderText(/ask me anything about your tasks/i);
      await user.type(input, 'mark status as done');
      await user.click(screen.getByRole('button', { name: /send/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/which task would you like to update/i)).toBeInTheDocument();
      });
    });

    it('should handle no tasks when updating', async () => {
      const user = userEvent.setup({ delay: null });
      
      mockFetch.mockImplementation((url: string) => {
        if (url === '/api/tasks') {
          return Promise.resolve({
            ok: true,
            json: async () => ([]),
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ username: 'testuser' }),
        } as Response);
      });

      render(<AIAssistantPage />);
      
      const input = screen.getByPlaceholderText(/ask me anything about your tasks/i);
      await user.type(input, 'mark task 1 as done');
      await user.click(screen.getByRole('button', { name: /send/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/don't have any tasks yet/i)).toBeInTheDocument();
      });
    });

    it('should handle failed task update', async () => {
      const user = userEvent.setup({ delay: null });
      
      mockFetch.mockImplementation((url: string, options?: RequestInit) => {
        if (url === '/api/tasks') {
          return Promise.resolve({
            ok: true,
            json: async () => ([
              { id: '1', title: 'Task 1', status: 'pending', priority: 'medium' },
            ]),
          } as Response);
        }
        if (url.includes('/api/tasks/') && options?.method === 'PATCH') {
          return Promise.resolve({
            ok: false,
            json: async () => ({ error: 'Update failed' }),
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ username: 'testuser' }),
        } as Response);
      });

      render(<AIAssistantPage />);
      
      const input = screen.getByPlaceholderText(/ask me anything about your tasks/i);
      await user.type(input, 'mark task 1 as done');
      await user.click(screen.getByRole('button', { name: /send/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/failed to update task/i)).toBeInTheDocument();
      });
    });
  });

  describe('Delete Task Intent', () => {
    it('should delete task by number', async () => {
      const user = userEvent.setup({ delay: null });
      
      mockFetch.mockImplementation((url: string, options?: RequestInit) => {
        if (url === '/api/tasks') {
          return Promise.resolve({
            ok: true,
            json: async () => ([
              { id: '1', title: 'Task to delete', status: 'pending', priority: 'medium' },
            ]),
          } as Response);
        }
        if (url.includes('/api/tasks/') && options?.method === 'DELETE') {
          return Promise.resolve({
            ok: true,
            json: async () => ({}),
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ username: 'testuser' }),
        } as Response);
      });

      render(<AIAssistantPage />);
      
      const input = screen.getByPlaceholderText(/ask me anything about your tasks/i);
      await user.type(input, 'delete task 1');
      await user.click(screen.getByRole('button', { name: /send/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/task deleted/i)).toBeInTheDocument();
      });
    });

    it('should show task selection when deleting without identifier', async () => {
      const user = userEvent.setup({ delay: null });
      
      mockFetch.mockImplementation((url: string) => {
        if (url === '/api/tasks') {
          return Promise.resolve({
            ok: true,
            json: async () => ([
              { id: '1', title: 'Task 1', status: 'pending', priority: 'medium' },
              { id: '2', title: 'Task 2', status: 'pending', priority: 'high' },
            ]),
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ username: 'testuser' }),
        } as Response);
      });

      render(<AIAssistantPage />);
      
      const input = screen.getByPlaceholderText(/ask me anything about your tasks/i);
      await user.type(input, 'delete task');
      await user.click(screen.getByRole('button', { name: /send/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/which task would you like to delete/i)).toBeInTheDocument();
      });
    });

    it('should handle failed task deletion', async () => {
      const user = userEvent.setup({ delay: null });
      
      mockFetch.mockImplementation((url: string, options?: RequestInit) => {
        if (url === '/api/tasks') {
          return Promise.resolve({
            ok: true,
            json: async () => ([
              { id: '1', title: 'Task 1', status: 'pending', priority: 'medium' },
            ]),
          } as Response);
        }
        if (url.includes('/api/tasks/') && options?.method === 'DELETE') {
          return Promise.resolve({
            ok: false,
            json: async () => ({ error: 'Delete failed' }),
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ username: 'testuser' }),
        } as Response);
      });

      render(<AIAssistantPage />);
      
      const input = screen.getByPlaceholderText(/ask me anything about your tasks/i);
      await user.type(input, 'delete task 1');
      await user.click(screen.getByRole('button', { name: /send/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/failed to delete task/i)).toBeInTheDocument();
      });
    });
  });

  describe('Get Statistics Intent', () => {
    it('should display task statistics', async () => {
      const user = userEvent.setup({ delay: null });
      
      mockFetch.mockImplementation((url: string) => {
        if (url === '/api/tasks/stats') {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              totalTasks: 10,
              pendingTasks: 3,
              inProgressTasks: 2,
              completedTasks: 5,
              overdueTasks: 1,
              highPriority: 4,
              mediumPriority: 3,
              lowPriority: 3,
            }),
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ username: 'testuser' }),
        } as Response);
      });

      render(<AIAssistantPage />);
      
      const input = screen.getByPlaceholderText(/ask me anything about your tasks/i);
      await user.type(input, 'show statistics');
      await user.click(screen.getByRole('button', { name: /send/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/task statistics/i)).toBeInTheDocument();
        expect(screen.getByText(/total: 10/i)).toBeInTheDocument();
      });
    });

    it('should handle statistics fetch failure', async () => {
      const user = userEvent.setup({ delay: null });
      
      mockFetch.mockImplementation((url: string) => {
        if (url === '/api/tasks/stats') {
          return Promise.resolve({
            ok: false,
            json: async () => ({}),
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ username: 'testuser' }),
        } as Response);
      });

      render(<AIAssistantPage />);
      
      const input = screen.getByPlaceholderText(/ask me anything about your tasks/i);
      await user.type(input, 'show stats');
      await user.click(screen.getByRole('button', { name: /send/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/failed to fetch statistics/i)).toBeInTheDocument();
      });
    });
  });

  describe('Greeting Handling', () => {
    it('should respond to "hi" greeting', async () => {
      const user = userEvent.setup({ delay: null });
      render(<AIAssistantPage />);
      
      const input = screen.getByPlaceholderText(/ask me anything about your tasks/i);
      await user.type(input, 'hi');
      await user.click(screen.getByRole('button', { name: /send/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/testuser/i)).toBeInTheDocument();
      });
    });

    it('should respond to "hello" greeting', async () => {
      const user = userEvent.setup({ delay: null });
      render(<AIAssistantPage />);
      
      const input = screen.getByPlaceholderText(/ask me anything about your tasks/i);
      await user.type(input, 'hello');
      await user.click(screen.getByRole('button', { name: /send/i }));
      
      await waitFor(() => {
        const greetingText = screen.getByText(/testuser/i);
        expect(greetingText).toBeInTheDocument();
      });
    });

    it('should respond to "good morning" greeting', async () => {
      const user = userEvent.setup({ delay: null });
      render(<AIAssistantPage />);
      
      const input = screen.getByPlaceholderText(/ask me anything about your tasks/i);
      await user.type(input, 'good morning');
      await user.click(screen.getByRole('button', { name: /send/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/testuser/i)).toBeInTheDocument();
      });
    });

    it('should respond to "hey" greeting', async () => {
      const user = userEvent.setup({ delay: null });
      render(<AIAssistantPage />);
      
      const input = screen.getByPlaceholderText(/ask me anything about your tasks/i);
      await user.type(input, 'hey');
      await user.click(screen.getByRole('button', { name: /send/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/testuser/i)).toBeInTheDocument();
      });
    });
  });

  describe('Help Command', () => {
    it('should display help information when user asks for help', async () => {
      const user = userEvent.setup({ delay: null });
      render(<AIAssistantPage />);
      
      const input = screen.getByPlaceholderText(/ask me anything about your tasks/i);
      await user.type(input, 'help');
      await user.click(screen.getByRole('button', { name: /send/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/quick guide/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should show error message when processing fails', async () => {
      const user = userEvent.setup({ delay: null });
      
      mockFetch.mockImplementation(() => {
        throw new Error('Network error');
      });

      render(<AIAssistantPage />);
      
      const input = screen.getByPlaceholderText(/ask me anything about your tasks/i);
      await user.type(input, 'test');
      await user.click(screen.getByRole('button', { name: /send/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      });
    });

    it('should handle empty response gracefully', async () => {
      const user = userEvent.setup({ delay: null });
      
      mockFetch.mockImplementation((url: string) => {
        if (url === '/api/tasks') {
          return Promise.resolve({
            ok: true,
            json: async () => null,
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ username: 'testuser' }),
        } as Response);
      });

      render(<AIAssistantPage />);
      
      const input = screen.getByPlaceholderText(/ask me anything about your tasks/i);
      await user.type(input, 'show tasks');
      await user.click(screen.getByRole('button', { name: /send/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      });
    });
  });

  describe('Pending Actions - Multi-step Flows', () => {
    it('should handle task selection for deletion', async () => {
      const user = userEvent.setup({ delay: null });
      
      mockFetch.mockImplementation((url: string, options?: RequestInit) => {
        if (url === '/api/tasks' && !options?.method) {
          return Promise.resolve({
            ok: true,
            json: async () => ([
              { id: '1', title: 'Task 1', status: 'pending', priority: 'medium' },
              { id: '2', title: 'Task 2', status: 'pending', priority: 'high' },
            ]),
          } as Response);
        }
        if (url.includes('/api/tasks/') && options?.method === 'DELETE') {
          return Promise.resolve({
            ok: true,
            json: async () => ({}),
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ username: 'testuser' }),
        } as Response);
      });

      render(<AIAssistantPage />);
      
      const input = screen.getByPlaceholderText(/ask me anything about your tasks/i);
      await user.type(input, 'delete task');
      await user.click(screen.getByRole('button', { name: /send/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/which task would you like to delete/i)).toBeInTheDocument();
      });

      await user.clear(input);
      await user.type(input, '1');
      await user.click(screen.getByRole('button', { name: /send/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/task deleted/i)).toBeInTheDocument();
      });
    });

    it('should handle invalid task selection', async () => {
      const user = userEvent.setup({ delay: null });
      
      mockFetch.mockImplementation((url: string) => {
        if (url === '/api/tasks') {
          return Promise.resolve({
            ok: true,
            json: async () => ([
              { id: '1', title: 'Task 1', status: 'pending', priority: 'medium' },
            ]),
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ username: 'testuser' }),
        } as Response);
      });

      render(<AIAssistantPage />);
      
      const input = screen.getByPlaceholderText(/ask me anything about your tasks/i);
      await user.type(input, 'delete task');
      await user.click(screen.getByRole('button', { name: /send/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/which task would you like to delete/i)).toBeInTheDocument();
      });

      await user.clear(input);
      await user.type(input, '999');
      await user.click(screen.getByRole('button', { name: /send/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/could not find that task/i)).toBeInTheDocument();
      });
    });
  });

  describe('Conversation Flow', () => {
    it('should maintain conversation history', async () => {
      const user = userEvent.setup({ delay: null });
      mockFetch.mockImplementation(() => 
        Promise.resolve({
          ok: true,
          json: async () => ({ message: 'Response' }),
        } as Response)
      );

      render(<AIAssistantPage />);
      
      const input = screen.getByPlaceholderText(/ask me anything about your tasks/i);
      
      await user.type(input, 'first message');
      await user.click(screen.getByRole('button', { name: /send/i }));
      
      await waitFor(() => {
        expect(screen.getByText('first message')).toBeInTheDocument();
      });
      
      await user.type(input, 'second message');
      await user.click(screen.getByRole('button', { name: /send/i }));
      
      await waitFor(() => {
        expect(screen.getByText('second message')).toBeInTheDocument();
      });
      
      expect(screen.getByText('first message')).toBeInTheDocument();
      expect(screen.getByText('second message')).toBeInTheDocument();
    });

    it('should handle fallback conversation responses', async () => {
      const user = userEvent.setup({ delay: null });
      render(<AIAssistantPage />);
      
      const input = screen.getByPlaceholderText(/ask me anything about your tasks/i);
      await user.type(input, 'random unclear message');
      await user.click(screen.getByRole('button', { name: /send/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/what would you like to do/i)).toBeInTheDocument();
      });
    });
  });

  describe('Date Parsing', () => {
    it('should parse "today" in task creation', async () => {
      const user = userEvent.setup({ delay: null });
      
      mockFetch.mockImplementation((url: string, options?: RequestInit) => {
        if (url === '/api/tasks' && options?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: async () => ({ id: '123', title: 'Task', priority: 'medium' }),
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ username: 'testuser' }),
        } as Response);
      });

      render(<AIAssistantPage />);
      
      const input = screen.getByPlaceholderText(/ask me anything about your tasks/i);
      await user.type(input, 'create task meeting today');
      await user.click(screen.getByRole('button', { name: /send/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/task created successfully/i)).toBeInTheDocument();
      });
    });

    it('should parse "in X days" format', async () => {
      const user = userEvent.setup({ delay: null });
      
      mockFetch.mockImplementation((url: string, options?: RequestInit) => {
        if (url === '/api/tasks' && options?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: async () => ({ id: '123', title: 'Task', priority: 'medium' }),
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ username: 'testuser' }),
        } as Response);
      });

      render(<AIAssistantPage />);
      
      const input = screen.getByPlaceholderText(/ask me anything about your tasks/i);
      await user.type(input, 'add task call client in 3 days');
      await user.click(screen.getByRole('button', { name: /send/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/task created successfully/i)).toBeInTheDocument();
      });
    });

    it('should parse day of week', async () => {
      const user = userEvent.setup({ delay: null });
      
      mockFetch.mockImplementation((url: string, options?: RequestInit) => {
        if (url === '/api/tasks' && options?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: async () => ({ id: '123', title: 'Task', priority: 'medium' }),
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ username: 'testuser' }),
        } as Response);
      });

      render(<AIAssistantPage />);
      
      const input = screen.getByPlaceholderText(/ask me anything about your tasks/i);
      await user.type(input, 'create task meeting next monday');
      await user.click(screen.getByRole('button', { name: /send/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/task created successfully/i)).toBeInTheDocument();
      });
    });
  });

  describe('Priority Handling', () => {
    it('should handle low priority task creation', async () => {
      const user = userEvent.setup({ delay: null });
      
      mockFetch.mockImplementation((url: string, options?: RequestInit) => {
        if (url === '/api/tasks' && options?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: async () => ({ id: '123', title: 'Task', priority: 'low' }),
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ username: 'testuser' }),
        } as Response);
      });

      render(<AIAssistantPage />);
      
      const input = screen.getByPlaceholderText(/ask me anything about your tasks/i);
      await user.type(input, 'create low priority task review docs');
      await user.click(screen.getByRole('button', { name: /send/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/task created successfully/i)).toBeInTheDocument();
      });
    });

    it('should filter medium priority tasks', async () => {
      const user = userEvent.setup({ delay: null });
      
      mockFetch.mockImplementation((url: string) => {
        if (url === '/api/tasks') {
          return Promise.resolve({
            ok: true,
            json: async () => ([
              { id: '1', title: 'Medium task', status: 'pending', priority: 'medium' },
            ]),
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ username: 'testuser' }),
        } as Response);
      });

      render(<AIAssistantPage />);
      
      const input = screen.getByPlaceholderText(/ask me anything about your tasks/i);
      await user.type(input, 'show medium priority tasks');
      await user.click(screen.getByRole('button', { name: /send/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/medium priority/i)).toBeInTheDocument();
      });
    });

    it('should filter low priority tasks', async () => {
      const user = userEvent.setup({ delay: null });
      
      mockFetch.mockImplementation((url: string) => {
        if (url === '/api/tasks') {
          return Promise.resolve({
            ok: true,
            json: async () => ([
              { id: '1', title: 'Low task', status: 'pending', priority: 'low' },
            ]),
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ username: 'testuser' }),
        } as Response);
      });

      render(<AIAssistantPage />);
      
      const input = screen.getByPlaceholderText(/ask me anything about your tasks/i);
      await user.type(input, 'show low priority tasks');
      await user.click(screen.getByRole('button', { name: /send/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/low priority/i)).toBeInTheDocument();
      });
    });
  });

  describe('Status Filtering', () => {
    it('should filter in-progress tasks', async () => {
      const user = userEvent.setup({ delay: null });
      
      mockFetch.mockImplementation((url: string) => {
        if (url === '/api/tasks') {
          return Promise.resolve({
            ok: true,
            json: async () => ([
              { id: '1', title: 'Working task', status: 'in-progress', priority: 'medium' },
            ]),
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ username: 'testuser' }),
        } as Response);
      });

      render(<AIAssistantPage />);
      
      const input = screen.getByPlaceholderText(/ask me anything about your tasks/i);
      await user.type(input, 'show tasks in progress');
      await user.click(screen.getByRole('button', { name: /send/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/in.progress/i)).toBeInTheDocument();
      });
    });
  });
});
