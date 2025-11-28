import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChatInput from './ChatInput';

// Mock fetch globally
global.fetch = jest.fn();

describe('ChatInput Component', () => {
  let mockOnSend: jest.Mock;

  beforeEach(() => {
    mockOnSend = jest.fn();
    jest.useFakeTimers();
    (global.fetch as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('basic rendering', () => {
    it('should render input field', () => {
      render(<ChatInput onSend={mockOnSend} />);
      const input = screen.getByPlaceholderText(/ask me anything/i);
      expect(input).toBeInTheDocument();
    });

    it('should render send button', () => {
      render(<ChatInput onSend={mockOnSend} />);
      const button = screen.getByRole('button', { name: /send/i });
      expect(button).toBeInTheDocument();
    });

    it('should have correct placeholder text', () => {
      render(<ChatInput onSend={mockOnSend} />);
      expect(screen.getByPlaceholderText('Ask me anything...')).toBeInTheDocument();
    });

    it('should apply correct styling classes', () => {
      render(<ChatInput onSend={mockOnSend} />);
      const input = screen.getByPlaceholderText(/ask me anything/i);
      expect(input).toHaveClass('w-full', 'px-4', 'py-3', 'rounded-xl');
    });
  });

  describe('input handling', () => {
    it('should update input value when typing', () => {
      render(<ChatInput onSend={mockOnSend} />);
      const input = screen.getByPlaceholderText(/ask me anything/i) as HTMLInputElement;
      
      fireEvent.change(input, { target: { value: 'Hello' } });
      expect(input.value).toBe('Hello');
    });

    it('should clear input after sending', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ corrected: 'Hello' }),
      });

      render(<ChatInput onSend={mockOnSend} />);
      const input = screen.getByPlaceholderText(/ask me anything/i) as HTMLInputElement;
      const button = screen.getByRole('button', { name: /send/i });
      
      fireEvent.change(input, { target: { value: 'Hello' } });
      fireEvent.click(button);

      await waitFor(() => {
        expect(input.value).toBe('');
      });
    });

    it('should not send empty messages', () => {
      render(<ChatInput onSend={mockOnSend} />);
      const button = screen.getByRole('button', { name: /send/i });
      
      fireEvent.click(button);
      expect(mockOnSend).not.toHaveBeenCalled();
    });

    it('should not send whitespace-only messages', () => {
      render(<ChatInput onSend={mockOnSend} />);
      const input = screen.getByPlaceholderText(/ask me anything/i);
      const button = screen.getByRole('button', { name: /send/i });
      
      fireEvent.change(input, { target: { value: '   ' } });
      fireEvent.click(button);
      
      expect(mockOnSend).not.toHaveBeenCalled();
    });
  });

  describe('autocorrect functionality', () => {
    it('should call autocorrect API after typing pause', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ corrected: 'Hello world' }),
      });

      render(<ChatInput onSend={mockOnSend} />);
      const input = screen.getByPlaceholderText(/ask me anything/i);
      
      fireEvent.change(input, { target: { value: 'Helo wrld' } });
      
      jest.advanceTimersByTime(500);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/autocorrect', expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: 'Helo wrld' }),
        }));
      });
    });

    it('should not call autocorrect for very short text', async () => {
      render(<ChatInput onSend={mockOnSend} />);
      const input = screen.getByPlaceholderText(/ask me anything/i);
      
      fireEvent.change(input, { target: { value: 'Hi' } });
      
      jest.advanceTimersByTime(500);

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should display autocorrect suggestion', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ corrected: 'Hello world' }),
      });

      render(<ChatInput onSend={mockOnSend} />);
      const input = screen.getByPlaceholderText(/ask me anything/i);
      
      fireEvent.change(input, { target: { value: 'Helo wrld' } });
      
      jest.advanceTimersByTime(500);

      await waitFor(() => {
        expect(screen.getByText(/did you mean/i)).toBeInTheDocument();
      });
    });

    it('should debounce autocorrect calls', async () => {
      render(<ChatInput onSend={mockOnSend} />);
      const input = screen.getByPlaceholderText(/ask me anything/i);
      
      fireEvent.change(input, { target: { value: 'H' } });
      jest.advanceTimersByTime(100);
      
      fireEvent.change(input, { target: { value: 'He' } });
      jest.advanceTimersByTime(100);
      
      fireEvent.change(input, { target: { value: 'Hel' } });
      jest.advanceTimersByTime(500);

      // Should only call once after the debounce period
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle autocorrect API errors gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

      render(<ChatInput onSend={mockOnSend} />);
      const input = screen.getByPlaceholderText(/ask me anything/i);
      
      fireEvent.change(input, { target: { value: 'Hello world' } });
      
      jest.advanceTimersByTime(500);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Autocorrect error:', expect.any(Error));
      });

      consoleError.mockRestore();
    });

    it('should clear suggestion when input changes', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ corrected: 'Hello world' }),
      });

      render(<ChatInput onSend={mockOnSend} />);
      const input = screen.getByPlaceholderText(/ask me anything/i);
      
      fireEvent.change(input, { target: { value: 'Helo' } });
      jest.advanceTimersByTime(500);

      await waitFor(() => {
        expect(screen.getByText(/did you mean/i)).toBeInTheDocument();
      });

      fireEvent.change(input, { target: { value: 'Hello' } });
      
      await waitFor(() => {
        expect(screen.queryByText(/did you mean/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('send functionality', () => {
    it('should call onSend with input text', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ corrected: 'Hello' }),
      });

      render(<ChatInput onSend={mockOnSend} />);
      const input = screen.getByPlaceholderText(/ask me anything/i);
      const button = screen.getByRole('button', { name: /send/i });
      
      fireEvent.change(input, { target: { value: 'Hello' } });
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockOnSend).toHaveBeenCalledWith('Hello');
      });
    });

    it('should use corrected text if available', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ corrected: 'Hello world' }),
      });

      render(<ChatInput onSend={mockOnSend} />);
      const input = screen.getByPlaceholderText(/ask me anything/i);
      const button = screen.getByRole('button', { name: /send/i });
      
      fireEvent.change(input, { target: { value: 'Helo wrld' } });
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockOnSend).toHaveBeenCalledWith('Hello world');
      });
    });

    it('should show loading state while sending', async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(() => 
        new Promise(resolve => setTimeout(() => resolve({
          json: async () => ({ corrected: 'Hello' }),
        }), 100))
      );

      render(<ChatInput onSend={mockOnSend} />);
      const input = screen.getByPlaceholderText(/ask me anything/i);
      const button = screen.getByRole('button', { name: /send/i });
      
      fireEvent.change(input, { target: { value: 'Hello' } });
      fireEvent.click(button);

      expect(button).toBeDisabled();
      expect(input).toBeDisabled();

      await waitFor(() => {
        expect(button).not.toBeDisabled();
      });
    });

    it('should handle send with autocorrect error', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

      render(<ChatInput onSend={mockOnSend} />);
      const input = screen.getByPlaceholderText(/ask me anything/i);
      const button = screen.getByRole('button', { name: /send/i });
      
      fireEvent.change(input, { target: { value: 'Hello' } });
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockOnSend).toHaveBeenCalledWith('Hello');
      });

      consoleError.mockRestore();
    });
  });

  describe('disabled state', () => {
    it('should disable input when disabled prop is true', () => {
      render(<ChatInput onSend={mockOnSend} disabled />);
      const input = screen.getByPlaceholderText(/ask me anything/i);
      expect(input).toBeDisabled();
    });

    it('should disable send button when disabled prop is true', () => {
      render(<ChatInput onSend={mockOnSend} disabled />);
      const button = screen.getByRole('button', { name: /send/i });
      expect(button).toBeDisabled();
    });

    it('should disable send button when input is empty', () => {
      render(<ChatInput onSend={mockOnSend} />);
      const button = screen.getByRole('button', { name: /send/i });
      expect(button).toBeDisabled();
    });

    it('should enable send button when input has text', () => {
      render(<ChatInput onSend={mockOnSend} />);
      const input = screen.getByPlaceholderText(/ask me anything/i);
      const button = screen.getByRole('button', { name: /send/i });
      
      fireEvent.change(input, { target: { value: 'Hello' } });
      expect(button).not.toBeDisabled();
    });

    it('should disable controls while loading', async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(() => 
        new Promise(resolve => setTimeout(() => resolve({
          json: async () => ({ corrected: 'Hello' }),
        }), 100))
      );

      render(<ChatInput onSend={mockOnSend} />);
      const input = screen.getByPlaceholderText(/ask me anything/i);
      const button = screen.getByRole('button', { name: /send/i });
      
      fireEvent.change(input, { target: { value: 'Hello' } });
      fireEvent.click(button);

      expect(input).toBeDisabled();
      expect(button).toBeDisabled();
    });
  });

  describe('styling and appearance', () => {
    it('should have gradient background on send button', () => {
      render(<ChatInput onSend={mockOnSend} />);
      const button = screen.getByRole('button', { name: /send/i });
      expect(button).toHaveClass('bg-gradient-to-br', 'from-blue-600', 'to-purple-600');
    });

    it('should have proper border and focus styles', () => {
      render(<ChatInput onSend={mockOnSend} />);
      const input = screen.getByPlaceholderText(/ask me anything/i);
      expect(input).toHaveClass('border', 'focus:outline-none', 'focus:ring-2');
    });

    it('should support dark mode styles', () => {
      render(<ChatInput onSend={mockOnSend} />);
      const input = screen.getByPlaceholderText(/ask me anything/i);
      expect(input).toHaveClass('dark:bg-gray-800', 'dark:text-gray-100');
    });

    it('should show opacity when disabled', () => {
      render(<ChatInput onSend={mockOnSend} disabled />);
      const input = screen.getByPlaceholderText(/ask me anything/i);
      expect(input).toHaveClass('disabled:opacity-50');
    });
  });

  describe('edge cases', () => {
    it('should handle multiple rapid sends', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => ({ corrected: 'Hello' }),
      });

      render(<ChatInput onSend={mockOnSend} />);
      const input = screen.getByPlaceholderText(/ask me anything/i);
      const button = screen.getByRole('button', { name: /send/i });
      
      fireEvent.change(input, { target: { value: 'Hello' } });
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockOnSend).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle special characters in input', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ corrected: '@#$%^&*()' }),
      });

      render(<ChatInput onSend={mockOnSend} />);
      const input = screen.getByPlaceholderText(/ask me anything/i);
      
      fireEvent.change(input, { target: { value: '@#$%^&*()' } });
      
      expect((input as HTMLInputElement).value).toBe('@#$%^&*()');
    });

    it('should handle very long input text', async () => {
      const longText = 'A'.repeat(1000);
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ corrected: longText }),
      });

      render(<ChatInput onSend={mockOnSend} />);
      const input = screen.getByPlaceholderText(/ask me anything/i);
      
      fireEvent.change(input, { target: { value: longText } });
      
      expect((input as HTMLInputElement).value).toBe(longText);
    });

    it('should handle unicode characters', async () => {
      const unicodeText = '你好 🌍 مرحبا';
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ corrected: unicodeText }),
      });

      render(<ChatInput onSend={mockOnSend} />);
      const input = screen.getByPlaceholderText(/ask me anything/i);
      
      fireEvent.change(input, { target: { value: unicodeText } });
      
      expect((input as HTMLInputElement).value).toBe(unicodeText);
    });
  });

  describe('integration scenarios', () => {
    it('should complete full workflow: type, autocorrect, send', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({ corrected: 'Hello world' }),
        })
        .mockResolvedValueOnce({
          json: async () => ({ corrected: 'Hello world' }),
        });

      render(<ChatInput onSend={mockOnSend} />);
      const input = screen.getByPlaceholderText(/ask me anything/i);
      const button = screen.getByRole('button', { name: /send/i });
      
      // Type
      fireEvent.change(input, { target: { value: 'Helo wrld' } });
      
      // Wait for autocorrect
      jest.advanceTimersByTime(500);
      
      await waitFor(() => {
        expect(screen.getByText(/did you mean/i)).toBeInTheDocument();
      });
      
      // Send
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(mockOnSend).toHaveBeenCalledWith('Hello world');
        expect((input as HTMLInputElement).value).toBe('');
      });
    });
  });
});
