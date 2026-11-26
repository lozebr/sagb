import React, { useEffect, useState } from 'react';
import { verifySagBAdmission } from '../adapters/sagbAdmission.js';
import { createPilotClient } from '../services/pilotClient.js';
import { RECOVERY_PATH, SESSION_KEY } from '../services/pilotConfig.js';
import { AdmissionRevision, getRecoveryCode } from '../services/admissionLifecycle.js';

const url = import.meta.env.VITE_SUPABASE_URL || '';
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const client = createPilotClient(url, key);
const recoveryMarker = SESSION_KEY + ':recovery';
const isRecovery = window.location.pathname === RECOVERY_PATH;
type View = 'checking' | 'login' | 'denied' | 'admitted' | 'recovery' | 'expired' | 'configuration';
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
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [revision] = useState(() => new AdmissionRevision());

  useEffect(() => {
    if (!client) return;
    let mounted = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const check = async () => {
      const ticket = revision.begin();
      if (mounted) setView('checking');
      const decision = await verifySagBAdmission({
        auth: { getUser: () => client.auth.getUser() },
        schema: (name) => ({ rpc: (fn, args) => client.schema(name).rpc(fn, args) })
      }, url);
      if (!mounted || !revision.isCurrent(ticket)) return;
      setView(decision.allowed ? 'admitted' : decision.reason === 'unauthenticated' ? 'login' : 'denied');
    };
    const schedule = () => {
      revision.invalidate();
      if (mounted) setView('checking');
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => { if (mounted) void check(); }, 0);
    };
    if (isRecovery) {
      void exchangeRecoveryOnce().then(ok => { if (mounted) setView(ok ? 'recovery' : 'expired'); });
      return () => { mounted = false; revision.invalidate(); };
    }
    // No awaited Supabase operations inside onAuthStateChange.
    const { data: { subscription } } = client.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        revision.invalidate();
        if (timer) clearTimeout(timer);
        if (mounted) setView('login');
      } else schedule();
    });
    schedule();
    // Revalidate membership even if the Auth session has not changed.
    const interval = setInterval(schedule, 60_000);
    const visibility = () => { if (document.visibilityState === 'visible') schedule(); };
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
      if (isRecovery) { window.location.replace('/'); return; }
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
      if (view === 'recovery') {
        if (password.length < 8) { setError('Use pelo menos 8 caracteres.'); return; }
        const { error: failure } = await client.auth.updateUser({ password });
        if (failure) throw failure;
        setPassword('');
        await logout();
        return;
      }
      if (view !== 'login') return;
      if (forgot) {
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
        <h1 className="text-2xl font-semibold mt-2">{view === 'admitted' ? 'Acesso autorizado' : view === 'recovery' ? 'Nova senha' : 'Bem-vindo ao SagB'}</h1>
        <p className="text-sm text-gray-500 mt-2">Ambiente candidato · Incubadora LOZE</p>
      </header>
      {view === 'configuration' && <p role="alert">Acesso ainda não configurado. Aguarde a liberação do ambiente pelo Hub.</p>}
      {view === 'checking' && <p role="status">Verificando sua sessão e autorização...</p>}
      {view === 'denied' && <><p role="alert">Acesso não autorizado ou ainda indisponível. Solicite a liberação do SagB ao administrador.</p><button type="button" disabled={busy} onClick={() => void logout()}>Sair / trocar de conta</button></>}
      {view === 'expired' && <><p role="alert">Link de recuperação inválido, expirado ou aberto em outra aba. Solicite um novo link.</p><button type="button" onClick={() => void logout()} disabled={busy}>Voltar ao login</button></>}
      {view === 'admitted' && <><p role="status">Sua identidade foi validada pelo módulo IAM. Os demais módulos aguardam integração segura ao novo banco.</p><button type="button" disabled={busy} onClick={() => void logout()}>Sair</button></>}
      {(view === 'login' || view === 'recovery') && <form onSubmit={submit} className="space-y-4">
        {view === 'login' && <label className="block text-sm">E-mail<input className="block w-full mt-1 rounded-lg border border-gray-200 p-3" type="email" required value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" /></label>}
        {(view === 'recovery' || !forgot) && <label className="block text-sm">{view === 'recovery' ? 'Nova senha' : 'Senha'}<input className="block w-full mt-1 rounded-lg border border-gray-200 p-3" type="password" required minLength={view === 'recovery' ? 8 : 1} value={password} onChange={e => setPassword(e.target.value)} autoComplete={view === 'recovery' ? 'new-password' : 'current-password'} /></label>}
        <button disabled={busy} className="w-full rounded-lg bg-teal-700 text-white p-3 font-medium" type="submit">{busy ? 'Aguarde...' : view === 'recovery' ? 'Salvar nova senha' : forgot ? 'Enviar recuperação' : 'Entrar'}</button>
        {view === 'login' && <button type="button" disabled={busy} className="text-sm text-teal-700" onClick={() => { setForgot(!forgot); setPassword(''); setNotice(''); setError(''); }}>{forgot ? 'Voltar ao login' : 'Esqueci minha senha'}</button>}
      </form>}
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="text-sm text-gray-600">{notice}</p>}
      <p className="text-xs text-gray-400">Acesso por autorização explícita. Não há cadastro aberto neste ambiente.</p>
    </section>
  </main>;
}
