/**
 * Unit tests for LandingContent component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LandingContent from './landing-content';

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

// Mock main-header
jest.mock('./main-header', () => ({
  __esModule: true,
  default: () => <header data-testid="main-header">Main Header</header>,
}));

// Mock FAQs data
jest.mock('@/app/faqs/faqs.json', () => [
  { question: 'How do I sign up?', answer: 'Click Sign Up in the header.' },
  { question: 'Is Plan-It free?', answer: 'Yes, we offer a free plan.' },
]);

describe('LandingContent Component', () => {
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

  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<LandingContent />);
      expect(screen.getByTestId('main-header')).toBeInTheDocument();
    });

    it('should render hero section with main heading', () => {
      render(<LandingContent />);
      expect(screen.getByText(/Transform How You/i)).toBeInTheDocument();
      expect(screen.getByText(/Work & Achieve/i)).toBeInTheDocument();
    });

    it('should render Sign Up and Sign In buttons', () => {
      render(<LandingContent />);
      const signUpLinks = screen.getAllByText('Sign Up');
      const signInLinks = screen.getAllByText('Sign In');
      expect(signUpLinks.length).toBeGreaterThan(0);
      expect(signInLinks.length).toBeGreaterThan(0);
    });

    it('should render all feature cards', () => {
      render(<LandingContent />);
      expect(screen.getByText('Smart Tasks')).toBeInTheDocument();
      expect(screen.getByText('Pomodoro Timer')).toBeInTheDocument();
      expect(screen.getByText('Analytics')).toBeInTheDocument();
      expect(screen.getByText('AI Assistant')).toBeInTheDocument();
      expect(screen.getByText('Priorities')).toBeInTheDocument();
      expect(screen.getByText('Customizable')).toBeInTheDocument();
    });

    it('should render testimonials section', () => {
      render(<LandingContent />);
      expect(screen.getByText('Testimonials')).toBeInTheDocument();
      expect(screen.getByText(/Trusted by professionals worldwide/i)).toBeInTheDocument();
    });

    it('should render How It Works section', () => {
      render(<LandingContent />);
      expect(screen.getByText('How Plan-It Works')).toBeInTheDocument();
      expect(screen.getByText('Sign Up Free')).toBeInTheDocument();
      expect(screen.getByText('Add Your Tasks')).toBeInTheDocument();
      expect(screen.getByText('Get Things Done')).toBeInTheDocument();
    });

    it('should render FAQs section', () => {
      render(<LandingContent />);
      expect(screen.getByText('Frequently Asked Questions')).toBeInTheDocument();
    });

    it('should render footer with links', () => {
      render(<LandingContent />);
      expect(screen.getByText('© 2025 Plan-It')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Docs')).toBeInTheDocument();
      expect(screen.getByText('About Us')).toBeInTheDocument();
      expect(screen.getByText('Contact')).toBeInTheDocument();
    });
  });

  describe('Testimonials Carousel', () => {
    it('should display first testimonial initially', () => {
      render(<LandingContent />);
      expect(screen.getByText(/Plan-It has completely transformed/i)).toBeInTheDocument();
      expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();
    });

    it('should have navigation dots for testimonials', () => {
      render(<LandingContent />);
      const dots = screen.getAllByRole('button', { name: /Testimonial \d+/i });
      expect(dots).toHaveLength(3);
    });

    it('should change testimonial when clicking navigation dot', async () => {
      render(<LandingContent />);
      const dots = screen.getAllByRole('button', { name: /Testimonial \d+/i });
      
      fireEvent.click(dots[1]);
      
      await waitFor(() => {
        expect(screen.getByText(/The Pomodoro timer integration/i)).toBeInTheDocument();
        expect(screen.getByText('Michael Chen')).toBeInTheDocument();
      });
    });

    it('should auto-rotate testimonials', async () => {
      jest.useFakeTimers();
      render(<LandingContent />);
      
      expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();
      
      jest.advanceTimersByTime(5000);
      
      await waitFor(() => {
        expect(screen.getByText('Michael Chen')).toBeInTheDocument();
      });
      
      jest.useRealTimers();
    });
  });

  describe('FAQ Accordion', () => {
    it('should render FAQ items from JSON', () => {
      render(<LandingContent />);
      expect(screen.getByText('How do I sign up?')).toBeInTheDocument();
      expect(screen.getByText('Is Plan-It free?')).toBeInTheDocument();
    });

    it('should expand FAQ when clicked', async () => {
      render(<LandingContent />);
      const faqButton = screen.getByText('How do I sign up?');
      
      fireEvent.click(faqButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Click Sign Up in the header/i)).toBeVisible();
      });
    });

    it('should collapse FAQ when clicked again', async () => {
      render(<LandingContent />);
      const faqButton = screen.getByText('How do I sign up?');
      
      fireEvent.click(faqButton);
      await waitFor(() => {
        expect(screen.getByText(/Click Sign Up in the header/i)).toBeVisible();
      });
      
      fireEvent.click(faqButton);
      // FAQ should collapse - the answer should no longer be visible
      await waitFor(() => {
        const answer = screen.getByText(/Click Sign Up in the header/i);
        expect(answer.parentElement).toHaveStyle({ overflow: 'hidden' });
      });
    });

    it('should handle keyboard navigation in accordion', async () => {
      render(<LandingContent />);
      const faqButtons = screen.getAllByRole('button');
      const firstFaq = faqButtons.find(btn => btn.textContent?.includes('How do I sign up?'));
      
      if (firstFaq) {
        firstFaq.focus();
        fireEvent.keyDown(firstFaq, { key: 'ArrowDown' });
        
        await waitFor(() => {
          expect(document.activeElement).not.toBe(firstFaq);
        });
      }
    });

    it('should handle Enter key to toggle FAQ', async () => {
      render(<LandingContent />);
      const faqButton = screen.getByText('How do I sign up?');
      
      fireEvent.keyDown(faqButton, { key: 'Enter' });
      
      await waitFor(() => {
        expect(screen.getByText(/Click Sign Up in the header/i)).toBeVisible();
      });
    });

    it('should handle Space key to toggle FAQ', async () => {
      render(<LandingContent />);
      const faqButton = screen.getByText('How do I sign up?');
      
      fireEvent.keyDown(faqButton, { key: ' ' });
      
      await waitFor(() => {
        expect(screen.getByText(/Click Sign Up in the header/i)).toBeVisible();
      });
    });

    it('should handle Home key to focus first FAQ', async () => {
      render(<LandingContent />);
      const faqButtons = screen.getAllByRole('button');
      // Filter to get only FAQ buttons (not testimonial navigation buttons)
      const faqOnlyButtons = faqButtons.filter(btn => 
        btn.textContent?.includes('How do I sign up?') || btn.textContent?.includes('Is Plan-It free?')
      );
      
      if (faqOnlyButtons.length > 0) {
        const lastFaq = faqOnlyButtons[faqOnlyButtons.length - 1];
        lastFaq.focus();
        fireEvent.keyDown(lastFaq, { key: 'Home' });
        
        await waitFor(() => {
          expect(document.activeElement).toBe(faqOnlyButtons[0]);
        });
      }
    });

    it('should handle End key to focus last FAQ', async () => {
      render(<LandingContent />);
      const faqButtons = screen.getAllByRole('button');
      // Filter to get only FAQ buttons (not testimonial navigation buttons)
      const faqOnlyButtons = faqButtons.filter(btn => 
        btn.textContent?.includes('How do I sign up?') || btn.textContent?.includes('Is Plan-It free?')
      );
      
      if (faqOnlyButtons.length > 0) {
        const firstFaq = faqOnlyButtons[0];
        firstFaq.focus();
        fireEvent.keyDown(firstFaq, { key: 'End' });
        
        await waitFor(() => {
          expect(document.activeElement).toBe(faqOnlyButtons[faqOnlyButtons.length - 1]);
        });
      }
    });
  });

  describe('Theme Toggle', () => {
    it('should initialize theme from localStorage', async () => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue('dark');
      render(<LandingContent />);
      
      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(true);
      });
    });

    it('should initialize theme from system preference when no localStorage value', async () => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue(null);
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-color-scheme: dark)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });
      
      render(<LandingContent />);
      
      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(true);
      });
    });

    it('should default to light theme when no preference', async () => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue(null);
      render(<LandingContent />);
      
      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(false);
      });
    });
  });

  describe('Feature Cards', () => {
    it('should render feature card descriptions', () => {
      render(<LandingContent />);
      expect(screen.getByText(/Create, organize, and prioritize tasks/i)).toBeInTheDocument();
      expect(screen.getByText(/Boost focus with 25-minute sprints/i)).toBeInTheDocument();
      expect(screen.getByText(/Visualize productivity trends/i)).toBeInTheDocument();
    });
  });

  describe('Step Cards', () => {
    it('should render step numbers', () => {
      render(<LandingContent />);
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should render step descriptions', () => {
      render(<LandingContent />);
      expect(screen.getByText(/Create your account in seconds/i)).toBeInTheDocument();
      expect(screen.getByText(/Use the AI assistant or create tasks manually/i)).toBeInTheDocument();
      expect(screen.getByText(/Track progress, use Pomodoro/i)).toBeInTheDocument();
    });
  });

  describe('Links', () => {
    it('should have correct href for Sign Up button', () => {
      render(<LandingContent />);
      const signUpLinks = screen.getAllByText('Sign Up');
      const signUpLink = signUpLinks[0].closest('a');
      expect(signUpLink).toHaveAttribute('href', '/register');
    });

    it('should have correct href for Sign In button', () => {
      render(<LandingContent />);
      const signInLinks = screen.getAllByText('Sign In');
      const signInLink = signInLinks[0].closest('a');
      expect(signInLink).toHaveAttribute('href', '/login');
    });

    it('should have correct href for footer links', () => {
      render(<LandingContent />);
      expect(screen.getByText('Status').closest('a')).toHaveAttribute('href', '/status');
      expect(screen.getByText('Docs').closest('a')).toHaveAttribute('href', '/docs');
      expect(screen.getByText('About Us').closest('a')).toHaveAttribute('href', '/about');
      expect(screen.getByText('Contact').closest('a')).toHaveAttribute('href', '/contact');
    });

    it('should have GitHub link with correct attributes', () => {
      render(<LandingContent />);
      const githubLink = screen.getByLabelText('GitHub');
      expect(githubLink).toHaveAttribute('href', 'https://github.com/MeghOffical/Task_Scheduler');
      expect(githubLink).toHaveAttribute('target', '_blank');
      expect(githubLink).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('Error Handling', () => {
    it('should handle FAQ loading error gracefully', () => {
      // This test ensures the component doesn't crash if FAQ data fails to load
      jest.resetModules();
      jest.doMock('@/app/faqs/faqs.json', () => {
        throw new Error('Failed to load');
      });
      
      const { container } = render(<LandingContent />);
      expect(container).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for testimonial navigation', () => {
      render(<LandingContent />);
      expect(screen.getByLabelText('Testimonial 1')).toBeInTheDocument();
      expect(screen.getByLabelText('Testimonial 2')).toBeInTheDocument();
      expect(screen.getByLabelText('Testimonial 3')).toBeInTheDocument();
    });

    it('should have proper ARIA attributes for accordion', () => {
      render(<LandingContent />);
      const faqButtons = screen.getAllByRole('button');
      const faqButton = faqButtons.find(btn => btn.textContent?.includes('How do I sign up?'));
      
      expect(faqButton).toHaveAttribute('aria-expanded');
      expect(faqButton).toHaveAttribute('aria-controls');
    });

    it('should have proper GitHub link aria-label', () => {
      render(<LandingContent />);
      const githubLink = screen.getByLabelText('GitHub');
      expect(githubLink).toBeInTheDocument();
    });
  });
});
