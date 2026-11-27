import { ModuleSidebarContent } from '../../../core/navigation/ModuleWorkspace';
import React, { useEffect, useMemo, useState } from 'react';
import { BibliotecaPanel } from '../components/biblioteca/BibliotecaPanel';
import { EstudioPanel } from '../components/estudio/EstudioPanel';
import { PreviewPanel } from '../components/preview/PreviewPanel';
import { ReferenciasPanel } from '../components/referencias/ReferenciasPanel';
import { CentralTabs } from '../components/shared/CentralTabs';
import { SuperTelaSagBPanel } from '../components/SuperTelaSagBPanel';
import { TelaAvancadaForm } from '../components/TelaAvancadaForm';
import { TelaAvancadaViewer } from '../components/TelaAvancadaViewer';
import { useTelasAvancadasStore } from '../store/telasAvancadas.store';
import { TelaAvancada } from '../types/telasAvancadas.types';

export const TelasAvancadasPage: React.FC = () => {
  const store = useTelasAvancadasStore();
  const [showForm, setShowForm] = useState(false);
  const [showSuperTela, setShowSuperTela] = useState(false);
  const [viewerTela, setViewerTela] = useState<TelaAvancada | null>(null);

  useEffect(() => {
    store.loadAll();
  }, []);

  const handleOpenHtmlViewer = (htmlContent: string, title: string) => {
    setViewerTela({ id: 'preview', type: 'html_code', title, htmlContent, createdAt: new Date(), updatedAt: new Date() });
  };

  const blocosDoProjeto = useMemo(
    () => store.blocos
      .filter((b) => b.projetoId === store.selectedProjectId)
      .map((b) => ({ id: b.id, tipo: b.tipo, visivel: b.visivel, grupo: b.grupo, presetId: b.presetId })),
    [store.blocos, store.selectedProjectId]
  );

  const totalStats = useMemo(() => ({
    telas: store.telas.length,
    projetos: store.projetos.length,
    exportacoes: store.exportacoes.length,
    referencias: store.referencias.length,
  }), [store.telas.length, store.projetos.length, store.exportacoes.length, store.referencias.length]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] to-[#15151f] p-6">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black text-white">Central de Telas Avançadas</h1>
            <p className="text-gray-400 text-sm">Biblioteca + Estúdio + Referências + Preview/Exportação/Publicação</p>
            <div className="flex gap-3 mt-2 text-[10px] text-gray-500">
              <span>📚 {totalStats.telas} telas</span>
              <span>🎨 {totalStats.projetos} projetos</span>
              <span>📌 {totalStats.referencias} referências</span>
              <span>🚀 {totalStats.exportacoes} exportações</span>
            </div>
          </div>
          <button onClick={() => setShowForm(true)} className="px-5 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-all">+ Nova Tela</button>
        </header>

        <ModuleSidebarContent><CentralTabs activeTab={store.activeTab} onChange={store.setActiveTab} /></ModuleSidebarContent>

        {store.activeTab === 'biblioteca' && (
          <BibliotecaPanel
            telas={store.telas}
            search={store.search}
            filterStatus={store.filterStatus}
            filterCategory={store.filterCategory}
            filterOrigin={store.filterOrigin}
            editingTelaId={store.editingTelaId}
            onSearch={store.setSearch}
            onFilterStatus={store.setFilterStatus}
            onFilterCategory={store.setFilterCategory}
            onFilterOrigin={store.setFilterOrigin}
            onOpenHtmlViewer={handleOpenHtmlViewer}
            onArchive={(t) => store.updateTela(t.id, { status: 'arquivado' })}
            onQuickEdit={async (id, data) => { await store.quickEditTela(id, data); }}
            onSetEditingTelaId={store.setEditingTelaId}
          />
        )}

        {store.activeTab === 'estudio' && (
          <EstudioPanel
            projetos={store.projetos}
            selectedProjectId={store.selectedProjectId}
            studioStep={store.studioStep}
            studioBlueprint={store.studioBlueprint}
            studioVisual={store.studioVisual}
            onSelectProject={store.setSelectedProjectId}
            onCreateProject={async (input) => { await store.createProjeto(input); }}
            onApplyTemplate={async (projectId, templateId) => { await store.applyTemplate(projectId, templateId); }}
            onApplyPreset={async (projectId, presetId) => { await store.applyPreset(projectId, presetId); }}
            onAddBloco={async (projectId, tipo) => { await store.addBloco(projectId, tipo); }}
            onDuplicateBloco={async (blocoId) => { await store.duplicateBloco(blocoId); }}
            onMoveBloco={async (blocoId, direction) => { await store.moveBloco(blocoId, direction); }}
            onToggleBloco={async (blocoId) => { await store.toggleBlocoVisibility(blocoId); }}
            onUpdateBlocoMeta={async (blocoId, input) => { await store.updateBlocoMeta(blocoId, input); }}
            onRemoveBloco={async (blocoId) => { await store.removeBloco(blocoId); }}
            onOpenSuperTela={() => setShowSuperTela(true)}
            onSetStudioStep={store.setStudioStep}
            onSetStudioBlueprint={store.setStudioBlueprint}
            onSetStudioVisual={store.setStudioVisual}
            blocosDoProjeto={blocosDoProjeto}
            // Composer props
            composer={store.composer}
            selectedBlockId={store.selectedBlockId}
            composerViewMode={store.composerViewMode}
            onLoadComposer={store.loadComposer}
            onChangeLayout={store.setComposerLayout}
            onAssignBlocoToZona={store.assignBlocoToZona}
            onRemoveBlocoFromComposer={store.removeBlocoFromComposer}
            onReorderBlocoInZona={store.reorderBlocoInZona}
            onSetBlocoPapelVisual={store.setBlocoPapelVisual}
            onSelectBlockForInspector={store.selectBlockForInspector}
            onSetComposerViewMode={store.setComposerViewMode}
            onGetInspectorData={store.getInspectorData}
          />
        )}

        {store.activeTab === 'referencias' && (
          <ReferenciasPanel
            projetos={store.projetos}
            referencias={store.referencias}
            selectedProjectId={store.selectedProjectId}
            onAddReferencia={async (ref) => { await store.addReferencia(ref); }}
          />
        )}

        {store.activeTab === 'preview' && (
          <PreviewPanel
            projetos={store.projetos}
            blueprints={store.blueprints}
            blocos={store.blocos}
            visuais={store.visuais}
            selectedProjectId={store.selectedProjectId}
            exportacoes={store.exportacoes}
            composer={store.composer}
            composerViewMode={store.composerViewMode}
            onGerarExportacao={async (projectId) => { await store.gerarExportacao(projectId); }}
            onPublicar={async (exportacaoId) => { await store.publicarExportacao(exportacaoId); }}
          />
        )}

        {/* Modals */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
            <div className="w-full max-w-2xl bg-[#1a1a24] border border-white/10 rounded-2xl p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl text-white font-bold">Nova Tela</h3>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white">Fechar</button>
              </div>
              <TelaAvancadaForm onSubmit={async (data) => { await store.addTela(data); setShowForm(false); }} isLoading={store.isLoading} error={store.error} />
            </div>
          </div>
        )}

        {viewerTela && (
          <div className="fixed inset-0 z-50">
            <TelaAvancadaViewer tela={viewerTela} onClose={() => setViewerTela(null)} />
          </div>
        )}

        {showSuperTela && <SuperTelaSagBPanel onClose={() => setShowSuperTela(false)} />}
      </div>
    </div>
  );
};
