import { useSagbSection } from '../../../../../core/navigation/useSagbHistory';
import React from 'react';
import {
  atualizarAtivoCanonicoPersistido,
  atualizarBlocoInternoPersistido,
  atualizarBlocoCanonicoPersistido,
  atualizarAtivoEmEstruturacaoPersistido,
  atualizarAtivoEmEstruturacaoLocal,
  buscarAtivoEmEstruturacaoPorEntradaId,
  criarSnapshotCanonicoFromAtivo,
  criarVersaoCanonicaPersistida,
  criarBlocoCanonicoPersistido,
  diagnosticarProntidaoPromocaoAssistida,
  gerarPreviewPromocaoAtivoCanonico,
  criarBlocoInternoPersistido,
  criarFiltrosOperacionaisMesaIniciais,
  criarLeituraOperacionalMesa,
  criarEntradaBrutaPersistida,
  executarBackfillSnapshotsCanonicosDoAtivo,
  criarAtivoEmEstruturacaoFromPreview,
  diagnosticarAtivoEmEstruturacao,
  gerarConversaoAssistidaDeEntrada,
  getAtivoBySlug,
  listarEntradasBrutasPersistidas,
  listarBlocosInternosDoAtivoPersistido,
  listarStatusSnapshotsPorAtivoCanonico,
  getMetodologias,
  getPerguntasEstruturacaoAssistida,
  getStatusEditorialLabel,
  getTaxonomiaOficialAtivos,
  getEntradasMetodologicasBrutas,
  getMaturidadePraticaLabel,
  getEstadoGovernancaLabel,
  listarAtivosCanonicosPersistidos,
  criarRelacaoEstruturacaoPersistida,
  removerRelacaoEstruturacaoPersistida,
  registrarEventoManutencaoCanonicaPersistido,
  promoverAtivoEmEstruturacaoParaCanonico,
  revalidarSnapshotVersaoCanonica,
  regenerarSnapshotVersaoCanonicaControlado,
  removerBlocoCanonicoPersistido,
  removerBlocoInternoPersistido,
  reordenarBlocosCanonicosPersistidos,
  reordenarBlocosInternosPersistidos,
  salvarAtivoEmEstruturacaoFromPreview,
  listarAtivosEmEstruturacaoPersistidos,
  filtrarItensOperacionaisMesa,
  ordenarItensOperacionaisMesa,
  agruparItensOperacionaisMesa,
  calcularIndicadoresNucleo,
  type IndicadoresNucleo
} from '../services';
import type {
  AtivoCanonico,
  AtivoCanonicoBlocoPatch,
  AtivoCanonicoBlocoTipo,
  AtivoCanonicoPatch,
  AtivoCanonicoVersaoStatus,
  AtivoEmEstruturacaoBlocoInterno,
  AtivoEmEstruturacaoBlocoInternoPatch,
  AtivoEmEstruturacaoBlocoTipo,
  AtivoEmEstruturacaoRelacaoDirecao,
  AtivoEmEstruturacao,
  AtivoEmEstruturacaoPatch,
  AtivoMetodologicoEstadoGovernanca,
  AtivoMetodologicoRelacaoTipo,
  EntradaMetodologicaBruta,
  EntradaMetodologicaTipoDeEntrada,
  MesaEstruturacaoAgrupamentoOperacional,
  MesaEstruturacaoFiltrosOperacionais,
  MesaEstruturacaoOrdenacaoOperacional,
  Metodologia,
  MetodologiaMaturidadePratica,
  MetodologiaStatusEditorial,
  SnapshotCanonicoStatusVersao
} from '../types';
import { ATIVO_EM_ESTRUTURACAO_BLOCO_TIPOS, ATIVO_METODOLOGICO_RELACAO_TIPOS } from '../types';
import { MetodologiasHomePage } from './MetodologiasHomePage';
import { MetodologiasMesaPage } from './MetodologiasMesaPage';
import { MetodologiasSaudePage } from './MetodologiasSaudePage';
import { MetodologiasCatalogoPage } from './MetodologiasCatalogoPage';
import { MetodologiaAtivoPage } from './MetodologiaAtivoPage';
import { MetodologiaAtivoEditarPage } from './MetodologiaAtivoEditarPage';
import { MetodologiaCanonicoEditarPage } from './MetodologiaCanonicoEditarPage';

const TIPOS_ENTRADA_DISPONIVEIS: EntradaMetodologicaTipoDeEntrada[] = [
  'ideia_crua',
  'rascunho',
  'texto_livre',
  'bloco_doutrinario',
  'resumo_pdf',
  'framework_parcial',
  'processo_difuso'
];

const STATUS_EDITORIAIS_DISPONIVEIS: MetodologiaStatusEditorial[] = [
  'rascunho',
  'em_estruturacao',
  'em_revisao',
  'aprovada',
  'oficial',
  'arquivada'
];

const MATURIDADES_DISPONIVEIS: MetodologiaMaturidadePratica[] = [
  'conceitual',
  'modelada',
  'testada',
  'validada',
  'escalavel'
];

const ESTADOS_GOVERNANCA_DISPONIVEIS: AtivoMetodologicoEstadoGovernanca[] = [
  'em_desenvolvimento',
  'em_revisao',
  'oficial',
  'arquivado',
  'obsoleto'
];

const TIPO_BLOCO_LABEL: Record<AtivoEmEstruturacaoBlocoTipo, string> = {
  essencia: 'Essência',
  principio: 'Princípio',
  etapa: 'Etapa',
  regra: 'Regra',
  aplicacao: 'Aplicação',
  checklist: 'Checklist',
  observacao_estrutural: 'Observação estrutural'
};

type RotaInterna =
  | '/metodologias'
  | '/metodologias/mesa'
  | '/metodologias/catalogo'
  | '/metodologias/saude'
  | `/metodologias/ativos/${string}`
  | `/metodologias/ativos/${string}/editar`;

const HASH_PADRAO: RotaInterna = '/metodologias';

const lerRotaHash = (): RotaInterna => {
  const hash = window.location.hash?.replace('#', '');
  if (!hash || !hash.startsWith('/metodologias')) return HASH_PADRAO;
  return hash as RotaInterna;
};

const navegarHash = (rota: RotaInterna) => {
  if (window.location.hash !== `#${rota}`) {
    // URL managed by useSagbSection; retain standalone hash navigation only.
    if(!window.history.state?.sagbNavigationV1) window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}#${rota}`);
  }
};

const JANELA_DEDUP_EVENTO_MS = 2 * 60 * 1000;

const criarAtivoEstruturacaoFromAtivo = (ativo: Metodologia): AtivoEmEstruturacao => {
  const agora = new Date().toISOString();
  return {
    id_estruturacao: `estr-${ativo.id}`,
    origem_preview_id: `manual-${ativo.id}`,
    origem_entrada_id: `origem-${ativo.id}`,
    origem_entrada_titulo: ativo.nome,
    etapa_fluxo: 'edicao_guiada',
    nome: ativo.nome,
    resumo: ativo.resumo,
    tipo_de_ativo: ativo.tipo_de_ativo,
    definicao: ativo.definicao,
    objetivo: ativo.objetivo,
    status_editorial: ativo.status_editorial,
    maturidade_pratica: ativo.maturidade_pratica,
    governanca: { estado: ativo.governanca.estado_ciclo_vida },
    blocos_internos: [],
    created_at: agora,
    updated_at: agora
  };
};

const getResumoCamadaFromBlocosCanonicos = (canonico: AtivoCanonico, tipos: string[], fallback: string): string => {
  const bloco = (canonico.blocos_canonicos ?? []).find((item) => tipos.includes(item.tipo_de_bloco) && item.conteudo.trim().length > 0);
  return bloco?.conteudo ?? fallback;
};

