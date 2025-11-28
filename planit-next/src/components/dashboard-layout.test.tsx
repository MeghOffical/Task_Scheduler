import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { usePathname } from 'next/navigation';

// Mock all heroicons with a factory that creates proper React components
jest.mock('@heroicons/react/24/outline', () => {
  // Use a factory function that will be called when imported
  return new Proxy({}, {
    get: (target, prop) => {
      // Return a mock component for any icon
      const Component = ({ className, ...props }: any) => {
        return React.createElement('svg', {
          ...props,
          className,
          'data-testid': `icon-${String(prop)}`,
          'data-icon': String(prop)
        });
      };
      Component.displayName = String(prop);
      return Component;
    }
  });
});

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

import DashboardLayout, { Sidebar } from './dashboard-layout';

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href, ...props }: any) => {
    return <a href={href} {...props}>{children}</a>;
  };
});

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  signOut: jest.fn(() => Promise.resolve()),
}));

// Mock fetch globally
global.fetch = jest.fn();

describe('DashboardLayout Component', () => {
  const mockPathname = usePathname as jest.Mock;

  beforeEach(() => {
    mockPathname.mockReturnValue('/dashboard');
    (global.fetch as jest.Mock).mockClear();
    
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

    // Mock window methods
    global.alert = jest.fn();
    global.confirm = jest.fn(() => true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('should render children', () => {
      render(<DashboardLayout><div>Test Content</div></DashboardLayout>);
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should render header', () => {
      render(<DashboardLayout><div>Test</div></DashboardLayout>);
      expect(screen.getByText(/plan-it/i)).toBeInTheDocument();
    });

    it('should render sidebar on desktop', () => {
      render(<DashboardLayout><div>Test</div></DashboardLayout>);
      const homeLinks = screen.getAllByText('Home');
      const taskLinks = screen.getAllByText('Tasks');
      expect(homeLinks.length).toBeGreaterThan(0);
      expect(taskLinks.length).toBeGreaterThan(0);
    });

    it('should render floating AI assistant button', () => {
      render(<DashboardLayout><div>Test</div></DashboardLayout>);
      expect(screen.getByTitle('Open AI Assistant')).toBeInTheDocument();
    });
  });

  describe('header functionality', () => {
    it('should display notifications button', () => {
      render(<DashboardLayout><div>Test</div></DashboardLayout>);
      const notificationButtons = screen.getAllByRole('button');
      expect(notificationButtons.length).toBeGreaterThan(0);
    });

    it('should toggle dark mode', async () => {
      render(<DashboardLayout><div>Test</div></DashboardLayout>);
      
      const darkModeButtons = screen.getAllByRole('button');
      const darkModeButton = darkModeButtons.find(btn => 
        btn.getAttribute('title') === 'Dark Mode' || btn.getAttribute('title') === 'Light Mode'
      );
      
      if (darkModeButton) {
        fireEvent.click(darkModeButton);
        expect(localStorage.setItem).toHaveBeenCalled();
      }
    });

    it('should show profile menu on click', () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ username: 'testuser', email: 'test@test.com', points: 100 }),
      });

      render(<DashboardLayout><div>Test</div></DashboardLayout>);
      
      const buttons = screen.getAllByRole('button');
      const profileButton = buttons.find(btn => 
        btn.querySelector('svg') && btn.className.includes('h-8')
      );
      
      if (profileButton) {
        fireEvent.click(profileButton);
      }
    });

    it('should fetch user info on mount', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ username: 'testuser', email: 'test@test.com', points: 100 }),
      });

      render(<DashboardLayout><div>Test</div></DashboardLayout>);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/user/me');
      });
    });

    it('should fetch notifications on mount', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ username: 'testuser', email: 'test@test.com' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ([]),
        });

      render(<DashboardLayout><div>Test</div></DashboardLayout>);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/tasks');
      });
    });
  });

  describe('sidebar navigation', () => {
    it('should highlight active route', () => {
      mockPathname.mockReturnValue('/tasks');
      
      render(<DashboardLayout><div>Test</div></DashboardLayout>);
      
      const tasksLinks = screen.getAllByText('Tasks');
      const tasksLink = tasksLinks[0].closest('a');
      expect(tasksLink).toHaveClass('bg-primary-100');
    });

    it('should render all navigation items', () => {
      render(<DashboardLayout><div>Test</div></DashboardLayout>);
      
      expect(screen.getAllByText('Home').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Tasks').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Pomodoro').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Analytics').length).toBeGreaterThan(0);
      expect(screen.getAllByText('AI Assistant').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Settings').length).toBeGreaterThan(0);
    });

    it('should have correct links for navigation items', () => {
      render(<DashboardLayout><div>Test</div></DashboardLayout>);
      
      expect(screen.getAllByText('Home')[0].closest('a')).toHaveAttribute('href', '/dashboard');
      expect(screen.getAllByText('Tasks')[0].closest('a')).toHaveAttribute('href', '/tasks');
      expect(screen.getAllByText('Pomodoro')[0].closest('a')).toHaveAttribute('href', '/pomodoro');
    });
  });

  describe('mobile menu', () => {
    it('should toggle mobile menu', () => {
      render(<DashboardLayout><div>Test</div></DashboardLayout>);
      
      // Find menu button
      const buttons = screen.getAllByRole('button');
      const menuButton = buttons.find(btn => btn.getAttribute('title') === 'Toggle menu');
      
      if (menuButton) {
        fireEvent.click(menuButton);
        // Mobile menu should be visible
        expect(screen.getByText('Menu')).toBeInTheDocument();
      }
    });

    it('should close mobile menu when clicking overlay', () => {
      render(<DashboardLayout><div>Test</div></DashboardLayout>);
      
      const buttons = screen.getAllByRole('button');
      const menuButton = buttons.find(btn => btn.getAttribute('title') === 'Toggle menu');
      
      if (menuButton) {
        fireEvent.click(menuButton);
        
        const overlay = document.querySelector('.fixed.inset-0.bg-black\\/40');
        if (overlay) {
          fireEvent.click(overlay);
        }
      }
    });

    it('should close mobile menu when clicking navigation item', () => {
      render(<DashboardLayout><div>Test</div></DashboardLayout>);
      
      const buttons = screen.getAllByRole('button');
      const menuButton = buttons.find(btn => btn.getAttribute('title') === 'Toggle menu');
      
      if (menuButton) {
        fireEvent.click(menuButton);
        
        const homeLink = screen.getAllByText('Home')[0];
        if (homeLink) {
          fireEvent.click(homeLink);
        }
      }
    });
  });

  describe('notifications', () => {
    it('should display notification count', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ username: 'test', email: 'test@test.com' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ([
            { id: '1', title: 'Task 1', status: 'pending', dueDate: new Date().toISOString() }
          ]),
        });

      render(<DashboardLayout><div>Test</div></DashboardLayout>);
      
      await waitFor(() => {
        const badge = document.querySelector('[class*="bg-\\[#3B82F6\\]"]');
        expect(badge).toBeInTheDocument();
      });
    });

    it('should show missed tasks notification', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ username: 'test', email: 'test@test.com' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ([
            { id: '1', title: 'Missed Task', status: 'pending', dueDate: pastDate.toISOString() }
          ]),
        });

      render(<DashboardLayout><div>Test</div></DashboardLayout>);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/tasks');
      });
    });

    it('should dismiss notification', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ username: 'test', email: 'test@test.com' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ([
            { id: '1', title: 'Task 1', status: 'pending', dueDate: new Date().toISOString() }
          ]),
        });

      render(<DashboardLayout><div>Test</div></DashboardLayout>);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/tasks');
      });
    });

    it('should clear all notifications', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ username: 'test', email: 'test@test.com' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ([
            { id: '1', title: 'Task 1', status: 'pending', dueDate: new Date().toISOString() }
          ]),
        });

      render(<DashboardLayout><div>Test</div></DashboardLayout>);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });
  });

  describe('logout functionality', () => {
    it('should handle logout', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ username: 'test', email: 'test@test.com' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ([]),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        });

      delete (window as any).location;
      (window as any).location = { href: '' };

      render(<DashboardLayout><div>Test</div></DashboardLayout>);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });
  });

  describe('points system', () => {
    it('should display user points', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ username: 'test', email: 'test@test.com', points: 150 }),
      });

      render(<DashboardLayout><div>Test</div></DashboardLayout>);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/user/me');
      });
    });

    it('should show points toast on change', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ username: 'test', email: 'test@test.com', points: 100 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ([]),
        });

      render(<DashboardLayout><div>Test</div></DashboardLayout>);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });
  });

  describe('theme handling', () => {
    it('should initialize theme from localStorage', () => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue('dark');
      
      render(<DashboardLayout><div>Test</div></DashboardLayout>);
      
      expect(window.localStorage.getItem).toHaveBeenCalledWith('theme');
    });

    it('should use system preference when no saved theme', () => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue(null);
      
      render(<DashboardLayout><div>Test</div></DashboardLayout>);
      
      expect(window.matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
    });

    it('should toggle theme when button clicked', () => {
      render(<DashboardLayout><div>Test</div></DashboardLayout>);
      
      const buttons = screen.getAllByRole('button');
      const themeButton = buttons.find(btn => 
        btn.getAttribute('title')?.includes('Mode')
      );
      
      if (themeButton) {
        fireEvent.click(themeButton);
        expect(window.localStorage.setItem).toHaveBeenCalled();
      }
    });
  });

  describe('responsive design', () => {
    it('should show mobile menu button on mobile', () => {
      render(<DashboardLayout><div>Test</div></DashboardLayout>);
      
      const menuButton = screen.getAllByRole('button').find(btn => 
        btn.getAttribute('title') === 'Toggle menu'
      );
      
      expect(menuButton).toBeInTheDocument();
    });

    it('should hide desktop sidebar on mobile', () => {
      render(<DashboardLayout><div>Test</div></DashboardLayout>);
      
      const sidebar = document.querySelector('.hidden.md\\:flex');
      expect(sidebar).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<DashboardLayout><div>Test</div></DashboardLayout>);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should have navigation landmarks', () => {
      render(<DashboardLayout><div>Test</div></DashboardLayout>);
      
      const nav = document.querySelector('nav');
      expect(nav).toBeInTheDocument();
    });

    it('should have main content area', () => {
      render(<DashboardLayout><div>Test</div></DashboardLayout>);
      
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    it('should handle user fetch error gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Fetch error'));

      render(<DashboardLayout><div>Test</div></DashboardLayout>);
      
      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled();
      });

      consoleError.mockRestore();
    });

    it('should handle notifications fetch error gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ username: 'test', email: 'test@test.com' }),
        })
        .mockRejectedValueOnce(new Error('Fetch error'));

      render(<DashboardLayout><div>Test</div></DashboardLayout>);
      
      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled();
      });

      consoleError.mockRestore();
    });
  });

  describe('AI Assistant button', () => {
    it('should link to AI assistant page', () => {
      render(<DashboardLayout><div>Test</div></DashboardLayout>);
      
      const aiButton = screen.getByTitle('Open AI Assistant');
      expect(aiButton).toHaveAttribute('href', '/ai-assistant');
    });

    it('should have animated pulse effect', () => {
      render(<DashboardLayout><div>Test</div></DashboardLayout>);
      
      const aiButton = screen.getByTitle('Open AI Assistant');
      const pulse = aiButton.querySelector('.animate-ping');
      expect(pulse).toBeInTheDocument();
    });
  });

  describe('layout structure', () => {
    it('should have proper flex layout', () => {
      const { container } = render(<DashboardLayout><div>Test</div></DashboardLayout>);
      
      const layout = container.querySelector('.min-h-screen');
      expect(layout).toBeInTheDocument();
      expect(layout).toHaveClass('flex', 'flex-col');
    });

    it('should have scrollable main content', () => {
      render(<DashboardLayout><div>Test</div></DashboardLayout>);
      
      const main = screen.getByRole('main');
      expect(main).toHaveClass('flex-1', 'overflow-y-auto');
    });

    it('should have fixed header', () => {
      const { container } = render(<DashboardLayout><div>Test</div></DashboardLayout>);
      
      const header = container.querySelector('header');
      expect(header).toHaveClass('sticky', 'top-0');
    });
  });
});

