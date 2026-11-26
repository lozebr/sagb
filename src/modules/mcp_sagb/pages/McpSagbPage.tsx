import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircleIcon,
  BackIcon,
  BookIcon,
  CheckIcon,
  ClockIcon,
  CodeIcon,
  FileTextIcon,
  FilterIcon,
  FolderIcon,
  GitBranchIcon,
  PlayIcon,
  ShieldCheckIcon,
  TerminalIcon,
} from '../../../../components/Icon';
import { mcpSagbManifest } from '../manifest';
import {
  getTools,
  getScripts,
  getConfigs,
  runTool,
  toggleTool,
  updateConfig,
  resetToolsStatus,
  getServerState,
  toggleMcpServer,
  onServerStateChange,
  isServerRunning,
} from '../services/mcpSagbService';
import { McpConfig, McpScript, McpTool, McpToolCategory } from '../types/mcpSagb.types';
import type { McpServerState } from '../contracts/mcpSagb.contracts';

/* ============================================================================
 * MCP SagB — Página Principal
 * ============================================================================
 * Dashboard canônico do Model Context Protocol do SagB.
 * Exibe ferramentas MCP mock, scripts de automação, configurações de ambiente
 * e controle de estado do servidor MCP.
 * ============================================================================ */

/* ─── Mapa de ícones por categoria ─── */
const categoryIcon = (cat: McpToolCategory, className?: string) => {
  const props = { className };
  switch (cat) {
    case 'workspace':  return <FolderIcon {...props} />;
    case 'terminal':   return <TerminalIcon {...props} />;
    case 'extension':  return <CodeIcon {...props} />;
    case 'deploy':     return <TerminalIcon {...props} />;
    case 'scaffold':   return <BookIcon {...props} />;
    case 'git':        return <GitBranchIcon {...props} />;
    case 'database':   return <FileTextIcon {...props} />;
    case 'monitoring': return <ClockIcon {...props} />;
  }
};

