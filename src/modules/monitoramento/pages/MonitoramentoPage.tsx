import { useSagbSection } from '../../../core/navigation/useSagbHistory';
import React, { useEffect, useMemo, useState } from 'react';
import { MonitoramentoInternalMenu, MonitoramentoInternalSection, MonitoramentoSidebar } from '../components';
import { monitoramentoSubmodulos } from '../services';
import MonitoramentoDashboardPage from './MonitoramentoDashboardPage';
import MonitoramentoHomePage from './MonitoramentoHomePage';
import MonitoramentoSupabasePage from './MonitoramentoSupabasePage';

interface MonitoramentoPageProps {
  onBackToHub?: () => void;
}

const getSlugFromPath = () => {
  if (typeof window === 'undefined') return '';
  return window.location.pathname.split('/').filter(Boolean)[1] || '';
};

const MonitoramentoPage: React.FC<MonitoramentoPageProps> = ({ onBackToHub }) => {
  const firstSlug = monitoramentoSubmodulos[0]?.slug || 'infraestrutura';
  const [route,setRoute]=useSagbSection<{slug:string;section:MonitoramentoInternalSection}>('monitoramento','monitorView',()=>({slug:monitoramentoSubmodulos.some(s=>s.slug===getSlugFromPath())?getSlugFromPath():firstSlug,section:getSlugFromPath()?'submodulos':'inicio'}),r=>r.section==='submodulos'?'/monitoramento/'+encodeURIComponent(r.slug):'/monitoramento');
  const {slug:activeSlug,section:activeSection}=route;
  const setActiveSection=(section:MonitoramentoInternalSection)=>setRoute(prev=>({...prev,section}));

  const activeSubmodulo = useMemo(
    () => monitoramentoSubmodulos.find((submodulo) => submodulo.slug === activeSlug) || monitoramentoSubmodulos[0],
    [activeSlug]
  );

  const handleSelectSubmodulo = (slug: string) => {
    if(monitoramentoSubmodulos.some(s=>s.slug===slug))setRoute({slug,section:'submodulos'});
  };

  const handleBackToHub = onBackToHub || (() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sagb:navigate', { detail: 'home' }));
    }
  });

  if (!activeSubmodulo) return null;

  return (
    <section className="flex-1 h-full overflow-hidden bg-[#EDF3FA] dark:bg-[#07111F] custom-scrollbar">
      <div className="h-full">
        <div className="grid h-full grid-cols-[minmax(112px,30%)_minmax(0,1fr)] md:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)] overflow-hidden">
          <MonitoramentoSidebar activeSection={activeSection} onSelect={setActiveSection} onBackToHub={handleBackToHub} />
          <main className="min-w-0 h-full overflow-y-auto p-4 md:p-5 custom-scrollbar">
            {activeSection === 'inicio' && <MonitoramentoHomePage onNavigate={setActiveSection} />}
            {activeSection === 'dashboard' && <MonitoramentoDashboardPage />}
            {activeSection === 'supabase' && <MonitoramentoSupabasePage />}
            {activeSection === 'alertas' && (
              <section className="rounded-[24px] border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0F172A] p-6 shadow-sm">
                <span className="text-[9px] font-black uppercase tracking-[0.34em] text-red-500">Preparado</span>
                <h1 className="mt-2 text-2xl font-black text-slate-950 dark:text-white">Alertas e Incidentes</h1>
                <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-400">Tela dedicada futura. Hoje os alertas seguem no Dashboard Operacional e no War Room.</p>
              </section>
            )}
            {activeSection === 'configuracoes' && (
              <section className="rounded-[24px] border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0F172A] p-6 shadow-sm">
                <span className="text-[9px] font-black uppercase tracking-[0.34em] text-slate-500">Preparado</span>
                <h1 className="mt-2 text-2xl font-black text-slate-950 dark:text-white">Configurações do Monitoramento</h1>
                <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-400">Área futura para persistência de layout, fontes reais e preferências da Central.</p>
              </section>
            )}
            {activeSection === 'submodulos' && <><header className="rounded-[24px] border border-white/80 bg-slate-950 text-white shadow-[0_18px_54px_rgba(15,23,42,0.18)] overflow-hidden relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.15),_transparent_40%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.12),_transparent_40%)]" />
          <div className="relative px-6 py-6 flex flex-col gap-2">
            <span className="text-[9px] font-black uppercase tracking-[0.34em] text-cyan-400">Catálogo Interno</span>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">Submódulos</h1>
            <p className="text-xs text-slate-300 font-medium">Submódulo ativo: {activeSubmodulo.label}</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          <MonitoramentoInternalMenu
            submodulos={monitoramentoSubmodulos}
            ativoSlug={activeSubmodulo.slug}
            onSelect={handleSelectSubmodulo}
          />

          <section className="rounded-3xl border border-gray-100 dark:border-white/10 bg-white dark:bg-[#0F172A] p-6 md:p-8 shadow-sm space-y-6">
            <header className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white">{activeSubmodulo.label}</h2>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-400">
                {activeSubmodulo.items.length} itens
              </span>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {activeSubmodulo.items.map((item) => (
                <article
                  key={item}
                  className="rounded-2xl border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-[#111827] p-5 min-h-24 flex items-center"
                >
                  <strong className="text-sm text-gray-800 dark:text-gray-100">{item}</strong>
                </article>
              ))}
            </div>
          </section>
        </div>
        </>}
          </main>
        </div>
      </div>
    </section>
  );
};

export default MonitoramentoPage;
