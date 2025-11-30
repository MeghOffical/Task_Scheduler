/**
 * List of valid email domains commonly used worldwide
 * Total: 100+ domains
 */
export const VALID_EMAIL_DOMAINS = [
  // Major email providers
  'gmail.com',
  'yahoo.com',
  'outlook.com',
  'hotmail.com',
  'icloud.com',
  'live.com',
  'msn.com',
  'aol.com',
  'mail.com',
  'protonmail.com',
  'zoho.com',
  'yandex.com',
  'gmx.com',
  'inbox.com',
  'tutanota.com',
  'fastmail.com',
  'mail.ru',
  
  // Regional variations
  'yahoo.co.uk',
  'yahoo.co.in',
  'yahoo.ca',
  'yahoo.com.au',
  'yahoo.fr',
  'yahoo.de',
  'hotmail.co.uk',
  'hotmail.fr',
  'hotmail.de',
  'hotmail.it',
  'outlook.co.uk',
  'outlook.fr',
  'outlook.de',
  'outlook.jp',
  'live.co.uk',
  'live.fr',
  'live.de',
  'live.com.au',
  'gmx.de',
  'gmx.net',
  'web.de',
  
  // Professional/Business
  'me.com',
  'mac.com',
  'hey.com',
  'proton.me',
  'pm.me',
  'hushmail.com',
  'rediffmail.com',
  
  // Educational domains (common patterns)
  'edu',
  'ac.uk',
  'edu.au',
  'edu.in',
  'ac.in',
  'edu.cn',
  
  // Corporate email domains
  'qq.com',
  'sina.com',
  '163.com',
  '126.com',
  'naver.com',
  'daum.net',
  'hanmail.net',
  
  // Other popular providers
  'att.net',
  'verizon.net',
  'comcast.net',
  'sbcglobal.net',
  'bellsouth.net',
  'charter.net',
  'cox.net',
  'earthlink.net',
  'juno.com',
  'netzero.net',
  
  // International providers
  'libero.it',
  'orange.fr',
  'free.fr',
  'sfr.fr',
  'laposte.net',
  'wanadoo.fr',
  't-online.de',
  'freenet.de',
  'vodafone.de',
  'alice.it',
  'virgilio.it',
  'tiscali.it',
  'tiscali.co.uk',
  'btinternet.com',
  'virginmedia.com',
  'sky.com',
  'talktalk.net',
  'ntlworld.com',
  
  // Asian providers
  'mail.ru',
  'yandex.ru',
  'rambler.ru',
  'list.ru',
  'inbox.ru',
  '10minutemail.com',
  'temp-mail.org',
  
  // Additional providers
  'gmx.at',
  'gmx.ch',
  'mail.com',
  'email.com',
  'games.com',
  'post.com',
  'usa.com',
  'dr.com',
  'consultant.com',
  'myself.com',
  'europe.com',
  'asia.com',
  'london.com',
  'usa.net',
];

/**
 * Validates if an email address has a valid domain
 * @param email - The email address to validate
 * @returns true if the email has a valid domain, false otherwise
 */
export function isValidEmailDomain(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  // Basic email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return false;
  }

  // Extract domain (everything after @)
  const domain = email.split('@')[1]?.toLowerCase().trim();
  if (!domain) {
    return false;
  }

  // Check if domain matches any valid domain
  if (VALID_EMAIL_DOMAINS.includes(domain)) {
    return true;
  }

  // Check for educational domains (e.g., user@university.edu)
  if (domain.endsWith('.edu') || 
      domain.endsWith('.ac.uk') || 
      domain.endsWith('.edu.au') ||
      domain.endsWith('.edu.in') ||
      domain.endsWith('.ac.in') ||
      domain.endsWith('.edu.cn')) {
    return true;
  }

  return false;
}

/**
 * Gets a user-friendly error message for invalid email domains
 * @returns Error message string
 */
export function getEmailDomainErrorMessage(): string {
  return 'Please use a valid email provider (Gmail, Yahoo, Outlook, etc.) or an educational email address.';
}

/**
 * Validates email format and domain
 * @param email - The email address to validate
 * @returns Object with isValid boolean and error message if invalid
 */
export function validateEmail(email: string): { isValid: boolean; error?: string } {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: 'Email address is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Invalid email format' };
  }

  if (!isValidEmailDomain(email)) {
    return { isValid: false, error: getEmailDomainErrorMessage() };
  }

  return { isValid: true };
}
