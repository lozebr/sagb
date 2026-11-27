import { useSagbSection } from '../src/core/navigation/useSagbHistory';
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { BackIcon, CloudUploadIcon, SearchIcon } from './Icon';
import { CidAsset, CidAssetFile, CidChunk, CidOutput, CidProcessingJob, UserProfile, Venture } from '../types';
import { addDoc, collection, db, doc, onSnapshot, orderBy, query, updateDoc, where } from '../services/supabase';
import { buildCidStoragePath, uploadBlobToSupabaseStorage } from '../services/storage';
import CidLocalExplorer from '../src/modules/cid/components/CidLocalExplorer';
import CidDashboard from '../src/modules/cid/components/CidDashboard';
import CidBoundaryBanner from '../src/modules/cid/components/CidBoundaryBanner';
import CidProcessingQueue from '../src/modules/cid/components/CidProcessingQueue';
import { CID_ALLOWED_ACTIONS } from '../src/modules/cid/cid-contract';

// ─── TYPES ──────────────────────────────────────────────
type CidViewMode = 'dashboard' | 'explorer' | 'detail' | 'processing-list' | 'local';
type Material = 'pdf' | 'doc' | 'docx' | 'txt' | 'spreadsheet' | 'image' | 'audio' | 'video' | 'other';
type DesiredAction = 'store_only' | 'store_transcribe' | 'store_summarize' | 'store_transcribe_summarize';
type SidebarGroup = 'all' | 'recent' | 'processing' | 'completed' | 'error' | 'supabase' | 'local' | 'local_00_sagb' | 'local_01_empresasb' | 'local_02_ventures' | 'local_03_metodos' | 'local_04_curadoria' | 'pdf' | 'docx' | 'txt' | 'audio' | 'video' | 'image';

type UploadFormState = {
  title: string;
  materialType: Material;
  ventureId: string;
  area: string;
  project: string;
  sensitivity: string;
  tags: string;
  ownerName: string;
  language: string;
  desiredAction: DesiredAction;
  isConsultable: boolean;
};

interface CIDViewProps {
  workspaceId?: string | null;
  ownerUserId?: string | null;
  userProfile?: UserProfile | null;
  ventures?: Venture[];
  onBack?: () => void;
}

// ─── CONSTANTS & HELPERS ────────────────────────────────
const SESSION_STORAGE_KEY = 'sagb_supabase_session_v1';
const UUID_LIKE_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CID_STORAGE_LIMIT_BYTES = 2147483648;
const INLINE_PREVIEW_MAX_BYTES = 2000000;

