/**
 * Comprehensive unit tests for about page
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AboutPage from './page';

// Mock MainHeader component
jest.mock('@/components/main-header', () => {
  return function MainHeader() {
    return <div data-testid="main-header">Main Header</div>;
  };
});

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function Link({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

describe('AboutPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial Render', () => {
    it('should render the about page', () => {
      render(<AboutPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('should render MainHeader component', () => {
      render(<AboutPage />);
      expect(screen.getByTestId('main-header')).toBeInTheDocument();
    });

    it('should display the hero title "About Plan-It"', () => {
      render(<AboutPage />);
      expect(screen.getByRole('heading', { name: /about plan-it/i })).toBeInTheDocument();
    });

    it('should display hero subtitle', () => {
      render(<AboutPage />);
      expect(screen.getByText(/transforming how people work/i)).toBeInTheDocument();
    });
  });

  describe('Mission & Vision Section', () => {
    it('should render Our Mission heading', () => {
      render(<AboutPage />);
      expect(screen.getByRole('heading', { name: /our mission/i })).toBeInTheDocument();
    });

    it('should display mission statement', () => {
      render(<AboutPage />);
      expect(screen.getByText(/to empower people to focus on what matters/i)).toBeInTheDocument();
    });

    it('should render Future Vision heading', () => {
      render(<AboutPage />);
      expect(screen.getByRole('heading', { name: /future vision/i })).toBeInTheDocument();
    });

    it('should display vision statement', () => {
      render(<AboutPage />);
      expect(screen.getByText(/we plan to introduce deeper integrations/i)).toBeInTheDocument();
    });

    it('should render mission card with proper styling classes', () => {
      const { container } = render(<AboutPage />);
      const missionHeading = screen.getByRole('heading', { name: /our mission/i });
      const missionCard = missionHeading.closest('div.bg-white');
      expect(missionCard).toHaveClass('dark:bg-slate-800', 'rounded-2xl', 'shadow-lg');
    });

    it('should render vision card with proper styling classes', () => {
      const { container } = render(<AboutPage />);
      const visionHeading = screen.getByRole('heading', { name: /future vision/i });
      const visionCard = visionHeading.closest('div.bg-white');
      expect(visionCard).toHaveClass('dark:bg-slate-800', 'rounded-2xl', 'shadow-lg');
    });
  });

  describe('About Section', () => {
    it('should render What is Plan-It heading', () => {
      render(<AboutPage />);
      expect(screen.getByRole('heading', { name: /what is plan-it\?/i })).toBeInTheDocument();
    });

    it('should display Plan-It description with strong tag', () => {
      render(<AboutPage />);
      const description = screen.getByText(/plan-it/i, { selector: 'strong' });
      expect(description).toBeInTheDocument();
    });

    it('should mention productivity platform features', () => {
      render(<AboutPage />);
      expect(screen.getByText(/modern productivity platform/i)).toBeInTheDocument();
      expect(screen.getByText(/organize, prioritize, and complete work efficiently/i)).toBeInTheDocument();
    });

    it('should mention intelligent automation and proven techniques', () => {
      render(<AboutPage />);
      expect(screen.getByText(/intelligent automation, intuitive design, and proven productivity techniques/i)).toBeInTheDocument();
    });
  });

  describe('Story Section', () => {
    it('should render Our Story heading', () => {
      render(<AboutPage />);
      expect(screen.getByRole('heading', { name: /our story/i })).toBeInTheDocument();
    });

    it('should display story content about origins', () => {
      render(<AboutPage />);
      expect(screen.getByText(/plan-it started as a small experiment/i)).toBeInTheDocument();
    });

    it('should mention evolution into full platform', () => {
      render(<AboutPage />);
      expect(screen.getByText(/evolved into a full productivity platform/i)).toBeInTheDocument();
    });

    it('should mention commitment to user feedback', () => {
      render(<AboutPage />);
      expect(screen.getByText(/listening to our users and continuously improving/i)).toBeInTheDocument();
    });
  });

  describe('Call to Action Section', () => {
    it('should render CTA heading', () => {
      render(<AboutPage />);
      expect(screen.getByRole('heading', { name: /ready to boost your productivity\?/i })).toBeInTheDocument();
    });

    it('should display CTA description', () => {
      render(<AboutPage />);
      expect(screen.getByText(/join thousands of users who are already achieving their goals/i)).toBeInTheDocument();
    });

    it('should render Get Started Free button with link to register', () => {
      render(<AboutPage />);
      const getStartedLink = screen.getByRole('link', { name: /get started free/i });
      expect(getStartedLink).toBeInTheDocument();
      expect(getStartedLink).toHaveAttribute('href', '/register');
    });

    it('should render Contact Us button with link to contact', () => {
      render(<AboutPage />);
      const contactLink = screen.getByRole('link', { name: /contact us/i });
      expect(contactLink).toBeInTheDocument();
      expect(contactLink).toHaveAttribute('href', '/contact');
    });

    it('should render CTA section with proper styling', () => {
      const { container } = render(<AboutPage />);
      const ctaHeading = screen.getByRole('heading', { name: /ready to boost your productivity\?/i });
      const ctaSection = ctaHeading.closest('section');
      expect(ctaSection).toHaveClass('bg-gray-100', 'dark:bg-slate-800', 'rounded-2xl');
    });
  });

  describe('Visual Elements', () => {
    it('should render all SVG icons', () => {
      const { container } = render(<AboutPage />);
      const svgElements = container.querySelectorAll('svg');
      // Expect at least 4 SVG icons (mission, vision, about, story)
      expect(svgElements.length).toBeGreaterThanOrEqual(4);
    });

    it('should have proper icon containers with background colors', () => {
      const { container } = render(<AboutPage />);
      const blueIconContainer = container.querySelector('.bg-blue-500');
      const tealIconContainer = container.querySelector('.bg-teal-500');
      expect(blueIconContainer).toBeInTheDocument();
      expect(tealIconContainer).toBeInTheDocument();
    });
  });

  describe('Layout and Styling', () => {
    it('should have min-h-screen on main element', () => {
      render(<AboutPage />);
      const main = screen.getByRole('main');
      expect(main).toHaveClass('min-h-screen');
    });

    it('should have responsive background colors for light and dark mode', () => {
      render(<AboutPage />);
      const main = screen.getByRole('main');
      expect(main).toHaveClass('bg-white', 'dark:bg-slate-900');
    });

    it('should have max-w-7xl container for content', () => {
      const { container } = render(<AboutPage />);
      const maxWidthContainer = container.querySelector('.max-w-7xl');
      expect(maxWidthContainer).toBeInTheDocument();
    });

    it('should have grid layout for mission and vision cards', () => {
      const { container } = render(<AboutPage />);
      const gridContainer = container.querySelector('.grid.md\\:grid-cols-2');
      expect(gridContainer).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should use semantic HTML with main element', () => {
      render(<AboutPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('should use section elements for major content areas', () => {
      const { container } = render(<AboutPage />);
      const sections = container.querySelectorAll('section');
      expect(sections.length).toBeGreaterThanOrEqual(2); // Hero and CTA sections
    });

    it('should have proper heading hierarchy', () => {
      render(<AboutPage />);
      const h1 = screen.getByRole('heading', { level: 1 });
      const h2Headings = screen.getAllByRole('heading', { level: 2 });
      const h3Headings = screen.getAllByRole('heading', { level: 3 });
      
      expect(h1).toBeInTheDocument();
      expect(h2Headings.length).toBeGreaterThan(0);
      expect(h3Headings.length).toBeGreaterThan(0);
    });

    it('should have descriptive link text', () => {
      render(<AboutPage />);
      expect(screen.getByRole('link', { name: /get started free/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /contact us/i })).toBeInTheDocument();
    });
  });

  describe('Content Validation', () => {
    it('should contain all key information sections', () => {
      render(<AboutPage />);
      
      // Check for hero
      expect(screen.getByText(/about plan-it/i)).toBeInTheDocument();
      
      // Check for mission
      expect(screen.getByText(/our mission/i)).toBeInTheDocument();
      
      // Check for vision
      expect(screen.getByText(/future vision/i)).toBeInTheDocument();
      
      // Check for about section
      expect(screen.getByText(/what is plan-it\?/i)).toBeInTheDocument();
      
      // Check for story
      expect(screen.getByText(/our story/i)).toBeInTheDocument();
      
      // Check for CTA
      expect(screen.getByText(/ready to boost your productivity\?/i)).toBeInTheDocument();
    });

    it('should not have any Lorem Ipsum or placeholder text', () => {
      const { container } = render(<AboutPage />);
      const pageText = container.textContent || '';
      expect(pageText.toLowerCase()).not.toMatch(/lorem ipsum/);
      expect(pageText.toLowerCase()).not.toMatch(/placeholder/);
      expect(pageText.toLowerCase()).not.toMatch(/\[.*\]/); // No [text] placeholders
    });
  });

  describe('Responsive Design Classes', () => {
    it('should have responsive text sizing for hero title', () => {
      render(<AboutPage />);
      const heroTitle = screen.getByRole('heading', { name: /about plan-it/i });
      expect(heroTitle).toHaveClass('text-5xl', 'sm:text-6xl');
    });

    it('should have responsive flex wrapping for CTA buttons', () => {
      const { container } = render(<AboutPage />);
      const buttonContainer = container.querySelector('.flex.gap-4.justify-center.flex-wrap');
      expect(buttonContainer).toBeInTheDocument();
    });
  });
});
