import React, {lazy,Suspense,useEffect} from 'react';
import {useSagbTabHistory} from '../../../core/navigation/useSagbHistory';
import {ThemeProvider} from '../../../core/context/ThemeContext';
import NagiSidebar from '../../nagi/components/NagiSidebar';
import {DEMO_PRODUCTS} from '../../nagi/data/demoProducts';
const Applications=lazy(()=>import('../../nagi/components/PublishedLinksSection'));
const Simulator=lazy(()=>import('../../simulador-mentorias/pages/SimuladorMentoriasPage').then(m=>({default:m.SimuladorMentoriasPage})));
const routes={home:'/',nagi:'/nagi', 'simulador-mentorias':'/simulador-mentorias',account:'/conta'};
type Tab=keyof typeof routes;
// Only reviewed components without operational persistence are mounted here.
// The legacy App is deliberately not imported in the authenticated IAM entry.
const pending=['CID','RAI','NIC','NAGI — ideias, documentos e governança','NIDE','Sala de Desenvolvimento','Central de Padrões','Monitoramento','Núcleo de Agentes','Núcleo Conversacional','Cadastro de Empresas','Gestão Financeira','Agenda Inteligente','CRM Ziplia','Hub de Integrações','API SagB','MCP SagB','Studio','Telas Avançadas','Agentes Comerciais','Karaokê','Vídeos IA','Zen Folk','SagB Bridge','FluxoB','Configurações do Sistema'];
export default function AuthenticatedHome({account,logout,busy}:{account:React.ReactNode;logout:()=>void;busy:boolean}){
 const [tab,setTab]=useSagbTabHistory<Tab>(routes,true);
 useEffect(()=>{
  const nav=(e:Event)=>{const t=(e as CustomEvent).detail;if(t==='home')setTab('home');};
  window.addEventListener('sagb:navigate',nav);return()=>window.removeEventListener('sagb:navigate',nav);
 },[setTab]);
 const goHome=()=>setTab('home');
 return <ThemeProvider><div className="h-[100dvh] min-h-0 bg-white text-slate-800 flex overflow-hidden font-sans">
  {tab==='nagi'?<><NagiSidebar activeSection="links" availableSections={['links']} onNavigate={()=>{}} onBack={goHome} badgeCounts={{documentos:0,ideias:0,catalogo:0,links:DEMO_PRODUCTS.length,governanca:0}}/><main className="flex-1 min-w-0 overflow-auto p-4 md:p-6"><Suspense fallback={<p>Carregando aplicativos...</p>}><Applications/></Suspense></main></>:
  tab==='simulador-mentorias'?<main className="flex-1 overflow-auto min-w-0"><div className="px-4 py-2 text-xs text-slate-500 bg-slate-50">Simulação com premissas de exemplo. Não representa movimentações reais.</div><Suspense fallback={<p>Carregando simulador...</p>}><Simulator/></Suspense></main>:
  tab==='account'?<><aside className="w-36 md:w-60 shrink-0 flex flex-col border-r p-4"><strong>Identidade</strong><div className="flex-1 pt-5 text-sm">Minha conta</div><button type="button" className="text-left text-sm" onClick={goHome}>← Voltar ao SagB</button></aside><main className="flex-1 overflow-auto p-5">{account}</main></>:
  <><aside data-sagb-global-sidebar className="w-36 md:w-60 shrink-0 flex flex-col border-r border-slate-100 p-3 md:p-5"><div className="text-xl font-semibold text-teal-700">SagB</div><p className="text-xs text-slate-500 mt-1">GrupoB</p><nav className="flex-1 space-y-2 pt-6"><button className="block w-full text-left bg-teal-50 rounded-lg px-2 py-2 text-sm" onClick={goHome}>Home</button><button className="block w-full text-left rounded-lg px-2 py-2 text-sm hover:bg-slate-50" onClick={()=>setTab('nagi')}>NAGI</button><button className="block w-full text-left rounded-lg px-2 py-2 text-sm hover:bg-slate-50" onClick={()=>setTab('simulador-mentorias')}>Simulador de Mentorias</button><button className="block w-full text-left rounded-lg px-2 py-2 text-sm hover:bg-slate-50" onClick={()=>setTab('account')}>Minha conta e acesso</button></nav><button type="button" disabled={busy} onClick={logout} className="text-left text-sm text-slate-500 p-2">Sair</button></aside>
  <main className="flex-1 min-w-0 overflow-auto p-4 md:p-8"><div className="max-w-6xl mx-auto"><p className="text-sm text-teal-700">Central de comando</p><h1 className="text-2xl font-semibold mt-1">Bem-vindo ao SagB</h1><p className="text-sm text-slate-500 mt-2">Acesso autenticado. Recursos liberados por etapas, com dados isolados por produto.</p>
  <h2 className="mt-8 mb-3 text-base font-semibold">Disponíveis agora</h2><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{([['nagi','NAGI','Central de Aplicativos — catálogo de links existentes'],['simulador-mentorias','Simulador de Mentorias','Cenários de exemplo, cálculos locais'],['account','Identidade e Acesso','Minha conta e administração autorizada']] as const).map(([id,label,desc])=><button key={id} onClick={()=>setTab(id)} className="text-left rounded-xl shadow-sm border border-slate-100 p-4 hover:border-teal-300"><div className="text-teal-700 text-xs mb-2">Disponível</div><strong>{label}</strong><p className="mt-1 text-xs text-slate-500">{desc}</p></button>)}</div>
  <h2 className="mt-8 mb-3 font-semibold">Módulos em integração</h2><p className="text-xs text-slate-500 mb-3">Código preservado. Acesso operacional e gravação ainda não liberados no novo banco.</p><div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{pending.map(name=><div key={name} className="border border-slate-100 rounded-lg p-3"><div className="text-sm">{name}</div><span className="text-xs text-slate-500">Integração pendente</span></div>)}</div></div></main></>}
 </div></ThemeProvider>;
}