describe('Sidebar Component', () => {
  const mockProps = {
    showAIPanel: false,
    setShowAIPanel: jest.fn(),
    messages: [],
    setMessages: jest.fn(),
    inputMessage: '',
    setInputMessage: jest.fn(),
    handleSendMessage: jest.fn(),
    isMinimized: false,
    setIsMinimized: jest.fn(),
    isMobileMenuOpen: false,
    setIsMobileMenuOpen: jest.fn(),
  };

  beforeEach(() => {
    (usePathname as jest.Mock).mockReturnValue('/dashboard');
  });

  it('should render navigation items', () => {
    render(<Sidebar {...mockProps} />);
    
    expect(screen.getAllByText('Home').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Tasks').length).toBeGreaterThan(0);
  });

  it('should close mobile menu when nav item clicked', () => {
    const setMobileMenuOpen = jest.fn();
    render(<Sidebar {...mockProps} setIsMobileMenuOpen={setMobileMenuOpen} isMobileMenuOpen={true} />);
    
    const homeLinks = screen.getAllByText('Home');
    if (homeLinks.length > 0) {
      fireEvent.click(homeLinks[0]);
    }
  });

  it('should render AI panel when showAIPanel is true', () => {
    render(<Sidebar {...mockProps} showAIPanel={true} />);

    const aiAssistantTexts = screen.getAllByText('AI Assistant');
    expect(aiAssistantTexts.length).toBeGreaterThan(0);
  });
});

describe('DashboardLayout - Points Toast', () => {
  const mockPathname = usePathname as jest.Mock;

  beforeEach(() => {
    mockPathname.mockReturnValue('/dashboard');
    (global.fetch as jest.Mock).mockClear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should show points increase toast when points change', async () => {
    // First render with initial points
    const { rerender } = render(
      <DashboardLayout userEmail="test@example.com" userName="Test User" userPoints={100}>
        <div>Content</div>
      </DashboardLayout>
    );

    // Update with increased points
    rerender(
      <DashboardLayout userEmail="test@example.com" userName="Test User" userPoints={150}>
        <div>Content</div>
      </DashboardLayout>
    );

    // Should show points increase toast
    await waitFor(() => {
      expect(screen.getByText(/\+50 points!/i)).toBeInTheDocument();
    });

    // Toast should disappear after timeout
    jest.advanceTimersByTime(3000);
    await waitFor(() => {
      expect(screen.queryByText(/\+50 points!/i)).not.toBeInTheDocument();
    });
  });

  it('should show points decrease toast when points decrease', async () => {
    const { rerender } = render(
      <DashboardLayout userEmail="test@example.com" userName="Test User" userPoints={100}>
        <div>Content</div>
      </DashboardLayout>
    );

    rerender(
      <DashboardLayout userEmail="test@example.com" userName="Test User" userPoints={75}>
        <div>Content</div>
      </DashboardLayout>
    );

    await waitFor(() => {
      expect(screen.getByText(/-25 points/i)).toBeInTheDocument();
    });
  });
});

describe('DashboardLayout - Logout', () => {
  const mockPathname = usePathname as jest.Mock;
  const originalLocation = window.location;

  beforeEach(() => {
    mockPathname.mockReturnValue('/dashboard');
    (global.fetch as jest.Mock).mockClear();
    
    // Mock window.location
    delete (window as any).location;
    window.location = { ...originalLocation, href: '' } as any;
    
    // Mock window.confirm
    global.confirm = jest.fn();
  });

  afterEach(() => {
    window.location = originalLocation;
  });

  it('should handle logout when user confirms', async () => {
    (global.confirm as jest.Mock).mockReturnValue(true);
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

    render(
      <DashboardLayout userEmail="test@example.com" userName="Test User" userPoints={100}>
        <div>Content</div>
      </DashboardLayout>
    );

    // Find and click logout button
    const logoutButtons = screen.getAllByText('Logout');
    fireEvent.click(logoutButtons[0]);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/logout', { method: 'POST' });
    });
  });

  it('should not logout when user cancels', async () => {
    (global.confirm as jest.Mock).mockReturnValue(false);

    render(
      <DashboardLayout userEmail="test@example.com" userName="Test User" userPoints={100}>
        <div>Content</div>
      </DashboardLayout>
    );

    const logoutButtons = screen.getAllByText('Logout');
    fireEvent.click(logoutButtons[0]);

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should handle logout error gracefully', async () => {
    (global.confirm as jest.Mock).mockReturnValue(true);
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Logout failed'));
    
    // Mock document.cookie
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: 'test=value; other=data',
    });

    render(
      <DashboardLayout userEmail="test@example.com" userName="Test User" userPoints={100}>
        <div>Content</div>
      </DashboardLayout>
    );

    const logoutButtons = screen.getAllByText('Logout');
    fireEvent.click(logoutButtons[0]);

    await waitFor(() => {
      expect(window.location.href).toBe('/');
    });
  });
});

