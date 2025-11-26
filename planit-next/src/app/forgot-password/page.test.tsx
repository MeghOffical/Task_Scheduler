/**
 * Unit tests for forgot password page
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ForgotPasswordPage from './page';

// Mock fetch
global.fetch = jest.fn();

describe('Forgot Password Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  it('should render forgot password form', () => {
    render(<ForgotPasswordPage />);
    
    expect(screen.getByText(/forgot password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it('should have email input field', () => {
    render(<ForgotPasswordPage />);
    
    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
    expect(emailInput).toHaveAttribute('type', 'email');
  });

  it('should update email input value on change', () => {
    render(<ForgotPasswordPage />);
    
    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    
    expect(emailInput.value).toBe('test@example.com');
  });

  it('should show error for empty email on submit', async () => {
    render(<ForgotPasswordPage />);
    
    const submitButton = screen.getByRole('button', { name: /send reset link/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/please enter your email/i)).toBeInTheDocument();
    });
  });

  it('should validate email format', async () => {
    render(<ForgotPasswordPage />);
    
    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { value: 'invalidemail' } });
    
    const submitButton = screen.getByRole('button', { name: /send reset link/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument();
    });
  });

  it('should have link back to login page', () => {
    render(<ForgotPasswordPage />);
    
    const loginLink = screen.getByText(/back to login/i);
    expect(loginLink).toBeInTheDocument();
  });
});
