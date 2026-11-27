import React, {createContext, useContext, useState, useCallback, useEffect} from 'react';
import {createPortal} from 'react-dom';
import './moduleWorkspace.css';

const NavigationSlot = createContext<HTMLElement | null>(null);

// Explicit opt-in: move the actual React controls with their existing handlers.
export function ModuleSidebarContent({children}: {children: React.ReactNode}) {
  const target = useContext(NavigationSlot);
  return target ? createPortal(<div className="sagb-module-nav-controls">{children}</div>, target) : <>{children}</>;
}

interface Props {
  title: string;
  tab: string;
  nativeSidebar: boolean;
  hasInternalTabs: boolean;
  fallbackExit: boolean;
  onBack: () => void;
  children: React.ReactNode;
}
export function ModuleWorkspace({title, tab, nativeSidebar, hasInternalTabs, fallbackExit, onBack, children}: Props) {
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  const ref = useCallback((node: HTMLElement | null) => setSlot(node), []);
  useEffect(() => {
    const handle = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, []);
  return <NavigationSlot.Provider value={slot}>
    <section data-sagb-module-shell data-module-id={tab} className={`sagb-module-workspace ${nativeSidebar ? 'is-native' : 'is-managed'}`}>
      {!nativeSidebar && <>
        <button type="button" className="sagb-module-mobile-menu" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="sagb-module-navigation">☰ {title}</button>
        {open && <button type="button" className="sagb-module-backdrop" aria-label="Fechar menu" onClick={() => setOpen(false)}/>}
        <aside id="sagb-module-navigation" data-sagb-module-sidebar className={`sagb-module-sidebar ${open ? 'is-open' : ''}`} aria-label={`Menu de ${title}`}>
          <div className="sagb-module-title">{title}</div>
          <nav ref={ref} aria-label={`Navegação de ${title}`} onClick={() => setOpen(false)}>
            {!hasInternalTabs && <span className="sagb-module-current" aria-current="page">Visão atual</span>}
          </nav>
          <footer><button type="button" data-sagb-module-exit onClick={onBack}>← Voltar ao SagB</button></footer>
        </aside>
      </>}
      <div className="sagb-module-main">
        <div className="sagb-module-content">{children}</div>
        {fallbackExit && <footer className="sagb-module-native-exit"><button type="button" data-sagb-module-exit onClick={onBack}>← Voltar ao SagB</button></footer>}
      </div>
    </section>
  </NavigationSlot.Provider>;
}
