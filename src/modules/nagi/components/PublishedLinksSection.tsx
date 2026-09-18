import React, { useMemo, useState } from 'react';
import {
  DEMO_PRODUCTS,
  DemoProduct,
  DemoProductStatus,
  getDemoProductCompanies,
} from '../data/demoProducts';
import '../styles/nagi-tokens.css';

const STATUS_META: Record<DemoProductStatus, { label: string; bg: string; color: string; border: string }> = {
  validated: {
    label: '🟢 Atualizado',
    bg: 'var(--nagi-success-soft)',
    color: 'var(--nagi-success)',
    border: 'var(--nagi-success-line)',
  },
  review: {
    label: '🟡 Revisar',
    bg: 'var(--nagi-warning-soft)',
    color: 'var(--nagi-warning)',
    border: 'var(--nagi-warning-line)',
  },
  blocked: {
    label: '🔴 Bloqueado',
    bg: 'var(--nagi-danger-soft)',
    color: 'var(--nagi-danger)',
    border: 'var(--nagi-danger-line)',
  },
  not_verified: {
    label: '⚪ Não verificado',
    bg: 'var(--nagi-neutral-soft)',
    color: 'var(--nagi-muted)',
    border: 'var(--nagi-line)',
  },
};

const PublishedLinksSection: React.FC = () => {
  const [query, setQuery] = useState('');
  const [company, setCompany] = useState('todas');
  const [status, setStatus] = useState<'todos' | DemoProductStatus>('todos');

  const companies = useMemo(() => getDemoProductCompanies(), []);

  const products = useMemo(() => {
    const term = query.trim().toLowerCase();

    return DEMO_PRODUCTS.filter((product) => {
      const matchesCompany = company === 'todas' || product.company === company;
      const matchesStatus = status === 'todos' || product.status === status;
      const haystack = [
        product.name,
        product.company,
        product.description,
        product.version,
        ...product.aliases,
      ].filter(Boolean).join(' ').toLowerCase();

      return matchesCompany && matchesStatus && (!term || haystack.includes(term));
    });
  }, [company, query, status]);

  const validatedCount = DEMO_PRODUCTS.filter((product) => product.status === 'validated').length;
  const pendingCount = DEMO_PRODUCTS.filter((product) => product.status === 'not_verified').length;

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 14,
          flexWrap: 'wrap',
          paddingBottom: 2,
        }}
      >
        <div>
          <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--nagi-brand)', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 4 }}>
            Central de demonstração
          </div>
          <h2 style={{ margin: 0, fontSize: 24, lineHeight: 1.05, color: 'var(--nagi-text)', letterSpacing: '-0.035em' }}>
            Aplicativos
          </h2>
          <p style={{ margin: '6px 0 0', color: 'var(--nagi-muted)', fontSize: 11 }}>
            Um produto por card. Preview de homologação é o alvo principal quando validado.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 10, color: 'var(--nagi-muted)' }}>
          <SummaryChip value={DEMO_PRODUCTS.length} label="produtos" />
          <SummaryChip value={validatedCount} label="prontos" />
          <SummaryChip value={pendingCount} label="validar" />
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar aplicativo..."
          aria-label="Buscar aplicativo"
          style={{ ...controlStyle, flex: '2 1 240px' }}
        />
        <select value={company} onChange={(event) => setCompany(event.target.value)} aria-label="Filtrar por empresa" style={{ ...controlStyle, flex: '1 1 150px' }}>
          <option value="todas">Todas as ventures</option>
          {companies.map((name) => <option key={name} value={name}>{name}</option>)}
        </select>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as 'todos' | DemoProductStatus)}
          aria-label="Filtrar por status"
          style={{ ...controlStyle, flex: '1 1 150px' }}
        >
          <option value="todos">Todos os status</option>
          <option value="validated">Atualizado</option>
          <option value="review">Revisar</option>
          <option value="blocked">Bloqueado</option>
          <option value="not_verified">Não verificado</option>
        </select>
      </div>

      {products.length === 0 ? (
        <div style={{ padding: 26, borderRadius: 'var(--nagi-radius-lg)', border: '1px dashed var(--nagi-line)', color: 'var(--nagi-muted)', textAlign: 'center', fontSize: 12 }}>
          Nenhum aplicativo encontrado.
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: 10,
            alignItems: 'stretch',
          }}
        >
          {products.map((product) => <ProductCard key={product.productId} product={product} />)}
        </div>
      )}
    </section>
  );
};

