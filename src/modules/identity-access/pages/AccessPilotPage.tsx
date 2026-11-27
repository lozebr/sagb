import AccessAdminPanel from './AccessAdminPanel';
import React, { useEffect, useState } from 'react';
import { verifySagBAdmission } from '../adapters/sagbAdmission.js';
import { createPilotClient } from '../services/pilotClient.js';
import { RECOVERY_PATH, FIRST_ACCESS_PATH, SESSION_KEY } from '../services/pilotConfig.js';
import { AdmissionRevision, getRecoveryCode } from '../services/admissionLifecycle.js';

const dedicated = !!(import.meta.env.VITE_SAGB_IAM_URL || import.meta.env.VITE_SAGB_IAM_PUBLIC_KEY);
const url = (dedicated ? import.meta.env.VITE_SAGB_IAM_URL : import.meta.env.VITE_SUPABASE_URL) || '';
const key = (dedicated ? import.meta.env.VITE_SAGB_IAM_PUBLIC_KEY : import.meta.env.VITE_SUPABASE_ANON_KEY) || '';
const client = createPilotClient(url, key);
const recoveryMarker = SESSION_KEY + ':recovery';
const isRecovery = window.location.pathname === RECOVERY_PATH;
const isFirstAccess = window.location.pathname === FIRST_ACCESS_PATH;
const firstMarker = SESSION_KEY + ':first-access';
let firstExchange: Promise<boolean> | undefined;
async function firstAccessStep(step: 'prepare' | 'claim'): Promise<boolean> {
  if (!client) return false;
  const verified = await client.auth.getUser();
  if (verified.error || !verified.data.user?.id) return false;
  const claim = await client.schema('sagb').rpc(step === 'prepare' ? 'iam_prepare_first_access' : 'iam_claim_first_access');
  if (claim.error || claim.data !== true) return false;
  const after = await client.auth.getUser();
  return !after.error && after.data.user?.id === verified.data.user.id;
}
function exchangeFirstAccessOnce(): Promise<boolean> {
  if (firstExchange) return firstExchange;
  firstExchange = (async () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const pending = localStorage.getItem(firstMarker) === '1';
      localStorage.removeItem(firstMarker);
      window.history.replaceState(null, '', FIRST_ACCESS_PATH);
      if (!client || !pending || !code || code.length > 2048 || params.has('error') || params.has('error_code')) return false;
      const result = await client.auth.exchangeCodeForSession(code);
      if (result.error || !result.data.session) return false;
      return await firstAccessStep('prepare');
    } catch { return false; }
  })();
  return firstExchange;
}
type View = 'checking' | 'login' | 'denied' | 'admitted' | 'recovery' | 'first-password' | 'expired' | 'configuration';
let recoveryExchange: Promise<boolean> | undefined;

function exchangeRecoveryOnce(): Promise<boolean> {
  if (recoveryExchange) return recoveryExchange;
  recoveryExchange = (async () => {
    try {
      const code = getRecoveryCode(window.location.pathname, window.location.search, sessionStorage.getItem(recoveryMarker) === '1');
      sessionStorage.removeItem(recoveryMarker);
      window.history.replaceState(null, '', RECOVERY_PATH);
      if (!client || !code) return false;
      const result = await client.auth.exchangeCodeForSession(code);
      if (result.error || !result.data.session || !result.data.user) return false;
      const verified = await client.auth.getUser();
      return !verified.error && verified.data.user?.id === result.data.user.id;
    } catch { return false; }
  })();
  return recoveryExchange;
}