const toDate = (value: any): Date => {
  if (value instanceof Date) return value;
  const parsed = new Date(value || Date.now());
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

const fmt = (value: any) => toDate(value).toLocaleString('pt-BR');

const formatBytes = (value?: number | null) => {
  if (value === undefined || value === null || !Number.isFinite(value)) return '-';
  if (value < 1024) return `${value} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let size = value / 1024;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) { size /= 1024; unitIndex += 1; }
  return `${size.toLocaleString('pt-BR', { maximumFractionDigits: size >= 100 ? 0 : 1 })} ${units[unitIndex]}`;
};

const resolveAssetSizeBytes = (asset?: CidAsset | null, files: CidAssetFile[] = []) => {
  const fileSize = files.find((file) => Number(file.sizeBytes || 0) > 0)?.sizeBytes;
  if (fileSize !== undefined && fileSize !== null) return Number(fileSize);
  const payloadSize = asset?.payload?.originalSizeBytes;
  if (payloadSize !== undefined && payloadSize !== null && Number.isFinite(Number(payloadSize))) return Number(payloadSize);
  return null;
};

const CID_LABELS: Record<string, string> = {
  assets: 'Ativos', jobs: 'Processos', chunks: 'Partes', outputs: 'Saidas',
  completed: 'Concluido', completed_warning: 'Concluido com aviso', ready: 'Pronto',
  error: 'Erro', processing: 'Processando', fragmenting: 'Fragmentando',
  transcribing: 'Transcrevendo', summarizing: 'Resumindo', consolidating: 'Consolidando',
  queued: 'Na fila', received: 'Recebido', paused: 'Pausado', cancelled: 'Cancelado',
  extracted_text: 'Texto extraido', transcription: 'Transcricao',
  summary_short: 'Resumo curto', summary_long: 'Resumo longo',
  consolidation: 'Consolidacao', keywords: 'Palavras-chave',
  store_only: 'Só armazenar', store_transcribe: 'Armazenar + transcrever',
  store_summarize: 'Armazenar + resumir', store_transcribe_summarize: 'Armazenar + transcrever + resumir',
  store_consolidate: 'Armazenar + consolidar'
};

const toLabel = (value: any) => {
  const raw = String(value || '').replace(/[_-]+/g, ' ').trim().toLowerCase();
  if (CID_LABELS[raw]) return CID_LABELS[raw];
  return raw ? raw[0].toUpperCase() + raw.slice(1) : '-';
};

const statusBadge = (value: any) => {
  const v = String(value || '').toLowerCase();
  if (v === 'completed' || v === 'ready') return 'bg-emerald-100 text-emerald-700';
  if (v === 'completed_warning') return 'bg-amber-100 text-amber-700';
  if (v === 'error') return 'bg-red-100 text-red-700';
  if (['processing','fragmenting','transcribing','summarizing','consolidating'].includes(v)) return 'bg-blue-100 text-blue-700';
  return 'bg-gray-100 text-gray-600';
};

const detectMaterial = (file: File): Material => {
  const ext = String(file.name.split('.').pop() || '').toLowerCase();
  const mime = String(file.type || '').toLowerCase();
  if (mime.includes('pdf') || ext === 'pdf') return 'pdf';
  if (ext === 'doc') return 'doc';
  if (ext === 'docx') return 'docx';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('image/')) return 'image';
  if (mime.includes('spreadsheet') || ['csv','xls','xlsx'].includes(ext)) return 'spreadsheet';
  if (mime.startsWith('text/') || ['txt','md','json','xml','yml','yaml','csv'].includes(ext)) return 'txt';
  return 'other';
};

const readAsDataUrl = (file: File): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result || ''));
  reader.onerror = () => reject(new Error('Falha ao ler arquivo.'));
  reader.readAsDataURL(file);
});

const isUuidLike = (value: any) => typeof value === 'string' && UUID_LIKE_RE.test(value.trim());

const materialIcon: Record<string, string> = {
  pdf: '📄', doc: '📝', docx: '📝', txt: '📃',
  spreadsheet: '📊', image: '🖼', audio: '🎵', video: '🎬', other: '📁'
};

const initialForm = (userProfile?: UserProfile | null): UploadFormState => ({
  title: '', materialType: 'other', ventureId: '', area: '', project: '',
  sensitivity: 'internal', tags: '', ownerName: userProfile?.name || '',
  language: 'pt-BR', desiredAction: 'store_only', isConsultable: false
});

// ─── SIDEBAR DEFINITION ─────────────────────────────────
interface SidebarItem {
  key: SidebarGroup;
  label: string;
  icon: string;
  group: 'acervo' | 'origem' | 'tipo' | 'local-roots';
  count?: (assets: CidAsset[]) => number;
  filter?: (a: CidAsset) => boolean;
  /** Se true, ao clicar abre o explorador local em vez de filtrar assets */
  isLocalRoot?: boolean;
}

const sidebarItems: SidebarItem[] = [
  // Acervo
  { key: 'dashboard', label: 'Dashboard', icon: '📊', group: 'acervo', count: undefined, filter: undefined },
  { key: 'all', label: 'Todos os Ativos', icon: '📦', group: 'acervo', count: (a) => a.length, filter: () => true },
  { key: 'recent', label: 'Recentes', icon: '🕐', group: 'acervo', count: (a) => a.filter((x) => Date.now() - toDate(x.createdAt).getTime() < 86400000 * 7).length, filter: (a) => Date.now() - toDate(a.createdAt).getTime() < 86400000 * 7 },
  { key: 'processing', label: 'Processando', icon: '⚙️', group: 'acervo', count: (a) => a.filter((x) => ['queued','processing','fragmenting','transcribing','summarizing','consolidating'].includes(String(x.status||'').toLowerCase())).length, filter: (a) => ['queued','processing','fragmenting','transcribing','summarizing','consolidating'].includes(String(a.status||'').toLowerCase()) },
  { key: 'completed', label: 'Concluídos', icon: '✅', group: 'acervo', count: (a) => a.filter((x) => ['completed','completed_warning'].includes(String(x.status||'').toLowerCase())).length, filter: (a) => ['completed','completed_warning'].includes(String(a.status||'').toLowerCase()) },
  { key: 'error', label: 'Com Erro', icon: '❌', group: 'acervo', count: (a) => a.filter((x) => String(x.status||'').toLowerCase() === 'error').length, filter: (a) => String(a.status||'').toLowerCase() === 'error' },
  // Origem
  { key: 'supabase', label: 'Supabase', icon: '☁️', group: 'origem', count: (a) => a.filter((x) => String(x.sourceKind||'') === 'upload').length, filter: (a) => String(a.sourceKind||'') === 'upload' },
  { key: 'local', label: 'Importados Locais', icon: '💻', group: 'origem', count: (a) => a.filter((x) => String(x.sourceKind||'') === 'local' || String(x.sourceKind||'') === 'imported').length, filter: (a) => String(a.sourceKind||'') === 'local' || String(a.sourceKind||'') === 'imported' },
  // Local - Raízes do sistema (abrem explorador local)
  { key: 'local_', label: 'Dashboard Local', icon: '📊', group: 'local-roots', isLocalRoot: true },
  { key: 'local_00_sagb', label: '00_sagb', icon: '🧠', group: 'local-roots', isLocalRoot: true },
  { key: 'local_01_empresasb', label: '01_empresasb', icon: '🏢', group: 'local-roots', isLocalRoot: true },
  { key: 'local_02_ventures', label: '02_ventures', icon: '🚀', group: 'local-roots', isLocalRoot: true },
  { key: 'local_03_metodos', label: '03_metodos', icon: '📋', group: 'local-roots', isLocalRoot: true },
  { key: 'local_04_curadoria', label: '04_curadoria', icon: '🎯', group: 'local-roots', isLocalRoot: true },
  // Tipo
  { key: 'pdf', label: 'PDFs', icon: '📄', group: 'tipo', count: (a) => a.filter((x) => String(x.materialType||'').toLowerCase() === 'pdf').length, filter: (a) => String(a.materialType||'').toLowerCase() === 'pdf' },
  { key: 'docx', label: 'Documentos', icon: '📝', group: 'tipo', count: (a) => a.filter((x) => ['doc','docx'].includes(String(x.materialType||'').toLowerCase())).length, filter: (a) => ['doc','docx'].includes(String(a.materialType||'').toLowerCase()) },
  { key: 'txt', label: 'Textos', icon: '📃', group: 'tipo', count: (a) => a.filter((x) => String(x.materialType||'').toLowerCase() === 'txt').length, filter: (a) => String(a.materialType||'').toLowerCase() === 'txt' },
  { key: 'audio', label: 'Áudios', icon: '🎵', group: 'tipo', count: (a) => a.filter((x) => String(x.materialType||'').toLowerCase() === 'audio').length, filter: (a) => String(a.materialType||'').toLowerCase() === 'audio' },
  { key: 'video', label: 'Vídeos', icon: '🎬', group: 'tipo', count: (a) => a.filter((x) => String(x.materialType||'').toLowerCase() === 'video').length, filter: (a) => String(a.materialType||'').toLowerCase() === 'video' },
  { key: 'image', label: 'Imagens', icon: '🖼', group: 'tipo', count: (a) => a.filter((x) => String(x.materialType||'').toLowerCase() === 'image').length, filter: (a) => String(a.materialType||'').toLowerCase() === 'image' },
];

const groupLabels: Record<string, string> = { acervo: 'Acervo', origem: 'Origem', tipo: 'Tipo', 'local-roots': 'Sistema de Arquivos' };

// ─── CIDView ────────────────────────────────────────────
const CIDView: React.FC<CIDViewProps> = ({ workspaceId, ownerUserId, userProfile, ventures = [], onBack }) => {
  const scopedWorkspaceId = workspaceId?.trim() || userProfile?.workspaceId?.trim() || '';

  // View state
  const [viewMode, setViewMode] = useSagbSection<CidViewMode>('cid','cidView','dashboard');
  const [sidebarFilter, setSidebarFilter] = useSagbSection<SidebarGroup>('cid','cidGroup','all');
  const [localRootName, setLocalRootName] = useState<string | null>(null);
  const [showUploadDrawer, setShowUploadDrawer] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Upload form
  const [form, setForm] = useState<UploadFormState>(() => initialForm(userProfile));
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');

  // Data
  const [assets, setAssets] = useState<CidAsset[]>([]);
  const [assetFiles, setAssetFiles] = useState<CidAssetFile[]>([]);
  const [jobs, setJobs] = useState<CidProcessingJob[]>([]);
  const [chunks, setChunks] = useState<CidChunk[]>([]);
  const [outputs, setOutputs] = useState<CidOutput[]>([]);
  const [cidTags, setCidTags] = useState<Array<{ id: string; name: string }>>([]);

  // Seleção operacional de ativos (sem geração de derivados no CID)
  const [selectedAssetsIds, setSelectedAssetsIds] = useState<Set<string>>(new Set());

  // Selection
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Sidebar/panel toggles
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [rightPanelVisible, setRightPanelVisible] = useState(true);

  // Sempre que o módulo CID entra/monta para um workspace, a landing oficial é o Dashboard Geral.
  // Isto evita estado antigo preservado por HMR/cache ou retorno ao módulo em subvisões internas.
  useEffect(() => {
    setViewMode('dashboard');
    setSidebarFilter('all');
    setLocalRootName(null);
    setSelectedAssetId('');
    setSelectedAssetsIds(new Set());
    setSearchTerm('');
    setDebouncedSearch('');
  }, [scopedWorkspaceId]);

  // ─── DATA FETCHING ────────────────────────────────────
  useEffect(() => {
    setForm((prev) => ({ ...prev, ownerName: prev.ownerName || userProfile?.name || '' }));
  }, [userProfile]);

  useEffect(() => {
    if (!selectedFiles.length) return;
    if (selectedFiles.length === 1) {
      const file = selectedFiles[0];
      setForm((prev) => ({ ...prev, title: prev.title || file.name.replace(/\.[^/.]+$/, ''), materialType: detectMaterial(file) }));
    } else {
      setForm((prev) => ({ ...prev, materialType: 'other' }));
    }
  }, [selectedFiles]);

  useEffect(() => {
    const unsubs: Array<() => void> = [];
    if (!scopedWorkspaceId) return;

    const snapToList = <T,>(setter: React.Dispatch<React.SetStateAction<T[]>>) =>
      (snap: any) => setter(snap.docs.map((d: any) => ({ id: d.id, ...(d.data() as T) })));

    unsubs.push(onSnapshot(
      query(collection(db, 'cid_assets'), where('workspaceId', '==', scopedWorkspaceId), orderBy('createdAt', 'desc')),
      snapToList<CidAsset>(setAssets)
    ));
    unsubs.push(onSnapshot(
      query(collection(db, 'cid_asset_files'), where('workspaceId', '==', scopedWorkspaceId), orderBy('createdAt', 'desc')),
      snapToList<CidAssetFile>(setAssetFiles)
    ));
    unsubs.push(onSnapshot(
      query(collection(db, 'cid_processing_jobs'), where('workspaceId', '==', scopedWorkspaceId), orderBy('createdAt', 'desc')),
      snapToList<CidProcessingJob>(setJobs)
    ));
    unsubs.push(onSnapshot(
      query(collection(db, 'cid_chunks'), where('workspaceId', '==', scopedWorkspaceId), orderBy('createdAt', 'desc')),
      snapToList<CidChunk>(setChunks)
    ));
    unsubs.push(onSnapshot(
      query(collection(db, 'cid_outputs'), where('workspaceId', '==', scopedWorkspaceId), orderBy('createdAt', 'desc')),
      snapToList<CidOutput>(setOutputs)
    ));
    unsubs.push(onSnapshot(
      query(collection(db, 'cid_tags'), where('workspaceId', '==', scopedWorkspaceId), orderBy('name', 'asc')),
      (snap: any) => setCidTags(snap.docs.map((d: any) => ({ id: d.id, name: String((d.data() as any).name || '') })))
    ));
    return () => unsubs.forEach((unsub) => unsub());
  }, [scopedWorkspaceId]);

  useEffect(() => {
    if (!assets.length) { setSelectedAssetId(''); setSelectedAssetsIds(new Set()); return; }
    if (!selectedAssetId || !assets.some((a) => a.id === selectedAssetId)) {
      setSelectedAssetId(assets[0].id);
    }
  }, [assets, selectedAssetId]);

  // Debounce + search
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    if (debouncedSearch.trim().length < 3) { setSearchResults([]); return; }
    const performSearch = async () => {
      setIsSearching(true);
      try {
        const res = await fetch('/.netlify/functions/cid-search', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ searchText: debouncedSearch, workspaceId: scopedWorkspaceId }),
        });
        if (!res.ok) throw new Error('Busca falhou');
        const result = await res.json();
        setSearchResults(result.data || []);
      } catch { setSearchResults([]); } finally { setIsSearching(false); }
    };
    performSearch();
  }, [debouncedSearch, scopedWorkspaceId]);

  // ─── MEMOS ────────────────────────────────────────────
  const activeSidebarDef = useMemo(() => sidebarItems.find((s) => s.key === sidebarFilter)!, [sidebarFilter]);

  const filteredAssets = useMemo(() => assets.filter(activeSidebarDef.filter), [assets, activeSidebarDef]);

  const displayedAssets = useMemo(() => {
    if (debouncedSearch.trim().length >= 3) {
      const searchIds = new Set(searchResults.map((r: any) => r.assetId || r.id));
      if (searchIds.size > 0) return filteredAssets.filter((a) => searchIds.has(a.id));
    }
    return filteredAssets;
  }, [filteredAssets, searchResults, debouncedSearch]);

  const selectedAsset = useMemo(() => assets.find((a) => a.id === selectedAssetId) || null, [assets, selectedAssetId]);
  const selectedAssetFiles = useMemo(() => assetFiles.filter((x) => x.assetId === selectedAssetId), [assetFiles, selectedAssetId]);
  const assetFileMap = useMemo(() => {
    const map = new Map<string, CidAssetFile[]>();
    assetFiles.forEach((file) => {
      const cur = map.get(file.assetId) || [];
      cur.push(file); map.set(file.assetId, cur);
    });
    return map;
  }, [assetFiles]);

  const selectedChunks = useMemo(
    () => chunks.filter((x) => x.assetId === selectedAssetId).sort((a, b) => (a.chunkIndex || 0) - (b.chunkIndex || 0)),
    [chunks, selectedAssetId]
  );
  const selectedOutputs = useMemo(() => outputs.filter((x) => x.assetId === selectedAssetId), [outputs, selectedAssetId]);
  const outputByType = useMemo(() => {
    const map = new Map<string, CidOutput>();
    selectedOutputs.forEach((out) => { if (!map.has(out.outputType)) map.set(out.outputType, out); });
    return map;
  }, [selectedOutputs]);

  const processingRows = useMemo(() =>
    jobs.map((job) => ({ job, asset: assets.find((a) => a.id === job.assetId) }))
      .sort((a, b) => toDate(b.job.createdAt).getTime() - toDate(a.job.createdAt).getTime()),
    [jobs, assets]
  );

  const activeJobsCount = useMemo(() =>
    processingRows.filter((r) => ['queued','processing'].includes(String(r.job.status || '').toLowerCase())).length,
    [processingRows]
  );

  const totalPartsCount = useMemo(() => jobs.reduce((sum, job) => {
    const total = Math.max(Number(job.totalParts||0), Number(job.completedParts||0)+Number(job.pendingParts||0), Number(job.completedParts||0));
    return sum + total;
  }, 0), [jobs]);

  const selectedProcessingRow = useMemo(
    () => processingRows.find((row) => (row.asset?.id || row.job.assetId) === selectedAssetId) || null,
    [processingRows, selectedAssetId]
  );
  const selectedAssetSizeBytes = useMemo(() => resolveAssetSizeBytes(selectedAsset, selectedAssetFiles), [selectedAsset, selectedAssetFiles]);
  const selectedFilesTotalBytes = useMemo(() => selectedFiles.reduce((sum, f) => sum + Number(f.size||0), 0), [selectedFiles]);
  const hasFilesAboveOfficialLimit = useMemo(() => selectedFiles.some((f) => Number(f.size||0) > CID_STORAGE_LIMIT_BYTES), [selectedFiles]);
  const selectedTotalParts = Math.max(Number(selectedProcessingRow?.job.totalParts||0), Number(selectedAsset?.totalParts||0), selectedChunks.length);

  // ─── UPLOAD LOGIC ─────────────────────────────────────
  const resolveOwnerUserId = () => {
    if (ownerUserId) return ownerUserId;
    if (userProfile?.uid) return userProfile.uid;
    try {
      const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      return parsed?.user?.id || null;
    } catch { return null; }
  };

  const ensureTags = async (assetId: string, tagNames: string[]) => {
    for (const tagName of tagNames) {
      const normalized = tagName.trim();
      if (!normalized) continue;
      const existing = cidTags.find((t) => t.name.toLowerCase() === normalized.toLowerCase());
      let tagId = existing?.id;
      if (!tagId) {
        try {
          const ref = await addDoc(collection(db, 'cid_tags'), { workspaceId: scopedWorkspaceId, name: normalized, status: 'active', createdAt: new Date(), updatedAt: new Date() });
          tagId = ref.id;
        } catch { continue; }
      }
      try { await addDoc(collection(db, 'cid_asset_tags'), { workspaceId: scopedWorkspaceId, assetId, tagId, createdAt: new Date() }); } catch {}
    }
  };

  const initiateCidProcessing = async (file: File, queuePosition: number, batchId: string | null): Promise<{ ok: boolean, assetId?: string }> => {
    const materialType = selectedFiles.length === 1 ? form.materialType : detectMaterial(file);
    const desiredAction = CID_ALLOWED_ACTIONS.includes(form.desiredAction as any) ? form.desiredAction : 'store_only';
    const createdAt = new Date();
    const title = selectedFiles.length === 1 ? (form.title.trim() || file.name) : file.name;
    const ownerId = resolveOwnerUserId();
    const safeVentureId = isUuidLike(form.ventureId) ? form.ventureId : null;
    const needsInlinePreview = file.size <= INLINE_PREVIEW_MAX_BYTES && (materialType === 'image' || materialType === 'pdf');
    const dataUrl = needsInlinePreview ? await readAsDataUrl(file) : '';

    const assetRef = await addDoc(collection(db, 'cid_assets'), {
      workspaceId: scopedWorkspaceId, ventureId: safeVentureId, title, materialType,
      area: form.area.trim(), project: form.project.trim(), sensitivity: form.sensitivity.trim(),
      ownerUserId: ownerId, ownerName: form.ownerName.trim(), language: form.language.trim(),
      desiredAction, sourceKind: 'upload', isConsultable: form.isConsultable,
      status: 'received', progressPct: 0, createdAt, updatedAt: createdAt,
      payload: { originalFilename: file.name, originalSizeBytes: file.size, originalMimeType: file.type }
    });
    const assetId = assetRef.id;
    const storagePath = buildCidStoragePath({ workspaceId: scopedWorkspaceId, assetId, createdAt, fileName: file.name });

    try {
      await uploadBlobToSupabaseStorage({ bucket: 'cid-assets', path: storagePath, blob: file, mimeType: file.type || 'application/octet-stream' });
      await addDoc(collection(db, 'cid_asset_files'), {
        assetId, workspaceId: scopedWorkspaceId, bucket: 'cid-assets', path: storagePath,
        filename: file.name, mimeType: file.type, sizeBytes: file.size, status: 'stored',
        createdAt, updatedAt: createdAt,
        payload: { inlinePreviewDataUrl: needsInlinePreview ? dataUrl : null }
      });
    } catch (error: any) {
      await updateDoc(doc(db, 'cid_assets', assetId), { status: 'error', payload: { processingError: error.message } });
      throw error;
    }

    if (batchId) await addDoc(collection(db, 'cid_batch_items'), { workspaceId: scopedWorkspaceId, batchId, assetId, status: 'queued' });

    const tagNames = String(form.tags||'').split(',').map((x)=>x.trim()).filter(Boolean);
    if (tagNames.length) await ensureTags(assetId, tagNames);

    await addDoc(collection(db, 'cid_processing_jobs'), {
      assetId, workspaceId: scopedWorkspaceId, batchId, jobType: 'ingestion',
      actionPlan: { desiredAction, shouldTranscribe: desiredAction.includes('transcribe'), shouldSummarize: desiredAction.includes('summarize') },
      queuePosition, status: 'queued', createdAt, updatedAt: createdAt
    });
    await updateDoc(doc(db, 'cid_assets', assetId), { status: 'queued', updatedAt: new Date() });

    try {
      const processorResponse = await fetch('/.netlify/functions/cid-processor', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ assetId }),
      });
      if (!processorResponse.ok) {
        const errorBody = await processorResponse.text().catch(()=>'');
        console.warn(`[CID] Processor retornou ${processorResponse.status}: ${errorBody}`);
        await updateDoc(doc(db, 'cid_assets', assetId), { payload: { processingTriggerResponse: { status: processorResponse.status, body: errorBody } } });
      }
      return { ok: true, assetId };
    } catch (error: any) {
      console.warn(`[CID] Falha de rede ao chamar processor:`, error.message);
      return { ok: true, assetId };
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!isUuidLike(scopedWorkspaceId)) { setFeedback('Workspace não resolvido.'); return; }
    if (!selectedFiles.length) { setFeedback('Selecione ao menos um arquivo.'); return; }
    setIsSubmitting(true);
    setFeedback('Iniciando upload...');
    try {
      let batchId: string | null = null;
      if (selectedFiles.length > 1) {
        const batchRef = await addDoc(collection(db, 'cid_batches'), {
          workspaceId: scopedWorkspaceId, ventureId: isUuidLike(form.ventureId)?form.ventureId:null,
          title: `Lote CID • ${new Date().toLocaleString('pt-BR')}`, source: 'upload', status: 'open',
          totalItems: selectedFiles.length, createdBy: resolveOwnerUserId(), createdAt: new Date(), updatedAt: new Date()
        });
        batchId = batchRef.id;
      }
      let processed = 0, failed = 0;
      for (let i=0; i<selectedFiles.length; i+=1) {
        const r = await initiateCidProcessing(selectedFiles[i], i+1, batchId);
        if (r.ok) processed+=1; else failed+=1;
      }
      if (batchId) await updateDoc(doc(db,'cid_batches',batchId), { status:'processing', processedItems:processed, failedItems:failed, updatedAt:new Date() });
      setFeedback(`Upload(s) iniciados. ${processed} sucesso(s).`);
      setSelectedFiles([]);
      setForm(initialForm(userProfile));
      setShowUploadDrawer(false);
      setViewMode('explorer');
    } catch (error: any) {
      setFeedback(`Falha: ${String(error?.message||'erro desconhecido')}`);
    } finally { setIsSubmitting(false); }
  };

  const toggleAssetSelection = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const next = new Set(selectedAssetsIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedAssetsIds(next);
  };

  const handleOpenAsset = useCallback((id: string) => {
    setSelectedAssetId(id);
    setViewMode('detail');
    setRightPanelVisible(true);
  }, []);

  const handleBackToExplorer = useCallback(() => setViewMode('explorer'), []);

  // ─── DERIVED ──────────────────────────────────────────
  const inlineFile = selectedAssetFiles[0];
  const inlinePreviewDataUrl = String(inlineFile?.payload?.inlinePreviewDataUrl || '');
  const isImagePreview = inlineFile?.mimeType?.startsWith('image/');

  return (
    <div className="h-screen w-screen flex flex-col bg-[#F4F6FA] overflow-hidden font-['Rubik']">
      {/* ═══ TOPBAR ═══ */}
      <header className="h-12 px-4 md:px-5 flex items-center justify-between border-b border-gray-200 bg-white shrink-0 z-20">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[9px] font-black tracking-[0.32em] text-indigo-500 uppercase shrink-0">CID</span>
          <span className="text-gray-300 mx-1">|</span>
          {viewMode === 'detail' ? (
            <nav className="flex items-center gap-1.5 text-xs text-gray-500 min-w-0">
              <button onClick={handleBackToExplorer} className="hover:text-gray-700 transition-colors truncate">Acervo</button>
              <span className="text-gray-300">/</span>
              <span className="text-gray-900 font-semibold truncate max-w-[240px]">{selectedAsset?.title || 'Detalhe'}</span>
            </nav>
          ) : (
            <span className="text-xs font-bold text-gray-800 truncate">Base de Preparação Documental</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 bg-gray-100 rounded-md px-2.5 py-1 text-xs text-gray-500">
            <SearchIcon className="w-3 h-3 text-gray-400" />
            <input type="text" value={searchTerm} onChange={(e)=>setSearchTerm(e.target.value)}
              placeholder="Buscar..." className="bg-transparent outline-none w-28 md:w-36 text-gray-800 placeholder-gray-400 text-xs" />
            {isSearching && <span className="text-[9px] text-indigo-500 animate-pulse">...</span>}
          </div>
          <button onClick={()=>{setShowUploadDrawer(true); setFeedback('');}}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold transition-colors">
            <CloudUploadIcon className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Upload</span>
          </button>
          <button onClick={()=>setSidebarCollapsed(!sidebarCollapsed)}
            className="w-7 h-7 rounded-md border border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300 flex items-center justify-center transition-colors text-xs">
            ☰
          </button>
        </div>
      </header>

      {/* ═══ BODY ═══ */}
      <div className="flex-1 flex overflow-hidden">
        {/* ═══ SIDEBAR ═══ */}
        <aside data-sagb-native-sidebar className={`${sidebarCollapsed?'w-0 overflow-hidden':'w-52'} shrink-0 border-r border-gray-200 bg-white flex flex-col transition-all duration-200`}>
          <nav className="flex-1 overflow-auto py-2 px-2 space-y-3">
            {(['acervo','origem','local-roots','tipo'] as const).map((group) => (
              <div key={group}>
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 px-1.5 mb-1">{groupLabels[group]}</p>
                {sidebarItems.filter((s) => s.group === group).map((item) => (
                  <button key={item.key} onClick={()=>{
                    if (item.key === 'dashboard') {
                      setViewMode('dashboard');
                      setLocalRootName(null);
                      // Mantém sidebarFilter como está (não afeta explorer)
                    } else if (item.isLocalRoot) {
                      setViewMode('local');
                      setLocalRootName(item.key);
                    } else {
                      setSidebarFilter(item.key);
                      setViewMode('explorer');
                      setLocalRootName(null);
                    }
                  }}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors ${
                      item.key === 'dashboard'
                        ? viewMode === 'dashboard'
                          ? 'bg-indigo-50 text-indigo-700 font-semibold'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                        : item.isLocalRoot
                          ? localRootName===item.key && viewMode==='local'
                            ? 'bg-indigo-50 text-indigo-700 font-semibold'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                          : sidebarFilter===item.key && viewMode==='explorer'
                            ? 'bg-indigo-50 text-indigo-700 font-semibold'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                    }`}>
                    <span className="text-sm shrink-0">{item.icon}</span>
                    <span className="truncate flex-1 text-left">{item.label}</span>
                    {item.count && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                        sidebarFilter===item.key&&viewMode==='explorer'?'bg-indigo-100 text-indigo-600':'bg-gray-100 text-gray-500'
                      }`}>{item.count(assets)}</span>
                    )}
                  </button>
                ))}
              </div>
            ))}
          </nav>
          {/* Rodapé da sidebar: Voltar ao SagB */}
          <div className="px-2 py-2 border-t border-gray-200">
            <button
              onClick={() => {
                if (onBack) onBack();
                else {
                  const event = new CustomEvent('cid-close-local');
                  window.dispatchEvent(event);
                }
              }}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
              Voltar ao SagB
            </button>
          </div>
        </aside>

        {/* ═══ CENTER ═══ */}
        <main className="flex-1 flex overflow-hidden">
          {viewMode === 'dashboard' && (
            <div className="flex-1 overflow-hidden">
              <CidDashboard
                assets={assets}
                jobs={jobs}
                chunks={chunks}
                outputs={outputs}
              />
            </div>
          )}

          {viewMode === 'explorer' && (
            <div className="flex-1 overflow-auto">
              {/* Cabeçalho do explorer */}
              <div className="px-4 md:px-5 pt-3 pb-0 flex items-center justify-between">
                <h2 className="text-xs font-black uppercase tracking-wider text-gray-700">
                  {activeSidebarDef.label}
                  <span className="ml-1.5 text-[10px] font-normal text-gray-400 normal-case">({displayedAssets.length})</span>
                </h2>
                <div className="flex items-center gap-2">
                  {selectedAssetsIds.size > 0 && (
                    <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-1 rounded-md font-bold uppercase tracking-wider">
                      {selectedAssetsIds.size} selecionado(s)
                    </span>
                  )}
                  {activeJobsCount > 0 && (
                    <button onClick={()=>setViewMode('processing-list')}
                      className="text-[9px] text-gray-500 hover:text-gray-700 font-medium uppercase tracking-wider transition-colors">
                      Fila ({activeJobsCount})
                    </button>
                  )}
                </div>
              </div>
              {/* Tabela */}
              <div className="px-4 md:px-5 pt-2 pb-4">
                {displayedAssets.length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-gray-500 text-sm font-semibold">
                      {debouncedSearch.trim().length>=3 ? 'Nenhum resultado.' : sidebarFilter==='all' ? 'Acervo vazio.' : 'Nenhum ativo neste filtro.'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {sidebarFilter==='all' ? 'Clique em "Upload" na barra superior.' : 'Tente outro filtro.'}
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Cabeçalho da tabela */}
                    <div className="hidden md:grid grid-cols-[1fr_80px_70px_100px_85px_120px_100px_40px] gap-2 px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-gray-500 border-b border-gray-200">
                      <span>Nome</span><span>Origem</span><span>Tipo</span><span>Status</span><span>Tamanho</span><span>Data</span><span>Responsável</span><span/>
                    </div>
                    {/* Linhas */}
                    <div className="space-y-0.5 mt-0.5">
                      {displayedAssets.map((asset) => {
                        const files = assetFileMap.get(asset.id) || [];
                        const size = resolveAssetSizeBytes(asset, files);
                        const isActive = selectedAssetId === asset.id;
                        const canSelect = asset.status === 'completed' || asset.status === 'completed_warning';
                        return (
                          <div key={asset.id}
                            onClick={()=>handleOpenAsset(asset.id)}
                            className={`grid grid-cols-[auto_1fr] md:grid-cols-[1fr_80px_70px_100px_85px_120px_100px_40px] gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors items-center ${
                              isActive ? 'border-indigo-300 bg-indigo-50/50' : 'border-transparent hover:border-gray-200 hover:bg-gray-50/50'
                            }`}>
                            {/* Mobile: nome + metadados */}
                            <span className="text-base md:hidden shrink-0">{materialIcon[asset.materialType]||'📁'}</span>
                            <div className="md:hidden min-w-0">
                              <p className="text-xs font-semibold text-gray-900 truncate">{asset.title}</p>
                              <p className="text-[10px] text-gray-500 mt-0.5">
                                {fmt(asset.createdAt)}{size?` • ${formatBytes(size)}`:''}{asset.ownerName?` • ${asset.ownerName}`:''}
                              </p>
                            </div>
                            {/* Desktop columns */}
                            <div className="hidden md:flex items-center gap-2 min-w-0">
                              {canSelect && (
                                <div onClick={(e)=>toggleAssetSelection(e, asset.id)} className="shrink-0 cursor-pointer">
                                  <div className={`w-3.5 h-3.5 border-2 rounded-sm flex items-center justify-center ${selectedAssetsIds.has(asset.id)?'bg-indigo-600 border-indigo-600':'border-gray-400 bg-white'}`}>
                                    {selectedAssetsIds.has(asset.id) && <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
                                  </div>
                                </div>
                              )}
                              <span className="text-sm shrink-0">{materialIcon[asset.materialType]||'📁'}</span>
                              <span className="text-xs font-semibold text-gray-900 truncate">{asset.title}</span>
                            </div>
                            <span className="hidden md:block text-[11px] text-gray-600 truncate">{toLabel(asset.sourceKind||'upload')}</span>
                            <span className="hidden md:block text-[11px] text-gray-600">{toLabel(asset.materialType)}</span>
                            <span className="hidden md:flex items-center"><span className={`inline-flex px-1.5 py-0.5 rounded-full text-[9px] font-bold ${statusBadge(asset.status)}`}>{toLabel(asset.status)}</span></span>
                            <span className="hidden md:block text-[11px] text-gray-600">{formatBytes(size)}</span>
                            <span className="hidden md:block text-[11px] text-gray-600 whitespace-nowrap">{fmt(asset.createdAt)}</span>
                            <span className="hidden md:block text-[11px] text-gray-600 truncate">{asset.ownerName || '-'}</span>
                            <span className="hidden md:flex items-center justify-end">
                              {asset.progressPct !== undefined && asset.progressPct > 0 && asset.progressPct < 100 && (
                                <span className="text-[9px] text-gray-600 font-semibold">{asset.progressPct}%</span>
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {viewMode === 'local' && (
            <div className="flex-1 overflow-hidden">
              <CidLocalExplorer
                workspaceId={scopedWorkspaceId}
                rootFilter={localRootName?.replace('local_', '')}
                onImport={async (filePath, fileName) => {
                  try {
                    // Cria asset CID com sourceKind 'local'
                    const ext = fileName.split('.').pop()?.toLowerCase() || '';
                    const materialMap: Record<string, Material> = {
                      pdf: 'pdf', doc: 'doc', docx: 'docx', txt: 'txt',
                      md: 'txt', csv: 'txt', json: 'txt',
                      png: 'image', jpg: 'image', jpeg: 'image', gif: 'image', svg: 'image', webp: 'image',
                      mp3: 'audio', wav: 'audio', ogg: 'audio',
                      mp4: 'video', webm: 'video', avi: 'video', mov: 'video',
                    };
                    const doc: any = {
                      title: fileName,
                      workspaceId: scopedWorkspaceId || '',
                      sourceKind: 'local',
                      materialType: materialMap[ext] || 'other',
                      status: 'received',
                      desiredAction: 'store_only',
                      ownerName: userProfile?.name || '',
                      createdAt: new Date().toISOString(),
                      payload: {
                        localPath: filePath,
                        originalName: fileName,
                        localRoot: localRootName,
                        importedAt: new Date().toISOString(),
                        notes: `Importado do sistema local: ${filePath}`
                      }
                    };
                    const ref = await addDoc(collection(db, 'cid_assets'), doc);
                    console.log('[CID] Asset local criado:', ref.id, filePath);
                    setViewMode('explorer');
                    setSidebarFilter('local');
                    setSelectedAssetId(ref.id);
                  } catch (err: any) {
                    console.error('[CID] Erro ao importar local:', err);
                    setFeedback(`Erro ao importar: ${err.message}`);
                  }
                }}
              />
            </div>
          )}

          {viewMode === 'detail' && selectedAsset && (
            /* ─── DETALHE ─── */
            <div className="flex-1 overflow-auto p-4 md:p-5">
              <div className="max-w-5xl space-y-3">
                <div className="bg-white rounded-lg border border-gray-200 p-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="text-2xl shrink-0">{materialIcon[selectedAsset.materialType]||'📁'}</span>
                      <div className="min-w-0">
                        <h2 className="text-base font-bold text-gray-900 truncate">{selectedAsset.title}</h2>
                        <p className="text-xs text-gray-500 mt-0.5">{toLabel(selectedAsset.materialType)} • {fmt(selectedAsset.createdAt)} • {formatBytes(selectedAssetSizeBytes)}</p>
                        {selectedAsset.ownerName && <p className="text-xs text-gray-500 mt-0.5">Responsável: {selectedAsset.ownerName}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${statusBadge(selectedAsset.status)}`}>{toLabel(selectedAsset.status)}</span>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-600">
                    {selectedAsset.area && <span><strong className="text-gray-700">Área:</strong> {selectedAsset.area}</span>}
                    {selectedAsset.project && <span><strong className="text-gray-700">Projeto:</strong> {selectedAsset.project}</span>}
                    <span><strong className="text-gray-700">Ação:</strong> {toLabel(selectedAsset.desiredAction)}</span>
                    {selectedAsset.language && <span><strong className="text-gray-700">Idioma:</strong> {selectedAsset.language}</span>}
                  </div>
                </div>

                {/* Warnings */}
                {(selectedAsset as any).payload?.processingError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-800">⚠ {String((selectedAsset as any).payload.processingError)}</div>
                )}
                {(selectedAsset as any).payload?.processingWarning && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800">⚠ {String((selectedAsset as any).payload.processingWarning)}</div>
                )}

                {/* Extração info */}
                {(selectedAsset as any).payload?.extraction && (
                  <div className="bg-white rounded-lg border border-gray-200 p-2.5 flex flex-wrap gap-3 text-[11px] text-gray-700">
                    <span>Extrator: <strong>{(selectedAsset as any).payload.extraction.extractor_used||'-'}</strong></span>
                    <span>Chars: <strong>{(selectedAsset as any).payload.extraction.chars_extracted||0}</strong></span>
                    <span>Confiança: <strong>{((selectedAsset as any).payload.extraction.extraction_confidence*100).toFixed(0)}%</strong></span>
                  </div>
                )}

                {/* Outputs */}
                {selectedOutputs.length > 0 && (
                  <div className="bg-white rounded-lg border border-gray-200 p-3.5">
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-gray-700 mb-2">📄 Conteúdo Extraído / Transcrição</h4>
                    <div className="space-y-2 max-h-[400px] overflow-auto">
                      {selectedOutputs.map((out) => (
                        <div key={out.id} className="rounded-lg border border-gray-100 p-2.5 bg-gray-50">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-[9px] font-bold uppercase text-gray-600">{toLabel(out.outputType)}</p>
                            {out.language && <span className="text-[9px] text-gray-500">{out.language}</span>}
                          </div>
                          <p className="text-xs text-gray-800 whitespace-pre-wrap leading-relaxed max-h-[250px] overflow-auto">{out.contentText || <span className="text-gray-400 italic">Sem conteúdo.</span>}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Processando */}
                {selectedOutputs.length===0 && selectedProcessingRow && ['queued','processing','fragmenting','transcribing','summarizing','consolidating'].includes(String(selectedAsset.status||'').toLowerCase()) && (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-3.5 text-center">
                    <p className="text-sm font-semibold text-blue-800">Processando...</p>
                    <p className="text-xs text-blue-600 mt-1">O conteúdo estará disponível em breve.</p>
                  </div>
                )}

              </div>
            </div>
          )}

          {viewMode === 'processing-list' && (
            <CidProcessingQueue jobs={jobs} onBack={() => setViewMode('explorer')} />
          )}

          {/* Right panel (detail mode only) */}
          {viewMode==='detail' && selectedAsset && rightPanelVisible && (
            <aside className="w-60 shrink-0 border-l border-gray-200 bg-white overflow-auto hidden lg:block">
              <div className="p-3 space-y-3">
                <h3 className="text-[9px] font-black uppercase tracking-widest text-gray-500">Informações</h3>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs"><span className="text-gray-500">Status</span><span className={`inline-flex px-1.5 py-0.5 rounded-full text-[9px] font-bold ${statusBadge(selectedAsset.status)}`}>{toLabel(selectedAsset.status)}</span></div>
                  {selectedAsset.progressPct!==undefined && <div className="flex items-center justify-between text-xs"><span className="text-gray-500">Progresso</span><span className="text-gray-700 font-semibold">{selectedAsset.progressPct}%</span></div>}
                  <div className="flex items-center justify-between text-xs"><span className="text-gray-500">Tipo</span><span className="text-gray-700 font-semibold">{toLabel(selectedAsset.materialType)}</span></div>
                  <div className="flex items-center justify-between text-xs"><span className="text-gray-500">Tamanho</span><span className="text-gray-700 font-semibold">{formatBytes(selectedAssetSizeBytes)}</span></div>
                  <div className="flex items-center justify-between text-xs"><span className="text-gray-500">Origem</span><span className="text-gray-700 font-semibold">{toLabel(selectedAsset.sourceKind||'upload')}</span></div>
                  <div className="flex items-center justify-between text-xs"><span className="text-gray-500">Criado</span><span className="text-gray-700 font-semibold text-[10px]">{fmt(selectedAsset.createdAt)}</span></div>
                </div>
                <hr className="border-gray-100"/>
                {selectedAsset.ownerName && <div className="space-y-0.5"><p className="text-[9px] font-bold uppercase tracking-wider text-gray-500">Responsável</p><p className="text-xs text-gray-800">{selectedAsset.ownerName}</p></div>}
                {selectedAsset.area && <div className="space-y-0.5"><p className="text-[9px] font-bold uppercase tracking-wider text-gray-500">Área</p><p className="text-xs text-gray-800">{selectedAsset.area}</p></div>}
                {selectedAsset.project && <div className="space-y-0.5"><p className="text-[9px] font-bold uppercase tracking-wider text-gray-500">Projeto</p><p className="text-xs text-gray-800">{selectedAsset.project}</p></div>}
                {selectedAsset.sensitivity && <><hr className="border-gray-100"/><div className="space-y-0.5"><p className="text-[9px] font-bold uppercase tracking-wider text-gray-500">Sensibilidade</p><span className={`inline-flex px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                  selectedAsset.sensitivity==='public'?'bg-green-100 text-green-700':
                  selectedAsset.sensitivity==='internal'?'bg-blue-100 text-blue-700':
                  selectedAsset.sensitivity==='restricted'?'bg-amber-100 text-amber-700':'bg-red-100 text-red-700'
                }`}>{toLabel(selectedAsset.sensitivity)}</span></div></>}
                <hr className="border-gray-100"/>
                <div className="space-y-0.5"><p className="text-[9px] font-bold uppercase tracking-wider text-gray-500">Ação</p><p className="text-xs text-gray-800">{toLabel(selectedAsset.desiredAction)}</p></div>
                {selectedProcessingRow && <><hr className="border-gray-100"/><div className="space-y-0.5"><p className="text-[9px] font-bold uppercase tracking-wider text-gray-500">Job</p><div className="space-y-0.5 text-[11px] text-gray-600">
                  <p>Status: <strong className="text-gray-800">{toLabel(selectedProcessingRow.job.status)}</strong></p>
                  {selectedProcessingRow.job.progressPct!==undefined && <p>Progresso: <strong className="text-gray-800">{selectedProcessingRow.job.progressPct}%</strong></p>}
                  {selectedProcessingRow.job.retries!==undefined && selectedProcessingRow.job.retries>0 && <p>Tentativas: <strong className="text-gray-800">{selectedProcessingRow.job.retries}</strong></p>}
                  {selectedProcessingRow.job.errorMessage && <p className="text-red-600">Erro: {selectedProcessingRow.job.errorMessage}</p>}
                </div></div></>}
                {selectedChunks.length>0 && <><hr className="border-gray-100"/><div className="space-y-0.5"><p className="text-[9px] font-bold uppercase tracking-wider text-gray-500">Fragmentos</p><p className="text-xs text-gray-800">{selectedChunks.length} chunk(s)</p><div className="space-y-0.5 max-h-[100px] overflow-auto">{selectedChunks.map((c)=><div key={c.id} className="text-[9px] text-gray-600 truncate bg-gray-50 rounded px-1.5 py-0.5">#{c.chunkIndex||0} — {c.textContent?`${c.textContent.length.toLocaleString()} chars`:'-'}</div>)}</div></div></>}
                {selectedOutputs.length>0 && <><hr className="border-gray-100"/><div className="space-y-0.5"><p className="text-[9px] font-bold uppercase tracking-wider text-gray-500">Saídas</p><p className="text-xs text-gray-800">{selectedOutputs.length} saída(s)</p><div className="space-y-0.5">{selectedOutputs.map((o)=><div key={o.id} className="text-[9px] text-gray-600 truncate bg-gray-50 rounded px-1.5 py-0.5 flex items-center justify-between"><span>{toLabel(o.outputType)}</span><span className="text-gray-400">{o.language||''}</span></div>)}</div></div></>}
              </div>
            </aside>
          )}
        </main>
      </div>

      {/* ═══ UPLOAD DRAWER ═══ */}
      {showUploadDrawer && (
        <div className="fixed inset-0 z-50 bg-black/50 flex justify-end backdrop-blur-sm">
          <div className="w-full max-w-md bg-white shadow-2xl flex flex-col h-full overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50 shrink-0">
              <div className="flex items-center gap-2">
                <CloudUploadIcon className="w-4 h-4 text-indigo-600" />
                <h2 className="text-xs font-black uppercase tracking-wider text-gray-800">Ingestão de Ativos</h2>
              </div>
              <button onClick={()=>setShowUploadDrawer(false)} className="w-7 h-7 rounded-md border border-gray-200 text-gray-500 hover:text-gray-700 flex items-center justify-center transition-colors text-sm">&times;</button>
            </div>
            <form onSubmit={handleUpload} className="flex-1 overflow-auto p-4 space-y-3">
              <CidBoundaryBanner compact />
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-gray-700 mb-1">Arquivos</label>
                  <input type="file" multiple onChange={(ev)=>setSelectedFiles(Array.from(ev.target.files||[]))}
                    className="w-full text-sm border border-gray-300 rounded-md px-2.5 py-2 bg-white focus:border-gray-500 focus:ring-1 focus:ring-gray-400 outline-none"
                    accept=".pdf,.doc,.docx,.txt,.md,.json,.xml,.csv,.xls,.xlsx,image/*,audio/*,video/*"/>
                  {!!selectedFiles.length && <div className="mt-1 rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1.5"><p className="text-xs text-gray-800 font-semibold">{selectedFiles.length} arquivo(s) • {formatBytes(selectedFilesTotalBytes)}</p></div>}
                  {hasFilesAboveOfficialLimit && <div className="mt-1 rounded-md border border-amber-300 bg-amber-50 px-2.5 py-1 text-[10px] text-amber-900 font-medium">⚠ Arquivo acima do limite.</div>}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="block text-[9px] font-black uppercase tracking-widest text-gray-700 mb-1">Título</label>
                    <input value={form.title} onChange={(ev)=>setForm(p=>({...p,title:ev.target.value}))} className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-xs bg-white focus:border-gray-500 focus:ring-1 focus:ring-gray-400 outline-none" placeholder="Nome"/></div>
                  <div><label className="block text-[9px] font-black uppercase tracking-widest text-gray-700 mb-1">Tipo</label>
                    <select value={form.materialType} onChange={(ev)=>setForm(p=>({...p,materialType:ev.target.value as Material}))} className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-xs bg-white focus:border-gray-500 focus:ring-1 focus:ring-gray-400 outline-none">
                      <option value="pdf">PDF</option><option value="doc">DOC</option><option value="docx">DOCX</option>
                      <option value="txt">TXT</option><option value="spreadsheet">Planilha</option>
                      <option value="image">Imagem</option><option value="audio">Áudio</option><option value="video">Vídeo</option><option value="other">Outro</option>
                    </select></div>
                  <div><label className="block text-[9px] font-black uppercase tracking-widest text-gray-700 mb-1">Venture</label>
                    <select value={form.ventureId} onChange={(ev)=>setForm(p=>({...p,ventureId:ev.target.value}))} className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-xs bg-white focus:border-gray-500 focus:ring-1 focus:ring-gray-400 outline-none">
                      <option value="">Sem vínculo</option>{ventures.map((v)=><option key={v.id} value={v.id}>{v.name}</option>)}
                    </select></div>
                  <div><label className="block text-[9px] font-black uppercase tracking-widest text-gray-700 mb-1">Área</label>
                    <input value={form.area} onChange={(ev)=>setForm(p=>({...p,area:ev.target.value}))} className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-xs bg-white focus:border-gray-500 outline-none" placeholder="Ex: Jurídico"/></div>
                  <div><label className="block text-[9px] font-black uppercase tracking-widest text-gray-700 mb-1">Projeto</label>
                    <input value={form.project} onChange={(ev)=>setForm(p=>({...p,project:ev.target.value}))} className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-xs bg-white focus:border-gray-500 outline-none" placeholder="Ex: Contrato"/></div>
                  <div><label className="block text-[9px] font-black uppercase tracking-widest text-gray-700 mb-1">Sensib.</label>
                    <select value={form.sensitivity} onChange={(ev)=>setForm(p=>({...p,sensitivity:ev.target.value}))} className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-xs bg-white focus:border-gray-500 outline-none">
                      <option value="public">Público</option><option value="internal">Interno</option>
                      <option value="restricted">Restrito</option><option value="confidential">Confidencial</option>
                    </select></div>
                  <div><label className="block text-[9px] font-black uppercase tracking-widest text-gray-700 mb-1">Resp.</label>
                    <input value={form.ownerName} onChange={(ev)=>setForm(p=>({...p,ownerName:ev.target.value}))} className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-xs bg-white focus:border-gray-500 outline-none" placeholder="Nome"/></div>
                  <div><label className="block text-[9px] font-black uppercase tracking-widest text-gray-700 mb-1">Idioma</label>
                    <input value={form.language} onChange={(ev)=>setForm(p=>({...p,language:ev.target.value}))} className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-xs bg-white focus:border-gray-500 outline-none" placeholder="pt-BR"/></div>
                </div>
                <div><label className="block text-[9px] font-black uppercase tracking-widest text-gray-700 mb-1">Ação</label>
                  <select value={form.desiredAction} onChange={(ev)=>setForm(p=>({...p,desiredAction:ev.target.value as DesiredAction}))} className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-xs bg-white focus:border-gray-500 outline-none">
                    <option value="store_only">📦 Só armazenar</option><option value="store_transcribe">🎤 Armazenar + transcrever</option>
                    <option value="store_summarize">📝 Armazenar + resumir técnico</option>
                    <option value="store_transcribe_summarize">🎤📝 Armazenar + transcrever + resumir técnico</option>
                  </select></div>
                <div><label className="block text-[9px] font-black uppercase tracking-widest text-gray-700 mb-1">Tags</label>
                  <input value={form.tags} onChange={(ev)=>setForm(p=>({...p,tags:ev.target.value}))} className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-xs bg-white focus:border-gray-500 outline-none" placeholder="contrato, jurídico"/></div>
              </div>
              {feedback && <div className={`text-xs rounded-md px-2.5 py-1.5 border ${
                isSubmitting?'bg-blue-50 text-blue-800 border-blue-200':
                feedback.includes('Falha')?'bg-red-50 text-red-800 border-red-200':
                'bg-green-50 text-green-800 border-green-200'
              }`}>{feedback}</div>}
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                <p className="text-[10px] text-gray-500">Processamento em segundo plano.</p>
                <div className="flex gap-1.5">
                  <button type="button" onClick={()=>setShowUploadDrawer(false)} className="px-3 py-1.5 rounded-md text-[10px] font-bold text-gray-600 hover:text-gray-800 border border-gray-200 hover:border-gray-300 transition-colors">Cancelar</button>
                  <button type="submit" disabled={isSubmitting} className="px-3 py-1.5 rounded-md bg-indigo-600 text-white text-[10px] font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    {isSubmitting ? <span className="flex items-center gap-1"><svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Enviando...</span> : 'Enviar'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default CIDView;