/* ─── Badge de status da ferramenta ─── */
const toolStatusBadge = (status: McpTool['status']) => {
  const map: Record<McpTool['status'], { label: string; color: string }> = {
    idle:    { label: 'Pronto',     color: 'bg-gray-500/10 text-gray-500 border-gray-500/20' },
    running: { label: 'Executando', color: 'bg-sky-500/10 text-sky-600 border-sky-500/20' },
    success: { label: 'OK',         color: 'bg-green-500/10 text-green-600 border-green-500/20' },
    error:   { label: 'Erro',       color: 'bg-rose-500/10 text-rose-600 border-rose-500/20' },
  };
  const s = map[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${s.color}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${status === 'running' ? 'animate-pulse bg-sky-500' : status === 'success' ? 'bg-green-500' : status === 'error' ? 'bg-rose-500' : 'bg-gray-500'}`} />
      {s.label}
    </span>
  );
};

/* ─── Componente principal ─── */
const McpSagbPage: React.FC = () => {
  const [tools, setTools] = useState<McpTool[]>([]);
  const [scripts] = useState<McpScript[]>(getScripts);
  const [configs, setConfigs] = useState<McpConfig[]>(getConfigs);
  const [activeTab, setActiveTab] = useState<'tools' | 'scripts' | 'configs'>('tools');
  const [outputLog, setOutputLog] = useState<string[]>([]);
  const [runningToolId, setRunningToolId] = useState<string | null>(null);
  const [serverState, setServerState] = useState<McpServerState>(getServerState);

  useEffect(() => {
    setTools(getTools());
  }, []);

  /* ─── Escuta mudanças de estado do servidor ─── */
  useEffect(() => {
    const unsubscribe = onServerStateChange((state) => {
      setServerState(state);
    });
    return unsubscribe;
  }, []);

  /* ─── Handlers ─── */
  const handleBack = useCallback(() => {
    window.dispatchEvent(new CustomEvent('sagb:navigate', { detail: 'home' }));
  }, []);

  const handleRunTool = useCallback(async (toolId: string) => {
    if (runningToolId) return;
    setRunningToolId(toolId);
    const result = await runTool(toolId);
    setTools(getTools());
    setOutputLog((prev) => {
      const timestamp = new Date().toLocaleTimeString('pt-BR');
      return [`[${timestamp}] ${result.output}`, ...prev].slice(0, 50);
    });
    setRunningToolId(null);
  }, [runningToolId]);

  const handleToggleTool = useCallback((toolId: string) => {
    toggleTool(toolId);
    setTools(getTools());
  }, []);

  const handleConfigChange = useCallback((key: string, value: string) => {
    updateConfig(key, value);
    setConfigs(getConfigs());
  }, []);

  const handleResetTools = useCallback(() => {
    resetToolsStatus();
    setTools(getTools());
  }, []);

  const handleToggleServer = useCallback(async () => {
    const result = await toggleMcpServer();
    setServerState(getServerState());
    setOutputLog((prev) => {
      const timestamp = new Date().toLocaleTimeString('pt-BR');
      const msg = result
        ? `[MCP Server] Servidor ${serverState.running ? 'parado' : 'iniciado'} com sucesso.`
        : `[MCP Server] Falha ao alternar servidor.`;
      return [`[${timestamp}] ${msg}`, ...prev].slice(0, 50);
    });
  }, [serverState.running]);

  /* ─── Contagens ─── */
  const enabledTools = tools.filter((t) => t.enabled).length;
  const enabledScripts = scripts.filter((s) => s.enabled).length;

  return (
    <div className="flex-1 p-10 bg-sagb-bg text-sagb-text font-inter min-h-full">
      {/* ═══ Header Canônico ═══ */}
      <header className="mb-10 flex justify-between items-start gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-[10px] font-black uppercase tracking-widest ${
              serverState.running
                ? 'bg-sagb-blue/10 text-sagb-blue border-sagb-blue/20'
                : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${serverState.running ? 'animate-pulse bg-sagb-blue' : 'bg-amber-500'}`} />
              <TerminalIcon className="w-3 h-3" />
              Camada Técnica • {serverState.running ? 'Ativo' : 'Parado'}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-sagb-panel text-sagb-muted border border-sagb-line px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider">
              Modo {serverState.mode === 'mock' ? 'Mock' : 'Live'}
            </span>
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tighter">
            MCP SagB
          </h1>
          <p className="text-sagb-muted mt-2 text-[12px] max-w-2xl">
            Model Context Protocol do SagB — camada de conhecimento e automação
            focada em VS Code, produtividade de desenvolvimento, organização de workspace
            e configuração de ambiente local. Operacionalizado pelo agente{' '}
            <span className="font-semibold text-sagb-text">Sávio Codare</span>.
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[10px] font-black text-sagb-muted uppercase tracking-widest mb-1">
            MCP Server • {serverState.mode === 'mock' ? 'Mock' : 'Live'}
          </div>
          <div className="text-lg font-bold text-sagb-text">
            {serverState.serverName} v{serverState.serverVersion}
          </div>
          {serverState.startedAt && (
            <div className="mt-1 text-[10px] text-sagb-muted font-mono">
              Iniciado em {new Date(serverState.startedAt).toLocaleTimeString('pt-BR')}
            </div>
          )}
          <div className="mt-2 text-[12px] text-sagb-muted">
            Responsável:{' '}
            <span className="font-semibold text-sagb-text">
              {mcpSagbManifest.owner?.displayName || 'A definir'}
            </span>
          </div>
          <div className="mt-3 flex gap-2 justify-end">
            <button
              onClick={handleToggleServer}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-wider transition border ${
                serverState.running
                  ? 'bg-rose-500/10 text-rose-600 border-rose-500/20 hover:bg-rose-500/20'
                  : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20'
              }`}
              title={serverState.running ? 'Parar servidor MCP' : 'Iniciar servidor MCP'}
            >
              <span className={`h-2 w-2 rounded-full ${serverState.running ? 'bg-rose-500' : 'bg-emerald-500'}`} />
              {serverState.running ? 'Parar Servidor' : 'Iniciar Servidor'}
            </button>
            <button
              onClick={handleResetTools}
              className="inline-flex items-center gap-2 rounded-xl bg-sagb-panel text-sagb-text border border-sagb-line px-4 py-2 text-[10px] font-black uppercase tracking-wider transition hover:bg-sagb-bg-2"
              title="Resetar status das ferramentas"
            >
              <FilterIcon className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>
        </div>
      </header>

      {/* ═══ Stats Cards ═══ */}
      <section className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className={`rounded-2xl border p-5 ${
          serverState.running
            ? 'bg-sagb-panel border-sagb-line'
            : 'bg-sagb-panel border-amber-500/20'
        }`}>
          <p className="text-[10px] font-black text-sagb-muted uppercase tracking-widest">Servidor MCP</p>
          <p className={`mt-2 text-lg font-black ${
            serverState.running ? 'text-sagb-text' : 'text-amber-600'
          }`}>
            {serverState.running ? 'Executando' : 'Parado'}
          </p>
          <p className="text-sagb-muted text-[10px] mt-1">
            {serverState.running
              ? `${serverState.resources} resources • ${serverState.tools} tools`
              : 'Clique em "Iniciar Servidor"'}
          </p>
        </div>
        <div className="bg-sagb-panel rounded-2xl border border-sagb-line p-5">
          <p className="text-[10px] font-black text-sagb-muted uppercase tracking-widest">Ferramentas</p>
          <p className="mt-2 text-lg font-black text-sagb-text">{enabledTools} / {tools.length}</p>
          <p className="text-sagb-muted text-[10px] mt-1">MCP Tools disponíveis</p>
        </div>
        <div className="bg-sagb-panel rounded-2xl border border-sagb-line p-5">
          <p className="text-[10px] font-black text-sagb-muted uppercase tracking-widest">Scripts</p>
          <p className="mt-2 text-lg font-black text-sagb-text">{enabledScripts} / {scripts.length}</p>
          <p className="text-sagb-muted text-[10px] mt-1">Automações registradas</p>
        </div>
        <div className="bg-sagb-panel rounded-2xl border border-sagb-line p-5">
          <p className="text-[10px] font-black text-sagb-muted uppercase tracking-widest">Configurações</p>
          <p className="mt-2 text-lg font-black text-sagb-text">{configs.length}</p>
          <p className="text-sagb-muted text-[10px] mt-1">Ambiente gerenciado</p>
        </div>
      </section>

      {/* ═══ Navegação Interna ═══ */}
      <div className="mt-8 flex items-center gap-1 border-b border-sagb-line">
        {(['tools', 'scripts', 'configs'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-widest transition border-b-2 -mb-[1px] ${
              activeTab === tab
                ? 'text-sagb-blue border-sagb-blue'
                : 'text-sagb-muted border-transparent hover:text-sagb-text'
            }`}
          >
            {tab === 'tools' && 'Ferramentas MCP'}
            {tab === 'scripts' && 'Scripts'}
            {tab === 'configs' && 'Configurações'}
          </button>
        ))}
      </div>

      {/* ═══ Conteúdo das Abas ═══ */}
      <div className="mt-6">
        {/* ─── Aba: Ferramentas MCP ─── */}
        {activeTab === 'tools' && (
          <section>
            {tools.length === 0 && (
              <div className="text-sagb-muted text-[12px] py-10 text-center">
                Nenhuma ferramenta MCP disponível.
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tools.map((tool) => (
                <div
                  key={tool.id}
                  className={`bg-sagb-panel rounded-2xl border p-5 transition ${
                    !tool.enabled ? 'border-sagb-line opacity-50' : 'border-sagb-line'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sagb-bg-2 text-sagb-blue border border-sagb-line">
                        {categoryIcon(tool.category, 'w-4 h-4')}
                      </span>
                      <div>
                        <p className="text-[12px] font-bold text-sagb-text">{tool.name}</p>
                        <p className="text-[10px] text-sagb-muted mt-0.5">{tool.category}</p>
                      </div>
                    </div>
                    {toolStatusBadge(tool.status)}
                  </div>

                  <p className="text-[11px] text-sagb-muted mt-3 leading-relaxed">
                    {tool.description}
                  </p>

                  {tool.command && (
                    <div className="mt-2 bg-sagb-bg-2 rounded-lg border border-sagb-line px-3 py-1.5 text-[10px] font-mono text-sagb-muted">
                      $ {tool.command}
                    </div>
                  )}

                  <div className="mt-4 flex items-center gap-2">
                    <button
                      onClick={() => handleRunTool(tool.id)}
                      disabled={!tool.enabled || runningToolId === tool.id}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-sagb-blue text-white px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition hover:bg-sagb-blue-2 disabled:opacity-50"
                    >
                      {runningToolId === tool.id ? (
                        <>
                          <ClockIcon className="w-3 h-3 animate-pulse" />
                          Executando...
                        </>
                      ) : (
                        <>
                          <PlayIcon className="w-3 h-3" />
                          Executar
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleToggleTool(tool.id)}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition ${
                        tool.enabled
                          ? 'bg-sagb-bg-2 text-sagb-muted border-sagb-line hover:text-sagb-text'
                          : 'bg-sagb-panel text-amber-600 border-amber-500/20 hover:text-sagb-text'
                      }`}
                    >
                      {tool.enabled ? 'Desativar' : 'Ativar'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ─── Aba: Scripts ─── */}
        {activeTab === 'scripts' && (
          <section>
            {scripts.length === 0 && (
              <div className="text-sagb-muted text-[12px] py-10 text-center">
                Nenhum script de automação registrado.
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scripts.map((script) => (
                <div
                  key={script.id}
                  className={`bg-sagb-panel rounded-2xl border p-5 transition ${
                    !script.enabled ? 'border-sagb-line opacity-50' : 'border-sagb-line'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sagb-bg-2 text-emerald-500 border border-sagb-line">
                        <FileTextIcon className="w-4 h-4" />
                      </span>
                      <div>
                        <p className="text-[12px] font-bold text-sagb-text">{script.name}</p>
                        <p className="text-[10px] text-sagb-muted mt-0.5">
                          {script.language} • {script.category}
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-sagb-muted mt-3 leading-relaxed">
                    {script.description}
                  </p>

                  <div className="mt-2 bg-sagb-bg-2 rounded-lg border border-sagb-line px-3 py-1.5 text-[10px] font-mono text-sagb-muted">
                    {script.path}
                    {script.parameters && script.parameters.length > 0 && (
                      <span className="text-sagb-blue ml-2">
                        {script.parameters.join(' ')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ─── Aba: Configurações ─── */}
        {activeTab === 'configs' && (
          <section>
            {configs.length === 0 && (
              <div className="text-sagb-muted text-[12px] py-10 text-center">
                Nenhuma configuração gerenciada.
              </div>
            )}
            <div className="bg-sagb-panel rounded-2xl border border-sagb-line overflow-hidden">
              <div className="grid grid-cols-[180px_1fr_120px] gap-4 px-5 py-3 border-b border-sagb-line text-[10px] font-black text-sagb-muted uppercase tracking-widest">
                <div>Chave</div>
                <div>Valor</div>
                <div>Categoria</div>
              </div>
              {configs.map((cfg) => (
                <div
                  key={cfg.key}
                  className="grid grid-cols-[180px_1fr_120px] gap-4 px-5 py-3 border-b border-sagb-line last:border-b-0 hover:bg-sagb-bg-2 transition"
                >
                  <div>
                    <p className="text-[11px] font-bold text-sagb-text">{cfg.label}</p>
                    <p className="text-[9px] text-sagb-muted mt-0.5">{cfg.key}</p>
                  </div>
                  <div className="flex items-center">
                    {cfg.type === 'boolean' ? (
                      <button
                        onClick={() => handleConfigChange(cfg.key, cfg.value === 'true' ? 'false' : 'true')}
                        className={`relative inline-flex h-6 w-10 items-center rounded-full transition ${
                          cfg.value === 'true' ? 'bg-sagb-blue' : 'bg-sagb-line'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                            cfg.value === 'true' ? 'translate-x-5' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    ) : cfg.type === 'select' ? (
                      <select
                        value={cfg.value}
                        onChange={(e) => handleConfigChange(cfg.key, e.target.value)}
                        className="bg-sagb-bg-2 border border-sagb-line rounded-lg px-2 py-1 text-[11px] text-sagb-text outline-none w-full"
                      >
                        {cfg.options?.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={cfg.type === 'number' ? 'number' : 'text'}
                        value={cfg.value}
                        onChange={(e) => handleConfigChange(cfg.key, e.target.value)}
                        className="bg-sagb-bg-2 border border-sagb-line rounded-lg px-2 py-1 text-[11px] text-sagb-text outline-none w-full"
                      />
                    )}
                  </div>
                  <div className="flex items-center">
                    <span className="text-[10px] font-bold text-sagb-muted uppercase">
                      {cfg.category.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-3 text-[10px] text-sagb-muted">
              <ShieldCheckIcon className="w-3 h-3 inline mr-1" />
              Configurações persistidas no localStorage. Integração com Supabase futura.
            </p>
          </section>
        )}
      </div>

      {/* ═══ Output Log ═══ */}
      <section className="mt-8 bg-sagb-panel rounded-2xl border border-sagb-line p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[11px] font-black text-sagb-text uppercase tracking-widest">
            Log de Execução
          </h2>
          {outputLog.length > 0 && (
            <button
              onClick={() => setOutputLog([])}
              className="text-[9px] font-bold text-sagb-muted uppercase tracking-wider hover:text-sagb-text transition"
            >
              Limpar
            </button>
          )}
        </div>
        {outputLog.length === 0 ? (
          <div className="text-[11px] text-sagb-muted py-3">
            Nenhuma execução ainda. Use o botão <strong>Executar</strong> nas ferramentas ou
            <strong> Iniciar Servidor</strong> no header.
          </div>
        ) : (
          <div className="space-y-1 max-h-[200px] overflow-y-auto">
            {outputLog.map((line, i) => (
              <div
                key={i}
                className={`text-[10px] font-mono px-3 py-1.5 rounded-lg ${
                  line.includes('OK') || line.includes('sucesso')
                    ? 'bg-green-500/5 text-green-600'
                    : line.includes('ERROR') || line.includes('Falha')
                    ? 'bg-rose-500/5 text-rose-600'
                    : line.includes('MCP Server')
                    ? 'bg-sky-500/5 text-sky-600'
                    : 'bg-sagb-bg-2 text-sagb-muted'
                }`}
              >
                {line}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ═══ Botão Voltar ao SagB ═══ */}
      <button
        onClick={handleBack}
        className="fixed bottom-8 left-8 w-14 h-14 bg-sagb-text text-sagb-bg rounded-2xl shadow-2xl flex items-center justify-center group hover:scale-110 active:scale-95 transition-all z-[100]"
        title="Voltar ao SagB" aria-label="Voltar ao SagB"
      >
        <BackIcon className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
        <span className="absolute left-full ml-4 px-3 py-1.5 bg-sagb-text text-sagb-bg text-[10px] font-bold rounded-lg opacity-0 whitespace-nowrap pointer-events-none group-hover:opacity-100 transition-all">
          VOLTAR AO SAGB
        </span>
      </button>

      {/* ═══ Footer ═══ */}
      <footer className="mt-10 h-10 border-t border-sagb-line pt-3 flex items-center justify-between text-[10px] font-bold text-sagb-muted uppercase tracking-widest">
        <div className="flex items-center gap-6">
          <span className="inline-flex items-center gap-2"><TerminalIcon className="w-3 h-3" /> MCP SagB v1.0.0</span>
          <span className={`${serverState.running ? 'text-sagb-blue' : 'text-amber-600'}`}>
            {serverState.running ? `Modo ${serverState.mode === 'mock' ? 'Mock' : 'Live'} • ${tools.length} ferramentas` : 'Servidor Parado'}
          </span>
        </div>
        <div>Sávio Codare • Camada Técnica</div>
      </footer>
    </div>
  );
};

export { McpSagbPage };
export default McpSagbPage;
