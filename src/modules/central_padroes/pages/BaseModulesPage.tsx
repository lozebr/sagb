import React from 'react';
import { CentralPageShell } from '../components/CentralPageShell';
import { useCentralPadroes } from '../hooks/useCentralPadroes';

const gateSteps = [
  'CID + RAI qualificam intenção e risco inicial',
  'NICO e NAGI verificam contexto, necessidade e governança',
  'AJUP / Audacus entram quando houver jurídico, auditoria ou sensibilidade',
  'Biblioteca de Módulos Base verifica reaproveitamento antes do desenvolvimento',
  'Pietro / Central de Padrões valida aderência normativa',
  'Sala Dev ou módulo especialista executa somente após o gate'
];

const BaseModulesPage: React.FC = () => {
  const { snapshot } = useCentralPadroes();
  const baseModules = snapshot?.baseModules || [];

  return (
    <CentralPageShell title="Biblioteca de Módulos Base" subtitle="Primeira versão real do Gate Modular Pré-Dev: antes de construir, verificar ativos reutilizáveis, padrões aplicáveis e vínculo com a Central.">
      <section className="cp-docs-panel cp-docs-roadmap-box"><strong>Catálogo histórico / Gate Pré-Dev</strong><p>A Biblioteca de Módulos LOZE reúne a prateleira atual. Os registros abaixo permanecem para consulta e reconciliação de legado.</p><button type="button" className="cp-docs-top-link primary" onClick={()=>window.dispatchEvent(new CustomEvent('sagb:navigate',{detail:'biblioteca-modulos'}))}>Abrir Biblioteca de Módulos LOZE</button></section>
      <section className="cp-docs-gate-hero">
        <div>
          <p className="cp-docs-kicker">Gate Modular Pré-Dev</p>
          <h2>Evitar retrabalho antes da Sala Dev</h2>
          <p>A biblioteca nasce como camada de consulta obrigatória para impedir criação duplicada de módulos, serviços e bases técnicas já existentes.</p>
        </div>
        <div className="cp-docs-gate-badge">CP-GOV-001</div>
      </section>

      <section className="cp-docs-flow-list">
        {gateSteps.map((step, index) => (
          <article key={step} className="cp-docs-flow-step">
            <span>{String(index + 1).padStart(2, '0')}</span>
            <p>{step}</p>
          </article>
        ))}
      </section>

      <section className="cp-docs-base-grid">
        {baseModules.map((module) => (
          <article key={module.id} className="cp-docs-base-card">
            <div className="cp-docs-base-head">
              <div>
                <p className="cp-docs-kicker">{module.moduleType} • {module.areaId} • {module.source}</p>
                <h3>{module.name}</h3>
              </div>
              <span className={`cp-docs-status ${module.status}`}>{module.status}</span>
            </div>
            <p>{module.description}</p>
            <div className="cp-docs-base-meta">
              <span><strong>Responsável</strong>{module.owner}</span>
              <span><strong>Gate</strong>{module.gateChecklistKey}</span>
              <span><strong>Riscos</strong>{module.risks.join(', ')}</span>
            </div>
            <div className="cp-docs-base-section"><strong>Uso recomendado</strong><p>{module.recommendedUse}</p></div>
            <div className="cp-docs-chip-row">{module.reuseCriteria.map((item) => <span key={item}>{item}</span>)}</div>
            <div className="cp-docs-base-links">
              <span>Padrões: {module.linkedStandards.join(', ') || '—'}</span>
              <span>Protocolos: {module.linkedProtocols.join(', ') || '—'}</span>
              <span>Checklists: {module.linkedChecklists.join(', ') || '—'}</span>
            </div>
          </article>
        ))}
        {!baseModules.length && (
          <div className="cp-docs-panel cp-docs-doc-row">
            <div className="cp-docs-doc-name"><span>∅</span><span>Nenhum módulo base persistido ainda</span></div>
            <span className="cp-docs-status revisao">fallback</span>
            <span>preparado</span>
            <span>—</span>
          </div>
        )}
      </section>

      <section className="cp-docs-panel cp-docs-roadmap-box">
        <p className="cp-docs-kicker">Próxima evolução</p>
        <p>Adicionar entidade dedicada de módulo base com versão, tags, dependências, contrato de uso, pré-requisitos, exemplos, cobertura por padrão e score de reaproveitamento.</p>
      </section>
    </CentralPageShell>
  );
};
export default BaseModulesPage;
