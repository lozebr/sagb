import { useSagbSection } from '../../../core/navigation/useSagbHistory';
import React, { useEffect, useMemo, useState } from 'react';
import { crmZipliaService } from '../services/crmZipliaService';
import { CrmLead, CrmStageConfig } from '../types';
import { integrationHub } from '../../hub-integracao/services/integrationService';
import { HubInboundMessage } from '../../hub-integracao/types/integration.types';
import CrmKpiCard from '../components/CrmKpiCard';
import CrmPipelineBoard from '../components/CrmPipelineBoard';
import CrmPipelineGrid from '../components/CrmPipelineGrid';
import CrmPipelineLines from '../components/CrmPipelineLines';

const formatMoney = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format((value || 0) / 100);
};

const normalizePhone = (value?: string) => (value || '').replace(/\D/g, '');

export const CrmZipliaNativePage: React.FC = () => {
  const [activeTab, setActiveTab] = useSagbSection<'pipeline' | 'whatsapp' | 'daily' | 'dashboard-colab' | 'dashboard-gestor' | 'inbox' | 'integrations' | 'simulator' | 'differences' | 'settings'>('crm-ziplia','crmView','pipeline');
  const [viewVariant, setViewVariant] = useState<'classic' | 'modern' | 'lines'>('classic');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [stages, setStages] = useState<CrmStageConfig[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [whatsMessages, setWhatsMessages] = useState<HubInboundMessage[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string>('');
  const [composer, setComposer] = useState('');
  const [qrStatus, setQrStatus] = useState<'not_initialized' | 'initializing' | 'qr_ready' | 'connected' | 'disconnected' | 'logged_out'>('not_initialized');
  const [sending, setSending] = useState(false);
  const [leadActionLoading, setLeadActionLoading] = useState(false);

  const loadWhatsInbox = async () => {
    try {
      // 1) Pega mensagens WABA/QR (WhatsApp) e Email (hub_inbox_messages com source='email')
      // Para manter simples sem Supabase no frontend ainda, vamos pegar pelo `getInboxMessages` que lê localStorage 
      // (as rotas do Supabase devem alimentar este storage via webhook ou sync trigger).
      const [wabaMessages, qrMessages] = await Promise.all([
        integrationHub.getInboxMessages('int_waba_01', 200),
        integrationHub.getWhatsAppQrInbox('default').catch(() => [] as HubInboundMessage[]),
      ]);

      // Recupera também e-mails que o Hub salvou (mock ou reais via webhook)
      const allMessages = await integrationHub.getInboxMessages();
      const emailMessages = allMessages.filter(m => m.source === 'email' || m.source === 'webhook');

      // Merge and deduplicate by externalId
      const seen = new Set<string>();
      const merged = [...wabaMessages, ...qrMessages, ...emailMessages].filter((msg) => {
        const key = msg.externalId || msg.id;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      // Sort newest first
      merged.sort((a, b) => b.receivedAt.localeCompare(a.receivedAt));

      setWhatsMessages(merged);
      if (!selectedConversationId && merged.length > 0) {
        setSelectedConversationId(merged[0].conversationId || merged[0].from);
      }
    } catch (err) {
      console.warn('[CRM Ziplia] Falha ao carregar inbox unificada:', err);
    }
  };

  const refreshQrStatus = async () => {
    try {
      const status = await integrationHub.getWhatsAppQrStatus('default');
      setQrStatus(status.status);
    } catch (err) {
      console.warn('[CRM Ziplia] Falha ao consultar status QR:', err);
      setQrStatus('disconnected');
    }
  };

  const load = async () => {
    try {
      setLoading(true);
      setError(null);

      const [nextLeads, nextStages] = await Promise.all([
        crmZipliaService.getLeads(),
        crmZipliaService.getStages()
      ]);

      setLeads(nextLeads);
      setStages(nextStages);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao carregar CRM Ziplia';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (activeTab !== 'whatsapp' && activeTab !== 'inbox') return;

    // Register listener FIRST (before loading) to avoid race condition
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<HubInboundMessage>).detail;
      // Removendo filtro de "apenas whatsapp" para captar webhook/emails
      if (!detail) return;
      setWhatsMessages((prev) => {
        if (prev.some((m) => m.id === detail.id)) return prev; // avoid duplicates
        return [detail, ...prev];
      });
      const conv = detail.conversationId || detail.from;
      setSelectedConversationId((current) => current || conv);
    };

    window.addEventListener('hub:inbound-message', handler);

    // Then load existing messages
    loadWhatsInbox();
    refreshQrStatus();

    return () => window.removeEventListener('hub:inbound-message', handler);
  }, [activeTab]);

  const kpis = useMemo(() => {
    const stageProb = new Map(stages.map((s) => [s.status, s.probability]));
    const projected = leads.reduce((acc, lead) => acc + lead.projectedCommission, 0);
    const probable = leads.reduce((acc, lead) => {
      return acc + lead.projectedCommission * (stageProb.get(lead.status) ?? 0);
    }, 0);
    const openLeads = leads.filter((lead) => lead.status !== 'Fechado ganho' && lead.status !== 'Fechado perdido').length;

    return { projected, probable, openLeads };
  }, [leads, stages]);

  const filteredLeads = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return leads;
    return leads.filter((lead) =>
      lead.name.toLowerCase().includes(q) || lead.company.toLowerCase().includes(q)
    );
  }, [leads, searchQuery]);

  const tabItems: Array<{ id: typeof activeTab; label: string }> = [
    { id: 'pipeline', label: 'Pipeline' },
    { id: 'inbox', label: 'Inbox Unificada' },
    { id: 'whatsapp', label: 'WhatsApp (Legacy)' },
    { id: 'daily', label: 'Lista do Dia' },
    { id: 'dashboard-colab', label: 'Dashboard Colab' },
    { id: 'dashboard-gestor', label: 'Dashboard Gestor' },
    { id: 'integrations', label: 'Integrações' },
    { id: 'simulator', label: 'Simulador' },
    { id: 'differences', label: 'Diferenças' },
    { id: 'settings', label: 'Configurações' }
  ];

  const conversations = useMemo(() => {
    const map = new Map<string, { id: string; title: string; lastMessage: string; unread: number; timestamp: string }>();
    for (const msg of whatsMessages) {
      const id = msg.conversationId || msg.from;
      const existing = map.get(id);
      if (!existing) {
        map.set(id, {
          id,
          title: msg.fromName || msg.from,
          lastMessage: msg.content,
          unread: msg.status === 'pending' ? 1 : 0,
          timestamp: msg.receivedAt,
        });
      } else {
        if (msg.status === 'pending') existing.unread += 1;
        // Update lastMessage and timestamp if this message is newer
        if (msg.receivedAt > existing.timestamp) {
          existing.lastMessage = msg.content;
          existing.timestamp = msg.receivedAt;
          if (msg.fromName) existing.title = msg.fromName;
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [whatsMessages]);

  const selectedMessages = useMemo(() => {
    if (!selectedConversationId) return [];
    return whatsMessages
      .filter((m) => (m.conversationId || m.from) === selectedConversationId)
      .sort((a, b) => a.receivedAt.localeCompare(b.receivedAt));
  }, [whatsMessages, selectedConversationId]);

  const leadsByPhone = useMemo(() => {
    const map = new Map<string, CrmLead>();
    leads.forEach((lead) => {
      const key = normalizePhone(lead.phone);
      if (key) map.set(key, lead);
    });
    return map;
  }, [leads]);

  const selectedConversationPhone = useMemo(() => normalizePhone(selectedConversationId), [selectedConversationId]);
  const linkedLead = useMemo(() => {
    if (!selectedConversationPhone) return null;
    return leadsByPhone.get(selectedConversationPhone) || null;
  }, [leadsByPhone, selectedConversationPhone]);

  const followUpPlaybook = useMemo(() => {
    if (!linkedLead) return [];
    const isEmail = selectedConversationId?.includes('@');
    
    if (isEmail) {
      switch (linkedLead.status) {
        case 'Lead captado':
          return ['Responder introdução institucional', 'Enviar material em anexo', 'Sugerir call de 15 min na assinatura'];
        case 'Proposta enviada':
          return ['Cobrar retorno educadamente (Email D+2)', 'Solicitar agenda para revisão técnica', 'Checar abertura via rastreio se possível'];
        default:
          return ['Manter formalidade', 'Sempre registrar em thread', 'Incluir call-to-action clara no final'];
      }
    } else {
      switch (linkedLead.status) {
        case 'Lead captado':
          return ['Qualificar necessidade em até 15 min', 'Confirmar canal preferencial', 'Agendar próxima ação hoje'];
        case 'Qualificado':
          return ['Enviar prova social', 'Oferecer janela de reunião', 'Registrar objeções no CRM'];
        case 'Reunião marcada':
          return ['Confirmar presença 1h antes', 'Enviar pauta curta', 'Preparar proposta base'];
        case 'Reunião feita':
          return ['Enviar resumo da reunião', 'Mandar proposta até D+1', 'Definir data de follow-up'];
        case 'Proposta enviada':
          return ['Checar recebimento da proposta', 'Mapear bloqueadores', 'Puxar decisão por data'];
        case 'Negociação':
          return ['Trabalhar objeção principal', 'Negociar escopo/preço', 'Fechar próximo passo em ata'];
        default:
          return ['Manter histórico e registrar próximos passos'];
      }
    }
  }, [linkedLead, selectedConversationId]);

  const handleSelectConversation = async (conversationId: string) => {
    setSelectedConversationId(conversationId);
    const pending = whatsMessages.filter(
      (m) => (m.conversationId || m.from) === conversationId && m.status === 'pending'
    );
    await Promise.allSettled(pending.map((m) => integrationHub.markAsRead(m.id)));
    await loadWhatsInbox();
  };

  const handleSendFromComposer = async () => {
    const message = composer.trim();
    if (!message || !selectedConversationId) return;
    setSending(true);
    try {
      const isEmail = selectedConversationId.includes('@');

      if (isEmail) {
        // Obter provider original da mensagem (pode ser gmail ou titan)
        const currentMsgs = whatsMessages.filter(m => m.conversationId === selectedConversationId || m.from === selectedConversationId);
        const provider = currentMsgs.length > 0 && currentMsgs[0].integrationId.includes('titan') ? 'titan' : 'gmail';

        await integrationHub.sendEmail({
          provider: provider as any,
          from: 'me', // O backend resolve via credenciais
          to: [selectedConversationId],
          subject: currentMsgs.length > 0 && currentMsgs[0].metadata?.subject 
            ? `Re: ${currentMsgs[0].metadata.subject}` 
            : 'Contato via CRM Ziplia',
          textBody: message,
        });
      } else {
        await integrationHub.sendChannelMessage({
          channel: 'whatsapp',
          to: selectedConversationId,
          message,
          module: 'crm_ziplia',
          workspaceId: 'default',
        });
      }
      setComposer('');
      await loadWhatsInbox();
    } catch (err) {
      console.error('[CRM Ziplia] Falha ao enviar mensagem:', err);
    } finally {
      setSending(false);
    }
  };

  const handleLinkLeadFollowUp = async () => {
    if (!linkedLead) return;
    setLeadActionLoading(true);
    try {
      const nextActionDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      await crmZipliaService.updateLead(linkedLead.id, {
        lastContact: new Date().toISOString(),
        nextAction: 'Follow-up WhatsApp CRM',
        nextActionDate,
      });
      await load();
    } catch (err) {
      console.error('[CRM Ziplia] Falha ao atualizar follow-up do lead:', err);
    } finally {
      setLeadActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-sagb-bg text-gray-900 dark:text-sagb-text overflow-hidden">
      <div className="h-full w-full flex">
        <aside data-sagb-native-sidebar className="w-72 bg-white dark:bg-sagb-card border-r border-slate-200 dark:border-sagb-border flex flex-col p-5">
          <div className="mb-6">
            <p className="text-[10px] uppercase tracking-[0.25em] font-black text-gray-400">Ziplia CRM</p>
            <h1 className="text-2xl font-black tracking-tight">Performance AI</h1>
          </div>

          <nav className="flex-1 overflow-auto space-y-1">
            {tabItems.map((item) => {
              const active = item.id === activeTab;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    active
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100 dark:hover:bg-sagb-bg'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          <button
            onClick={() => window.dispatchEvent(new CustomEvent('sagb:navigate', { detail: 'home' }))}
            className="mt-4 px-4 py-2 rounded-lg border border-gray-300 dark:border-sagb-border hover:bg-white dark:hover:bg-sagb-bg text-sm font-semibold"
          >
            Voltar ao SagB
          </button>
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="h-20 shrink-0 px-6 bg-white/90 dark:bg-sagb-card/90 backdrop-blur border-b border-slate-200 dark:border-sagb-border flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-black">{tabItems.find((t) => t.id === activeTab)?.label || 'CRM Ziplia'}</h2>
              {activeTab === 'pipeline' && (
                <div className="flex rounded-xl bg-slate-100 dark:bg-sagb-bg p-1">
                  <button
                    onClick={() => setViewVariant('classic')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold ${viewVariant === 'classic' ? 'bg-white dark:bg-sagb-card text-indigo-700' : 'text-slate-500'}`}
                  >
                    Kanban
                  </button>
                  <button
                    onClick={() => setViewVariant('modern')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold ${viewVariant === 'modern' ? 'bg-white dark:bg-sagb-card text-indigo-700' : 'text-slate-500'}`}
                  >
                    Grid
                  </button>
                  <button
                    onClick={() => setViewVariant('lines')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold ${viewVariant === 'lines' ? 'bg-white dark:bg-sagb-card text-indigo-700' : 'text-slate-500'}`}
                  >
                    Linhas
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar leads, empresas..."
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-sagb-border bg-slate-50 dark:bg-sagb-bg text-sm w-72"
              />
              <button
                onClick={load}
                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-sagb-border text-xs font-bold hover:bg-white dark:hover:bg-sagb-bg"
              >
                Recarregar
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-auto p-6">
            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-5 mb-6">
                <p className="text-sm font-bold text-red-700">Falha ao carregar CRM nativo</p>
                <p className="text-sm text-red-600 mt-1">{error}</p>
                <button
                  onClick={load}
                  className="mt-3 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold"
                >
                  Tentar novamente
                </button>
              </div>
            ) : null}

            {(activeTab === 'pipeline' || activeTab === 'dashboard-colab' || activeTab === 'dashboard-gestor') && (
              <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <CrmKpiCard label="Projetado" value={formatMoney(kpis.projected)} helper="Soma da comissão projetada" />
                <CrmKpiCard label="Provável" value={formatMoney(kpis.probable)} helper="Aplicando probabilidade por estágio" />
                <CrmKpiCard label="Leads em aberto" value={String(kpis.openLeads)} helper="Exclui ganhos e perdas" />
              </section>
            )}

            {activeTab === 'pipeline' && (
              <section>
                {viewVariant === 'classic' && <CrmPipelineBoard leads={filteredLeads} stages={stages} loading={loading} />}
                {viewVariant === 'modern' && <CrmPipelineGrid leads={filteredLeads} stages={stages} loading={loading} />}
                {viewVariant === 'lines' && <CrmPipelineLines leads={filteredLeads} stages={stages} loading={loading} />}
              </section>
            )}

            {activeTab === 'whatsapp' && (
              <section className="rounded-2xl border border-slate-200 dark:border-sagb-border bg-white dark:bg-sagb-card overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200 dark:border-sagb-border flex items-center justify-between">
                  <div className="text-sm font-semibold">Canal WhatsApp CRM</div>
                  <span className={`text-xs px-2 py-1 rounded-full ${qrStatus === 'connected' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    Sessão: {qrStatus}
                  </span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] min-h-[460px]">
                  <aside className="border-r border-slate-200 dark:border-sagb-border overflow-y-auto">
                    {conversations.length === 0 ? (
                      <p className="text-sm text-slate-500 p-4">Sem conversas ainda.</p>
                    ) : (
                      conversations.map((conv) => (
                        <button
                          key={conv.id}
                          onClick={() => handleSelectConversation(conv.id)}
                          className={`w-full text-left px-4 py-3 border-b border-slate-100 dark:border-sagb-border/40 ${selectedConversationId === conv.id ? 'bg-indigo-50 dark:bg-sagb-bg' : 'hover:bg-slate-50 dark:hover:bg-sagb-bg/40'}`}
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-slate-800 dark:text-sagb-text">{conv.title}</p>
                            {conv.unread > 0 && <span className="text-[11px] bg-red-500 text-white rounded-full px-2 py-0.5">{conv.unread}</span>}
                          </div>
                          <p className="text-xs text-slate-500 truncate mt-1">{conv.lastMessage}</p>
                        </button>
                      ))
                    )}
                  </aside>
                  <div className="flex flex-col lg:grid lg:grid-cols-[1fr_300px]">
                    <div className="flex-1 p-4 space-y-3 overflow-y-auto bg-slate-50/60 dark:bg-sagb-bg/40">
                      {selectedMessages.length === 0 ? (
                        <p className="text-sm text-slate-500">Selecione uma conversa para visualizar as mensagens.</p>
                      ) : (
                        selectedMessages.map((msg) => {
                          const outbound = msg.from === 'me' || msg.metadata?.direction === 'outbound';
                          return (
                            <div key={msg.id} className={`max-w-[78%] px-3 py-2 rounded-xl text-sm ${outbound ? 'ml-auto bg-indigo-600 text-white' : 'bg-white dark:bg-sagb-card border border-slate-200 dark:border-sagb-border text-slate-800 dark:text-sagb-text'}`}>
                              <p>{msg.content}</p>
                              <p className={`text-[11px] mt-1 ${outbound ? 'text-indigo-100' : 'text-slate-400'}`}>{new Date(msg.receivedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                          );
                        })
                      )}
                    </div>
                    <aside className="border-l border-slate-200 dark:border-sagb-border bg-white dark:bg-sagb-card p-4 space-y-3">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-sagb-text">Vínculo com Lead</h4>
                      {linkedLead ? (
                        <>
                          <div className="text-xs text-slate-500">Lead encontrado</div>
                          <div className="rounded-lg border border-slate-200 dark:border-sagb-border p-3">
                            <p className="text-sm font-semibold">{linkedLead.name}</p>
                            <p className="text-xs text-slate-500">{linkedLead.company}</p>
                            <p className="text-xs text-slate-500 mt-1">Estágio: {linkedLead.status}</p>
                          </div>
                          <button
                            onClick={handleLinkLeadFollowUp}
                            disabled={leadActionLoading}
                            className="w-full px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold"
                          >
                            {leadActionLoading ? 'Atualizando...' : 'Atualizar Follow-up no Lead'}
                          </button>
                          <div className="rounded-lg border border-dashed border-slate-300 dark:border-sagb-border p-3">
                            <p className="text-xs font-semibold mb-2">Playbook recomendado</p>
                            <ul className="list-disc pl-4 text-xs text-slate-600 dark:text-sagb-muted space-y-1">
                              {followUpPlaybook.map((item) => (
                                <li key={item}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        </>
                      ) : (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
                          Nenhum lead com telefone {selectedConversationPhone || 'N/D'}. Cadastre/vincule esse número no pipeline para ativar automações.
                        </div>
                      )}
                    </aside>
                    <div className="lg:col-span-2 border-t border-slate-200 dark:border-sagb-border p-3 flex items-end gap-2">
                      <textarea
                        value={composer}
                        onChange={(e) => setComposer(e.target.value)}
                        placeholder="Digite sua resposta..."
                        className="flex-1 min-h-[42px] max-h-28 px-3 py-2 rounded-lg border border-slate-300 dark:border-sagb-border bg-white dark:bg-sagb-bg text-sm"
                      />
                      <button
                        onClick={handleSendFromComposer}
                        disabled={sending || !composer.trim() || !selectedConversationId}
                        className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold"
                      >
                        {sending ? 'Enviando...' : 'Enviar'}
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'inbox' && (
              <section className="rounded-2xl border border-slate-200 dark:border-sagb-border bg-white dark:bg-sagb-card overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200 dark:border-sagb-border flex items-center justify-between">
                  <div className="text-sm font-semibold">Inbox Unificada (WhatsApp + Email)</div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-sagb-bg">
                      {conversations.length} conversas
                    </span>
                    <button
                      onClick={() => loadWhatsInbox()}
                      className="text-xs text-indigo-600 hover:underline"
                    >
                      Sincronizar
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] min-h-[500px]">
                  <aside className="border-r border-slate-200 dark:border-sagb-border overflow-y-auto">
                    {conversations.length === 0 ? (
                      <p className="text-sm text-slate-500 p-4">Sua inbox está limpa.</p>
                    ) : (
                      conversations.map((conv) => {
                        // Identifica a fonte pelo ID da conversa (heurística simples)
                        const isEmail = conv.id.includes('@');
                        const SourceIcon = isEmail ? '📧' : '💬';
                        
                        return (
                          <button
                            key={conv.id}
                            onClick={() => handleSelectConversation(conv.id)}
                            className={`w-full text-left px-4 py-3 border-b border-slate-100 dark:border-sagb-border/40 transition-colors ${selectedConversationId === conv.id ? 'bg-indigo-50 dark:bg-sagb-bg border-l-4 border-l-indigo-500' : 'hover:bg-slate-50 dark:hover:bg-sagb-bg/40 border-l-4 border-l-transparent'}`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-semibold text-slate-800 dark:text-sagb-text flex items-center gap-1.5 truncate">
                                <span>{SourceIcon}</span>
                                <span className="truncate">{conv.title}</span>
                              </p>
                              {conv.unread > 0 && <span className="shrink-0 text-[10px] font-bold bg-indigo-500 text-white rounded-full px-1.5 py-0.5">{conv.unread}</span>}
                            </div>
                            <p className="text-xs text-slate-500 truncate">{conv.lastMessage}</p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium">{new Date(conv.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                          </button>
                        );
                      })
                    )}
                  </aside>
                  <div className="flex flex-col lg:grid lg:grid-cols-[1fr_300px]">
                    <div className="flex-1 flex flex-col h-[500px]">
                      <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-slate-50/60 dark:bg-[#0B0F19]">
                        {selectedMessages.length === 0 ? (
                          <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                            Selecione uma conversa para visualizar
                          </div>
                        ) : (
                          selectedMessages.map((msg) => {
                            const outbound = msg.from === 'me' || msg.metadata?.direction === 'outbound';
                            const isEmail = msg.source === 'email' || msg.source === 'webhook';
                            
                            return (
                              <div key={msg.id} className={`max-w-[85%] flex flex-col ${outbound ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                                <div className={`px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed shadow-sm ${
                                  outbound 
                                    ? 'bg-indigo-600 text-white rounded-br-none' 
                                    : 'bg-white dark:bg-sagb-card border border-slate-200 dark:border-gray-800 text-slate-700 dark:text-gray-300 rounded-bl-none'
                                }`}>
                                  {isEmail && msg.metadata?.subject && (
                                    <div className={`font-bold mb-1.5 pb-1.5 border-b ${outbound ? 'border-indigo-500/50' : 'border-slate-100 dark:border-gray-700'}`}>
                                      Assunto: {msg.metadata.subject}
                                    </div>
                                  )}
                                  <p className="whitespace-pre-wrap">{msg.content}</p>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1 px-1 font-medium flex items-center gap-1">
                                  {new Date(msg.receivedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                  {isEmail && <span>via Email</span>}
                                </p>
                              </div>
                            );
                          })
                        )}
                      </div>
                      
                      {/* Composer unificado */}
                      <div className="border-t border-slate-200 dark:border-sagb-border bg-white dark:bg-sagb-card p-3">
                        <div className="flex flex-col gap-2">
                          <textarea
                            value={composer}
                            onChange={(e) => setComposer(e.target.value)}
                            placeholder={selectedConversationId?.includes('@') ? "Escreva seu e-mail de resposta..." : "Digite sua mensagem de WhatsApp..."}
                            className="w-full min-h-[60px] max-h-32 p-3 rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-[#0B0F19] text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-y"
                          />
                          <div className="flex justify-between items-center px-1">
                            <span className="text-[11px] text-slate-400 font-medium">
                              Enviando para: {selectedConversationId || 'Ninguém selecionado'}
                            </span>
                            <button
                              onClick={handleSendFromComposer}
                              disabled={sending || !composer.trim() || !selectedConversationId}
                              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white text-[13px] font-bold shadow-sm transition-all flex items-center gap-2"
                            >
                              {sending ? (
                                <>
                                  <svg className="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                  Processando
                                </>
                              ) : 'Enviar Resposta'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Lateral direita - Vínculo Lead */}
                    <aside className="border-l border-slate-200 dark:border-sagb-border bg-slate-50/30 dark:bg-sagb-card p-5 space-y-5 h-[500px] overflow-y-auto">
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-gray-500 mb-3">Vínculo de Lead</h4>
                        {linkedLead ? (
                          <div className="space-y-3">
                            <div className="rounded-xl border border-indigo-100 bg-white dark:bg-gray-800 dark:border-gray-700 p-4 shadow-sm">
                              <p className="text-sm font-bold text-slate-900 dark:text-white mb-0.5">{linkedLead.name}</p>
                              <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mb-2">{linkedLead.company}</p>
                              <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-100 dark:border-gray-700">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                <span className="text-[11px] font-semibold text-slate-600 dark:text-gray-300">{linkedLead.status}</span>
                              </div>
                            </div>
                            
                            <button
                              onClick={handleLinkLeadFollowUp}
                              disabled={leadActionLoading}
                              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-gray-700 bg-white hover:bg-slate-50 dark:bg-gray-800 dark:hover:bg-gray-700 disabled:opacity-50 text-slate-700 dark:text-gray-200 text-xs font-bold shadow-sm transition-all"
                            >
                              {leadActionLoading ? 'Atualizando...' : 'Registrar Follow-up Hoje'}
                            </button>
                          </div>
                        ) : (
                          <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50/50 dark:bg-amber-900/10 dark:border-amber-800/30 p-4 text-center">
                            <p className="text-[11px] font-medium text-amber-700 dark:text-amber-500">
                              Nenhum lead encontrado para o contato:<br/>
                              <strong className="mt-1 block">{selectedConversationPhone || selectedConversationId || 'N/D'}</strong>
                            </p>
                          </div>
                        )}
                      </div>

                      {linkedLead && followUpPlaybook.length > 0 && (
                        <div>
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-gray-500 mb-3">Playbook Ativo</h4>
                          <div className="rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                            <ul className="space-y-2.5">
                              {followUpPlaybook.map((item, idx) => (
                                <li key={idx} className="flex gap-2.5 items-start">
                                  <div className="shrink-0 w-4 h-4 rounded-full bg-slate-100 dark:bg-gray-700 flex items-center justify-center mt-0.5">
                                    <span className="text-[9px] font-bold text-slate-500 dark:text-gray-400">{idx + 1}</span>
                                  </div>
                                  <span className="text-xs font-medium text-slate-600 dark:text-gray-300 leading-snug">{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </aside>
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'settings' && (
              <section className="rounded-2xl border border-slate-200 dark:border-sagb-border bg-white dark:bg-sagb-card p-6">
                <h3 className="text-base font-bold mb-3">Checklist Go-live WhatsApp CRM</h3>
                <ul className="space-y-2 text-sm text-slate-700 dark:text-sagb-text">
                  <li>✅ Sessão WhatsApp em estado conectado</li>
                  <li>✅ Inbox recebendo mensagens novas</li>
                  <li>✅ Envio pelo composer com confirmação</li>
                  <li>✅ Conversa vinculada a lead por telefone</li>
                  <li>✅ Follow-up atualizado no lead</li>
                </ul>
              </section>
            )}

            {activeTab !== 'pipeline' && activeTab !== 'whatsapp' && activeTab !== 'inbox' && activeTab !== 'settings' && activeTab !== 'daily' && activeTab !== 'integrations' && activeTab !== 'simulator' && activeTab !== 'differences' && (
              <section className="rounded-2xl border border-dashed border-slate-300 p-8 text-center bg-white dark:bg-sagb-card">
                <p className="text-sm text-slate-500">
                  Aba <span className="font-bold">{tabItems.find((t) => t.id === activeTab)?.label}</span> mapeada para paridade real e próxima da implementação.
                </p>
              </section>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default CrmZipliaNativePage;
