import React, { useState, useEffect } from 'react';
import { AgendaInteligenteHomePage } from '../pages/home/AgendaInteligenteHomePage';
import { AgendaInteligenteTasksPage } from '../pages/tasks/AgendaInteligenteTasksPage';
import { AgendaInteligenteInboxPage } from '../pages/inbox/AgendaInteligenteInboxPage';
import { AgendaInteligenteMeetingsPage } from '../pages/meetings/AgendaInteligenteMeetingsPage';
import { AgendaInteligenteMonitorPage } from '../pages/monitor/AgendaInteligenteMonitorPage';
import { AgendaInteligenteProjectsPage } from '../pages/projects/AgendaInteligenteProjectsPage';
import { AgendaInteligenteProcessesPage } from '../pages/processes/AgendaInteligenteProcessesPage';
import { AgendaInteligenteSettingsPage } from '../pages/settings/AgendaInteligenteSettingsPage';
import { AgendaInteligenteDocumentsPage } from '../pages/documents/AgendaInteligenteDocumentsPage';
import { MockModeBanner } from '../components/MockModeBanner';
import { hubIntegration } from '../services/taskzei.hub';
import { taskzeiFacade } from '../services/taskzei.facade';
import { monitorService } from '../services/taskzei.monitor';
import { FocusWidget } from '../components/tasks/FocusWidget';

// Sub-rotas internas do módulo TaskZei simuladas por estado (Shell isolado)
type TaskZeiView = 'home' | 'tasks' | 'inbox' | 'meetings' | 'monitor' | 'projects' | 'processes' | 'settings' | 'documents';