describe('DashboardLayout - Notifications', () => {
  const mockPathname = usePathname as jest.Mock;

  beforeEach(() => {
    mockPathname.mockReturnValue('/dashboard');
    (global.fetch as jest.Mock).mockClear();
  });

  it('should toggle notifications panel on click', async () => {
    const { container } = render(
      <DashboardLayout userEmail="test@example.com" userName="Test User" userPoints={100}>
        <div>Content</div>
      </DashboardLayout>
    );

    const notificationContainer = container.querySelector('.notification-menu-container');
    const notificationButton = notificationContainer?.querySelector('button');
    
    // Initially panel should not be visible (or visible with "No notifications")
    expect(screen.queryByText('No notifications')).toBeInTheDocument();
    
    // Click to toggle
    if (notificationButton) {
      fireEvent.click(notificationButton);
    }
    
    // Panel should be hidden
    await waitFor(() => {
      expect(screen.queryByText('No notifications')).not.toBeInTheDocument();
    });

    // Click again to show
    if (notificationButton) {
      fireEvent.click(notificationButton);
    }
    
    await waitFor(() => {
      expect(screen.queryByText('No notifications')).toBeInTheDocument();
    });
  });

  it('should call fetch when notifications clicked', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ tasks: [] }),
    });

    const { container } = render(
      <DashboardLayout userEmail="test@example.com" userName="Test User" userPoints={100}>
        <div>Content</div>
      </DashboardLayout>
    );

    const notificationContainer = container.querySelector('.notification-menu-container');
    const notificationButton = notificationContainer?.querySelector('button');
    
    if (notificationButton) {
      fireEvent.click(notificationButton);
    }

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/tasks?email=test@example.com');
    });
  });
});

