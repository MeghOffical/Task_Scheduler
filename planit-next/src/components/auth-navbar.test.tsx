import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AuthNavbar from './auth-navbar';

// Mock Next.js Link component
jest.mock('next/link', () => {
  const MockLink = ({ children, href }: any) => {
    return <a href={href}>{children}</a>;
  };
  MockLink.displayName = 'Link';
  return MockLink;
});

describe('AuthNavbar Component', () => {
  it('should render Plan-it logo', () => {
    render(<AuthNavbar />);
    expect(screen.getByText('Plan-it')).toBeInTheDocument();
  });

  it('should have link to home page', () => {
    render(<AuthNavbar />);
    const link = screen.getByRole('link', { name: 'Plan-it' });
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
    const logo = screen.getByRole('link', { name: 'Plan-it' });
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('href', '/');
  });

  it('should render FAQ link', () => {
    render(<AuthNavbar />);
    const faqLink = screen.getByRole('link', { name: 'FAQs' });
    expect(faqLink).toBeInTheDocument();
    expect(faqLink).toHaveAttribute('href', '/faqs');
  });

  it('should have white text color', () => {
    render(<AuthNavbar />);
    const logo = screen.getByRole('link', { name: 'Plan-it' });
    expect(logo).toHaveClass('text-white');
  });

  it('should have hover effects on logo', () => {
    render(<AuthNavbar />);
    const logo = screen.getByRole('link', { name: 'Plan-it' });
    expect(logo).toHaveClass('hover:text-blue-100', 'transition-colors');
  });

  it('should have hover effects on FAQ link', () => {
    render(<AuthNavbar />);
    const faqLink = screen.getByRole('link', { name: 'FAQs' });
    expect(faqLink).toHaveClass('hover:text-blue-100', 'transition-colors');
  });

  it('should have proper font styling on logo', () => {
    render(<AuthNavbar />);
    const logo = screen.getByRole('link', { name: 'Plan-it' });
    expect(logo).toHaveClass('text-3xl', 'font-bold');
  });

  it('should have space between links', () => {
    const { container } = render(<AuthNavbar />);
    const linkContainer = container.querySelector('.space-x-4');
    expect(linkContainer).toBeInTheDocument();
  });

  it('should have flex layout for alignment', () => {
    const { container } = render(<AuthNavbar />);
    const innerDiv = container.querySelector('.max-w-7xl');
    expect(innerDiv).toHaveClass('flex', 'items-center', 'justify-between');
  });

  it('should render as nav element', () => {
    const { container } = render(<AuthNavbar />);
    const nav = container.querySelector('nav');
    expect(nav).toBeInTheDocument();
  });

  it('should have inline-block display for logo', () => {
    render(<AuthNavbar />);
    const logo = screen.getByRole('link', { name: 'Plan-it' });
    expect(logo).toHaveClass('inline-block');
  });

  it('should have accessible link text', () => {
    render(<AuthNavbar />);
    const links = screen.getAllByRole('link');
    links.forEach(link => {
      expect(link.textContent).toBeTruthy();
    });
  });

  it('should have proper gradient colors', () => {
    const { container } = render(<AuthNavbar />);
    const nav = container.querySelector('nav');
    expect(nav?.className).toContain('from-blue-600');
    expect(nav?.className).toContain('to-blue-500');
  });

  it('should not have any console errors', () => {
    const consoleSpy = jest.spyOn(console, 'error');
    render(<AuthNavbar />);
    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
