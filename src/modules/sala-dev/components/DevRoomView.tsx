import { ModuleSidebarContent } from '../../../core/navigation/ModuleWorkspace';
import React, { useState } from 'react';
import { BackIcon, PlusIcon } from '../../../../components/Icon';
import { useSalaDevRun } from '../hooks/useSalaDevRun';
import { CommandCenterPanel } from './CommandCenterPanel';
import { AgentsFlowPanel } from './AgentsFlowPanel';
import { WorkspacePanel } from './WorkspacePanel';
import { EventDetailDrawer } from './EventDetailDrawer';
import { IntegrationHealthPanel } from './IntegrationHealthPanel';
import { SalaDevChatPanel } from './SalaDevChatPanel';
import { Agent } from '../../../../types';
import { NewProjectEntryPanel } from './NewProjectEntryPanel';
import { SalaDevStudioPanel } from './SalaDevStudioPanel';

interface DevRoomViewProps {
  onBack?: () => void;
  agents?: Agent[];
}

const DevRoomView: React.FC<DevRoomViewProps> = ({ onBack, agents: officialAgents = [] }) => {
  const [showIntegrationPanel, setShowIntegrationPanel] = useState(false);
  const [activeLeftTab, setActiveLeftTab] = useState<'command' | 'chat'>('command');
  const [activeWorkspaceMode, setActiveWorkspaceMode] = useState<'pipeline' | 'studio'>('pipeline');
  const {
    run,
    agents,
    events,
    files,
    domain,
    selectedEvent,
    selectedEventId,
    selectedMacroLayerId,
    setSelectedMacroLayerId,
    selectedBlockId,
    setSelectedBlockId,
    selectedHandoffId,
    setSelectedHandoffId,
    selectedGateId,
    setSelectedGateId,
    handleHandoffStatusChange,
    handleGateStatusChange,
    handleSummonAgent,
    handleRunAgentStatusChange,
    handleDeactivateRunAgent,
    setSelectedEventId,
    handleGenerateTechnicalPackage,
    lastTechnicalPackage,
    projectEntryForm,
    generatedBriefing,
    isGeneratingBriefingWithAi,
    briefingAiError,
    pipelineStarted,
    handleProjectEntryFieldChange,
    handleGenerateInitialBriefing,
    handleGenerateInitialBriefingWithAi,
    handleStartPipeline,
    handleStartNewProject
  } = useSalaDevRun({ officialAgents });

  return (
    <div className="flex flex-col h-full bg-[#0B1121] overflow-hidden text-white font-sans relative">
      <header className="h-14 border-b border-slate-800 bg-[#0F172A] flex items-center justify-between px-6 shrink-0 z-50 shadow-lg">
        <div className="flex items-center gap-4">
          {onBack && (
            <button onClick={onBack} className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
              <BackIcon className="w-4 h-4" />
            </button>
          )}
          <div>
            <h1 className="text-sm font-black tracking-tight text-white leading-tight">Sala Dev <span className="text-cyan-500 ml-1">V3</span></h1>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500 leading-tight">Painel técnico do projeto</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ModuleSidebarContent><div className="flex flex-col gap-2">
          {!pipelineStarted && <span aria-current="page" className="text-sm text-slate-500 px-3 py-2">Entrada de projeto</span>}
          {pipelineStarted && (
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setActiveWorkspaceMode('pipeline')}
                className={`rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition-colors ${
                  activeWorkspaceMode === 'pipeline'
                    ? 'bg-cyan-500 text-slate-950'
                    : 'text-slate-500 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                Esteira
              </button>
              <button
                onClick={() => setActiveWorkspaceMode('studio')}
                className={`rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition-colors ${
                  activeWorkspaceMode === 'studio'
                    ? 'bg-cyan-500 text-slate-950'
                    : 'text-slate-500 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                Studio
              </button>
            </div>
          )}
          {/* Integration Health Panel toggle */}
          <button
            onClick={() => setShowIntegrationPanel(!showIntegrationPanel)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-700/60 bg-zinc-800/30 hover:bg-zinc-800/50 px-2.5 py-1.5 text-[10px] font-bold text-zinc-400 hover:text-zinc-200 transition-colors"
            title="Status da integração"
          >
            <span>🔌</span>
            <span className="hidden sm:inline">Integração</span>
          </button>
          {pipelineStarted && (
            <button
              onClick={handleStartNewProject}
              className="inline-flex items-center gap-2 rounded-xl border border-cyan-700/60 bg-cyan-900/20 hover:bg-cyan-900/35 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-cyan-200 transition-colors"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              Novo Projeto
            </button>
          )}
          </div></ModuleSidebarContent>
        </div>
      </header>

      {pipelineStarted ? (
        activeWorkspaceMode === 'studio' ? (
          <div className="flex-1 overflow-hidden">
            <SalaDevStudioPanel
              runId={run.id}
              projectName={run.projectName}
              currentStage={run.currentStage}
            />
          </div>
        ) : (
        <div className="flex-1 flex overflow-hidden relative">
          <div className="w-[380px] shrink-0 border-r border-slate-800 h-full flex flex-col bg-[#0F172A]">
            <div className="flex shrink-0 border-b border-slate-800 bg-[#0B1121] p-2">
              <button
                onClick={() => setActiveLeftTab('command')}
                className={`flex-1 rounded-lg px-3 py-2 text-[10px] font-black uppercase tracking-wider transition-colors ${
                  activeLeftTab === 'command'
                    ? 'bg-cyan-500 text-slate-950'
                    : 'text-slate-500 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                Centro
              </button>
              <button
                onClick={() => setActiveLeftTab('chat')}
                className={`flex-1 rounded-lg px-3 py-2 text-[10px] font-black uppercase tracking-wider transition-colors ${
                  activeLeftTab === 'chat'
                    ? 'bg-cyan-500 text-slate-950'
                    : 'text-slate-500 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                💬 Chat IA
              </button>
            </div>

            <div className="min-h-0 flex-1">
              {activeLeftTab === 'command' ? (
                <CommandCenterPanel
                  run={run}
                  agents={agents}
                  domain={domain}
                  onGenerateTechnicalPackage={handleGenerateTechnicalPackage}
                  lastTechnicalPackage={lastTechnicalPackage}
                />
              ) : (
                <SalaDevChatPanel
                  context={{
                    runId: run.id,
                    projectName: run.projectName,
                    currentStage: run.currentStage,
                  }}
                />
              )}
            </div>
          </div>

          <div className="w-[420px] shrink-0 border-r border-slate-800 h-full">
            <AgentsFlowPanel
              events={events}
              agents={agents}
              macroLayers={domain.macroLayers}
              blocks={domain.blocks}
              handoffs={domain.handoffs}
              gates={domain.gates}
              runAgents={domain.runAgents}
              availableAgents={domain.availableAgents}
              recommendedAgents={domain.recommendedAgents}
              artifacts={domain.artifacts}
              risks={domain.risks}
              selectedMacroLayerId={selectedMacroLayerId || undefined}
              selectedBlockId={selectedBlockId}
              onSelectMacroLayer={setSelectedMacroLayerId}
              onSelectBlock={setSelectedBlockId}
              selectedHandoffId={selectedHandoffId || undefined}
              selectedGateId={selectedGateId || undefined}
              onSelectHandoff={setSelectedHandoffId}
              onSelectGate={setSelectedGateId}
              onUpdateHandoffStatus={handleHandoffStatusChange}
              onUpdateGateStatus={handleGateStatusChange}
              onSummonAgent={handleSummonAgent}
              onSetRunAgentStatus={handleRunAgentStatusChange}
              onDeactivateRunAgent={handleDeactivateRunAgent}
              selectedEventId={selectedEventId || undefined}
              onSelectEvent={setSelectedEventId}
            />
          </div>

          <div className="flex-1 min-w-0 h-full">
            <WorkspacePanel
              files={files}
              agents={agents}
              macroLayers={domain.macroLayers}
              artifacts={domain.artifacts}
              artifactVersions={domain.artifactVersions}
              gateChecklists={domain.gateChecklists}
              finalAudit={domain.finalAudit}
              logs={domain.logs}
              decisions={domain.decisions}
            />
          </div>

          {selectedEvent && (
            <EventDetailDrawer
              event={selectedEvent}
              agents={agents}
              onClose={() => setSelectedEventId(null)}
            />
          )}
        </div>
        )
      ) : (
        <NewProjectEntryPanel
          form={projectEntryForm}
          briefing={generatedBriefing}
          onChange={handleProjectEntryFieldChange}
          onGenerateBriefing={handleGenerateInitialBriefing}
          onGenerateBriefingWithAi={handleGenerateInitialBriefingWithAi}
          onStartPipeline={handleStartPipeline}
          isGeneratingBriefingWithAi={isGeneratingBriefingWithAi}
          briefingAiError={briefingAiError}
        />
      )}

      {/* Integration Health Panel — bottom drawer */}
      {showIntegrationPanel && (
        <div className="absolute bottom-0 left-0 right-0 z-50 border-t border-zinc-700 bg-[#0F172A]/95 backdrop-blur-sm shadow-2xl">
          <div className="flex items-center justify-between px-4 py-1.5 border-b border-zinc-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              🔌 Painel de Integração
            </span>
            <button
              onClick={() => setShowIntegrationPanel(false)}
              className="text-zinc-500 hover:text-zinc-300 text-xs px-1"
            >
              ✕
            </button>
          </div>
          <div className="p-3">
            <IntegrationHealthPanel />
          </div>
        </div>
      )}
    </div>
  );
};

export default DevRoomView;
