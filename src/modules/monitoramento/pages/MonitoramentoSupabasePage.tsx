import React, { useMemo, useState } from 'react';
import { countSupabaseTableRowsSafely, supabaseMovementReadiness, supabaseObservedAssets, SupabaseObservedAsset, supabaseProjectsInventory, sagbModuleBoundaries, compareSchemaInventory } from '../services';

const statusStyle: Record<string, string> = {
  real: 'bg-emerald-500/10 text-emerald-600 border-emerald-400/30',
  inferido: 'bg-sky-500/10 text-sky-600 border-sky-400/30',
  pendente: 'bg-slate-500/10 text-slate-500 border-slate-400/30',
  erro: 'bg-red-500/10 text-red-600 border-red-400/30',
  sem_permissao: 'bg-orange-500/10 text-orange-600 border-orange-400/30',
  nao_encontrado: 'bg-violet-500/10 text-violet-600 border-violet-400/30'
};

const MonitoramentoSupabasePage: React.FC = () => {
  const [assets, setAssets] = useState<SupabaseObservedAsset[]>(supabaseObservedAssets);
  const [query, setQuery] = useState('');
  const [isCounting, setIsCounting] = useState(false);

  const filteredAssets = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return assets;
    return assets.filter((asset) => `${asset.tableName} ${asset.moduleName} ${asset.status}`.toLowerCase().includes(normalized));
  }, [assets, query]);

  const grouped = useMemo(() => {
    return filteredAssets.reduce<Record<string, SupabaseObservedAsset[]>>((acc, asset) => {
      acc[asset.moduleName] ||= [];
      acc[asset.moduleName].push(asset);
      return acc;
    }, {});
  }, [filteredAssets]);

  const totalKnownRecords = assets.reduce((sum, asset) => sum + (asset.recordCount || 0), 0);
  const inferred = assets.filter((asset) => asset.status === 'inferido').length;
  const validated = assets.filter((asset) => asset.status === 'real').length;
  const noPermission = assets.filter((asset) => asset.status === 'sem_permissao').length;
  const readErrors = assets.filter((asset) => asset.status === 'erro').length;
  const lastCheck = assets.find((asset) => asset.lastReadAt !== 'não executada')?.lastReadAt || 'não executada';

  const runSafeCounts = async () => {
    setIsCounting(true);
    const results: SupabaseObservedAsset[] = [];

    for (const asset of assets) {
      const countResult = await countSupabaseTableRowsSafely(asset);
      results.push({
        ...asset,
        recordCount: countResult.recordCount,
        status: countResult.status,
        lastReadAt: countResult.lastReadAt,
        note: countResult.note,
        origin: countResult.origin,
        sourceEvidence: countResult.sourceEvidence
      });
    }

    setAssets(results);
    setIsCounting(false);
  };

  return (
    <section className="space-y-5">
      <header className="rounded-[24px] border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0F172A] p-5 shadow-sm">
        <span className="text-[9px] font-black uppercase tracking-[0.34em] text-cyan-500">Database Observatory</span>
        <h1 className="mt-2 text-2xl font-black text-slate-950 dark:text-white">Supabase / Database</h1>
        <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">Visão separada do banco operacional SagB e das duas incubadoras LOZE. Inventário das incubadoras é um snapshot de leitura, não uma consulta contínua em tempo real.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar tabela ou módulo interno do SagB" className="min-w-[260px] rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none" />
          <button type="button" onClick={runSafeCounts} disabled={isCounting} className="rounded-2xl bg-cyan-500 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-white disabled:opacity-60">
            {isCounting ? 'Contando...' : 'Contar apenas no SagB'}
          </button>
        </div>
      </header>


      <section className="space-y-3" aria-label="Projetos Supabase observados">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-black text-slate-950 dark:text-white">Projetos e isolamento de dados</h2>
            <p className="text-xs text-slate-500">Real = consulta de metadados em 04/11/2026; referência = exemplo do padrão; não verificado = sem acesso ou manifesto.</p>
          </div>
          <a href="https://github.com/lozebr/loze-adm/blob/develop/docs/standards/3fb006-padrao-supabase-loze-v1-17-09-2026.md" target="_blank" rel="noreferrer" className="text-xs font-bold text-cyan-700 dark:text-cyan-300 underline">Padrão oficial LOZE</a>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
          {supabaseProjectsInventory.map((project) => (
            <article key={project.id} className="rounded-[22px] border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0F172A] p-4 shadow-sm min-w-0 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.12em] font-bold text-slate-500">{project.projectClass === 'sagb_operational' ? 'Banco operacional — separado' : project.projectClass === 'loze_products' ? 'Incubadora produtos LOZE' : 'Incubadora aplicativos clientes'}</p>
                  <h3 className="text-sm font-black text-slate-950 dark:text-white break-words">{project.name}</h3>
                </div>
                <span className={`rounded-full border px-2 py-1 text-[9px] font-bold whitespace-nowrap ${statusStyle[project.status === 'real' ? 'real' : 'pendente']}`}>{project.status === 'real' ? 'Snapshot real' : 'Não verificado'}</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">{project.note}</p>
              <dl className="grid grid-cols-2 gap-2 text-[11px]">
                <div><dt className="font-bold text-slate-500">Referência</dt><dd className="break-all dark:text-white">{project.projectRef || 'Não confirmada'}</dd></div>
                <div><dt className="font-bold text-slate-500">Última leitura</dt><dd className="dark:text-white">{project.checkedAt || 'Pendente'}</dd></div>
                <div><dt className="font-bold text-slate-500">Migrations aplicadas</dt><dd className="dark:text-white">{project.migrationsApplied ?? 'Não verificadas'}</dd></div>
                <div><dt className="font-bold text-slate-500">Papel</dt><dd className="dark:text-white">{project.role === 'operational' ? 'Operação do SagB' : 'Somente observação'}</dd></div>
              </dl>
              <div className="rounded-xl bg-slate-50 dark:bg-white/5 p-3 space-y-2">
                <h4 className="text-xs font-black text-slate-900 dark:text-white">Schemas de produtos</h4>
                {project.schemaInventories.length === 0 && <p className="text-[11px] text-slate-500">Não inventariado: confirmar conexão operacional antes de inspecionar schemas.</p>}
                {project.schemaInventories.map((schema) => {
                  const comparison = compareSchemaInventory(schema);
                  return (
                    <div key={schema.name} className="border-t border-slate-200 dark:border-white/10 pt-2 first:border-0 first:pt-0">
                      <div className="flex flex-wrap justify-between gap-2">
                        <div><strong className="text-xs text-slate-900 dark:text-white">{schema.name}</strong><p className="text-[10px] text-slate-500">{schema.product}</p></div>
                        <span className={`text-[10px] font-black ${schema.status === 'real' ? 'text-emerald-600' : 'text-amber-600'}`}>{schema.status === 'real' ? 'Real' : 'Referência, não localizado'}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300">Tabelas reais: <strong>{schema.observedTables?.length ?? 'não verificadas'}</strong> · RLS ativada: <strong>{schema.rlsEnabledCount ?? 'não verificada'}</strong></p>
                      <p className="text-[10px] text-slate-500">Manifesto: {schema.manifest || 'não reconciliado'} · Comparação: {comparison.status.replace('_', ' ')}</p>
                      <p className="text-[10px] text-slate-500">Owner: {schema.owner || 'a confirmar'}</p>
                      {schema.observedTables && <details className="text-[10px] text-slate-500 mt-1"><summary className="cursor-pointer font-bold text-cyan-700 dark:text-cyan-300">Ver {schema.observedTables.length} tabelas existentes</summary><p className="mt-2 leading-relaxed break-words">{schema.observedTables.join(' · ')}</p></details>}
                      {schema.status !== 'real' && <p className="text-[10px] text-amber-600 mt-1">{schema.note}</p>}
                    </div>
                  );
                })}
              </div>
              {project.unassignedSchemas.length > 0 && <div className="text-[11px] text-slate-600 dark:text-slate-300"><strong>Schemas sem ownership atribuído neste inventário:</strong> {project.unassignedSchemas.map((s) => `${s.name} (${s.tables} tabelas; ${s.rlsEnabled} com RLS)`).join(' · ')}</div>}
              <div className="text-[11px] text-slate-600 dark:text-slate-300"><strong>Storage:</strong> {project.buckets.length ? project.buckets.map((b) => `${b.name} (${b.isPublic ? 'público' : 'privado'}; owner pendente)`).join(' · ') : 'não inventariado'}</div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300"><strong>Auth:</strong> {project.authContext}</p>
              <p className="text-[10px] text-slate-500"><strong>Fonte:</strong> {project.evidence}</p>
            </article>
          ))}
        </div>
        <p className="text-[11px] text-amber-700 dark:text-amber-300">RLS ligada não comprova isolamento efetivo; falta revisar grants, políticas e testar usuário A × B. Os snapshots não realizam leitura automática futura.</p>
      </section>

      <section className="rounded-[22px] border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0F172A] p-4 shadow-sm">
        <h2 className="text-lg font-black text-slate-950 dark:text-white">Módulos internos e produtos independentes</h2>
        <p className="text-xs text-slate-500 mt-1 mb-3">Inventário do registry: {sagbModuleBoundaries.filter((mod) => mod.registered).length} módulos registrados e {sagbModuleBoundaries.filter((mod) => !mod.registered).length} legados externos ao registry. Nenhuma exclusão ou migração foi realizada.</p>
        <div className="max-h-[420px] overflow-auto">
          <table className="w-full text-left text-[11px] min-w-[840px]">
            <thead><tr className="border-b dark:border-white/10 text-slate-500"><th className="py-2 pr-3">Módulo</th><th className="py-2 pr-3">Registry</th><th className="py-2 pr-3">Situação</th><th className="py-2 pr-3">Fronteira de dados</th><th className="py-2">Proteção / próximo gate</th></tr></thead>
            <tbody>{sagbModuleBoundaries.map((mod) => <tr key={mod.name} className="border-b border-slate-100 dark:border-white/10 text-slate-700 dark:text-slate-300"><td className="py-2 pr-3 font-bold">{mod.name}</td><td className="py-2 pr-3">{mod.registered ? 'Sim' : 'Não'}</td><td className="py-2 pr-3">{mod.custody.replaceAll('_',' ')}</td><td className="py-2 pr-3">{mod.dataBoundary}</td><td className="py-2">{mod.note}</td></tr>)}</tbody>
          </table>
        </div>
      </section>

      <div className="border-t border-slate-200 dark:border-white/10 pt-4">
        <h2 className="text-lg font-black text-slate-950 dark:text-white">Inventário legado de tabelas dos módulos SagB</h2>
        <p className="mt-1 text-xs text-slate-500">Os itens a seguir vêm de código/migrations do próprio SagB; a contagem HEAD consulta exclusivamente o Supabase operacional configurado nesta aplicação, nunca as duas incubadoras. Ausência de permissão não significa tabela inexistente.</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-7 gap-3">
        {[
          ['Assets mapeados', String(assets.length)],
          ['Inferidas', String(inferred)],
          ['Validadas', String(validated)],
          ['Registros conhecidos', String(totalKnownRecords)],
          ['Sem permissão', String(noPermission)],
          ['Erros', String(readErrors)],
          ['Última verificação', lastCheck === 'não executada' ? 'pendente' : 'realizada']
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0F172A] p-3">
            <p className="text-[9px] font-black uppercase text-slate-400">{label}</p>
            <strong className="text-lg font-black text-slate-950 dark:text-white">{value}</strong>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {Object.entries(grouped).map(([moduleName, assets]) => (
          <section key={moduleName} className="rounded-[22px] border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0F172A] overflow-hidden shadow-sm">
            <header className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-white/10 px-4 py-3">
              <h2 className="text-sm font-black text-slate-950 dark:text-white">{moduleName}</h2>
              <span className="rounded-full bg-cyan-500/10 px-2 py-1 text-[9px] font-black uppercase text-cyan-600">{assets.length} itens</span>
            </header>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-white/5 text-[9px] uppercase tracking-[0.16em] text-slate-400">
                  <tr>
                    <th className="px-4 py-2">Nome</th>
                    <th className="px-4 py-2">Tipo</th>
                    <th className="px-4 py-2">Registros</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Origem</th>
                    <th className="px-4 py-2">Movimentação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                  {assets.map((asset) => (
                    <tr key={`${asset.moduleName}-${asset.tableName}`} className="text-xs text-slate-600 dark:text-slate-300">
                      <td className="px-4 py-2 font-black text-slate-900 dark:text-white">{asset.tableName}</td>
                      <td className="px-4 py-2">{asset.kind}</td>
                      <td className="px-4 py-2">{asset.recordCount ?? 'pendente'}</td>
                      <td className="px-4 py-2"><span className={`rounded-full border px-2 py-1 text-[9px] font-black uppercase ${statusStyle[asset.status]}`}>{asset.status}</span></td>
                      <td className="px-4 py-2">{asset.origin}</td>
                      <td className="px-4 py-2" title={asset.note}>{asset.movementStatus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>

      <section className="rounded-[22px] border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0F172A] p-4 shadow-sm">
        <h2 className="text-sm font-black text-slate-950 dark:text-white">Movimentações futuras</h2>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
          {supabaseMovementReadiness.map((item) => (
            <div key={item.label} className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-2">
              <strong className="block text-xs text-slate-800 dark:text-slate-100">{item.label}</strong>
              <span className="text-[10px] font-bold text-slate-500">{item.status}</span>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
};

export default MonitoramentoSupabasePage;
