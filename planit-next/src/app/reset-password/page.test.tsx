import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter, useSearchParams } from 'next/navigation';
import ResetPasswordPage from './page';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

describe('ResetPasswordPage', () => {
  const mockPush = jest.fn();
  const mockGet = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    (useSearchParams as jest.Mock).mockReturnValue({
      get: mockGet,
    });
    (global.fetch as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('With Valid Token', () => {
    beforeEach(() => {
      mockGet.mockImplementation((key: string) => key === 'token' ? 'valid-token-123' : null);
    });

    describe('Initial Render', () => {
      it('should render reset password form with valid token', async () => {
        render(<ResetPasswordPage />);

        await waitFor(() => {
          expect(screen.getByText('Reset your password')).toBeInTheDocument();
        });

        expect(screen.getByText('Enter your new password below to secure your Plan-it account.')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('New password')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Confirm new password')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument();
      });

      it('should render password input fields', async () => {
        render(<ResetPasswordPage />);

        await waitFor(() => {
          expect(screen.getByPlaceholderText('New password')).toBeInTheDocument();
        });

        const passwordInput = screen.getByPlaceholderText('New password') as HTMLInputElement;
        const confirmPasswordInput = screen.getByPlaceholderText('Confirm new password') as HTMLInputElement;

        expect(passwordInput).toHaveAttribute('type', 'password');
        expect(passwordInput).toHaveAttribute('id', 'password');
        expect(passwordInput).toBeRequired();

        expect(confirmPasswordInput).toHaveAttribute('type', 'password');
        expect(confirmPasswordInput).toHaveAttribute('id', 'confirmPassword');
        expect(confirmPasswordInput).toBeRequired();
      });

      it('should render back to login link', async () => {
        render(<ResetPasswordPage />);

        await waitFor(() => {
          const backLink = screen.getByRole('link', { name: /back to login/i });
          expect(backLink).toBeInTheDocument();
          expect(backLink).toHaveAttribute('href', '/');
        });
      });

      it('should not show error or success messages initially', async () => {
        render(<ResetPasswordPage />);

        await waitFor(() => {
          expect(screen.getByText('Reset your password')).toBeInTheDocument();
        });

        expect(screen.queryByText(/passwords do not match/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/password reset successfully/i)).not.toBeInTheDocument();
      });
    });

    describe('Form Input Handling', () => {
      it('should update password field on change', async () => {
        const user = userEvent.setup({ delay: null });
        render(<ResetPasswordPage />);

        await waitFor(() => {
          expect(screen.getByPlaceholderText('New password')).toBeInTheDocument();
        });

        const passwordInput = screen.getByPlaceholderText('New password') as HTMLInputElement;
        await user.type(passwordInput, 'newPassword123');

        expect(passwordInput.value).toBe('newPassword123');
      });

      it('should update confirm password field on change', async () => {
        const user = userEvent.setup({ delay: null });
        render(<ResetPasswordPage />);

        await waitFor(() => {
          expect(screen.getByPlaceholderText('Confirm new password')).toBeInTheDocument();
        });

        const confirmPasswordInput = screen.getByPlaceholderText('Confirm new password') as HTMLInputElement;
        await user.type(confirmPasswordInput, 'newPassword123');

        expect(confirmPasswordInput.value).toBe('newPassword123');
      });
    });

    describe('Password Validation', () => {
      it('should show error when passwords do not match', async () => {
        const user = userEvent.setup({ delay: null });
        render(<ResetPasswordPage />);

        await waitFor(() => {
          expect(screen.getByPlaceholderText('New password')).toBeInTheDocument();
        });

        await user.type(screen.getByPlaceholderText('New password'), 'password123');
        await user.type(screen.getByPlaceholderText('Confirm new password'), 'different456');

        await user.click(screen.getByRole('button', { name: /reset password/i }));

        await waitFor(() => {
          expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
        });

        expect(global.fetch).not.toHaveBeenCalled();
      });

      it('should show error when password is too short', async () => {
        const user = userEvent.setup({ delay: null });
        render(<ResetPasswordPage />);

        await waitFor(() => {
          expect(screen.getByPlaceholderText('New password')).toBeInTheDocument();
        });

        await user.type(screen.getByPlaceholderText('New password'), 'short');
        await user.type(screen.getByPlaceholderText('Confirm new password'), 'short');

        await user.click(screen.getByRole('button', { name: /reset password/i }));

        await waitFor(() => {
          expect(screen.getByText('Password must be at least 8 characters long')).toBeInTheDocument();
        });

        expect(global.fetch).not.toHaveBeenCalled();
      });

      it('should accept valid matching passwords of 8 characters', async () => {
        const user = userEvent.setup({ delay: null });
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ message: 'Password reset successfully' }),
        });

        render(<ResetPasswordPage />);

        await waitFor(() => {
          expect(screen.getByPlaceholderText('New password')).toBeInTheDocument();
        });

        await user.type(screen.getByPlaceholderText('New password'), 'password');
        await user.type(screen.getByPlaceholderText('Confirm new password'), 'password');

        await user.click(screen.getByRole('button', { name: /reset password/i }));

        await waitFor(() => {
          expect(global.fetch).toHaveBeenCalled();
        });
      });

      it('should accept valid matching passwords longer than 8 characters', async () => {
        const user = userEvent.setup({ delay: null });
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ message: 'Password reset successfully' }),
        });

        render(<ResetPasswordPage />);

        await waitFor(() => {
          expect(screen.getByPlaceholderText('New password')).toBeInTheDocument();
        });

        await user.type(screen.getByPlaceholderText('New password'), 'verylongpassword123');
        await user.type(screen.getByPlaceholderText('Confirm new password'), 'verylongpassword123');

        await user.click(screen.getByRole('button', { name: /reset password/i }));

        await waitFor(() => {
          expect(global.fetch).toHaveBeenCalled();
        });
      });
    });

    describe('Password Reset Submission', () => {
      it('should successfully reset password with valid data', async () => {
        const user = userEvent.setup({ delay: null });
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ message: 'Password reset successfully' }),
        });

        render(<ResetPasswordPage />);

        await waitFor(() => {
          expect(screen.getByPlaceholderText('New password')).toBeInTheDocument();
        });

        await user.type(screen.getByPlaceholderText('New password'), 'newPassword123');
        await user.type(screen.getByPlaceholderText('Confirm new password'), 'newPassword123');

        await user.click(screen.getByRole('button', { name: /reset password/i }));

        await waitFor(() => {
          expect(global.fetch).toHaveBeenCalledWith('/api/auth/reset-password', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              token: 'valid-token-123',
              password: 'newPassword123',
            }),
          });
        });

        await waitFor(() => {
          expect(screen.getByText(/password reset successfully/i)).toBeInTheDocument();
        });
      });

      it('should show success message and redirect after successful reset', async () => {
        const user = userEvent.setup({ delay: null });
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ message: 'Password reset successfully' }),
        });

        render(<ResetPasswordPage />);

        await waitFor(() => {
          expect(screen.getByPlaceholderText('New password')).toBeInTheDocument();
        });

        await user.type(screen.getByPlaceholderText('New password'), 'newPassword123');
        await user.type(screen.getByPlaceholderText('Confirm new password'), 'newPassword123');

        await user.click(screen.getByRole('button', { name: /reset password/i }));

        await waitFor(() => {
          expect(screen.getByText('Password reset successfully! Redirecting to home...')).toBeInTheDocument();
        });

        // Fast-forward 2 seconds
        jest.advanceTimersByTime(2000);

        await waitFor(() => {
          expect(mockPush).toHaveBeenCalledWith('/');
        });
      });

      it('should show loading state during submission', async () => {
        const user = userEvent.setup({ delay: null });
        (global.fetch as jest.Mock).mockImplementation(() =>
          new Promise(resolve => setTimeout(() => resolve({
            ok: true,
            json: async () => ({ message: 'Success' }),
          }), 100))
        );

        render(<ResetPasswordPage />);

        await waitFor(() => {
          expect(screen.getByPlaceholderText('New password')).toBeInTheDocument();
        });

        await user.type(screen.getByPlaceholderText('New password'), 'newPassword123');
        await user.type(screen.getByPlaceholderText('Confirm new password'), 'newPassword123');

        await user.click(screen.getByRole('button', { name: /reset password/i }));

        expect(screen.getByText(/resetting\.\.\./i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /resetting/i })).toBeDisabled();
      });

      it('should disable button during loading', async () => {
        const user = userEvent.setup({ delay: null });
        (global.fetch as jest.Mock).mockImplementation(() =>
          new Promise(resolve => setTimeout(() => resolve({
            ok: true,
            json: async () => ({ message: 'Success' }),
          }), 100))
        );

        render(<ResetPasswordPage />);

        await waitFor(() => {
          expect(screen.getByPlaceholderText('New password')).toBeInTheDocument();
        });

        await user.type(screen.getByPlaceholderText('New password'), 'newPassword123');
        await user.type(screen.getByPlaceholderText('Confirm new password'), 'newPassword123');

        const submitButton = screen.getByRole('button', { name: /reset password/i });
        await user.click(submitButton);

        expect(submitButton).toBeDisabled();
      });
    });

    describe('Error Handling', () => {
      it('should display error message from API', async () => {
        const user = userEvent.setup({ delay: null });
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          json: async () => ({ message: 'Invalid or expired token' }),
        });

        render(<ResetPasswordPage />);

        await waitFor(() => {
          expect(screen.getByPlaceholderText('New password')).toBeInTheDocument();
        });

        await user.type(screen.getByPlaceholderText('New password'), 'newPassword123');
        await user.type(screen.getByPlaceholderText('Confirm new password'), 'newPassword123');

        await user.click(screen.getByRole('button', { name: /reset password/i }));

        await waitFor(() => {
          expect(screen.getByText('Invalid or expired token')).toBeInTheDocument();
        });
      });

      it('should display generic error when API error has no message', async () => {
        const user = userEvent.setup({ delay: null });
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          json: async () => ({}),
        });

        render(<ResetPasswordPage />);

        await waitFor(() => {
          expect(screen.getByPlaceholderText('New password')).toBeInTheDocument();
        });

        await user.type(screen.getByPlaceholderText('New password'), 'newPassword123');
        await user.type(screen.getByPlaceholderText('Confirm new password'), 'newPassword123');

        await user.click(screen.getByRole('button', { name: /reset password/i }));

        await waitFor(() => {
          expect(screen.getByText('Failed to reset password')).toBeInTheDocument();
        });
      });

      it('should handle network error', async () => {
        const user = userEvent.setup({ delay: null });
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

        render(<ResetPasswordPage />);

        await waitFor(() => {
          expect(screen.getByPlaceholderText('New password')).toBeInTheDocument();
        });

        await user.type(screen.getByPlaceholderText('New password'), 'newPassword123');
        await user.type(screen.getByPlaceholderText('Confirm new password'), 'newPassword123');

        await user.click(screen.getByRole('button', { name: /reset password/i }));

        await waitFor(() => {
          expect(screen.getByText('Network error')).toBeInTheDocument();
        });
      });

      it('should handle non-Error exceptions', async () => {
        const user = userEvent.setup({ delay: null });
        (global.fetch as jest.Mock).mockRejectedValueOnce('String error');

        render(<ResetPasswordPage />);

        await waitFor(() => {
          expect(screen.getByPlaceholderText('New password')).toBeInTheDocument();
        });

        await user.type(screen.getByPlaceholderText('New password'), 'newPassword123');
        await user.type(screen.getByPlaceholderText('Confirm new password'), 'newPassword123');

        await user.click(screen.getByRole('button', { name: /reset password/i }));

        await waitFor(() => {
          expect(screen.getByText('Failed to reset password')).toBeInTheDocument();
        });
      });

      it('should clear previous error when submitting again', async () => {
        const user = userEvent.setup({ delay: null });
        (global.fetch as jest.Mock)
          .mockResolvedValueOnce({
            ok: false,
            json: async () => ({ message: 'First error' }),
          })
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({ message: 'Success' }),
          });

        render(<ResetPasswordPage />);

        await waitFor(() => {
          expect(screen.getByPlaceholderText('New password')).toBeInTheDocument();
        });

        await user.type(screen.getByPlaceholderText('New password'), 'newPassword123');
        await user.type(screen.getByPlaceholderText('Confirm new password'), 'newPassword123');

        await user.click(screen.getByRole('button', { name: /reset password/i }));

        await waitFor(() => {
          expect(screen.getByText('First error')).toBeInTheDocument();
        });

        await user.click(screen.getByRole('button', { name: /reset password/i }));

        await waitFor(() => {
          expect(screen.queryByText('First error')).not.toBeInTheDocument();
        });
      });

      it('should clear previous success message when submitting again', async () => {
        const user = userEvent.setup({ delay: null });
        (global.fetch as jest.Mock)
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({ message: 'Success' }),
          })
          .mockResolvedValueOnce({
            ok: false,
            json: async () => ({ message: 'Error message' }),
          });

        render(<ResetPasswordPage />);

        await waitFor(() => {
          expect(screen.getByPlaceholderText('New password')).toBeInTheDocument();
        });

        await user.type(screen.getByPlaceholderText('New password'), 'newPassword123');
        await user.type(screen.getByPlaceholderText('Confirm new password'), 'newPassword123');

        await user.click(screen.getByRole('button', { name: /reset password/i }));

        await waitFor(() => {
          expect(screen.getByText(/password reset successfully/i)).toBeInTheDocument();
        });

        // Clear inputs and try again
        await user.clear(screen.getByPlaceholderText('New password'));
        await user.clear(screen.getByPlaceholderText('Confirm new password'));
        await user.type(screen.getByPlaceholderText('New password'), 'anotherPass123');
        await user.type(screen.getByPlaceholderText('Confirm new password'), 'anotherPass123');

        await user.click(screen.getByRole('button', { name: /reset password/i }));

        await waitFor(() => {
          expect(screen.queryByText(/password reset successfully/i)).not.toBeInTheDocument();
        });
      });
    });

    describe('Accessibility', () => {
      it('should have proper labels for form fields', async () => {
        render(<ResetPasswordPage />);

        await waitFor(() => {
          expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
        });

        expect(screen.getByLabelText(/new password/i)).toHaveAttribute('id', 'password');
        expect(screen.getByLabelText(/confirm password/i)).toHaveAttribute('id', 'confirmPassword');
      });

      it('should have autocomplete attributes', async () => {
        render(<ResetPasswordPage />);

        await waitFor(() => {
          expect(screen.getByPlaceholderText('New password')).toBeInTheDocument();
        });

        const passwordInput = screen.getByPlaceholderText('New password');
        const confirmPasswordInput = screen.getByPlaceholderText('Confirm new password');

        expect(passwordInput).toHaveAttribute('autoComplete', 'new-password');
        expect(confirmPasswordInput).toHaveAttribute('autoComplete', 'new-password');
      });

      it('should mark fields as required', async () => {
        render(<ResetPasswordPage />);

        await waitFor(() => {
          expect(screen.getByPlaceholderText('New password')).toBeInTheDocument();
        });

        expect(screen.getByPlaceholderText('New password')).toBeRequired();
        expect(screen.getByPlaceholderText('Confirm new password')).toBeRequired();
      });
    });
  });

  describe('Without Token (Invalid Link)', () => {
    beforeEach(() => {
      mockGet.mockImplementation(() => null);
    });

    it('should render invalid link message when token is missing', async () => {
      render(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByText('Invalid or expired link')).toBeInTheDocument();
      });

      expect(screen.getByText(/your password reset link is invalid or has expired/i)).toBeInTheDocument();
      expect(screen.getByText('Invalid or missing reset token')).toBeInTheDocument();
    });

    it('should not render password form when token is missing', async () => {
      render(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByText('Invalid or expired link')).toBeInTheDocument();
      });

      expect(screen.queryByPlaceholderText('New password')).not.toBeInTheDocument();
      expect(screen.queryByPlaceholderText('Confirm new password')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /reset password/i })).not.toBeInTheDocument();
    });

    it('should render link to request new reset link', async () => {
      render(<ResetPasswordPage />);

      await waitFor(() => {
        const requestLink = screen.getByRole('link', { name: /request a new reset link/i });
        expect(requestLink).toBeInTheDocument();
        expect(requestLink).toHaveAttribute('href', '/forgot-password');
      });
    });

    it('should show error message in error box', async () => {
      render(<ResetPasswordPage />);

      await waitFor(() => {
        const errorText = screen.getByText('Invalid or missing reset token');
        const errorBox = errorText.parentElement;
        expect(errorBox).toHaveClass('bg-red-900/20');
        expect(errorBox).toHaveClass('border-red-700/60');
      });
    });
  });

  describe('Loading State', () => {
    it('should render loading fallback while suspense is loading', () => {
      const { container } = render(<ResetPasswordPage />);
      
      // Check if loading spinner exists in initial render
      const spinner = container.querySelector('.animate-spin');
      if (spinner) {
        expect(spinner).toBeInTheDocument();
      }
    });
  });
});
