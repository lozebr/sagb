import { useSagbSection } from '../../../core/navigation/useSagbHistory';
import { ModuleSidebarContent } from '../../../core/navigation/ModuleWorkspace';
import React from 'react';
import RAIHero from '../components/RAIHero';
import RAIStatsStrip from '../components/RAIStatsStrip';
import RAIAgentsPanel from '../components/RAIAgentsPanel';
import RAICapturesPanel from '../components/RAICapturesPanel';
import RAIReadingsPanel from '../components/RAIReadingsPanel';
import RAIAlertsPanel from '../components/RAIAlertsPanel';
import RAIFiltersBar from '../components/RAIFiltersBar';
import RAIHistoryPanel from '../components/RAIHistoryPanel';
import { useRAIAgents, useRAICaptures, useRAIInsights } from '../hooks/useRAI';
import { RAIFilters } from '../types';
import { raiSupabaseService } from '../services/raiSupabaseService';
import { auth } from '../../../../services/supabase';

const RAIPage: React.FC = () => {
  const [step, setStep] = useSagbSection<'selecionar' | 'missao' | 'executar' | 'revisar'>('rai','raiStep','selecionar');
  const [runningAgentId, setRunningAgentId] = React.useState<string | null>(null);
  const [selectedAgentId, setSelectedAgentId] = React.useState<string>('');
  const [missionText, setMissionText] = React.useState<string>('');
  const [filters, setFilters] = React.useState<RAIFilters>({ minRelevance: 0, status: 'new' });

  const { agents } = useRAIAgents();
  const { captures, loading: capturesLoading, error: capturesError, setFilters: setCaptureFilters } = useRAICaptures(filters);
  const { readings, alerts, loading: insightsLoading } = useRAIInsights();

  const selectedAgent = React.useMemo(
    () => agents.find((a) => a.id === selectedAgentId) || null,
    [agents, selectedAgentId]
  );

  const stepIndex = React.useMemo(() => {
    const map: Record<typeof step, number> = {
      selecionar: 1,
      missao: 2,
      executar: 3,
      revisar: 4,
    };
    return map[step];
  }, [step]);

  const stepHint = React.useMemo(() => {
    if (step === 'selecionar') return 'Escolha o agente que já existe no banco para iniciar.';
    if (step === 'missao') return 'Defina a missão com linguagem simples e objetiva.';
    if (step === 'executar') return 'Dispare a execução e aguarde a coleta inicial.';
    return 'Revise capturas, alertas e leituras geradas.';
  }, [step]);

  React.useEffect(() => {
    setCaptureFilters(filters);
  }, [filters, setCaptureFilters]);

  React.useEffect(() => {
    if (!selectedAgentId && agents.length > 0) {
      setSelectedAgentId(agents[0].id);
    }
  }, [agents, selectedAgentId]);

  const applyQuickFilter = (next: Partial<RAIFilters>) => {
    setFilters((prev) => ({ ...prev, ...next }));
  };

  const runAgentNow = async (agentId: string) => {
    const user = auth.currentUser;
    const workspaceId = user?.app_metadata?.workspaceId || user?.user_metadata?.workspaceId || 'default';
    setRunningAgentId(agentId);
    try {
      await raiSupabaseService.triggerAgentRun(agentId, workspaceId);
      setStep('revisar');
    } finally {
      setRunningAgentId(null);
    }
  };

  const isLoading = capturesLoading || insightsLoading;

  return (
    <div className="h-full bg-gray-50 dark:bg-[#0B0F19] overflow-y-auto custom-scrollbar">
      <div className="max-w-[1300px] mx-auto p-6 md:p-8">

        <div className="mb-6 rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 p-4 md:p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Fluxo guiado RAI</p>
              <h2 className="text-lg md:text-xl font-black text-gray-900 dark:text-white">Selecionar agente → missão → execução</h2>
            </div>
            <div className="hidden md:flex items-center gap-2 text-[11px] font-bold text-gray-500">
              <span>Passo {stepIndex} de 4</span>
              <div className="w-28 h-2 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
                <div className="h-full bg-blue-600" style={{ width: `${(stepIndex / 4) * 100}%` }}></div>
              </div>
            </div>
          </div>

          <ModuleSidebarContent><div className="flex flex-wrap items-center gap-2 mb-4">
            {([
              { id: 'selecionar', label: '1. Selecionar Agente' },
              { id: 'missao', label: '2. Definir Missão' },
              { id: 'executar', label: '3. Executar' },
              { id: 'revisar', label: '4. Revisar Resultado' },
            ] as const).map((s) => (
              <button
                key={s.id}
                onClick={() => setStep(s.id)}
                className={`px-3.5 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-colors ${step === s.id ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20' : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20'}`}
              >
                {s.label}
              </button>
            ))}
          </div></ModuleSidebarContent>

          <div className="mb-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40 px-3 py-2">
            <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">{stepHint}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            <div className="md:col-span-1">
              <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1">Agente do banco</label>
              <select
                value={selectedAgentId}
                onChange={(e) => {
                  const agentId = e.target.value;
                  setSelectedAgentId(agentId);
                  setFilters((prev) => ({ ...prev, agentId }));
                  setStep('missao');
                }}
                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
              >
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>{agent.name}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1">Missão (instrução da coleta)</label>
              <input
                value={missionText}
                onChange={(e) => setMissionText(e.target.value)}
                placeholder="Ex: monitorar movimentos de concorrentes no segmento X"
                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
              />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <button
              onClick={() => selectedAgentId && runAgentNow(selectedAgentId)}
              disabled={!selectedAgentId || runningAgentId === selectedAgentId}
              className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-black uppercase tracking-wider hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {runningAgentId === selectedAgentId ? 'Executando...' : 'Executar missão agora'}
            </button>
            <button
              onClick={() => setStep('revisar')}
              className="px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200 text-xs font-black uppercase tracking-wider hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
            >
              Ver resultados
            </button>
          </div>
        </div>

        {selectedAgent && (
          <div className="mb-6 p-4 rounded-2xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1">Agente selecionado</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white">{selectedAgent.name}</p>
            {!!missionText && <p className="text-xs text-gray-500 mt-1">Missão atual: {missionText}</p>}
          </div>
        )}

        {isLoading && (
          <div className="mb-6 p-4 rounded-xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 text-xs text-gray-500">
            Carregando inteligência do radar...
          </div>
        )}

        {capturesError && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-700/30 text-xs text-rose-600">
            Erro ao carregar capturas: {capturesError}
          </div>
        )}

        {!isLoading && captures.length === 0 && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700/30 text-xs text-amber-700">
            Nenhuma captura encontrada com os filtros atuais.
          </div>
        )}

        {step === 'revisar' ? (
          <>
            <RAIStatsStrip
              agents={agents}
              captures={captures}
              alerts={alerts}
              readings={readings}
              onQuickFilter={applyQuickFilter}
            />
            <RAIFiltersBar filters={filters} agents={agents} onChange={setFilters} />
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
              <div className="xl:col-span-4 space-y-8">
                <RAICapturesPanel captures={captures} />
              </div>
              <div className="xl:col-span-5 space-y-8">
                <RAIReadingsPanel readings={readings} />
                <RAIHistoryPanel />
              </div>
              <div className="xl:col-span-3 space-y-8">
                <RAIAlertsPanel alerts={alerts} />
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-2xl p-6 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-sm">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              Fluxo simplificado ativo: selecione o agente, defina a missão e clique em "Executar missão agora".
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RAIPage;
