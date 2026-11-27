import React, { useState } from 'react';
import { createPilotClient } from '../services/pilotClient';

type Client = NonNullable<ReturnType<typeof createPilotClient>>;
type Directory = { pending: { email: string; expires_at: string }[]; members: { membership_id: string; email: string | null; status: string; admin: boolean }[] };
export default function AccessAdminPanel({ client }: { client: Client }) {
  const [status,setStatus]=useState<{admin:boolean;elevated:boolean}|null>(null);
  const [directory,setDirectory]=useState<Directory|null>(null);
  const [email,setEmail]=useState('');
  const [factor,setFactor]=useState('');
  const [qr,setQr]=useState('');
  const [secret,setSecret]=useState('');
  const [code,setCode]=useState('');
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  async function run(task:()=>Promise<void>) { if(busy)return;setBusy(true);setMessage('');try{await task();}catch{setDirectory(null);setMessage('Operação indisponível ou não autorizada. Verifique a sessão.');}finally{setBusy(false);} }
  async function refresh() {
    const {data,error}=await client.schema('sagb').rpc('iam_access_admin_status');
    if(error || !data)throw Error('status');
    setStatus(data);setDirectory(null);
    if(data.elevated){const response=await client.schema('sagb').rpc('iam_access_admin_action',{p_action:'list'});if(response.error||response.data?.ok!==true)throw Error('directory');setDirectory(response.data);}
  }
  async function startMfa() {
    const factors=await client.auth.mfa.listFactors();
    if(factors.error)throw factors.error;
    const existing=factors.data.totp.find(f=>f.status==='verified');
    if(existing){setFactor(existing.id);return;}
    if(factors.data.all.some(f=>f.status==='verified')){setMessage('Use o fator já cadastrado por um fluxo aprovado.');return;}
    // Unique name per attempt: an abandoned unverified factor (expires server-side) must not block a new enrollment.
    const enrollment=await client.auth.mfa.enroll({factorType:'totp',friendlyName:'SagB '+new Date().toISOString().slice(0,19)});
    if(enrollment.error){setMessage('Não foi possível iniciar o autenticador. Aguarde alguns minutos e tente novamente.');return;}
    setFactor(enrollment.data.id);setQr(enrollment.data.totp.qr_code);setSecret(enrollment.data.totp.secret);
  }
  async function verifyMfa() {
    if(!factor || !/^\d{6}$/.test(code))return;
    const result=await client.auth.mfa.challengeAndVerify({factorId:factor,code});
    if(result.error){setCode('');setMessage('Código não aceito. Confira o horário do celular e digite o código atual do autenticador.');return;}
    setCode('');setFactor('');setQr('');setSecret('');await refresh();
  }
  async function action(kind:'authorize'|'cancel'|'revoke',target:string) {
    const result=await client.schema('sagb').rpc('iam_access_admin_action',{p_action:kind,...(kind==='revoke'?{p_membership:target}:{p_email:target})});
    if(result.error||result.data?.ok!==true)throw Error('action');
    setEmail('');await refresh();setMessage('Operação registrada.');
  }
  return <section className="border-t pt-4 space-y-3">
    <h2 className="font-medium">Administração de acesso</h2>
    <button type="button" disabled={busy} onClick={()=>void run(refresh)} className="text-teal-700">Verificar minhas permissões</button>
    {status && !status.admin && <p className="text-sm">Sem perfil administrativo.</p>}
    {status?.admin && !status.elevated && <div className="space-y-2">
      <p className="text-sm">Confirme o segundo fator antes de administrar usuários. A autenticação é compartilhada pela incubadora; configurar MFA protege sua identidade Supabase.</p>
      {!factor && <button type="button" disabled={busy} className="rounded-lg bg-teal-700 text-white px-4 py-2 text-sm" onClick={()=>void run(startMfa)}>Configurar ou verificar autenticador</button>}
      {factor && <>{qr && qr.startsWith('data:image/svg+xml') && <img alt="QR do autenticador" src={qr} className="w-40 h-40"/>}{secret && <p className="text-xs break-all">Chave do autenticador (guarde em local seguro): {secret}</p>}
      <label className="block text-sm">Código do autenticador<input autoComplete="one-time-code" inputMode="numeric" value={code} onChange={e=>setCode(e.target.value)} className="block border rounded p-2"/></label>
      <button type="button" disabled={busy||!/^\d{6}$/.test(code)} className="rounded-lg bg-teal-700 text-white px-4 py-2 text-sm disabled:opacity-50" onClick={()=>void run(verifyMfa)}>Confirmar segundo fator</button></>}
    </div>}
    {status?.elevated && directory && <div className="space-y-3">
      <p className="text-sm">Autorize novos usuários por 7 dias. Eles solicitam o link no SagB; não recebem privilégios administrativos. Identidades já existentes exigem provisionamento revisado.</p>
      <form onSubmit={e=>{e.preventDefault();void run(()=>action('authorize',email));}} className="space-y-2"><label className="block text-sm">E-mail<input type="email" required maxLength={254} value={email} onChange={e=>setEmail(e.target.value)} className="w-full border rounded p-2"/></label><button disabled={busy} type="submit" className="text-teal-700">Autorizar primeiro acesso</button></form>
      <h3 className="text-sm font-medium">Autorizações pendentes (até 100)</h3>
      {directory.pending.map(p=><div key={p.email} className="text-sm flex flex-wrap justify-between gap-2"><span className="break-all">{p.email}</span><button type="button" disabled={busy} onClick={()=>void run(()=>action('cancel',p.email))}>Cancelar autorização</button></div>)}
      <h3 className="text-sm font-medium">Usuários SagB (até 100)</h3>
      {directory.members.map(m=><div key={m.membership_id} className="text-sm space-y-1"><div className="break-all">{m.email??'Identidade'} · {m.admin?'Administrador':m.status}</div>{!m.admin&&m.status==='active'&&<button type="button" disabled={busy} onClick={()=>{if(window.confirm('Revogar a entrada deste usuário no SagB?'))void run(()=>action('revoke',m.membership_id));}}>Revogar acesso</button>}</div>)}
    </div>}
    {message && <p role="status" className="text-sm">{message}</p>}
  </section>;
}
