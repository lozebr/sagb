import React from 'react';
import ReactDOM from 'react-dom/client';
import { isPublicDemo, isolatePublicDemo } from './src/core/demo/publicDemo';
import { shouldUseIdentityPilot } from './src/modules/identity-access/services/pilotConfig';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Could not find root element to mount to');
const root = ReactDOM.createRoot(rootElement);
const officialHost = window.location.hostname === 'sagb.grupob.com.br' || window.location.hostname === 'sagbapp.netlify.app' || window.location.hostname === 'main--sagbapp.netlify.app';
const usePilot = officialHost || shouldUseIdentityPilot(import.meta.env.VITE_SAGB_IAM_PILOT, import.meta.env.VITE_SAGB_IAM_URL || import.meta.env.VITE_SUPABASE_URL);

// No static import of the legacy App or ThemeProvider in the candidate path.
const Entry = React.lazy(async () => {
  if (isPublicDemo) isolatePublicDemo();
  else if (usePilot) return import('./src/modules/identity-access/pages/AccessPilotPage');
  const [{ default: App }, { ThemeProvider }] = await Promise.all([
    import('./App'), import('./src/core/context/ThemeContext')
  ]);
  return { default: () => <ThemeProvider>{isPublicDemo && <div role="status" style={{position:'fixed',bottom:0,right:0,zIndex:9999,background:'#fef3c7',color:'#78350f',fontSize:11,padding:'3px 8px',pointerEvents:'none'}}>DEMONSTRAÇÃO · sem dados reais · sem gravação remota</div>}<App /></ThemeProvider> };
});
root.render(<React.StrictMode><React.Suspense fallback={<p role="status">Iniciando SagB...</p>}><Entry /></React.Suspense></React.StrictMode>);
