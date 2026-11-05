
import React, { useEffect, useState } from 'react';
import { auth, db, doc, setDoc, signInWithEmailAndPassword, createUserWithEmailAndPassword } from '../services/supabase';
import { SendIcon } from './Icon';

interface AuthProps {
    onAuthSuccess: () => void;
    isPasswordRecovery?: boolean;
    onRecoveryComplete?: () => void;
}

const Auth: React.FC<AuthProps> = ({ onAuthSuccess, isPasswordRecovery = false, onRecoveryComplete }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [notice, setNotice] = useState('');
    const [recoveryStatus, setRecoveryStatus] = useState<'checking' | 'ready' | 'expired'>('checking');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [role, setRole] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
      if (!isPasswordRecovery) return;
      let active = true;
      auth.consumeRecoveryLink().then(({ error }) => {
        if (!active) return;
        setRecoveryStatus(error ? 'expired' : 'ready');
        if (error) setError('Este link de recuperação é inválido ou expirou. Solicite um novo.');
      });
      return () => { active = false; };
    }, [isPasswordRecovery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setLoading(true);

    try {
      if (isPasswordRecovery) {
        if (recoveryStatus !== 'ready') throw { code: 'auth/invalid-action-code' };
        if (password.length < 8) throw { code: 'auth/weak-password' };
        const { error: recoveryError } = await auth.updatePassword(password);
        if (recoveryError) throw recoveryError;
        await auth.signOut();
        setPassword('');
        setNotice('Senha atualizada com sucesso. Entre novamente com a nova senha.');
        setRecoveryStatus('expired');
        return;
      }
      if (isForgotPassword) {
        const { error: recoveryError } = await auth.resetPasswordForEmail(email.trim());
        if (recoveryError) throw recoveryError;
        setNotice('Se o e-mail estiver cadastrado, você receberá um link para redefinir a senha.');
        return;
      }
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        if (!name || !role) {
          setError('Nome e Cargo são obrigatórios para novos usuários.');
          setLoading(false);
          return;
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const userId = (user as any)?.id || (user as any)?.uid;

        // CRIAR PERFIL NO BANCO DE DADOS
        const rawUserProfile = {
          uid: userId,
          email: (user as any)?.email || '',
          name: name || '',
          nickname: (name || '').split(' ')[0] || 'User',
          // Cargo informado é descritivo, nunca autorização concedida pelo cliente.
          role: 'member',
          requestedRole: role.trim(),
          company: 'GrupoB',
          tier: 'OPERACIONAL',
          createdAt: new Date()
        };

        // Limpeza de campos undefined para evitar invalid-argument
        const payload = Object.fromEntries(
          Object.entries(rawUserProfile).filter(([_, v]) => v !== undefined)
        );

        if (!userId) {
          throw { code: 'auth/invalid-user', message: 'Usuário criado sem ID válido.' };
        }

        await setDoc(doc(db, "users", userId), payload);
      }
      onAuthSuccess();
    } catch (err: any) {
      const code = typeof err?.code === 'string' ? err.code : 'auth/unknown';
      console.error('Falha na autenticação do SagB:', { code, status: err?.status ?? null });

      if (code === 'auth/network-request-failed') {
        setError('Não foi possível acessar o Supabase neste ambiente. A configuração ou a conexão do Deploy Preview precisa ser verificada.');
      } else if (code === 'auth/configuration-not-found') {
        setError('Supabase não configurado para este ambiente. Solicite a revisão das variáveis de autenticação do Deploy Preview.');
      } else if (code === 'auth/user-not-found') setError('Usuário não encontrado.');
      else if (code === 'auth/wrong-password') setError('Senha incorreta.');
      else if (code === 'auth/invalid-credentials') setError('E-mail ou senha inválidos.');
      else if (code === 'auth/invalid-email') setError('E-mail inválido.');
      else if (code === 'auth/email-already-in-use') setError('Este e-mail já está em uso.');
      else if (code === 'auth/weak-password') setError('A senha deve ter pelo menos 8 caracteres.');
      else if (code === 'auth/invalid-action-code' || code === 'auth/http-422' || code === 'auth/http-403') setError('Link de recuperação expirado ou inválido. Solicite um novo.');
      else if (code === 'auth/http-400') setError('Erro de conexão com o servidor de autenticação. Verifique as credenciais.');
      else if (code === 'auth/http-401') setError('Credenciais inválidas ou expiradas.');
      else if (code === 'auth/http-403') setError('Acesso negado ao servidor de autenticação.');
      else if (code === 'auth/http-500') setError('Erro interno do servidor de autenticação.');
      else setError('Não foi possível autenticar. Verifique seus dados e tente novamente. Se o problema persistir, contate o administrador.');
    } finally {
      setLoading(false);
    }
  };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-sagb-bg p-6 font-sans transition-colors duration-300">
            <div className="w-full max-w-md bg-white dark:bg-sagb-panel rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 dark:border-white/5 p-10 transition-colors duration-300">
                <div className="flex flex-col items-center mb-10">
                    <div className="w-16 h-16 bg-black dark:bg-gradient-to-br dark:from-[#0a84ff] dark:to-[#005fcc] rounded-2xl flex items-center justify-center mb-6 shadow-xl">
                        <span className="text-white font-black text-2xl tracking-tighter">B</span>
                    </div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-sagb-text tracking-tight mb-2">
                        {isPasswordRecovery ? 'Nova senha' : isForgotPassword ? 'Recuperar acesso' : isLogin ? 'Bem-vindo ao SagB' : 'Criar Nova Conta'}
                    </h1>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em]">
                        {isPasswordRecovery ? 'Defina sua nova senha' : isForgotPassword ? 'Enviaremos um link de recuperação' : isLogin ? 'Painel de Gestão Estratégica' : 'Cadastre-se para acessar o ecossistema'}
                    </p>
                    {isLogin && !isForgotPassword && !isPasswordRecovery && (
                        <span className="mt-3 inline-flex rounded-full bg-violet-100 text-violet-700 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em]">
                            GERAC
                        </span>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && !isForgotPassword && !isPasswordRecovery && (
                        <>
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 mb-2 block">Nome Completo</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-sagb-bg-2 border border-gray-100 dark:border-white/10 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 transition-all text-sm font-medium dark:text-sagb-text"
                                    placeholder="Ex: Nome Sobrenome"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 mb-2 block">Cargo Corporativo</label>
                                <input
                                    type="text"
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-sagb-bg-2 border border-gray-100 dark:border-white/10 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 transition-all text-sm font-medium dark:text-sagb-text"
                                    placeholder="Ex: Diretor de Operações"
                                    required
                                />
                            </div>
                        </>
                    )}

                    {!isPasswordRecovery && <div>
                        <label htmlFor="sagb-auth-email" className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 mb-2 block">E-mail Corporativo</label>
                        <input
                            id="sagb-auth-email"
                            type="email"
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-sagb-bg-2 border border-gray-100 dark:border-white/10 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 transition-all text-sm font-medium dark:text-sagb-text"
                            placeholder="seu@grupob.com.br"
                            required
                        />
                    </div>}

                    {!isForgotPassword && <div>
                        <label htmlFor="sagb-auth-password" className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 mb-2 block">{isPasswordRecovery ? 'Nova senha' : 'Senha de Acesso'}</label>
                        <input
                            id="sagb-auth-password"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete={isPasswordRecovery ? 'new-password' : 'current-password'}
                            minLength={isPasswordRecovery ? 8 : undefined}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-sagb-bg-2 border border-gray-100 dark:border-white/10 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 transition-all text-sm font-medium dark:text-sagb-text"
                            placeholder="••••••••"
                            required
                        />
                        <button type="button" onClick={() => setShowPassword((value) => !value)} className="mt-2 ml-2 text-xs font-semibold text-violet-700 dark:text-violet-300" aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>{showPassword ? 'Ocultar senha' : 'Mostrar senha'}</button>
                    </div>}

                    {notice && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800">{notice}</div>}
                    {error && (
                        <div role="alert" className="bg-red-50 text-red-600 text-[11px] font-bold px-4 py-3 rounded-xl border border-red-100">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || (isPasswordRecovery && recoveryStatus !== 'ready')}
                        className="w-full bg-black text-white font-black py-4 rounded-2xl shadow-xl hover:bg-gray-900 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <span>{isPasswordRecovery ? 'Salvar nova senha' : isForgotPassword ? 'Enviar link de recuperação' : isLogin ? 'Entrar no Sistema' : 'Finalizar Cadastro'}</span>
                                <SendIcon className="w-4 h-4 rotate-[-45deg]" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-4 flex flex-wrap justify-center gap-4">
                    {isPasswordRecovery ? (
                        <button type="button" onClick={() => { auth.signOut().finally(() => onRecoveryComplete?.()); }} className="text-xs font-semibold text-violet-700 dark:text-violet-300">Voltar ao login</button>
                    ) : isForgotPassword ? (
                        <button type="button" onClick={() => { setIsForgotPassword(false); setError(''); setNotice(''); }} className="text-xs font-semibold text-violet-700 dark:text-violet-300">Voltar ao login</button>
                    ) : (
                        <button type="button" onClick={() => { setIsForgotPassword(true); setError(''); setNotice(''); setPassword(''); }} className="text-xs font-semibold text-violet-700 dark:text-violet-300">Esqueci minha senha</button>
                    )}
                </div>

                <div className="mt-8 text-center px-4">
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest leading-relaxed">
                        Acesso Restrito ao Núcleo de Identidades.<br />
                        Contate o administrador para obter suas credenciais.
                    </p>
                </div>

                <div className="mt-12 pt-8 border-t border-gray-50 flex justify-center gap-6">
                    <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">GrupoB 2026</span>
                    <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">•</span>
                    <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">v2.0</span>
                </div>
            </div>
        </div>
    );
};

export default Auth;
