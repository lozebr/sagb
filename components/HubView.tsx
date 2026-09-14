import React, { useState, useMemo } from 'react';
import { BusinessUnit, TabId, Agent } from '../types';
import { Avatar } from './Avatar';
import { deriveOperationalStatus, getOperationalStatusLabel, isAgentOperationallyBlocked } from '../utils/agentOperational';
import { getQgByBuId } from '../data/qgRegistry';
import { netlifyLauncherRegistry, netlifyLauncherSnapshot } from '../data/netlifyLauncherRegistry';

interface HubViewProps {
  businessUnits: BusinessUnit[];
  activeBU: BusinessUnit;
  onSelectBU: (bu: BusinessUnit) => void;
  onNavigate: (tab: TabId) => void;
  onSelectAgent?: (agent: Agent) => void;
  agents?: Agent[];
}

type HubSection = 'launcher' | 'mapa';
type ViewMode = 'institucional' | 'operacional' | 'relacional';
type LauncherFilter = 'todos' | 'loze' | 'qg' | 'preview' | 'teste-lab' | 'site-app';
type NodeType = 'grupo' | 'governanca' | 'pilar' | 'venture' | 'incubada' | 'metodologia' | 'infraestrutura' | 'agente';

interface EcosystemNode {
  id: string;
  name: string;
  type: NodeType;
  description: string;
  logo?: string;
  themeColor: string;
  agents?: Agent[];
  buRef?: BusinessUnit;
  status?: string;
  connections?: string[]; // IDs of connected nodes
}

