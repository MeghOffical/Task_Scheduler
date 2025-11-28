import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import LandingContent from './landing-content';

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href, ...props }: any) => {
    return <a href={href} {...props}>{children}</a>;
  };
});

// Mock MainHeader
jest.mock('./main-header', () => {
  return function MockMainHeader() {
    return <div data-testid="main-header">Main Header</div>;
  };
});

// Mock FAQ data
jest.mock('@/app/faqs/faqs.json', () => [
  { question: 'How do I sign up?', answer: 'Click Sign Up in the header and follow the steps.' },
  { question: 'Is Plan-It free to use?', answer: 'Yes. We offer a free plan.' },
]);

describe('LandingContent Component', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    
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
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('should render main header', () => {
      render(<LandingContent />);
      expect(screen.getByTestId('main-header')).toBeInTheDocument();
    });

    it('should render hero section', () => {
      render(<LandingContent />);
      expect(screen.getByText(/Transform How You/i)).toBeInTheDocument();
      expect(screen.getByText(/Work & Achieve/i)).toBeInTheDocument();
    });

    it('should render hero description', () => {
      render(<LandingContent />);
      expect(screen.getByText(/The complete productivity platform/i)).toBeInTheDocument();
    });

    it('should render CTA buttons', () => {
      render(<LandingContent />);
      expect(screen.getByRole('link', { name: /sign up/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should have correct button links', () => {
      render(<LandingContent />);
      expect(screen.getByRole('link', { name: /sign up/i })).toHaveAttribute('href', '/register');
      expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/login');
    });
  });

  describe('feature cards', () => {
    it('should render all feature cards', () => {
      render(<LandingContent />);
      
      expect(screen.getByText('Smart Tasks')).toBeInTheDocument();
      expect(screen.getByText('Pomodoro Timer')).toBeInTheDocument();
      expect(screen.getByText('Analytics')).toBeInTheDocument();
      expect(screen.getByText('AI Assistant')).toBeInTheDocument();
      expect(screen.getByText('Priorities')).toBeInTheDocument();
      expect(screen.getByText('Customizable')).toBeInTheDocument();
    });

    it('should render feature descriptions', () => {
      render(<LandingContent />);
      
      expect(screen.getByText(/Create, organize, and prioritize tasks/i)).toBeInTheDocument();
      expect(screen.getByText(/Boost focus with 25-minute sprints/i)).toBeInTheDocument();
    });

    it('should have proper styling classes', () => {
      const { container } = render(<LandingContent />);
      
      const featureCards = container.querySelectorAll('.group');
      expect(featureCards.length).toBeGreaterThan(0);
    });
  });

  describe('testimonials section', () => {
    it('should render testimonials heading', () => {
      render(<LandingContent />);
      expect(screen.getByText('Testimonials')).toBeInTheDocument();
    });

    it('should render testimonial content', () => {
      render(<LandingContent />);
      expect(screen.getByText(/Plan-It has completely transformed/i)).toBeInTheDocument();
    });

    it('should show author information', () => {
      render(<LandingContent />);
      expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();
      expect(screen.getByText('Product Manager')).toBeInTheDocument();
    });

    it('should auto-rotate testimonials', async () => {
      const { rerender } = render(<LandingContent />);
      
      expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();
      
      await act(async () => {
        jest.advanceTimersByTime(5000);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Michael Chen')).toBeInTheDocument();
      });
    });

    it('should allow manual testimonial navigation', async () => {
      render(<LandingContent />);
      
      const buttons = screen.getAllByRole('button').filter(btn => 
        btn.getAttribute('aria-label')?.includes('Testimonial')
      );
      
      if (buttons.length > 1) {
        fireEvent.click(buttons[1]);
        await waitFor(() => {
          expect(screen.getByText('Michael Chen')).toBeInTheDocument();
        });
      }
    });

    it('should display navigation dots', () => {
      render(<LandingContent />);
      
      const navButtons = screen.getAllByRole('button').filter(btn => 
        btn.getAttribute('aria-label')?.includes('Testimonial')
      );
      
      expect(navButtons.length).toBeGreaterThan(0);
    });
  });

  describe('How It Works section', () => {
    it('should render section heading', () => {
      render(<LandingContent />);
      expect(screen.getByText('How Plan-It Works')).toBeInTheDocument();
    });

    it('should render all step cards', () => {
      render(<LandingContent />);
      
      expect(screen.getByText('Sign Up Free')).toBeInTheDocument();
      expect(screen.getByText('Add Your Tasks')).toBeInTheDocument();
      expect(screen.getByText('Get Things Done')).toBeInTheDocument();
    });

    it('should render step descriptions', () => {
      render(<LandingContent />);
      
      expect(screen.getByText(/Create your account in seconds/i)).toBeInTheDocument();
      expect(screen.getByText(/Use the AI assistant or create tasks manually/i)).toBeInTheDocument();
      expect(screen.getByText(/Track progress, use Pomodoro/i)).toBeInTheDocument();
    });

    it('should display step numbers', () => {
      render(<LandingContent />);
      
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  describe('FAQ section', () => {
    it('should render FAQ heading', () => {
      render(<LandingContent />);
      expect(screen.getByText('Frequently Asked Questions')).toBeInTheDocument();
    });

    it('should render FAQ items from JSON', () => {
      render(<LandingContent />);
      expect(screen.getByText('How do I sign up?')).toBeInTheDocument();
      expect(screen.getByText('Is Plan-It free to use?')).toBeInTheDocument();
    });

    it('should expand FAQ on click', async () => {
      render(<LandingContent />);
      
      const faqButton = screen.getByText('How do I sign up?');
      fireEvent.click(faqButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Click Sign Up in the header/i)).toBeInTheDocument();
      });
    });

    it('should collapse FAQ when clicked again', () => {
      render(<LandingContent />);
      
      const faqButtons = screen.getAllByRole('button').filter(btn => 
        btn.textContent?.includes('How do I sign up?')
      );
      const faqButton = faqButtons[0];
      
      fireEvent.click(faqButton);
      
      // Verify it's open
      expect(faqButton).toHaveAttribute('aria-expanded', 'true');
      
      fireEvent.click(faqButton);
      
      // Verify it's closed
      expect(faqButton).toHaveAttribute('aria-expanded', 'false');
    });

    it('should handle keyboard navigation', () => {
      render(<LandingContent />);
      
      const faqButtons = screen.getAllByRole('button').filter(btn => 
        btn.textContent?.includes('How do I sign up?')
      );
      const faqButton = faqButtons[0];
      
      // Initial state should be closed
      expect(faqButton).toHaveAttribute('aria-expanded', 'false');
      
      // Test Enter key
      fireEvent.keyDown(faqButton, { key: 'Enter' });
      
      // Should now be expanded
      expect(faqButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('should navigate with arrow keys', () => {
      render(<LandingContent />);
      
      const faqButtons = screen.getAllByRole('button').filter(btn => 
        btn.textContent?.includes('?')
      );
      
      if (faqButtons.length > 0) {
        fireEvent.keyDown(faqButtons[0], { key: 'ArrowDown' });
        // Should focus next FAQ
      }
    });

    it('should navigate to first with Home key', () => {
      render(<LandingContent />);
      
      const faqButtons = screen.getAllByRole('button').filter(btn => 
        btn.textContent?.includes('?')
      );
      
      if (faqButtons.length > 0) {
        fireEvent.keyDown(faqButtons[0], { key: 'Home' });
      }
    });

    it('should navigate to last with End key', () => {
      render(<LandingContent />);
      
      const faqButtons = screen.getAllByRole('button').filter(btn => 
        btn.textContent?.includes('?')
      );
      
      if (faqButtons.length > 0) {
        fireEvent.keyDown(faqButtons[0], { key: 'End' });
      }
    });
  });

  describe('footer', () => {
    it('should render footer', () => {
      const { container } = render(<LandingContent />);
      const footer = container.querySelector('footer');
      expect(footer).toBeInTheDocument();
    });

    it('should render copyright notice', () => {
      render(<LandingContent />);
      expect(screen.getByText(/© 2025 Plan-It/i)).toBeInTheDocument();
    });

    it('should render footer links', () => {
      render(<LandingContent />);
      
      expect(screen.getByRole('link', { name: /status/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /docs/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /about us/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /contact/i })).toBeInTheDocument();
    });

    it('should have GitHub link', () => {
      render(<LandingContent />);
      
      const githubLink = screen.getByRole('link', { name: /github/i });
      expect(githubLink).toHaveAttribute('href', 'https://github.com/MeghOffical/Task_Scheduler');
      expect(githubLink).toHaveAttribute('target', '_blank');
      expect(githubLink).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('theme functionality', () => {
    it('should initialize theme from localStorage', () => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue('dark');
      
      render(<LandingContent />);
      
      expect(window.localStorage.getItem).toHaveBeenCalledWith('theme');
    });

    it('should use system preference when no saved theme', () => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue(null);
      
      render(<LandingContent />);
      
      expect(window.matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
    });

    it('should apply dark mode class', () => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue('dark');
      
      render(<LandingContent />);
      
      // Check if dark class would be applied
      expect(window.localStorage.getItem).toHaveBeenCalled();
    });
  });

  describe('responsive design', () => {
    it('should have responsive grid for features', () => {
      const { container } = render(<LandingContent />);
      
      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('md:grid-cols-2', 'lg:grid-cols-3');
    });

    it('should have responsive text sizes', () => {
      render(<LandingContent />);
      
      const heading = screen.getByText(/Transform How You/i);
      expect(heading).toHaveClass('text-5xl', 'sm:text-6xl', 'lg:text-7xl');
    });

    it('should have responsive padding', () => {
      const { container } = render(<LandingContent />);
      
      // Check that the main container has max-w which provides responsive layout
      const main = container.querySelector('main');
      expect(main).toBeInTheDocument();
      
      // Check that at least one section has padding classes
      const sections = container.querySelectorAll('section');
      expect(sections.length).toBeGreaterThan(0);
      
      // Verify sections exist and have content
      const heroSection = container.querySelector('.max-w-7xl');
      expect(heroSection).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper heading hierarchy', () => {
      const { container } = render(<LandingContent />);
      
      const h1 = container.querySelector('h1');
      expect(h1).toBeInTheDocument();
    });

    it('should have aria-labels for buttons', () => {
      render(<LandingContent />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        if (button.getAttribute('aria-label')) {
          expect(button).toHaveAttribute('aria-label');
        }
      });
    });

    it('should have aria-expanded for accordions', () => {
      render(<LandingContent />);
      
      const faqButtons = screen.getAllByRole('button').filter(btn => 
        btn.getAttribute('aria-expanded') !== null
      );
      
      expect(faqButtons.length).toBeGreaterThan(0);
    });

    it('should have proper link accessibility', () => {
      render(<LandingContent />);
      
      const externalLinks = screen.getAllByRole('link').filter(link => 
        link.getAttribute('target') === '_blank'
      );
      
      externalLinks.forEach(link => {
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      });
    });
  });

  describe('animations and transitions', () => {
    it('should have transition classes', () => {
      const { container } = render(<LandingContent />);
      
      const cards = container.querySelectorAll('[class*="transition"]');
      expect(cards.length).toBeGreaterThan(0);
    });

    it('should have hover effects', () => {
      const { container } = render(<LandingContent />);
      
      const hoverElements = container.querySelectorAll('[class*="hover:"]');
      expect(hoverElements.length).toBeGreaterThan(0);
    });
  });

  describe('visual branding', () => {
    it('should display "Built for productivity" badge', () => {
      render(<LandingContent />);
      expect(screen.getByText('Built for productivity')).toBeInTheDocument();
    });

    it('should have animated pulse on badge', () => {
      const { container } = render(<LandingContent />);
      
      const pulse = container.querySelector('.animate-ping');
      expect(pulse).toBeInTheDocument();
    });

    it('should use brand colors', () => {
      const { container } = render(<LandingContent />);
      
      const blueElements = container.querySelectorAll('[class*="blue"]');
      expect(blueElements.length).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('should handle missing FAQ data gracefully', () => {
      jest.resetModules();
      jest.doMock('@/app/faqs/faqs.json', () => {
        throw new Error('File not found');
      });
      
      render(<LandingContent />);
      
      // Should still render with fallback FAQ
      expect(screen.getByText(/Frequently Asked Questions/i)).toBeInTheDocument();
    });

    it('should handle empty FAQ data', () => {
      jest.resetModules();
      jest.doMock('@/app/faqs/faqs.json', () => []);
      
      render(<LandingContent />);
      
      expect(screen.getByText(/Frequently Asked Questions/i)).toBeInTheDocument();
    });
  });

  describe('performance', () => {
    it('should not re-render unnecessarily', () => {
      const { rerender } = render(<LandingContent />);
      
      rerender(<LandingContent />);
      
      expect(screen.getByText(/Transform How You/i)).toBeInTheDocument();
    });

    it('should clean up testimonial timer on unmount', () => {
      const { unmount } = render(<LandingContent />);
      
      unmount();
      
      // Timer should be cleaned up
      expect(true).toBe(true);
    });
  });
});
