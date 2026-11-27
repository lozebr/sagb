import React,{useEffect,useRef,useState} from 'react';
export default function AuthenticatedHome({account,logout,busy}:{account:React.ReactNode;logout:()=>void;busy:boolean}){
 const frame=useRef<HTMLIFrameElement>(null);
 const [showAccount,setShowAccount]=useState(false);
 const [ready,setReady]=useState(false);
 useEffect(()=>{
   const receive=(event:MessageEvent)=>{
     if(event.source!==frame.current?.contentWindow||event.origin!=='null')return;
     if(event.data?.type==='sagb:workspace-ready')setReady(true);
     if(event.data?.type==='sagb:workspace-account')setShowAccount(true);
     if(event.data?.type==='sagb:workspace-logout'&&!busy)logout();
   };
   window.addEventListener('message',receive);
   return()=>window.removeEventListener('message',receive);
 },[logout,busy]);
 useEffect(()=>{
   if(!showAccount)return;
   const close=(e:KeyboardEvent)=>{if(e.key==='Escape')setShowAccount(false);};
   window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close);
 },[showAccount]);
 return <div className="h-[100dvh] w-full bg-white flex flex-col overflow-hidden">
   <div className="shrink-0 flex items-center justify-between gap-3 px-3 py-1.5 bg-amber-50 border-b border-amber-100 text-[11px] text-amber-900" role="status">
     <span>Acesso autenticado · Módulos em modo local, sem sincronização operacional com o banco.</span>
     <div className="flex gap-3 shrink-0"><button type="button" className="underline" onClick={()=>setShowAccount(true)}>Minha conta</button><button type="button" className="underline" disabled={busy} onClick={logout}>Sair</button></div>
   </div>
   {!ready&&<p className="px-4 py-2 text-sm text-slate-500">Carregando a interface completa do SagB...</p>}
   <iframe ref={frame} title="Área de trabalho completa do SagB" src="/workspace.html" sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox" referrerPolicy="no-referrer" className="flex-1 min-h-0 w-full border-0"/>
   {showAccount&&<div className="fixed inset-0 z-[100] bg-black/20 flex justify-end" role="presentation" onClick={()=>setShowAccount(false)}><section aria-label="Minha conta" role="dialog" aria-modal="true" className="w-full max-w-2xl bg-white h-full overflow-y-auto p-6 shadow-xl" onClick={e=>e.stopPropagation()}><button type="button" className="mb-5 text-sm text-teal-700 font-medium" onClick={()=>setShowAccount(false)}>← Voltar ao SagB</button>{account}</section></div>}
 </div>;
}
