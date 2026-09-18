import React, { useCallback, useState } from 'react';
import { TabId } from '../../../../types';
import {
  createAvulso,
  resetToBlueprint,
} from '../services/nagiService';
import { receiveFromNic, NicOutputPayload } from '../services/nagiNicBridge';
import { NagiItem, NagiItemType, NagiIngestionDocument, ITEM_TYPE_LABELS } from '../domain/types';
import CatalogSection from './CatalogSection';
import TriageSection from './TriageSection';
import IngestionSection from './IngestionSection';
import EmptyState from './EmptyState';
import PublishedLinksSection from './PublishedLinksSection';
import '../styles/nagi-tokens.css';

/* ── Tipos ──────────────────────────────────────────── */

export type NagiSection = 'dashboard' | 'documentos' | 'ideias' | 'catalogo' | 'links' | 'governanca';

interface NAGIViewProps {
  section: NagiSection;
  catalogItems: NagiItem[];
  triageItems: NagiItem[];
  ingestionDocs: NagiIngestionDocument[];
  eligibleCount: number;
  refreshKey: number;
  onRefresh: () => void;
  onNavigate: (section: string) => void;
}

/* ── SVG Icons ──────────────────────────────────────── */

const CheckIconSVG: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const PlusIconSVG: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const ShieldIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

/* ── Section config ─────────────────────────────────── */

interface SectionConfig {
  title: string;
  description: string;
  dotColor: string;
}

const SECTION_CONFIG: Record<NagiSection, SectionConfig> = {
  dashboard: { title: 'Dashboard', description: 'Visão geral do Núcleo Avançado de Gestão de Ideias', dotColor: 'var(--nagi-brand)' },
  documentos: { title: 'Documentos', description: 'Documentos entram, o NAGI sugere, você revisa e decide.', dotColor: 'var(--nagi-brand)' },
  ideias: { title: 'Ideias em análise', description: 'Ideias em análise — aguardando sua avaliação. Itens elegíveis podem ser promovidos ao catálogo.', dotColor: 'var(--nagi-warning)' },
  catalogo: { title: 'Catálogo', description: 'Itens oficiais do ecossistema — prontos, catalogados e vinculados.', dotColor: 'var(--nagi-success)' },
  links: { title: 'Central de Aplicativos', description: 'Aplicativos do GrupoB consolidados por produto para demonstração e homologação.', dotColor: 'var(--nagi-info)' },
  governanca: { title: 'Governança', description: 'Acompanhamento de decisões, auditoria e controle do pipeline.', dotColor: 'var(--nagi-accent)' },
};

/* ── Componente ─────────────────────────────────────── */

