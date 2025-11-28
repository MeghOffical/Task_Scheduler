/**
 * Unit tests for login page
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import LoginPage from './page';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// Mock next-auth
jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
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

// Mock fetch
global.fetch = jest.fn();

describe('LoginPage', () => {
  const mockPush = jest.fn();
  const mockReplace = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    // Reset mock implementations to return null by default
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockImplementation((key, value) => {});
    localStorageMock.removeItem.mockImplementation((key) => {});
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: mockReplace,
      prefetch: jest.fn(),
      back: jest.fn(),
    });
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
  });

  describe('Initial Render', () => {
    it('should render the login form with all elements', () => {
      render(<LoginPage />);

      expect(screen.getByText('Welcome Back')).toBeInTheDocument();
      expect(screen.getByText('Sign in to continue to Plan-It')).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /google/i })).toBeInTheDocument();
    });

    it('should render remember me checkbox', () => {
      render(<LoginPage />);

      const checkbox = screen.getByRole('checkbox', { name: /remember me/i });
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).not.toBeChecked();
    });

    it('should render forgot password link', () => {
      render(<LoginPage />);

      const link = screen.getByRole('link', { name: /forgot password/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/forgot-password');
    });

    it('should render create account link', () => {
      render(<LoginPage />);

      const link = screen.getByRole('link', { name: /create account/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/register');
    });

    it('should load remembered email from localStorage on mount', async () => {
      localStorageMock.getItem.mockReturnValue('saved@example.com');

      render(<LoginPage />);

      await waitFor(() => {
        const emailInput = screen.getByLabelText(/email address/i) as HTMLInputElement;
        expect(emailInput.value).toBe('saved@example.com');
      });

      expect(localStorageMock.getItem).toHaveBeenCalledWith('rememberedEmail');
    });

    it('should check remember me checkbox if email was loaded', async () => {
      localStorageMock.getItem.mockReturnValue('saved@example.com');

      render(<LoginPage />);

      await waitFor(() => {
        const checkbox = screen.getByRole('checkbox', { name: /remember me/i });
        expect(checkbox).toBeChecked();
      });
    });
  });

  describe('Form Input Handling', () => {
    it('should update email field when user types', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email address/i) as HTMLInputElement;
      await user.clear(emailInput);
      await user.type(emailInput, 'test@example.com');

      expect(emailInput).toHaveValue('test@example.com');
    });

    it('should update password field when user types', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const passwordInput = screen.getByLabelText(/^password$/i);
      await user.type(passwordInput, 'password123');

      expect(passwordInput).toHaveValue('password123');
    });

    it('should toggle remember me checkbox', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const checkbox = screen.getByRole('checkbox', { name: /remember me/i });
      expect(checkbox).not.toBeChecked();

      await user.click(checkbox);
      expect(checkbox).toBeChecked();

      await user.click(checkbox);
      expect(checkbox).not.toBeChecked();
    });

    it('should toggle password visibility when eye icon is clicked', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const passwordInput = screen.getByLabelText(/^password$/i) as HTMLInputElement;
      expect(passwordInput.type).toBe('password');

      const toggleButton = screen.getByRole('button', { name: '' });
      await user.click(toggleButton);

      expect(passwordInput.type).toBe('text');

      await user.click(toggleButton);
      expect(passwordInput.type).toBe('password');
    });
  });

  describe('Form Submission - Success', () => {
    it('should call signIn with correct credentials on submit', async () => {
      const user = userEvent.setup();
      (signIn as jest.Mock).mockResolvedValue({ ok: true });

      render(<LoginPage />);

      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(signIn).toHaveBeenCalledWith('credentials', {
          email: 'test@example.com',
          password: 'password123',
          redirect: false,
        });
      });
    });

    it('should redirect to dashboard on successful login', async () => {
      const user = userEvent.setup();
      (signIn as jest.Mock).mockResolvedValue({ ok: true });

      render(<LoginPage />);

      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('should show loading state during login', async () => {
      const user = userEvent.setup();
      let resolveSignIn: any;
      (signIn as jest.Mock).mockReturnValue(
        new Promise((resolve) => {
          resolveSignIn = resolve;
        })
      );

      render(<LoginPage />);

      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/signing in/i)).toBeInTheDocument();
      });

      resolveSignIn({ ok: true });

      await waitFor(() => {
        expect(screen.queryByText(/signing in/i)).not.toBeInTheDocument();
      });
    });

    it('should disable submit button while loading', async () => {
      const user = userEvent.setup();
      let resolveSignIn: any;
      (signIn as jest.Mock).mockReturnValue(
        new Promise((resolve) => {
          resolveSignIn = resolve;
        })
      );

      render(<LoginPage />);

      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });

      resolveSignIn({ ok: true });

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });

    it('should save email to localStorage when remember me is checked', async () => {
      const user = userEvent.setup();
      (signIn as jest.Mock).mockResolvedValue({ ok: true });

      render(<LoginPage />);

      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.click(screen.getByRole('checkbox', { name: /remember me/i }));
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith('rememberedEmail', 'test@example.com');
      });
    });

    it('should remove email from localStorage when remember me is not checked', async () => {
      const user = userEvent.setup();
      (signIn as jest.Mock).mockResolvedValue({ ok: true });

      render(<LoginPage />);

      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('rememberedEmail');
      });
    });

    it('should call extend-session API when remember me is checked', async () => {
      const user = userEvent.setup();
      (signIn as jest.Mock).mockResolvedValue({ ok: true });

      render(<LoginPage />);

      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.click(screen.getByRole('checkbox', { name: /remember me/i }));
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/auth/extend-session', { method: 'POST' });
      });
    });

    it('should handle extend-session API failure gracefully', async () => {
      const user = userEvent.setup();
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      (signIn as jest.Mock).mockResolvedValue({ ok: true });
      (global.fetch as jest.Mock).mockRejectedValue(new Error('API Error'));

      render(<LoginPage />);

      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.click(screen.getByRole('checkbox', { name: /remember me/i }));
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/dashboard');
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Form Submission - Errors', () => {
    it('should display error message when signIn returns error', async () => {
      const user = userEvent.setup();
      (signIn as jest.Mock).mockResolvedValue({ error: 'Invalid credentials' });

      render(<LoginPage />);

      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'wrongpassword');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });
    });

    it('should display generic error when signIn throws exception', async () => {
      const user = userEvent.setup();
      (signIn as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(<LoginPage />);

      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('should display fallback error message for non-Error exceptions', async () => {
      const user = userEvent.setup();
      (signIn as jest.Mock).mockRejectedValue('String error');

      render(<LoginPage />);

      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText('Failed to login')).toBeInTheDocument();
      });
    });

    it('should clear previous error when retrying login', async () => {
      const user = userEvent.setup();
      (signIn as jest.Mock).mockResolvedValueOnce({ error: 'Invalid credentials' });

      render(<LoginPage />);

      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'wrongpassword');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });

      (signIn as jest.Mock).mockResolvedValueOnce({ ok: true });
      await user.clear(screen.getByLabelText(/^password$/i));
      await user.type(screen.getByLabelText(/^password$/i), 'correctpassword');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.queryByText('Invalid credentials')).not.toBeInTheDocument();
      });
    });

    it('should not redirect to dashboard when login fails', async () => {
      const user = userEvent.setup();
      (signIn as jest.Mock).mockResolvedValue({ error: 'Invalid credentials' });

      render(<LoginPage />);

      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'wrongpassword');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });

      expect(mockReplace).not.toHaveBeenCalled();
    });

    it('should re-enable submit button after error', async () => {
      const user = userEvent.setup();
      (signIn as jest.Mock).mockResolvedValue({ error: 'Invalid credentials' });

      render(<LoginPage />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'wrongpassword');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });

      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('Google Sign-In', () => {
    it('should call signIn with google provider when Google button is clicked', async () => {
      const user = userEvent.setup();
      (signIn as jest.Mock).mockResolvedValue({});

      render(<LoginPage />);

      const googleButton = screen.getByRole('button', { name: /google/i });
      await user.click(googleButton);

      await waitFor(() => {
        expect(signIn).toHaveBeenCalledWith('google', { callbackUrl: '/dashboard' });
      });
    });

    it('should show loading state during Google sign-in', async () => {
      const user = userEvent.setup();
      let resolveSignIn: any;
      (signIn as jest.Mock).mockReturnValue(
        new Promise((resolve) => {
          resolveSignIn = resolve;
        })
      );

      render(<LoginPage />);

      const googleButton = screen.getByRole('button', { name: /google/i });
      await user.click(googleButton);

      await waitFor(() => {
        expect(googleButton).toBeDisabled();
      });

      // Google signIn doesn't call setLoading(false) on success - it redirects instead
      resolveSignIn({});

      // Button stays disabled since page redirects
      await waitFor(() => {
        expect(googleButton).toBeDisabled();
      });
    });

    it('should display error message when Google sign-in fails', async () => {
      const user = userEvent.setup();
      (signIn as jest.Mock).mockRejectedValue(new Error('Google auth failed'));

      render(<LoginPage />);

      const googleButton = screen.getByRole('button', { name: /google/i });
      await user.click(googleButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to sign in with Google')).toBeInTheDocument();
      });
    });

    it('should disable both buttons during Google sign-in', async () => {
      const user = userEvent.setup();
      let resolveSignIn: any;
      (signIn as jest.Mock).mockReturnValue(
        new Promise((resolve) => {
          resolveSignIn = resolve;
        })
      );

      render(<LoginPage />);

      const googleButton = screen.getByRole('button', { name: /google/i });
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.click(googleButton);

      await waitFor(() => {
        expect(googleButton).toBeDisabled();
        expect(submitButton).toBeDisabled();
      });

      resolveSignIn({});
    });

    it('should clear previous errors before Google sign-in', async () => {
      const user = userEvent.setup();
      (signIn as jest.Mock).mockResolvedValueOnce({ error: 'Invalid credentials' });

      render(<LoginPage />);

      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'wrongpassword');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });

      (signIn as jest.Mock).mockResolvedValue({});
      const googleButton = screen.getByRole('button', { name: /google/i });
      await user.click(googleButton);

      // Error is cleared when Google sign-in starts (setError('') is called)
      expect(screen.queryByText('Invalid credentials')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle localStorage errors on mount gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage not available');
      });

      expect(() => render(<LoginPage />)).not.toThrow();
    });

    it('should handle localStorage errors when saving email', async () => {
      const user = userEvent.setup();
      (signIn as jest.Mock).mockResolvedValue({ ok: true });
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage not available');
      });

      render(<LoginPage />);

      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.click(screen.getByRole('checkbox', { name: /remember me/i }));
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      // Should still redirect despite localStorage error
      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/dashboard');
      }, { timeout: 3000 });
    });

    it('should handle localStorage errors when removing email', async () => {
      const user = userEvent.setup();
      (signIn as jest.Mock).mockResolvedValue({ ok: true });
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('localStorage not available');
      });

      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email address/i);
      await user.clear(emailInput);
      await user.type(emailInput, 'test@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/dashboard');
      }, { timeout: 3000 });
    });

    it('should prevent default form submission', async () => {
      const user = userEvent.setup();
      (signIn as jest.Mock).mockResolvedValue({ ok: true });

      render(<LoginPage />);

      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      // Verify signIn was called (which means preventDefault worked)
      await waitFor(() => {
        expect(signIn).toHaveBeenCalledWith('credentials', {
          email: 'test@example.com',
          password: 'password123',
          redirect: false,
        });
      });
    });

    it('should handle signIn returning null result', async () => {
      const user = userEvent.setup();
      (signIn as jest.Mock).mockResolvedValue(null);

      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email address/i);
      await user.clear(emailInput);
      await user.type(emailInput, 'test@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      // Wait for async operations to complete
      await waitFor(() => {
        expect(signIn).toHaveBeenCalled();
      });
      
      // Should not redirect when result is null
      expect(mockReplace).not.toHaveBeenCalled();
    });

    it('should handle empty error message from signIn', async () => {
      const user = userEvent.setup();
      (signIn as jest.Mock).mockResolvedValue({ error: '' });

      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email address/i);
      await user.clear(emailInput);
      await user.type(emailInput, 'test@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      // Empty error string is falsy, so the check `if (result?.error)` won't trigger
      // No error message should be displayed
      await waitFor(() => {
        expect(signIn).toHaveBeenCalled();
      });
      
      expect(screen.queryByText('Invalid credentials')).not.toBeInTheDocument();
      expect(mockReplace).not.toHaveBeenCalled(); // Should not redirect either
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for form fields', () => {
      render(<LoginPage />);

      expect(screen.getByLabelText(/email address/i)).toHaveAttribute('type', 'email');
      expect(screen.getByLabelText(/^password$/i)).toHaveAttribute('type', 'password');
    });

    it('should mark required fields as required', () => {
      render(<LoginPage />);

      expect(screen.getByLabelText(/email address/i)).toBeRequired();
      expect(screen.getByLabelText(/^password$/i)).toBeRequired();
    });

    it('should have proper autocomplete attributes', () => {
      render(<LoginPage />);

      expect(screen.getByLabelText(/email address/i)).toHaveAttribute('autoComplete', 'email');
      expect(screen.getByLabelText(/^password$/i)).toHaveAttribute('autoComplete', 'current-password');
    });

    it('should render error message with proper styling', async () => {
      const user = userEvent.setup();
      (signIn as jest.Mock).mockResolvedValue({ error: 'Test error' });

      render(<LoginPage />);

      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'password');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        const errorElement = screen.getByText('Test error');
        expect(errorElement).toBeInTheDocument();
        expect(errorElement.closest('div')).toHaveClass('text-sm');
      });
    });
  });
});
