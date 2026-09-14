import React, { useEffect, useMemo, useState } from 'react';
import { TabId, BusinessUnit, UserProfile } from '../types';
import { getRegisteredModules } from '../src/core/modules/moduleRegistry';
import { ModuleToggleMap, readModuleToggles, isModuleEnabled as resolveModuleEnabled, readModuleOrder, sortModulesByOrder } from '../src/core/modules/moduleActivation';
import { CurrencyDollarIcon, SearchIcon, MessageSquareIcon, FolderIcon, BookIcon, ShieldCheckIcon, CubeIcon, LockIcon, FileTextIcon, PlayIcon, MicIcon, VideoIcon, UserPlusIcon, AlertCircleIcon, PencilIcon, HomeIcon, BriefcaseIcon, ClipboardIcon, NetworkIcon, LayoutIcon, CalendarIcon, CompassIcon, TerminalIcon, BotIcon } from './Icon';


// ============================================================================
// SIDEBAR — GUIA RÁPIDO DE MANUTENÇÃO
// ----------------------------------------------------------------------------
// 1) Onde alterar ITENS DO MENU:
//    - Lista base fixa: coreMenuItems (id/label/tooltip/visibilidade)
//
// 2) Onde alterar ÍCONES:
//    - getIconForItem(id): map id -> ícone
//
// 3) Onde alterar CORES / HOVER / ATIVO:
//    - className do botão em renderMenuItem()
//    - barra vertical do item ativo (div absoluta)
//
// 4) Onde alterar TOOLTIP do hover:
//    - bloco {item.tooltip && (...)}
//
// 5) Onde entram MÓDULOS DINÂMICOS:
//    - dynamicModules (getRegisteredModules)
//
// 6) Deduplicação (não repetir item):
//    - por ID + por label normalizado em menuItems
// ============================================================================

interface SidebarProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  agentCount: number;
  activeBU: BusinessUnit;
  version?: string;
  onReset?: () => void;
  onLogout?: () => void;
  userProfile?: UserProfile | null;
}

