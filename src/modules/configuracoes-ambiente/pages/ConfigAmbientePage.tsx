import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from '../../../core/context/ThemeContext';
import {
  getModuleManifests,
  isModuleEnabled,
  readModuleOrder,
  writeModuleOrder,
  readModuleOrderLocked,
  writeModuleOrderLocked,
  sortModulesByOrder,
} from '../../../core/modules/moduleActivation';
import { useModuleActivation } from '../../../core/modules/ModuleActivationContext';
import { BookIcon } from '../../../../components/Icon';
import { manifest } from '../manifest';
import { configuracoesCategorias } from '../services/configuracoesCatalog';
import { ConfiguracoesInternalMenu } from '../components/ConfiguracoesInternalMenu';

/* Itens do core que aparecem na Sidebar mas não estão em getModuleManifests() */
const CORE_SIDEBAR_ITEMS: { id: string; displayName: string }[] = [
  { id: 'home', displayName: 'Início' },
  { id: 'nucleo-conversacional', displayName: 'Conversas' },
  { id: 'nic', displayName: 'NIC' },
  { id: 'intelligence-flow', displayName: 'Fluxo de Inteligência' },
  { id: 'nagi', displayName: 'NAGI' },
  { id: 'central_padroes', displayName: 'Central de Padrões' },
];
const CORE_IDS = new Set(CORE_SIDEBAR_ITEMS.map((i) => i.id));