const HubView: React.FC<HubViewProps> = ({ businessUnits, activeBU, onSelectBU, onNavigate, onSelectAgent, agents = [] }) => {
  const [hubSection, setHubSection] = useState<HubSection>('launcher');
  const [launcherFilter, setLauncherFilter] = useState<LauncherFilter>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('institucional');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [expandedAll, setExpandedAll] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);


  const getLauncherKind = (name: string, url: string): LauncherFilter => {
    const haystack = `${name} ${url}`.toLowerCase();
    if (haystack.includes('preview')) return 'preview';
    if (haystack.includes('qg')) return 'qg';
    if (haystack.includes('teste') || haystack.includes('test') || haystack.includes('lab')) return 'teste-lab';
    if (haystack.includes('loze')) return 'loze';
    return 'site-app';
  };

  const launcherItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return netlifyLauncherRegistry.filter((item) => {
      const kind = getLauncherKind(item.name, item.url);
      const matchesFilter = launcherFilter === 'todos' || kind === launcherFilter;
      const matchesSearch = !query || item.name.toLowerCase().includes(query) || item.url.toLowerCase().includes(query);
      return matchesFilter && matchesSearch;
    });
  }, [searchQuery, launcherFilter]);

  const launcherLabel: Record<LauncherFilter, string> = {
    todos: 'Todos',
    loze: 'LOZE',
    qg: 'QGs',
    preview: 'Previews',
    'teste-lab': 'Testes / Labs',
    'site-app': 'Sites / Apps'
  };

  // Helper to toggle filters
  const toggleFilter = (filter: string) => {
    setActiveFilters(prev => 
      prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter]
    );
  };

  // Build the nodes based on requested architecture + actual data
  const nodes = useMemo(() => {
    const nodeList: EcosystemNode[] = [];

    // Helper to find BU
    const findBU = (idOrName: string) => businessUnits.find(bu => bu.id.toLowerCase() === idOrName.toLowerCase() || bu.name.toLowerCase() === idOrName.toLowerCase());
    
    // NÚCLEO
    const grupobBU = findBU('grupob');
    nodeList.push({
      id: 'grupob',
      name: 'GrupoB / Douglas Rodrigues',
      type: 'grupo',
      description: 'Holding e Liderança Central',
      themeColor: grupobBU?.themeColor || '#0f172a',
      logo: grupobBU?.logo,
      buRef: grupobBU,
      agents: agents.filter(a => a.buId === 'grupob')
    });

    // PRIMEIRA CAMADA: GOVERNANÇA
    nodeList.push({
      id: 'gov-pedro',
      name: 'Pedro Nassar',
      type: 'governanca',
      description: 'Direção de Governança',
      themeColor: '#334155'
    });
    nodeList.push({
      id: 'gov-conselho',
      name: 'Conselho',
      type: 'governanca',
      description: 'Conselho Consultivo',
      themeColor: '#334155',
      agents: agents.filter(a => ['ca006gpb', 'ca007gpb'].includes(a.id))
    });
    nodeList.push({
      id: 'gov-auditoria',
      name: 'Auditoria IA',
      type: 'governanca',
      description: 'Monitoramento de Compliance',
      themeColor: '#334155',
      agents: [] // In future, map to real audit agents
    });

    // SEGUNDA CAMADA: EMPRESAS-PILAR
    const pilares = ['3forB', 'StartyB', 'InstitutoB'];
    pilares.forEach(pilar => {
      const bu = findBU(pilar);
      nodeList.push({
        id: `pilar-${pilar.toLowerCase()}`,
        name: bu?.name || pilar,
        type: 'pilar',
        description: bu?.description || `Empresa-pilar: ${pilar}`,
        themeColor: bu?.themeColor || '#2563eb',
        logo: bu?.logo,
        buRef: bu,
        agents: bu ? agents.filter(a => a.buId === bu.id) : []
      });
    });

    // TERCEIRA CAMADA: VENTURES E INCUBADAS
    const knownVentures = ['Ziplia', 'Nuexus', 'Domusys', 'Tegas', 'Adamuse', 'Audacus'];
    // Also add any other venture from businessUnits not already added
    const otherVentures = businessUnits.filter(bu => 
      bu.type === 'VENTURY' && 
      !knownVentures.some(kv => kv.toLowerCase() === bu.name.toLowerCase())
    );

    [...knownVentures.map(v => ({ name: v, bu: findBU(v) })), ...otherVentures.map(v => ({ name: v.name, bu: v }))].forEach(item => {
      nodeList.push({
        id: `venture-${item.name.toLowerCase()}`,
        name: item.bu?.name || item.name,
        type: 'venture',
        description: item.bu?.description || `Venture: ${item.name}`,
        themeColor: item.bu?.themeColor || '#ea580c',
        logo: item.bu?.logo,
        buRef: item.bu,
        agents: item.bu ? agents.filter(a => a.buId === item.bu.id) : []
      });
    });

    // QUARTA CAMADA: METODOLOGIAS E INFRAESTRUTURA
    const metodologias = ['DR', 'GERAC', 'Jornada UAU', 'Rota 5 Estrelas', 'Árvore Clientológica'];
    metodologias.forEach(met => {
      const bu = findBU(met);
      nodeList.push({
        id: `met-${met.toLowerCase().replace(/\s+/g, '-')}`,
        name: met,
        type: 'metodologia',
        description: `Framework corporativo: ${met}`,
        themeColor: '#8b5cf6',
        buRef: bu
      });
    });

    const infra = ['Agentes', 'Protocolos', 'CRM', 'IA', 'ClickUp', 'n8n', 'Documentos'];
    infra.forEach(inf => {
      nodeList.push({
        id: `infra-${inf.toLowerCase().replace(/\s+/g, '-')}`,
        name: inf,
        type: 'infraestrutura',
        description: `Recurso de Sistema: ${inf}`,
        themeColor: '#0ea5e9'
      });
    });

    return nodeList;
  }, [businessUnits, agents]);

  // Filter nodes based on search and filters
  const filteredNodes = useMemo(() => {
    let result = nodes;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(n => n.name.toLowerCase().includes(query) || n.type.toLowerCase().includes(query));
    }

    if (activeFilters.length > 0) {
      result = result.filter(n => {
        if (activeFilters.includes('empresas') && n.type === 'pilar') return true;
        if (activeFilters.includes('ventures') && (n.type === 'venture' || n.type === 'incubada')) return true;
        if (activeFilters.includes('metodologias') && n.type === 'metodologia') return true;
        if (activeFilters.includes('governanca') && n.type === 'governanca') return true;
        if (activeFilters.includes('infraestrutura') && n.type === 'infraestrutura') return true;
        // Group always visible if no strict exclusion
        if (n.type === 'grupo') return true;
        return false;
      });
    }

    return result;
  }, [nodes, searchQuery, activeFilters]);

  // Group filtered nodes by layer
  const layers = useMemo(() => {
    return {
      nucleo: filteredNodes.filter(n => n.type === 'grupo'),
      governanca: filteredNodes.filter(n => n.type === 'governanca'),
      pilares: filteredNodes.filter(n => n.type === 'pilar'),
      ventures: filteredNodes.filter(n => n.type === 'venture' || n.type === 'incubada'),
      metodologias: filteredNodes.filter(n => n.type === 'metodologia'),
      infraestrutura: filteredNodes.filter(n => n.type === 'infraestrutura')
    };
  }, [filteredNodes]);

  const selectedNode = nodes.find(n => n.id === selectedNodeId);
  const selectedNodeQg = selectedNode?.buRef ? getQgByBuId(selectedNode.buRef.id) : null;

  const handleOpenQg = () => {
    if (!selectedNodeQg) return;

    if (selectedNodeQg.entryType === 'internal-tab' && selectedNodeQg.tab) {
      onNavigate(selectedNodeQg.tab);
      return;
    }

    if (selectedNodeQg.entryType === 'external-url' && selectedNodeQg.url) {
      window.open(selectedNodeQg.url, '_blank', 'noopener,noreferrer');
    }
  };

  // Type color mapping
  const getTypeColor = (type: NodeType) => {
    const colors = {
      grupo: 'bg-slate-900 text-white border-slate-800',
      governanca: 'bg-slate-700 text-white border-slate-600',
      pilar: 'bg-blue-600 text-white border-blue-500',
      venture: 'bg-orange-50 text-orange-700 border-orange-200',
      incubada: 'bg-amber-50 text-amber-700 border-amber-200',
      metodologia: 'bg-purple-50 text-purple-700 border-purple-200',
      infraestrutura: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      agente: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    };
    return colors[type] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const getBadgeStyle = (type: NodeType) => {
     const colors = {
      grupo: 'bg-slate-800 text-slate-100',
      governanca: 'bg-slate-600 text-slate-100',
      pilar: 'bg-blue-100 text-blue-800',
      venture: 'bg-orange-100 text-orange-800',
      incubada: 'bg-amber-100 text-amber-800',
      metodologia: 'bg-purple-100 text-purple-800',
      infraestrutura: 'bg-cyan-100 text-cyan-800',
      agente: 'bg-emerald-100 text-emerald-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  }

  // Node Component
  const NodeCard: React.FC<{ node: EcosystemNode }> = ({ node }) => {
    const isSelected = selectedNodeId === node.id;
    const hasAgents = node.agents && node.agents.length > 0;
    
    return (
      <div 
        onClick={() => setSelectedNodeId(node.id === selectedNodeId ? null : node.id)}
        className={`
          relative flex flex-col items-center justify-center p-4 rounded-2xl cursor-pointer transition-all duration-300
          border-2 shadow-sm hover:shadow-md
          ${isSelected ? 'ring-4 ring-indigo-500/20 scale-105 z-20' : 'hover:-translate-y-1 z-10 hover:z-20'}
          ${viewMode === 'relacional' && selectedNodeId && !isSelected ? 'opacity-40 grayscale' : 'opacity-100'}
          ${getTypeColor(node.type)}
        `}
        style={node.type === 'grupo' || node.type === 'pilar' ? { backgroundColor: node.themeColor, borderColor: 'rgba(0,0,0,0.1)' } : undefined}
      >
        {node.logo ? (
           <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl bg-white p-2 mb-2 shadow-sm flex items-center justify-center">
             <img src={node.logo} alt={node.name} className="w-full h-full object-contain" />
           </div>
        ) : (
          <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl bg-white/20 mb-2 shadow-sm flex items-center justify-center text-xl font-black backdrop-blur-sm">
             {node.name.substring(0, 2).toUpperCase()}
          </div>
        )}
        
        <h3 className={`text-center font-black uppercase tracking-tight text-[10px] md:text-xs max-w-[120px] truncate ${node.type === 'grupo' || node.type === 'pilar' || node.type === 'governanca' ? 'text-white' : ''}`}>
          {node.name}
        </h3>
        
        {viewMode === 'operacional' && hasAgents && (
           <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[9px] font-black border-2 border-white shadow-sm animate-pulse">
             {node.agents?.length}
           </div>
        )}
      </div>
    );
  };


  if (hubSection === 'launcher') {
    return (
      <div className="flex h-full bg-[#F8FAFC] dark:bg-sagb-bg font-sans transition-colors duration-300 overflow-hidden">
        <div className="flex-1 flex flex-col h-full min-w-0">
          <header className="shrink-0 bg-white dark:bg-sagb-panel border-b border-gray-100 dark:border-white/5 px-5 md:px-8 py-5 md:py-6 z-30 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-black text-slate-900 dark:text-sagb-text tracking-tighter uppercase">Aplicativos & Links</h1>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px] font-black uppercase tracking-widest">
                    {netlifyLauncherSnapshot.count} projetos
                  </span>
                </div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-sagb-muted uppercase tracking-widest">
                  Launcher geral do ecossistema · fonte: Netlify · snapshot {netlifyLauncherSnapshot.capturedAt}
                </p>
              </div>

              <button
                onClick={() => { setHubSection('mapa'); setSearchQuery(''); }}
                className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-md"
              >
                Ver mapa do ecossistema
              </button>
            </div>

            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
              <div className="relative w-full xl:w-96">
                <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Buscar projeto, domínio ou URL..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-sagb-bg-2 border border-slate-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs font-bold text-slate-700 dark:text-sagb-text outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all placeholder:text-slate-400"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {(Object.keys(launcherLabel) as LauncherFilter[]).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setLauncherFilter(filter)}
                    className={`px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border ${
                      launcherFilter === filter
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-white dark:bg-sagb-panel text-slate-500 dark:text-sagb-muted border-slate-200 dark:border-white/10 hover:border-slate-300'
                    }`}
                  >
                    {launcherLabel[filter]}
                  </button>
                ))}
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-5 md:p-8 custom-scrollbar">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between gap-4 mb-5">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {launcherItems.length} resultado{launcherItems.length === 1 ? '' : 's'}
                </p>
                <p className="hidden md:block text-[10px] font-bold text-slate-400">
                  Clique em um card para abrir em nova aba
                </p>
              </div>

              {launcherItems.length === 0 ? (
                <div className="bg-white dark:bg-sagb-panel border border-slate-200 dark:border-white/10 rounded-2xl p-10 text-center">
                  <p className="text-sm font-black text-slate-700 dark:text-sagb-text">Nenhum projeto encontrado.</p>
                  <button
                    onClick={() => { setSearchQuery(''); setLauncherFilter('todos'); }}
                    className="mt-4 px-4 py-2 rounded-lg bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest"
                  >
                    Limpar busca
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                  {launcherItems.map((item) => {
                    const kind = getLauncherKind(item.name, item.url);
                    let hostname = item.url;
                    try { hostname = new URL(item.url).hostname; } catch {}
                    return (
                      <article
                        key={item.id}
                        onClick={() => window.open(item.url, '_blank', 'noopener,noreferrer')}
                        className="group bg-white dark:bg-sagb-panel border border-slate-200 dark:border-white/10 rounded-2xl p-5 cursor-pointer hover:-translate-y-0.5 hover:shadow-lg hover:border-slate-300 dark:hover:border-white/20 transition-all min-w-0"
                      >
                        <div className="flex items-start justify-between gap-4 mb-5">
                          <div className="w-11 h-11 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center text-xs font-black uppercase shadow-sm">
                            {item.name.substring(0, 2)}
                          </div>
                          <span className="px-2 py-1 rounded-md bg-slate-50 dark:bg-sagb-bg-2 border border-slate-100 dark:border-white/5 text-[8px] font-black text-slate-500 dark:text-sagb-muted uppercase tracking-widest">
                            {launcherLabel[kind]}
                          </span>
                        </div>

                        <h2 className="text-sm font-black text-slate-900 dark:text-sagb-text truncate mb-1" title={item.name}>
                          {item.name}
                        </h2>
                        <p className="text-[10px] font-semibold text-slate-400 truncate mb-5" title={item.url}>
                          {hostname}
                        </p>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              window.open(item.url, '_blank', 'noopener,noreferrer');
                            }}
                            className="flex-1 py-2.5 rounded-lg bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest group-hover:bg-black transition-colors"
                          >
                            Abrir
                          </button>
                          <button
                            onClick={async (event) => {
                              event.stopPropagation();
                              try { await navigator.clipboard.writeText(item.url); } catch {}
                            }}
                            className="px-3 py-2.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-500 dark:text-sagb-muted text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                            title="Copiar URL"
                          >
                            Copiar
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </main>

          <footer className="shrink-0 bg-white dark:bg-sagb-panel border-t border-slate-100 dark:border-white/5 px-5 md:px-8 py-3 flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
            <span>Inventário real da equipe Netlify</span>
            <span>Sem alteração em produção</span>
          </footer>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-[#F8FAFC] dark:bg-sagb-bg font-sans transition-colors duration-300 overflow-hidden">
      
      {/* LEFT / CENTER: MAIN CONTENT AREA */}
      <div className={`flex-1 flex flex-col h-full transition-all duration-300 ${selectedNodeId ? 'mr-80' : ''}`}>
        
        {/* ZONA 1: TOPO */}
        <header className="shrink-0 bg-white dark:bg-sagb-panel border-b border-gray-100 dark:border-white/5 px-8 py-6 z-30 shadow-sm transition-colors duration-300">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3"><h1 className="text-2xl font-black text-slate-900 dark:text-sagb-text tracking-tighter uppercase">Ecossistema Master</h1><button onClick={() => { setHubSection('launcher'); setSearchQuery(''); }} className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all">Aplicativos & Links</button></div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-sagb-muted uppercase tracking-widest">Command Center GrupoB</p>
            </div>
            
            <div className="flex items-center gap-3">
               <div className="bg-slate-50 dark:bg-sagb-bg-2 border border-slate-200 dark:border-white/10 rounded-xl flex p-1">
                  {(['institucional', 'operacional', 'relacional'] as ViewMode[]).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === mode ? 'bg-white dark:bg-sagb-panel text-slate-900 dark:text-sagb-text shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      {mode}
                    </button>
                  ))}
               </div>
               <button 
                  onClick={() => setExpandedAll(!expandedAll)} 
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-md"
               >
                 {expandedAll ? 'Recolher' : 'Expandir Tudo'}
               </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Search */}
            <div className="relative w-full md:w-64">
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input 
                type="text" 
                placeholder="Buscar no ecossistema..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-sagb-bg-2 border border-slate-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold text-slate-700 dark:text-sagb-text outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap items-center gap-2">
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mr-2">Filtros:</span>
               {['empresas', 'ventures', 'metodologias', 'governanca', 'infraestrutura'].map(filter => (
                 <button
                   key={filter}
                   onClick={() => toggleFilter(filter)}
                   className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border ${activeFilters.includes(filter) ? 'bg-slate-800 text-white border-slate-800 shadow-sm' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}
                 >
                   {filter}
                 </button>
               ))}
            </div>
          </div>
        </header>

        {/* ZONA 2: CENTRO (MAPA VISUAL) */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-8 md:p-12 custom-scrollbar relative">
          
          {/* Fundo de conexões sistêmicas (Visual apenas no relacional) */}
          {viewMode === 'relacional' && (
            <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-200 via-transparent to-transparent"></div>
          )}

          <div className="max-w-6xl mx-auto flex flex-col items-center gap-16 relative z-10 pb-20">
            
            {/* NÚCLEO */}
            {layers.nucleo.length > 0 && (
              <div className="flex flex-col items-center w-full relative">
                <div className="mb-4">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-white px-4 py-1.5 rounded-full shadow-sm border border-slate-100">Núcleo Estratégico</span>
                </div>
                <div className="flex justify-center gap-6">
                  {layers.nucleo.map(n => <NodeCard key={n.id} node={n} />)}
                </div>
                {/* Connection line down */}
                <div className="w-px h-16 bg-gradient-to-b from-slate-300 to-transparent absolute -bottom-16 left-1/2 -translate-x-1/2"></div>
              </div>
            )}

            {/* PRIMEIRA CAMADA: GOVERNANÇA */}
            {layers.governanca.length > 0 && (
              <div className="flex flex-col items-center w-full relative">
                <div className="mb-4">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-white px-4 py-1.5 rounded-full shadow-sm border border-slate-100">Governança & Board</span>
                </div>
                <div className="flex flex-wrap justify-center gap-4 md:gap-8">
                  {layers.governanca.map(n => <NodeCard key={n.id} node={n} />)}
                </div>
                <div className="w-px h-16 bg-gradient-to-b from-slate-200 to-transparent absolute -bottom-16 left-1/2 -translate-x-1/2"></div>
              </div>
            )}

            {/* SEGUNDA CAMADA: EMPRESAS-PILAR */}
            {layers.pilares.length > 0 && (
              <div className="flex flex-col items-center w-full relative">
                <div className="mb-6">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-white px-4 py-1.5 rounded-full shadow-sm border border-slate-100">Empresas-Pilar</span>
                </div>
                <div className="flex flex-wrap justify-center gap-4 md:gap-8">
                  {layers.pilares.map(n => <NodeCard key={n.id} node={n} />)}
                </div>
                <div className="w-px h-16 bg-gradient-to-b from-slate-200 to-transparent absolute -bottom-16 left-1/2 -translate-x-1/2"></div>
              </div>
            )}

            {/* TERCEIRA CAMADA: VENTURES E INCUBADAS */}
            {layers.ventures.length > 0 && (
              <div className="flex flex-col items-center w-full relative">
                <div className="mb-6">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-white px-4 py-1.5 rounded-full shadow-sm border border-slate-100">Ventures & Incubadas</span>
                </div>
                <div className="flex flex-wrap justify-center gap-3 md:gap-5 max-w-4xl">
                  {layers.ventures.map(n => <NodeCard key={n.id} node={n} />)}
                </div>
              </div>
            )}

            {/* QUARTA CAMADA: METODOLOGIAS E INFRA */}
            {(layers.metodologias.length > 0 || layers.infraestrutura.length > 0) && (
              <div className="flex flex-col items-center w-full relative pt-12 border-t border-dashed border-slate-200 mt-8">
                 <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-[#F8FAFC] px-4 py-1">Fundação Estrutural</span>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full max-w-5xl">
                    {/* Metodologias */}
                    {layers.metodologias.length > 0 && (
                      <div className="flex flex-col items-center">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Metodologias</h4>
                        <div className="flex flex-wrap justify-center gap-3">
                          {layers.metodologias.map(n => <NodeCard key={n.id} node={n} />)}
                        </div>
                      </div>
                    )}
                    
                    {/* Infraestrutura */}
                    {layers.infraestrutura.length > 0 && (
                      <div className="flex flex-col items-center">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Infraestrutura</h4>
                        <div className="flex flex-wrap justify-center gap-3">
                          {layers.infraestrutura.map(n => <NodeCard key={n.id} node={n} />)}
                        </div>
                      </div>
                    )}
                 </div>
              </div>
            )}

          </div>
        </div>

        {/* ZONA 4: LEGENDA (BASE) */}
        <div className="shrink-0 bg-white dark:bg-sagb-panel border-t border-slate-100 dark:border-white/5 px-8 py-3 flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-slate-400 transition-colors duration-300">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-slate-900 dark:bg-slate-400"></div> Núcleo</span>
            <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-600"></div> Pilar</span>
            <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-orange-200"></div> Venture</span>
            <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-purple-200"></div> Metodologia</span>
          </div>
          <div className="flex items-center gap-4">
             <span>Modo Atual: <span className="text-slate-700 dark:text-sagb-muted">{viewMode}</span></span>
          </div>
        </div>
      </div>

      {/* ZONA 3: LATERAL DIREITA (GAVETA DE DETALHES) */}
      <div 
        className={`fixed top-0 right-0 h-full w-80 bg-white dark:bg-sagb-panel shadow-2xl border-l border-slate-100 dark:border-white/5 transform transition-transform duration-300 ease-in-out z-50 flex flex-col ${selectedNodeId ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {selectedNode && (
          <>
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-start">
              <div>
                <span className={`inline-block px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest mb-3 ${getBadgeStyle(selectedNode.type)}`}>
                  {selectedNode.type}
                </span>
                <h2 className="text-xl font-black text-slate-900 leading-tight mb-1">{selectedNode.name}</h2>
              </div>
              <button 
                onClick={() => setSelectedNodeId(null)}
                className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center hover:bg-slate-300 hover:text-slate-800 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
              {/* Descrição */}
              <section>
                <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-100 pb-2">Sobre</h3>
                <p className="text-xs font-semibold text-slate-600 leading-relaxed">{selectedNode.description || 'Nenhuma descrição disponível para esta entidade no momento.'}</p>
              </section>

              {/* Ações / Atalhos */}
              <section className="space-y-3">
                 {selectedNode.buRef && (
                   <button 
                      onClick={() => onSelectBU(selectedNode.buRef!)}
                      className="w-full py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-md flex items-center justify-center gap-2 group"
                   >
                     <span>Entrar na Unidade</span>
                     <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
                   </button>
                 )}

                 {selectedNodeQg && (
                    <button 
                      onClick={handleOpenQg}
                      className="w-full py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-md flex items-center justify-center gap-2 group"
                    >
                      <span>Entrar no QG</span>
                      <span className="text-[8px] px-2 py-0.5 rounded bg-white/20 uppercase tracking-widest">{selectedNodeQg.status}</span>
                    </button>
                 )}

                 {selectedNodeQg && (
                    <p className="text-[10px] text-slate-500 leading-relaxed bg-slate-50 border border-slate-100 rounded-lg p-3">
                      Origem registrada: <span className="font-mono">{selectedNodeQg.sourcePath || 'não informado'}</span>
                    </p>
                 )}

                 {viewMode === 'operacional' && (
                    <div className="grid grid-cols-2 gap-2">
                       <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                         <span className="block text-xl font-black text-slate-800">0</span>
                         <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Tarefas</span>
                       </div>
                       <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                         <span className="block text-xl font-black text-emerald-600">100%</span>
                         <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Saúde</span>
                       </div>
                    </div>
                 )}
              </section>

              {/* Agentes Ligados */}
              {(selectedNode.agents || []).length > 0 && (
                <section>
                  <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2 flex justify-between">
                    <span>Agentes de IA Operando</span>
                    <span className="text-slate-600 bg-slate-100 px-1.5 rounded">{selectedNode.agents!.length}</span>
                  </h3>
                  <div className="space-y-2">
                    {selectedNode.agents!.map(agent => (
                      <div 
                        key={agent.id} 
                        onClick={() => { if (!isAgentOperationallyBlocked(agent) && onSelectAgent) onSelectAgent(agent); }} 
                        className={`flex items-center gap-3 p-2 rounded-xl border transition-all ${isAgentOperationallyBlocked(agent) ? 'opacity-50 bg-slate-50 border-slate-100 cursor-not-allowed' : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm cursor-pointer'}`}
                      >
                        <Avatar name={agent.name} url={agent.avatarUrl} className="w-8 h-8 rounded-lg shadow-sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold text-slate-800 truncate">{agent.name}</p>
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest truncate">{agent.officialRole}</p>
                        </div>
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getOperationalStatusLabel(deriveOperationalStatus(agent)) === 'Ativo' ? '#10b981' : '#cbd5e1' }}></div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Vínculos (mockados para Relacional) */}
              {viewMode === 'relacional' && (
                <section>
                  <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">Conexões Estratégicas</h3>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-purple-50 text-purple-600 border border-purple-100 rounded text-[8px] font-black uppercase tracking-widest">Metodologia: Jornada UAU</span>
                    <span className="px-2 py-1 bg-cyan-50 text-cyan-600 border border-cyan-100 rounded text-[8px] font-black uppercase tracking-widest">Infra: Hub CRM</span>
                  </div>
                </section>
              )}
            </div>
          </>
        )}
      </div>

    </div>
  );
};

export default HubView;
