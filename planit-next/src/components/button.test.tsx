import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Button from './button';

describe('Button Component', () => {
  describe('basic rendering', () => {
    it('should render button with children text', () => {
      render(<Button>Click Me</Button>);
      expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<Button className="custom-class">Test</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    it('should handle onClick event', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Click Me</Button>);
      
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('variants', () => {
    it('should render primary variant by default', () => {
      render(<Button>Primary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-primary-600');
    });

    it('should render secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-gray-600');
    });

    it('should render outline variant', () => {
      render(<Button variant="outline">Outline</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('border-gray-300');
    });

    it('should render danger variant', () => {
      render(<Button variant="danger">Danger</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-red-600');
    });
  });

  describe('loading state', () => {
    it('should show loading spinner when isLoading is true', () => {
      render(<Button isLoading>Submit</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button.querySelector('svg')).toBeInTheDocument();
    });

    it('should display loadingText when provided', () => {
      render(<Button isLoading loadingText="Processing...">Submit</Button>);
      expect(screen.getByText(/processing/i)).toBeInTheDocument();
    });

    it('should display children text when loadingText not provided', () => {
      render(<Button isLoading>Submit</Button>);
      expect(screen.getByText(/submit/i)).toBeInTheDocument();
    });

    it('should not trigger onClick when loading', () => {
      const handleClick = jest.fn();
      render(<Button isLoading onClick={handleClick}>Submit</Button>);
      
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('disabled state', () => {
    it('should render disabled button', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should not trigger onClick when disabled', () => {
      const handleClick = jest.fn();
      render(<Button disabled onClick={handleClick}>Disabled</Button>);
      
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should have disabled styles', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('disabled:opacity-50');
      expect(button).toHaveClass('disabled:cursor-not-allowed');
    });
  });

  describe('icons', () => {
    it('should render left icon', () => {
      const LeftIcon = <span data-testid="left-icon">←</span>;
      render(<Button leftIcon={LeftIcon}>With Icon</Button>);
      
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
      expect(screen.getByText(/with icon/i)).toBeInTheDocument();
    });

    it('should render right icon', () => {
      const RightIcon = <span data-testid="right-icon">→</span>;
      render(<Button rightIcon={RightIcon}>With Icon</Button>);
      
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
      expect(screen.getByText(/with icon/i)).toBeInTheDocument();
    });

    it('should render both left and right icons', () => {
      const LeftIcon = <span data-testid="left-icon">←</span>;
      const RightIcon = <span data-testid="right-icon">→</span>;
      render(
        <Button leftIcon={LeftIcon} rightIcon={RightIcon}>
          With Icons
        </Button>
      );
      
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });

    it('should not render icons when loading', () => {
      const LeftIcon = <span data-testid="left-icon">←</span>;
      const RightIcon = <span data-testid="right-icon">→</span>;
      render(
        <Button isLoading leftIcon={LeftIcon} rightIcon={RightIcon}>
          Loading
        </Button>
      );
      
      expect(screen.queryByTestId('left-icon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('right-icon')).not.toBeInTheDocument();
    });
  });

  describe('HTML button attributes', () => {
    it('should accept type attribute', () => {
      render(<Button type="submit">Submit</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
    });

    it('should accept form attribute', () => {
      render(<Button form="my-form">Submit</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('form', 'my-form');
    });

    it('should accept aria attributes', () => {
      render(<Button aria-label="Custom label">Submit</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Custom label');
    });
  });
});
