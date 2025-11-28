import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import RegisterPage from './page';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

describe('RegisterPage', () => {
  const mockPush = jest.fn();
  const mockReplace = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: mockReplace,
    });
    (global.fetch as jest.Mock).mockClear();
    (signIn as jest.Mock).mockClear();
  });

  describe('Initial Render', () => {
    it('should render the registration form with all fields', () => {
      render(<RegisterPage />);

      expect(screen.getByText('Create Your Account')).toBeInTheDocument();
      expect(screen.getByText('Join Plan-It and start organizing your work')).toBeInTheDocument();
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/profession/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });

    it('should render profession dropdown with all options', () => {
      render(<RegisterPage />);

      const professionSelect = screen.getByLabelText(/profession/i) as HTMLSelectElement;
      const options = within(professionSelect).getAllByRole('option');

      expect(options).toHaveLength(10);
      expect(options[0]).toHaveTextContent('Select your profession');
      expect(options[1]).toHaveTextContent('Student');
      expect(options[2]).toHaveTextContent('Working Professional');
      expect(options[3]).toHaveTextContent('Freelancer');
      expect(options[4]).toHaveTextContent('Entrepreneur');
      expect(options[5]).toHaveTextContent('Designer');
      expect(options[6]).toHaveTextContent('Developer');
      expect(options[7]).toHaveTextContent('Manager');
      expect(options[8]).toHaveTextContent('Teacher');
      expect(options[9]).toHaveTextContent('Other');
    });

    it('should render Google sign-in button', () => {
      render(<RegisterPage />);

      expect(screen.getByRole('button', { name: /google/i })).toBeInTheDocument();
      expect(screen.getByText('Or continue with')).toBeInTheDocument();
    });

    it('should render login link', () => {
      render(<RegisterPage />);

      expect(screen.getByText(/already have an account\?/i)).toBeInTheDocument();
      const loginLink = screen.getByRole('link', { name: /sign in/i });
      expect(loginLink).toBeInTheDocument();
      expect(loginLink).toHaveAttribute('href', '/login');
    });

    it('should not show "Other Profession" field initially', () => {
      render(<RegisterPage />);

      expect(screen.queryByLabelText(/specify profession/i)).not.toBeInTheDocument();
    });
  });

  describe('Form Input Handling', () => {
    it('should update username field', async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      const usernameInput = screen.getByLabelText(/username/i) as HTMLInputElement;
      await user.type(usernameInput, 'testuser');

      expect(usernameInput.value).toBe('testuser');
    });

    it('should update email field', async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      const emailInput = screen.getByLabelText(/email address/i) as HTMLInputElement;
      await user.type(emailInput, 'test@example.com');

      expect(emailInput.value).toBe('test@example.com');
    });

    it('should update profession dropdown', async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      const professionSelect = screen.getByLabelText(/profession/i) as HTMLSelectElement;
      await user.selectOptions(professionSelect, 'Student');

      expect(professionSelect.value).toBe('Student');
    });

    it('should show "Other Profession" field when Other is selected', async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      const professionSelect = screen.getByLabelText(/profession/i);
      await user.selectOptions(professionSelect, 'Other');

      expect(screen.getByLabelText(/specify profession/i)).toBeInTheDocument();
    });

    it('should update "Other Profession" field', async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      const professionSelect = screen.getByLabelText(/profession/i);
      await user.selectOptions(professionSelect, 'Other');

      const otherProfessionInput = screen.getByLabelText(/specify profession/i) as HTMLInputElement;
      await user.type(otherProfessionInput, 'Custom Profession');

      expect(otherProfessionInput.value).toBe('Custom Profession');
    });

    it('should update password field', async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      const passwordInput = screen.getByLabelText(/^password$/i) as HTMLInputElement;
      await user.type(passwordInput, 'Password123!');

      expect(passwordInput.value).toBe('Password123!');
    });

    it('should update confirm password field', async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      const confirmPasswordInput = screen.getByLabelText(/confirm password/i) as HTMLInputElement;
      await user.type(confirmPasswordInput, 'Password123!');

      expect(confirmPasswordInput.value).toBe('Password123!');
    });
  });

  describe('Password Visibility Toggle', () => {
    it('should toggle password visibility', async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      const passwordInput = screen.getByLabelText(/^password$/i) as HTMLInputElement;
      expect(passwordInput.type).toBe('password');

      const toggleButtons = screen.getAllByRole('button', { name: '' });
      const passwordToggle = toggleButtons[0];
      await user.click(passwordToggle);

      expect(passwordInput.type).toBe('text');

      await user.click(passwordToggle);
      expect(passwordInput.type).toBe('password');
    });

    it('should toggle confirm password visibility', async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      const confirmPasswordInput = screen.getByLabelText(/confirm password/i) as HTMLInputElement;
      expect(confirmPasswordInput.type).toBe('password');

      const toggleButtons = screen.getAllByRole('button', { name: '' });
      const confirmPasswordToggle = toggleButtons[1];
      await user.click(confirmPasswordToggle);

      expect(confirmPasswordInput.type).toBe('text');

      await user.click(confirmPasswordToggle);
      expect(confirmPasswordInput.type).toBe('password');
    });
  });

  describe('Password Validation', () => {
    it('should show error for weak password (no uppercase)', async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.selectOptions(screen.getByLabelText(/profession/i), 'Student');
      await user.type(screen.getByLabelText(/^password$/i), 'password123!');
      await user.type(screen.getByLabelText(/confirm password/i), 'password123!');

      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText(/password must contain at least 8 characters/i)).toBeInTheDocument();
      });
    });

    it('should show error for weak password (no lowercase)', async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.selectOptions(screen.getByLabelText(/profession/i), 'Student');
      await user.type(screen.getByLabelText(/^password$/i), 'PASSWORD123!');
      await user.type(screen.getByLabelText(/confirm password/i), 'PASSWORD123!');

      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText(/password must contain at least 8 characters/i)).toBeInTheDocument();
      });
    });

    it('should show error for weak password (no number)', async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.selectOptions(screen.getByLabelText(/profession/i), 'Student');
      await user.type(screen.getByLabelText(/^password$/i), 'Password!');
      await user.type(screen.getByLabelText(/confirm password/i), 'Password!');

      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText(/password must contain at least 8 characters/i)).toBeInTheDocument();
      });
    });

    it('should show error for weak password (no special character)', async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.selectOptions(screen.getByLabelText(/profession/i), 'Student');
      await user.type(screen.getByLabelText(/^password$/i), 'Password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'Password123');

      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText(/password must contain at least 8 characters/i)).toBeInTheDocument();
      });
    });

    it('should show error for weak password (too short)', async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.selectOptions(screen.getByLabelText(/profession/i), 'Student');
      await user.type(screen.getByLabelText(/^password$/i), 'Pass1!');
      await user.type(screen.getByLabelText(/confirm password/i), 'Pass1!');

      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText(/password must contain at least 8 characters/i)).toBeInTheDocument();
      });
    });

    it('should show error when passwords do not match', async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.selectOptions(screen.getByLabelText(/profession/i), 'Student');
      await user.type(screen.getByLabelText(/^password$/i), 'Password123!');
      await user.type(screen.getByLabelText(/confirm password/i), 'Password456!');

      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      });
    });

    it('should accept valid password', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'User registered successfully' }),
      });

      render(<RegisterPage />);

      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.selectOptions(screen.getByLabelText(/profession/i), 'Student');
      await user.type(screen.getByLabelText(/^password$/i), 'Password123!');
      await user.type(screen.getByLabelText(/confirm password/i), 'Password123!');

      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });
  });

  describe('Registration Submission', () => {
    it('should successfully register with valid credentials', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'User registered successfully' }),
      });

      render(<RegisterPage />);

      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.selectOptions(screen.getByLabelText(/profession/i), 'Developer');
      await user.type(screen.getByLabelText(/^password$/i), 'Password123!');
      await user.type(screen.getByLabelText(/confirm password/i), 'Password123!');

      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: 'testuser',
            email: 'test@example.com',
            password: 'Password123!',
            profession: 'Developer',
          }),
        });
      });

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/');
      });
    });

    it('should submit with custom profession when "Other" is selected', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'User registered successfully' }),
      });

      render(<RegisterPage />);

      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.selectOptions(screen.getByLabelText(/profession/i), 'Other');
      await user.type(screen.getByLabelText(/specify profession/i), 'Custom Job');
      await user.type(screen.getByLabelText(/^password$/i), 'Password123!');
      await user.type(screen.getByLabelText(/confirm password/i), 'Password123!');

      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: 'testuser',
            email: 'test@example.com',
            password: 'Password123!',
            profession: 'Custom Job',
          }),
        });
      });
    });

    it('should show loading state during registration', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ message: 'Success' }),
        }), 100))
      );

      render(<RegisterPage />);

      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.selectOptions(screen.getByLabelText(/profession/i), 'Student');
      await user.type(screen.getByLabelText(/^password$/i), 'Password123!');
      await user.type(screen.getByLabelText(/confirm password/i), 'Password123!');

      await user.click(screen.getByRole('button', { name: /create account/i }));

      expect(screen.getByText(/creating account\.\.\./i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /creating account/i })).toBeDisabled();

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalled();
      });
    });

    it('should disable submit button during loading', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ message: 'Success' }),
        }), 100))
      );

      render(<RegisterPage />);

      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.selectOptions(screen.getByLabelText(/profession/i), 'Student');
      await user.type(screen.getByLabelText(/^password$/i), 'Password123!');
      await user.type(screen.getByLabelText(/confirm password/i), 'Password123!');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      expect(submitButton).toBeDisabled();

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message from API', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Email already exists' }),
      });

      render(<RegisterPage />);

      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.selectOptions(screen.getByLabelText(/profession/i), 'Student');
      await user.type(screen.getByLabelText(/^password$/i), 'Password123!');
      await user.type(screen.getByLabelText(/confirm password/i), 'Password123!');

      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText('Email already exists')).toBeInTheDocument();
      });
    });

    it('should display generic error message when API error has no message', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

      render(<RegisterPage />);

      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.selectOptions(screen.getByLabelText(/profession/i), 'Student');
      await user.type(screen.getByLabelText(/^password$/i), 'Password123!');
      await user.type(screen.getByLabelText(/confirm password/i), 'Password123!');

      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      });
    });

    it('should handle network error', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(<RegisterPage />);

      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.selectOptions(screen.getByLabelText(/profession/i), 'Student');
      await user.type(screen.getByLabelText(/^password$/i), 'Password123!');
      await user.type(screen.getByLabelText(/confirm password/i), 'Password123!');

      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('should handle non-Error exceptions', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockRejectedValueOnce('String error');

      render(<RegisterPage />);

      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.selectOptions(screen.getByLabelText(/profession/i), 'Student');
      await user.type(screen.getByLabelText(/^password$/i), 'Password123!');
      await user.type(screen.getByLabelText(/confirm password/i), 'Password123!');

      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText('Failed to register')).toBeInTheDocument();
      });
    });

    it('should clear previous error when submitting again', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ message: 'First error' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ message: 'Success' }),
        });

      render(<RegisterPage />);

      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.selectOptions(screen.getByLabelText(/profession/i), 'Student');
      await user.type(screen.getByLabelText(/^password$/i), 'Password123!');
      await user.type(screen.getByLabelText(/confirm password/i), 'Password123!');

      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText('First error')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(screen.queryByText('First error')).not.toBeInTheDocument();
      });
    });
  });

  describe('Google Sign-In', () => {
    it('should call signIn with Google provider', async () => {
      const user = userEvent.setup();
      (signIn as jest.Mock).mockResolvedValueOnce(undefined);

      render(<RegisterPage />);

      const googleButton = screen.getByRole('button', { name: /google/i });
      await user.click(googleButton);

      expect(signIn).toHaveBeenCalledWith('google', { callbackUrl: '/dashboard' });
    });

    it('should show loading state during Google sign-in', async () => {
      const user = userEvent.setup();
      (signIn as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );

      render(<RegisterPage />);

      const googleButton = screen.getByRole('button', { name: /google/i });
      await user.click(googleButton);

      expect(googleButton).toBeDisabled();
      
      // Check that both buttons are disabled (submit button may have different text during loading)
      const buttons = screen.getAllByRole('button');
      const submitButton = buttons.find(btn => btn.getAttribute('type') === 'submit');
      expect(submitButton).toBeDisabled();

      await waitFor(() => {
        expect(signIn).toHaveBeenCalled();
      });
    });

    it('should handle Google sign-in error', async () => {
      const user = userEvent.setup();
      (signIn as jest.Mock).mockRejectedValueOnce(new Error('Google sign-in failed'));

      render(<RegisterPage />);

      const googleButton = screen.getByRole('button', { name: /google/i });
      await user.click(googleButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to sign in with Google')).toBeInTheDocument();
      });
    });

    it('should clear previous error when attempting Google sign-in', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Registration error' }),
      });
      (signIn as jest.Mock).mockResolvedValueOnce(undefined);

      render(<RegisterPage />);

      // First, cause a registration error
      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.selectOptions(screen.getByLabelText(/profession/i), 'Student');
      await user.type(screen.getByLabelText(/^password$/i), 'Password123!');
      await user.type(screen.getByLabelText(/confirm password/i), 'Password123!');
      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText('Registration error')).toBeInTheDocument();
      });

      // Then attempt Google sign-in
      const googleButton = screen.getByRole('button', { name: /google/i });
      await user.click(googleButton);

      await waitFor(() => {
        expect(screen.queryByText('Registration error')).not.toBeInTheDocument();
      });
    });
  });

  describe('UI Interactions', () => {
    it('should have proper input placeholders', () => {
      render(<RegisterPage />);

      expect(screen.getByPlaceholderText('Choose a username')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Create a strong password')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Confirm your password')).toBeInTheDocument();
    });

    it('should show error icon in error message', async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.selectOptions(screen.getByLabelText(/profession/i), 'Student');
      await user.type(screen.getByLabelText(/^password$/i), 'weak');
      await user.type(screen.getByLabelText(/confirm password/i), 'weak');

      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        const errorDiv = screen.getByText(/password must contain/i).closest('div');
        expect(errorDiv).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for all form fields', () => {
      render(<RegisterPage />);

      expect(screen.getByLabelText(/username/i)).toHaveAttribute('id', 'username');
      expect(screen.getByLabelText(/email address/i)).toHaveAttribute('id', 'email');
      expect(screen.getByLabelText(/profession/i)).toHaveAttribute('id', 'profession');
      expect(screen.getByLabelText(/^password$/i)).toHaveAttribute('id', 'password');
      expect(screen.getByLabelText(/confirm password/i)).toHaveAttribute('id', 'confirmPassword');
    });

    it('should have autocomplete attribute on email field', () => {
      render(<RegisterPage />);

      const emailInput = screen.getByLabelText(/email address/i);
      expect(emailInput).toHaveAttribute('autoComplete', 'email');
    });

    it('should mark required fields', () => {
      render(<RegisterPage />);

      expect(screen.getByLabelText(/username/i)).toBeRequired();
      expect(screen.getByLabelText(/email address/i)).toBeRequired();
      expect(screen.getByLabelText(/profession/i)).toBeRequired();
      expect(screen.getByLabelText(/^password$/i)).toBeRequired();
      expect(screen.getByLabelText(/confirm password/i)).toBeRequired();
    });
  });
});
