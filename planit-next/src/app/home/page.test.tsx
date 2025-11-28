/**
 * Unit tests for home page (AI Task Assistant)
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import HomePage from './page';

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

// Mock fetch
global.fetch = jest.fn();

// Mock window.dispatchEvent
const dispatchEventSpy = jest.spyOn(window, 'dispatchEvent');

// Mock scrollIntoView
HTMLElement.prototype.scrollIntoView = jest.fn();

describe('HomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Initial Render', () => {
    it('should render the AI Task Assistant header', () => {
      render(<HomePage />);
      expect(screen.getByText('AI Task Assistant')).toBeInTheDocument();
    });

    it('should display the subtitle', () => {
      render(<HomePage />);
      expect(screen.getByText('Natural language task management')).toBeInTheDocument();
    });

    it('should show the initial assistant message', () => {
      render(<HomePage />);
      expect(screen.getByText(/Hello! I'm your AI task assistant/)).toBeInTheDocument();
    });

    it('should render Clear Chat button', () => {
      render(<HomePage />);
      expect(screen.getByText('Clear Chat')).toBeInTheDocument();
    });

    it('should render message input field', () => {
      render(<HomePage />);
      const input = screen.getByPlaceholderText(/Type your message/);
      expect(input).toBeInTheDocument();
    });

    it('should render Send button', () => {
      render(<HomePage />);
      const sendButton = screen.getByRole('button', { name: /Send/i });
      expect(sendButton).toBeInTheDocument();
    });

    it('should have Send button disabled when input is empty', () => {
      render(<HomePage />);
      const sendButton = screen.getByRole('button', { name: /Send/i });
      expect(sendButton).toBeDisabled();
    });
  });

  describe('LocalStorage Integration', () => {
    it('should load messages from localStorage on mount', () => {
      const savedMessages = [
        { role: 'user', content: 'Test message' },
        { role: 'assistant', content: 'Test response' }
      ];
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(savedMessages));

      render(<HomePage />);
      
      expect(localStorageMock.getItem).toHaveBeenCalledWith('ai-chat-messages');
      expect(screen.getByText('Test message')).toBeInTheDocument();
      expect(screen.getByText('Test response')).toBeInTheDocument();
    });

    it('should save messages to localStorage when they change', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ response: 'AI response', tasksModified: false })
      });

      render(<HomePage />);
      
      const input = screen.getByPlaceholderText(/Type your message/);
      const sendButton = screen.getByRole('button', { name: /Send/i });

      await user.type(input, 'Hello');
      await user.click(sendButton);

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'ai-chat-messages',
          expect.stringContaining('Hello')
        );
      });
    });

    it('should handle corrupted localStorage data gracefully', () => {
      localStorageMock.getItem.mockReturnValueOnce('invalid json');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(<HomePage />);
      
      expect(consoleSpy).toHaveBeenCalledWith('Error loading saved messages:', expect.any(Error));
      expect(screen.getByText(/Hello! I'm your AI task assistant/)).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    it('should not load messages if localStorage returns empty array', () => {
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify([]));

      render(<HomePage />);
      
      expect(screen.getByText(/Hello! I'm your AI task assistant/)).toBeInTheDocument();
    });
  });

  describe('Message Sending', () => {
    it('should send message when Send button is clicked', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ response: 'AI response', tasksModified: false })
      });

      render(<HomePage />);
      
      const input = screen.getByPlaceholderText(/Type your message/);
      const sendButton = screen.getByRole('button', { name: /Send/i });

      await user.type(input, 'Create a task');
      await user.click(sendButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('Create a task')
        });
      });
    });

    it('should display user message immediately after sending', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ response: 'AI response', tasksModified: false })
      });

      render(<HomePage />);
      
      const input = screen.getByPlaceholderText(/Type your message/);
      const sendButton = screen.getByRole('button', { name: /Send/i });

      await user.type(input, 'Test message');
      await user.click(sendButton);

      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    it('should clear input after sending message', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ response: 'AI response', tasksModified: false })
      });

      render(<HomePage />);
      
      const input = screen.getByPlaceholderText(/Type your message/) as HTMLInputElement;
      const sendButton = screen.getByRole('button', { name: /Send/i });

      await user.type(input, 'Test message');
      await user.click(sendButton);

      await waitFor(() => {
        expect(input.value).toBe('');
      });
    });

    it('should show loading state while sending', async () => {
      const user = userEvent.setup();
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => { resolvePromise = resolve; });
      
      (global.fetch as jest.Mock).mockReturnValueOnce(promise);

      render(<HomePage />);
      
      const input = screen.getByPlaceholderText(/Type your message/);
      const sendButton = screen.getByRole('button', { name: /Send/i });

      await user.type(input, 'Test');
      await user.click(sendButton);

      expect(screen.getByText('Thinking...')).toBeInTheDocument();
      expect(screen.getByText('Sending...')).toBeInTheDocument();

      resolvePromise!({
        ok: true,
        json: async () => ({ response: 'Response', tasksModified: false })
      });
    });

    it('should display AI response after receiving', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ response: 'AI response here', tasksModified: false })
      });

      render(<HomePage />);
      
      const input = screen.getByPlaceholderText(/Type your message/);
      const sendButton = screen.getByRole('button', { name: /Send/i });

      await user.type(input, 'Question');
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('AI response here')).toBeInTheDocument();
      });
    });

    it('should not send empty messages', async () => {
      const user = userEvent.setup();
      render(<HomePage />);
      
      const sendButton = screen.getByRole('button', { name: /Send/i });
      await user.click(sendButton);

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should trim whitespace from messages', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ response: 'Response', tasksModified: false })
      });

      render(<HomePage />);
      
      const input = screen.getByPlaceholderText(/Type your message/);
      const sendButton = screen.getByRole('button', { name: /Send/i });

      await user.type(input, '   Test message   ');
      await user.click(sendButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('"message":"Test message"')
        });
      });
    });

    it('should handle API errors gracefully', async () => {
      const user = userEvent.setup();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false
      });

      render(<HomePage />);
      
      const input = screen.getByPlaceholderText(/Type your message/);
      const sendButton = screen.getByRole('button', { name: /Send/i });

      await user.type(input, 'Test');
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText(/Sorry, I encountered an error/)).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });

    it('should dispatch task-updated event when tasks are modified', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ response: 'Task created', tasksModified: true })
      });

      render(<HomePage />);
      
      const input = screen.getByPlaceholderText(/Type your message/);
      const sendButton = screen.getByRole('button', { name: /Send/i });

      await user.type(input, 'Create task');
      await user.click(sendButton);

      await waitFor(() => {
        expect(dispatchEventSpy).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'task-updated' })
        );
      });
    });
  });

  describe('Task Actions', () => {
    it('should display task selection buttons when tasks are returned', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: 'Which task?',
          tasks: [
            { id: '1', title: 'Task 1', status: 'pending' },
            { id: '2', title: 'Task 2', status: 'pending' }
          ],
          actionType: 'delete',
          tasksModified: false
        })
      });

      render(<HomePage />);
      
      const input = screen.getByPlaceholderText(/Type your message/);
      const sendButton = screen.getByRole('button', { name: /Send/i });

      await user.type(input, 'Delete task');
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('Task 1')).toBeInTheDocument();
        expect(screen.getByText('Task 2')).toBeInTheDocument();
      });
    });

    it('should show Delete buttons for delete action type', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: 'Which task?',
          tasks: [{ id: '1', title: 'Task 1', status: 'pending' }],
          actionType: 'delete',
          tasksModified: false
        })
      });

      render(<HomePage />);
      
      const input = screen.getByPlaceholderText(/Type your message/);
      const sendButton = screen.getByRole('button', { name: /Send/i });

      await user.type(input, 'Delete');
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('Delete')).toBeInTheDocument();
      });
    });

    it('should show Mark Complete buttons for complete action type', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: 'Which task?',
          tasks: [{ id: '1', title: 'Task 1', status: 'pending' }],
          actionType: 'complete',
          tasksModified: false
        })
      });

      render(<HomePage />);
      
      const input = screen.getByPlaceholderText(/Type your message/);
      const sendButton = screen.getByRole('button', { name: /Send/i });

      await user.type(input, 'Complete');
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('Mark Complete')).toBeInTheDocument();
      });
    });

    it('should delete task when Delete button is clicked', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            response: 'Which task?',
            tasks: [{ id: '123', title: 'Test Task', status: 'pending' }],
            actionType: 'delete',
            tasksModified: false
          })
        })
        .mockResolvedValueOnce({ ok: true });

      render(<HomePage />);
      
      const input = screen.getByPlaceholderText(/Type your message/);
      const sendButton = screen.getByRole('button', { name: /Send/i });

      await user.type(input, 'Delete');
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('Test Task')).toBeInTheDocument();
      });

      const deleteButton = screen.getByText('Delete');
      await user.click(deleteButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/tasks/123', { method: 'DELETE' });
        expect(screen.getByText(/I've deleted the task: "Test Task"/)).toBeInTheDocument();
      });
    });

    it('should complete task when Mark Complete button is clicked', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            response: 'Which task?',
            tasks: [{ id: '456', title: 'Complete Me', status: 'pending' }],
            actionType: 'complete',
            tasksModified: false
          })
        })
        .mockResolvedValueOnce({ ok: true });

      render(<HomePage />);
      
      const input = screen.getByPlaceholderText(/Type your message/);
      const sendButton = screen.getByRole('button', { name: /Send/i });

      await user.type(input, 'Complete');
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('Complete Me')).toBeInTheDocument();
      });

      const completeButton = screen.getByText('Mark Complete');
      await user.click(completeButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/tasks/456', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'completed' })
        });
        expect(screen.getByText(/I've marked "Complete Me" as completed!/)).toBeInTheDocument();
      });
    });

    it('should dispatch task-updated event after task action', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            response: 'Which task?',
            tasks: [{ id: '1', title: 'Task', status: 'pending' }],
            actionType: 'delete',
            tasksModified: false
          })
        })
        .mockResolvedValueOnce({ ok: true });

      render(<HomePage />);
      
      const input = screen.getByPlaceholderText(/Type your message/);
      const sendButton = screen.getByRole('button', { name: /Send/i });

      await user.type(input, 'Delete');
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('Task')).toBeInTheDocument();
      });

      const deleteButton = screen.getByText('Delete');
      await user.click(deleteButton);

      await waitFor(() => {
        expect(dispatchEventSpy).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'task-updated' })
        );
      });
    });

    it('should handle task action errors gracefully', async () => {
      const user = userEvent.setup();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            response: 'Which task?',
            tasks: [{ id: '1', title: 'Task', status: 'pending' }],
            actionType: 'delete',
            tasksModified: false
          })
        })
        .mockResolvedValueOnce({ ok: false });

      render(<HomePage />);
      
      const input = screen.getByPlaceholderText(/Type your message/);
      const sendButton = screen.getByRole('button', { name: /Send/i });

      await user.type(input, 'Delete');
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('Task')).toBeInTheDocument();
      });

      const deleteButton = screen.getByText('Delete');
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(/Sorry, I encountered an error/)).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });

    it('should disable task action buttons while loading', async () => {
      const user = userEvent.setup();
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => { resolvePromise = resolve; });

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            response: 'Which task?',
            tasks: [{ id: '1', title: 'Task', status: 'pending' }],
            actionType: 'delete',
            tasksModified: false
          })
        })
        .mockReturnValueOnce(promise);

      render(<HomePage />);
      
      const input = screen.getByPlaceholderText(/Type your message/);
      const sendButton = screen.getByRole('button', { name: /Send/i });

      await user.type(input, 'Delete');
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('Task')).toBeInTheDocument();
      });

      const deleteButton = screen.getByText('Delete');
      await user.click(deleteButton);

      expect(deleteButton).toBeDisabled();

      resolvePromise!({ ok: true });
    });
  });

  describe('Clear Chat', () => {
    it('should show confirmation modal when Clear Chat is clicked', async () => {
      const user = userEvent.setup();
      render(<HomePage />);
      
      const clearButton = screen.getByText('Clear Chat');
      await user.click(clearButton);

      expect(screen.getByText('Clear Chat History?')).toBeInTheDocument();
      expect(screen.getByText(/This will permanently delete all messages/)).toBeInTheDocument();
    });

    it('should close confirmation modal when Cancel is clicked', async () => {
      const user = userEvent.setup();
      render(<HomePage />);
      
      const clearButton = screen.getByText('Clear Chat');
      await user.click(clearButton);

      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText('Clear Chat History?')).not.toBeInTheDocument();
      });
    });

    it('should clear chat and localStorage when confirmed', async () => {
      const user = userEvent.setup();
      render(<HomePage />);
      
      const clearButton = screen.getByText('Clear Chat');
      await user.click(clearButton);

      const confirmButton = screen.getAllByText('Clear Chat')[1]; // Second one is in modal
      await user.click(confirmButton);

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('ai-chat-messages');
      expect(screen.getByText(/Hello! I'm your AI task assistant/)).toBeInTheDocument();
    });

    it('should close modal after clearing chat', async () => {
      const user = userEvent.setup();
      render(<HomePage />);
      
      const clearButton = screen.getByText('Clear Chat');
      await user.click(clearButton);

      const confirmButton = screen.getAllByText('Clear Chat')[1];
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.queryByText('Clear Chat History?')).not.toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle form submission with Enter key', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ response: 'Response', tasksModified: false })
      });

      render(<HomePage />);
      
      const input = screen.getByPlaceholderText(/Type your message/);
      
      fireEvent.change(input, { target: { value: 'Test' } });
      fireEvent.submit(input.closest('form')!);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });

    it('should scroll to bottom when new messages arrive', async () => {
      const scrollIntoViewMock = jest.fn();
      const originalScrollIntoView = HTMLElement.prototype.scrollIntoView;
      HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;

      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ response: 'Response', tasksModified: false })
      });

      render(<HomePage />);
      
      const input = screen.getByPlaceholderText(/Type your message/);
      const sendButton = screen.getByRole('button', { name: /Send/i });

      await user.type(input, 'Test');
      await user.click(sendButton);

      await waitFor(() => {
        expect(scrollIntoViewMock).toHaveBeenCalled();
      });

      HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
    });

    it('should prevent multiple simultaneous submissions', async () => {
      const user = userEvent.setup();
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => { resolvePromise = resolve; });
      
      (global.fetch as jest.Mock).mockReturnValue(promise);

      render(<HomePage />);
      
      const input = screen.getByPlaceholderText(/Type your message/);
      const sendButton = screen.getByRole('button', { name: /Send/i });

      await user.type(input, 'First message');
      await user.click(sendButton);

      // Button should now be disabled and show "Sending..."
      await waitFor(() => {
        expect(screen.getByText('Sending...')).toBeInTheDocument();
      });

      // Only one API call should have been made
      expect(global.fetch).toHaveBeenCalledTimes(1);

      resolvePromise!({
        ok: true,
        json: async () => ({ response: 'Response', tasksModified: false })
      });
    });

    it('should log errors to console when API fails', async () => {
      const user = userEvent.setup();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(<HomePage />);
      
      const input = screen.getByPlaceholderText(/Type your message/);
      const sendButton = screen.getByRole('button', { name: /Send/i });

      await user.type(input, 'Test');
      await user.click(sendButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
        expect(screen.getByText(/Sorry, I encountered an error/)).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });

    it('should handle API response with ok=false', async () => {
      const user = userEvent.setup();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false
      });

      render(<HomePage />);
      
      const input = screen.getByPlaceholderText(/Type your message/);
      const sendButton = screen.getByRole('button', { name: /Send/i });

      await user.type(input, 'Test message');
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('Test message')).toBeInTheDocument();
        expect(screen.getByText(/Sorry, I encountered an error/)).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });

    it('should include messages in API request body', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ response: 'Response', tasksModified: false })
      });

      render(<HomePage />);
      
      const input = screen.getByPlaceholderText(/Type your message/);
      const sendButton = screen.getByRole('button', { name: /Send/i });

      await user.type(input, 'New message');
      await user.click(sendButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/ai/chat', 
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: expect.stringContaining('messages')
          })
        );
      });
    });

    it('should handle task completion with PATCH request', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            response: 'Sure!',
            tasks: [{ id: '123', title: 'My Task', status: 'pending' }],
            actionType: 'complete',
            tasksModified: false
          })
        })
        .mockResolvedValueOnce({ ok: true });

      render(<HomePage />);
      
      const input = screen.getByPlaceholderText(/Type your message/);
      const sendButton = screen.getByRole('button', { name: /Send/i });

      await user.type(input, 'Mark task as complete');
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('My Task')).toBeInTheDocument();
      });

      const completeButton = screen.getByText('Mark Complete');
      await user.click(completeButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/tasks/123', 
          expect.objectContaining({
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'completed' })
          })
        );
        expect(screen.getByText(/I've marked "My Task" as completed/)).toBeInTheDocument();
      });
    });

    it('should handle task deletion failure', async () => {
      const user = userEvent.setup();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            response: 'OK',
            tasks: [{ id: '456', title: 'Task To Delete', status: 'pending' }],
            actionType: 'delete',
            tasksModified: false
          })
        })
        .mockResolvedValueOnce({ ok: false });

      render(<HomePage />);
      
      const input = screen.getByPlaceholderText(/Type your message/);
      const sendButton = screen.getByRole('button', { name: /Send/i });

      await user.type(input, 'Delete task');
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('Task To Delete')).toBeInTheDocument();
      });

      const deleteButton = screen.getByText('Delete');
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(/Sorry, I encountered an error/)).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });

    it('should handle task completion failure', async () => {
      const user = userEvent.setup();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            response: 'OK',
            tasks: [{ id: '789', title: 'Task To Complete', status: 'pending' }],
            actionType: 'complete',
            tasksModified: false
          })
        })
        .mockResolvedValueOnce({ ok: false });

      render(<HomePage />);
      
      const input = screen.getByPlaceholderText(/Type your message/);
      const sendButton = screen.getByRole('button', { name: /Send/i });

      await user.type(input, 'Complete task');
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('Task To Complete')).toBeInTheDocument();
      });

      const completeButton = screen.getByText('Mark Complete');
      await user.click(completeButton);

      await waitFor(() => {
        expect(screen.getByText(/Sorry, I encountered an error/)).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });

    it('should handle update action type with delete button', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: 'Which task to update?',
          tasks: [{ id: 'abc', title: 'Update This', status: 'pending' }],
          actionType: 'update',
          tasksModified: false
        })
      });

      render(<HomePage />);
      
      const input = screen.getByPlaceholderText(/Type your message/);
      const sendButton = screen.getByRole('button', { name: /Send/i });

      await user.type(input, 'Update task');
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('Update This')).toBeInTheDocument();
        // Update action defaults to showing delete button
        expect(screen.getByText('Delete')).toBeInTheDocument();
      });
    });

    it('should handle empty savedMessages in localStorage', () => {
      localStorageMock.getItem.mockReturnValueOnce('');

      render(<HomePage />);
      
      expect(screen.getByText(/Hello! I'm your AI task assistant/)).toBeInTheDocument();
    });

    it('should handle null savedMessages in localStorage', () => {
      localStorageMock.getItem.mockReturnValueOnce(null);

      render(<HomePage />);
      
      expect(screen.getByText(/Hello! I'm your AI task assistant/)).toBeInTheDocument();
    });

    it('should handle non-array parsed data from localStorage', () => {
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify({ invalid: 'data' }));

      render(<HomePage />);
      
      expect(screen.getByText(/Hello! I'm your AI task assistant/)).toBeInTheDocument();
    });


  });
});
