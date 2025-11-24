import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AuthProvider from './auth-provider';
import { SessionProvider } from 'next-auth/react';

jest.mock('next-auth/react', () => ({
  SessionProvider: jest.fn(({ children }) => <div data-testid="session-provider">{children}</div>),
}));

describe('AuthProvider Component', () => {
  it('should render children wrapped in SessionProvider', () => {
    render(
      <AuthProvider>
        <div data-testid="child-content">Test Content</div>
      </AuthProvider>
    );

    expect(screen.getByTestId('session-provider')).toBeInTheDocument();
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should pass children to SessionProvider', () => {
    const mockSessionProvider = SessionProvider as jest.Mock;
    
    render(
      <AuthProvider>
        <div>Child Component</div>
      </AuthProvider>
    );

    expect(mockSessionProvider).toHaveBeenCalled();
    expect(mockSessionProvider.mock.calls[0][0]).toHaveProperty('children');
  });

  it('should render multiple children', () => {
    render(
      <AuthProvider>
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
      </AuthProvider>
    );

    expect(screen.getByTestId('child-1')).toBeInTheDocument();
    expect(screen.getByTestId('child-2')).toBeInTheDocument();
  });

  it('should render without children', () => {
    render(<AuthProvider>{null}</AuthProvider>);
    expect(screen.getByTestId('session-provider')).toBeInTheDocument();
  });
});
