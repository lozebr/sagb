import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import vm from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const code=ts.transpileModule(read('src/core/navigation/moduleShellPolicy.ts'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const sandbox={exports:{}};vm.runInNewContext(code,sandbox);const policy=sandbox.exports.getModuleShellPolicy;
test('Home exclusively retains global chrome; modules retain or receive a sidebar',()=>{
 assert.equal(policy('home').showGlobalChrome,true);
 for(const tab of ['ecosystem','nagi','nide','nucleo-conversacional','agenda','cid','monitoramento','central_padroes','gestao-financeira','crm-ziplia','mcp_sagb','nic','sala-dev','configuracoes-sistema','future-module'])assert.equal(policy(tab).showGlobalChrome,false,tab);
 for(const tab of ['nagi','nide','central_padroes','agenda','crm-ziplia','monitoramento','cid','simulador-mentorias'])assert.equal(policy(tab).useNativeSidebar,true,tab);
 for(const tab of ['nic','rai','mcp_sagb','studio','hub-integracao','agentes_comerciais','nucleo_de_agentes','telas-avancadas','sala-dev']){assert.equal(policy(tab).useNativeSidebar,false,tab);assert.equal(policy(tab).hasInternalTabs,true,tab);}
});
test('native exits stay in their module; shared sidebars have a return control',()=>{
 for(const tab of ['nagi','nide','central_padroes','agenda','crm-ziplia','monitoramento','cid'])assert.equal(policy(tab).showFallbackExit,false,tab);
 assert.equal(policy('sala-dev').useNativeSidebar,false);
 assert.match(read('src/core/navigation/ModuleWorkspace.tsx'),/data-sagb-module-exit/);
});
test('shell preserves native navigation and transfers actual internal controls',()=>{
 const app=read('App.tsx'), shell=read('src/core/navigation/ModuleWorkspace.tsx');
 assert.match(app,/getModuleShellPolicy\(effectiveShellTab\)/);
 assert.equal((app.match(/\{showGlobalChrome && \(/g)||[]).length,2);
 assert.match(app,/moduleRoutes\[resolvedActiveTab\]\?\.element != null/);
 assert.match(app,/nativeSidebar=\{useNativeSidebar\}/);
 assert.match(shell,/createPortal/);
 assert.match(read('components/Sidebar.tsx'),/data-sagb-global-sidebar/);
 assert.match(read('src/modules/nagi/components/NagiSidebar.tsx'),/data-sagb-native-sidebar/);
 assert.match(read('src/modules/central_padroes/layout/CentralPadroesLayout.tsx'),/aria-controls="cp-docs-sidebar"/);
 assert.doesNotMatch(read('src/modules/central_padroes/styles/centralDocs.css'),/\.cp-docs-sidebar\s*\{\s*display:\s*none/);
});