const NAGIView: React.FC<NAGIViewProps> = ({
  section,
  catalogItems,
  triageItems,
  ingestionDocs,
  eligibleCount,
  refreshKey,
  onRefresh,
  onNavigate,
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showNicForm, setShowNicForm] = useState(false);
  const [toast, setToast] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  const showToast = (type: 'ok' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3000);
  };

  const handleNavigate = useCallback((tab: string) => {
    onNavigate(tab);
  }, [onNavigate]);

  const handleCreateAvulso = useCallback(
    (title: string, summary: string, itemType: NagiItemType, category: string) => {
      createAvulso({ title, summary, itemType, category });
      setShowCreateForm(false);
      showToast('ok', 'Ideia criada com sucesso!');
      onRefresh();
    },
    [onRefresh],
  );

  const handleReceiveFromNic = useCallback(
    (payload: NicOutputPayload) => {
      receiveFromNic(payload);
      setShowNicForm(false);
      showToast('ok', 'Importado do NIC para triagem.');
      onRefresh();
    },
    [onRefresh],
  );

  const handleReset = useCallback(() => {
    resetToBlueprint();
    showToast('ok', 'Base restaurada com dados de exemplo.');
    onRefresh();
  }, [onRefresh]);

  const showActionButtons = section === 'ideias' || section === 'documentos';
  const config = SECTION_CONFIG[section];

  return (
    <>
      {/* ── Toast ─────────────────────────────── */}
      {toast && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            borderRadius: 'var(--nagi-radius-md)',
            fontSize: 'var(--nagi-body)',
            fontWeight: 600,
            backgroundColor: toast.type === 'ok' ? 'var(--nagi-success-soft)' : 'var(--nagi-danger-soft)',
            color: toast.type === 'ok' ? 'var(--nagi-success)' : 'var(--nagi-danger)',
            border: `1px solid ${toast.type === 'ok' ? 'var(--nagi-success-line)' : 'var(--nagi-danger-line)'}`,
            marginBottom: 16,
          }}
        >
          {toast.type === 'ok' && <CheckIconSVG />}
          {toast.text}
        </div>
      )}

      {/* ── Header + Actions ──────────────────── */}
      {section !== 'dashboard' && section !== 'governanca' && section !== 'links' && (
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 10,
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    display: 'inline-block',
                    backgroundColor: config.dotColor,
                  }}
                />
                <h2
                  style={{
                    fontSize: 'var(--nagi-screen-title)',
                    fontWeight: 'var(--nagi-screen-title-weight)',
                    letterSpacing: 'var(--nagi-screen-title-spacing)',
                    color: 'var(--nagi-text)',
                    margin: 0,
                  }}
                >
                  {config.title}
                </h2>
              </div>
              <p
                style={{
                  fontSize: 'var(--nagi-muted-size)',
                  color: 'var(--nagi-muted)',
                  margin: '2px 0 0 16px',
                }}
              >
                {config.description}
              </p>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {showActionButtons && (
                <>
                  <button
                    onClick={() => setShowNicForm(true)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      height: 36,
                      padding: '0 14px',
                      borderRadius: 'var(--nagi-radius-md)',
                      border: `1px solid var(--nagi-info-line)`,
                      backgroundColor: 'var(--nagi-info-soft)',
                      color: 'var(--nagi-info)',
                      fontSize: 'var(--nagi-micro)',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      cursor: 'pointer',
                      transition: 'opacity var(--nagi-transition-base)',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.8'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                  >
                    <PlusIconSVG />
                    Do NIC
                  </button>
                  <button
                    onClick={() => setShowCreateForm(true)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      height: 36,
                      padding: '0 14px',
                      borderRadius: 'var(--nagi-radius-md)',
                      border: 'none',
                      backgroundColor: 'var(--nagi-brand)',
                      color: '#FFFFFF',
                      fontSize: 'var(--nagi-micro)',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      cursor: 'pointer',
                      transition: 'opacity var(--nagi-transition-base)',
                      boxShadow: 'var(--nagi-shadow-sm)',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                  >
                    <PlusIconSVG />
                    Nova ideia
                  </button>
                </>
              )}
              <button
                onClick={handleReset}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  height: 36,
                  padding: '0 12px',
                  borderRadius: 'var(--nagi-radius-md)',
                  border: `1px solid var(--nagi-line)`,
                  backgroundColor: 'var(--nagi-surface)',
                  color: 'var(--nagi-muted)',
                  fontSize: 'var(--nagi-micro)',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  cursor: 'pointer',
                  transition: 'opacity var(--nagi-transition-base)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.7'; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
                Restaurar
              </button>
            </div>
          </div>

          {/* Eligible badge */}
          {section === 'ideias' && eligibleCount > 0 && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '3px 12px',
                borderRadius: 'var(--nagi-radius-md)',
                backgroundColor: 'var(--nagi-success-soft)',
                color: 'var(--nagi-success)',
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                border: `1px solid var(--nagi-success-line)`,
                marginTop: 6,
              }}
            >
              <CheckIconSVG />
              {eligibleCount} pronto(s) para catálogo
            </div>
          )}
        </div>
      )}

      {/* ── Section content ───────────────────── */}
      {section === 'documentos' && (
        <IngestionSection
          key={`ing-${refreshKey}`}
          documents={ingestionDocs}
          catalogItems={catalogItems}
          onRefresh={onRefresh}
        />
      )}

      {section === 'ideias' && (
        <TriageSection
          key={`tri-${refreshKey}`}
          items={triageItems}
          onRefresh={onRefresh}
          onNavigate={handleNavigate}
        />
      )}

      {section === 'catalogo' && (
        <CatalogSection
          key={`cat-${refreshKey}`}
          items={catalogItems}
          onRefresh={onRefresh}
          onNavigate={handleNavigate}
        />
      )}

      {section === 'links' && (
        <PublishedLinksSection />
      )}

      {section === 'governanca' && (
        <div style={{ maxWidth: 800 }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  display: 'inline-block',
                  backgroundColor: config.dotColor,
                }}
              />
              <h2
                style={{
                  fontSize: 'var(--nagi-screen-title)',
                  fontWeight: 'var(--nagi-screen-title-weight)',
                  letterSpacing: 'var(--nagi-screen-title-spacing)',
                  color: 'var(--nagi-text)',
                  margin: 0,
                }}
              >
                {config.title}
              </h2>
            </div>
            <p
              style={{
                fontSize: 'var(--nagi-muted-size)',
                color: 'var(--nagi-muted)',
                margin: '2px 0 0 16px',
              }}
            >
              {config.description}
            </p>
          </div>
          <EmptyState
            title="Governança em construção"
            description="Aqui você poderá acompanhar decisões, auditoria e controle do pipeline NAGI."
            icon={<ShieldIcon />}
          />
        </div>
      )}

      {/* ── Modais ────────────────────────────── */}
      {showCreateForm && (
        <ModalShell title="Nova ideia" onClose={() => setShowCreateForm(false)}>
          <CreateAvulsoForm onSubmit={handleCreateAvulso} />
        </ModalShell>
      )}

      {showNicForm && (
        <ModalShell title="Importar do NIC" onClose={() => setShowNicForm(false)}>
          <NicImportForm onSubmit={handleReceiveFromNic} />
        </ModalShell>
      )}
    </>
  );
};