export const AgendaInteligenteLayout: React.FC = () => {
  // A aba inicial com destaque é Tarefas
  const [currentView, setCurrentView] = useState<TaskZeiView>('tasks');

  // Inicia o Event Bridge listener para receber mensagens do Hub de Integrações
  useEffect(() => {
    const cleanup = hubIntegration.startListening();
    return cleanup;
  }, []);

  // Health check periódico do provider (60s)
  useEffect(() => {
    const runHealthCheck = async () => {
      const startedAt = Date.now();
      try {
        await taskzeiFacade.loadTasks();
        const latency = Date.now() - startedAt;
        monitorService.recordSyncSuccess();
        if (latency > 2000) {
          monitorService.recordEvent(
            'provider_latency_high',
            `Latência elevada no provider: ${latency}ms`,
            latency > 5000 ? 'critical' : 'warning',
            'taskzei-provider',
            { latency }
          );
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Erro desconhecido no health check');
        monitorService.recordSyncError(err, 'Health check periódico do provider');
      }
    };

    runHealthCheck();
    const interval = window.setInterval(runHealthCheck, 60000);
    return () => window.clearInterval(interval);
  }, []);

  const navigationItems: { id: TaskZeiView; label: string; icon: React.ReactNode }[] = [
    {
      id: 'home',
      label: 'Visão Geral',
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
    },
    {
      id: 'inbox',
      label: 'Inbox',
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
    },
    {
      id: 'tasks',
      label: 'Tarefas',
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
    },
    {
      id: 'meetings',
      label: 'Reuniões',
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
    },
    {
      id: 'documents',
      label: 'Documentos',
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
    },
    {
      id: 'monitor',
      label: 'Monitor',
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
    },
    {
      id: 'projects',
      label: 'Projetos',
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
    },
    {
      id: 'processes',
      label: 'Processos',
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
    },
    {
      id: 'settings',
      label: 'Configurações',
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
    }
  ];

  const renderCurrentView = () => {
    switch (currentView) {
      case 'home': return <AgendaInteligenteHomePage />;
      case 'inbox': return <AgendaInteligenteInboxPage />;
      case 'tasks': return <AgendaInteligenteTasksPage />;
      case 'meetings': return <AgendaInteligenteMeetingsPage />;
      case 'documents': return <AgendaInteligenteDocumentsPage />;
      case 'monitor': return <AgendaInteligenteMonitorPage />;
      case 'projects': return <AgendaInteligenteProjectsPage />;
      case 'processes': return <AgendaInteligenteProcessesPage />;
      case 'settings': return <AgendaInteligenteSettingsPage />;
      default: return <AgendaInteligenteTasksPage />;
    }
  };

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden" style={{ borderRadius: 'var(--sagb-radius-xl)', border: '1px solid var(--sagb-line)', backgroundColor: 'var(--sagb-surface)', boxShadow: 'var(--sagb-shadow)' }}>
      {/* Shell Sidebar Módulo */}
      <aside data-sagb-native-sidebar className="flex w-64 shrink-0 flex-col" style={{ borderRight: '1px solid var(--sagb-line)', backgroundColor: 'var(--sagb-surface-soft)' }}>
        <div className="h-16 shrink-0 px-5" style={{ borderBottom: '1px solid var(--sagb-line)' }}>
          <div className="flex h-full items-center gap-3">
            <div className="grid h-8 w-8 place-items-center rounded-[10px] text-[10px] font-semibold text-white" style={{ background: 'linear-gradient(135deg, var(--sagb-primary), var(--sagb-blue))' }}>
              TZ
            </div>
            <div>
              <h2 className="text-[14px] font-semibold tracking-tight" style={{ color: 'var(--sagb-text)' }}>TaskZei</h2>
              <p className="text-[10px] font-medium uppercase tracking-[0.08em]" style={{ color: 'var(--sagb-muted)' }}>robust clean</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 space-y-4 overflow-y-auto p-3">
          <div>
            <p className="mb-2 pl-2 text-[10px] font-semibold uppercase tracking-[0.1em]" style={{ color: 'var(--sagb-muted)' }}>Main</p>
          {navigationItems.map(item => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                  className={`mb-1 flex h-9 w-full items-center gap-3 rounded-[var(--sagb-radius-sm)] border px-3 text-[13px] font-medium transition-colors ${
                  isActive
                      ? 'text-sagb-text'
                      : 'hover:text-sagb-text'
                }`}
                style={{
                  borderColor: isActive ? 'var(--sagb-primary-soft)' : 'transparent',
                  backgroundColor: isActive ? 'var(--sagb-primary-soft)' : 'transparent',
                  color: isActive ? 'var(--sagb-text)' : 'var(--sagb-muted)',
                }}
                onMouseEnter={(e) => { if (!isActive) { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--sagb-surface)'; (e.currentTarget as HTMLElement).style.color = 'var(--sagb-text)'; } }}
                onMouseLeave={(e) => { if (!isActive) { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--sagb-muted)'; } }}
              >
                  <div style={{ color: isActive ? 'var(--sagb-primary)' : 'var(--sagb-muted)' }}>
                  {item.icon}
                </div>
                {item.label}
              </button>
            );
          })}
          </div>

          <div className="p-3" style={{ borderRadius: 'var(--sagb-radius-sm)', border: '1px solid var(--sagb-line)', backgroundColor: 'color-mix(in srgb, var(--sagb-surface) 80%, transparent)' }}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em]" style={{ color: 'var(--sagb-muted)' }}>Workspace</p>
            <p className="mt-1 text-[12px] font-medium" style={{ color: 'var(--sagb-text)' }}>Demanda Geral</p>
            <p className="text-[11px]" style={{ color: 'var(--sagb-muted)' }}>Operação • 28 tarefas</p>
          </div>
        </nav>

        {/* Rodapé da sidebar — Voltar ao SagB */}
        <div className="shrink-0 p-3" style={{ borderTop: '1px solid var(--sagb-line)' }}>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('sagb:navigate', { detail: 'home' }))}
            className="flex h-9 w-full items-center gap-3 rounded-[var(--sagb-radius-sm)] border border-transparent px-3 text-[13px] font-medium transition-colors"
            style={{ color: 'var(--sagb-muted)' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--sagb-surface)'; (e.currentTarget as HTMLElement).style.color = 'var(--sagb-text)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--sagb-muted)'; }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Voltar ao SagB
          </button>
        </div>
      </aside>

      {/* Conteúdo Principal do Módulo */}
      <main className="relative flex flex-1 flex-col overflow-hidden" style={{ backgroundColor: 'var(--sagb-bg)' }}>
        <MockModeBanner />
        {renderCurrentView()}
        {/* Focus Widget — sobrepõe todo o conteúdo, inclusive o mock banner */}
        <FocusWidget />
      </main>
    </div>
  );
};
