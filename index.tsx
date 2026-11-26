import React from 'react';
import ReactDOM from 'react-dom/client';
import { shouldUseIdentityPilot } from './src/modules/identity-access/services/pilotConfig';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Could not find root element to mount to');
const root = ReactDOM.createRoot(rootElement);
const usePilot = shouldUseIdentityPilot(import.meta.env.VITE_SAGB_IAM_PILOT, import.meta.env.VITE_SUPABASE_URL);

// No static import of the legacy App or ThemeProvider in the candidate path.
const Entry = React.lazy(async () => {
  if (usePilot) return import('./src/modules/identity-access/pages/AccessPilotPage');
  const [{ default: App }, { ThemeProvider }] = await Promise.all([
    import('./App'), import('./src/core/context/ThemeContext')
  ]);
  return { default: () => <ThemeProvider><App /></ThemeProvider> };
});
root.render(<React.StrictMode><React.Suspense fallback={<p role="status">Iniciando SagB...</p>}><Entry /></React.Suspense></React.StrictMode>);
