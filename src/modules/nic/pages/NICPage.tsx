import { ModuleSidebarContent } from '../../../core/navigation/ModuleWorkspace';
import React, { useState, useMemo } from 'react';
import {
  BackIcon,
  CheckIcon,
  FileTextIcon,
  SearchIcon,
  FilterIcon,
  ClockIcon,
  SaveIcon,
  XIcon,
} from '../../../../components/Icon';
import { nicNamingService } from '../services/nicNamingService';
import { NamingItem, NamingStatus, statusLabel, statusColor } from '../naming/namingSchema';

/* ============================================================
 *  NICPage — Núcleo de Inteligência Conectiva
 *
 *  PROPÓSITO:
 *  Central de curadoria de nomes do ecossistema.
 *  Aqui você encontra, classifica, aprova e acompanha
 *  todos os nomes oficiais do GrupoB e suas empresas.
 *
 *  UX: linguagem simples, sem jargão técnico.
 *  VISUAL: Alice UI Standard | Robust Clean
 * ============================================================ */

type TabKey = 'overview' | 'catalog' | 'pending' | 'history';

/* ---- Status Chip ---- */
const StatusChip: React.FC<{ status: NamingStatus }> = ({ status }) => {
  const colors: Record<NamingStatus, string> = {
    aprovado: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    pendente: 'bg-amber-50 text-amber-700 border-amber-200',
    em_ajuste: 'bg-violet-50 text-violet-700 border-violet-200',
    recusado: 'bg-red-50 text-red-700 border-red-200',
    arquivado: 'bg-gray-50 text-gray-500 border-gray-200',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border ${colors[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        status === 'aprovado' ? 'bg-emerald-500' :
        status === 'pendente' ? 'bg-amber-500' :
        status === 'em_ajuste' ? 'bg-violet-500' :
        status === 'recusado' ? 'bg-red-500' : 'bg-gray-400'
      }`} />
      {statusLabel(status)}
    </span>
  );
};

/* ============================================================
 *  Página Principal
 * ============================================================ */
interface NICPageProps {
  onBack?: () => void;
}

const NICPage: React.FC<NICPageProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<NamingStatus | 'todos'>('todos');
  const [selectedName, setSelectedName] = useState<NamingItem | null>(null);
  const [approvalNote, setApprovalNote] = useState('');

  const service = nicNamingService;
  const resumo = service.obterResumo();
  const nomes = useMemo(() => {
    let lista = service.listarNomes();
    if (statusFilter !== 'todos') {
      lista = lista.filter(n => n.status === statusFilter);
    }
    if (searchTerm) {
      const t = searchTerm.toLowerCase();
      lista = lista.filter(n =>
        n.nomeOficial.toLowerCase().includes(t) ||
        n.slugSistema.toLowerCase().includes(t) ||
        n.aliases.some(a => a.toLowerCase().includes(t))
      );
    }
    return lista;
  }, [statusFilter, searchTerm]);

  const pendentes = useMemo(() => service.listarNomes().filter(n => n.status === 'pendente' || n.status === 'em_ajuste'), []);
  const decisoes = useMemo(() => service.listarDecisoes(), []);
  const conflitos = useMemo(() => service.listarConflitos(), []);
  const candidatos = useMemo(() => service.listarCandidatos().filter(c => !c.jaCatalogado), []);

  /* ---- Ações ---- */
  const handleAprovar = (id: string) => {
    service.aprovarNome(id, approvalNote || 'Aprovado sem observações', 'Usuário');
    setSelectedName(null);
    setApprovalNote('');
  };

  const handlePedirAjuste = (id: string) => {
    service.solicitarAjuste(id, approvalNote || 'Ajuste solicitado', 'Usuário');
    setSelectedName(null);
    setApprovalNote('');
  };

  /* ============================================================
   *  RENDER
   * ============================================================ */
  return (
    <div className="flex-1 h-full overflow-y-auto bg-[#F8F6F4] custom-scrollbar" style={{ fontFamily: '"Rubik", sans-serif' }}>
      <div className="max-w-[1600px] mx-auto px-6 md:px-10 py-8 space-y-8">

        {/* ========== HEADER ========== */}
        <header className="rounded-[32px] border border-white/80 bg-slate-950 text-white shadow-[0_30px_80px_rgba(15,23,42,0.22)] overflow-hidden relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.12),_transparent_40%),radial-gradient(circle_at_bottom_right,_rgba(99,102,241,0.10),_transparent_40%)]" />
          <div className="relative px-8 md:px-10 py-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="max-w-3xl space-y-4">
              <div className="flex items-center gap-3">
                {onBack && (
                  <button onClick={onBack} className="w-10 h-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                    <BackIcon className="w-5 h-5 text-indigo-400" />
                  </button>
                )}
                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400">Central de Nomes</span>
                  <h1 className="text-4xl md:text-5xl font-black tracking-tight mt-1">NIC</h1>
                </div>
              </div>
              <p className="text-lg text-slate-300 font-medium">Núcleo de Inteligência Conectiva</p>
              <p className="text-slate-400 leading-relaxed max-w-2xl">
                Aqui você encontra todos os nomes do ecossistema, confere se estão certos,
                aprova os que estão ok e pede ajuste quando algo não está claro.
              </p>
              <div className="flex items-center gap-4 pt-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  CATÁLOGO ATIVO
                </div>
                <div className="text-xs text-slate-500 font-medium tracking-wide">{resumo.total} NOMES REGISTRADOS</div>
              </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 min-w-[420px]">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Registrados</span>
                <div className="text-2xl font-black text-white">{resumo.total}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Aprovados</span>
                <div className="text-2xl font-black text-emerald-400">{resumo.aprovados}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Pendentes</span>
                <div className="text-2xl font-black text-amber-400">{resumo.pendentes + resumo.emAjuste}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Conflitos</span>
                <div className="text-2xl font-black text-rose-400">{resumo.conflitosAbertos}</div>
              </div>
            </div>
          </div>
        </header>

        {/* ========== NAVEGAÇÃO ========== */}
        <ModuleSidebarContent><div className="flex items-center gap-2 bg-white border border-slate-200 p-1.5 rounded-2xl w-fit shadow-sm">
          {([
            { key: 'overview' as TabKey, label: 'Visão Geral' },
            { key: 'catalog' as TabKey, label: 'Nomes' },
            { key: 'pending' as TabKey, label: `Pendências (${pendentes.length})` },
            { key: 'history' as TabKey, label: 'Histórico' },
          ]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-slate-900 text-white shadow-lg'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div></ModuleSidebarContent>

        {/* ============================================================
         *  ABA: VISÃO GERAL
         * ============================================================ */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Card: Resumo do Catálogo */}
            <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Resumo do Catálogo</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Empresas', value: nomes.filter(n => n.categoria === 'empresa').length },
                  { label: 'Produtos', value: nomes.filter(n => n.categoria === 'produto').length },
                  { label: 'Métodos', value: nomes.filter(n => n.categoria === 'metodo').length },
                  { label: 'Módulos', value: nomes.filter(n => n.categoria === 'modulo').length },
                ].map(item => (
                  <div key={item.label} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                    <div className="text-2xl font-black text-slate-900">{item.value}</div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{item.label}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3 pt-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status Geral:</span>
                <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  {Math.round((resumo.aprovados / resumo.total) * 100)}% dos nomes aprovados
                </span>
              </div>
            </div>

            {/* Card: Ações Rápidas */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Ações Rápidas</h3>
              <div className="space-y-3">
                <button
                  onClick={() => setActiveTab('pending')}
                  className="w-full p-4 rounded-2xl bg-amber-50 border border-amber-200 text-left hover:bg-amber-100 transition-colors space-y-1"
                >
                  <span className="text-xs font-black text-amber-700 uppercase tracking-widest">
                    {pendentes.length} pendente{pendentes.length !== 1 ? 's' : ''}
                  </span>
                  <p className="text-[11px] text-amber-600 font-medium">Nomes aguardando aprovação</p>
                </button>
                <button
                  onClick={() => setActiveTab('catalog')}
                  className="w-full p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-left hover:bg-indigo-100 transition-colors space-y-1"
                >
                  <span className="text-xs font-black text-indigo-700 uppercase tracking-widest">Ver Catálogo</span>
                  <p className="text-[11px] text-indigo-600 font-medium">Consulte todos os nomes registrados</p>
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left hover:bg-slate-100 transition-colors space-y-1"
                >
                  <span className="text-xs font-black text-slate-700 uppercase tracking-widest">Últimas Decisões</span>
                  <p className="text-[11px] text-slate-600 font-medium">{resumo.totalDecisoes} registros no histórico</p>
                </button>
              </div>
            </div>

            {/* Card: Conflitos e Varredura */}
            <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Conflitos de Nome</h3>
              {conflitos.filter(c => c.status === 'aberto').length === 0 ? (
                <p className="text-sm text-slate-500">Nenhum conflito aberto no momento.</p>
              ) : (
                <div className="space-y-3">
                  {conflitos.filter(c => c.status === 'aberto').map(c => (
                    <div key={c.id} className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-rose-700 uppercase tracking-widest">Conflito</span>
                        <span className="text-[10px] font-bold text-rose-500 uppercase bg-rose-100 px-2 py-0.5 rounded-md">
                          {c.tipoConflito === 'alias_duplicado' ? 'Alias Repetido' :
                           c.tipoConflito === 'nome_repetido' ? 'Nome Repetido' :
                           c.tipoConflito === 'categoria_divergente' ? 'Categoria Diferente' : 'Grafia Diferente'}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-slate-800">{c.nomeA} × {c.nomeB}</p>
                      <p className="text-xs text-slate-600">{c.descricao}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Card: Candidatos da Varredura */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Novos Candidatos</h3>
              <div className="text-center py-4 space-y-2">
                <div className="text-3xl font-black text-indigo-500">{candidatos.length}</div>
                <p className="text-[11px] text-slate-500 font-medium">Nomes encontrados na varredura</p>
              </div>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {candidatos.slice(0, 5).map(c => (
                  <div key={c.nome} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div>
                      <span className="text-xs font-bold text-slate-800">{c.nome}</span>
                      <p className="text-[10px] text-slate-400">{c.projeto}</p>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase ${
                      c.confianca === 'alta' ? 'bg-emerald-50 text-emerald-600' :
                      c.confianca === 'media' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-500'
                    }`}>
                      {c.confianca === 'alta' ? 'Alta' : c.confianca === 'media' ? 'Média' : 'Baixa'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
         *  ABA: NOMES (CATÁLOGO)
         * ============================================================ */}
        {activeTab === 'catalog' && (
          <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">

            {/* Painel de busca e filtro */}
            <aside className="space-y-6">
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Filtrar</h3>
                  <span className="bg-indigo-50 text-indigo-700 text-[10px] font-black px-2 py-1 rounded-md">
                    {nomes.length} encontrados
                  </span>
                </div>
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar por nome, slug ou alias..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['todos', 'aprovado', 'pendente', 'em_ajuste', 'recusado'] as const).map(s => (
                      <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                          statusFilter === s
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {s === 'todos' ? 'Todos' : statusLabel(s)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Categoria</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(['empresa', 'produto', 'metodo', 'modulo', 'iniciativa'] as const).map(cat => (
                      <span key={cat} className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-600">
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </span>
                    ))}
                  </div>
                </div>
              </section>
            </aside>

            {/* Lista de nomes */}
            <main className="space-y-4">
              {selectedName ? (
                /* ---- Detalhe do nome ---- */
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button onClick={() => setSelectedName(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <XIcon className="w-5 h-5" />
                      </button>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">{selectedName.nomeOficial}</h3>
                      <StatusChip status={selectedName.status} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-1">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Slug do Sistema</span>
                      <p className="text-sm font-bold text-slate-800 font-mono">{selectedName.slugSistema}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Categoria</span>
                      <p className="text-sm font-bold text-slate-800">{selectedName.categoria}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Empresa</span>
                      <p className="text-sm font-bold text-slate-800">{selectedName.empresaVinculada}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Pilar</span>
                      <p className="text-sm font-bold text-slate-800">{selectedName.pilar}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Origem</span>
                      <p className="text-sm font-bold text-slate-800">{selectedName.origem}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Atualizado em</span>
                      <p className="text-sm font-bold text-slate-800">{selectedName.ultimaAtualizacao}</p>
                    </div>
                  </div>

                  {/* Aliases */}
                  <div className="space-y-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Nomes Alternativos (Aliases)</span>
                    <div className="flex flex-wrap gap-2">
                      {selectedName.aliases.map(a => (
                        <span key={a} className="px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700">
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Anotações */}
                  <div className="space-y-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Anotações</span>
                    <p className="text-sm text-slate-600 bg-slate-50 rounded-2xl p-4 border border-slate-100">
                      {selectedName.anotacoes || 'Sem anotações.'}
                    </p>
                  </div>

                  {/* Ações de aprovação */}
                  {selectedName.status === 'pendente' && (
                    <div className="space-y-4 pt-2 border-t border-slate-100">
                      <span className="text-xs font-black uppercase tracking-widest text-slate-500">Decidir sobre este nome</span>
                      <textarea
                        placeholder="Observação sobre a decisão (opcional)..."
                        value={approvalNote}
                        onChange={e => setApprovalNote(e.target.value)}
                        className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 min-h-[80px] resize-none"
                      />
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleAprovar(selectedName.id)}
                          className="px-6 py-3 rounded-2xl bg-emerald-500 text-white font-black uppercase tracking-[0.12em] text-xs shadow-lg hover:bg-emerald-400 transition-all flex items-center gap-2"
                        >
                          <CheckIcon className="w-4 h-4" />
                          Aprovar
                        </button>
                        <button
                          onClick={() => handlePedirAjuste(selectedName.id)}
                          className="px-6 py-3 rounded-2xl border border-slate-200 text-slate-600 font-black uppercase tracking-[0.12em] text-xs hover:bg-slate-50 transition-all flex items-center gap-2"
                        >
                          Pedir Ajuste
                        </button>
                      </div>
                    </div>
                  )}
                </section>
              ) : (
                /* ---- Lista Compacta ---- */
                <section className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                  {/* Cabeçalho da lista */}
                  <div className="grid grid-cols-[1fr_120px_110px_100px] gap-0 px-5 py-3 bg-slate-50 border-b border-slate-100">
                    <span className="text-[8px] font-black uppercase tracking-[0.08em] text-slate-400">Nome</span>
                    <span className="text-[8px] font-black uppercase tracking-[0.08em] text-slate-400">Categoria</span>
                    <span className="text-[8px] font-black uppercase tracking-[0.08em] text-slate-400">Empresa</span>
                    <span className="text-[8px] font-black uppercase tracking-[0.08em] text-slate-400 text-right">Status</span>
                  </div>

                  {/* Linhas */}
                  <div className="divide-y divide-slate-50">
                    {nomes.map(nome => (
                      <button
                        key={nome.id}
                        onClick={() => setSelectedName(nome)}
                        className="grid grid-cols-[1fr_120px_110px_100px] gap-0 w-full px-5 text-left hover:bg-slate-50 transition-colors"
                        style={{ minHeight: '32px' }}
                      >
                        <div className="flex items-center gap-2 min-w-0 py-0.5">
                          <span className="text-xs font-bold text-slate-800 truncate">{nome.nomeOficial}</span>
                          {nome.aliases.length > 0 && (
                            <span className="text-[9px] text-slate-400 shrink-0">({nome.aliases[0]})</span>
                          )}
                        </div>
                        <div className="flex items-center py-0.5">
                          <span className="text-[10px] font-medium text-slate-500">{nome.categoria}</span>
                        </div>
                        <div className="flex items-center py-0.5">
                          <span className="text-[10px] font-medium text-slate-500">{nome.empresaVinculada}</span>
                        </div>
                        <div className="flex items-center justify-end py-0.5">
                          <StatusChip status={nome.status} />
                        </div>
                      </button>
                    ))}
                  </div>

                  {nomes.length === 0 && (
                    <div className="p-8 text-center text-sm text-slate-400">
                      Nenhum nome encontrado com esses filtros.
                    </div>
                  )}
                </section>
              )}
            </main>
          </div>
        )}

        {/* ============================================================
         *  ABA: PENDÊNCIAS
         * ============================================================ */}
        {activeTab === 'pending' && (
          <div className="grid grid-cols-1 gap-6 max-w-5xl">
            {/* Conflitos Abertos */}
            {conflitos.filter(c => c.status === 'aberto').length > 0 && (
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-rose-700 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  Conflitos de Nome
                </h3>
                {conflitos.filter(c => c.status === 'aberto').map(c => (
                  <div key={c.id} className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-slate-800">{c.nomeA} × {c.nomeB}</p>
                      <span className="text-[10px] font-bold text-rose-600 uppercase bg-rose-100 px-2 py-0.5 rounded-md">
                        {c.tipoConflito === 'alias_duplicado' ? 'Alias Repetido' :
                         c.tipoConflito === 'nome_repetido' ? 'Nome Repetido' :
                         c.tipoConflito === 'categoria_divergente' ? 'Categoria Diferente' : 'Grafia Diferente'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{c.descricao}</p>
                    <div className="flex gap-2 pt-1">
                      <button className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-all">
                        Resolver
                      </button>
                      <button className="px-4 py-2 rounded-xl border border-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">
                        Ignorar
                      </button>
                    </div>
                  </div>
                ))}
              </section>
            )}

            {/* Pendentes de Aprovação */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Aguardando Aprovação</h3>
                <span className="bg-amber-50 text-amber-700 text-[10px] font-black px-2 py-1 rounded-md">
                  {pendentes.length} itens
                </span>
              </div>

              {pendentes.length === 0 ? (
                <div className="py-8 text-center">
                  <CheckIcon className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                  <p className="text-sm text-slate-500 font-medium">Tudo em dia! Nenhuma pendência no momento.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {pendentes.map(item => (
                    <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-800">{item.nomeOficial}</span>
                          <StatusChip status={item.status} />
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {item.categoria} · {item.empresaVinculada} · {item.origem}
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => { setSelectedName(item); setActiveTab('catalog'); }}
                          className="px-4 py-2 rounded-xl bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-400 transition-all"
                        >
                          Analisar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Candidatos da Varredura */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Novos Nomes Encontrados</h3>
                <span className="bg-indigo-50 text-indigo-700 text-[10px] font-black px-2 py-1 rounded-md">
                  {candidatos.length} candidatos
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Estes nomes foram encontrados em arquivos do ecossistema e ainda não estão no catálogo.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {candidatos.map(c => (
                  <div key={c.nome} className="p-4 rounded-2xl border border-slate-100 bg-slate-50 space-y-2 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all cursor-pointer">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-800">{c.nome}</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase ${
                        c.confianca === 'alta' ? 'bg-emerald-50 text-emerald-600' :
                        c.confianca === 'media' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-500'
                      }`}>
                        {c.confianca === 'alta' ? 'Alta' : c.confianca === 'media' ? 'Média' : 'Baixa'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono truncate">{c.projeto}</p>
                    <p className="text-[10px] text-slate-500">
                      Sugestão: <span className="font-bold">{c.sugestaoCategoria}</span>
                    </p>
                    <button className="w-full mt-1 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all">
                      Adicionar ao Catálogo
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* ============================================================
         *  ABA: HISTÓRICO
         * ============================================================ */}
        {activeTab === 'history' && (
          <div className="grid grid-cols-1 gap-6 max-w-5xl">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Decisões Tomadas</h3>
                <span className="text-xs text-slate-400 font-bold">{decisoes.length} registros</span>
              </div>

              {decisoes.length === 0 ? (
                <p className="text-sm text-slate-500">Nenhuma decisão registrada ainda.</p>
              ) : (
                <div className="space-y-4">
                  {decisoes.map(d => {
                    const nome = service.obterNome(d.itemId);
                    return (
                      <div key={d.id} className="p-5 rounded-[24px] border border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-start justify-between gap-4 hover:border-indigo-200 hover:bg-white transition-all">
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <ClockIcon className="w-4 h-4 text-slate-400 shrink-0" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{d.data}</span>
                          </div>
                          <h4 className="text-base font-black text-slate-900">{nome?.nomeOficial || d.itemId}</h4>
                          <p className="text-xs text-slate-600">{d.justificativa}</p>
                          <div className="flex items-center gap-3 pt-1">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-bold border ${
                              d.decisao === 'aprovado' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              d.decisao === 'ajustar' ? 'bg-violet-50 text-violet-700 border-violet-200' :
                              'bg-red-50 text-red-700 border-red-200'
                            }`}>
                              {d.decisao === 'aprovado' ? '✓ Aprovado' :
                               d.decisao === 'ajustar' ? '↻ Ajustar' : '✕ Recusado'}
                            </span>
                            <span className="text-[10px] text-slate-400">por {d.decididoPor}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}

      </div>
    </div>
  );
};

export default NICPage;
