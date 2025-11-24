import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import GridBackground from './grid-background';

describe('GridBackground Component', () => {
  it('should render children content', () => {
    render(
      <GridBackground>
        <div data-testid="child-content">Test Content</div>
      </GridBackground>
    );

    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should apply correct container classes', () => {
    const { container } = render(
      <GridBackground>
        <div>Content</div>
      </GridBackground>
    );

    const mainDiv = container.firstChild as HTMLElement;
    expect(mainDiv).toHaveClass('min-h-screen', 'relative');
  });

  it('should render light mode gradient layer', () => {
    const { container } = render(
      <GridBackground>
        <div>Content</div>
      </GridBackground>
    );

    const lightGradient = container.querySelector('.bg-light-brand-gradient');
    expect(lightGradient).toBeInTheDocument();
    expect(lightGradient).toHaveClass('dark:hidden');
  });

  it('should render dark mode background', () => {
    const { container } = render(
      <GridBackground>
        <div>Content</div>
      </GridBackground>
    );

    const darkBg = container.querySelector('.bg-\\[\\#01041c\\]');
    expect(darkBg).toBeInTheDocument();
    expect(darkBg).toHaveClass('hidden', 'dark:block');
  });

  it('should render grid pattern overlay', () => {
    const { container } = render(
      <GridBackground>
        <div>Content</div>
      </GridBackground>
    );

    const overlay = container.querySelector('.opacity-25.mix-blend-overlay');
    expect(overlay).toBeInTheDocument();
  });

  it('should render content within max-width container', () => {
    const { container } = render(
      <GridBackground>
        <div>Content</div>
      </GridBackground>
    );

    const contentContainer = container.querySelector('.max-w-7xl');
    expect(contentContainer).toBeInTheDocument();
    expect(contentContainer).toHaveClass('mx-auto', 'px-4', 'sm:px-6', 'lg:px-8', 'py-8');
  });

  it('should render multiple children', () => {
    render(
      <GridBackground>
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
      </GridBackground>
    );

    expect(screen.getByTestId('child-1')).toBeInTheDocument();
    expect(screen.getByTestId('child-2')).toBeInTheDocument();
  });

  it('should have proper stacking of background layers', () => {
    const { container } = render(
      <GridBackground>
        <div>Content</div>
      </GridBackground>
    );

    const absoluteElements = container.querySelectorAll('.absolute.inset-0');
    expect(absoluteElements.length).toBeGreaterThan(0);
  });

  it('should render relative positioned content container', () => {
    const { container } = render(
      <GridBackground>
        <div>Content</div>
      </GridBackground>
    );

    const relativeContainer = container.querySelector('.relative.max-w-7xl');
    expect(relativeContainer).toBeInTheDocument();
  });
});