/* ── Modal Shell ───────────────────────────────────── */

const ModalShell: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({
  title, onClose, children,
}) => (
  <div
    style={{
      position: 'fixed',
      inset: 0,
      zIndex: 50,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.25)',
      backdropFilter: 'blur(4px)',
    }}
    onClick={onClose}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        margin: '0 16px',
        backgroundColor: 'var(--nagi-surface)',
        borderRadius: 'var(--nagi-radius-2xl)',
        boxShadow: 'var(--nagi-shadow-lg)',
        maxWidth: 480,
        width: '100%',
        padding: 24,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <h3
          style={{
            fontSize: 'var(--nagi-module-title)',
            fontWeight: 'var(--nagi-module-title-weight)',
            letterSpacing: 'var(--nagi-module-title-spacing)',
            color: 'var(--nagi-text)',
            margin: 0,
          }}
        >
          {title}
        </h3>
        <button
          onClick={onClose}
          style={{
            color: 'var(--nagi-muted)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.7'; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      {children}
    </div>
  </div>
);

/* ── CreateAvulsoForm ──────────────────────────────── */

const CreateAvulsoForm: React.FC<{
  onSubmit: (title: string, summary: string, itemType: NagiItemType, category: string) => void;
}> = ({ onSubmit }) => {
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [itemType, setItemType] = useState<NagiItemType>('ideia');
  const [category, setCategory] = useState('');

  const categoryOptions = [
    'Memória Operacional', 'Inteligência Documental',
    'Reuniões e Contexto', 'Treinamento e Capital Intelectual',
    'Vídeo e Contexto', 'Criatividade e Inteligência Pessoal',
    'Aplicação Comercial', 'Análise Multimodal',
    'Organização Estratégica', 'Gestão de Portfólio',
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Input label="Título" value={title} onChange={setTitle} placeholder="Nome da ideia..." />
      <Textarea label="Descrição" value={summary} onChange={setSummary} placeholder="Resumo da ideia..." />
      <Select label="Tipo" value={itemType} onChange={(v) => setItemType(v as NagiItemType)} options={Object.entries(ITEM_TYPE_LABELS) as [string, string][]} />
      <Select label="Categoria" value={category} onChange={setCategory} options={categoryOptions.map((c) => [c, c])} placeholder="Selecione..." />
      <button
        onClick={() => { if (title.trim() && summary.trim() && category) onSubmit(title.trim(), summary.trim(), itemType, category); }}
        disabled={!title.trim() || !summary.trim() || !category}
        style={{
          width: '100%',
          height: 37,
          borderRadius: 'var(--nagi-radius-md)',
          fontSize: 'var(--nagi-micro)',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          backgroundColor: 'var(--nagi-brand)',
          color: '#FFFFFF',
          border: 'none',
          cursor: 'pointer',
          transition: 'opacity var(--nagi-transition-base)',
          opacity: (!title.trim() || !summary.trim() || !category) ? 0.4 : 1,
        }}
        onMouseEnter={(e) => {
          if (title.trim() && summary.trim() && category) e.currentTarget.style.opacity = '0.9';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = (!title.trim() || !summary.trim() || !category) ? '0.4' : '1';
        }}
      >
        Criar ideia
      </button>
    </div>
  );
};

/* ── NicImportForm ─────────────────────────────────── */

const NicImportForm: React.FC<{
  onSubmit: (payload: NicOutputPayload) => void;
}> = ({ onSubmit }) => {
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [itemType, setItemType] = useState<NagiItemType>('iniciativa');
  const [category, setCategory] = useState('');
  const [originRefId, setOriginRefId] = useState('');
  const [originSnapshot, setOriginSnapshot] = useState('');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Input label="Título (do NIC)" value={title} onChange={setTitle} placeholder="Nome da saída do NIC..." />
      <Textarea label="Resumo" value={summary} onChange={setSummary} placeholder="Resumo da inteligência gerada..." />
      <Input label="ID de referência NIC" value={originRefId} onChange={setOriginRefId} placeholder="nic-output-003" />
      <Textarea label="Conteúdo original (NIC)" value={originSnapshot} onChange={setOriginSnapshot} placeholder="Cole aqui a saída original do NIC para referência..." />
      <Select label="Tipo" value={itemType} onChange={(v) => setItemType(v as NagiItemType)} options={Object.entries(ITEM_TYPE_LABELS) as [string, string][]} />
      <Input label="Categoria" value={category} onChange={setCategory} placeholder="Ex: Organização Estratégica" />
      <button
        onClick={() => {
          if (title.trim() && summary.trim() && originRefId.trim() && category.trim()) {
            onSubmit({
              title: title.trim(), summary: summary.trim(),
              itemType, category: category.trim(),
              originRefId: originRefId.trim(), originSnapshot: originSnapshot.trim(),
              evidenceLabel: 'Saída do NIC',
              evidenceExcerpt: summary.substring(0, 120),
            });
          }
        }}
        disabled={!title.trim() || !summary.trim() || !originRefId.trim() || !category.trim()}
        style={{
          width: '100%',
          height: 37,
          borderRadius: 'var(--nagi-radius-md)',
          fontSize: 'var(--nagi-micro)',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          backgroundColor: 'var(--nagi-brand)',
          color: '#FFFFFF',
          border: 'none',
          cursor: 'pointer',
          transition: 'opacity var(--nagi-transition-base)',
          opacity: (!title.trim() || !summary.trim() || !originRefId.trim() || !category.trim()) ? 0.4 : 1,
        }}
        onMouseEnter={(e) => {
          if (title.trim() && summary.trim() && originRefId.trim() && category.trim()) e.currentTarget.style.opacity = '0.9';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = (!title.trim() || !summary.trim() || !originRefId.trim() || !category.trim()) ? '0.4' : '1';
        }}
      >
        Importar para triagem
      </button>
    </div>
  );
};

