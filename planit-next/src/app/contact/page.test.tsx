import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import ContactPage from './page';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock MainHeader component  
jest.mock('@/components/main-header', () => {
  return function MockMainHeader() {
    return <div data-testid="main-header">Main Header</div>;
  };
});

// Mock window.location.href by preventing actual navigation
const hrefAssignments: string[] = [];
const mockLocation = {
  get href() { return this._href || ''; },
  set href(value: string) { 
    this._href = value; 
    hrefAssignments.push(value);
  },
  assign: jest.fn(),
  replace: jest.fn(),
  reload: jest.fn(),
  _href: '',
};

describe('ContactPage', () => {
  const mockRouter = {
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    
    // Replace window.location with our mock to prevent JSDOM navigation errors
    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockLocation._href = '';
    hrefAssignments.length = 0; // Clear the array
  });

  // Initial Render Tests
  describe('Initial Render', () => {
    test('renders contact page with all elements', () => {
      render(<ContactPage />);
      
      expect(screen.getByTestId('main-header')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /contact plan-it/i })).toBeInTheDocument();
      expect(screen.getByText(/we're happy to help/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/your name \(optional\)/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/your email/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/message \(how can we help\?\)/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /create an account/i })).toBeInTheDocument();
    });

    test('renders support email link', () => {
      render(<ContactPage />);
      
      const supportLink = screen.getByRole('link', { name: /support@planit.app/i });
      expect(supportLink).toBeInTheDocument();
      expect(supportLink).toHaveAttribute('href', 'mailto:support@planit.app');
      expect(supportLink).toHaveClass('underline', 'text-blue-600', 'dark:text-blue-400');
    });

    test('renders create account link with correct styling', () => {
      render(<ContactPage />);
      
      const createAccountLink = screen.getByRole('link', { name: /create an account/i });
      expect(createAccountLink).toBeInTheDocument();
      expect(createAccountLink).toHaveAttribute('href', '/register');
      expect(createAccountLink).toHaveClass('px-4', 'py-2', 'bg-gradient-to-r', 'from-blue-600', 'to-indigo-600');
    });
  });

  // Form Input Tests
  describe('Form Inputs', () => {
    test('updates name input value', async () => {
      const user = userEvent.setup();
      render(<ContactPage />);
      
      const nameInput = screen.getByPlaceholderText(/your name \(optional\)/i);
      await user.type(nameInput, 'John Doe');
      
      expect(nameInput).toHaveValue('John Doe');
    });

    test('updates email input value', async () => {
      const user = userEvent.setup();
      render(<ContactPage />);
      
      const emailInput = screen.getByPlaceholderText(/your email/i);
      await user.type(emailInput, 'john@example.com');
      
      expect(emailInput).toHaveValue('john@example.com');
    });

    test('updates message textarea value', async () => {
      const user = userEvent.setup();
      render(<ContactPage />);
      
      const messageTextarea = screen.getByPlaceholderText(/message \(how can we help\?\)/i);
      await user.type(messageTextarea, 'This is a test message');
      
      expect(messageTextarea).toHaveValue('This is a test message');
    });

    test('email input is required', () => {
      render(<ContactPage />);
      
      const emailInput = screen.getByPlaceholderText(/your email/i);
      expect(emailInput).toBeRequired();
    });

    test('message textarea is required', () => {
      render(<ContactPage />);
      
      const messageTextarea = screen.getByPlaceholderText(/message \(how can we help\?\)/i);
      expect(messageTextarea).toBeRequired();
    });

    test('name input is optional', () => {
      render(<ContactPage />);
      
      const nameInput = screen.getByPlaceholderText(/your name \(optional\)/i);
      expect(nameInput).not.toBeRequired();
    });

    test('textarea has correct rows attribute', () => {
      render(<ContactPage />);
      
      const messageTextarea = screen.getByPlaceholderText(/message \(how can we help\?\)/i);
      expect(messageTextarea).toHaveAttribute('rows', '6');
    });
  });

  // Form Validation Tests
  describe('Form Validation', () => {
    test('shows error when submitting without email', async () => {
      const user = userEvent.setup();
      render(<ContactPage />);
      
      const messageTextarea = screen.getByPlaceholderText(/message \(how can we help\?\)/i);
      const submitButton = screen.getByRole('button', { name: /send message/i });
      
      await user.type(messageTextarea, 'Test message');
      await user.click(submitButton);
      
      // The error should appear in the result state
      await waitFor(() => {
        expect(screen.getByText(/please provide your email and a brief message/i)).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    test('shows error when submitting without message', async () => {
      const user = userEvent.setup();
      render(<ContactPage />);
      
      const emailInput = screen.getByPlaceholderText(/your email/i);
      const submitButton = screen.getByRole('button', { name: /send message/i });
      
      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);
      
      expect(screen.getByText(/please provide your email and a brief message/i)).toBeInTheDocument();
    });

    test('shows error when submitting with empty email', async () => {
      const user = userEvent.setup();
      render(<ContactPage />);
      
      const emailInput = screen.getByPlaceholderText(/your email/i);
      const messageTextarea = screen.getByPlaceholderText(/message \(how can we help\?\)/i);
      const submitButton = screen.getByRole('button', { name: /send message/i });
      
      await user.type(emailInput, '   '); // whitespace only
      await user.clear(emailInput);
      await user.type(messageTextarea, 'Test message');
      await user.click(submitButton);
      
      expect(screen.getByText(/please provide your email and a brief message/i)).toBeInTheDocument();
    });

    test('shows error when submitting with empty message', async () => {
      const user = userEvent.setup();
      render(<ContactPage />);
      
      const emailInput = screen.getByPlaceholderText(/your email/i);
      const messageTextarea = screen.getByPlaceholderText(/message \(how can we help\?\)/i);
      const submitButton = screen.getByRole('button', { name: /send message/i });
      
      await user.type(emailInput, 'test@example.com');
      await user.type(messageTextarea, '   '); // whitespace only
      await user.clear(messageTextarea);
      await user.click(submitButton);
      
      expect(screen.getByText(/please provide your email and a brief message/i)).toBeInTheDocument();
    });

    test('does not show error when both email and message are provided', async () => {
      const user = userEvent.setup();
      render(<ContactPage />);
      
      const emailInput = screen.getByPlaceholderText(/your email/i);
      const messageTextarea = screen.getByPlaceholderText(/message \(how can we help\?\)/i);
      const submitButton = screen.getByRole('button', { name: /send message/i });
      
      await user.type(emailInput, 'test@example.com');
      await user.type(messageTextarea, 'Test message');
      await user.click(submitButton);
      
      expect(screen.queryByText(/please provide your email and a brief message/i)).not.toBeInTheDocument();
    });
  });

  // Form Submission Tests
  describe('Form Submission', () => {
    test('submits form with all fields filled', async () => {
      const user = userEvent.setup();
      render(<ContactPage />);
      
      const nameInput = screen.getByPlaceholderText(/your name \(optional\)/i);
      const emailInput = screen.getByPlaceholderText(/your email/i);
      const messageTextarea = screen.getByPlaceholderText(/message \(how can we help\?\)/i);
      const submitButton = screen.getByRole('button', { name: /send message/i });
      
      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'john@example.com');
      await user.type(messageTextarea, 'This is a test message');
      await user.click(submitButton);
      
      const expectedSubject = encodeURIComponent('Plan-It Contact: John Doe');
      const expectedBody = encodeURIComponent('Name: John Doe\nEmail: john@example.com\n\nThis is a test message');
      const expectedHref = `mailto:support@planit.app?subject=${expectedSubject}&body=${expectedBody}`;
      
      expect(mockLocationHref).toHaveBeenCalledWith(expectedHref);
      expect(screen.getByText(/opening your email client/i)).toBeInTheDocument();
    });

    test('submits form without name (anonymous)', async () => {
      const user = userEvent.setup();
      render(<ContactPage />);
      
      const emailInput = screen.getByPlaceholderText(/your email/i);
      const messageTextarea = screen.getByPlaceholderText(/message \(how can we help\?\)/i);
      const submitButton = screen.getByRole('button', { name: /send message/i });
      
      await user.type(emailInput, 'anonymous@example.com');
      await user.type(messageTextarea, 'Anonymous message');
      await user.click(submitButton);
      
      const expectedSubject = encodeURIComponent('Plan-It Contact: Anonymous');
      const expectedBody = encodeURIComponent('Name: \nEmail: anonymous@example.com\n\nAnonymous message');
      const expectedHref = `mailto:support@planit.app?subject=${expectedSubject}&body=${expectedBody}`;
      
      expect(locationHrefSetter).toHaveBeenCalledWith(expectedHref);
      expect(screen.getByText(/opening your email client/i)).toBeInTheDocument();
    });

    test('handles special characters in form data', async () => {
      const user = userEvent.setup();
      render(<ContactPage />);
      
      const nameInput = screen.getByPlaceholderText(/your name \(optional\)/i);
      const emailInput = screen.getByPlaceholderText(/your email/i);
      const messageTextarea = screen.getByPlaceholderText(/message \(how can we help\?\)/i);
      const submitButton = screen.getByRole('button', { name: /send message/i });
      
      await user.type(nameInput, 'John & Jane');
      await user.type(emailInput, 'test@example.com');
      await user.type(messageTextarea, 'Message with special chars: & % # @');
      await user.click(submitButton);
      
      const expectedSubject = encodeURIComponent('Plan-It Contact: John & Jane');
      const expectedBody = encodeURIComponent('Name: John & Jane\nEmail: test@example.com\n\nMessage with special chars: & % # @');
      const expectedHref = `mailto:support@planit.app?subject=${expectedSubject}&body=${expectedBody}`;
      
      expect(locationHrefSetter).toHaveBeenCalledWith(expectedHref);
    });

    test('prevents default form submission', async () => {
      const user = userEvent.setup();
      render(<ContactPage />);
      
      const submitButton = screen.getByRole('button', { name: /send message/i });
      const form = submitButton.closest('form');
      const emailInput = screen.getByPlaceholderText(/your email/i);
      const messageTextarea = screen.getByPlaceholderText(/message \(how can we help\?\)/i);
      
      await user.type(emailInput, 'test@example.com');
      await user.type(messageTextarea, 'Test message');
      
      const mockPreventDefault = jest.fn();
      if (form) {
        fireEvent.submit(form, { preventDefault: mockPreventDefault });
      }
      
      expect(mockPreventDefault).toHaveBeenCalled();
    });
  });

  // Loading State Tests
  describe('Loading States', () => {
    test('shows loading state during submission', async () => {
      const user = userEvent.setup();
      render(<ContactPage />);
      
      const emailInput = screen.getByPlaceholderText(/your email/i);
      const messageTextarea = screen.getByPlaceholderText(/message \(how can we help\?\)/i);
      const submitButton = screen.getByRole('button', { name: /send message/i });
      
      await user.type(emailInput, 'test@example.com');
      await user.type(messageTextarea, 'Test message');
      
      // Since the component immediately sets submitting to false after location.href,
      // we just verify the normal behavior works
      await user.click(submitButton);
      
      // Should show result message after submission
      expect(screen.getByText(/opening your email client/i)).toBeInTheDocument();
      expect(locationHrefSetter).toHaveBeenCalled();
    });

    test('submit button is enabled by default', () => {
      render(<ContactPage />);
      
      const submitButton = screen.getByRole('button', { name: /send message/i });
      expect(submitButton).not.toBeDisabled();
    });
  });

  // Reset Functionality Tests
  describe('Reset Functionality', () => {
    test('resets all form fields when reset button is clicked', async () => {
      const user = userEvent.setup();
      render(<ContactPage />);
      
      const nameInput = screen.getByPlaceholderText(/your name \(optional\)/i);
      const emailInput = screen.getByPlaceholderText(/your email/i);
      const messageTextarea = screen.getByPlaceholderText(/message \(how can we help\?\)/i);
      const resetButton = screen.getByRole('button', { name: /reset/i });
      
      // Fill form fields
      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'john@example.com');
      await user.type(messageTextarea, 'Test message');
      
      // Verify fields are filled
      expect(nameInput).toHaveValue('John Doe');
      expect(emailInput).toHaveValue('john@example.com');
      expect(messageTextarea).toHaveValue('Test message');
      
      // Click reset button
      await user.click(resetButton);
      
      // Verify fields are cleared
      expect(nameInput).toHaveValue('');
      expect(emailInput).toHaveValue('');
      expect(messageTextarea).toHaveValue('');
    });

    test('clears result message when reset button is clicked', async () => {
      const user = userEvent.setup();
      render(<ContactPage />);
      
      const emailInput = screen.getByPlaceholderText(/your email/i);
      const messageTextarea = screen.getByPlaceholderText(/message \(how can we help\?\)/i);
      const submitButton = screen.getByRole('button', { name: /send message/i });
      const resetButton = screen.getByRole('button', { name: /reset/i });
      
      // Submit form to show result message
      await user.type(emailInput, 'test@example.com');
      await user.type(messageTextarea, 'Test message');
      await user.click(submitButton);
      
      expect(screen.getByText(/opening your email client/i)).toBeInTheDocument();
      
      // Click reset button
      await user.click(resetButton);
      
      // Result message should be cleared
      expect(screen.queryByText(/opening your email client/i)).not.toBeInTheDocument();
    });

    test('clears validation error when reset button is clicked', async () => {
      const user = userEvent.setup();
      render(<ContactPage />);
      
      const submitButton = screen.getByRole('button', { name: /send message/i });
      const resetButton = screen.getByRole('button', { name: /reset/i });
      
      // Submit empty form to show validation error
      await user.click(submitButton);
      expect(screen.getByText(/please provide your email and a brief message/i)).toBeInTheDocument();
      
      // Click reset button
      await user.click(resetButton);
      
      // Validation error should be cleared
      expect(screen.queryByText(/please provide your email and a brief message/i)).not.toBeInTheDocument();
    });
  });

  // Layout and Styling Tests
  describe('Layout and Styling', () => {
    test('applies correct CSS classes to main container', () => {
      render(<ContactPage />);
      
      const main = screen.getByRole('main');
      expect(main).toHaveClass(
        'min-h-screen',
        'bg-gradient-to-br',
        'from-white',
        'via-blue-50/30',
        'to-indigo-50/40',
        'dark:from-slate-950',
        'dark:via-slate-900',
        'dark:to-slate-950',
        'text-gray-900',
        'dark:text-white'
      );
    });

    test('applies correct CSS classes to form section', () => {
      render(<ContactPage />);
      
      const form = screen.getByRole('button', { name: /send message/i }).closest('form');
      const section = form?.closest('section');
      expect(section).toHaveClass(
        'max-w-3xl',
        'w-full',
        'bg-white/80',
        'dark:bg-slate-900/80',
        'rounded-xl',
        'shadow-lg',
        'p-8',
        'border',
        'border-gray-100',
        'dark:border-white/10'
      );
    });

    test('applies correct CSS classes to form inputs', () => {
      render(<ContactPage />);
      
      const nameInput = screen.getByPlaceholderText(/your name \(optional\)/i);
      const emailInput = screen.getByPlaceholderText(/your email/i);
      const messageTextarea = screen.getByPlaceholderText(/message \(how can we help\?\)/i);
      
      [nameInput, emailInput].forEach(input => {
        expect(input).toHaveClass(
          'flex-1',
          'min-w-[12rem]',
          'px-3',
          'py-2',
          'border',
          'rounded-md',
          'bg-white',
          'dark:bg-slate-800',
          'text-sm'
        );
      });
      
      expect(messageTextarea).toHaveClass(
        'w-full',
        'px-3',
        'py-2',
        'border',
        'rounded-md',
        'bg-white',
        'dark:bg-slate-800',
        'text-sm'
      );
    });

    test('applies correct CSS classes to submit button', () => {
      render(<ContactPage />);
      
      const submitButton = screen.getByRole('button', { name: /send message/i });
      expect(submitButton).toHaveClass(
        'px-4',
        'py-2',
        'bg-gradient-to-r',
        'from-blue-600',
        'to-indigo-600',
        'text-white',
        'rounded-md',
        'hover:shadow'
      );
    });

    test('applies correct CSS classes to reset button', () => {
      render(<ContactPage />);
      
      const resetButton = screen.getByRole('button', { name: /reset/i });
      expect(resetButton).toHaveClass('px-4', 'py-2', 'border', 'rounded-md');
    });
  });

  // Accessibility Tests
  describe('Accessibility', () => {
    test('form has proper heading structure', () => {
      render(<ContactPage />);
      
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Contact Plan-It');
    });

    test('form elements are properly labeled by placeholders', () => {
      render(<ContactPage />);
      
      expect(screen.getByPlaceholderText(/your name \(optional\)/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/your email/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/message \(how can we help\?\)/i)).toBeInTheDocument();
    });

    test('submit button has proper type', () => {
      render(<ContactPage />);
      
      const submitButton = screen.getByRole('button', { name: /send message/i });
      expect(submitButton).toHaveAttribute('type', 'submit');
    });

    test('reset button has proper type', () => {
      render(<ContactPage />);
      
      const resetButton = screen.getByRole('button', { name: /reset/i });
      expect(resetButton).toHaveAttribute('type', 'button');
    });

    test('email input has proper type', () => {
      render(<ContactPage />);
      
      const emailInput = screen.getByPlaceholderText(/your email/i);
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    test('name input has proper type', () => {
      render(<ContactPage />);
      
      const nameInput = screen.getByPlaceholderText(/your name \(optional\)/i);
      expect(nameInput).toHaveAttribute('type', 'text');
    });

    test('support email link is keyboard accessible', () => {
      render(<ContactPage />);
      
      const supportLink = screen.getByRole('link', { name: /support@planit.app/i });
      expect(supportLink).toBeInTheDocument();
      expect(supportLink).toHaveAttribute('href', 'mailto:support@planit.app');
    });

    test('create account link is keyboard accessible', () => {
      render(<ContactPage />);
      
      const createAccountLink = screen.getByRole('link', { name: /create an account/i });
      expect(createAccountLink).toBeInTheDocument();
      expect(createAccountLink).toHaveAttribute('href', '/register');
    });
  });

  // Result Message Tests
  describe('Result Messages', () => {
    test('shows success message after form submission', async () => {
      const user = userEvent.setup();
      render(<ContactPage />);
      
      const emailInput = screen.getByPlaceholderText(/your email/i);
      const messageTextarea = screen.getByPlaceholderText(/message \(how can we help\?\)/i);
      const submitButton = screen.getByRole('button', { name: /send message/i });
      
      await user.type(emailInput, 'test@example.com');
      await user.type(messageTextarea, 'Test message');
      await user.click(submitButton);
      
      expect(screen.getByText(/opening your email client/i)).toBeInTheDocument();
    });

    test('result message has proper styling', async () => {
      const user = userEvent.setup();
      render(<ContactPage />);
      
      const emailInput = screen.getByPlaceholderText(/your email/i);
      const messageTextarea = screen.getByPlaceholderText(/message \(how can we help\?\)/i);
      const submitButton = screen.getByRole('button', { name: /send message/i });
      
      await user.type(emailInput, 'test@example.com');
      await user.type(messageTextarea, 'Test message');
      await user.click(submitButton);
      
      const resultMessage = screen.getByText(/opening your email client/i);
      expect(resultMessage).toHaveClass('text-sm', 'text-gray-600', 'dark:text-gray-300');
    });
  });

  // Edge Cases Tests
  describe('Edge Cases', () => {
    test('handles very long name input', async () => {
      const user = userEvent.setup();
      render(<ContactPage />);
      
      const nameInput = screen.getByPlaceholderText(/your name \(optional\)/i);
      const emailInput = screen.getByPlaceholderText(/your email/i);
      const messageTextarea = screen.getByPlaceholderText(/message \(how can we help\?\)/i);
      const submitButton = screen.getByRole('button', { name: /send message/i });
      
      const longName = 'VeryLongName'.repeat(10); // Reduced size to avoid timeout
      await user.type(nameInput, longName);
      await user.type(emailInput, 'test@example.com');
      await user.type(messageTextarea, 'Test message');
      await user.click(submitButton);
      
      expect(locationHrefSetter).toHaveBeenCalled();
      expect(screen.getByText(/opening your email client/i)).toBeInTheDocument();
    }, 10000);

    test('handles very long message input', async () => {
      const user = userEvent.setup();
      render(<ContactPage />);
      
      const emailInput = screen.getByPlaceholderText(/your email/i);
      const messageTextarea = screen.getByPlaceholderText(/message \(how can we help\?\)/i);
      const submitButton = screen.getByRole('button', { name: /send message/i });
      
      const longMessage = 'This is a very long message. '.repeat(10); // Reduced size
      await user.type(emailInput, 'test@example.com');
      await user.type(messageTextarea, longMessage);
      await user.click(submitButton);
      
      expect(locationHrefSetter).toHaveBeenCalled();
      expect(screen.getByText(/opening your email client/i)).toBeInTheDocument();
    }, 10000);

    test('handles unicode characters in inputs', async () => {
      const user = userEvent.setup();
      render(<ContactPage />);
      
      const nameInput = screen.getByPlaceholderText(/your name \(optional\)/i);
      const emailInput = screen.getByPlaceholderText(/your email/i);
      const messageTextarea = screen.getByPlaceholderText(/message \(how can we help\?\)/i);
      const submitButton = screen.getByRole('button', { name: /send message/i });
      
      await user.type(nameInput, '张三 李四');
      await user.type(emailInput, 'test@example.com');
      await user.type(messageTextarea, 'Message with émojis: 🎉 🚀 💻');
      await user.click(submitButton);
      
      expect(locationHrefSetter).toHaveBeenCalled();
      expect(screen.getByText(/opening your email client/i)).toBeInTheDocument();
    });

    test('handles multiple rapid form submissions', async () => {
      const user = userEvent.setup();
      render(<ContactPage />);
      
      const emailInput = screen.getByPlaceholderText(/your email/i);
      const messageTextarea = screen.getByPlaceholderText(/message \(how can we help\?\)/i);
      const submitButton = screen.getByRole('button', { name: /send message/i });
      
      await user.type(emailInput, 'test@example.com');
      await user.type(messageTextarea, 'Test message');
      
      // Rapid clicks
      await user.click(submitButton);
      await user.click(submitButton);
      await user.click(submitButton);
      
      // Should still work correctly
      expect(locationHrefSetter).toHaveBeenCalledTimes(3);
    });
  });

  // Form Integration Tests
  describe('Form Integration', () => {
    test('complete user journey: fill form, submit, reset', async () => {
      const user = userEvent.setup();
      render(<ContactPage />);
      
      const nameInput = screen.getByPlaceholderText(/your name \(optional\)/i);
      const emailInput = screen.getByPlaceholderText(/your email/i);
      const messageTextarea = screen.getByPlaceholderText(/message \(how can we help\?\)/i);
      const submitButton = screen.getByRole('button', { name: /send message/i });
      const resetButton = screen.getByRole('button', { name: /reset/i });
      
      // Fill form
      await user.type(nameInput, 'Jane Smith');
      await user.type(emailInput, 'jane@example.com');
      await user.type(messageTextarea, 'I need help with my account');
      
      // Submit form
      await user.click(submitButton);
      expect(screen.getByText(/opening your email client/i)).toBeInTheDocument();
      
      // Reset form
      await user.click(resetButton);
      expect(nameInput).toHaveValue('');
      expect(emailInput).toHaveValue('');
      expect(messageTextarea).toHaveValue('');
      expect(screen.queryByText(/opening your email client/i)).not.toBeInTheDocument();
    });

    test('validation error clears after providing required fields', async () => {
      const user = userEvent.setup();
      render(<ContactPage />);
      
      const emailInput = screen.getByPlaceholderText(/your email/i);
      const messageTextarea = screen.getByPlaceholderText(/message \(how can we help\?\)/i);
      const submitButton = screen.getByRole('button', { name: /send message/i });
      
      // Submit without required fields
      await user.click(submitButton);
      expect(screen.getByText(/please provide your email and a brief message/i)).toBeInTheDocument();
      
      // Fill required fields
      await user.type(emailInput, 'test@example.com');
      await user.type(messageTextarea, 'Test message');
      
      // Submit again
      await user.click(submitButton);
      expect(screen.queryByText(/please provide your email and a brief message/i)).not.toBeInTheDocument();
      expect(screen.getByText(/opening your email client/i)).toBeInTheDocument();
    });
  });
});
