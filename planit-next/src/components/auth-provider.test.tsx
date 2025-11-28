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

  it('should handle string children', () => {
    render(<AuthProvider>Simple Text</AuthProvider>);
    expect(screen.getByText('Simple Text')).toBeInTheDocument();
  });

  it('should handle complex component tree', () => {
    render(
      <AuthProvider>
        <div>
          <span data-testid="nested-1">Level 1</span>
          <div>
            <span data-testid="nested-2">Level 2</span>
          </div>
        </div>
      </AuthProvider>
    );

    expect(screen.getByTestId('nested-1')).toBeInTheDocument();
    expect(screen.getByTestId('nested-2')).toBeInTheDocument();
  });

  it('should maintain component structure', () => {
    const { container } = render(
      <AuthProvider>
        <div className="test-class">Content</div>
      </AuthProvider>
    );

    const testDiv = container.querySelector('.test-class');
    expect(testDiv).toBeInTheDocument();
    expect(testDiv).toHaveTextContent('Content');
  });

  it('should render with React fragments', () => {
    render(
      <AuthProvider>
        <>
          <div data-testid="fragment-1">Fragment 1</div>
          <div data-testid="fragment-2">Fragment 2</div>
        </>
      </AuthProvider>
    );

    expect(screen.getByTestId('fragment-1')).toBeInTheDocument();
    expect(screen.getByTestId('fragment-2')).toBeInTheDocument();
  });

  it('should call SessionProvider exactly once', () => {
    const mockSessionProvider = SessionProvider as jest.Mock;
    mockSessionProvider.mockClear();

    render(
      <AuthProvider>
        <div>Test</div>
      </AuthProvider>
    );

    expect(mockSessionProvider).toHaveBeenCalledTimes(1);
  });

  it('should preserve child component props', () => {
    const TestComponent = ({ testProp }: { testProp: string }) => (
      <div data-testid="test-component">{testProp}</div>
    );

    render(
      <AuthProvider>
        <TestComponent testProp="test-value" />
      </AuthProvider>
    );

    expect(screen.getByTestId('test-component')).toHaveTextContent('test-value');
  });

  it('should handle conditional rendering', () => {
    const showContent = true;
    render(
      <AuthProvider>
        {showContent && <div data-testid="conditional">Conditional Content</div>}
      </AuthProvider>
    );

    expect(screen.getByTestId('conditional')).toBeInTheDocument();
  });

  it('should not throw errors during render', () => {
    expect(() => {
      render(
        <AuthProvider>
          <div>Safe Content</div>
        </AuthProvider>
      );
    }).not.toThrow();
  });

  it('should render with empty string children', () => {
    render(<AuthProvider>{''}</AuthProvider>);
    expect(screen.getByTestId('session-provider')).toBeInTheDocument();
  });

  it('should handle array of children', () => {
    render(
      <AuthProvider>
        {[
          <div key="1" data-testid="array-1">Item 1</div>,
          <div key="2" data-testid="array-2">Item 2</div>
        ]}
      </AuthProvider>
    );

    expect(screen.getByTestId('array-1')).toBeInTheDocument();
    expect(screen.getByTestId('array-2')).toBeInTheDocument();
  });
});
