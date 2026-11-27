import { useSagbSection } from '../../../../core/navigation/useSagbHistory';
import React, { useState } from 'react';
import { MentoriasDashboardPage } from './pages/MentoriasDashboardPage';
import { MentoriasLibraryPage } from './pages/MentoriasLibraryPage';
import { MentoriaDetailPage } from './pages/MentoriaDetailPage';

type ViewType = 'dashboard' | 'library' | 'detail';

/**
 * Container interno do domínio Mentorias dentro do NIDE.
 *
 * Similar ao MentoriasModuleContainer original, mas adaptado para
 * funcionar dentro do NideShell (sem fullscreen próprio, sem
 * "Voltar ao SagB" global — quem gerencia isso é o NideShell).
 *
 * Mantém sua sidebar interna própria (Dashboard + Biblioteca).
 */
export const MentoriasDomainContainer: React.FC = () => {
  const [route,setRoute]=useSagbSection<{view:ViewType;id?:string}>('nide','mentoriasView',{view:'dashboard'});
  const {view,id:selectedId}=route;
  const handleNavigate = (newView:ViewType,id?:string)=>setRoute({view:newView,id});

  const itensSidebar: { id: ViewType; label: string; icone: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icone: '🏠' },
    { id: 'library', label: 'Biblioteca', icone: '📚' },
  ];

  return (
    <div className="flex-1 flex overflow-hidden bg-sagb-bg text-sagb-text font-inter">
      {/* Sidebar vertical interna */}
      <aside className="w-64 shrink-0 bg-sagb-panel flex flex-col shadow-sm border-r border-sagb-line">
        <div className="p-4 border-b border-sagb-line">
          <h2 className="text-sm font-black uppercase tracking-[0.15em] text-sagb-blue">
            Mentorias
          </h2>
          <p className="text-[10px] text-sagb-muted mt-0.5">Central de Mentorias</p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {itensSidebar.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavigate(item.id)}
              className={`w-full text-left rounded-xl px-3 py-2.5 text-[12px] font-bold transition-all border ${
                view === item.id
                  ? 'bg-sagb-blue text-white border-sagb-blue shadow-[0_4px_12px_rgba(37,99,235,0.3)]'
                  : 'bg-sagb-panel text-sagb-text border-sagb-line hover:border-sagb-blue/50 hover:text-sagb-blue'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <span className="text-base">{item.icone}</span>
                <span>{item.label}</span>
              </span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Conteúdo principal */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {view === 'dashboard' && <MentoriasDashboardPage onNavigate={handleNavigate} />}
        {view === 'library' && <MentoriasLibraryPage onNavigate={handleNavigate} />}
        {view === 'detail' && <MentoriaDetailPage id={selectedId} onBack={() => handleNavigate('library')} />}
      </main>
    </div>
  );
};

export const mentoriasDomainRoutes = {
  path: '/nide/mentorias',
  element: <MentoriasDomainContainer />
};
