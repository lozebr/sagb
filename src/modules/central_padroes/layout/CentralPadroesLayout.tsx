import React, { useMemo, useState } from 'react';
import { useTheme } from '../../../core/context/ThemeContext';
import DashboardPage from '../pages/DashboardPage';
import StandardsPage from '../pages/StandardsPage';
import DocumentsPage from '../pages/DocumentsPage';
import AreasPage from '../pages/AreasPage';
import ModulesPage from '../pages/ModulesPage';
import BaseModulesPage from '../pages/BaseModulesPage';
import ChecklistsPage from '../pages/ChecklistsPage';
import AuditsPage from '../pages/AuditsPage';
import DecisionsPage from '../pages/DecisionsPage';
import InternalDocsPage from '../pages/InternalDocsPage';
import ExternalDocsPage from '../pages/ExternalDocsPage';
import ArchivePage from '../pages/ArchivePage';
import DevModePage from '../pages/DevModePage';
import AgentsPage from '../pages/AgentsPage';
import SearchPage from '../pages/SearchPage';
import RelationshipsPage from '../pages/RelationshipsPage';
import ApprovalsPage from '../pages/ApprovalsPage';
import SettingsPage from '../pages/SettingsPage';
import CentralPadroesPage from '../pages/CentralPadroesPage';
import ChatPietroPage from '../pages/ChatPietroPage';
import GovernancePanelPage from '../pages/GovernancePanelPage';
import DocumentosMestresPage from '../pages/DocumentosMestresPage';
import DocumentoBasePage from '../pages/DocumentoBasePage';
import DocumentoDetalhePage from '../pages/DocumentoDetalhePage';
import DocumentoEditorPage from '../pages/DocumentoEditorPage';
import RelatoriosPage from '../pages/RelatoriosPage';
import SubdocumentosPrevistosPage from '../pages/SubdocumentosPrevistosPage';
import CuradoriaPage from '../pages/CuradoriaPage';
import TriagemIngestaoPage from '../pages/TriagemIngestaoPage';
import { centralPadroesSeedService } from '../services/centralPadroesSeedService';
import { sidebarSections, getViewLabel, breadcrumbLabels } from '../data/sidebarConfig';
import '../styles/centralDocs.css';

type CentralPadroesView =
  | 'dashboard'
  | 'chat-pietro'
  | 'governance-panel'
  | 'areas'
  | 'standards'
  | 'documents'
  | 'documento-detalhe'
  | 'documento-editor'
  | 'base-modules'
  | 'modules'
  | 'checklists'
  | 'audits'
  | 'decisions'
  | 'internal-docs'
  | 'external-docs'
  | 'archive'
  | 'dev-mode'
  | 'agent-mode'
  | 'search'
  | 'relationships'
  | 'approvals'
  | 'settings'
  | 'publisher'
  | 'tags'
  | 'ingestion'
  | 'evidence'
  | 'documentos-mestres'
  | 'documento-base-99'
  | 'relatorios'
  | 'subdocumentos-previstos'
  | 'curadoria';

