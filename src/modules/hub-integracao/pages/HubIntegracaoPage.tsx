import { ModuleSidebarContent } from '../../../core/navigation/ModuleWorkspace';
import React, { useState, useEffect, useCallback } from 'react';
import { integrationHub } from '../services/integrationService';
import { Integration, ConnectionConfig, HubWhatsAppQrStatus, HubChannelView, ChannelMethodKey, HubChannel } from '../types/integration.types';
import { IntegrationCatalog } from '../components/IntegrationCatalog';
import { ConnectionManager } from '../components/ConnectionManager';
import { ConnectionTest } from '../components/ConnectionTest';
import { ActivityLog } from '../components/ActivityLog';
import { CredentialConfigModal } from '../components/CredentialConfigModal';

type ActiveTab = 'catalog' | 'connections' | 'activity';
type UiQrState = 'disconnected' | 'generating_qr' | 'awaiting_scan' | 'connected' | 'session_expired' | 'error';

export function HubIntegracaoPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('catalog');
  const [channels, setChannels] = useState<HubChannelView[]>([]);

  // Modals
  const [configuringIntegration, setConfiguringIntegration] = useState<Integration | null>(null);
  const [testingIntegration, setTestingIntegration] = useState<Integration | null>(null);

  // Stats
  const [stats, setStats] = useState({
    active: 0,
    inactive: 0,
    error: 0,
  });

  // WhatsApp QR
  const [qrSessionId] = useState('default');
  const [qrStatus, setQrStatus] = useState<HubWhatsAppQrStatus | null>(null);
  const [qrLoading, setQrLoading] = useState(false);

  const fetchIntegrations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await integrationHub.listIntegrations();
      const nextChannels = await integrationHub.getChannels('default');
      setIntegrations(data);
      setChannels(nextChannels);
      const channelStats = {
        active: nextChannels.filter((c) => c.runtime.status === 'active').length,
        inactive: nextChannels.filter((c) => c.runtime.status === 'inactive').length,
        error: nextChannels.filter((c) => c.runtime.status === 'error').length,
      };
      setStats({
        active: channelStats.active,
        inactive: channelStats.inactive,
        error: channelStats.error,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar integrações');
      console.error('[Hub] Failed to load integrations', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  const refreshQrStatus = useCallback(async () => {
    setQrLoading(true);
    try {
      const status = await integrationHub.getWhatsAppQrStatus(qrSessionId);
      setQrStatus(status);
    } catch (err) {
      console.error('[Hub][QR] Falha ao consultar status:', err);
    } finally {
      setQrLoading(false);
    }
  }, [qrSessionId]);

  useEffect(() => {
    refreshQrStatus();
  }, [refreshQrStatus]);

  useEffect(() => {
    const timer = setInterval(() => {
      void refreshQrStatus();
      void fetchIntegrations();
    }, 8000);
    return () => clearInterval(timer);
  }, [refreshQrStatus, fetchIntegrations]);

  const handleConnectQr = async () => {
    setQrLoading(true);
    try {
      const status = await integrationHub.connectWhatsAppQr(qrSessionId);
      setQrStatus(status);
      // Atualiza status após pequeno delay para capturar qr_ready
      setTimeout(() => {
        refreshQrStatus();
      }, 1200);
    } catch (err) {
      console.error('[Hub][QR] Falha ao conectar sessão QR:', err);
    } finally {
      setQrLoading(false);
    }
  };

  const handleLogoutQr = async () => {
    setQrLoading(true);
    try {
      await integrationHub.logoutWhatsAppQr(qrSessionId);
      await refreshQrStatus();
    } catch (err) {
      console.error('[Hub][QR] Falha ao encerrar sessão QR:', err);
    } finally {
      setQrLoading(false);
    }
  };

  const handleConfigure = (integration: Integration) => {
    setConfiguringIntegration(integration);
  };

  const handleTest = (integration: Integration) => {
    setTestingIntegration(integration);
  };

  const handleSaveCredentials = async (config: ConnectionConfig) => {
    await integrationHub.updateIntegrationConfig(config.integrationId, config);
    await fetchIntegrations();
  };

  const handleRunTest = async (integrationId: string): Promise<boolean> => {
    const success = await integrationHub.testConnection(integrationId);
    await fetchIntegrations();
    return success;
  };

  const handleRevoke = async (integration: Integration) => {
    // Revogar credenciais
    const confirmed = window.confirm(
      `Tem certeza que deseja revogar as credenciais de "${integration.name}"?`
    );
    if (!confirmed) return;

    try {
      // Atualiza credenciais para vazio (revoga)
      await integrationHub.updateIntegrationConfig(integration.id, {
        integrationId: integration.id,
        credentials: {},
      });
      await fetchIntegrations();
    } catch (err) {
      console.error('[Hub] Erro ao revogar:', err);
    }
  };

  const tabs: { key: ActiveTab; label: string; icon: string }[] = [
    { key: 'catalog', label: 'Canais', icon: '📦' },
    { key: 'connections', label: 'Conexões', icon: '🔗' },
    { key: 'activity', label: 'Atividades / Técnico', icon: '📋' },
  ];

  const methodLabel = (method: ChannelMethodKey) => {
    if (method === 'whatsapp_qr') return 'QR Code';
    if (method === 'whatsapp_business_api') return 'Business API';
    if (method === 'email_gmail') return 'Gmail / Google';
    if (method === 'email_titan') return 'Outro e-mail corporativo';
    return method;
  };

  const semanticStateLabel = (state?: string) => {
    switch (state) {
      case 'no_method_configured': return 'Nenhum método configurado';
      case 'method_selected': return 'Método selecionado';
      case 'method_configured': return 'Método configurado';
      case 'channel_active': return 'Canal ativo';
      case 'awaiting_scan': return 'Aguardando leitura do QR';
      default: return 'Estado pendente';
    }
  };

  const moduleLabel = (moduleId: string) => {
    if (moduleId === 'crm_ziplia') return 'CRM Ziplia';
    if (moduleId === 'taskzei') return 'TaskZei';
    return moduleId;
  };

  const resolveQrUiState = (): UiQrState => {
    if (qrLoading) return 'generating_qr';
    if (!qrStatus) return 'disconnected';
    if (qrStatus.status === 'connected') return 'connected';
    if (qrStatus.status === 'qr_ready') return 'awaiting_scan';
    if (qrStatus.status === 'logged_out') return 'session_expired';
    if (qrStatus.status === 'disconnected') return 'error';
    return 'disconnected';
  };

  const qrUiState = resolveQrUiState();

  const getQrStateMeta = () => {
    switch (qrUiState) {
      case 'disconnected':
        return {
          title: 'WhatsApp desconectado',
          description: 'Conecte sua sessão para habilitar envio e recebimento no canal.',
          cta: 'Conectar via QR Code',
        };
      case 'generating_qr':
        return {
          title: 'Gerando QR Code',
          description: 'Aguarde alguns segundos enquanto preparamos o novo código.',
          cta: 'Gerando...',
        };
      case 'awaiting_scan':
        return {
          title: 'Aguardando escaneamento',
          description: 'Escaneie o QR Code no WhatsApp para concluir a conexão.',
          cta: 'Aguardando scan',
        };
      case 'connected':
        return {
          title: 'Sessão conectada',
          description: 'Canal pronto para mensagens inbound e outbound.',
          cta: 'Desconectar',
        };
      case 'session_expired':
        return {
          title: 'Sessão expirada',
          description: 'Sua sessão expirou. Gere um novo QR Code para reconectar.',
          cta: 'Gerar novo QR Code',
        };
      default:
        return {
          title: 'Erro na sessão',
          description: 'Não foi possível validar a sessão atual. Tente novamente.',
          cta: 'Tentar novamente',
        };
    }
  };

  const handleSetPreferredMethod = async (channel: HubChannel, method: ChannelMethodKey) => {
    await integrationHub.setPreferredMethod(channel, method, 'default');
    await fetchIntegrations();
  };

  const handleSetModuleBinding = async (module: string, channel: HubChannel, method: ChannelMethodKey) => {
    await integrationHub.setModuleBinding(module, channel, method, 'default');
    await fetchIntegrations();
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-[#0B0F19]">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Hub de Integrações
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Gerenciamento centralizado de conexões e credenciais
            </p>
          </div>
          <button
            onClick={fetchIntegrations}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 transition-colors"
          >
            {loading ? 'Sincronizando status...' : 'Sincronizar status'}
          </button>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-sm text-gray-500 dark:text-gray-400">Ativas</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.active}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600" />
              <span className="text-sm text-gray-500 dark:text-gray-400">Inativas</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.inactive}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-sm text-gray-500 dark:text-gray-400">Erro</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.error}</p>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Tabs */}
        <ModuleSidebarContent><div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div></ModuleSidebarContent>

        {/* Tab Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          {loading && integrations.length === 0 ? (
            <div className="text-gray-500 text-sm py-8 text-center">Carregando integrações...</div>
          ) : activeTab === 'catalog' ? (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Canais
              </h2>

              <div className="space-y-4">
                {channels.map((channelView) => (
                  <div key={channelView.config.channel} className="border rounded-lg p-4 border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{channelView.config.displayName}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Estado operacional: {channelView.runtime.status} · {semanticStateLabel(String(channelView.runtime.metadata?.semanticState || ''))}</p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700">Método atual: {methodLabel(channelView.runtime.currentMethod)}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {channelView.methods.map((method) => (
                        <button
                          key={method.id}
                          onClick={() => handleSetPreferredMethod(channelView.config.channel, method.method)}
                          className={`text-left border rounded-md p-3 ${channelView.config.preferredMethod === method.method ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'}`}
                        >
                          <div className="font-medium text-sm text-gray-900 dark:text-white">{methodLabel(method.method)}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {channelView.config.preferredMethod === method.method ? 'Método em uso' : 'Selecionar método'}
                          </div>
                        </button>
                      ))}
                    </div>

                    {channelView.config.channel === 'whatsapp' && channelView.config.preferredMethod === 'whatsapp_qr' && (
                      <div className="mt-4 rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-gray-50/60 dark:bg-gray-900/20">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{getQrStateMeta().title}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{getQrStateMeta().description}</p>
                            <p className="text-[11px] text-gray-400 mt-2">Sessão: {qrStatus?.sessionId || qrSessionId}</p>
                            {qrUiState === 'connected' && (
                              <>
                                <p className="text-[11px] text-gray-500 mt-1">Conta conectada: {qrStatus?.connectedAccount || 'N/D'}</p>
                                <p className="text-[11px] text-gray-500">Última atualização: {qrStatus?.updatedAt ? new Date(qrStatus.updatedAt).toLocaleString('pt-BR') : 'N/D'}</p>
                                <p className="text-[11px] text-gray-500">Saúde da sessão: {qrStatus?.status || 'N/D'}</p>
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {(qrUiState === 'disconnected' || qrUiState === 'session_expired' || qrUiState === 'error') && (
                              <button
                                onClick={handleConnectQr}
                                disabled={qrLoading}
                                className="px-3 py-1.5 text-xs font-semibold rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                              >
                                {getQrStateMeta().cta}
                              </button>
                            )}
                            {qrUiState === 'connected' && (
                              <button
                                onClick={handleLogoutQr}
                                disabled={qrLoading}
                                className="px-3 py-1.5 text-xs font-semibold rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                              >
                                {getQrStateMeta().cta}
                              </button>
                            )}
                            <button
                              onClick={refreshQrStatus}
                              disabled={qrLoading}
                              className="px-3 py-1.5 text-xs rounded-md border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300"
                            >
                              Atualizar
                            </button>
                          </div>
                        </div>

                        {qrUiState === 'awaiting_scan' && qrStatus?.qrDataUrl && (
                          <div className="mt-4 flex flex-col items-center gap-2">
                            <img
                              src={qrStatus.qrDataUrl}
                              alt="QR Code do canal WhatsApp"
                              className="w-56 h-56 rounded-md border border-gray-200 dark:border-gray-700 bg-white"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                              No celular: WhatsApp → Dispositivos conectados → Conectar dispositivo.
                            </p>
                          </div>
                        )}

                        {qrUiState === 'error' && qrStatus?.lastError && (
                          <div className="mt-3 text-xs text-red-600 dark:text-red-400">Detalhe técnico: {qrStatus.lastError}</div>
                        )}
                      </div>
                    )}

                    {channelView.config.channel === 'email' && (
                      <div className="mt-4 rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-gray-50/60 dark:bg-gray-900/20">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">Canal E-mail</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {channelView.runtime.metadata?.semanticState === 'channel_active'
                            ? `Método atual: ${methodLabel(channelView.runtime.currentMethod)} · Conexão testada e ativa`
                            : channelView.runtime.metadata?.semanticState === 'method_configured'
                            ? `Método configurado: ${methodLabel(channelView.config.preferredMethod)} · Pronto para testar conexão`
                            : channelView.runtime.metadata?.semanticState === 'method_selected'
                            ? `Método selecionado: ${methodLabel(channelView.config.preferredMethod)} · Configuração pendente`
                            : 'Nenhum método configurado'}
                        </p>
                        <div className="mt-3 flex gap-2">
                          <button
                            onClick={() => {
                              const integrationId = channelView.config.preferredMethod === 'email_titan' ? 'int_titan_01' : 'int_gmail_01';
                              const selected = integrations.find(i => i.id === integrationId);
                              if (selected) setConfiguringIntegration(selected);
                            }}
                            className="px-3 py-1.5 text-xs font-semibold rounded-md bg-blue-600 text-white hover:bg-blue-700"
                          >
                            Configurar conexão de e-mail
                          </button>
                          <button
                            onClick={async () => {
                              const integrationId = channelView.config.preferredMethod === 'email_titan' ? 'int_titan_01' : 'int_gmail_01';
                              await handleRunTest(integrationId);
                            }}
                            className="px-3 py-1.5 text-xs font-semibold rounded-md bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                          >
                            Testar conexão
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Uso por módulo</p>
                      <div className="flex flex-wrap gap-2">
                        {['crm_ziplia', 'taskzei'].map((mod) => (
                          <button
                            key={mod}
                            onClick={() => handleSetModuleBinding(mod, channelView.config.channel, channelView.config.preferredMethod)}
                            className="px-3 py-1.5 text-xs rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                          >
                            {moduleLabel(mod)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : activeTab === 'connections' ? (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Gerenciar Conexões
              </h2>
              <ConnectionManager
                integrations={integrations}
                onConfigure={handleConfigure}
                onRevoke={handleRevoke}
              />
            </section>
          ) : (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Atividades Recentes
                </h2>
                <span className="text-xs text-gray-400">Últimas 50 entradas</span>
              </div>
              <ActivityLog limit={50} />
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Modo técnico (legado)</h3>
                <IntegrationCatalog integrations={integrations} onConfigure={handleConfigure} onTest={handleTest} />
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Modals */}
      {configuringIntegration && (
        <CredentialConfigModal
          integration={configuringIntegration}
          onSave={handleSaveCredentials}
          onRunTest={handleRunTest}
          onClose={() => setConfiguringIntegration(null)}
        />
      )}

      {testingIntegration && (
        <ConnectionTest
          integration={testingIntegration}
          onRunTest={handleRunTest}
          onClose={() => setTestingIntegration(null)}
        />
      )}
    </div>
  );
}
