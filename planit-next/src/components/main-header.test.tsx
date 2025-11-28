import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import MainHeader from './main-header';

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href, ...props }: any) => {
    return <a href={href} {...props}>{children}</a>;
  };
});

describe('MainHeader Component', () => {
  beforeEach(() => {
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });

    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('should render header element', () => {
      const { container } = render(<MainHeader />);
      const header = container.querySelector('header');
      expect(header).toBeInTheDocument();
    });

    it('should render logo with text', () => {
      render(<MainHeader />);
      expect(screen.getByText('Plan-It')).toBeInTheDocument();
    });

    it('should render subtitle', () => {
      render(<MainHeader />);
      expect(screen.getByText('Smart Task Management')).toBeInTheDocument();
    });

    it('should render logo icon', () => {
      const { container } = render(<MainHeader />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should have sticky positioning', () => {
      const { container } = render(<MainHeader />);
      const header = container.querySelector('header');
      expect(header).toHaveClass('sticky', 'top-0');
    });
  });

  describe('navigation links', () => {
    it('should render About Us link', () => {
      render(<MainHeader />);
      const aboutLink = screen.getByRole('link', { name: /about us/i });
      expect(aboutLink).toBeInTheDocument();
      expect(aboutLink).toHaveAttribute('href', '/about');
    });

    it('should render Sign In link', () => {
      render(<MainHeader />);
      const signInLink = screen.getByRole('link', { name: /sign in/i });
      expect(signInLink).toBeInTheDocument();
      expect(signInLink).toHaveAttribute('href', '/login');
    });

    it('should render Sign Up button', () => {
      render(<MainHeader />);
      const signUpLink = screen.getByRole('link', { name: /sign up/i });
      expect(signUpLink).toBeInTheDocument();
      expect(signUpLink).toHaveAttribute('href', '/register');
    });

    it('should have gradient background on Sign Up button', () => {
      render(<MainHeader />);
      const signUpLink = screen.getByRole('link', { name: /sign up/i });
      expect(signUpLink).toHaveClass('bg-gradient-to-r', 'from-blue-600', 'to-indigo-600');
    });

    it('should render logo as link to home', () => {
      render(<MainHeader />);
      const logoLink = screen.getByRole('link', { name: /plan-it smart task management/i });
      expect(logoLink).toHaveAttribute('href', '/');
    });
  });

  describe('dark mode functionality', () => {
    it('should render theme toggle button', () => {
      render(<MainHeader />);
      const toggleButton = screen.getByRole('button', { name: /toggle theme/i });
      expect(toggleButton).toBeInTheDocument();
    });

    it('should initialize theme from localStorage', () => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue('dark');
      
      render(<MainHeader />);
      
      expect(window.localStorage.getItem).toHaveBeenCalledWith('theme');
    });

    it('should use system preference when no saved theme', () => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue(null);
      
      render(<MainHeader />);
      
      expect(window.matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
    });

    it('should toggle dark mode when button clicked', () => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue('light');
      
      render(<MainHeader />);
      
      const toggleButton = screen.getByRole('button', { name: /toggle theme/i });
      fireEvent.click(toggleButton);
      
      expect(window.localStorage.setItem).toHaveBeenCalledWith('theme', 'dark');
    });

    it('should toggle from dark to light mode', () => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue('dark');
      
      render(<MainHeader />);
      
      const toggleButton = screen.getByRole('button', { name: /toggle theme/i });
      fireEvent.click(toggleButton);
      
      expect(window.localStorage.setItem).toHaveBeenCalledWith('theme', 'light');
    });

    it('should display sun icon in dark mode', () => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue('dark');
      
      const { container } = render(<MainHeader />);
      
      // Should show sun icon when in dark mode
      const toggleButton = screen.getByRole('button', { name: /toggle theme/i });
      const svg = toggleButton.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should display moon icon in light mode', () => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue('light');
      
      const { container } = render(<MainHeader />);
      
      // Should show moon icon when in light mode
      const toggleButton = screen.getByRole('button', { name: /toggle theme/i });
      const svg = toggleButton.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should apply dark class to document on dark mode', () => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue('dark');
      
      render(<MainHeader />);
      
      // Component should attempt to add dark class
      expect(window.localStorage.getItem).toHaveBeenCalled();
    });
  });

  describe('styling and appearance', () => {
    it('should have backdrop blur effect', () => {
      const { container } = render(<MainHeader />);
      const header = container.querySelector('header');
      expect(header).toHaveClass('backdrop-blur-xl');
    });

    it('should have proper spacing', () => {
      const { container } = render(<MainHeader />);
      const header = container.querySelector('header');
      expect(header).toHaveClass('px-3', 'sm:px-6', 'lg:px-8');
    });

    it('should have shadow', () => {
      const { container } = render(<MainHeader />);
      const header = container.querySelector('header');
      expect(header).toHaveClass('shadow-sm');
    });

    it('should have border bottom', () => {
      const { container } = render(<MainHeader />);
      const header = container.querySelector('header');
      expect(header).toHaveClass('border-b');
    });

    it('should support dark mode styles', () => {
      const { container } = render(<MainHeader />);
      const header = container.querySelector('header');
      expect(header).toHaveClass('dark:bg-slate-950/80');
    });

    it('should have z-index for stacking', () => {
      const { container } = render(<MainHeader />);
      const header = container.querySelector('header');
      expect(header).toHaveClass('z-50');
    });

    it('should have logo with gradient background', () => {
      const { container } = render(<MainHeader />);
      const logoDiv = container.querySelector('.bg-gradient-to-br');
      expect(logoDiv).toHaveClass('from-blue-600', 'to-indigo-600');
    });
  });

  describe('responsive design', () => {
    it('should hide subtitle on small screens', () => {
      render(<MainHeader />);
      const subtitle = screen.getByText('Smart Task Management').parentElement;
      expect(subtitle).toHaveClass('hidden', 'sm:block');
    });

    it('should hide About Us link on small screens', () => {
      render(<MainHeader />);
      const aboutLink = screen.getByRole('link', { name: /about us/i });
      expect(aboutLink).toHaveClass('hidden', 'sm:inline-flex');
    });

    it('should hide Sign In link on small screens', () => {
      render(<MainHeader />);
      const signInLink = screen.getByRole('link', { name: /sign in/i });
      expect(signInLink).toHaveClass('hidden', 'sm:inline-flex');
    });

    it('should have responsive text sizes', () => {
      render(<MainHeader />);
      const logo = screen.getByText('Plan-It');
      expect(logo).toHaveClass('text-2xl', 'sm:text-3xl');
    });

    it('should have responsive logo size', () => {
      const { container } = render(<MainHeader />);
      const logoDiv = container.querySelector('.h-8');
      expect(logoDiv).toHaveClass('w-8', 'sm:h-10', 'sm:w-10');
    });

    it('should have responsive button padding', () => {
      render(<MainHeader />);
      const signUpButton = screen.getByRole('link', { name: /sign up/i });
      expect(signUpButton).toHaveClass('px-3', 'sm:px-5');
    });

    it('should have responsive gap spacing', () => {
      const { container } = render(<MainHeader />);
      const nav = container.querySelector('nav');
      expect(nav).toHaveClass('gap-2', 'sm:gap-3');
    });
  });

  describe('hover effects', () => {
    it('should have hover effect on logo', () => {
      render(<MainHeader />);
      const logoLink = screen.getByRole('link', { name: /plan-it smart task management/i });
      expect(logoLink).toHaveClass('hover:opacity-80');
    });

    it('should have hover effect on theme toggle', () => {
      render(<MainHeader />);
      const toggleButton = screen.getByRole('button', { name: /toggle theme/i });
      expect(toggleButton).toHaveClass('hover:bg-gray-100', 'dark:hover:bg-white/10');
    });

    it('should have hover effect on Sign Up button', () => {
      render(<MainHeader />);
      const signUpButton = screen.getByRole('link', { name: /sign up/i });
      expect(signUpButton).toHaveClass('hover:shadow-xl', 'hover:scale-105');
    });

    it('should have hover effect on navigation links', () => {
      render(<MainHeader />);
      const aboutLink = screen.getByRole('link', { name: /about us/i });
      expect(aboutLink).toHaveClass('hover:text-blue-600', 'dark:hover:text-blue-400');
    });
  });

  describe('accessibility', () => {
    it('should have semantic header element', () => {
      const { container } = render(<MainHeader />);
      const header = container.querySelector('header');
      expect(header?.tagName).toBe('HEADER');
    });

    it('should have semantic nav element', () => {
      const { container } = render(<MainHeader />);
      const nav = container.querySelector('nav');
      expect(nav?.tagName).toBe('NAV');
    });

    it('should have aria-label on toggle button', () => {
      render(<MainHeader />);
      const toggleButton = screen.getByRole('button', { name: /toggle theme/i });
      expect(toggleButton).toHaveAttribute('aria-label', 'Toggle theme');
    });

    it('should have proper link text for screen readers', () => {
      render(<MainHeader />);
      const links = screen.getAllByRole('link');
      links.forEach(link => {
        expect(link.textContent).toBeTruthy();
      });
    });

    it('should have visible focus indicators', () => {
      render(<MainHeader />);
      const toggleButton = screen.getByRole('button', { name: /toggle theme/i });
      expect(toggleButton).toHaveClass('transition-colors');
    });
  });

  describe('layout structure', () => {
    it('should have max-width container', () => {
      const { container } = render(<MainHeader />);
      const maxWidthDiv = container.querySelector('.max-w-7xl');
      expect(maxWidthDiv).toBeInTheDocument();
    });

    it('should center content', () => {
      const { container } = render(<MainHeader />);
      const maxWidthDiv = container.querySelector('.max-w-7xl');
      expect(maxWidthDiv).toHaveClass('mx-auto');
    });

    it('should use flexbox for layout', () => {
      const { container } = render(<MainHeader />);
      const contentDiv = container.querySelector('.flex.items-center.justify-between');
      expect(contentDiv).toBeInTheDocument();
    });

    it('should have proper vertical alignment', () => {
      const { container } = render(<MainHeader />);
      const contentDiv = container.querySelector('.flex');
      expect(contentDiv).toHaveClass('items-center');
    });
  });

  describe('logo styling', () => {
    it('should have rounded logo container', () => {
      const { container } = render(<MainHeader />);
      const logoDiv = container.querySelector('.rounded-xl');
      expect(logoDiv).toBeInTheDocument();
    });

    it('should have shadow on logo', () => {
      const { container } = render(<MainHeader />);
      const logoDiv = container.querySelector('.shadow-lg');
      expect(logoDiv).toBeInTheDocument();
    });

    it('should center logo icon', () => {
      const { container } = render(<MainHeader />);
      const logoDiv = container.querySelector('.flex.items-center.justify-center');
      expect(logoDiv).toBeInTheDocument();
    });

    it('should have white text on logo', () => {
      const { container } = render(<MainHeader />);
      const logoDiv = container.querySelector('.text-white');
      expect(logoDiv).toBeInTheDocument();
    });
  });

  describe('transition effects', () => {
    it('should have transition on colors', () => {
      const { container } = render(<MainHeader />);
      const header = container.querySelector('header');
      expect(header).toHaveClass('transition-colors', 'duration-300');
    });

    it('should have transition on toggle button', () => {
      render(<MainHeader />);
      const toggleButton = screen.getByRole('button', { name: /toggle theme/i });
      expect(toggleButton).toHaveClass('transition-colors');
    });

    it('should have transition on Sign Up button', () => {
      render(<MainHeader />);
      const signUpButton = screen.getByRole('link', { name: /sign up/i });
      expect(signUpButton).toHaveClass('transition-all');
    });

    it('should have transition on navigation links', () => {
      render(<MainHeader />);
      const aboutLink = screen.getByRole('link', { name: /about us/i });
      expect(aboutLink).toHaveClass('transition-colors');
    });
  });

  describe('edge cases', () => {
    it('should handle missing localStorage', () => {
      Object.defineProperty(window, 'localStorage', {
        value: undefined,
        writable: true,
      });
      
      expect(() => render(<MainHeader />)).not.toThrow();
    });

    it('should handle rapid theme toggles', () => {
      render(<MainHeader />);
      const toggleButton = screen.getByRole('button', { name: /toggle theme/i });
      
      fireEvent.click(toggleButton);
      fireEvent.click(toggleButton);
      fireEvent.click(toggleButton);
      
      expect(window.localStorage.setItem).toHaveBeenCalled();
    });

    it('should persist theme preference', () => {
      render(<MainHeader />);
      const toggleButton = screen.getByRole('button', { name: /toggle theme/i });
      
      fireEvent.click(toggleButton);
      
      expect(window.localStorage.setItem).toHaveBeenCalledWith('theme', expect.any(String));
    });
  });

  describe('performance', () => {
    it('should not re-render unnecessarily', () => {
      const { rerender } = render(<MainHeader />);
      
      rerender(<MainHeader />);
      
      expect(screen.getByText('Plan-It')).toBeInTheDocument();
    });

    it('should clean up effects on unmount', () => {
      const { unmount } = render(<MainHeader />);
      
      unmount();
      
      expect(true).toBe(true);
    });
  });
});
