/**
 * FB API Client - Backward Compatibility Layer
 *
 * This module provides backward-compatible exports for legacy code.
 * New code should use tokenManager directly:
 *   tokenManager.ensureValidToken('facebook')
 *
 * @deprecated Use tokenManager for new implementations
 */

import { tokenManager } from './tokenManager';

/**
 * @deprecated Use tokenManager.setLogoutCallback instead
 */
export function setFbLogoutCallback(_callback: () => void): void {
  // No-op: tokenManager.setLogoutCallback handles this centrally
}

/**
 * @deprecated No longer needed - tokenManager handles refresh internally
 */
export function setFbRefreshCallback(_callback: () => Promise<string | null>): void {
  // No-op: Facebook service refresh is configured via tokenManager.register
}

/**
 * @deprecated Use tokenManager.ensureValidToken('facebook') instead
 */
export function ensureValidFbToken(): Promise<string | null> {
  return tokenManager.ensureValidToken('facebook');
}
