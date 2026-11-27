import { PluggableModule } from './module.types';

// Módulos do core
import { cidManifest, cidRoutes } from '../../modules/cid';
import { apiSagbManifest, apiSagbRoutes } from '../../modules/api_sagb';
import { agentes_comerciais_manifest, agentes_comerciais_routes } from '../../modules/agentes_comerciais';
import { cadastroEmpresasManifest, cadastroEmpresasRoutes } from '../../modules/cadastro-empresas';
import { taskzeiManifest, taskzeiRoutes } from '../../modules/taskzei';
import { gestaoFinanceiraManifest, gestaoFinanceiraRoutes } from '../../modules/gestao_financeira';
import { crmZipliaManifest, crmZipliaRoutes } from '../../modules/crm_ziplia';
import { studioManifest, studioRoutes } from '../../modules/studio';
import { karaokeManifest, karaokeRoutes } from '../../modules/karaoke';
import { manifest as telasAvancadasManifest, routes as telasAvancadasRoutes } from '../../modules/telas_avancadas';
import { videosIaManifest, videosIaRoutes } from '../../modules/videos-ia';
import { focoTotalManifest, focoTotalRoutes } from '../../modules/foco_total';
import { nucleoConversacionalManifest } from '../../modules/nucleo-conversacional';
import { manifest as nucleoDeAgentesManifest, routes as nucleoDeAgentesRoutes } from '../../modules/nucleo_de_agentes';
import { centralPadroesManifest, centralPadroesRoutes } from '../../modules/central_padroes';
import { bibliotecaModulosManifest, bibliotecaModulosRoutes } from '../../modules/biblioteca-modulos';
import { monitoramentoManifest, monitoramentoRoutes } from '../../modules/monitoramento';
import { nagiManifest, nagiRoutes } from '../../modules/nagi';
import { nicManifest, nicRoutes } from '../../modules/nic';
import { mentoriasManifest, mentoriasRoutes } from '../../modules/mentorias';
import { metodologiasManifest, metodologiasRoutes } from '../../modules/metodologias';
import { missoesManifest, missoesRoutes } from '../../modules/missoes';
import { raiManifest, raiRoutes } from '../../modules/rai';
import { salaDevManifest, salaDevRoutes } from '../../modules/sala-dev';
import { manifest as configuracoesAmbienteManifest, routes as configuracoesAmbienteRoutes } from '../../modules/configuracoes-ambiente';

import { hubIntegracaoManifest, hubIntegracaoRoutes } from '../../modules/hub-integracao';
import { sagbBridgeManifest, sagbBridgeRoutes } from '../../modules/sagb_bridge';
import { mcpSagbManifest, mcpSagbRoutes } from '../../modules/mcp_sagb';
import { fluxobManifest, fluxobRoutes } from '../../modules/fluxob';
import { nideManifest, nideRoutes } from '../../modules/nide';
import { simuladorMentoriasManifest, simuladorMentoriasRoutes } from '../../modules/simulador-mentorias';

// Aqui definimos o registry central. Novos módulos devem ser registrados nesta array.

export const moduleRegistry: PluggableModule[] = [
  {
    manifest: apiSagbManifest,
    routes: apiSagbRoutes
  },
  {
    manifest: hubIntegracaoManifest,
    routes: hubIntegracaoRoutes
  },
  {
    manifest: agentes_comerciais_manifest,
    routes: agentes_comerciais_routes
  },
  {
    manifest: cadastroEmpresasManifest,
    routes: cadastroEmpresasRoutes
  },
  {
    manifest: nucleoConversacionalManifest,
    routes: { path: '/nucleo-conversacional', element: null }
  },
  {
    manifest: nucleoDeAgentesManifest,
    routes: nucleoDeAgentesRoutes
  },
  {
    manifest: centralPadroesManifest,
    routes: centralPadroesRoutes
  },
  { manifest: bibliotecaModulosManifest, routes: bibliotecaModulosRoutes },
  {
    manifest: monitoramentoManifest,
    routes: monitoramentoRoutes
  },
  {
    manifest: nagiManifest,
    routes: nagiRoutes
  },
  {
    manifest: nicManifest,
    routes: nicRoutes
  },
  {
    manifest: salaDevManifest,
    routes: salaDevRoutes
  },
  {
    manifest: mentoriasManifest,
    routes: mentoriasRoutes
  },
  {
    manifest: simuladorMentoriasManifest,
    routes: simuladorMentoriasRoutes
  },
  {
    manifest: metodologiasManifest,
    routes: metodologiasRoutes
  },
  {
    manifest: missoesManifest,
    routes: missoesRoutes
  },
  {
    manifest: raiManifest,
    routes: raiRoutes
  },
  {
    manifest: karaokeManifest,
    routes: karaokeRoutes
  },
  {
    manifest: studioManifest,
    routes: studioRoutes
  },
  {
    manifest: cidManifest,
    routes: cidRoutes
  },
  {
    manifest: taskzeiManifest,
    routes: taskzeiRoutes
  },
  {
    manifest: crmZipliaManifest,
    routes: crmZipliaRoutes
  },
  {
    manifest: configuracoesAmbienteManifest,
    routes: configuracoesAmbienteRoutes
  },
  {
    manifest: gestaoFinanceiraManifest,
    routes: gestaoFinanceiraRoutes
  },
  {
    manifest: telasAvancadasManifest,
    routes: telasAvancadasRoutes
  },
  {
    manifest: videosIaManifest,
    routes: videosIaRoutes
  },
  {
    manifest: focoTotalManifest,
    routes: focoTotalRoutes
  },
  {
    manifest: sagbBridgeManifest,
    routes: sagbBridgeRoutes
  },
  {
    manifest: mcpSagbManifest,
    routes: mcpSagbRoutes
  },
  {
    manifest: fluxobManifest,
    routes: fluxobRoutes
  },
  {
    manifest: nideManifest,
    routes: nideRoutes
  }
];

export function getRegisteredModules(): PluggableModule[] {
  return moduleRegistry;
}

export function getModuleRoutes(): Record<string, { path: string; element: PluggableModule['routes']['element'] }> {
  return moduleRegistry.reduce((acc, mod) => {
    acc[mod.manifest.id] = mod.routes;
    return acc;
  }, {} as Record<string, { path: string; element: PluggableModule['routes']['element'] }>);
}
