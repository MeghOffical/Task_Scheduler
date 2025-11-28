/**
 * Helper functions extracted from auth config for better testability
 * These pure functions can be tested without mongoose dependencies
 */

/**
 * Generate cookie name based on environment
 */
export function getCookieName(baseName: string, prefix: 'secure' | 'host' = 'secure'): string {
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) return baseName;
  
  const prefixString = prefix === 'host' ? '__Host-' : '__Secure-';
  return `${prefixString}${baseName}`;
}

/**
 * Generate unique username from email
 */
export function generateUsername(email: string): string {
  const baseUsername = email.split('@')[0];
  const timestamp = Date.now();
  return `${baseUsername}_${timestamp}`;
}

/**
 * Determine if URL is same origin
 */
export function isSameOrigin(url: string, baseUrl: string): boolean {
  try {
    const urlObj = new URL(url);
    const baseUrlObj = new URL(baseUrl);
    return urlObj.origin === baseUrlObj.origin;
  } catch {
    return false;
  }
}

/**
 * Get redirect URL based on input
 */
export function getRedirectUrl(url: string, baseUrl: string): string {
  try {
    // Redirect to dashboard for base URLs or auth pages
    if (url === baseUrl || 
        url === `${baseUrl}/` || 
        url.includes('/login') || 
        url.includes('/register')) {
      return `${baseUrl}/dashboard`;
    }
    
    // Allow relative URLs
    if (url.startsWith('/')) {
      return `${baseUrl}${url}`;
    }
    
    // Allow same-origin URLs
    if (isSameOrigin(url, baseUrl)) {
      return url;
    }
    
    // Default to dashboard for external URLs
    return `${baseUrl}/dashboard`;
  } catch (error) {
    console.error('Redirect error:', error);
    return `${baseUrl}/dashboard`;
  }
}

/**
 * Validate credentials presence
 */
export function hasValidCredentials(credentials: any): boolean {
  return Boolean(credentials?.email && credentials?.password);
}

/**
 * Get cookie options based on environment
 */
export function getCookieOptions(maxAge?: number) {
  const isProduction = process.env.NODE_ENV === 'production';
  
  const baseOptions = {
    httpOnly: true,
    sameSite: 'lax' as const,
    path: '/',
    secure: isProduction,
  };
  
  if (maxAge !== undefined) {
    return { ...baseOptions, maxAge };
  }
  
  return baseOptions;
}

/**
 * Check if user should be allowed to link OAuth account
 */
export function shouldLinkAccount(
  existingProvider: string | undefined,
  newProvider: string
): boolean {
  // Allow linking if existing provider matches or if it's credentials
  return !existingProvider || 
         existingProvider === newProvider || 
         existingProvider === 'credentials';
}

/**
 * Build user data for OAuth registration
 */
export function buildOAuthUserData(
  email: string,
  name: string | null | undefined,
  image: string | null | undefined,
  provider: string,
  providerId: string
) {
  return {
    email,
    name,
    image,
    provider,
    providerId,
    username: generateUsername(email),
  };
}
