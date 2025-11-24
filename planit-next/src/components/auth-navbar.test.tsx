import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AuthNavbar from './auth-navbar';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: any) => {
    return <a href={href}>{children}</a>;
  };
});

describe('AuthNavbar Component', () => {
  it('should render Plan-it logo', () => {
    render(<AuthNavbar />);
    expect(screen.getByText('Plan-it')).toBeInTheDocument();
  });

  it('should have link to home page', () => {
    render(<AuthNavbar />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/');
  });

  it('should apply gradient background', () => {
    const { container } = render(<AuthNavbar />);
    const nav = container.querySelector('nav');
    expect(nav).toHaveClass('bg-gradient-to-r', 'from-blue-600', 'to-blue-500');
  });

  it('should have shadow styling', () => {
    const { container } = render(<AuthNavbar />);
    const nav = container.querySelector('nav');
    expect(nav).toHaveClass('shadow-md');
  });

  it('should have proper padding', () => {
    const { container } = render(<AuthNavbar />);
    const innerDiv = container.querySelector('.max-w-7xl');
    expect(innerDiv).toHaveClass('py-6');
  });

  it('should have responsive container', () => {
    const { container } = render(<AuthNavbar />);
    const innerDiv = container.querySelector('.max-w-7xl');
    expect(innerDiv).toHaveClass('max-w-7xl', 'mx-auto', 'px-4', 'sm:px-6', 'lg:px-8');
  });

  it('should apply text styling to logo', () => {
    render(<AuthNavbar />);
    const logo = screen.getByText('Plan-it');
    expect(logo).toHaveClass('text-3xl', 'font-bold', 'text-white');
  });

  it('should have hover effect on logo', () => {
    render(<AuthNavbar />);
    const logo = screen.getByText('Plan-it');
    expect(logo).toHaveClass('hover:text-blue-100');
  });

  it('should have transition effect', () => {
    render(<AuthNavbar />);
    const logo = screen.getByText('Plan-it');
    expect(logo).toHaveClass('transition-colors');
  });
});
