import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircleIcon,
  BackIcon,
  CurrencyDollarIcon,
  FilterIcon,
  PlayIcon,
  PlusIcon,
  SearchIcon,
  ShieldCheckIcon
} from '../../../../components/Icon';
import { bankService } from '../services/bankIntegrationService';
import { financeService } from '../services/financeService';
import {
  FinanceDashboardReport,
  PlanoConta,
  TipoTransacaoFinanceira,
  TransacaoFinanceira
} from '../types/finance.types';

type NovaTransacaoForm = {
  tipo: TipoTransacaoFinanceira;
  descricao: string;
  valor: string;
  data_competencia: string;
  plano_conta_codigo: string;
  categoria: string;
  contraparte: string;
};

const initialForm = (): NovaTransacaoForm => ({
  tipo: 'despesa',
  descricao: '',
  valor: '',
  data_competencia: new Date().toISOString().slice(0, 10),
  plano_conta_codigo: '',
  categoria: '',
  contraparte: ''
});

export const GestaoFinanceiraPage: React.FC = () => {
  const getDefaultRange = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);
    return {
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10)
    };
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [accounts, setAccounts] = useState<PlanoConta[]>([]);
  const [transactions, setTransactions] = useState<TransacaoFinanceira[]>([]);
  const [range, setRange] = useState(getDefaultRange());
  const [dashboard, setDashboard] = useState<FinanceDashboardReport | null>(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [syncInfo, setSyncInfo] = useState<string | null>(null);
  const [form, setForm] = useState<NovaTransacaoForm>(initialForm());

  useEffect(() => {
    let active = true;

    financeService
      .listPlanoDeContas()
      .then((rows) => {
        if (active) setAccounts(rows);
      })
      .catch((error) => {
        console.error('[GestaoFinanceira] Erro ao carregar plano de contas:', error);
      });

    const unsubAccounts = financeService.subscribePlanoDeContas((rows) => {
      if (active) setAccounts(rows);
    });

    const unsubTransactions = financeService.subscribeTransacoes((rows) => {
      if (active) setTransactions(rows);
    });

    return () => {
      active = false;
      if (typeof unsubAccounts === 'function') unsubAccounts();
      if (typeof unsubTransactions === 'function') unsubTransactions();
    };
  }, []);

  useEffect(() => {
    let active = true;
    setIsLoadingDashboard(true);

    financeService
      .getDashboardReport({ startDate: range.startDate, endDate: range.endDate })
      .then((report) => {
        if (active) setDashboard(report);
      })
      .catch((error) => {
        console.error('[GestaoFinanceira] Erro ao carregar dashboard avançado:', error);
      })
      .finally(() => {
        if (active) setIsLoadingDashboard(false);
      });

    return () => {
      active = false;
    };
  }, [range.startDate, range.endDate, transactions]);

  const handleBack = () => {
    window.dispatchEvent(new CustomEvent('sagb:navigate', { detail: 'home' }));
  };

  const totals = useMemo(() => {
    if (dashboard) {
      return {
        despesas: dashboard.kpis.despesas,
        receitas: dashboard.kpis.receitas,
        saldo: dashboard.kpis.saldo
      };
    }

    const despesas = transactions
      .filter((tx) => tx.tipo === 'despesa' || tx.tipo === 'pagamento' || tx.tipo === 'taxa')
      .reduce((acc, tx) => acc + Number(tx.valor || 0), 0);

    const receitas = transactions
      .filter((tx) => tx.tipo === 'receita')
      .reduce((acc, tx) => acc + Number(tx.valor || 0), 0);

    return {
      despesas,
      receitas,
      saldo: receitas - despesas
    };
  }, [transactions, dashboard]);

  const dre = dashboard?.dre || [];
  const serieMensal = dashboard?.serieMensal || [];
  const topCategorias = dashboard?.topCategoriasDespesa || [];

  const filteredTransactions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return transactions;

    return transactions.filter((tx) => {
      const values = [
        tx.descricao,
        tx.tipo,
        tx.status,
        tx.categoria,
        tx.contraparte,
        tx.plano_conta_codigo,
        tx.referencia_externa
      ]
        .filter(Boolean)
        .map((v) => String(v).toLowerCase());

      return values.some((v) => v.includes(term));
    });
  }, [transactions, searchTerm]);

  const saveManualTransaction = async () => {
    setFormError(null);
    setFormSuccess(null);

    const amount = Number(form.valor);
    if (!form.descricao.trim()) {
      setFormError('Descrição é obrigatória.');
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setFormError('Informe um valor válido maior que zero.');
      return;
    }
    if (!form.data_competencia) {
      setFormError('Data de competência é obrigatória.');
      return;
    }

    setIsSaving(true);
    try {
      await financeService.createTransacao({
        origem: 'manual',
        tipo: form.tipo,
        status: form.tipo === 'pagamento' ? 'pago' : 'pendente',
        descricao: form.descricao.trim(),
        valor: amount,
        data_competencia: form.data_competencia,
        plano_conta_codigo: form.plano_conta_codigo || null,
        categoria: form.categoria || null,
        contraparte: form.contraparte || null,
        metadata: { source: 'gestao_financeira_ui' }
      });

      setForm(initialForm());
      setFormSuccess('Transação registrada com sucesso.');
    } catch (error) {
      console.error('[GestaoFinanceira] Falha ao salvar transação manual:', error);
      setFormError('Falha ao salvar transação. Verifique a conexão com o Supabase.');
    } finally {
      setIsSaving(false);
    }
  };

  const syncBankTransactions = async () => {
    setSyncInfo(null);
    setIsSyncing(true);
    try {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 30);

      const result = await bankService.syncTransactions(start, end, 'bank-api');
      setSyncInfo(`Sincronização concluída: ${result.length} transações processadas.`);
    } catch (error) {
      console.error('[GestaoFinanceira] Falha no sync bancário:', error);
      setSyncInfo('Falha na sincronização bancária. Verifique configuração da integração.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-white dark:bg-[#0B0F19] text-gray-900 dark:text-gray-100 font-sans overflow-hidden">
      <header className="h-16 px-8 flex items-center justify-between border-b border-gray-100 dark:border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <CurrencyDollarIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Gestão Financeira</h1>
            <p className="text-[10px] text-gray-400 uppercase font-black tracking-[0.2em]">Yasmin Rangel • Despesas, Pagamentos e Conciliação</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={syncBankTransactions}
            disabled={isSyncing}
            className="px-3 py-2 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider hover:bg-blue-100 transition-all disabled:opacity-60"
          >
            <span className="inline-flex items-center gap-2">
              <PlayIcon className="w-4 h-4" />
              {isSyncing ? 'Sincronizando...' : 'Sync Bancário'}
            </span>
          </button>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar transação..."
              className="pl-10 pr-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/20 transition-all w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto custom-scrollbar p-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-1 bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-white/10 shadow-xl p-5 h-fit">
            <h2 className="text-sm font-black uppercase tracking-wider text-gray-700 dark:text-gray-200 mb-4">Cadastro de Despesa/Pagamento</h2>

            {(formError || formSuccess) && (
              <div className={`mb-3 rounded-lg border px-3 py-2 text-[11px] font-bold flex items-center gap-2 ${formError ? 'bg-red-50 text-red-700 border-red-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
                <AlertCircleIcon className="w-4 h-4" />
                {formError || formSuccess}
              </div>
            )}

            {syncInfo && (
              <div className="mb-3 rounded-lg border px-3 py-2 text-[11px] font-bold flex items-center gap-2 bg-blue-50 text-blue-700 border-blue-100">
                <ShieldCheckIcon className="w-4 h-4" />
                {syncInfo}
              </div>
            )}

            <div className="space-y-3">
              <label className="block text-[11px] font-bold uppercase text-gray-500">
                Tipo
                <select
                  value={form.tipo}
                  onChange={(e) => setForm((prev) => ({ ...prev, tipo: e.target.value as TipoTransacaoFinanceira }))}
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none"
                >
                  <option value="despesa">Despesa</option>
                  <option value="pagamento">Pagamento</option>
                  <option value="receita">Receita</option>
                  <option value="taxa">Taxa</option>
                </select>
              </label>

              <label className="block text-[11px] font-bold uppercase text-gray-500">
                Descrição
                <input
                  value={form.descricao}
                  onChange={(e) => setForm((prev) => ({ ...prev, descricao: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none"
                  placeholder="Ex.: Pagamento fornecedor XYZ"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block text-[11px] font-bold uppercase text-gray-500">
                  Valor
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.valor}
                    onChange={(e) => setForm((prev) => ({ ...prev, valor: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none"
                    placeholder="0,00"
                  />
                </label>

                <label className="block text-[11px] font-bold uppercase text-gray-500">
                  Competência
                  <input
                    type="date"
                    value={form.data_competencia}
                    onChange={(e) => setForm((prev) => ({ ...prev, data_competencia: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none"
                  />
                </label>
              </div>

              <label className="block text-[11px] font-bold uppercase text-gray-500">
                Plano de Conta
                <select
                  value={form.plano_conta_codigo}
                  onChange={(e) => setForm((prev) => ({ ...prev, plano_conta_codigo: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none"
                >
                  <option value="">Selecionar...</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.codigo}>
                      {account.codigo} • {account.nome}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block text-[11px] font-bold uppercase text-gray-500">
                  Categoria
                  <input
                    value={form.categoria}
                    onChange={(e) => setForm((prev) => ({ ...prev, categoria: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none"
                    placeholder="Operacional"
                  />
                </label>

                <label className="block text-[11px] font-bold uppercase text-gray-500">
                  Contraparte
                  <input
                    value={form.contraparte}
                    onChange={(e) => setForm((prev) => ({ ...prev, contraparte: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none"
                    placeholder="Fornecedor"
                  />
                </label>
              </div>

              <button
                onClick={saveManualTransaction}
                disabled={isSaving}
                className="w-full mt-1 px-3 py-2 rounded-xl bg-blue-600 text-white text-xs font-black uppercase tracking-wider hover:bg-blue-700 transition-all disabled:opacity-60"
              >
                <span className="inline-flex items-center gap-2">
                  <PlusIcon className="w-4 h-4" />
                  {isSaving ? 'Salvando...' : 'Registrar Transação'}
                </span>
              </button>
            </div>
          </section>

          <section className="lg:col-span-2 bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-white/10 shadow-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-white/10 bg-white dark:bg-[#111827]">
              <div className="flex flex-wrap items-center gap-3 justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-500">Dashboard Avançado • Período</h3>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={range.startDate}
                    onChange={(e) => setRange((prev) => ({ ...prev, startDate: e.target.value }))}
                    className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs"
                  />
                  <span className="text-[10px] font-bold text-gray-400 uppercase">até</span>
                  <input
                    type="date"
                    value={range.endDate}
                    onChange={(e) => setRange((prev) => ({ ...prev, endDate: e.target.value }))}
                    className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs"
                  />
                </div>
              </div>
              <div className="mt-2 text-[10px] uppercase font-bold tracking-wider text-gray-400">
                {isLoadingDashboard ? 'Atualizando métricas...' : `Período selecionado: ${range.startDate} → ${range.endDate}`}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 p-4 border-b border-gray-100 dark:border-white/10 bg-gray-50/60 dark:bg-white/5">
              <div className="rounded-xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 p-3">
                <div className="text-[10px] uppercase font-black text-gray-400">Receitas</div>
                <div className="text-lg font-black text-emerald-600">R$ {totals.receitas.toFixed(2)}</div>
              </div>
              <div className="rounded-xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 p-3">
                <div className="text-[10px] uppercase font-black text-gray-400">Despesas/Pagamentos</div>
                <div className="text-lg font-black text-rose-600">R$ {totals.despesas.toFixed(2)}</div>
              </div>
              <div className="rounded-xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 p-3">
                <div className="text-[10px] uppercase font-black text-gray-400">Saldo Projetado</div>
                <div className={`text-lg font-black ${totals.saldo >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>R$ {totals.saldo.toFixed(2)}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border-b border-gray-100 dark:border-white/10 bg-white dark:bg-[#111827]">
              <div className="rounded-xl border border-gray-100 dark:border-white/10 p-3 bg-gray-50/50 dark:bg-white/5">
                <div className="text-[10px] uppercase font-black text-gray-400 mb-2">DRE Simplificado</div>
                <div className="space-y-2">
                  {dre.map((line) => (
                    <div key={line.code} className="flex items-center justify-between text-xs">
                      <span className="font-bold text-gray-600 dark:text-gray-300">{line.label}</span>
                      <span className={`font-black ${line.valor >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        R$ {line.valor.toFixed(2)}
                      </span>
                    </div>
                  ))}
                  {!dre.length && <div className="text-xs text-gray-400">Sem dados para o período.</div>}
                </div>
              </div>

              <div className="rounded-xl border border-gray-100 dark:border-white/10 p-3 bg-gray-50/50 dark:bg-white/5">
                <div className="text-[10px] uppercase font-black text-gray-400 mb-2">Top Categorias de Despesa</div>
                <div className="space-y-2">
                  {topCategorias.map((item) => (
                    <div key={item.categoria} className="flex items-center justify-between text-xs">
                      <span className="font-bold text-gray-600 dark:text-gray-300">{item.categoria}</span>
                      <span className="font-black text-rose-600">R$ {item.total.toFixed(2)}</span>
                    </div>
                  ))}
                  {!topCategorias.length && <div className="text-xs text-gray-400">Sem despesas categorizadas no período.</div>}
                </div>
              </div>
            </div>

            <div className="p-4 border-b border-gray-100 dark:border-white/10 bg-white dark:bg-[#111827]">
              <div className="text-[10px] uppercase font-black text-gray-400 mb-2">Série Mensal (Receitas x Despesas)</div>
              <div className="space-y-2">
                {serieMensal.map((point) => (
                  <div key={point.periodo} className="grid grid-cols-4 gap-2 text-xs items-center">
                    <div className="font-bold text-gray-600 dark:text-gray-300">{point.periodo}</div>
                    <div className="text-emerald-600 font-black">R$ {point.receitas.toFixed(2)}</div>
                    <div className="text-rose-600 font-black">R$ {point.despesas.toFixed(2)}</div>
                    <div className={`font-black ${point.saldo >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>R$ {point.saldo.toFixed(2)}</div>
                  </div>
                ))}
                {!serieMensal.length && <div className="text-xs text-gray-400">Sem movimentos no período.</div>}
              </div>
            </div>

            <div className="flex items-center px-4 py-3 bg-gray-50/80 dark:bg-white/5 border-b border-gray-100 dark:border-white/10 text-[10px] uppercase font-black text-gray-400 tracking-widest">
              <div className="w-24">Tipo</div>
              <div className="flex-1">Descrição</div>
              <div className="w-28 text-center">Conta</div>
              <div className="w-24 text-center">Status</div>
              <div className="w-32 text-right">Valor</div>
              <div className="w-28 text-right">Data</div>
            </div>

            <div className="max-h-[62vh] overflow-y-auto">
              {filteredTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center px-4 py-3 border-b border-gray-50 dark:border-white/5 text-sm hover:bg-gray-50 dark:hover:bg-white/5">
                  <div className="w-24 text-[11px] uppercase font-black text-gray-500">{tx.tipo}</div>
                  <div className="flex-1 text-[13px] text-gray-700 dark:text-gray-200">{tx.descricao}</div>
                  <div className="w-28 text-center text-[11px] font-mono text-gray-500">{tx.plano_conta_codigo || '-'}</div>
                  <div className="w-24 text-center">
                    <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${tx.status === 'conciliado' ? 'bg-emerald-100 text-emerald-700' : tx.status === 'falhou' ? 'bg-rose-100 text-rose-700' : 'bg-gray-100 text-gray-600'}`}>
                      {tx.status}
                    </span>
                  </div>
                  <div className="w-32 text-right font-black text-[13px]">R$ {Number(tx.valor || 0).toFixed(2)}</div>
                  <div className="w-28 text-right text-[11px] text-gray-500">{tx.data_competencia}</div>
                </div>
              ))}

              {!filteredTransactions.length && (
                <div className="px-4 py-10 text-center text-xs text-gray-400 uppercase font-bold tracking-wider">
                  Nenhuma transação encontrada
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      <button
        onClick={handleBack}
        className="fixed bottom-8 left-8 w-14 h-14 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl shadow-2xl flex items-center justify-center group hover:scale-110 active:scale-95 transition-all z-[100]"
        title="Voltar ao SagB" aria-label="Voltar ao SagB"
      >
        <BackIcon className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
        <span className="absolute left-full ml-4 px-3 py-1.5 bg-gray-900 text-white text-[10px] font-bold rounded-lg opacity-0 whitespace-nowrap pointer-events-none group-hover:opacity-100 transition-all">
          VOLTAR AO SAGB
        </span>
      </button>

      <footer className="h-10 px-8 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/2 flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
        <div className="flex items-center gap-6">
          <span className="inline-flex items-center gap-2"><FilterIcon className="w-3 h-3" /> Registros Financeiros Ativos</span>
          <span className="text-emerald-500">Conciliação e Webhooks Habilitados</span>
        </div>
        <div>SagB Gestão Financeira v2.0 • Yasmin Rangel</div>
      </footer>
    </div>
  );
};