export default function AccessPilotPage() {
  const [view, setView] = useState<View>(client ? 'checking' : 'configuration');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [forgot, setForgot] = useState(false);
  const [register, setRegister] = useState(false);
  const [awaitingEmail, setAwaitingEmail] = useState(false);
  const [newPassword, setNewPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [revision] = useState(() => new AdmissionRevision());

  useEffect(() => {
    if (!client) return;
    let mounted = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    // Silent revalidation keeps an admitted screen (and the admin panel state) mounted;
    // a denial or sign-out still replaces it as soon as the server answers.
    let admitted = false;
    const check = async () => {
      const ticket = revision.begin();
      if (mounted && !admitted) setView('checking');
      const decision = await verifySagBAdmission({
        auth: { getUser: () => client.auth.getUser() },
        schema: (name) => ({ rpc: (fn, args) => client.schema(name).rpc(fn, args) })
      }, url);
      if (!mounted || !revision.isCurrent(ticket)) return;
      admitted = decision.allowed;
      setView(decision.allowed ? 'admitted' : decision.reason === 'unauthenticated' ? 'login' : 'denied');
    };
    const schedule = (silent = false) => {
      revision.invalidate();
      if (!silent) admitted = false;
      if (mounted && !admitted) setView('checking');
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => { if (mounted) void check(); }, 0);
    };
    if (isFirstAccess) {
      void exchangeFirstAccessOnce().then(ok => { if (mounted) { setView(ok ? 'first-password' : 'expired'); } });
      return () => { mounted = false; revision.invalidate(); };
    }
    if (isRecovery) {
      void exchangeRecoveryOnce().then(ok => { if (mounted) setView(ok ? 'recovery' : 'expired'); });
      return () => { mounted = false; revision.invalidate(); };
    }
    // No awaited Supabase operations inside onAuthStateChange.
    const { data: { subscription } } = client.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        revision.invalidate(); admitted = false;
        if (timer) clearTimeout(timer);
        if (mounted) setView('login');
      } else schedule(event === 'TOKEN_REFRESHED' || event === 'MFA_CHALLENGE_VERIFIED' || event === 'INITIAL_SESSION');
    });
    schedule();
    // Revalidate membership even if the Auth session has not changed.
    const interval = setInterval(() => schedule(true), 60_000);
    const visibility = () => { if (document.visibilityState === 'visible') schedule(true); };
    document.addEventListener('visibilitychange', visibility);
    return () => {
      mounted = false; revision.invalidate(); subscription.unsubscribe();
      if (timer) clearTimeout(timer); clearInterval(interval);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [revision]);

  async function logout() {
    if (!client) return;
    revision.invalidate(); setView('checking'); setBusy(true); setError('');
    try {
      const { error: failure } = await client.auth.signOut({ scope: 'local' });
      if (failure) throw failure;
      if (isRecovery || isFirstAccess) { window.location.replace('/'); return; }
      setView('login');
    } catch {
      // Don't restore admitted UI after a failed logout.
      setView(isRecovery ? 'expired' : 'denied'); setError('Não foi possível encerrar a sessão. Tente novamente.');
    } finally { setBusy(false); setPassword(''); }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!client || busy) return;
    setBusy(true); setError(''); setNotice('');
    try {
      if (view === 'first-password') {
        if (password.length < 8) { setError('Use pelo menos 8 caracteres.'); return; }
        const changed = await client.auth.updateUser({ password });
        if (changed.error) throw changed.error;
        const revoked = await client.auth.signOut({ scope: 'others' });
        if (revoked.error) throw revoked.error;
        if (!(await firstAccessStep('claim'))) { setError('Senha definida, mas o acesso ainda não foi liberado. Solicite um novo link de primeiro acesso.'); return; }
        setPassword('');
        window.location.replace('/');
        return;
      }
      if (view === 'admitted' && newPassword) {
        if (password.length < 8) { setError('Use pelo menos 8 caracteres.'); return; }
        const { error: failure } = await client.auth.updateUser({ password });
        if (failure) throw failure;
        setPassword(''); setNewPassword(false); setNotice('Senha definida.');
        return;
      }
      if (view === 'recovery') {
        if (password.length < 8) { setError('Use pelo menos 8 caracteres.'); return; }
        const { error: failure } = await client.auth.updateUser({ password });
        if (failure) throw failure;
        setPassword('');
        await logout();
        return;
      }
      if (view !== 'login') return;
      if (register) {
        localStorage.setItem(firstMarker, '1');
        const { error: failure } = await client.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: true, emailRedirectTo: window.location.origin + FIRST_ACCESS_PATH } });
        if (failure) { localStorage.removeItem(firstMarker); setError('Não foi possível solicitar o primeiro acesso. Tente novamente.'); return; }
        setAwaitingEmail(true); setNotice('Confira seu e-mail. Abra o link mais recente no mesmo navegador usado para solicitar o acesso. Não é necessário digitar um código.');
      } else if (forgot) {
        sessionStorage.setItem(recoveryMarker, '1');
        const { error: failure } = await client.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: window.location.origin + RECOVERY_PATH
        });
        if (failure) sessionStorage.removeItem(recoveryMarker);
        setNotice('Se a conta estiver disponível, você receberá um link. Abra-o neste mesmo navegador e aba.');
      } else {
        const { error: failure } = await client.auth.signInWithPassword({ email: email.trim(), password });
        if (failure) { setError('Não foi possível entrar. Confira os dados ou recupere a senha.'); return; }
        setPassword('');
        // SIGNED_IN triggers verification; no legacy shell or local permission fallback.
      }
    } catch {
      setError('Não foi possível concluir a operação. Tente novamente.');
    } finally { setBusy(false); }
  }

  return <main className="min-h-screen bg-white text-gray-900 flex items-center justify-center p-6 font-sans">
    <section className="w-full max-w-md rounded-2xl bg-white shadow-lg p-8 space-y-5">
      <header><div className="text-sm font-semibold text-teal-700">SagB · Identidade e Acesso</div>
        <h1 className="text-2xl font-semibold mt-2">{view === 'admitted' ? 'Acesso autorizado' : (view === 'recovery' || view === 'first-password') ? 'Defina sua senha' : 'Bem-vindo ao SagB'}</h1>
        <p className="text-sm text-gray-500 mt-2">Ambiente candidato · Incubadora LOZE</p>
      </header>
      {view === 'configuration' && <p role="alert">Acesso ainda não configurado. Aguarde a liberação do ambiente pelo Hub.</p>}
      {view === 'checking' && <p role="status">Verificando sua sessão e autorização...</p>}
      {view === 'denied' && <><p role="alert">Acesso não autorizado ou ainda indisponível. Solicite a liberação do SagB ao administrador.</p><button type="button" disabled={busy} onClick={() => void logout()}>Sair / trocar de conta</button></>}
      {view === 'expired' && <><p role="alert">Não foi possível concluir a confirmação. Abra o link mais recente no mesmo navegador. Se o erro persistir, solicite um novo link.</p><button type="button" onClick={() => void logout()} disabled={busy}>Voltar ao login</button></>}
      {view === 'admitted' && <><p role="status">Sua identidade foi validada pelo módulo IAM. Os demais módulos aguardam integração segura ao novo banco.</p><div className="flex flex-wrap gap-3"><button type="button" disabled={busy} className="rounded-lg border border-gray-200 px-4 py-2 text-sm" onClick={() => { setNewPassword(!newPassword); setPassword(''); }}>{newPassword ? 'Cancelar' : 'Definir / alterar minha senha'}</button><button type="button" disabled={busy} className="rounded-lg border border-gray-200 px-4 py-2 text-sm" onClick={() => void logout()}>Sair</button></div></>}
      {(view === 'login' || view === 'recovery' || view === 'first-password' || (view === 'admitted' && newPassword)) && <form onSubmit={submit} className="space-y-4">
        {view === 'login' && <label className="block text-sm">E-mail<input className="block w-full mt-1 rounded-lg border border-gray-200 p-3" type="email" required value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" /></label>}
        {(view === 'recovery' || view === 'first-password' || (view === 'admitted' && newPassword) || (view === 'login' && !forgot && !register)) && <label className="block text-sm">{view !== 'login' ? 'Nova senha' : 'Senha'}<input className="block w-full mt-1 rounded-lg border border-gray-200 p-3" type="password" required minLength={view === 'login' ? 1 : 8} value={password} onChange={e => setPassword(e.target.value)} autoComplete={view === 'login' ? 'current-password' : 'new-password'} /></label>}
        <button disabled={busy} className="w-full rounded-lg bg-teal-700 text-white p-3 font-medium" type="submit">{busy ? 'Aguarde...' : view !== 'login' ? 'Salvar nova senha' : register ? (awaitingEmail ? 'Reenviar link' : 'Criar minha conta') : forgot ? 'Enviar recuperação' : 'Entrar'}</button>
        {view === 'login' && <div className="flex flex-wrap gap-4"><button type="button" disabled={busy} className="text-sm text-teal-700" onClick={() => { setRegister(!register); setForgot(false); setAwaitingEmail(false); setPassword(''); setNotice(''); setError(''); }}>{register ? 'Voltar ao login' : 'Criar minha conta'}</button>{!register && <button type="button" disabled={busy} className="text-sm text-teal-700" onClick={() => { setForgot(!forgot); setPassword(''); setNotice(''); setError(''); }}>{forgot ? 'Voltar ao login' : 'Esqueci minha senha'}</button>}</div>}
      </form>}
      {view === 'admitted' && client && <AccessAdminPanel client={client}/>}
      {view === 'first-password' && <button type="button" disabled={busy} onClick={() => void logout()}>Voltar ao login</button>}
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="text-sm text-gray-600">{notice}</p>}
      <p className="text-xs text-gray-400">Cadastro com confirmação de e-mail. A entrada no SagB depende de autorização prévia.</p>
    </section>
  </main>;
}
