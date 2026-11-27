import React from 'react';
import {createRoot} from 'react-dom/client';
import LibraryPage from '../pages/LibraryPage';
import './preview.css';

const root=document.getElementById('root');
if (!root) throw new Error('Preview root missing');
createRoot(root).render(
  <React.StrictMode>
    <div className="lm-preview-banner" role="note">
      <strong>LOZE · Demonstração isolada</strong>
      <span>Sem login, sem acesso ao SagB operacional e sem banco de dados. Use somente dados fictícios.</span>
    </div>
    <main><LibraryPage/></main>
  </React.StrictMode>
);
