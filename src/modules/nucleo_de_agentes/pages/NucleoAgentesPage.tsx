import { ModuleSidebarContent } from '../../../core/navigation/ModuleWorkspace';
import React, { useState, useEffect, useMemo } from 'react';
import { Agent, GovernanceCulture, ComplianceRule, VaultItem, KnowledgeNode } from '../../../types';
import { db } from '../../../../services/supabase';
import { collection, onSnapshot, query, orderBy } from '../../../../services/supabase';
import BaseDosAgentesView from '../components/BaseDosAgentesView';
import AgentFactory from '../components/AgentFactory';
import { ModuleHeader } from '../../../../components/ui/ModuleHeader';
import { getNucleoDeAgentesRuntimeContext } from '../store';

type TabView = 'identidades' | 'dna';

const normalizeStatus = (status: any) => {
  if (!status) return 'active';
  const s = String(status).toLowerCase();
  if (s === 'deleted' || s === 'archived') return s;
  return 'active';
};

const NucleoAgentesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabView>('identidades');

  // ── Dados do runtime context (injetados pelo host App.tsx) ──
  const runtime = getNucleoDeAgentesRuntimeContext();
  const {
    agents: runtimeAgents = [],
    businessUnits = [],
    ventures = [],
    activeBU,
    activeWorkspaceId,
    authUsersByEmail = {},
    activeSessionEmail,
    onNavigateToEcosystem,
    onActivate,
    onRemove,
    onManageIntelligence
  } = runtime;

  // ── Dados do dashboard DNA (subscrições diretas) ──
  const [agents, setAgents] = useState<Agent[]>([]);
  const [cultureEntries, setCultureEntries] = useState<GovernanceCulture[]>([]);
  const [complianceRules, setComplianceRules] = useState<ComplianceRule[]>([]);
  const [vaultItems, setVaultItems] = useState<VaultItem[]>([]);
  const [knowledgeNodes, setKnowledgeNodes] = useState<KnowledgeNode[]>([]);

  const latestCultureEntry = useMemo(() => {
    const filtered = cultureEntries.filter(entry => normalizeStatus(entry.status) !== 'deleted');
    if (filtered.length === 0) return null;
    return [...filtered].sort((a, b) => {
      const aTime = a.updatedAt instanceof Date ? a.updatedAt.getTime() : new Date(a.updatedAt).getTime();
      const bTime = b.updatedAt instanceof Date ? b.updatedAt.getTime() : new Date(b.updatedAt).getTime();
      return bTime - aTime;
    })[0];
  }, [cultureEntries]);

  const activeComplianceRule = useMemo(() => {
    const nonDeleted = complianceRules.filter(rule => normalizeStatus(rule.status) !== 'deleted');
    if (nonDeleted.length === 0) return null;
    const GLOBAL_COMPLIANCE_CODE = 'GOVERNANCE.GLOBAL.DEFAULT';
    const preferredByCode = nonDeleted.filter(rule => rule.code === GLOBAL_COMPLIANCE_CODE);
    const sourceRules = preferredByCode.length > 0 ? preferredByCode : nonDeleted;
    return [...sourceRules].sort((a, b) => {
      const aTime = a.updatedAt instanceof Date ? a.updatedAt.getTime() : new Date(a.updatedAt).getTime();
      const bTime = b.updatedAt instanceof Date ? b.updatedAt.getTime() : new Date(b.updatedAt).getTime();
      return bTime - aTime;
    })[0];
  }, [complianceRules]);

  const activeVaultEntries = useMemo(
    () => vaultItems.filter(item => {
      const status = normalizeStatus(item.status);
      return status !== 'deleted' && status !== 'archived';
    }),
    [vaultItems]
  );

  const visibleKnowledgeNodes = useMemo(
    () => knowledgeNodes.filter(node => {
      const status = normalizeStatus(node.status);
      return status !== 'archived' && status !== 'deleted';
    }),
    [knowledgeNodes]
  );

  // Subscrições aos dados em tempo real (dashboard DNA)
  useEffect(() => {
    const unsubscribeAgents = onSnapshot(collection(db, 'agents'), (snapshot) => {
      const remoteAgents = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Agent[];
      setAgents(remoteAgents);
    }, (error) => console.error('Erro ao carregar agentes:', error));

    const unsubscribeCulture = onSnapshot(
      query(collection(db, 'governance_global_culture'), orderBy('updated_at', 'desc')),
      (snapshot) => {
        const entries = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        })) as GovernanceCulture[];
        setCultureEntries(entries);
      },
      (error) => console.error('Erro ao carregar cultura:', error)
    );

    const unsubscribeCompliance = onSnapshot(
      query(collection(db, 'governance_compliance_rules'), orderBy('updated_at', 'desc')),
      (snapshot) => {
        const rules = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        })) as ComplianceRule[];
        setComplianceRules(rules);
      },
      (error) => console.error('Erro ao carregar compliance:', error)
    );

    const unsubscribeVault = onSnapshot(
      query(collection(db, 'vault_items'), orderBy('updated_at', 'desc')),
      (snapshot) => {
        const items = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        })) as VaultItem[];
        setVaultItems(items);
      },
      (error) => console.error('Erro ao carregar vault:', error)
    );

    const unsubscribeKnowledge = onSnapshot(
      query(collection(db, 'knowledge_nodes'), orderBy('updated_at', 'desc')),
      (snapshot) => {
        const nodes = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        })) as KnowledgeNode[];
        setKnowledgeNodes(nodes);
      },
      (error) => console.error('Erro ao carregar knowledge:', error)
    );

    return () => {
      unsubscribeAgents();
      unsubscribeCulture();
      unsubscribeCompliance();
      unsubscribeVault();
      unsubscribeKnowledge();
    };
  }, []);

  // Callbacks (dashboard DNA)
  const handleUpdateAgent = async (agent: Agent) => {
    console.log('Atualizar agente (placeholder)', agent);
  };

  const handleAddUnit = () => {
    console.log('Adicionar unidade (placeholder)');
  };

  const handleSaveCulture = async (payload: { contentMd: string; title?: string; summary?: string }) => {
    console.log('Salvar cultura (placeholder)', payload);
  };

  const handleSaveCompliance = async (markdown: string) => {
    console.log('Salvar compliance (placeholder)', markdown);
  };

  const handleCreateVaultItem = async (input: any) => {
    console.log('Criar vault item (placeholder)', input);
  };

  const handleDeleteVaultItem = async (id: string) => {
    console.log('Deletar vault item (placeholder)', id);
  };

  const handleCreateKnowledgeNode = async (input: any) => {
    console.log('Criar knowledge node (placeholder)', input);
  };

  const handleUpdateKnowledgeNode = async (id: string, updates: Partial<KnowledgeNode>) => {
    console.log('Atualizar knowledge node (placeholder)', id, updates);
  };

  const handleDeleteKnowledgeNode = async (id: string) => {
    console.log('Deletar knowledge node (placeholder)', id);
  };

  const tabs: { key: TabView; label: string }[] = [
    { key: 'identidades', label: 'Identidades' },
    { key: 'dna', label: 'DNA das Camadas' }
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50 dark:bg-sagb-bg font-inter text-[12px]">
      <ModuleHeader
        moduleName="Núcleo de Agentes"
        ownerName="Helen Dravet"
        moduleDocPath="../module-doc.ts"
      />

      {/* Abas de navegação interna */}
      <ModuleSidebarContent><div className="flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0B0F19] px-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div></ModuleSidebarContent>

      {/* Conteúdo da aba ativa */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'identidades' ? (
          activeBU ? (
            <AgentFactory
              onNavigateToEcosystem={onNavigateToEcosystem || (() => console.log('Navegar para ecossistema'))}
              onActivate={onActivate || ((agentData) => console.log('Agente ativado:', agentData))}
              onRemove={onRemove || ((agentId) => console.log('Remover agente:', agentId))}
              activeBU={activeBU}
              activeWorkspaceId={activeWorkspaceId}
              businessUnits={businessUnits}
              ventures={ventures}
              agents={runtimeAgents}
              onManageIntelligence={onManageIntelligence || ((agent) => console.log('Gerenciar inteligência:', agent))}
              authUsersByEmail={authUsersByEmail}
              activeSessionEmail={activeSessionEmail}
            />
          ) : (
            <div className="p-6">
              <p className="text-sm text-gray-500">Carregando dados do Núcleo de Agentes...</p>
            </div>
          )
        ) : (
          <BaseDosAgentesView
            onBack={() => window.history.back()}
            agents={agents}
            onUpdateAgent={handleUpdateAgent}
            businessUnits={[]}
            onAddUnit={handleAddUnit}
            cultureEntry={latestCultureEntry}
            complianceMarkdown={activeComplianceRule?.ruleMd || ''}
            onSaveCulture={handleSaveCulture}
            onSaveCompliance={handleSaveCompliance}
            vaultItems={activeVaultEntries}
            onCreateVaultItem={handleCreateVaultItem}
            onDeleteVaultItem={handleDeleteVaultItem}
            knowledgeNodes={visibleKnowledgeNodes}
            onCreateKnowledgeNode={handleCreateKnowledgeNode}
            onUpdateKnowledgeNode={handleUpdateKnowledgeNode}
            onDeleteKnowledgeNode={handleDeleteKnowledgeNode}
          />
        )}
      </div>
    </div>
  );
};

export default NucleoAgentesPage;