const mapCanonicoParaMetodologia = (canonico: AtivoCanonico): Metodologia => ({
  id: canonico.id,
  tipo_de_ativo: canonico.tipo_de_ativo,
  nome: canonico.nome,
  slug: canonico.slug,
  resumo: canonico.resumo,
  definicao: canonico.definicao,
  objetivo: canonico.objetivo,
  status_editorial: canonico.status_editorial,
  maturidade_pratica: canonico.maturidade_pratica,
  governanca: {
    estado_ciclo_vida: canonico.governanca_estado,
    responsaveis: canonico.promovido_por
      ? [
          {
            id: `promotor-${canonico.id}`,
            nome: canonico.promovido_por,
            papel: 'responsavel_principal'
          }
        ]
      : []
  },
  versao_atual: canonico.versao_atual,
  created_at: canonico.created_at,
  updated_at: canonico.updated_at,
  blocos_canonicos: canonico.blocos_canonicos ?? [],
  relacoes_ativos: canonico.relacoes_ativos ?? [],
  blocos_base: [
    {
      id: `${canonico.id}-essencia`,
      tipo: 'essencia',
      titulo: 'Essência',
      resumo: getResumoCamadaFromBlocosCanonicos(canonico, ['essencia', 'principio'], canonico.definicao)
    },
    {
      id: `${canonico.id}-estrutura`,
      tipo: 'estrutura',
      titulo: 'Estrutura',
      resumo: getResumoCamadaFromBlocosCanonicos(canonico, ['etapa', 'regra', 'observacao_estrutural'], canonico.resumo)
    },
    {
      id: `${canonico.id}-aplicacao`,
      tipo: 'aplicacao',
      titulo: 'Aplicação',
      resumo: getResumoCamadaFromBlocosCanonicos(canonico, ['aplicacao', 'checklist'], canonico.objetivo)
    },
    {
      id: `${canonico.id}-governanca`,
      tipo: 'governanca',
      titulo: 'Governança',
      resumo: `Estado de governança: ${canonico.governanca_estado}`
    }
  ],
  versoes_oficiais: (canonico.versoes_canonicas ?? []).map((versao) => ({
    id: versao.id,
    ativo_id: versao.ativo_canonico_id,
    numero_versao: versao.numero_versao,
    titulo: versao.titulo,
    resumo_da_versao: versao.resumo_da_versao,
    status_da_versao: versao.status_da_versao,
    publicada_em: versao.publicada_em
  })),
  historico_estruturado:
    (canonico.eventos_manutencao ?? []).length > 0
      ? (canonico.eventos_manutencao ?? []).map((evento) => ({
          id: evento.id,
          ativo_id: evento.ativo_canonico_id,
          tipo_de_evento: evento.tipo_de_evento,
          descricao: evento.descricao,
          ocorrido_em: evento.ocorrido_em,
          observacao: evento.bloco_canonico_id ? `Bloco canônico relacionado: ${evento.bloco_canonico_id}` : undefined
        }))
      : [
          {
            id: `hist-promocao-${canonico.id}`,
            ativo_id: canonico.id,
            tipo_de_evento: 'oficializado',
            descricao: 'Ativo criado por promoção assistida a partir de ativo em estruturação.',
            ocorrido_em: canonico.promovido_em,
            observacao: `Origem entrada bruta: ${canonico.origem_entrada_bruta_id} | Origem estruturação: ${canonico.origem_ativo_em_estruturacao_id}`
          }
        ]
});

const deveRegistrarEventoCanonico = (params: {
  ativo: AtivoCanonico;
  tipoDeEvento:
    | 'ativo_canonico_atualizado'
    | 'bloco_canonico_atualizado'
    | 'bloco_canonico_criado'
    | 'bloco_canonico_removido'
    | 'versao_canonica_criada';
  descricao: string;
  blocoCanonicoId?: string;
}) => {
  const eventos = params.ativo.eventos_manutencao ?? [];
  if (!eventos.length) return true;

  const eventoMaisRecenteMesmoTipo = eventos.find(
    (evento) => evento.tipo_de_evento === params.tipoDeEvento && (evento.bloco_canonico_id ?? '') === (params.blocoCanonicoId ?? '')
  );

  if (!eventoMaisRecenteMesmoTipo) return true;

  const mesmoConteudo = eventoMaisRecenteMesmoTipo.descricao.trim() === params.descricao.trim();
  if (!mesmoConteudo) return true;

  const diferencaMs = Math.abs(Date.now() - +new Date(eventoMaisRecenteMesmoTipo.ocorrido_em));
  return diferencaMs > JANELA_DEDUP_EVENTO_MS;
};

interface MetodologiasHubPageProps {
  onBackToSagB?: () => void;
}

