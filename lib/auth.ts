import Cookies from 'js-cookie';

export interface OfficerSession {
  id: string;
  username: string;
  display_name: string;
}

/**
 * Get the current officer session from cookies
 * @returns OfficerSession object or null if not authenticated
 */
export function getSession(): OfficerSession | null {
  try {
    const sessionCookie = Cookies.get('officer_session');

    if (!sessionCookie) {
      return null;
    }

    const session = JSON.parse(sessionCookie) as OfficerSession;

    // Validate session has required fields
    if (!session.id || !session.username || !session.display_name) {
      return null;
    }

    return session;
  } catch (error) {
    console.error('Error parsing session cookie:', error);
    return null;
  }
}

/**
 * Check if user is authenticated, redirect to login if not
 * Use this in client components that require authentication
 * @param redirectUrl - Optional URL to redirect to after login
 */
export function requireAuth(redirectUrl?: string): OfficerSession | null {
  const session = getSession();

  if (!session) {
    // Store intended destination if provided
    if (redirectUrl) {
      Cookies.set('redirect_after_login', redirectUrl, { expires: 1/24 }); // 1 hour
    }

    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }

    return null;
  }

  return session;
}

/**
 * Check if user is authenticated without redirecting
 * @returns true if authenticated, false otherwise
 */
export function isAuthenticated(): boolean {
  return getSession() !== null;
}

/**
 * Log out the current user by clearing the session cookie
 * @param redirectHome - Whether to redirect to home page (default: true)
 */
export function logout(redirectHome: boolean = true): void {
  // Clear the officer session cookie
  Cookies.remove('officer_session');

  // Clear any stored redirect URL
  Cookies.remove('redirect_after_login');

  // Redirect to home page
  if (redirectHome && typeof window !== 'undefined') {
    window.location.href = '/';
  }
}

/**
 * Get the display name of the current officer
 * @returns Display name or null if not authenticated
 */
export function getOfficerName(): string | null {
  const session = getSession();
  return session ? session.display_name : null;
}

/**
 * Get the username of the current officer
 * @returns Username or null if not authenticated
 */
export function getOfficerUsername(): string | null {
  const session = getSession();
  return session ? session.username : null;
}
