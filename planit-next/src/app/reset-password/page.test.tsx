/**
 * Unit tests for reset password page
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ResetPasswordPage from './page';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => ({
    get: jest.fn((key: string) => (key === 'token' ? 'mock-token-123' : null)),
  }),
}));

// Mock fetch
global.fetch = jest.fn();

describe('Reset Password Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  it('should render reset password form', () => {
    render(<ResetPasswordPage />);
    
    expect(screen.getByText(/reset password/i)).toBeInTheDocument();
  });

  it('should have password and confirm password fields', () => {
    render(<ResetPasswordPage />);
    
    const passwordInputs = screen.getAllByLabelText(/password/i);
    expect(passwordInputs).toHaveLength(2);
  });

  it('should update password input values on change', () => {
    render(<ResetPasswordPage />);
    
    const passwordInputs = screen.getAllByLabelText(/password/i) as HTMLInputElement[];
    
    fireEvent.change(passwordInputs[0], { target: { value: 'newpassword123' } });
    fireEvent.change(passwordInputs[1], { target: { value: 'newpassword123' } });
    
    expect(passwordInputs[0].value).toBe('newpassword123');
    expect(passwordInputs[1].value).toBe('newpassword123');
  });

  it('should show error when passwords do not match', async () => {
    render(<ResetPasswordPage />);
    
    const passwordInputs = screen.getAllByLabelText(/password/i);
    
    fireEvent.change(passwordInputs[0], { target: { value: 'password123' } });
    fireEvent.change(passwordInputs[1], { target: { value: 'differentpassword' } });
    
    const submitButton = screen.getByRole('button', { name: /reset password/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  it('should show error for empty fields on submit', async () => {
    render(<ResetPasswordPage />);
    
    const submitButton = screen.getByRole('button', { name: /reset password/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/please fill in all fields/i)).toBeInTheDocument();
    });
  });
});
