import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

const authSource = read('services/supabase.ts');
const authUI = read('components/Auth.tsx');
const appSource = read('App.tsx');
const nagiRegistry = read('src/modules/nagi/data/demoProducts.ts');
const nagiUI = read('src/modules/nagi/components/PublishedLinksSection.tsx');
const nagiCore = read('src/modules/nagi/components/NAGIView.tsx');

const validUser = { id: 'user-1', email: 'autorizado@example.com' };
const makeResponse = (status, value = {}) => ({
  status, ok: status >= 200 && status < 300, statusText: status === 401 ? 'Unauthorized' : 'OK',
  json: async () => value, text: async () => JSON.stringify(value)
});

function makeRuntime(fetchFn, { configured = true } = {}) {
  const storage = new Map();
  const location = { origin: 'https://deploy-preview-6--sagbapp.netlify.app', pathname: '/', hash: '', search: '' };
  const window = {
    location,
    localStorage: {
      getItem: (key) => storage.get(key) || null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: (key) => storage.delete(key)
    },
    history: {
      replaceState: (_a, _b, path) => { location.pathname = path; location.hash = ''; location.search = ''; }
    }
  };
  const boundary = authSource.indexOf('// Mantém "db"');
  assert.ok(boundary > 0, 'A fronteira do shim Auth deve existir');
  const isolated = authSource.slice(0, boundary)
    .replaceAll('import.meta.env.VITE_SUPABASE_URL', JSON.stringify(configured ? 'https://sagb-test.supabase.co' : ''))
    .replaceAll('import.meta.env.VITE_SUPABASE_ANON_KEY', JSON.stringify(configured ? 'sb_publishable_test' : ''))
    .replace(/\bexport\s+(?=(const|type|interface|class|function)\b)/g, '');
  const js = ts.transpileModule(isolated + '\nglobalThis.__auth = auth; globalThis.__stored = getStoredSession;', {
    compilerOptions: { module: ts.ModuleKind.None, target: ts.ScriptTarget.ES2022 },
    reportDiagnostics: true
  });
  assert.equal(js.diagnostics?.length || 0, 0);
  const sandbox = { window, URL, URLSearchParams, console: { warn() {}, error() {}, log() {} }, fetch: fetchFn, Date, Promise };
  vm.runInNewContext(js.outputText, sandbox, { timeout: 1200 });
  return { auth: sandbox.__auth, getSession: sandbox.__stored, window, storage };
}

test('Login e logout reais do adaptador: REST Auth, sessão persistida e revogação local', async () => {
  const requests = [];
  const api = makeRuntime(async (url, options = {}) => {
    requests.push({ url, method: options.method });
    if (url.includes('/token?grant_type=password')) return makeResponse(200, {
      access_token: 'token1', refresh_token: 'refresh1', expires_in: 3600, user: validUser
    });
    if (url.includes('/logout')) return makeResponse(204);
    return makeResponse(404);
  });
  const login = await api.auth.signInWithPassword({ email: validUser.email, password: 'a-safe-test-password' });
  assert.equal(login.error, null);
  assert.equal(login.data.user.id, validUser.id);
  assert.equal(api.auth.currentUser.id, validUser.id);
  assert.ok(api.storage.has('sagb_supabase_session_v1'));
  assert.ok(api.getSession().expires_at > Math.floor(Date.now() / 1000));
  await api.auth.signOut();
  assert.equal(api.auth.currentUser, null);
  assert.equal(api.storage.has('sagb_supabase_session_v1'), false);
  assert.ok(requests.some((r) => r.url.includes('/logout') && r.method === 'POST'));
});

test('Senha incorreta não cria sessão e retorna erro tipado', async () => {
  const api = makeRuntime(async () => makeResponse(400, { msg: 'Invalid login credentials' }));
  const result = await api.auth.signInWithPassword({ email: 'a@b.com', password: 'wrong' });
  assert.equal(result.data.user, null);
  assert.equal(result.error.code, 'auth/invalid-credentials');
  assert.equal(api.getSession(), null);
});

test('Sessão expirada é renovada antes de consultar o usuário', async () => {
  const called = [];
  const api = makeRuntime(async (url, options = {}) => {
    called.push(url);
    if (url.includes('grant_type=password')) return makeResponse(200, {
      access_token: 'expired', refresh_token: 'refresh1', expires_in: -1, user: validUser
    });
    if (url.includes('grant_type=refresh_token')) return makeResponse(200, {
      access_token: 'renewed', refresh_token: 'refresh2', expires_in: 3600, user: validUser
    });
    if (url.endsWith('/user') && options.method === 'GET') return makeResponse(200, validUser);
    return makeResponse(400);
  });
  await api.auth.signInWithPassword({ email: validUser.email, password: 'secret' });
  const result = await api.auth.getUser();
  assert.equal(result.data.user.id, validUser.id);
  assert.equal(api.getSession().access_token, 'renewed');
  assert.ok(called.some((url) => url.includes('grant_type=refresh_token')));
});

