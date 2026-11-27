import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readdirSync,readFileSync,writeFileSync,mkdirSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import ts from 'typescript';
const root='src/modules/biblioteca-modulos';
const dir=mkdtempSync(join(tmpdir(),'loze-library-'));
writeFileSync(join(dir,'package.json'),'{"type":"module"}');
function compile(path){for(const e of readdirSync(join(root,path),{withFileTypes:true})){const p=join(path,e.name);if(e.isDirectory())compile(p);else if(p.endsWith('.ts')){const target=join(dir,p.replace(/\.ts$/,'.js'));mkdirSync(dirname(target),{recursive:true});let s=readFileSync(join(root,p),'utf8');writeFileSync(target,ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);}}}
for(const p of ['data','vendor','services'])compile(p);
const cat=await import(pathToFileURL(join(dir,'data/catalog.js')));const lab=await import(pathToFileURL(join(dir,'services/lab.js')));
const r={preset:'agent',name:'QA',category:'software',legalName:'QA',cnpj:'00.000.000/0001-00',functionName:'QA',active:true,model:'',partner:true};
const i={user:'A',scope:'A',permission:'read',admin:false,revoked:false,suspended:false,aal2:false,requireMfa:false};
test.after(()=>rmSync(dir,{recursive:true,force:true}));
test('catalog 20 unique official + 6 separate candidates; no fake approval',()=>{assert.equal(cat.modules.length,20);assert.equal(new Set(cat.modules.map(x=>x.id)).size,20);assert.equal(cat.candidates.length,6);assert.equal(cat.filterModules('','implemented').length,2);assert.equal(cat.filterModules('','documented').length,8);assert.equal(cat.filterModules('','cataloged').length,10);assert.equal(cat.filterModules('autorizacoes','all').length,1);assert(cat.modules.every(m=>!m.homologated&&!m.pilotSagB));});
test('vendor matches canonical git blob SHA',()=>{let m=JSON.parse(readFileSync(root+'/vendor/SOURCE.json','utf8'));assert.equal(m.commit,cat.sourceSha);for(const f of m.files){const b=readFileSync(f.destination);const hash=createHash('sha1').update('blob '+b.length).update(Buffer.from([0])).update(b).digest('hex');assert.equal(hash,f.blob,f.destination)}});
test('registry activation requires model, role dedup, serialization',()=>{const x=lab.registryDemo(r);assert(x.modelRequired);assert(x.issues.some(i=>i.fieldCode==='ai_agent.preferred_model'));assert.equal(x.draft.roles.filter(v=>v.roleCode==='partner').length,1);assert(x.roundTrip);assert(!lab.registryDemo({...r,model:'model-a'}).issues.some(i=>i.fieldCode==='ai_agent.preferred_model'));assert(!lab.registryDemo({...r,active:false}).modelRequired);});
test('IAM core A/B/C, privilege, revocation, suspension, MFA',()=>{assert(lab.identityDemo(i).allowed);assert(!lab.identityDemo({...i,scope:'B'}).allowed);assert(lab.identityDemo({...i,user:'B',scope:'B'}).allowed);assert(!lab.identityDemo({...i,user:'C'}).allowed);assert(!lab.identityDemo({...i,user:'anonymous'}).allowed);assert(!lab.identityDemo({...i,permission:'write'}).allowed);assert(lab.identityDemo({...i,permission:'write',admin:true}).allowed);assert(!lab.identityDemo({...i,permission:'write',admin:true,revoked:true}).allowed);assert(!lab.identityDemo({...i,suspended:true}).allowed);assert(!lab.identityDemo({...i,requireMfa:true}).allowed);assert(lab.identityDemo({...i,requireMfa:true,aal2:true}).allowed);});
test('native registration once and no database usage in lab',()=>{const s=readFileSync('src/core/modules/moduleRegistry.ts','utf8');assert.equal((s.match(/manifest: bibliotecaModulosManifest/g)||[]).length,1);assert(!/restFetch|fetch\(|localStorage|supabase-js/.test(readFileSync(root+'/services/lab.ts','utf8')));});

test('module activation: defaults, isolated workspace overrides, inherited global, reload, order',async()=>{
 const path='src/core/modules/moduleActivation.ts';
 const src=readFileSync(path,'utf8').replace("import { getRegisteredModules } from './moduleRegistry';","const getRegisteredModules=()=>[{manifest:{id:'biblioteca-modulos',initialStatus:'active'}},{manifest:{id:'other',initialStatus:'active'}}];");
 const target=join(dir,'activation.mjs');
 writeFileSync(target,ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);
 const storage=new Map(),events=[];
 const saved={localStorage:globalThis.localStorage,window:globalThis.window,CustomEvent:globalThis.CustomEvent};
 Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)}});
 globalThis.window={dispatchEvent:e=>events.push(e)};
 globalThis.CustomEvent=class {constructor(type,{detail}){this.type=type;this.detail=detail}};
 try{
  const a=await import(pathToFileURL(target));const id='biblioteca-modulos';
  assert(a.isModuleEnabled(id,a.readModuleToggles('A')));
  assert(a.writeModuleToggle(id,false,'A'));
  assert(!a.isModuleEnabled(id,a.readModuleToggles('A')));
  assert(a.isModuleEnabled(id,a.readModuleToggles('B')));
  assert(a.writeModuleToggle('other',false,null));
  assert(!a.readModuleToggles('A').other);
  assert(!a.readModuleToggles('B').other);
  assert(a.writeModuleToggle(id,true,'A'));
  assert(a.readModuleToggles('A')[id]);
  assert.equal(events.at(-1).detail.workspaceId,'A');
  assert.deepEqual(JSON.parse(storage.get('sagb:module-toggles:v3')).A,{[id]:true});
  a.writeModuleOrder(['other',id]);
  assert.deepEqual(a.sortModulesByOrder([{id},{id:'other'}],a.readModuleOrder()).map(m=>m.id),['other',id]);
 }finally{for(const [k,v] of Object.entries(saved)){if(v===undefined)delete globalThis[k];else Object.defineProperty(globalThis,k,{configurable:true,writable:true,value:v})}}
});
test('native shell uses a single activation context and guards direct render',()=>{
 const app=readFileSync('App.tsx','utf8');
 const sidebar=readFileSync('components/Sidebar.tsx','utf8');
 const settings=readFileSync('src/modules/configuracoes-ambiente/pages/ConfigAmbientePage.tsx','utf8');
 assert(app.includes('useModuleActivationState(activeWorkspaceId)'));
 assert(app.includes('ModuleActivationContext.Provider'));
 assert(app.includes('!isModuleEnabledByToggle(resolvedActiveTab, moduleToggles)'));
 assert(sidebar.includes('useModuleActivation()'));
 assert(sidebar.includes('if (!isModuleEnabled(item.id)) return false'));
 assert(settings.includes('useModuleActivation()'));
 assert(settings.includes('setEnabled(moduleId,!current)'));
});