/* ─── Page ─── */
const ConfigAmbientePage: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const allModules = useMemo(() => getModuleManifests(), []);
  const { toggles: moduleToggles, setEnabled, workspaceId } = useModuleActivation();
  const [toggleError,setToggleError]=useState(false);

  /* ── Ordem dos módulos ── */
  const [moduleOrder, setModuleOrder] = useState<string[]>(() => readModuleOrder());
  const [orderLocked, setOrderLocked] = useState(() => readModuleOrderLocked());
  /* Ref síncrono — evita race condition entre setState e re-render durante drag */
  const dragSourceRef = useRef<number | null>(null);
  /* State para highlight visual — atualiza re-render ao pairar sobre item */
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  /* Lista única: itens do core + módulos registrados, tudo ordenado junto */
  const sortedModules = useMemo(() => {
    const dynamicItems = allModules.filter((m) => m.id !== 'configuracoes-sistema');
    // Remove módulos que já estão no core (para evitar duplicatas)
    const filteredDynamic = dynamicItems.filter((m) => !CORE_IDS.has(m.id));
    return sortModulesByOrder([...CORE_SIDEBAR_ITEMS, ...filteredDynamic], moduleOrder);
  }, [allModules, moduleOrder]);

  /* Sincronizar ordem quando outro componente alterar */
  useEffect(() => {
    const onOrderChange = () => {
      setModuleOrder(readModuleOrder());
    };
    window.addEventListener('sagb:module-order-changed', onOrderChange as EventListener);
    return () => window.removeEventListener('sagb:module-order-changed', onOrderChange as EventListener);
  }, []);

  const firstSlug = configuracoesCategorias[0]?.slug || 'tema';
  const [activeSlug, setActiveSlug] = useState(firstSlug);

  const activeCategoria = useMemo(
    () => configuracoesCategorias.find((c) => c.slug === activeSlug) || configuracoesCategorias[0],
    [activeSlug]
  );

  const isModuleActive = (moduleId: string) => isModuleEnabled(moduleId, moduleToggles);

  const handleToggleModule = (moduleId: string, current: boolean) => {
    setToggleError(!setEnabled(moduleId,!current));
  };

  const activeCount = sortedModules.filter((m) => isModuleActive(m.id)).length;

  /* ── Lock toggle ── */
  const handleToggleLock = useCallback(() => {
    setOrderLocked((prev) => {
      const next = !prev;
      writeModuleOrderLocked(next);
      return next;
    });
  }, []);

  /* ── Drag & Drop (todos os itens são reordenáveis) ── */
  const handleDragStart = useCallback(
    (index: number) => (e: React.DragEvent) => {
      dragSourceRef.current = index;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(index));
      /* NÃO manipular DOM diretamente — usamos classe CSS condicional no render */
    },
    []
  );

  const handleDragOver = useCallback(
    (index: number) => (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setDragOverIdx(index);
    },
    []
  );

  const handleDragEnter = useCallback(
    (index: number) => (e: React.DragEvent) => {
      e.preventDefault();
    },
    []
  );

  const handleDrop = useCallback(
    (targetIndex: number) => (e: React.DragEvent) => {
      e.preventDefault();
      const sourceIdx = dragSourceRef.current;
      if (sourceIdx === null || sourceIdx === targetIndex) {
        dragSourceRef.current = null;
        setDragOverIdx(null);
        return;
      }

      const updated = [...sortedModules];
      const [moved] = updated.splice(sourceIdx, 1);
      updated.splice(targetIndex, 0, moved);
      const newOrder = updated.map((m) => m.id);
      setModuleOrder(newOrder);
      writeModuleOrder(newOrder);
      dragSourceRef.current = null;
      setDragOverIdx(null);
    },
    [sortedModules]
  );

  const handleDragEnd = useCallback(() => {
    dragSourceRef.current = null;
    setDragOverIdx(null);
  }, []);

  return (
    <div className="flex-1 p-10 bg-sagb-bg text-sagb-text min-h-full transition-colors duration-300 font-inter">
      {/* ── Header canônico ── */}
      <header className="mb-10 flex justify-between items-start gap-6">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter">Configurações do Sistema</h1>
          <p className="text-[12px] text-sagb-muted mt-2">
            Gerencie temas, cores, perfis e preferências globais do sistema.
          </p>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-black text-sagb-muted uppercase tracking-widest mb-1">Módulo Oficial</div>
          <div className="text-lg font-bold text-sagb-text">Configurações do Sistema</div>
          <div className="mt-2 text-[12px] text-sagb-muted">
            Responsável: <span className="font-semibold text-sagb-text">{manifest.owner?.displayName || 'A definir'}</span>
          </div>
          <button
            onClick={() => {/* TODO: abrir modal de docs */}}
            className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-[12px] font-semibold"
          >
            <BookIcon className="w-4 h-4" />
            Docs
          </button>
        </div>
      </header>

      {/* ── Grid: sub-sidebar + conteúdo ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Sub-sidebar esquerdo */}
        <ConfiguracoesInternalMenu
          categorias={configuracoesCategorias}
          ativoSlug={activeCategoria.slug}
          onSelect={setActiveSlug}
        />

        {/* Painel de conteúdo direito */}
        <section className="rounded-3xl border border-sagb-line bg-sagb-panel p-6 md:p-8 shadow-sm space-y-6">
          <header className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-black text-sagb-text">{activeCategoria.label}</h2>
          </header>

          {activeSlug === 'tema' && (
            <div className="space-y-3">
              {/* Opção Claro */}
              <div
                onClick={() => setTheme('light')}
                className={`flex items-center justify-between p-4 rounded-xl cursor-pointer border-2 transition-all ${
                  theme === 'light'
                    ? 'border-blue-500 bg-white'
                    : 'border-sagb-line bg-sagb-bg hover:border-gray-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[12px] font-bold text-sagb-text">Claro</p>
                    <p className="text-[10px] text-sagb-muted">Fundo claro, texto escuro</p>
                  </div>
                </div>
                {theme === 'light' && (
                  <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Opção Escuro */}
              <div
                onClick={() => setTheme('dark')}
                className={`flex items-center justify-between p-4 rounded-xl cursor-pointer border-2 transition-all ${
                  theme === 'dark'
                    ? 'border-blue-500 bg-white'
                    : 'border-sagb-line bg-sagb-bg hover:border-gray-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[12px] font-bold text-sagb-text">Escuro</p>
                    <p className="text-[10px] text-sagb-muted">Fundo escuro, texto claro</p>
                  </div>
                </div>
                {theme === 'dark' && (
                  <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSlug === 'modulos' && (
            <div>
              {/* Cabeçalho com resumo + cadeado */}
              <div className="flex items-center justify-between gap-4 mb-5 pb-4 border-b border-sagb-line">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    <span className="text-[12px] text-sagb-text font-medium">{activeCount} ativos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <span className="text-[12px] text-sagb-text font-medium">
                      {sortedModules.length - activeCount} inativos
                    </span>
                  </div>
                </div>

                {/* Cadeado de reordenação */}
                <button
                  type="button"
                  onClick={handleToggleLock}
                  title={orderLocked ? 'Clique para reordenar módulos' : 'Clique para travar ordem'}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all border ${
                    orderLocked
                      ? 'bg-sagb-bg border-sagb-line text-sagb-muted hover:text-sagb-text'
                      : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {orderLocked ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                    )}
                  </svg>
                  {orderLocked ? 'Ordenação travada' : 'Reordenar módulos'}
                </button>
              </div>

              <p className="text-[11px] text-sagb-muted mb-2">{workspaceId?'Preferência local deste workspace':'Preferência local global'} · não altera permissões de segurança.</p>
              {toggleError&&<p role="alert" className="text-xs text-red-600 mb-2">Não foi possível salvar a preferência no navegador.</p>}
              {/* Lista de exibição — todos os módulos com toggle + drag */}
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {sortedModules.map((item, index) => {
                  const active = isModuleActive(item.id);
                  const sourceIdx = dragSourceRef.current;
                  const isDragging = sourceIdx === index;
                  const isDropTarget = dragOverIdx === index && sourceIdx !== null && !isDragging;

                  return (
                    <div
                      key={item.id}
                      draggable={!orderLocked}
                      onDragStart={!orderLocked ? handleDragStart(index) : undefined}
                      onDragOver={!orderLocked ? handleDragOver(index) : undefined}
                      onDragEnter={!orderLocked ? handleDragEnter(index) : undefined}
                      onDrop={!orderLocked ? handleDrop(index) : undefined}
                      onDragEnd={!orderLocked ? handleDragEnd : undefined}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                        isDragging
                          ? 'opacity-40 border-blue-400 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                          : isDropTarget
                          ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-900/15 ring-2 ring-blue-400/40'
                          : sourceIdx !== null && dragOverIdx === null
                          ? 'opacity-60 border-sagb-line bg-sagb-bg'
                          : 'bg-sagb-bg border-sagb-line'
                      } ${!orderLocked ? 'cursor-grab active:cursor-grabbing' : ''}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Alça de arrasto */}
                        {!orderLocked && (
                          <span className="text-sagb-muted shrink-0 select-none flex items-center">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm8-16a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
                            </svg>
                          </span>
                        )}
                        <span className="text-[12px] font-medium truncate text-sagb-text">
                          {item.displayName}
                        </span>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={active}
                        aria-label={`Alternar módulo ${item.displayName}`}
                        onClick={() => handleToggleModule(item.id, active)}
                        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          active ? 'bg-green-500' : 'bg-sagb-panel-2'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition-transform duration-300 ease-in-out ${
                            active ? 'translate-x-4' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-sagb-muted mt-4">
                A ordem dos módulos nesta lista é idêntica à da Sidebar.
                {!orderLocked && (
                  <span className="block mt-1 text-blue-600 dark:text-blue-400">
                    Arraste os módulos para reordenar.
                  </span>
                )}
              </p>
            </div>
          )}

          {activeSlug === 'idioma' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-sagb-bg border border-sagb-line">
                <p className="text-[12px] font-bold text-sagb-text mb-1">Idioma</p>
                <p className="text-[10px] text-sagb-muted">Português (Brasil) — em breve mais idiomas</p>
              </div>
              <div className="p-4 rounded-xl bg-sagb-bg border border-sagb-line">
                <p className="text-[12px] font-bold text-sagb-text mb-1">Fuso Horário</p>
                <p className="text-[10px] text-sagb-muted">America/Sao_Paulo (UTC-3)</p>
              </div>
              <div className="p-4 rounded-xl bg-sagb-bg border border-sagb-line">
                <p className="text-[12px] font-bold text-sagb-text mb-1">Formato de Data</p>
                <p className="text-[10px] text-sagb-muted">DD/MM/AAAA — 24h</p>
              </div>
            </div>
          )}

          {activeSlug === 'notificacoes' && (
            <div className="space-y-4">
              <p className="text-[12px] text-sagb-muted">
                Preferências de notificação serão configuradas aqui em breve.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {['Som', 'Push', 'E-mail', 'Desktop'].map((item) => (
                  <div
                    key={item}
                    className="flex items-center justify-between p-3 rounded-xl bg-sagb-bg border border-sagb-line"
                  >
                    <span className="text-[12px] font-medium text-sagb-text">{item}</span>
                    <span className="text-[10px] text-sagb-muted">Em breve</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSlug === 'perfil' && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-sagb-bg border border-sagb-line">
                <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-lg font-black">
                  U
                </div>
                <div>
                  <p className="text-[12px] font-bold text-sagb-text">Nome do Usuário</p>
                  <p className="text-[10px] text-sagb-muted">email@exemplo.com</p>
                </div>
              </div>
              <p className="text-[12px] text-sagb-muted">
                Edição de perfil será disponibilizada em breve.
              </p>
            </div>
          )}

          {activeSlug === 'privacidade' && (
            <div className="space-y-4">
              {[
                { label: 'Compartilhar dados de uso', ativo: true },
                { label: 'Receber recomendações personalizadas', ativo: false },
                { label: 'Manter sessão ativa por 30 dias', ativo: true },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between p-3 rounded-xl bg-sagb-bg border border-sagb-line"
                >
                  <span className="text-[12px] font-medium text-sagb-text">{item.label}</span>
                  <span
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      item.ativo
                        ? 'bg-green-500 border-green-500'
                        : 'border-sagb-panel-2 bg-transparent'
                    }`}
                  >
                    {item.ativo && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                </div>
              ))}
              <p className="text-[12px] text-sagb-muted pt-2">
                Exportação de dados e retenção serão configuráveis em breve.
              </p>
            </div>
          )}

          {activeSlug === 'atalhos' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: 'Ctrl + K', desc: 'Paleta de comandos' },
                  { key: 'Ctrl + B', desc: 'Alternar sidebar' },
                  { key: 'Ctrl + J', desc: 'Abrir terminal' },
                  { key: 'Ctrl + Shift + P', desc: 'Gerenciar módulos' },
                  { key: 'Ctrl + ,', desc: 'Abrir configurações' },
                  { key: 'Ctrl + Shift + D', desc: 'Alternar tema' },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-3 rounded-xl bg-sagb-bg border border-sagb-line"
                  >
                    <span className="text-[12px] text-sagb-text">{item.desc}</span>
                    <kbd className="text-[10px] font-mono font-bold px-2 py-1 rounded bg-sagb-panel-2 text-sagb-muted border border-sagb-line">
                      {item.key}
                    </kbd>
                  </div>
                ))}
              </div>
              <p className="text-[12px] text-sagb-muted">
                Atalhos customizáveis serão disponibilizados em breve.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default ConfigAmbientePage;
