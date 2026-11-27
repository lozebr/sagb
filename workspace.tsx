import './src/styles/sagb-global.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import {isIsolatedWorkspace,isolatePublicDemo} from './src/core/demo/publicDemo';
const element=document.getElementById('root')!;
const root=ReactDOM.createRoot(element);
if(!isIsolatedWorkspace){
 root.render(<main style={{padding:32}}><h1>Área de trabalho SagB</h1><p>Abra esta área pelo acesso autenticado do SagB.</p><a href="/">Ir para o login</a></main>);
}else{
 try{
   isolatePublicDemo();
   const Entry=React.lazy(async()=>{
     const [{default:App},{ThemeProvider}]=await Promise.all([import('./App'),import('./src/core/context/ThemeContext')]);
     function Ready(){
       React.useEffect(()=>{window.parent.postMessage({type:'sagb:workspace-ready'},window.location.origin);},[]);
       return <ThemeProvider><App/></ThemeProvider>;
     }
     return {default:Ready};
   });
   root.render(<React.StrictMode><React.Suspense fallback={<p>Carregando módulos...</p>}><Entry/></React.Suspense></React.StrictMode>);
 }catch{
   window.parent.postMessage({type:'sagb:workspace-error',reason:'isolation'},window.location.origin);
   root.render(<p role="alert">Não foi possível isolar a área de trabalho. Nenhum módulo foi iniciado.</p>);
 }
}
