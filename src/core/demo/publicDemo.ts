// Temporary, isolated PR #6 visual demo. Never grants backend authorization.
export function isPublicDemoHost(flag: unknown, hostname: string): boolean {
  return flag === 'true' && hostname === 'deploy-preview-6--sagbapp.netlify.app';
}
export const isPublicDemo = typeof window !== 'undefined' &&
  isPublicDemoHost(import.meta.env.VITE_SAGB_PUBLIC_DEMO, window.location.hostname);

export const demoIdentity = { id: '00000000-0000-4000-8000-000000000006', email: 'demo@example.invalid' };
export const demoProfile = {
  uid: demoIdentity.id, email: demoIdentity.email, name: 'Demonstração SagB',
  nickname: 'Demo', role: 'member', tier: 'OPERACIONAL', company: 'GrupoB',
  avatarUrl: '', createdAt: new Date(0),
};

function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() { return data.size; },
    clear: () => data.clear(),
    getItem: key => data.get(String(key)) ?? null,
    key: index => Array.from(data.keys())[index] ?? null,
    removeItem: key => { data.delete(String(key)); },
    setItem: (key, value) => { data.set(String(key), String(value)); },
  };
}

// Must run before importing ANY legacy module. Fail closed if isolation cannot be installed.
export function isolatePublicDemo(): void {
  if (!isPublicDemo) throw new Error('Preview demo not enabled');
  const policy = document.createElement('meta');
  policy.httpEquiv = 'Content-Security-Policy';
  policy.content = "default-src 'self' data: blob:; connect-src 'none'; form-action 'none'; frame-src 'none'; object-src 'none'; worker-src 'none'; base-uri 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob:";
  document.head.prepend(policy);
  for (const name of ['localStorage', 'sessionStorage'] as const) {
    const storage = memoryStorage();
    Object.defineProperty(window, name, { configurable: true, get: () => storage });
    if (window[name] !== storage) throw new Error('Demo storage isolation failed');
  }
  window.fetch = async () => { throw new Error('Demonstração: comunicação externa desativada.'); };
}
