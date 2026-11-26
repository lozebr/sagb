import { createClient } from '@supabase/supabase-js';
import { SAGB_SCHEMA } from '../adapters/sagbAdmission.js';
import { isTargetUrl, isPublicKey, isPilotRequestAllowed, SESSION_KEY } from './pilotConfig.js';

export function createPilotClient(url: string, key: string) {
  if (!isTargetUrl(url) || !isPublicKey(key)) return null;
  return createClient(url, key, {
    db: { schema: SAGB_SCHEMA },
    auth: { storageKey: SESSION_KEY, persistSession: true, autoRefreshToken: true,
      flowType: 'pkce', detectSessionInUrl: false },
    global: { fetch: (input, init) => {
      const target = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      const method = init?.method || (input instanceof Request ? input.method : 'GET');
      if (!isPilotRequestAllowed(target, method)) return Promise.reject(new Error('Endpoint não liberado no piloto SagB.'));
      return fetch(input, { ...init, redirect: 'error' });
    } },
  });
}
