import React from 'react';
import { MonitoramentoInternalSection } from '../components';

const cards: Array<{
  title: string;
  description: string;
  target?: MonitoramentoInternalSection;
  externalUrl?: string;
}> = [
  { title: 'Dashboard Operacional', description: 'Painéis compactos, presets e modo TV.', target: 'dashboard' },
  { title: 'Loze', description: 'Abrir o Control Center da Loze em produção.', externalUrl: 'https://api.loze.com.br' },
  { title: 'Supabase / Database', description: 'Tabelas por módulo, status e observabilidade.', target: 'supabase' },
  { title: 'Infraestrutura e Rede', description: 'Acesso rápido ao submódulo de infraestrutura.', target: 'submodulos' },
  { title: 'Execução Local', description: 'Preparado para monitorar jobs e estação.', target: 'dashboard' },
  { title: 'Dados e Memória', description: 'CID, acervo e consolidação.', target: 'submodulos' },
  { title: 'IA e Agentes', description: 'Agentes, tokens, custo e saúde.', target: 'submodulos' },
  { title: 'Alertas e Incidentes', description: 'Visão de riscos e incidentes.', target: 'alertas' },
  { title: 'Central de Notificações', description: 'Acionamentos e status de leitura.', target: 'dashboard' },
  { title: 'Saúde Modular do SagB', description: 'Módulos, donos e reaproveitamento.', target: 'dashboard' },
  { title: 'Submódulos', description: 'Catálogo completo do Monitoramento.', target: 'submodulos' }
];

interface MonitoramentoHomePageProps {
  onNavigate: (section: MonitoramentoInternalSection) => void;
}

const MonitoramentoHomePage: React.FC<MonitoramentoHomePageProps> = ({ onNavigate }) => (
  <section className="space-y-5">
    <header className="rounded-[24px] border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0F172A] p-6 shadow-sm">
      <span className="text-[9px] font-black uppercase tracking-[0.34em] text-cyan-500">Central de Monitoramento</span>
      <h1 className="mt-2 text-3xl font-black text-slate-950 dark:text-white">Início</h1>
      <p className="mt-2 max-w-2xl text-sm font-semibold text-slate-500 dark:text-slate-400">Escolha uma tela interna. O dashboard avançado continua disponível, mas não é mais a abertura obrigatória.</p>
    </header>
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
      {cards.map((card) => (
        <button
          key={card.title}
          type="button"
          onClick={() => {
            if (card.externalUrl) {
              window.open(card.externalUrl, '_blank', 'noopener,noreferrer');
              return;
            }
            if (card.target) onNavigate(card.target);
          }}
          className="rounded-[20px] border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0F172A] p-4 text-left shadow-sm hover:border-cyan-300 hover:-translate-y-0.5 transition-all"
        >
          <div className="flex items-center justify-between gap-3">
            <strong className="text-sm font-black text-slate-950 dark:text-white">{card.title}</strong>
            {card.externalUrl && (
              <span className="text-[9px] font-black uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-400">
                abrir ↗
              </span>
            )}
          </div>
          <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">{card.description}</p>
        </button>
      ))}
    </div>
  </section>
);

export default MonitoramentoHomePage;

