// Navigation chrome is independent of module activation and authorization.
const nativeExit = new Set(['nagi','nide','central_padroes','agenda','crm-ziplia','gestao-financeira','mcp_sagb','monitoramento','cid']);
export function getModuleShellPolicy(tab: string) {
  const showGlobalChrome = tab === 'home';
  return { showGlobalChrome, showFallbackExit: !showGlobalChrome && !nativeExit.has(tab) };
}
