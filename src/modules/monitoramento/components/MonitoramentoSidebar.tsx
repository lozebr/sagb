import React from 'react';

export type MonitoramentoInternalSection = 'inicio' | 'dashboard' | 'supabase' | 'submodulos' | 'alertas' | 'configuracoes';

const items: Array<{ id: MonitoramentoInternalSection; label: string; hint: string }> = [
  { id: 'inicio', label: 'Início', hint: 'Hub da Central' },
  { id: 'dashboard', label: 'Dashboard Operacional', hint: 'Painéis e presets' },
  { id: 'supabase', label: 'Supabase / Database', hint: 'Tabelas por módulo' },
  { id: 'submodulos', label: 'Submódulos', hint: 'Catálogo metodológico' },
  { id: 'alertas', label: 'Alertas e Incidentes', hint: 'Visão futura' },
  { id: 'configuracoes', label: 'Configurações', hint: 'Preparado' }
];

interface MonitoramentoSidebarProps {
  activeSection: MonitoramentoInternalSection;
  onSelect: (section: MonitoramentoInternalSection) => void;
  onBackToHub?: () => void;
}

export const MonitoramentoSidebar: React.FC<MonitoramentoSidebarProps> = ({ activeSection, onSelect, onBackToHub }) => (
  <aside className="h-full min-h-0 border-r border-slate-200/80 dark:border-white/10 bg-[#F7FAFE] dark:bg-[#091525] text-slate-950 dark:text-white px-3 py-4 flex flex-col">
    <div className="mb-4 px-2">
      <span className="text-[8px] font-black uppercase tracking-[0.28em] text-blue-500">SagB · LIS V4</span>
      <h2 className="mt-1.5 text-base font-black tracking-tight">Monitoramento</h2>
      <p className="mt-0.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400">Central imersiva.</p>
    </div>
    <nav className="flex-1 space-y-1.5 overflow-y-auto custom-scrollbar" aria-label="Navegação interna do Monitoramento">
      {items.map((item) => {
        const active = item.id === activeSection;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className={`w-full rounded-xl border px-3 py-2.5 text-left transition-all ${active ? 'border-blue-300 bg-blue-500 text-white shadow-[0_10px_24px_rgba(37,99,235,0.22)]' : 'border-slate-200 dark:border-white/10 bg-white/70 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:border-blue-300/60 hover:bg-blue-500/10'}`}
          >
            <strong className="block text-[11px] font-black uppercase tracking-[0.12em]">{item.label}</strong>
            <span className={`mt-0.5 block text-[9px] font-semibold ${active ? 'text-blue-50' : 'text-slate-500 dark:text-slate-500'}`}>{item.hint}</span>
          </button>
        );
      })}
    </nav>
    <footer className="mt-3 pt-3 border-t border-slate-200 dark:border-white/10 px-2">
      <button
        type="button"
        onClick={onBackToHub}
        className="w-full rounded-xl border border-slate-300 dark:border-white/15 bg-white/80 dark:bg-white/5 px-3 py-2.5 text-left transition-all hover:border-blue-300/60 hover:bg-blue-500/10 active:scale-[0.98]"
      >
        <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">← Voltar ao SagB</span>
        <span className="mt-0.5 block text-[8px] font-semibold text-slate-400 dark:text-slate-500">Centro de Comando</span>
      </button>
    </footer>
  </aside>
);
