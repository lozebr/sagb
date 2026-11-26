import { createSupabaseAuthorizationAdapter, type SupabaseAuthorizationClient } from '../vendor/adapters/index.js';

export const SAGB_PROJECT_REF = 'txyuwaffzgsjndqsralg';
export const SAGB_SCHEMA = 'sagb';
export const SAGB_ENTRY_PERMISSION = 'sagb.access.enter';
export const SAGB_SCOPE = { type: 'product', id: 'sagb' } as const;

// Must be constructed by the future integration using the same user-bound
// Supabase client for getUser and RPC. Never inject a service-role client.
export interface VerifiedUserClient extends SupabaseAuthorizationClient {
  auth: {
    getUser(): PromiseLike<{ data: { user: { id: string } | null }; error: unknown }>;
  };
}
export type Admission = { allowed: true; subject: string } |
  { allowed: false; reason: 'wrong-project' | 'unauthenticated' | 'denied' | 'verification-failed' };

/** Preparation only: UI admission, NOT a substitute for server-side RLS. */
export async function verifySagBAdmission(client: VerifiedUserClient, projectUrl: string): Promise<Admission> {
  try {
    if (new URL(projectUrl).origin !== 'https://' + SAGB_PROJECT_REF + '.supabase.co') {
      return { allowed: false, reason: 'wrong-project' };
    }
    const before = await client.auth.getUser();
    if (before.error || !before.data.user?.id) return { allowed: false, reason: 'unauthenticated' };
    const subject = before.data.user.id;
    const iam = createSupabaseAuthorizationAdapter(client, SAGB_SCHEMA);
    const allowed = await iam.hasPermission(SAGB_ENTRY_PERMISSION, SAGB_SCOPE.type, SAGB_SCOPE.id);
    if (!allowed) return { allowed: false, reason: 'denied' };
    const after = await client.auth.getUser();
    if (after.error || after.data.user?.id !== subject) return { allowed: false, reason: 'verification-failed' };
    return { allowed: true, subject };
  } catch {
    return { allowed: false, reason: 'verification-failed' };
  }
}
