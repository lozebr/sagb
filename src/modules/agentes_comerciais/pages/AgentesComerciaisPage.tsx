import { useSagbSection } from '../../../core/navigation/useSagbHistory';
import { ModuleSidebarContent } from '../../../core/navigation/ModuleWorkspace';
import React, { useState, useEffect } from 'react';
import { AgentList, AgentForm, AgentStats, SquadROI, SquadTopology, AgentSupervisionModal } from '../components';
import { Agente, AgenteDraft } from '../types';
import { agenteService } from '../services';

const AgentesComerciaisPage: React.FC = () => {
  const [activeTab, setActiveTab] = useSagbSection<'membros' | 'topologia' | 'roi'>('agentes_comerciais','commercialView','membros');
  const [agentes, setAgentes] = useState<Agente[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agente | undefined>(undefined);
  const [supervisingAgent, setSupervisingAgent] = useState<Agente | undefined>(undefined);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [data, statistics] = await Promise.all([
        agenteService.buscarAgentes(),
        agenteService.obterEstatisticas()
      ]);
      setAgentes(data);
      setStats(statistics);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = async (data: AgenteDraft) => {
    try {
      if (editingAgent) {
        await agenteService.atualizarAgente(editingAgent.id, data as Partial<Agente>);
      } else {
        await agenteService.criarAgente(data);
      }
      setShowForm(false);
      setEditingAgent(undefined);
      loadData();
    } catch (error) {
      console.error('Erro ao salvar agente:', error);
    }
  };

  const handleCloneAgent = async (agente: Agente) => {
    try {
      await agenteService.clonarAgente(agente.id);
      loadData();
    } catch (error) {
      console.error('Erro ao clonar agente:', error);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header Estilizado */}
      <div className="bg-slate-50 border-b border-slate-200 pt-12 pb-8 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-end gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">Central de Squads Comerciais</h1>
            <p className="text-slate-500 font-medium max-w-2xl">
              Gerencie seus times de SDRs, Closers e Farmers. Configure o DNA, a voz e a topologia de conversão do seu squad virtual.
            </p>
          </div>
          <button 
            onClick={() => { setEditingAgent(undefined); setShowForm(true); }}
            className="px-8 py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 text-sm tracking-tight"
          >
            CRIAR NOVO AGENTE
          </button>
        </div>

        {/* Navigation Tabs */}
        <ModuleSidebarContent><div className="max-w-7xl mx-auto mt-10 flex gap-1">
          {[
            { id: 'membros', label: 'Squad Membros' },
            { id: 'topologia', label: 'Topologia do Funil' },
            { id: 'roi', label: 'ROI & Performance' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 text-sm font-black rounded-t-2xl transition-all ${activeTab === tab.id ? 'bg-white text-blue-600 border-x border-t border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {tab.label.toUpperCase()}
            </button>
          ))}
        </div></ModuleSidebarContent>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto p-8">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            {activeTab === 'membros' && (
              <>
                {stats && <div className="mb-8"><AgentStats stats={stats} /></div>}
                <AgentList 
                  agentes={agentes} 
                  showStats={false}
                  onEditAgent={(a) => { setEditingAgent(a); setShowForm(true); }}
                  onCloneAgent={handleCloneAgent}
                  onSuperviseAgent={(a) => setSupervisingAgent(a)}
                />
              </>
            )}

            {activeTab === 'topologia' && (
              <div className="space-y-6">
                <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 mb-8">
                   <h3 className="text-blue-800 font-black text-lg mb-1">Caminho Crítico do Lead</h3>
                   <p className="text-blue-600 text-sm font-medium">Esta visão mostra como as oportunidades fluem entre os especialistas do seu squad.</p>
                </div>
                <SquadTopology agentes={agentes} />
              </div>
            )}

            {activeTab === 'roi' && stats && (
              <div className="space-y-6">
                 <SquadROI stats={stats} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modais */}
      {showForm && (
        <AgentForm 
          initialData={editingAgent} 
          onSubmit={handleCreateOrUpdate}
          onCancel={() => { setShowForm(false); setEditingAgent(undefined); }}
        />
      )}

      {supervisingAgent && (
        <AgentSupervisionModal 
          agente={supervisingAgent} 
          onClose={() => setSupervisingAgent(undefined)} 
        />
      )}
    </div>
  );
};

export default AgentesComerciaisPage;