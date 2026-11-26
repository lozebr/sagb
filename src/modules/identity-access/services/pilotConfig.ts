import { SAGB_PROJECT_REF } from '../adapters/sagbAdmission.js';

export const TARGET_ORIGIN = 'https://' + SAGB_PROJECT_REF + '.supabase.co';
export const SESSION_KEY = 'sagb-iam-' + SAGB_PROJECT_REF + '-v1';
export const RECOVERY_PATH = '/auth/reset-password';
export const FIRST_ACCESS_PATH = '/auth/first-access';

export function shouldUseIdentityPilot(flag: unknown, url: unknown): boolean {
  // A candidate configured with the shared project must never mount the legacy App.
  return flag === 'true' || (typeof url === 'string' && url.toLowerCase().includes(SAGB_PROJECT_REF));
}
export function isTargetUrl(url: string): boolean {
  return url === TARGET_ORIGIN || url === TARGET_ORIGIN + '/';
}
export function isPublicKey(key: string): boolean {
  if (/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)) return true;
  try {
    const parts = key.split('.');
    if (parts.length !== 3) return false;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload.role === 'anon' && payload.ref === SAGB_PROJECT_REF;
  } catch { return false; }
}
export function isPilotRequestAllowed(url: string, method: string): boolean {
  try {
    const target = new URL(url);
    if (target.origin !== TARGET_ORIGIN || target.username || target.password) return false;
    const verb = method.toUpperCase();
    const authPaths: Record<string, string[]> = {
      '/auth/v1/token': ['POST'],
      '/auth/v1/user': ['GET', 'PUT'],
      '/auth/v1/recover': ['POST'],
      '/auth/v1/otp': ['POST'],
      '/auth/v1/verify': ['POST'],
      '/auth/v1/logout': ['POST'],
    };
    return (authPaths[target.pathname] || []).includes(verb) ||
      (['/rest/v1/rpc/iam_has_permission','/rest/v1/rpc/iam_claim_first_access','/rest/v1/rpc/iam_prepare_first_access'].includes(target.pathname) && verb === 'POST');
  } catch { return false; }
}