const SummaryChip: React.FC<{ value: number; label: string }> = ({ value, label }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      minHeight: 28,
      padding: '0 9px',
      borderRadius: 999,
      backgroundColor: 'var(--nagi-surface)',
      border: '1px solid var(--nagi-line-soft)',
      whiteSpace: 'nowrap',
    }}
  >
    <strong style={{ color: 'var(--nagi-text)' }}>{value}</strong>
    {label}
  </span>
);

const ProductCard: React.FC<{ product: DemoProduct }> = ({ product }) => {
  const statusMeta = STATUS_META[product.status];
  const canOpen = Boolean(product.demoUrl);

  return (
    <article
      style={{
        minHeight: 158,
        padding: 14,
        borderRadius: 'var(--nagi-radius-lg)',
        backgroundColor: 'var(--nagi-surface)',
        border: '1px solid var(--nagi-line-soft)',
        boxShadow: 'var(--nagi-shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: 9,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <span
            style={{
              display: 'inline-flex',
              marginBottom: 6,
              padding: '3px 7px',
              borderRadius: 999,
              backgroundColor: 'var(--nagi-neutral-soft)',
              color: 'var(--nagi-muted)',
              fontSize: 8,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            {product.company}
          </span>
          <h3 style={{ margin: 0, color: 'var(--nagi-text)', fontSize: 15, lineHeight: 1.15, letterSpacing: '-0.025em' }}>
            {product.name}
          </h3>
          {product.description && (
            <p style={{ margin: '5px 0 0', color: 'var(--nagi-muted)', fontSize: 10, lineHeight: 1.35 }}>
              {product.description}
            </p>
          )}
        </div>

        <span
          style={{
            flex: '0 0 auto',
            fontSize: 8,
            fontWeight: 900,
            whiteSpace: 'nowrap',
            padding: '4px 6px',
            borderRadius: 999,
            backgroundColor: statusMeta.bg,
            color: statusMeta.color,
            border: `1px solid ${statusMeta.border}`,
          }}
        >
          {statusMeta.label}
        </span>
      </div>

      {product.version && (
        <div style={{ fontSize: 9, color: 'var(--nagi-muted)' }}>
          Versão {product.version}
        </div>
      )}

      <div style={{ marginTop: 'auto' }}>
        {canOpen ? (
          <a
            href={product.demoUrl}
            target="_blank"
            rel="noreferrer"
            aria-label={`Abrir demonstração de ${product.name}`}
            style={primaryActionStyle}
          >
            Abrir
          </a>
        ) : (
          <button
            type="button"
            disabled
            title="Deploy Preview/homologação ainda não verificado"
            style={{
              ...primaryActionStyle,
              width: '100%',
              border: '1px solid var(--nagi-line)',
              backgroundColor: 'var(--nagi-neutral-soft)',
              color: 'var(--nagi-muted)',
              cursor: 'not-allowed',
              opacity: 0.72,
            }}
          >
            Abrir
          </button>
        )}
      </div>
    </article>
  );
};

const controlStyle: React.CSSProperties = {
  minWidth: 0,
  height: 38,
  borderRadius: 'var(--nagi-radius-md)',
  border: '1px solid var(--nagi-line)',
  backgroundColor: 'var(--nagi-surface)',
  color: 'var(--nagi-text)',
  padding: '0 11px',
  fontSize: 11,
  outline: 'none',
  boxSizing: 'border-box',
};

const primaryActionStyle: React.CSSProperties = {
  minHeight: 34,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0 12px',
  borderRadius: 'var(--nagi-radius-md)',
  backgroundColor: 'var(--nagi-brand)',
  color: '#fff',
  fontSize: 10,
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  textDecoration: 'none',
};

export default PublishedLinksSection;