const MetodologiasHubPage: React.FC<MetodologiasHubPageProps> = ({ onBackToSagB }) => {
  const metodologias = React.useMemo(() => getMetodologias(), []);
  const entradasBrutasBase = React.useMemo(() => getEntradasMetodologicasBrutas(), []);
  const taxonomiaOficial = React.useMemo(() => getTaxonomiaOficialAtivos(), []);
  const perguntasEstruturacao = React.useMemo(() => getPerguntasEstruturacaoAssistida(), []);

  const [rotaInterna, setRotaInterna] = useSagbSection<RotaInterna>('nide','metodologiasView',()=>lerRotaHash(),rota=>'/nide/metodologias#'+rota);
  const [entradasBrutasLocal, setEntradasBrutasLocal] = React.useState<EntradaMetodologicaBruta[]>(() => entradasBrutasBase);
  const [entradaSelecionadaId, setEntradaSelecionadaId] = React.useState<string>(() => entradasBrutasBase[0]?.id ?? '');
  const [modoConversao, setModoConversao] = React.useState<'preview' | 'ativo_em_estruturacao' | 'ativo_base_gerado'>('preview');
  const [novoTitulo, setNovoTitulo] = React.useState('');
  const [novoTipoEntrada, setNovoTipoEntrada] = React.useState<EntradaMetodologicaTipoDeEntrada>('ideia_crua');
  const [novaOrigem, setNovaOrigem] = React.useState('Entrada manual no Núcleo de Metodologias');
  const [novoConteudoBruto, setNovoConteudoBruto] = React.useState('');
  const [arquivosBrutos, setArquivosBrutos] = React.useState<File[]>([]);
  const [ativoEmEstruturacaoLocal, setAtivoEmEstruturacaoLocal] = React.useState<AtivoEmEstruturacao | null>(null);
  const [ativosCanonicosPersistidos, setAtivosCanonicosPersistidos] = React.useState<AtivoCanonico[]>([]);
  const [ativosEmEstruturacaoPersistidos, setAtivosEmEstruturacaoPersistidos] = React.useState<AtivoEmEstruturacao[]>([]);
  const [blocosOrigemCanonicoEdicao, setBlocosOrigemCanonicoEdicao] = React.useState<AtivoEmEstruturacaoBlocoInterno[]>([]);
  const [ultimoAtivoCanonicoPromovido, setUltimoAtivoCanonicoPromovido] = React.useState<AtivoCanonico | null>(null);
  const [promovendoAssistido, setPromovendoAssistido] = React.useState<boolean>(false);
  const [carregandoPersistencia, setCarregandoPersistencia] = React.useState<boolean>(true);
  const [erroPersistencia, setErroPersistencia] = React.useState<string | null>(null);
  const [filtrosOperacionaisMesa, setFiltrosOperacionaisMesa] = React.useState<MesaEstruturacaoFiltrosOperacionais>(() =>
    criarFiltrosOperacionaisMesaIniciais()
  );
  const [ordenacaoOperacionalMesa, setOrdenacaoOperacionalMesa] = React.useState<MesaEstruturacaoOrdenacaoOperacional>('mais_recentes');
  const [agrupamentoOperacionalMesa, setAgrupamentoOperacionalMesa] =
    React.useState<MesaEstruturacaoAgrupamentoOperacional>('nenhum');

  const registrarErroPersistencia = React.useCallback((contexto: string, error: unknown) => {
    const mensagemOriginal = error instanceof Error ? error.message : 'Falha não identificada';
    const mensagem = mensagemOriginal.includes("Could not find the table 'public.metodologias_entradas_brutas'")
      ? 'Banco ainda sem migrations do módulo metodologias (tabela metodologias_entradas_brutas ausente). Operando com fallback local até provisionar o schema.'
      : mensagemOriginal;
    console.error(contexto, error);
    setErroPersistencia(`${contexto}: ${mensagem}`);
  }, []);

  React.useEffect(() => {
    const onHashChange = () => setRotaInterna(lerRotaHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  React.useEffect(() => {
    let ativo = true;

    const carregarEntradasPersistidas = async () => {
      setCarregandoPersistencia(true);
      setErroPersistencia(null);
      try {
        const [persistidas, canonicos, estruturacao] = await Promise.all([
          listarEntradasBrutasPersistidas(),
          listarAtivosCanonicosPersistidos().catch(() => []),
          listarAtivosEmEstruturacaoPersistidos().catch(() => [])
        ]);
        if (!ativo) return;
        setEntradasBrutasLocal(persistidas.length > 0 ? persistidas : entradasBrutasBase);
        setAtivosCanonicosPersistidos(canonicos);
        setAtivosEmEstruturacaoPersistidos(estruturacao);
        setEntradaSelecionadaId((atual) => atual || persistidas[0]?.id || entradasBrutasBase[0]?.id || '');
      } catch (error) {
        registrarErroPersistencia('Falha ao carregar entradas metodológicas persistidas', error);
        if (!ativo) return;
        setEntradasBrutasLocal(entradasBrutasBase);
        setEntradaSelecionadaId((atual) => atual || entradasBrutasBase[0]?.id || '');
      } finally {
        if (ativo) setCarregandoPersistencia(false);
      }
    };

    carregarEntradasPersistidas();
    return () => {
      ativo = false;
    };
  }, [entradasBrutasBase]);

  const navegar = React.useCallback((rota: RotaInterna) => {
    setRotaInterna(rota);
    navegarHash(rota);
  }, []);

  const entradaSelecionada = React.useMemo(
    () => entradasBrutasLocal.find((entrada) => entrada.id === entradaSelecionadaId) ?? entradasBrutasLocal[0] ?? null,
    [entradasBrutasLocal, entradaSelecionadaId]
  );

  const leituraAssistida = React.useMemo(
    () => (entradaSelecionada ? gerarConversaoAssistidaDeEntrada(entradaSelecionada, 'preview').leitura_inicial : null),
    [entradaSelecionada]
  );

  const conversaoAssistida = React.useMemo(() => {
    if (!entradaSelecionada) return null;
    return gerarConversaoAssistidaDeEntrada(entradaSelecionada, modoConversao);
  }, [entradaSelecionada, modoConversao]);

  React.useEffect(() => {
    let ativo = true;

    const carregarAtivoDaEntrada = async () => {
      if (!entradaSelecionada || !conversaoAssistida) {
        if (ativo) setAtivoEmEstruturacaoLocal(null);
        return;
      }

      try {
        const persistido = await buscarAtivoEmEstruturacaoPorEntradaId(entradaSelecionada.id);
        if (!ativo) return;
        if (persistido) {
          setAtivoEmEstruturacaoLocal(persistido);
          return;
        }
      } catch (error) {
        registrarErroPersistencia('Falha ao carregar ativo persistido por entrada', error);
      }

      if (ativo) {
        setAtivoEmEstruturacaoLocal(criarAtivoEmEstruturacaoFromPreview(conversaoAssistida.ativo_preview));
      }
    };

    carregarAtivoDaEntrada();

    return () => {
      ativo = false;
    };
  }, [entradaSelecionada, conversaoAssistida]);

  const diagnosticoEstruturacao = React.useMemo(
    () => (ativoEmEstruturacaoLocal ? diagnosticarAtivoEmEstruturacao(ativoEmEstruturacaoLocal) : null),
    [ativoEmEstruturacaoLocal]
  );

  const diagnosticoPromocao = React.useMemo(
    () => (ativoEmEstruturacaoLocal ? diagnosticarProntidaoPromocaoAssistida(ativoEmEstruturacaoLocal) : null),
    [ativoEmEstruturacaoLocal]
  );

  const previewPromocao = React.useMemo(
    () => (ativoEmEstruturacaoLocal ? gerarPreviewPromocaoAtivoCanonico(ativoEmEstruturacaoLocal) : null),
    [ativoEmEstruturacaoLocal]
  );

  const metodologiasCanonicas = React.useMemo(
    () => [...metodologias, ...ativosCanonicosPersistidos.map(mapCanonicoParaMetodologia)],
    [metodologias, ativosCanonicosPersistidos]
  );

  const indicadoresNucleo = React.useMemo(() => {
    return calcularIndicadoresNucleo(entradasBrutasLocal, ativosEmEstruturacaoPersistidos, ativosCanonicosPersistidos);
  }, [entradasBrutasLocal, ativosEmEstruturacaoPersistidos, ativosCanonicosPersistidos]);

  const totalBrutas = React.useMemo(
    () => entradasBrutasLocal.filter((entrada) => entrada.status_de_estruturacao === 'bruto').length,
    [entradasBrutasLocal]
  );

  const totalEmEstruturacao = React.useMemo(
    () =>
      entradasBrutasLocal.filter((entrada) => ['em_analise', 'estruturado_parcialmente'].includes(entrada.status_de_estruturacao)).length,
    [entradasBrutasLocal]
  );

  const totalOficiais = React.useMemo(
    () => metodologiasCanonicas.filter((ativo) => ativo.status_editorial === 'oficial').length,
    [metodologiasCanonicas]
  );

  const ativosEmEstruturacaoParaMesa = React.useMemo(() => {
    if (!ativoEmEstruturacaoLocal) return ativosEmEstruturacaoPersistidos;

    const index = ativosEmEstruturacaoPersistidos.findIndex(
      (item) => item.id_estruturacao === ativoEmEstruturacaoLocal.id_estruturacao
    );

    if (index < 0) {
      return [ativoEmEstruturacaoLocal, ...ativosEmEstruturacaoPersistidos];
    }

    return ativosEmEstruturacaoPersistidos.map((item, itemIndex) =>
      itemIndex === index ? ativoEmEstruturacaoLocal : item
    );
  }, [ativosEmEstruturacaoPersistidos, ativoEmEstruturacaoLocal]);

  const leituraOperacionalMesa = React.useMemo(
    () => criarLeituraOperacionalMesa(entradasBrutasLocal, ativosEmEstruturacaoParaMesa),
    [entradasBrutasLocal, ativosEmEstruturacaoParaMesa]
  );

  const itensFiltradosMesa = React.useMemo(
    () => filtrarItensOperacionaisMesa(leituraOperacionalMesa.itens, filtrosOperacionaisMesa),
    [leituraOperacionalMesa, filtrosOperacionaisMesa]
  );

  const itensOrdenadosMesa = React.useMemo(
    () => ordenarItensOperacionaisMesa(itensFiltradosMesa, ordenacaoOperacionalMesa),
    [itensFiltradosMesa, ordenacaoOperacionalMesa]
  );

  const gruposOperacionaisMesa = React.useMemo(
    () => agruparItensOperacionaisMesa(itensOrdenadosMesa, agrupamentoOperacionalMesa),
    [itensOrdenadosMesa, agrupamentoOperacionalMesa]
  );

  const ultimasEntradas = React.useMemo(() => entradasBrutasLocal.slice(0, 4), [entradasBrutasLocal]);
  const ativosOficiaisRecentes = React.useMemo(
    () => metodologiasCanonicas.filter((ativo) => ativo.status_editorial === 'oficial').slice(0, 4),
    [metodologiasCanonicas]
  );

  const ultimosMovimentos = React.useMemo(
    () =>
      metodologiasCanonicas
        .slice(0, 5)
        .map((ativo) => ({
          id: ativo.id,
          data: new Date(ativo.updated_at).toLocaleDateString('pt-BR'),
          titulo: ativo.nome,
          descricao: `${getStatusEditorialLabel(ativo.status_editorial)} • ${getMaturidadePraticaLabel(ativo.maturidade_pratica)} • ${getEstadoGovernancaLabel(ativo.governanca.estado_ciclo_vida)}`
        })),
    [metodologiasCanonicas]
  );

  const slugRota = React.useMemo(() => {
    const match = rotaInterna.match(/^\/metodologias\/ativos\/([^/]+)(?:\/editar)?$/);
    return match?.[1] ?? null;
  }, [rotaInterna]);

  const ativoSelecionado = React.useMemo(() => {
    if (!slugRota) return null;
    return metodologiasCanonicas.find((item) => item.slug === slugRota) ?? getAtivoBySlug(slugRota) ?? null;
  }, [slugRota, metodologiasCanonicas]);

  const ativoCanonicoSelecionado = React.useMemo(() => {
    if (!slugRota) return null;
    return ativosCanonicosPersistidos.find((item) => item.slug === slugRota) ?? null;
  }, [slugRota, ativosCanonicosPersistidos]);

  const blocosOrigemDisponiveisParaCanonico = React.useMemo(() => {
    if (!ativoCanonicoSelecionado) return [];
    const blocosCanonicosOrigem = new Set((ativoCanonicoSelecionado.blocos_canonicos ?? []).map((bloco) => bloco.bloco_origem_estruturacao_id));
    return blocosOrigemCanonicoEdicao.filter((bloco) => !blocosCanonicosOrigem.has(bloco.id));
  }, [ativoCanonicoSelecionado, blocosOrigemCanonicoEdicao]);

  const statusSnapshotsCanonicos: SnapshotCanonicoStatusVersao[] = React.useMemo(() => {
    if (!ativoCanonicoSelecionado) return [];
    return listarStatusSnapshotsPorAtivoCanonico(ativoCanonicoSelecionado);
  }, [ativoCanonicoSelecionado]);

  const handleRegistrarEntradaBruta = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!novoTitulo.trim() || !novoConteudoBruto.trim()) return;

    const anexosTexto = await Promise.all(
      arquivosBrutos.map(async (arquivo) => {
        const nome = arquivo.name;
        const tipo = arquivo.type || 'desconhecido';
        const tamanhoKb = Math.max(1, Math.round(arquivo.size / 1024));
        const isTextual =
          tipo.startsWith('text/') ||
          tipo.includes('json') ||
          tipo.includes('xml') ||
          /\.(txt|md|json|csv|xml)$/i.test(nome);

        if (!isTextual) {
          return `\n\n[ANEXO BRUTO]\narquivo: ${nome}\ntipo: ${tipo}\ntamanho_kb: ${tamanhoKb}\nconteudo: [arquivo binário não textual]`;
        }

        const conteudo = await arquivo.text();
        return `\n\n[ANEXO BRUTO]\narquivo: ${nome}\ntipo: ${tipo}\ntamanho_kb: ${tamanhoKb}\nconteudo:\n${conteudo}`;
      })
    );

    const conteudoBrutoComAnexos = `${novoConteudoBruto.trim()}${anexosTexto.join('')}`;

    let novaEntrada: EntradaMetodologicaBruta;
    try {
      novaEntrada = await criarEntradaBrutaPersistida({
        titulo: novoTitulo.trim(),
        tipo_de_entrada: novoTipoEntrada,
        conteudo_bruto: conteudoBrutoComAnexos,
        origem: novaOrigem.trim() || 'Origem não informada',
        status_de_estruturacao: 'bruto'
      });
    } catch (error) {
      console.error('Falha ao persistir entrada bruta. Criando fallback local temporário.', error);
      const agora = new Date().toISOString();
      novaEntrada = {
        id: `ent-bruta-local-${Date.now()}`,
        titulo: novoTitulo.trim(),
        tipo_de_entrada: novoTipoEntrada,
        conteudo_bruto: conteudoBrutoComAnexos,
        origem: novaOrigem.trim() || 'Origem não informada',
        status_de_estruturacao: 'bruto',
        created_at: agora,
        updated_at: agora
      };
    }

    setEntradasBrutasLocal((atual) => [novaEntrada, ...atual]);
    setEntradaSelecionadaId(novaEntrada.id);
    setNovoTitulo('');
    setNovoConteudoBruto('');
    setArquivosBrutos([]);
    setModoConversao('preview');
  };

  const handleSelecionarEntrada = (entradaId: string) => {
    setEntradaSelecionadaId(entradaId);
    setModoConversao('preview');
  };

  const handleAtualizarAtivoEstruturacao = (patch: AtivoEmEstruturacaoPatch) => {
    setAtivoEmEstruturacaoLocal((atual) => {
      if (!atual) return atual;
      return atualizarAtivoEmEstruturacaoLocal(atual, patch);
    });

    if (ativoEmEstruturacaoLocal?.id_estruturacao) {
      atualizarAtivoEmEstruturacaoPersistido(ativoEmEstruturacaoLocal.id_estruturacao, patch).catch((error) => {
        registrarErroPersistencia('Falha ao persistir patch de edição guiada', error);
      });
    }
  };

  const handleAdicionarBlocoInterno = async (tipoDeBloco: AtivoEmEstruturacaoBlocoTipo) => {
    const ativoAtual = ativoEmEstruturacaoLocal;
    if (!ativoAtual?.id_estruturacao) return;

    try {
      const novoBloco = await criarBlocoInternoPersistido(ativoAtual.id_estruturacao, {
        tipo_de_bloco: tipoDeBloco,
        titulo: `Novo bloco de ${TIPO_BLOCO_LABEL[tipoDeBloco].toLowerCase()}`,
        conteudo: ''
      });

      setAtivoEmEstruturacaoLocal((atual) => {
        if (!atual) return atual;
        const blocos = [...(atual.blocos_internos ?? []), novoBloco].sort((a, b) => a.ordem - b.ordem);
        return {
          ...atual,
          blocos_internos: blocos,
          updated_at: new Date().toISOString()
        };
      });
    } catch (error) {
      registrarErroPersistencia('Falha ao adicionar bloco interno do ativo em estruturação', error);
    }
  };

  const handleAtualizarBlocoInterno = (blocoId: string, patch: AtivoEmEstruturacaoBlocoInternoPatch) => {
    setAtivoEmEstruturacaoLocal((atual) => {
      if (!atual) return atual;
      const blocos = (atual.blocos_internos ?? []).map((bloco) =>
        bloco.id === blocoId
          ? {
              ...bloco,
              ...patch,
              updated_at: new Date().toISOString()
            }
          : bloco
      );

      return {
        ...atual,
        blocos_internos: blocos,
        updated_at: new Date().toISOString()
      };
    });

    atualizarBlocoInternoPersistido(blocoId, patch).catch((error) => {
      registrarErroPersistencia('Falha ao atualizar bloco interno persistido', error);
    });
  };

  const handleRemoverBlocoInterno = (blocoId: string) => {
    setAtivoEmEstruturacaoLocal((atual) => {
      if (!atual) return atual;
      const blocos = (atual.blocos_internos ?? [])
        .filter((bloco) => bloco.id !== blocoId)
        .map((bloco, index) => ({ ...bloco, ordem: index + 1, updated_at: new Date().toISOString() }));

      if (atual.id_estruturacao) {
        reordenarBlocosInternosPersistidos(
          atual.id_estruturacao,
          blocos.map((bloco) => bloco.id)
        ).catch((error) => {
          registrarErroPersistencia('Falha ao reordenar blocos internos após remoção', error);
        });
      }

      return {
        ...atual,
        blocos_internos: blocos,
        updated_at: new Date().toISOString()
      };
    });

    removerBlocoInternoPersistido(blocoId).catch((error) => {
      registrarErroPersistencia('Falha ao remover bloco interno persistido', error);
    });
  };

  const handleMoverBlocoInterno = (blocoId: string, direcao: 'cima' | 'baixo') => {
    setAtivoEmEstruturacaoLocal((atual) => {
      if (!atual) return atual;

      const blocosOrdenados = [...(atual.blocos_internos ?? [])].sort((a, b) => a.ordem - b.ordem);
      const indexAtual = blocosOrdenados.findIndex((bloco) => bloco.id === blocoId);
      if (indexAtual < 0) return atual;

      const alvo = direcao === 'cima' ? indexAtual - 1 : indexAtual + 1;
      if (alvo < 0 || alvo >= blocosOrdenados.length) return atual;

      const copia = [...blocosOrdenados];
      const [item] = copia.splice(indexAtual, 1);
      copia.splice(alvo, 0, item);

      const blocosReordenados: AtivoEmEstruturacaoBlocoInterno[] = copia.map((bloco, index) => ({
        ...bloco,
        ordem: index + 1,
        updated_at: new Date().toISOString()
      }));

      if (atual.id_estruturacao) {
        reordenarBlocosInternosPersistidos(
          atual.id_estruturacao,
          blocosReordenados.map((bloco) => bloco.id)
        ).catch((error) => {
          registrarErroPersistencia('Falha ao persistir reordenação de blocos internos', error);
        });
      }

      return {
        ...atual,
        blocos_internos: blocosReordenados,
        updated_at: new Date().toISOString()
      };
    });
  };

  const handleAdicionarRelacaoEstruturacao = async (input: {
    tipo_de_relacao: AtivoMetodologicoRelacaoTipo;
    ativo_relacionado_canonico_id: string;
    direcao: AtivoEmEstruturacaoRelacaoDirecao;
    observacao?: string;
  }) => {
    const ativoAtual = ativoEmEstruturacaoLocal;
    if (!ativoAtual?.id_estruturacao) return;

    try {
      const relacao = await criarRelacaoEstruturacaoPersistida(ativoAtual.id_estruturacao, input);

      setAtivoEmEstruturacaoLocal((atual) => {
        if (!atual) return atual;
        const relacoesEstruturacao = [...(atual.relacoes_estruturacao ?? []), relacao];
        return {
          ...atual,
          relacoes_estruturacao: relacoesEstruturacao,
          relacoes_ativos: relacoesEstruturacao.map((item) => ({
            id: item.id,
            tipo_de_relacao: item.tipo_de_relacao,
            ativo_origem_id: item.direcao === 'saida' ? atual.id_estruturacao : item.ativo_relacionado_canonico_id,
            ativo_destino_id: item.direcao === 'saida' ? item.ativo_relacionado_canonico_id : atual.id_estruturacao,
            observacao: item.observacao
          })),
          updated_at: new Date().toISOString()
        };
      });
    } catch (error) {
      registrarErroPersistencia('Falha ao adicionar relação em estruturação', error);
    }
  };

  const handleRemoverRelacaoEstruturacao = (relacaoId: string) => {
    setAtivoEmEstruturacaoLocal((atual) => {
      if (!atual) return atual;
      const relacoesEstruturacao = (atual.relacoes_estruturacao ?? []).filter((relacao) => relacao.id !== relacaoId);
      return {
        ...atual,
        relacoes_estruturacao: relacoesEstruturacao,
        relacoes_ativos: relacoesEstruturacao.map((item) => ({
          id: item.id,
          tipo_de_relacao: item.tipo_de_relacao,
          ativo_origem_id: item.direcao === 'saida' ? atual.id_estruturacao : item.ativo_relacionado_canonico_id,
          ativo_destino_id: item.direcao === 'saida' ? item.ativo_relacionado_canonico_id : atual.id_estruturacao,
          observacao: item.observacao
        })),
        updated_at: new Date().toISOString()
      };
    });

    removerRelacaoEstruturacaoPersistida(relacaoId).catch((error) => {
      registrarErroPersistencia('Falha ao remover relação em estruturação', error);
    });
  };

  const handleAbrirAtivo = (slug: string) => {
    navegar(`/metodologias/ativos/${slug}`);
  };

  const atualizarCanonicoLocal = React.useCallback((ativoCanonicoId: string, updater: (ativo: AtivoCanonico) => AtivoCanonico) => {
    setAtivosCanonicosPersistidos((atual) => atual.map((item) => (item.id === ativoCanonicoId ? updater(item) : item)));
    setUltimoAtivoCanonicoPromovido((atual) => (atual?.id === ativoCanonicoId ? updater(atual) : atual));
  }, []);

  const handleAtualizarAtivoCanonico = (patch: AtivoCanonicoPatch) => {
    if (!ativoCanonicoSelecionado) return;

    atualizarCanonicoLocal(ativoCanonicoSelecionado.id, (ativo) => ({
      ...ativo,
      ...patch,
      updated_at: new Date().toISOString()
    }));

    atualizarAtivoCanonicoPersistido(ativoCanonicoSelecionado.id, patch).catch((error) => {
      console.error('Falha ao atualizar ativo canônico persistido.', error);
    });

    const camposAlterados = Object.keys(patch);
    if (camposAlterados.length) {
      const descricaoEvento = `Atualização relevante no ativo canônico (${camposAlterados.join(', ')}).`;
      if (
        !deveRegistrarEventoCanonico({
          ativo: ativoCanonicoSelecionado,
          tipoDeEvento: 'ativo_canonico_atualizado',
          descricao: descricaoEvento
        })
      ) {
        return;
      }

      registrarEventoManutencaoCanonicaPersistido({
        ativo_canonico_id: ativoCanonicoSelecionado.id,
        tipo_de_evento: 'ativo_canonico_atualizado',
        descricao: descricaoEvento
      })
        .then((evento) => {
          atualizarCanonicoLocal(ativoCanonicoSelecionado.id, (ativo) => ({
            ...ativo,
            eventos_manutencao: [evento, ...(ativo.eventos_manutencao ?? [])]
          }));
        })
        .catch((error) => {
          console.error('Falha ao registrar evento de atualização do ativo canônico.', error);
        });
    }
  };

  const handleAtualizarBlocoCanonico = (blocoId: string, patch: AtivoCanonicoBlocoPatch) => {
    if (!ativoCanonicoSelecionado) return;

    atualizarCanonicoLocal(ativoCanonicoSelecionado.id, (ativo) => ({
      ...ativo,
      blocos_canonicos: (ativo.blocos_canonicos ?? []).map((bloco) =>
        bloco.id === blocoId
          ? {
              ...bloco,
              ...patch,
              updated_at: new Date().toISOString()
            }
          : bloco
      ),
      updated_at: new Date().toISOString()
    }));

    atualizarBlocoCanonicoPersistido(blocoId, patch).catch((error) => {
      console.error('Falha ao atualizar bloco canônico persistido.', error);
    });

    const descricaoEvento = 'Bloco canônico atualizado durante manutenção controlada.';
    if (
      !deveRegistrarEventoCanonico({
        ativo: ativoCanonicoSelecionado,
        tipoDeEvento: 'bloco_canonico_atualizado',
        descricao: descricaoEvento,
        blocoCanonicoId: blocoId
      })
    ) {
      return;
    }

    registrarEventoManutencaoCanonicaPersistido({
      ativo_canonico_id: ativoCanonicoSelecionado.id,
      bloco_canonico_id: blocoId,
      tipo_de_evento: 'bloco_canonico_atualizado',
      descricao: descricaoEvento
    })
      .then((evento) => {
        atualizarCanonicoLocal(ativoCanonicoSelecionado.id, (ativo) => ({
          ...ativo,
          eventos_manutencao: [evento, ...(ativo.eventos_manutencao ?? [])]
        }));
      })
      .catch((error) => {
        console.error('Falha ao registrar evento de atualização de bloco canônico.', error);
      });
  };

  const handleRemoverBlocoCanonico = (blocoId: string) => {
    if (!ativoCanonicoSelecionado) return;

    atualizarCanonicoLocal(ativoCanonicoSelecionado.id, (ativo) => {
      const blocosReordenados = (ativo.blocos_canonicos ?? [])
        .filter((bloco) => bloco.id !== blocoId)
        .sort((a, b) => a.ordem - b.ordem)
        .map((bloco, index) => ({ ...bloco, ordem: index + 1, updated_at: new Date().toISOString() }));

      reordenarBlocosCanonicosPersistidos(
        ativo.id,
        blocosReordenados.map((bloco) => bloco.id)
      ).catch((error) => {
        console.error('Falha ao reordenar blocos canônicos após remoção.', error);
      });

      return {
        ...ativo,
        blocos_canonicos: blocosReordenados,
        updated_at: new Date().toISOString()
      };
    });

    removerBlocoCanonicoPersistido(blocoId).catch((error) => {
      console.error('Falha ao remover bloco canônico persistido.', error);
    });

    const descricaoEvento = 'Bloco canônico removido durante manutenção controlada.';
    if (
      !deveRegistrarEventoCanonico({
        ativo: ativoCanonicoSelecionado,
        tipoDeEvento: 'bloco_canonico_removido',
        descricao: descricaoEvento,
        blocoCanonicoId: blocoId
      })
    ) {
      return;
    }

    registrarEventoManutencaoCanonicaPersistido({
      ativo_canonico_id: ativoCanonicoSelecionado.id,
      bloco_canonico_id: blocoId,
      tipo_de_evento: 'bloco_canonico_removido',
      descricao: descricaoEvento
    })
      .then((evento) => {
        atualizarCanonicoLocal(ativoCanonicoSelecionado.id, (ativo) => ({
          ...ativo,
          eventos_manutencao: [evento, ...(ativo.eventos_manutencao ?? [])]
        }));
      })
      .catch((error) => {
        console.error('Falha ao registrar evento de remoção de bloco canônico.', error);
      });
  };

  const handleMoverBlocoCanonico = (blocoId: string, direcao: 'cima' | 'baixo') => {
    if (!ativoCanonicoSelecionado) return;

    atualizarCanonicoLocal(ativoCanonicoSelecionado.id, (ativo) => {
      const blocosOrdenados = [...(ativo.blocos_canonicos ?? [])].sort((a, b) => a.ordem - b.ordem);
      const indexAtual = blocosOrdenados.findIndex((bloco) => bloco.id === blocoId);
      if (indexAtual < 0) return ativo;

      const alvo = direcao === 'cima' ? indexAtual - 1 : indexAtual + 1;
      if (alvo < 0 || alvo >= blocosOrdenados.length) return ativo;

      const copia = [...blocosOrdenados];
      const [item] = copia.splice(indexAtual, 1);
      copia.splice(alvo, 0, item);

      const blocosReordenados = copia.map((bloco, index) => ({
        ...bloco,
        ordem: index + 1,
        updated_at: new Date().toISOString()
      }));

      reordenarBlocosCanonicosPersistidos(
        ativo.id,
        blocosReordenados.map((bloco) => bloco.id)
      ).catch((error) => {
        console.error('Falha ao persistir reordenação de blocos canônicos.', error);
      });

      return {
        ...ativo,
        blocos_canonicos: blocosReordenados,
        updated_at: new Date().toISOString()
      };
    });
  };

  const handleCriarBlocoCanonicoFromOrigem = async (origemBlocoId: string) => {
    if (!ativoCanonicoSelecionado) return;
    const blocoOrigem = blocosOrigemCanonicoEdicao.find((bloco) => bloco.id === origemBlocoId);
    if (!blocoOrigem) return;

    try {
      const novoBloco = await criarBlocoCanonicoPersistido(ativoCanonicoSelecionado.id, {
        bloco_origem_estruturacao_id: blocoOrigem.id,
        tipo_de_bloco: blocoOrigem.tipo_de_bloco as AtivoCanonicoBlocoTipo,
        titulo: blocoOrigem.titulo,
        conteudo: blocoOrigem.conteudo,
        status_do_bloco: blocoOrigem.status_do_bloco
      });

      atualizarCanonicoLocal(ativoCanonicoSelecionado.id, (ativo) => ({
        ...ativo,
        blocos_canonicos: [...(ativo.blocos_canonicos ?? []), novoBloco].sort((a, b) => a.ordem - b.ordem),
        updated_at: new Date().toISOString()
      }));

      const evento = await registrarEventoManutencaoCanonicaPersistido({
        ativo_canonico_id: ativoCanonicoSelecionado.id,
        bloco_canonico_id: novoBloco.id,
        tipo_de_evento: 'bloco_canonico_criado',
        descricao: 'Novo bloco canônico criado a partir de bloco de origem estruturado.'
      });

      atualizarCanonicoLocal(ativoCanonicoSelecionado.id, (ativo) => ({
        ...ativo,
        eventos_manutencao: [evento, ...(ativo.eventos_manutencao ?? [])]
      }));
    } catch (error) {
      console.error('Falha ao criar bloco canônico adicional a partir da origem.', error);
    }
  };

  const handleRegistrarVersaoCanonica = async (input: {
    numero_versao: string;
    resumo_da_versao: string;
    titulo?: string;
    status_da_versao: AtivoCanonicoVersaoStatus;
  }) => {
    if (!ativoCanonicoSelecionado) return;

    try {
      const versao = await criarVersaoCanonicaPersistida({
        ativo_canonico_id: ativoCanonicoSelecionado.id,
        numero_versao: input.numero_versao,
        titulo: input.titulo,
        resumo_da_versao: input.resumo_da_versao,
        status_da_versao: input.status_da_versao,
        publicada_em: new Date().toISOString(),
        snapshot: criarSnapshotCanonicoFromAtivo(ativoCanonicoSelecionado)
      });

      const evento = await registrarEventoManutencaoCanonicaPersistido({
        ativo_canonico_id: ativoCanonicoSelecionado.id,
        tipo_de_evento: 'versao_canonica_criada',
        descricao: `Versão ${versao.numero_versao} registrada com status ${versao.status_da_versao}.`
      });

      atualizarCanonicoLocal(ativoCanonicoSelecionado.id, (ativo) => ({
        ...ativo,
        versao_atual: versao.numero_versao,
        versoes_canonicas: [versao, ...(ativo.versoes_canonicas ?? []).filter((item) => item.id !== versao.id)],
        eventos_manutencao: [evento, ...(ativo.eventos_manutencao ?? [])],
        updated_at: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Falha ao registrar versão canônica.', error);
    }
  };

  const handleGerarSnapshotsFaltantes = async () => {
    if (!ativoCanonicoSelecionado) return;

    try {
      const resultado = await executarBackfillSnapshotsCanonicosDoAtivo(ativoCanonicoSelecionado);
      if (!resultado.versoes_atualizadas.length) return;

      atualizarCanonicoLocal(ativoCanonicoSelecionado.id, (ativo) => ({
        ...ativo,
        versoes_canonicas: (ativo.versoes_canonicas ?? []).map(
          (versao) => resultado.versoes_atualizadas.find((item) => item.id === versao.id) ?? versao
        )
      }));
    } catch (error) {
      console.error('Falha ao executar backfill de snapshots canônicos.', error);
    }
  };

  const handleRevalidarSnapshotCanonico = async (versao: AtivoCanonico['versoes_canonicas'][number]) => {
    if (!ativoCanonicoSelecionado || !versao) return;

    try {
      const resultado = await revalidarSnapshotVersaoCanonica(versao);
      atualizarCanonicoLocal(ativoCanonicoSelecionado.id, (ativo) => ({
        ...ativo,
        versoes_canonicas: (ativo.versoes_canonicas ?? []).map((item) =>
          item.id === versao.id ? resultado.versao_atualizada : item
        )
      }));
    } catch (error) {
      console.error('Falha ao revalidar snapshot da versão canônica.', error);
    }
  };

  const handleRegenerarSnapshotCanonico = async (versao: AtivoCanonico['versoes_canonicas'][number]) => {
    if (!ativoCanonicoSelecionado || !versao) return;

    try {
      const resultado = await regenerarSnapshotVersaoCanonicaControlado({
        ativo: ativoCanonicoSelecionado,
        versao
      });

      atualizarCanonicoLocal(ativoCanonicoSelecionado.id, (ativo) => ({
        ...ativo,
        versoes_canonicas: (ativo.versoes_canonicas ?? []).map((item) =>
          item.id === versao.id ? resultado.versao_atualizada : item
        )
      }));
    } catch (error) {
      console.error('Falha ao regenerar snapshot canônico de forma controlada.', error);
    }
  };

  const handleAbrirCanonicoPromovido = (canonicoId: string) => {
    const canonico = ativosCanonicosPersistidos.find((item) => item.id === canonicoId);
    if (!canonico) {
      navegar('/metodologias/catalogo');
      return;
    }
    navegar(`/metodologias/ativos/${canonico.slug}`);
  };

  const handlePromoverAssistido = async () => {
    if (!ativoEmEstruturacaoLocal) return;

    setPromovendoAssistido(true);
    try {
      const resultado = await promoverAtivoEmEstruturacaoParaCanonico({ ativo: ativoEmEstruturacaoLocal });
      setUltimoAtivoCanonicoPromovido(resultado.ativo_canonico);
      setAtivosCanonicosPersistidos((atual) => [resultado.ativo_canonico, ...atual.filter((item) => item.id !== resultado.ativo_canonico.id)]);
      setEntradasBrutasLocal((atual) =>
        atual.map((entrada) =>
          entrada.id === resultado.ativo_canonico.origem_entrada_bruta_id
            ? { ...entrada, status_de_estruturacao: 'convertido_em_ativo', updated_at: new Date().toISOString() }
            : entrada
        )
      );
    } catch (error) {
      console.error('Falha na promoção assistida para ativo canônico.', error);
    } finally {
      setPromovendoAssistido(false);
    }
  };

  const handleAbrirEdicaoGuiada = async () => {
    if (!conversaoAssistida) return;

    try {
      const persistido = await salvarAtivoEmEstruturacaoFromPreview(conversaoAssistida.ativo_preview, 'edicao_guiada');
      setAtivoEmEstruturacaoLocal(persistido);
      setEntradasBrutasLocal((atual) =>
        atual.map((entrada) =>
          entrada.id === conversaoAssistida.ativo_preview.origem_entrada_id
            ? { ...entrada, status_de_estruturacao: 'estruturado_parcialmente', updated_at: new Date().toISOString() }
            : entrada
        )
      );
    } catch (error) {
      console.error('Falha ao salvar ativo em estruturação a partir do preview.', error);
    }

    const slug = slugRota ?? ativoSelecionado?.slug ?? 'edicao-em-curso';
    navegar(`/metodologias/ativos/${slug}/editar`);
  };

  React.useEffect(() => {
    if (!rotaInterna.endsWith('/editar') || !ativoCanonicoSelecionado) {
      setBlocosOrigemCanonicoEdicao([]);
      return;
    }

    let ativo = true;

    const carregarBlocosOrigemCanonica = async () => {
      try {
        const blocos = await listarBlocosInternosDoAtivoPersistido(ativoCanonicoSelecionado.origem_ativo_em_estruturacao_id);
        if (!ativo) return;
        setBlocosOrigemCanonicoEdicao(blocos);
      } catch (error) {
        console.error('Falha ao carregar blocos de origem do canônico em edição.', error);
        if (ativo) setBlocosOrigemCanonicoEdicao([]);
      }
    };

    carregarBlocosOrigemCanonica();
    return () => {
      ativo = false;
    };
  }, [rotaInterna, ativoCanonicoSelecionado]);

  React.useEffect(() => {
    if (!rotaInterna.endsWith('/editar') || !ativoSelecionado) return;
    if (ativoCanonicoSelecionado) return;
    setAtivoEmEstruturacaoLocal((atual) => atual ?? criarAtivoEstruturacaoFromAtivo(ativoSelecionado));
  }, [rotaInterna, ativoSelecionado, ativoCanonicoSelecionado]);

  const tituloPagina =
    rotaInterna === '/metodologias'
      ? 'Home'
      : rotaInterna === '/metodologias/mesa'
      ? 'Mesa'
      : rotaInterna === '/metodologias/catalogo'
      ? 'Catálogo'
      : rotaInterna.endsWith('/editar')
      ? ativoCanonicoSelecionado
        ? 'Manutenção canônica'
        : 'Edição guiada'
      : 'Detalhe do ativo';

  return (
    <div className="flex-1 flex overflow-hidden bg-sagb-bg text-sagb-text font-inter">
      {/* Sidebar vertical — Padrão SagB integrado */}
      <aside className="w-64 shrink-0 bg-sagb-panel flex flex-col shadow-sm border-r border-sagb-line">
        {/* Branding / Título do módulo */}
        <div className="px-5 pt-6 pb-4 border-b border-sagb-line">
          <p className="text-[9px] uppercase tracking-[0.28em] font-black text-sagb-muted mb-1">Núcleo de Metodologias</p>
          <h2 className="text-lg font-black tracking-tight text-sagb-text">Metodologias</h2>
        </div>

        {/* Navegação interna */}
        <nav className="flex-1 overflow-auto p-3 space-y-0.5">
          {([
            { id: '/metodologias' as RotaInterna, label: 'Home', icone: '🏠' },
            { id: '/metodologias/mesa' as RotaInterna, label: 'Área de trabalho', icone: '🧭' },
            { id: '/metodologias/catalogo' as RotaInterna, label: 'Catálogo', icone: '📋' },
            { id: '/metodologias/saude' as RotaInterna, label: 'Métricas', icone: '📈' },
          ] as const).map((item) => {
            const ativo =
              item.id === '/metodologias'
                ? rotaInterna === '/metodologias'
                : rotaInterna === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navegar(item.id)}
                aria-current={ativo ? 'page' : undefined}
                aria-label={`Navegar para ${item.label}`}
                className={`w-full text-left px-3 py-2 rounded-lg text-[12px] font-semibold transition-all ${
                  ativo
                    ? 'bg-sagb-bg-2 text-sagb-text border border-sagb-line shadow-sm'
                    : 'text-sagb-muted border border-transparent hover:bg-sagb-bg-2 hover:text-sagb-text hover:border-sagb-line'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <span className="text-sm">{item.icone}</span>
                  <span>{item.label}</span>
                </span>
              </button>
            );
          })}
        </nav>

        {/* Rodapé da sidebar — Voltar ao SagB */}
        <div className="p-3 border-t border-sagb-line">
          <button
            type="button"
            onClick={onBackToSagB}
            aria-label="Voltar ao SagB"
            className="w-full text-left px-3 py-2 rounded-lg text-[11px] font-semibold tracking-wide text-sagb-muted hover:text-sagb-blue hover:bg-sagb-bg-2 transition-all border border-transparent hover:border-sagb-line"
          >
            ← Voltar ao SagB
          </button>
        </div>
      </aside>

      {/* Conteúdo principal */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="shrink-0 px-8 py-4 bg-sagb-panel/80 backdrop-blur-sm border-b border-sagb-line flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sagb-bg-2 text-sagb-muted text-[10px] font-semibold border border-sagb-line">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              SagB • Metodologias
            </span>
            <h1 className="text-xl font-black tracking-tight truncate text-sagb-text">
              {rotaInterna === '/metodologias' ? 'Núcleo de Metodologias'
                : rotaInterna === '/metodologias/mesa' ? 'Área de trabalho'
                : rotaInterna === '/metodologias/catalogo' ? 'Catálogo'
                : rotaInterna === '/metodologias/saude' ? 'Painel de métricas'
                : rotaInterna.endsWith('/editar')
                  ? ativoCanonicoSelecionado ? 'Manutenção canônica' : 'Edição guiada'
                  : 'Detalhe do ativo'}
            </h1>
          </div>
          <span className="shrink-0 text-[11px] text-sagb-muted hidden sm:block">
            <span className="font-semibold text-sagb-text">Owner:</span> Agente de Metodologias
          </span>
        </header>

        <div className="flex-1 overflow-auto p-8">
          <section className="space-y-5 max-w-[1400px]">
            {erroPersistencia && (
              <section className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
                <p className="text-[12px] font-semibold text-amber-500">Persistência em modo degradado</p>
                <p className="text-[11px] text-amber-500/90 mt-1">{erroPersistencia}</p>
              </section>
            )}
            {rotaInterna === '/metodologias' && (
              <MetodologiasHomePage
                titulo="Núcleo de Metodologias"
                subtitulo="Organize, evolua e publique metodologias com clareza"
                descricao="Visão geral simples para acompanhar documentos recebidos, rascunhos em andamento e metodologias oficiais do núcleo."
                totalAtivos={metodologiasCanonicas.length}
                totalEntradasBrutas={entradasBrutasLocal.length}
                totalAtivosOficiais={totalOficiais}
                ultimasEntradas={ultimasEntradas}
                ativosOficiaisRecentes={ativosOficiaisRecentes}
                ultimosMovimentos={ultimosMovimentos}
                onIrMesa={() => navegar('/metodologias/mesa')}
                onIrCatalogo={() => navegar('/metodologias/catalogo')}
                onIrSaude={() => navegar('/metodologias/saude')}
                onAbrirAtivo={handleAbrirAtivo}
              />
            )}

            {rotaInterna === '/metodologias/mesa' && (
              <MetodologiasMesaPage
                entradasBrutasLocal={entradasBrutasLocal}
                entradaSelecionada={entradaSelecionada}
                leituraAssistida={leituraAssistida}
                perguntasEstruturacao={perguntasEstruturacao}
                conversaoAssistida={conversaoAssistida}
                ativoEmEstruturacaoLocal={ativoEmEstruturacaoLocal}
                totalBrutas={totalBrutas}
                totalEmEstruturacao={totalEmEstruturacao}
                totalConsolidados={metodologiasCanonicas.length}
                novoTitulo={novoTitulo}
                novoTipoEntrada={novoTipoEntrada}
                novaOrigem={novaOrigem}
                novoConteudoBruto={novoConteudoBruto}
                arquivosBrutos={arquivosBrutos}
                tiposEntradaDisponiveis={TIPOS_ENTRADA_DISPONIVEIS}
                onNovoTituloChange={setNovoTitulo}
                onNovoTipoEntradaChange={setNovoTipoEntrada}
                onNovaOrigemChange={setNovaOrigem}
                onNovoConteudoBrutoChange={setNovoConteudoBruto}
                onArquivosBrutosChange={(files) => setArquivosBrutos(files)}
                onRegistrarEntradaBruta={handleRegistrarEntradaBruta}
                onSelecionarEntrada={handleSelecionarEntrada}
                onDefinirModoConversao={setModoConversao}
                modoConversao={modoConversao}
                onAbrirEdicaoGuiada={handleAbrirEdicaoGuiada}
                indicadoresOperacionais={leituraOperacionalMesa.indicadores}
                itensOperacionais={itensOrdenadosMesa}
                gruposOperacionais={gruposOperacionaisMesa}
                filtrosOperacionais={filtrosOperacionaisMesa}
                ordenacaoOperacional={ordenacaoOperacionalMesa}
                agrupamentoOperacional={agrupamentoOperacionalMesa}
                onAtualizarFiltrosOperacionais={setFiltrosOperacionaisMesa}
                onAlterarOrdenacaoOperacional={setOrdenacaoOperacionalMesa}
                onAlterarAgrupamentoOperacional={setAgrupamentoOperacionalMesa}
                onLimparFiltrosOperacionais={() => setFiltrosOperacionaisMesa(criarFiltrosOperacionaisMesaIniciais())}
              />
            )}

            {rotaInterna === '/metodologias/mesa' && carregandoPersistencia && (
              <section className="rounded-2xl border border-sagb-line bg-sagb-panel p-4 text-[12px] text-sagb-muted">
                Carregando dados da área de trabalho...
              </section>
            )}

            {rotaInterna === '/metodologias/saude' && (
              <MetodologiasSaudePage
                indicadores={indicadoresNucleo}
                onVoltar={() => navegar('/metodologias')}
              />
            )}

            {rotaInterna === '/metodologias/catalogo' && (
                <MetodologiasCatalogoPage ativos={metodologiasCanonicas} onAbrirAtivo={handleAbrirAtivo} />
            )}

            {rotaInterna.startsWith('/metodologias/ativos/') && !rotaInterna.endsWith('/editar') && ativoSelecionado && (
              <MetodologiaAtivoPage
                metodologia={ativoSelecionado}
                ativosContexto={metodologiasCanonicas}
                onVoltarCatalogo={() => navegar('/metodologias/catalogo')}
                onEditarAtivo={() => navegar(`/metodologias/ativos/${ativoSelecionado.slug}/editar`)}
                onAbrirAtivoRelacionado={handleAbrirAtivo}
                modoEdicaoLabel={ativoCanonicoSelecionado ? 'Manutenção canônica' : 'Edição guiada'}
              />
            )}

            {rotaInterna.endsWith('/editar') && ativoCanonicoSelecionado && (
              <MetodologiaCanonicoEditarPage
                ativo={ativoCanonicoSelecionado}
                blocosOrigemDisponiveis={blocosOrigemDisponiveisParaCanonico}
                statusEditoriaisDisponiveis={STATUS_EDITORIAIS_DISPONIVEIS}
                maturidadesDisponiveis={MATURIDADES_DISPONIVEIS}
                estadosGovernancaDisponiveis={ESTADOS_GOVERNANCA_DISPONIVEIS}
                tiposDisponiveis={taxonomiaOficial.map((item) => ({ tipo: item.tipo, label: item.label }))}
                tiposBlocoDisponiveis={ATIVO_EM_ESTRUTURACAO_BLOCO_TIPOS.map((tipo) => ({
                  tipo,
                  label: TIPO_BLOCO_LABEL[tipo]
                }))}
                onAtualizarAtivo={handleAtualizarAtivoCanonico}
                onAtualizarBloco={handleAtualizarBlocoCanonico}
                onRemoverBloco={handleRemoverBlocoCanonico}
                onMoverBloco={handleMoverBlocoCanonico}
                onCriarBlocoFromOrigem={handleCriarBlocoCanonicoFromOrigem}
                onRegistrarVersaoCanonica={handleRegistrarVersaoCanonica}
                statusSnapshots={statusSnapshotsCanonicos}
                onGerarSnapshotsFaltantes={handleGerarSnapshotsFaltantes}
                onRevalidarSnapshot={handleRevalidarSnapshotCanonico}
                onRegenerarSnapshot={handleRegenerarSnapshotCanonico}
                onVoltarAtivo={() => navegar(`/metodologias/ativos/${ativoCanonicoSelecionado.slug}`)}
              />
            )}

            {rotaInterna.endsWith('/editar') && !ativoCanonicoSelecionado && ativoEmEstruturacaoLocal && diagnosticoEstruturacao && (
              <MetodologiaAtivoEditarPage
                ativo={ativoEmEstruturacaoLocal}
                diagnostico={diagnosticoEstruturacao}
                statusEditoriaisDisponiveis={STATUS_EDITORIAIS_DISPONIVEIS}
                maturidadesDisponiveis={MATURIDADES_DISPONIVEIS}
                estadosGovernancaDisponiveis={ESTADOS_GOVERNANCA_DISPONIVEIS}
                tiposDisponiveis={taxonomiaOficial.map((item) => ({ tipo: item.tipo, label: item.label }))}
                tiposBlocoDisponiveis={ATIVO_EM_ESTRUTURACAO_BLOCO_TIPOS.map((tipo) => ({
                  tipo,
                  label: TIPO_BLOCO_LABEL[tipo]
                }))}
                tiposRelacaoDisponiveis={ATIVO_METODOLOGICO_RELACAO_TIPOS}
                ativosCanonicosRelacionaveis={ativosCanonicosPersistidos
                  .filter((item) => item.origem_ativo_em_estruturacao_id !== ativoEmEstruturacaoLocal.id_estruturacao)
                  .map((item) => ({ id: item.id, nome: item.nome, slug: item.slug }))}
                onAdicionarBlocoInterno={handleAdicionarBlocoInterno}
                onAtualizarBlocoInterno={handleAtualizarBlocoInterno}
                onRemoverBlocoInterno={handleRemoverBlocoInterno}
                onMoverBlocoInterno={handleMoverBlocoInterno}
                onAdicionarRelacaoEstruturacao={handleAdicionarRelacaoEstruturacao}
                onRemoverRelacaoEstruturacao={handleRemoverRelacaoEstruturacao}
                onAtualizarAtivo={handleAtualizarAtivoEstruturacao}
                diagnosticoPromocao={
                  diagnosticoPromocao ?? {
                    pronto_para_promocao: false,
                    total_criterios: 0,
                    criterios_atendidos: 0,
                    criterios_pendentes: 0,
                    percentual_prontidao: 0,
                    criterios: [],
                    pendencias: [],
                    recomendacao: ''
                  }
                }
                previewPromocao={
                  previewPromocao ?? {
                    id_preview_promocao: '',
                    slug_sugerido: '',
                    nome: '',
                    resumo: '',
                    definicao: '',
                    objetivo: '',
                    tipo_de_ativo: ativoEmEstruturacaoLocal.tipo_de_ativo,
                    status_editorial: 'em_revisao',
                    maturidade_pratica: ativoEmEstruturacaoLocal.maturidade_pratica,
                    governanca_estado: ativoEmEstruturacaoLocal.governanca.estado,
                    versao_atual: '1.0.0',
                    origem_entrada_bruta_id: ativoEmEstruturacaoLocal.origem_entrada_id,
                    origem_ativo_em_estruturacao_id: ativoEmEstruturacaoLocal.id_estruturacao
                  }
                }
                promovendo={promovendoAssistido}
                ultimoAtivoCanonicoPromovido={ultimoAtivoCanonicoPromovido}
                onPromoverAssistido={handlePromoverAssistido}
                onAbrirCanonicoPromovido={handleAbrirCanonicoPromovido}
                onVoltarMesa={() => navegar('/metodologias/mesa')}
              />
            )}

            {rotaInterna.startsWith('/metodologias/ativos/') && !ativoSelecionado && (
              <section className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5">
                <p className="text-[12px] font-bold text-rose-500">Ativo não encontrado para a rota solicitada.</p>
                <button
                  type="button"
                  onClick={() => navegar('/metodologias/catalogo')}
                  className="mt-3 px-3 py-1.5 rounded-lg bg-rose-500 text-white text-[11px] font-black uppercase tracking-wide hover:opacity-90 transition"
                >
                  Voltar para catálogo
                </button>
              </section>
            )}
        </section>
        </div>
      </main>
    </div>
  );
};

export default MetodologiasHubPage;
