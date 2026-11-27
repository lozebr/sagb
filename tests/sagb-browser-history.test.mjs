import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import vm from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const code=ts.transpileModule(read('src/core/navigation/sagbHistory.ts'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const calls=[];
const window={location:{pathname:'/nagi',search:'',hash:''},history:{state:null,pushState(state,_,url){calls.push(url);this.state=state;}}};
const sandbox={exports:{},URLSearchParams,window};vm.runInNewContext(code,sandbox);
const h=sandbox.exports;
const routes={home:'/',nagi:'/nagi',central_padroes:'/central_padroes',nide:'/nide',metodologias:'/metodologias',ecosystem:'/',hub:'/'};
test('known routes and direct deep links preserve the intended module',()=>{
 assert.equal(h.routeEntry(null,'/nagi/links','',routes).tab,'nagi');
 assert.equal(h.routeEntry(null,'/nagi/links','',routes).sections.nagiSection,'links');
 assert.equal(h.routeEntry(null,'/nide/metodologias','',routes).sections.nideDomain,'metodologias');
 assert.equal(h.routeEntry(null,'/','?sagb=ecosystem',routes).tab,'ecosystem');
 assert.equal(h.routeEntry(null,'/','?sagb=__proto__',routes).tab,'home');
 assert.equal(h.tabUrl('ecosystem',routes),'/?sagb=ecosystem');
 assert.equal(h.tabUrl('central_padroes',routes),'/central_padroes');
});
test('sections preserve other history metadata, deduplicate, never use external paths',()=>{
 window.history.state=h.entryState({other:1},{tab:'nagi',sections:{}});
 h.pushSection('nagi','nagiSection','links','/nagi/links');
 assert.equal(window.history.state.other,1);
 assert.equal(h.readEntry(window.history.state).sections.nagiSection,'links');
 h.pushSection('nagi','nagiSection','links','/nagi/links');
 h.pushSection('central_padroes','view','documents');
 h.pushSection('nagi','nagiSection','dashboard','//external.example');
 assert.equal(calls.length,1);
});
test('browser history restore does not trigger navigation pushes or bypass auth',()=>{
 const src=read('src/core/navigation/useSagbHistory.ts'), app=read('App.tsx');
 assert.match(src,/addEventListener\('popstate'/);
 assert.match(src,/history\.pushState/);
 assert.match(app,/Boolean\(user\) && !isPasswordRecoveryActive/);
 assert.doesNotMatch(read('src/modules/nagi/components/NagiShell.tsx'),/history\.pushState/);
 assert.doesNotMatch(read('src/modules/monitoramento/pages/MonitoramentoPage.tsx'),/history\.replaceState/);
});
