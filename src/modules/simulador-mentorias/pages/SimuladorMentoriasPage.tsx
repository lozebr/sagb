import React, { useMemo, useState } from 'react';
import { AlertPanel } from '../components/AlertPanel';
import { PlanActualVariance } from '../components/PlanActualVariance';
import { ScenarioComparison } from '../components/ScenarioComparison';
import { SimulationKpiCard } from '../components/SimulationKpiCard';
import { ViabilityBadge } from '../components/ViabilityBadge';
import { defaultMentorshipSimulation } from '../data/defaultSimulation';
import { calculatePlanActualVariance, calculateScenario, formatCurrency, formatPercent } from '../services/calculationEngine';

export const SimuladorMentoriasPage: React.FC = () => {
  const [activeScenarioId, setActiveScenarioId] = useState(defaultMentorshipSimulation.approvedScenarioId || 'probable');

  const results = useMemo(
    () => defaultMentorshipSimulation.scenarios.map((scenario) => calculateScenario(scenario)),
    []
  );

  const activeScenario = defaultMentorshipSimulation.scenarios.find((scenario) => scenario.id === activeScenarioId) || defaultMentorshipSimulation.scenarios[0];
  const activeResult = results.find((result) => result.scenarioId === activeScenario.id) || results[0];
  const varianceRows = defaultMentorshipSimulation.actuals
    ? calculatePlanActualVariance(activeResult, defaultMentorshipSimulation.actuals)
    : [];

  const revenueComposition = [
    { label: 'Principal', value: activeResult.principalGrossRevenueCents, color: '#9C00A8' },
    { label: 'Upsell', value: activeResult.upsellGrossRevenueCents, color: '#F97316' },
    { label: 'Outras', value: activeScenario.otherRevenueCents + activeScenario.sponsorshipRevenueCents, color: '#00B336' }
  ];

  const costComposition = [
    { label: 'Fixos', value: activeResult.fixedCostsCents },
    { label: 'Variáveis', value: activeResult.variableCostsCents },
    { label: 'Percentuais', value: activeResult.percentageCostsCents },
    { label: 'Marketing', value: activeResult.marketingCostsCents }
  ];

  return (
    <div className="min-h-full bg-[radial-gradient(circle_at_8%_8%,rgba(156,0,168,0.10),transparent_30%),linear-gradient(135deg,#FFFFFF_0%,#F5F6F8_34%,#FDF6FE_100%)] text-[#202833] font-[Rubik,system-ui,sans-serif]">
      <div className="mx-auto max-w-[1540px] p-4 lg:p-5">
        <div className="grid gap-4 lg:grid-cols-[248px_minmax(0,1fr)]">
          <aside data-sagb-native-sidebar className="rounded-[28px] bg-white/80 p-4 shadow-[0_10px_28px_rgba(15,23,42,0.055)] backdrop-blur-xl lg:sticky lg:top-4 lg:min-h-[calc(100vh-40px)]">
            <div className="flex items-center gap-3 pb-4">
              <div className="grid h-11 w-11 place-items-center rounded-[16px] bg-gradient-to-br from-[#9C00A8] to-[#B82BC5] text-sm font-medium text-white shadow-[0_14px_30px_rgba(156,0,168,0.22)]">SM</div>
              <div>
                <div className="text-[14px] font-medium">Simulador</div>
                <div className="mt-0.5 text-[11px] font-light text-[#66717D]">Mentorias · NIDE</div>
              </div>
            </div>

            <div className="mt-2">
              <div className="mb-2 px-2 text-[10px] uppercase tracking-[0.08em] text-[#98A1AB]">Telas MVP</div>
              <nav className="grid gap-1.5">
                {['Visão executiva', 'Premissas', 'Cenários', 'Realizado', 'Alertas'].map((item, index) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => document.getElementById(['sim-visao','sim-premissas','sim-cenarios','sim-realizado','sim-alertas'][index])?.scrollIntoView({block:'start',behavior:'smooth'})}
                    className={`flex items-center gap-2.5 rounded-[15px] px-3 py-2.5 text-left text-[12px] transition-all ${
                      index === 0
                        ? 'bg-gradient-to-br from-[#9C00A8] to-[#B82BC5] text-white shadow-[0_14px_28px_rgba(156,0,168,0.18)]'
                        : 'text-[#66717D] hover:bg-[#F8E4FA] hover:text-[#202833]'
                    }`}
                  >
                    <span className="grid h-6 w-6 place-items-center rounded-[9px] bg-white/70 text-[10px] text-[#9C00A8]">0{index + 1}</span>
                    {item}
                  </button>
                ))}
              </nav>
            </div>

            <div className="mt-6 rounded-[20px] bg-gradient-to-br from-[#FDF6FE] to-white p-4 shadow-[0_8px_22px_rgba(25,35,52,0.045)]">
              <div className="text-[12px] font-medium">MVP determinístico</div>
              <div className="mt-2 text-[11px] font-light leading-5 text-[#66717D]">Motor puro, UI sem fórmulas e cenários conservador, provável e otimista calculados localmente.</div>
            </div>
            <button type="button" className="mt-6 w-full rounded-lg px-3 py-3 text-left text-xs font-medium" onClick={() => window.dispatchEvent(new CustomEvent('sagb:navigate',{detail:'home'}))}>← Voltar ao SagB</button>
          </aside>

          <main className="min-w-0">
            <header className="sticky top-4 z-10 mb-4 rounded-[22px] bg-white/85 p-4 shadow-[0_10px_28px_rgba(15,23,42,0.055)] backdrop-blur-xl">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-[14px] bg-[#9C00A8] text-sm font-medium text-white shadow-[0_12px_24px_rgba(156,0,168,0.22)]">R$</div>
                  <div>
                    <div className="text-[15px] font-medium">{defaultMentorshipSimulation.title}</div>
                    <div className="mt-0.5 text-[12px] font-light text-[#66717D]">Simulação financeira-comercial · cálculo {activeResult.calculationVersion}</div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <ViabilityBadge resultCents={activeResult.operationalResultWithUpsellCents} marginPercent={activeResult.marginPercent} />
                  <button type="button" className="rounded-[13px] bg-[#F0F2F5] px-4 py-2.5 text-[12px] text-[#202833] shadow-[0_8px_22px_rgba(25,35,52,0.045)]">Exportar</button>
                  <button type="button" className="rounded-[13px] bg-[#9C00A8] px-4 py-2.5 text-[12px] font-medium text-white shadow-[0_14px_28px_rgba(156,0,168,0.20)]">Salvar snapshot</button>
                </div>
              </div>
            </header>

            <section id="sim-visao" className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="m-0 text-[28px] font-medium tracking-[-0.04em] text-[#202833]">Visão executiva</h1>
                <p className="mt-1 text-[13px] font-light text-[#66717D]">Receita, custos, lucro, margem, ROI, aquisição e alertas conforme documento técnico.</p>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {defaultMentorshipSimulation.scenarios.map((scenario) => (
                  <button
                    key={scenario.id}
                    type="button"
                    onClick={() => setActiveScenarioId(scenario.id)}
                    className={`whitespace-nowrap rounded-full px-4 py-2.5 text-[12px] shadow-[0_8px_22px_rgba(25,35,52,0.045)] ${scenario.id === activeScenarioId ? 'bg-[#9C00A8] text-white' : 'bg-white/80 text-[#66717D]'}`}
                  >
                    {scenario.name}
                  </button>
                ))}
              </div>
            </section>

            <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <SimulationKpiCard label="Receita bruta" value={formatCurrency(activeResult.totalGrossRevenueCents)} foot="principal + upsells + outras" icon="↗" />
              <SimulationKpiCard label="Resultado" value={formatCurrency(activeResult.operationalResultWithUpsellCents)} foot="consolidado com upsell" icon="R$" tone={activeResult.operationalResultWithUpsellCents >= 0 ? 'success' : 'danger'} />
              <SimulationKpiCard label="Margem" value={formatPercent(activeResult.marginPercent)} foot={`meta mínima ${activeScenario.minMarginPercent}%`} icon="%" tone={activeResult.marginPercent >= activeScenario.minMarginPercent ? 'success' : 'warning'} />
              <SimulationKpiCard label="Break-even" value={`${activeResult.breakEvenPaidParticipants}`} foot="pagantes necessários" icon="◎" tone={activeResult.breakEvenPaidParticipants <= activeScenario.capacity ? 'info' : 'danger'} />
            </section>

            <section id="sim-premissas" className="mt-4 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
              <article className="rounded-[22px] bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.055)]">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-[15px] font-medium text-[#202833]">Composição de receita</h3>
                    <p className="mt-1 text-[12px] font-light text-[#66717D]">Separação obrigatória entre receita principal e upsells.</p>
                  </div>
                  <span className="rounded-full bg-[#F0F2F5] px-3 py-2 text-[11px] text-[#66717D]">{activeScenario.name}</span>
                </div>
                <div className="grid gap-4 md:grid-cols-[180px_1fr] md:items-center">
                  <div className="relative mx-auto grid h-[170px] w-[170px] place-items-center rounded-full shadow-[0_8px_22px_rgba(25,35,52,0.045)]" style={{ background: 'conic-gradient(#9C00A8 0 68%, #F97316 68% 92%, #00B336 92% 100%)' }}>
                    <div className="grid h-[108px] w-[108px] place-items-center rounded-full bg-white text-center shadow-inner">
                      <div>
                        <div className="text-[20px] font-medium tracking-[-0.04em]">{formatCurrency(activeResult.totalGrossRevenueCents)}</div>
                        <div className="text-[10px] text-[#66717D]">total</div>
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-3">
                    {revenueComposition.map((item) => (
                      <div key={item.label} className="flex items-center justify-between rounded-[16px] bg-[#F0F2F5] p-3 text-[12px]">
                        <span className="inline-flex items-center gap-2 text-[#66717D]"><i className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />{item.label}</span>
                        <strong className="font-medium text-[#202833]">{formatCurrency(item.value)}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </article>

              <article className="rounded-[22px] bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.055)]">
                <div className="mb-4">
                  <h3 className="text-[15px] font-medium text-[#202833]">Aquisição e custos</h3>
                  <p className="mt-1 text-[12px] font-light text-[#66717D]">CAC, ROAS e composição sem grade pesada.</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-[18px] bg-[#F0F2F5] p-4"><div className="text-[11px] text-[#66717D]">CAC pago</div><div className="mt-2 text-[20px] font-medium tracking-[-0.04em]">{formatCurrency(activeResult.paidCacCents)}</div></div>
                  <div className="rounded-[18px] bg-[#F0F2F5] p-4"><div className="text-[11px] text-[#66717D]">ROAS</div><div className="mt-2 text-[20px] font-medium tracking-[-0.04em]">{activeResult.roas.toFixed(2)}x</div></div>
                </div>
                <div className="mt-4 grid gap-2">
                  {costComposition.map((item) => (
                    <div key={item.label} className="flex items-center justify-between rounded-[15px] bg-[#F0F2F5] px-3 py-3 text-[12px]">
                      <span className="text-[#66717D]">{item.label}</span>
                      <strong className="font-medium text-[#202833]">{formatCurrency(item.value)}</strong>
                    </div>
                  ))}
                </div>
              </article>
            </section>

            <section id="sim-cenarios" className="mt-4">
              <ScenarioComparison scenarios={defaultMentorshipSimulation.scenarios} results={results} activeScenarioId={activeScenarioId} onSelectScenario={setActiveScenarioId} />
            </section>

            <section className="mt-4 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
              <div id="sim-alertas"><AlertPanel alerts={activeResult.alerts} /></div>
              <div id="sim-realizado"><PlanActualVariance rows={varianceRows} /></div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
};

export default SimuladorMentoriasPage;
