import { render } from '@testing-library/react';
import RootLayout, { metadata } from './layout';

// Mock the AuthProvider component
jest.mock('@/components/auth-provider', () => {
  return function MockAuthProvider({ children }: { children: React.ReactNode }) {
    return <div data-testid="auth-provider">{children}</div>;
  };
});

// Mock next/font/google
jest.mock('next/font/google', () => ({
  Inter: () => ({ className: 'inter-font' }),
}));

describe('RootLayout', () => {
  it('should render children within the layout', () => {
    const { getByText, getByTestId } = render(
      <RootLayout>
        <div>Test Content</div>
      </RootLayout>
    );

    expect(getByText('Test Content')).toBeInTheDocument();
    expect(getByTestId('auth-provider')).toBeInTheDocument();
  });

  it('should have correct html lang attribute', () => {
    const { container } = render(
      <RootLayout>
        <div>Test</div>
      </RootLayout>
    );

    const html = container.querySelector('html');
    expect(html).toHaveAttribute('lang', 'en');
  });

  it('should apply correct body classes', () => {
    const { container } = render(
      <RootLayout>
        <div>Test</div>
      </RootLayout>
    );

    const body = container.querySelector('body');
    expect(body).toHaveClass('inter-font');
    expect(body).toHaveClass('antialiased');
    expect(body).toHaveClass('min-h-screen');
  });

  it('should have correct metadata', () => {
    expect(metadata.title).toBe('PlanIt - Task Scheduler');
    expect(metadata.description).toBe('A comprehensive task management platform');
  });
});
