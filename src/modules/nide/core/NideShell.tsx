import React, { useState, lazy, Suspense } from 'react';
import { NideProvider } from './NideProvider';
import { NideFullscreenLayout } from '../layout/NideFullscreenLayout';
import { NideDomainNav } from '../shell/NideDomainNav';
import { MissionsCorePage } from './missions/MissionsCorePage';
import { NideDomain } from '../registry/domain.types';

/**
 * Lazy import dos domínios reais (Metodologias, Mentorias) para não impactar
 * o bundle principal do NIDE com seus pesos individuais.
 */
const MetodologiasDomainPage = lazy(() =>
  import('../domains/metodologias/pages/MetodologiasHubPage').then(m => ({
    default: m.default
  }))
);

const MentoriasDomainContainer = lazy(() =>
  import('../domains/mentorias/routes').then(m => ({
    default: m.MentoriasDomainContainer
  }))
);

interface NideShellProps {
  onBackToSagB?: () => void;
}

/**
 * Shell principal do NIDE.
 * 
 * Renderiza o core funcional, domínios ativos (Metodologias, Mentorias)
 * e placeholders para domínios planejados.
 * 
 * Domínios ativos são lazy loaded para otimizar o bundle inicial.
 */
export const NideShell: React.FC<NideShellProps> = ({ onBackToSagB }) => {
  const [selectedDomain, setSelectedDomain] = useState<NideDomain | null>(null);
  const [domainKey, setDomainKey] = useState(0);

  const handleSelectDomain = (domain: NideDomain) => {
    if (!domain.manifest.isPlanned) {
      if (selectedDomain?.manifest.id !== domain.manifest.id) {
        setSelectedDomain(domain);
        setDomainKey(k => k + 1);
      }
    }
  };

  const handleBackToSagB = () => {
    if (onBackToSagB) {
      onBackToSagB();
    } else {
      window.dispatchEvent(
        new CustomEvent('sagb:navigate', { detail: 'home' })
      );
    }
  };

  const renderDomainContent = () => {
    if (!selectedDomain || selectedDomain.manifest.id === 'missoes') {
      return <MissionsCorePage />;
    }

    switch (selectedDomain.manifest.id) {
      case 'metodologias':
        return (
          <Suspense fallback={
            <div className="flex items-center justify-center h-full text-slate-400 dark:text-slate-500">
              <div className="text-center">
                <p className="text-sm font-semibold mb-2">Carregando Metodologias...</p>
              </div>
            </div>
          }>
            <MetodologiasDomainPage key={domainKey} onBackToSagB={handleBackToSagB} />
          </Suspense>
        );

      case 'mentorias':
        return (
          <Suspense fallback={
            <div className="flex items-center justify-center h-full text-slate-400 dark:text-slate-500">
              <div className="text-center">
                <p className="text-sm font-semibold mb-2">Carregando Mentorias...</p>
              </div>
            </div>
          }>
            <MentoriasDomainContainer key={domainKey} />
          </Suspense>
        );

      default:
        // Domínios planejados ou não implementados
        return (
          <div className="flex items-center justify-center h-full text-slate-400 dark:text-slate-500">
            <div className="text-center">
              <p className="text-sm font-semibold mb-2">
                {selectedDomain.manifest.displayName}
              </p>
              <p className="text-[11px]">
                {selectedDomain.manifest.isPlanned
                  ? 'Domínio planejado — será implementado em etapas futuras.'
                  : 'Domínio não implementado nesta versão.'}
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <NideProvider>
      <NideFullscreenLayout>
        <div className="flex h-full">
          {/* Sidebar interna de domínios */}
          <aside data-sagb-native-sidebar className="w-56 shrink-0 border-r border-slate-200 dark:border-white/5 p-3 flex flex-col min-h-0">
            <div className="flex-1 min-h-0 overflow-y-auto">
              <NideDomainNav onSelectDomain={handleSelectDomain} selectedDomainId={selectedDomain?.manifest.id} />
            </div>
            <footer className="shrink-0 pt-3"><button type="button" onClick={handleBackToSagB} className="w-full text-left text-xs font-semibold text-slate-500 hover:text-blue-600">← Voltar ao SagB</button></footer>
          </aside>

          {/* Conteúdo principal */}
          <main className="flex-1 overflow-y-auto">
            {renderDomainContent()}
          </main>
        </div>
      </NideFullscreenLayout>
    </NideProvider>
  );
};
