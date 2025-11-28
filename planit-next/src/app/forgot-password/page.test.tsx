import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ForgotPasswordPage from './page';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

// Mock fetch globally
global.fetch = jest.fn();

// Mock console methods to avoid noise in tests
const originalConsole = { ...console };
beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  Object.assign(console, originalConsole);
});

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ message: 'Password reset link has been sent to your email.' }),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Initial Render Tests
  describe('Initial Render', () => {
    test('renders forgot password page with all elements', () => {
      render(<ForgotPasswordPage />);
      
      expect(screen.getByRole('heading', { name: /forgot your password\?/i })).toBeInTheDocument();
      expect(screen.getByText(/enter your email address and we'll send you a link/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/email address/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /← back to login/i })).toBeInTheDocument();
    });

    test('has proper form structure', () => {
      render(<ForgotPasswordPage />);
      
      const emailInput = screen.getByPlaceholderText(/email address/i);
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('required');
      expect(emailInput).toHaveAttribute('autoComplete', 'email');
    });

    test('submit button is enabled initially', () => {
      render(<ForgotPasswordPage />);
      
      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      expect(submitButton).not.toBeDisabled();
    });

    test('no error or success messages displayed initially', () => {
      render(<ForgotPasswordPage />);
      
      expect(screen.queryByText(/password reset link has been sent/i)).not.toBeInTheDocument();
    });
  });

  // Form Input Tests
  describe('Form Input', () => {
    test('email input updates when typed', async () => {
      const user = userEvent.setup();
      render(<ForgotPasswordPage />);
      
      const emailInput = screen.getByPlaceholderText(/email address/i);
      await user.type(emailInput, 'test@example.com');
      
      expect(emailInput).toHaveValue('test@example.com');
    });

    test('form can be submitted with valid email', async () => {
      const user = userEvent.setup();
      render(<ForgotPasswordPage />);
      
      const emailInput = screen.getByPlaceholderText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      
      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);
      
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: 'test@example.com' }),
      });
    });

    test('form submission with enter key', async () => {
      const user = userEvent.setup();
      render(<ForgotPasswordPage />);
      
      const emailInput = screen.getByPlaceholderText(/email address/i);
      
      await user.type(emailInput, 'test@example.com');
      await user.keyboard('{Enter}');
      
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: 'test@example.com' }),
      });
    });
  });

  // Form Validation Tests
  describe('Form Validation', () => {
    test('requires email field to be filled', async () => {
      const user = userEvent.setup();
      render(<ForgotPasswordPage />);
      
      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      await user.click(submitButton);
      
      const emailInput = screen.getByPlaceholderText(/email address/i);
      expect(emailInput).toBeInvalid();
    });

    test('validates email format', async () => {
      const user = userEvent.setup();
      render(<ForgotPasswordPage />);
      
      const emailInput = screen.getByPlaceholderText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      
      await user.type(emailInput, 'invalid-email');
      await user.click(submitButton);
      
      expect(emailInput).toBeInvalid();
    });

    test('accepts valid email format', async () => {
      const user = userEvent.setup();
      render(<ForgotPasswordPage />);
      
      const emailInput = screen.getByPlaceholderText(/email address/i);
      
      await user.type(emailInput, 'valid@example.com');
      
      expect(emailInput).toBeValid();
    });
  });

  // Success Handling Tests
  describe('Success Handling', () => {
    test('displays success message on successful submission', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ message: 'Password reset link has been sent to your email.' }),
      });
      
      render(<ForgotPasswordPage />);
      
      const emailInput = screen.getByPlaceholderText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      
      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/password reset link has been sent to your email/i)).toBeInTheDocument();
      });
    });

    test('displays custom success message from API', async () => {
      const user = userEvent.setup();
      const customMessage = 'Check your inbox for reset instructions';
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ message: customMessage }),
      });
      
      render(<ForgotPasswordPage />);
      
      const emailInput = screen.getByPlaceholderText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      
      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(customMessage)).toBeInTheDocument();
      });
    });

    test('clears error message when success message is displayed', async () => {
      const user = userEvent.setup();
      
      // First request fails
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      
      render(<ForgotPasswordPage />);
      
      const emailInput = screen.getByPlaceholderText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      
      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
      
      // Second request succeeds
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ message: 'Success!' }),
      });
      
      await user.clear(emailInput);
      await user.type(emailInput, 'test2@example.com');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Success!')).toBeInTheDocument();
        expect(screen.queryByText(/network error/i)).not.toBeInTheDocument();
      });
    });
  });

  // Error Handling Tests
  describe('Error Handling', () => {
    test('displays error message on API error response', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ message: 'Email not found' }),
      });
      
      render(<ForgotPasswordPage />);
      
      const emailInput = screen.getByPlaceholderText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      
      await user.type(emailInput, 'notfound@example.com');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/email not found/i)).toBeInTheDocument();
      });
    });

    test('displays generic error message on network failure', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      
      render(<ForgotPasswordPage />);
      
      const emailInput = screen.getByPlaceholderText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      
      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });

    test('displays fallback error message for unknown errors', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockRejectedValue('Unknown error');
      
      render(<ForgotPasswordPage />);
      
      const emailInput = screen.getByPlaceholderText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      
      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/failed to send reset email/i)).toBeInTheDocument();
      });
    });

    test('displays fallback error for API responses without message', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({}),
      });
      
      render(<ForgotPasswordPage />);
      
      const emailInput = screen.getByPlaceholderText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      
      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/failed to send reset email/i)).toBeInTheDocument();
      });
    });
  });

  // Loading State Tests
  describe('Loading State', () => {
    test('shows loading state during form submission', async () => {
      const user = userEvent.setup();
      
      // Mock a delayed response
      (global.fetch as jest.Mock).mockImplementation(() =>
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: () => Promise.resolve({ message: 'Success' }),
          }), 1000)
        )
      );
      
      render(<ForgotPasswordPage />);
      
      const emailInput = screen.getByPlaceholderText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      
      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);
      
      // Should show loading state
      expect(screen.getByText(/sending\.\.\./i)).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeDisabled();
    });

    test('disables button during loading', async () => {
      const user = userEvent.setup();
      
      (global.fetch as jest.Mock).mockImplementation(() =>
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: () => Promise.resolve({ message: 'Success' }),
          }), 1000)
        )
      );
      
      render(<ForgotPasswordPage />);
      
      const emailInput = screen.getByPlaceholderText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      
      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);
      
      expect(submitButton).toBeDisabled();
    });

    test('re-enables button after successful submission', async () => {
      const user = userEvent.setup();
      render(<ForgotPasswordPage />);
      
      const emailInput = screen.getByPlaceholderText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      
      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
        expect(screen.getByText(/password reset link has been sent/i)).toBeInTheDocument();
      });
    });

    test('re-enables button after error', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      
      render(<ForgotPasswordPage />);
      
      const emailInput = screen.getByPlaceholderText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      
      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });
  });

  // Navigation Tests
  describe('Navigation', () => {
    test('back to login link has correct href', () => {
      render(<ForgotPasswordPage />);
      
      const backLink = screen.getByRole('link', { name: /← back to login/i });
      expect(backLink).toHaveAttribute('href', '/');
    });

    test('back to login link is always visible', () => {
      render(<ForgotPasswordPage />);
      
      const backLink = screen.getByRole('link', { name: /← back to login/i });
      expect(backLink).toBeVisible();
    });
  });

  // Accessibility Tests
  describe('Accessibility', () => {
    test('has proper heading hierarchy', () => {
      render(<ForgotPasswordPage />);
      
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent(/forgot your password\?/i);
    });

    test('email input has proper labels and attributes', () => {
      render(<ForgotPasswordPage />);
      
      const emailInput = screen.getByPlaceholderText(/email address/i);
      expect(emailInput).toHaveAttribute('id', 'email');
      expect(emailInput).toHaveAttribute('name', 'email');
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('autoComplete', 'email');
      expect(emailInput).toHaveAttribute('required');
    });

    test('form has proper semantic structure', () => {
      render(<ForgotPasswordPage />);
      
      const button = screen.getByRole('button', { name: /send reset link/i });
      expect(button).toHaveAttribute('type', 'submit');
    });

    test('error messages are properly displayed', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Test error'));
      
      render(<ForgotPasswordPage />);
      
      const emailInput = screen.getByPlaceholderText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      
      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);
      
      await waitFor(() => {
        const errorMessage = screen.getByText(/test error/i);
        expect(errorMessage).toBeInTheDocument();
      });
    });
  });

  // UI/UX Tests
  describe('UI/UX', () => {
    test('has proper styling classes', () => {
      render(<ForgotPasswordPage />);
      
      const main = screen.getByRole('main');
      expect(main).toHaveClass('min-h-screen', 'flex', 'items-center', 'justify-center');
      
      const emailInput = screen.getByPlaceholderText(/email address/i);
      expect(emailInput).toHaveClass('w-full', 'rounded-xl');
      
      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      expect(submitButton).toHaveClass('w-full', 'rounded-full');
    });

    test('error message has proper styling', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Test error'));
      
      render(<ForgotPasswordPage />);
      
      const emailInput = screen.getByPlaceholderText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      
      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);
      
      await waitFor(() => {
        const errorContainer = screen.getByText(/test error/i).closest('div').parentElement;
        expect(errorContainer).toHaveClass('bg-red-900/20', 'border-red-700/60');
      });
    });

    test('success message has proper styling', async () => {
      const user = userEvent.setup();
      render(<ForgotPasswordPage />);
      
      const emailInput = screen.getByPlaceholderText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      
      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);
      
      await waitFor(() => {
        const successContainer = screen.getByText(/password reset link has been sent/i).closest('div').parentElement;
        expect(successContainer).toHaveClass('bg-emerald-900/20', 'border-emerald-700/60');
      });
    });
  });

  // Edge Cases Tests
  describe('Edge Cases', () => {
    test('handles multiple rapid submissions', async () => {
      const user = userEvent.setup();
      render(<ForgotPasswordPage />);
      
      const emailInput = screen.getByPlaceholderText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      
      await user.type(emailInput, 'test@example.com');
      
      // Submit multiple times rapidly
      await user.click(submitButton);
      await user.click(submitButton);
      await user.click(submitButton);
      
      // Should make API calls (component doesn't prevent multiple submissions)
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });

    test('handles empty response from API', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });
      
      render(<ForgotPasswordPage />);
      
      const emailInput = screen.getByPlaceholderText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      
      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/password reset link has been sent to your email/i)).toBeInTheDocument();
      });
    });

    test('maintains form state during loading', async () => {
      const user = userEvent.setup();
      
      (global.fetch as jest.Mock).mockImplementation(() =>
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: () => Promise.resolve({ message: 'Success' }),
          }), 500)
        )
      );
      
      render(<ForgotPasswordPage />);
      
      const emailInput = screen.getByPlaceholderText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      
      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);
      
      // Email should still be in input during loading
      expect(emailInput).toHaveValue('test@example.com');
    });
  });
});
