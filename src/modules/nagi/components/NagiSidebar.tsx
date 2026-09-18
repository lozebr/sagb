import React from 'react';
import '../styles/nagi-tokens.css';

/* ── Tipos ──────────────────────────────────────────── */

export type NagiSection = 'dashboard' | 'documentos' | 'ideias' | 'catalogo' | 'links' | 'governanca';

interface NavItem {
  id: NagiSection;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

interface NagiSidebarProps {
  activeSection: NagiSection;
  onNavigate: (section: NagiSection) => void;
  onBack: () => void;
  badgeCounts: {
    documentos: number;
    ideias: number;
    catalogo: number;
    links: number;
    governanca: number;
  };
}

/* ── SVG Icons inline ───────────────────────────────── */

const DashboardIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const DocumentIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

const FlaskIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3.32A2.5 2.5 0 0 1 9.5 2Z" />
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3.32A2.5 2.5 0 0 0 14.5 2Z" />
  </svg>
);

const BookIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
  </svg>
);

const LinkIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

const ShieldIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const ArrowLeftIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

/* ── Componente ─────────────────────────────────────── */

const NagiSidebar: React.FC<NagiSidebarProps> = ({
  activeSection,
  onNavigate,
  onBack,
  badgeCounts,
}) => {
  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
    { id: 'documentos', label: 'Documentos', icon: <DocumentIcon />, badge: badgeCounts.documentos },
    { id: 'ideias', label: 'Ideias em análise', icon: <FlaskIcon />, badge: badgeCounts.ideias },
    { id: 'catalogo', label: 'Catálogo', icon: <BookIcon />, badge: badgeCounts.catalogo },
    { id: 'links', label: 'Aplicativos', icon: <LinkIcon />, badge: badgeCounts.links },
    { id: 'governanca', label: 'Governança', icon: <ShieldIcon />, badge: badgeCounts.governanca },
  ];

  return (
    <aside
      className="nagi-sidebar"
      style={{
        width: 220,
        minWidth: 220,
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--nagi-surface)',
        borderRight: `1px solid var(--nagi-line-soft)`,
        padding: 0,
        overflow: 'hidden',
      }}
    >
      {/* ── Identidade ────────────────────────── */}
      <div
        style={{
          padding: '20px 18px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        {/* Badge SVG NAGI */}
        <svg width="32" height="32" viewBox="0 0 28 28" fill="none">
          <rect width="28" height="28" rx="8" fill="url(#sidebar-nagi-grad)" />
          <text x="14" y="18" textAnchor="middle" fill="white" fontSize="13" fontWeight="800" fontFamily="Rubik, sans-serif">NZ</text>
          <defs>
            <linearGradient id="sidebar-nagi-grad" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
              <stop stopColor="#0E7C7B" />
              <stop offset="1" stopColor="#14A8A6" />
            </linearGradient>
          </defs>
        </svg>
        <div className="nagi-sidebar-copy">
          <div
            style={{
              fontSize: 15,
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: 'var(--nagi-text)',
              lineHeight: 1.2,
            }}
          >
            NAGI
          </div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 500,
              color: 'var(--nagi-muted)',
              letterSpacing: '0.02em',
            }}
          >
            governança de ideias
          </div>
        </div>
      </div>

      {/* ── Navegação ─────────────────────────── */}
      <nav
        style={{
          flex: 1,
          padding: '4px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {navItems.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                height: 40,
                padding: '0 12px',
                borderRadius: 'var(--nagi-radius-md)',
                border: 'none',
                backgroundColor: isActive ? 'var(--nagi-brand-soft)' : 'transparent',
                color: isActive ? 'var(--nagi-brand)' : 'var(--nagi-text-secondary)',
                fontSize: 12,
                fontWeight: isActive ? 700 : 500,
                letterSpacing: '-0.01em',
                cursor: 'pointer',
                transition: 'all var(--nagi-transition-base)',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'var(--nagi-surface-muted)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 20,
                  height: 20,
                  opacity: isActive ? 1 : 0.65,
                }}
              >
                {item.icon}
              </span>
              <span className="nagi-sidebar-label" style={{ flex: 1 }}>{item.label}</span>
              {item.badge !== undefined && (
                <span
                  className="nagi-sidebar-badge"
                  style={{
                    minWidth: 20,
                    height: 20,
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: '-0.01em',
                    backgroundColor: isActive ? 'var(--nagi-brand)' : 'var(--nagi-neutral-soft)',
                    color: isActive ? '#FFFFFF' : 'var(--nagi-muted)',
                    padding: '0 6px',
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* ── Separador ─────────────────────────── */}
      <div
        style={{
          margin: '0 18px 8px',
          height: 1,
          backgroundColor: 'var(--nagi-line-soft)',
        }}
      />

      {/* ── Footer: Voltar ao SagB ────────────── */}
      <div className="nagi-sidebar-footer" style={{ padding: '0 10px 16px' }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            width: '100%',
            height: 36,
            padding: '0 12px',
            borderRadius: 'var(--nagi-radius-md)',
            border: 'none',
            backgroundColor: 'transparent',
            color: 'var(--nagi-muted)',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.02em',
            cursor: 'pointer',
            transition: 'all var(--nagi-transition-base)',
            textAlign: 'left',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--nagi-surface-muted)';
            e.currentTarget.style.color = 'var(--nagi-text)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--nagi-muted)';
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', opacity: 0.7 }}>
            <ArrowLeftIcon />
          </span>
          <span className="nagi-sidebar-label">Voltar ao SagB</span>
        </button>
      </div>
    </aside>
  );
};

export default NagiSidebar;
