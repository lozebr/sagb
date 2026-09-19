import React from 'react';
import { createRoot } from 'react-dom/client';
import NAGIPage from '../../src/modules/nagi/pages/NAGIPage';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <NAGIPage initialSection="links" />
  </React.StrictMode>,
);
