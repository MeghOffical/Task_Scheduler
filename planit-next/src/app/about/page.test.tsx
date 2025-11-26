/**
 * Unit tests for about page
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AboutPage from './page';

describe('About Page', () => {
  it('should render about page', () => {
    render(<AboutPage />);
    expect(screen.getByText(/about/i)).toBeInTheDocument();
  });

  it('should display project information', () => {
    render(<AboutPage />);
    expect(screen.getByText(/plan-it/i)).toBeInTheDocument();
  });

  it('should display team information', () => {
    render(<AboutPage />);
    expect(screen.getByText(/team/i)).toBeInTheDocument();
  });
});
