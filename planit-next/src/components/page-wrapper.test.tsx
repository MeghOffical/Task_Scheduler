import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PageWrapper from './page-wrapper';

// Mock dependencies
jest.mock('@/components/dashboard-layout', () => {
  return function MockDashboardLayout({ children }: any) {
    return <div data-testid="dashboard-layout">{children}</div>;
  };
});

jest.mock('@/components/grid-background', () => {
  return function MockGridBackground({ children }: any) {
    return <div data-testid="grid-background">{children}</div>;
  };
});

describe('PageWrapper Component', () => {
  describe('with dashboard layout', () => {
    it('should render children with dashboard layout by default', () => {
      render(
        <PageWrapper>
          <div data-testid="test-content">Test Content</div>
        </PageWrapper>
      );

      expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
      expect(screen.getByTestId('grid-background')).toBeInTheDocument();
      expect(screen.getByTestId('test-content')).toBeInTheDocument();
    });

    it('should render with dashboard layout when useDashboardLayout is true', () => {
      render(
        <PageWrapper useDashboardLayout={true}>
          <div data-testid="test-content">Test Content</div>
        </PageWrapper>
      );

      expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
      expect(screen.getByTestId('grid-background')).toBeInTheDocument();
      expect(screen.getByTestId('test-content')).toBeInTheDocument();
    });
  });

  describe('without dashboard layout', () => {
    it('should render children without dashboard layout when useDashboardLayout is false', () => {
      render(
        <PageWrapper useDashboardLayout={false}>
          <div data-testid="test-content">Test Content</div>
        </PageWrapper>
      );

      expect(screen.queryByTestId('dashboard-layout')).not.toBeInTheDocument();
      expect(screen.getByTestId('grid-background')).toBeInTheDocument();
      expect(screen.getByTestId('test-content')).toBeInTheDocument();
    });
  });

  describe('children rendering', () => {
    it('should render multiple children', () => {
      render(
        <PageWrapper>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
        </PageWrapper>
      );

      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
    });

    it('should handle text content', () => {
      render(
        <PageWrapper>
          Plain text content
        </PageWrapper>
      );

      expect(screen.getByText('Plain text content')).toBeInTheDocument();
    });

    it('should handle null children', () => {
      render(<PageWrapper>{null}</PageWrapper>);
      expect(screen.getByTestId('grid-background')).toBeInTheDocument();
    });
  });

  describe('layout nesting', () => {
    it('should nest grid background inside dashboard layout when enabled', () => {
      const { container } = render(
        <PageWrapper useDashboardLayout={true}>
          <div>Content</div>
        </PageWrapper>
      );

      const dashboardLayout = screen.getByTestId('dashboard-layout');
      const gridBackground = screen.getByTestId('grid-background');
      
      expect(dashboardLayout.contains(gridBackground)).toBe(true);
    });

    it('should render only grid background when dashboard layout disabled', () => {
      const { container } = render(
        <PageWrapper useDashboardLayout={false}>
          <div>Content</div>
        </PageWrapper>
      );

      expect(screen.queryByTestId('dashboard-layout')).not.toBeInTheDocument();
      expect(screen.getByTestId('grid-background')).toBeInTheDocument();
    });
  });
});