test('Recuperação de senha usa redirect do próprio Preview, valida token e atualiza via PUT', async () => {
  const called = [];
  const api = makeRuntime(async (url, options = {}) => {
    called.push({ url, options });
    if (url.includes('/recover')) return makeResponse(200);
    if (url.endsWith('/user') && options.method === 'GET') return makeResponse(200, validUser);
    if (url.endsWith('/user') && options.method === 'PUT') return makeResponse(200, validUser);
    if (url.includes('/logout')) return makeResponse(204);
    return makeResponse(400);
  });
  assert.equal((await api.auth.resetPasswordForEmail(validUser.email)).error, null);
  const recover = called.find((r) => r.url.includes('/recover'));
  assert.ok(recover.url.includes(encodeURIComponent('https://deploy-preview-6--sagbapp.netlify.app/auth/reset-password')));
  api.window.location.pathname = '/auth/reset-password';
  api.window.location.hash = '#access_token=recovery_token&refresh_token=recovery_refresh&type=recovery&expires_in=3600';
  assert.equal((await api.auth.consumeRecoveryLink()).error, null);
  assert.equal(api.window.location.hash, '');
  assert.equal((await api.auth.updatePassword('minha-senha-mais-forte')).error, null);
  const put = called.find((r) => r.url.endsWith('/user') && r.options.method === 'PUT');
  assert.equal(JSON.parse(put.options.body).password, 'minha-senha-mais-forte');
  await api.auth.signOut();
  assert.equal(api.getSession(), null);
});

test('Link de recuperação expirado não autentica e não preserva token na URL', async () => {
  const api = makeRuntime(async () => makeResponse(400));
  api.window.location.pathname = '/auth/reset-password';
  api.window.location.hash = '#type=recovery&error_code=otp_expired&error_description=expired';
  const result = await api.auth.consumeRecoveryLink();
  assert.ok(result.error);
  assert.equal(api.window.location.hash, '');
  assert.equal(api.getSession(), null);
});

test('Ambiente sem Supabase mostra erro de configuração sem tentativa de rede', async () => {
  let count = 0;
  const api = makeRuntime(async () => { count++; return makeResponse(200); }, { configured: false });
  const result = await api.auth.signInWithPassword({ email: 'user@example.com', password: 'x' });
  assert.equal(result.error.code, 'auth/configuration-not-found');
  assert.equal(count, 0);
});

test('React Auth e App compilam sintaticamente, exibem recuperação sem privilégios fictícios', () => {
  for (const [path, jsx] of [['components/Auth.tsx', authUI], ['App.tsx', appSource]]) {
    const result = ts.transpileModule(jsx, {
      fileName: path,
      compilerOptions: { jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
      reportDiagnostics: true
    });
    assert.equal(result.diagnostics?.length || 0, 0, path);
  }
  assert.match(authUI, /Esqueci minha senha/);
  assert.match(authUI, /Salvar nova senha/);
  assert.match(appSource, /isPasswordRecoveryActive/);
  assert.doesNotMatch(appSource, /console\.log\('App: Perfil carregado do banco de dados:'/);
  assert.match(appSource, /tier: 'OPERACIONAL'/);
});

test('NAGI mantém identidade canônica, declara proveniência histórica e não assume schemas externos', () => {
  assert.match(nagiRegistry, /origin: 'historical_links'/);
  assert.match(nagiRegistry, /projectClass: 'not_verified'/);
  assert.match(nagiRegistry, /'loze_products_incubator' \| 'client_apps_incubator'/);
  assert.match(nagiRegistry, /previewEvidence: override\.status === 'validated'/);
  assert.match(nagiUI, /Fonte: \{product\.dataReference\.origin/);
  assert.match(nagiUI, /Supabase: \{product\.dataReference\.projectClass/);
  assert.match(nagiCore, /Dados de trabalho locais deste navegador/);
  assert.doesNotMatch(nagiRegistry, /service_role|SUPABASE_SERVICE_ROLE_KEY/i);
});

test('Cadastro não concede cargo administrativo nem tier estratégico a partir de campo autodeclarado', () => {
  assert.match(authUI, /role: 'member'/);
  assert.match(authUI, /requestedRole: role\.trim\(\)/);
  assert.match(authUI, /tier: 'OPERACIONAL'/);
  assert.doesNotMatch(authUI, /tier: inferTier\(/);
});

test('Validação inicial de sessão não sobrescreve login/logout ocorrido durante a requisição', () => {
  assert.match(authSource, /let authEventGeneration = 0;/);
  assert.match(authSource, /if \(authEventGeneration === initialGeneration\) deliver\(data\.user \?\? null\)/);
  assert.match(authSource, /authEventGeneration \+= 1;/);
});