const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  agentCount: _agentCount,
  activeBU: _activeBU,
  version = "1.8.1",
  onReset: _onReset,
  onLogout: _onLogout,
  userProfile: _userProfile
}) => {
  // [UI] Controle do menu no mobile (abre/fecha overlay + sidebar)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // [Estado] Chaveado por módulo: true/false para exibir item dinâmico
  // Exemplo: { "hub-integracao": true, "nucleo_de_agentes": true }
  const [moduleToggles, setModuleToggles] = useState<ModuleToggleMap>({});

  useEffect(() => {
    const syncToggles = () => setModuleToggles(readModuleToggles(_userProfile?.workspaceId));
    syncToggles();

    const onStorage = () => syncToggles();
    const onCustom = () => syncToggles();

    window.addEventListener('storage', onStorage);
    window.addEventListener('sagb:module-toggles-changed', onCustom as EventListener);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('sagb:module-toggles-changed', onCustom as EventListener);
    };
  }, [_userProfile?.workspaceId]);

  // [Estado] Ordem personalizada dos módulos
  const [moduleOrder, setModuleOrder] = useState<string[]>(() => readModuleOrder());

  useEffect(() => {
    const onOrderChange = () => setModuleOrder(readModuleOrder());
    window.addEventListener('sagb:module-order-changed', onOrderChange as EventListener);
    return () => window.removeEventListener('sagb:module-order-changed', onOrderChange as EventListener);
  }, []);

  // --------------------------------------------------------------------------
  // [MAPA DE ÍCONES]
  // - Se um item aparecer com ícone genérico de pasta, faltou mapear o ID aqui
  // - Chave = id do menu | Valor = componente ícone
  // --------------------------------------------------------------------------
  const getIconForItem = (id: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'home': <HomeIcon className="w-4 h-4" />,
      'nic': <CompassIcon className="w-4 h-4" />,
      'intelligence-flow': <NetworkIcon className="w-4 h-4" />,
      'nagi': <CubeIcon className="w-4 h-4" />,
      'management': <LayoutIcon className="w-4 h-4" />,
      'nucleo_de_agentes': <ShieldCheckIcon className="w-4 h-4" />,
      'central_padroes': <ShieldCheckIcon className="w-4 h-4" />,
      'ecosystem': <BriefcaseIcon className="w-4 h-4" />,
      'cadastro-empresas': <ClipboardIcon className="w-4 h-4" />,
      'nucleo-conversacional': <MessageSquareIcon className="w-4 h-4" />,
      'team': <UserPlusIcon className="w-4 h-4" />,
      'sala-dev': <TerminalIcon className="w-4 h-4" />,
      'programmers-room': <TerminalIcon className="w-4 h-4" />,
      'vault': <LockIcon className="w-4 h-4" />,
      'cid': <FileTextIcon className="w-4 h-4" />,
      'continuous-memory': <BookIcon className="w-4 h-4" />,
      'studio': <VideoIcon className="w-4 h-4" />,
      'karaoke': <PlayIcon className="w-4 h-4" />,
      'monitoramento': <AlertCircleIcon className="w-4 h-4" />,
      'missions': <PlayIcon className="w-4 h-4" />,
      'agentes_comerciais': <BotIcon className="w-4 h-4" />,
      'fabrica-ca': <BotIcon className="w-4 h-4" />,
      'quadro_de_elite': <BotIcon className="w-4 h-4" />,
      'foco-total': <BotIcon className="w-4 h-4" />,
      'agenda': <CalendarIcon className="w-4 h-4" />,
      'mentorias': <MicIcon className="w-4 h-4" />,
      'gestao-financeira': <CurrencyDollarIcon className="w-4 h-4" />,
      'hub-integracao': <NetworkIcon className="w-4 h-4" />,
      'configuracoes-sistema': <PencilIcon className="w-4 h-4" />,
      '_orquestracao-principal': <NetworkIcon className="w-4 h-4" />,
      'crm-ziplia': <BriefcaseIcon className="w-4 h-4" />,
      'nide': <LayoutIcon className="w-4 h-4" />,
    };
    return iconMap[id] || <FolderIcon className="w-4 h-4" />;
  };

  // --------------------------------------------------------------------------
  // [CONTRATO DE ITEM]
  // visibility:
  // - always   => sempre tenta mostrar (respeitando toggle de módulo)
  // - dev-only => só em contexto dev
  // - hidden   => nunca mostra
  // --------------------------------------------------------------------------
  type MenuVisibility = 'always' | 'dev-only' | 'hidden';
  type MenuSource = 'core' | 'dynamic';

  interface MenuItem {
    id: string;
    label: string;
    source: MenuSource;
    visibility: MenuVisibility;
  }

  // --------------------------------------------------------------------------
  // [LISTA BASE FIXA DO MENU]
  // id      => usado na navegação (setActiveTab)
  // label   => texto exibido no sidebar
  // tooltip => texto do balão ao passar mouse (se não quiser, remover)
  // --------------------------------------------------------------------------
  const coreMenuItems: MenuItem[] = [
    { id: 'home', label: 'Início', source: 'core', visibility: 'always' },
    { id: 'ecosystem', label: 'Aplicativos & Links', source: 'core', visibility: 'always' },
    { id: 'nucleo-conversacional', label: 'Conversas', source: 'core', visibility: 'always' },
    { id: 'programmers-room', label: 'Sala dos Programadores', source: 'core', visibility: 'hidden' },
    { id: 'missions', label: 'Missões', source: 'core', visibility: 'hidden' },
    { id: 'nic', label: 'NIC', source: 'core', visibility: 'always' },
    { id: 'intelligence-flow', label: 'Fluxo de Inteligência', source: 'core', visibility: 'always' },
    { id: 'nagi', label: 'NAGI', source: 'core', visibility: 'always' },
    { id: 'central_padroes', label: 'Central de Padrões', source: 'core', visibility: 'always' },
    { id: 'configuracoes-sistema', label: 'Configurações do Sistema', source: 'core', visibility: 'hidden' }
  ];

  // IDs fixos já ocupados pelo menu base
  const staticItemIds = new Set(coreMenuItems.map(item => item.id));

  // Normaliza labels para deduplicar: remove acento, trim e lowercase
  const normalizeLabel = (value: string) =>
    String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();

  const staticLabelSet = new Set(coreMenuItems.map((item) => normalizeLabel(item.label)));

  // Índice rápido dos manifests dos módulos
  const moduleManifestById = useMemo(() => {
    return getRegisteredModules().reduce((acc, mod) => {
      acc[mod.manifest.id] = mod.manifest;
      return acc;
    }, {} as Record<string, { id: string; initialStatus: 'active' | 'inactive' }>);
  }, []);

  // Define se módulo dinâmico aparece no menu
  // Prioridade:
  // 1) toggle salvo no localStorage
  // 2) initialStatus do manifest
  const isModuleEnabled = (moduleId: string) => {
    // Usa o toggle salvo (inclui itens do core que não estão no moduleRegistry)
    return resolveModuleEnabled(moduleId, moduleToggles);
  };

  // --------------------------------------------------------------------------
  // [MÓDULOS DINÂMICOS]
  // Vêm do registro global (moduleRegistry)
  // Regras:
  // - ignora IDs já existentes no menu fixo
  // - ignora labels duplicados com a lista fixa
  // - oculta módulos que foram migrados como domains internos do NIDE
  //   (missions → NIDE core, metodologias → NIDE domain, mentorias → NIDE domain)
  // --------------------------------------------------------------------------
  const NIDE_MIGRATED_MODULE_IDS = new Set(['missions', 'metodologias', 'mentorias']);

  const dynamicModules: MenuItem[] = useMemo(() => {
    const modules = getRegisteredModules()
      .filter((mod) => !staticItemIds.has(mod.manifest.id))
      .filter((mod) => !staticLabelSet.has(normalizeLabel(mod.manifest.displayName)))
      .filter((mod) => !NIDE_MIGRATED_MODULE_IDS.has(mod.manifest.id))
      .map((mod) => ({
        id: mod.manifest.id,
        label: mod.manifest.displayName,
        source: 'dynamic' as MenuSource,
        visibility: 'always' as MenuVisibility
      }));
    return sortModulesByOrder(modules, moduleOrder);
  }, [staticItemIds, staticLabelSet, moduleOrder]);

  // Merge final + ordenação personalizada + deduplicação
  const menuItems = useMemo(() => {
    const allItems = sortModulesByOrder([...coreMenuItems, ...dynamicModules], moduleOrder);
    const seenIds = new Set<string>();
    const seenLabels = new Set<string>();

    return allItems.filter((item) => {
      const normalized = normalizeLabel(item.label);
      if (seenIds.has(item.id)) return false;
      if (seenLabels.has(normalized)) return false;
      seenIds.add(item.id);
      seenLabels.add(normalized);
      return true;
    });
  }, [dynamicModules, moduleOrder]);

  // Contexto dev para itens dev-only
  const isDevContext = process.env.NODE_ENV === 'development' || localStorage.getItem('SAGB_DEV_MODE') === 'true';

  const isVisible = (item: MenuItem) => {
    if (item.visibility === 'hidden') return false;
    if (item.visibility === 'dev-only') return isDevContext;
    if (!isModuleEnabled(item.id)) return false;
    return true;
  };

  // --------------------------------------------------------------------------
  // [RENDER DE ITEM]
  // Pontos principais para customização visual:
  // - classe do botão (hover/ativo/tipografia/spacing)
  // - barra azul lateral do item ativo
  // - bloco de tooltip
  // --------------------------------------------------------------------------
  const renderMenuItem = (item: MenuItem) => {
    if (!isVisible(item)) return null;
    const isActive = activeTab === item.id;
    return (
      <div key={item.id} className="relative group w-full">
        <button
          onClick={() => {
            setActiveTab(item.id as TabId);
            setIsMobileMenuOpen(false); // Fecha o menu no mobile ao clicar
          }}
          aria-current={isActive ? 'page' : undefined}
          aria-label={`Abrir ${item.label}`}
          className={`
            group flex items-center w-full px-3 py-1.5 rounded-md transition-colors duration-200 relative text-[12px]
            ${isActive 
              ? 'bg-blue-50/40 dark:bg-blue-900/10 text-blue-700 dark:text-blue-400 font-semibold' 
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-white/5 font-normal hover:text-gray-800 dark:hover:text-gray-200'}
          `}
        >
          {/* Barra vertical do item ativo (lado esquerdo) */}
          {isActive && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-600 dark:bg-blue-500 rounded-r-md"></div>
          )}
          
          {/* Ícone do item */}
          <div className={`w-5 h-5 flex items-center justify-center mr-3 shrink-0 transition-colors duration-200 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`}>
            {getIconForItem(item.id)}
          </div>
          
          {/* Texto do menu */}
          <span className="flex-1 text-left tracking-normal truncate">
            {item.label}
          </span>
        </button>

      </div>
    );
  };

  return (
    <>
      {/* Botão Hambúrguer Mobile */}
      <button 
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden fixed bottom-6 right-6 z-[60] p-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95"
        aria-label="Toggle Menu"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isMobileMenuOpen ? (
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Overlay Escurecido Mobile */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[40] transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Principal */}
      <aside className={`
        fixed inset-y-0 left-0 z-[50] transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0 md:flex
        w-[260px] bg-white dark:bg-[#111111] flex-col h-full border-r border-gray-100 dark:border-white/5 shrink-0 font-sans py-6 text-gray-900 dark:text-gray-200 overflow-hidden
      `}>
      
      {/* INSTITUTIONAL BRANDING - GRUPO B */}
      <div className="flex flex-col items-center mb-6 px-2 shrink-0">
        <div className="w-8 h-8 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 flex-shrink-0 relative mb-2 bg-white dark:bg-gray-900 flex items-center justify-center">
          <div className="text-gray-900 dark:text-white font-black text-xs">GB</div>
        </div>
        <div className="flex flex-col items-center text-center">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white leading-tight tracking-tight">Grupo B</h2>
          <p className="text-[9px] text-gray-500 dark:text-gray-400 mt-0.5 uppercase tracking-wider font-medium">Sistema Avançado de Gestão</p>
        </div>
      </div>

      {/* SCROLLABLE CONTENT */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-4">
        {/* Lista única de itens (fonte canônica + dinâmicos deduplicados) */}
        <nav className="flex flex-col gap-0">
          {menuItems.map(renderMenuItem)}
        </nav>
      </div>

      {/* BLOCO 5 - SISTEMA (RODAPÉ) */}
      <div className="mt-auto pt-4 border-t border-gray-100 dark:border-white/5 px-6 pb-4 shrink-0">
        <div className="flex flex-col text-[10px] text-gray-400 font-medium space-y-1">
          <span>SagB v{version}</span>
          <span>by Dathex</span>
        </div>
      </div>
    </aside>
    </>
  );
};

export default Sidebar;
