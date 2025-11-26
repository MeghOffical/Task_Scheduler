/**
 * Unit tests for landing page
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Home from './page';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    pathname: '/',
  })),
}));

// Mock auth-provider
jest.mock('@/components/auth-provider', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock landing-content component
jest.mock('@/components/landing-content', () => ({
  __esModule: true,
  default: () => <div data-testid="landing-content">Landing Content</div>,
}));

describe('Home (Landing) Page', () => {
  it('should render without crashing', () => {
    render(<Home />);
    expect(screen.getByTestId('landing-content')).toBeInTheDocument();
  });

  it('should render landing content component', () => {
    render(<Home />);
    expect(screen.getByText('Landing Content')).toBeInTheDocument();
  });
});