export const CentralPadroesLayout: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [currentView, setCurrentView] = useState<CentralPadroesView>('dashboard');
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [seedStatus, setSeedStatus] = useState<string>('');
  const [menuQuery, setMenuQuery] = useState('');
  const [registerMenuOpen, setRegisterMenuOpen] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    Central: true,
    'Documentos e Padrões': true,
    'Auditoria e Execução': true,
    Módulos: true,
    Curadoria: false,
    Operação: false
  });

  const plannedView = (icon: string, title: string, description: string, nextView: CentralPadroesView = 'documents') => (
    <div className="cp-planned-state">
      <div className="cp-planned-icon">{icon}</div>
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
        <div className="cp-planned-grid">
          <span className="cp-visual-badge info">🔵 Funcionalidade planejada</span>
          <span className="cp-visual-badge attention">🟡 Requer curadoria</span>
          <span className="cp-visual-badge safe">🟢 Sem botão morto</span>
        </div>
        <button type="button" className="cp-docs-top-link primary" onClick={() => setCurrentView(nextView)}>Abrir área relacionada</button>
      </div>
    </div>
  );

  const renderCurrentView = () => {
    const openDocument = (documentId: string) => {
      setSelectedDocumentId(documentId);
      setCurrentView('documento-detalhe');
    };

    switch (currentView) {
      case 'dashboard':
        return <DashboardPage />;
      case 'chat-pietro':
        return <ChatPietroPage onOpenDocument={openDocument} />;
      case 'governance-panel':
        return <GovernancePanelPage />;
      case 'areas':
        return <AreasPage />;
      case 'standards':
        return <StandardsPage />;
      case 'documents':
        return <DocumentsPage onOpenDocument={openDocument} />;
      case 'documento-detalhe':
        return <DocumentoDetalhePage documentId={selectedDocumentId} onBack={() => setCurrentView('documents')} onEdit={(documentId) => { setSelectedDocumentId(documentId); setCurrentView('documento-editor'); }} onSendToCuradoria={() => setCurrentView('curadoria')} />;
      case 'documento-editor':
        return <DocumentoEditorPage documentId={selectedDocumentId} onBack={() => setCurrentView('documento-detalhe')} onSaved={(documentId) => { setSelectedDocumentId(documentId); setCurrentView('documento-detalhe'); }} />;
      case 'base-modules':
        return <BaseModulesPage />;
      case 'modules':
        return <ModulesPage />;
      case 'checklists':
        return <ChecklistsPage />;
      case 'audits':
        return <AuditsPage />;
      case 'decisions':
        return <DecisionsPage />;
      case 'internal-docs':
        return <InternalDocsPage onOpenDocument={openDocument} />;
      case 'external-docs':
        return <ExternalDocsPage onOpenDocument={openDocument} />;
      case 'archive':
        return <ArchivePage onOpenDocument={openDocument} />;
      case 'dev-mode':
        return <DevModePage />;
      case 'agent-mode':
        return <AgentsPage />;
      case 'search':
        return <SearchPage onNavigate={(viewId) => setCurrentView(viewId as CentralPadroesView)} onOpenDocument={openDocument} />;
      case 'relationships':
        return <RelationshipsPage />;
      case 'approvals':
        return <ApprovalsPage />;
      case 'settings':
        return <SettingsPage />;
      case 'publisher':
        return <CentralPadroesPage />;
      case 'tags':
        return plannedView('🏷️', 'Tags e classificação', 'Use esta área para planejar tags oficiais. Próximo passo: ligar tags aos documentos e padrões.', 'documents');
      case 'ingestion':
        return <TriagemIngestaoPage onOpenDocuments={() => setCurrentView('documents')} />;
      case 'evidence':
        return plannedView('🧪', 'Evidências', 'Área para provas, anexos e validações. Enquanto a storage oficial não estiver completa, registre evidências em Auditorias.', 'audits');
      case 'documentos-mestres':
        return <DocumentosMestresPage />;
      case 'documento-base-99':
        return <DocumentoBasePage />;
      case 'relatorios':
        return <RelatoriosPage />;
      case 'subdocumentos-previstos':
        return <SubdocumentosPrevistosPage />;
      case 'curadoria':
        return <CuradoriaPage />;
      default:
        return <DashboardPage />;
    }
  };

  const filteredTreeSections = useMemo(() => {
    const term = menuQuery.trim().toLowerCase();
    if (!term) return sidebarSections;
    return sidebarSections
      .map((section) => ({ ...section, rows: section.rows.filter((row) => row.label.toLowerCase().includes(term)) }))
      .filter((section) => section.rows.length > 0);
  }, [menuQuery]);

  const toggleSection = (label: string) => {
    setOpenSections((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const currentLabel = getViewLabel(currentView as string);

  const openRegisterTarget = (viewId: CentralPadroesView) => {
    setCurrentView(viewId);
    setRegisterMenuOpen(false);
  };

  const seedSupabase = async () => {
    setSeedStatus('Sincronizando fallback para Supabase...');
    try {
      const result = await centralPadroesSeedService.seedFallbackIntoSupabase();
      setSeedStatus(`Seed concluído: ${result.areas} áreas, ${result.standards} padrões, ${result.documents} docs, ${result.checklists} checklists, ${result.decisions} decisões, ${result.modules} módulos, ${result.baseModules} módulos base, ${result.agents} agentes.`);
    } catch (error) {
      setSeedStatus(`Falha no seed Supabase: ${String((error as Error)?.message || error)}`);
    }
  };

  return (
    <div className="cp-docs-root h-full overflow-hidden" data-mode={theme}>
      <div className="cp-docs-app h-full">
        <aside className="cp-docs-sidebar">
          <div className="cp-docs-brand-row">
            <div className="cp-docs-brand"><span className="cp-docs-brand-dot">CD</span><span>Central de Documentos e Padrões</span></div>
            <button className="cp-docs-icon-btn" type="button" title="Alternar modo" onClick={toggleTheme}>{theme === 'dark' ? '◑' : '◐'}</button>
          </div>

          <label className="cp-docs-search">
            <span>⌕</span>
            <input placeholder="Pesquisar na Central" value={menuQuery} onChange={(event) => setMenuQuery(event.target.value)} />
          </label>

          <nav className="cp-docs-tree">
            {filteredTreeSections.map((section) => (
              <div key={section.label} className="cp-docs-tree-section">
                <button type="button" className="cp-docs-tree-label cp-docs-tree-label-button" onClick={() => toggleSection(section.label)}>
                  <span>{section.label}</span>
                  <span>{openSections[section.label] ? '⌄' : '›'}</span>
                </button>
                {(openSections[section.label] || Boolean(menuQuery.trim())) && section.rows.map((row, index) => {
                  const isActive = currentView === row.id;
                  const className = [
                    'cp-docs-tree-row',
                    isActive ? 'active' : '',
                    'indent-1',
                    'has-parent',
                    index === 0 ? 'is-first' : '',
                    index === section.rows.length - 1 ? 'is-last' : ''
                  ].filter(Boolean).join(' ');
                  return (
                    <button key={row.id} type="button" onClick={() => setCurrentView(row.id as CentralPadroesView)} className={className} title={row.label}>
                      <span>{row.icon}</span>
                      <span className="cp-docs-tree-text">{row.label}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>

          <div className="cp-docs-sidebar-foot">
            <button type="button" onClick={() => setCurrentView('settings')} className={`cp-docs-tree-row ${currentView === 'settings' ? 'active' : ''}`}><span>⚙</span><span className="cp-docs-tree-text">Configurações</span></button>
            <button type="button" onClick={() => window.dispatchEvent(new CustomEvent('sagb:navigate', { detail: 'home' }))} className="cp-docs-tree-row"><span>←</span><span className="cp-docs-tree-text">Voltar ao SagB</span></button>
          </div>
        </aside>

        <main className="cp-docs-main">
          <header className="cp-docs-topbar">
            <div className="cp-docs-crumbs"><span>GrupoB</span><span className="sep">›</span><span>Central de Documentos e Padrões</span><span className="sep">›</span><strong>{currentLabel}</strong></div>
            <div className="cp-docs-top-actions">
              <button className="cp-docs-top-link" type="button" onClick={() => setCurrentView('search')}>Buscar</button>
              <button className="cp-docs-top-link ai" type="button" onClick={() => setCurrentView('chat-pietro')}>Pietro IA</button>
              <button className="cp-docs-top-link" type="button" onClick={seedSupabase}>Sincronizar</button>
              <div className="cp-docs-register-menu">
                <button className="cp-docs-top-link primary" type="button" onClick={() => setRegisterMenuOpen((value) => !value)} aria-expanded={registerMenuOpen} aria-haspopup="menu">Registrar ▾</button>
                {registerMenuOpen && (
                  <div className="cp-docs-register-popover" role="menu" aria-label="Registrar na Central">
                    <button type="button" role="menuitem" onClick={() => openRegisterTarget('relatorios')}>Registrar relatório</button>
                    <button type="button" role="menuitem" onClick={() => openRegisterTarget('audits')}>Registrar auditoria</button>
                    <button type="button" role="menuitem" onClick={() => openRegisterTarget('curadoria')}>Registrar item de curadoria</button>
                    <button type="button" role="menuitem" onClick={() => openRegisterTarget('agent-mode')}>Registrar LOZE-TRACE</button>
                  </div>
                )}
              </div>
              <button className="cp-docs-icon-btn" type="button" onClick={() => setCurrentView('settings')} title="Configurações">⋯</button>
            </div>
          </header>

          {renderCurrentView()}
          {seedStatus && <div className="cp-docs-toast">{seedStatus}</div>}
        </main>
      </div>

      <nav className="cp-docs-mobile-bottom">
        <button className="cp-docs-mobile-item" type="button" aria-label="Voltar ao SagB" onClick={() => window.dispatchEvent(new CustomEvent('sagb:navigate', { detail: 'home' }))}>←<span>SagB</span></button>
        <button className={`cp-docs-mobile-item ${currentView === 'dashboard' ? 'active' : ''}`} type="button" onClick={() => setCurrentView('dashboard')}>⌂<span>Início</span></button>
        <button className={`cp-docs-mobile-item ${currentView === 'chat-pietro' ? 'active' : ''}`} type="button" onClick={() => setCurrentView('chat-pietro')}>💬<span>Pietro</span></button>
        <button className={`cp-docs-mobile-item ${currentView === 'search' ? 'active' : ''}`} type="button" onClick={() => setCurrentView('search')}>⌕<span>Busca</span></button>
        <button className={`cp-docs-mobile-item ${currentView === 'governance-panel' ? 'active' : ''}`} type="button" onClick={() => setCurrentView('governance-panel')}>📊<span>Gov</span></button>
        <button className={`cp-docs-mobile-item ${currentView === 'settings' ? 'active' : ''}`} type="button" onClick={() => setCurrentView('settings')}>⋯<span>Mais</span></button>
      </nav>
    </div>
  );
};