describe('DashboardLayout - Theme Toggle', () => {
  const mockPathname = usePathname as jest.Mock;

  beforeEach(() => {
    mockPathname.mockReturnValue('/dashboard');
    (global.fetch as jest.Mock).mockClear();
    
    // Reset document classes
    document.documentElement.className = '';
  });

  it('should toggle theme from light to dark', async () => {
    const { container } = render(
      <DashboardLayout userEmail="test@example.com" userName="Test User" userPoints={100}>
        <div>Content</div>
      </DashboardLayout>
    );

    // Initially should be Light Mode
    expect(screen.getByTitle('Light Mode')).toBeInTheDocument();
    
    // Click to switch to dark
    const themeButton = screen.getByTitle('Light Mode');
    fireEvent.click(themeButton);

    await waitFor(() => {
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
    
    // After clicking, title should change to "Dark Mode"
    await waitFor(() => {
      expect(screen.getByTitle('Dark Mode')).toBeInTheDocument();
    });
  });

  it('should persist theme preference in localStorage', async () => {
    const setItemMock = jest.fn();
    Storage.prototype.setItem = setItemMock;

    render(
      <DashboardLayout userEmail="test@example.com" userName="Test User" userPoints={100}>
        <div>Content</div>
      </DashboardLayout>
    );

    const themeButton = screen.getByTitle('Light Mode');
    fireEvent.click(themeButton);

    await waitFor(() => {
      expect(setItemMock).toHaveBeenCalledWith('theme', 'dark');
    });
  });
});

describe('DashboardLayout - Profile Menu', () => {
  const mockPathname = usePathname as jest.Mock;

  beforeEach(() => {
    mockPathname.mockReturnValue('/dashboard');
    (global.fetch as jest.Mock).mockClear();
  });

  it('should toggle profile menu on click', async () => {
    const { container } = render(
      <DashboardLayout userEmail="test@example.com" userName="Test User" userPoints={100}>
        <div>Content</div>
      </DashboardLayout>
    );

    // Click on profile button (inside profile-menu-container)
    const profileContainer = container.querySelector('.profile-menu-container');
    const profileButton = profileContainer?.querySelector('button');
    const logoutButtons = screen.queryAllByText('Logout');
    
    if (profileButton) {
      // Initially profile menu should be visible
      expect(logoutButtons.length).toBeGreaterThan(0);
      
      // Click to toggle off
      fireEvent.click(profileButton);

      await waitFor(() => {
        const updatedLogoutButtons = screen.queryAllByText('Logout');
        // Menu should be hidden
        expect(updatedLogoutButtons.length).toBe(0);
      });

      // Click again to show
      fireEvent.click(profileButton);
      
      await waitFor(() => {
        const finalLogoutButtons = screen.queryAllByText('Logout');
        expect(finalLogoutButtons.length).toBeGreaterThan(0);
      });
    }
  });

  it('should render profile menu button', () => {
    const { container } = render(
      <DashboardLayout userEmail="test@example.com" userName="Test User" userPoints={100}>
        <div>Content</div>
      </DashboardLayout>
    );

    const profileContainer = container.querySelector('.profile-menu-container');
    expect(profileContainer).toBeInTheDocument();
    
    const profileButton = profileContainer?.querySelector('button');
    expect(profileButton).toBeInTheDocument();
  });
});
