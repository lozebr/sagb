// Only Home owns global chrome. Modules with native navigation retain it.
const nativeSidebar = new Set(['nagi','nide','central_padroes','agenda','crm-ziplia','monitoramento','cid','simulador-mentorias']);
const nativeExit = new Set(['nagi','nide','central_padroes','agenda','crm-ziplia','monitoramento','cid','simulador-mentorias']);
const migratedTabs = new Set(['agentes_comerciais','hub-integracao','mcp_sagb','nic','nucleo_de_agentes','studio','telas-avancadas','rai','sala-dev','programmers-room']);
export function getModuleShellPolicy(tab: string) {
  const showGlobalChrome = tab === 'home';
  const useNativeSidebar = !showGlobalChrome && nativeSidebar.has(tab);
  return { showGlobalChrome, useNativeSidebar, hasInternalTabs: migratedTabs.has(tab),
    showFallbackExit: !showGlobalChrome && useNativeSidebar && !nativeExit.has(tab) };
}
