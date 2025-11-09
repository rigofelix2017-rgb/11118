// Cookie utility functions with enhanced security
export const BETA_NOTICE_COOKIE = "beta_notice_acknowledged";
export const EPILEPSY_WARNING_COOKIE = "epilepsy_warning_acknowledged";
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

/**
 * Get a cookie value by name
 * 
 * SSR-safe: Returns null if running on server
 */
export function getCookie(name: string): string | null {
  // SSR safety check
  if (typeof document === 'undefined') {
    return null;
  }
  
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [cookieName, cookieValue] = cookie.trim().split('=');
    if (cookieName === name) {
      return cookieValue;
    }
  }
  return null;
}

/**
 * Set a cookie with name, value, and optional max age
 * 
 * SECURITY ENHANCEMENTS:
 * - SameSite=Lax: Prevents CSRF attacks
 * - Secure flag: Only send over HTTPS in production
 * - Cookie verification: Warns if browser blocks cookies
 * - SSR safety: No-op if running on server
 * 
 * FIXES PRODUCTION BUG: Cookies now persist correctly in HTTPS deployments
 */
export function setCookie(name: string, value: string, maxAge: number = COOKIE_MAX_AGE): void {
  // SSR safety check
  if (typeof document === 'undefined') {
    return;
  }
  
  // Detect production environment (HTTPS)
  const isProduction = typeof window !== 'undefined' && window.location.protocol === 'https:';
  
  // Add Secure flag for production (HTTPS only)
  const secureFlag = isProduction ? ' Secure;' : '';
  
  // Build cookie string with security flags
  const cookieString = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Lax;${secureFlag}`;
  
  document.cookie = cookieString;
  
  // Verify cookie was set successfully
  const verified = getCookie(name) === value;
  if (!verified) {
    console.warn(`⚠️ Cookie '${name}' failed to set. Browser may be blocking cookies.`);
    console.warn(`   Check browser settings or privacy extensions.`);
  }
}

/**
 * Delete a cookie by name
 * 
 * Sets max-age to 0 to immediately expire the cookie
 */
export function deleteCookie(name: string): void {
  // SSR safety check
  if (typeof document === 'undefined') {
    return;
  }
  
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax;`;
  
  // Verify cookie was deleted
  const stillExists = getCookie(name) !== null;
  if (stillExists) {
    console.warn(`⚠️ Cookie '${name}' failed to delete.`);
  }
}

/**
 * Check if a boolean cookie is set to true
 */
export function isCookieTrue(name: string): boolean {
  return getCookie(name) === 'true';
}

/**
 * Check if cookies are enabled in the browser
 * 
 * Useful for showing warnings to users with cookies disabled
 */
export function areCookiesEnabled(): boolean {
  // SSR safety check
  if (typeof document === 'undefined') {
    return false;
  }
  
  const testCookie = '__cookie_test__';
  setCookie(testCookie, 'test', 60); // 60 second test cookie
  const enabled = getCookie(testCookie) === 'test';
  deleteCookie(testCookie);
  return enabled;
}