/* ── Field helpers ────────────────────────────────── */

const Input: React.FC<{ label: string; value: string; onChange: (v: string) => void; placeholder?: string }> = ({
  label, value, onChange, placeholder,
}) => (
  <div>
    <label
      style={{
        fontSize: 'var(--nagi-micro)',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        color: 'var(--nagi-muted)',
        display: 'block',
        marginBottom: 4,
      }}
    >
      {label}
    </label>
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%',
        height: 42,
        borderRadius: 'var(--nagi-radius-md)',
        border: `1px solid var(--nagi-line)`,
        backgroundColor: 'var(--nagi-surface-soft)',
        padding: '0 12px',
        fontSize: 'var(--nagi-body)',
        outline: 'none',
        color: 'var(--nagi-text)',
        boxSizing: 'border-box',
      }}
      onFocus={(e) => { e.target.style.borderColor = 'var(--nagi-brand)'; }}
      onBlur={(e) => { e.target.style.borderColor = 'var(--nagi-line)'; }}
    />
  </div>
);

const Textarea: React.FC<{ label: string; value: string; onChange: (v: string) => void; placeholder?: string }> = ({
  label, value, onChange, placeholder,
}) => (
  <div>
    <label
      style={{
        fontSize: 'var(--nagi-micro)',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        color: 'var(--nagi-muted)',
        display: 'block',
        marginBottom: 4,
      }}
    >
      {label}
    </label>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={3}
      placeholder={placeholder}
      style={{
        width: '100%',
        padding: '10px 12px',
        borderRadius: 'var(--nagi-radius-md)',
        border: `1px solid var(--nagi-line)`,
        backgroundColor: 'var(--nagi-surface-soft)',
        fontSize: 'var(--nagi-body)',
        resize: 'none',
        outline: 'none',
        color: 'var(--nagi-text)',
        boxSizing: 'border-box',
      }}
      onFocus={(e) => { e.target.style.borderColor = 'var(--nagi-brand)'; }}
      onBlur={(e) => { e.target.style.borderColor = 'var(--nagi-line)'; }}
    />
  </div>
);

const Select: React.FC<{ label: string; value: string; onChange: (v: string) => void; options: [string, string][]; placeholder?: string }> = ({
  label, value, onChange, options, placeholder,
}) => (
  <div>
    <label
      style={{
        fontSize: 'var(--nagi-micro)',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        color: 'var(--nagi-muted)',
        display: 'block',
        marginBottom: 4,
      }}
    >
      {label}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: '100%',
        height: 42,
        borderRadius: 'var(--nagi-radius-md)',
        border: `1px solid var(--nagi-line)`,
        backgroundColor: 'var(--nagi-surface-soft)',
        padding: '0 12px',
        fontSize: 'var(--nagi-body)',
        outline: 'none',
        color: 'var(--nagi-text)',
        boxSizing: 'border-box',
      }}
      onFocus={(e) => { e.target.style.borderColor = 'var(--nagi-brand)'; }}
      onBlur={(e) => { e.target.style.borderColor = 'var(--nagi-line)'; }}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
    </select>
  </div>
);

export default NAGIView;
