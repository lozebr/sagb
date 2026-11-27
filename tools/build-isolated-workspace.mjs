// Build a credential-free classic script, eliminating cross-origin ES module
// and preload requests from the opaque sandbox. No database access or secrets.
import {build} from 'vite';
import react from '@vitejs/plugin-react';
import {readFileSync,writeFileSync,readdirSync,rmSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
const root=process.cwd();
const out=resolve(root,'dist/workspace_bundle');
await build({
 configFile:false,root,mode:'production',publicDir:false,
 envPrefix:'SAGB_WORKSPACE_UNUSED_',
 define:{'process.env.NODE_ENV':JSON.stringify('production'),'import.meta.env.VITE_SAGB_PUBLIC_DEMO':JSON.stringify('false')},
 plugins:[react()],
 build:{outDir:out,emptyOutDir:true,sourcemap:false,cssCodeSplit:false,
   lib:{entry:resolve(root,'workspace.tsx'),name:'SagBIsolatedWorkspace',formats:['iife'],fileName:()=> 'workspace.js',cssFileName:'workspace'},
   rollupOptions:{output:{inlineDynamicImports:true}}}
});
const js=readFileSync(resolve(out,'workspace.js'));
const jsName='workspace-'+createHash('sha256').update(js).digest('hex').slice(0,16)+'.js';
writeFileSync(resolve(out,jsName),js);rmSync(resolve(out,'workspace.js'));
let styles='';
for(const name of readdirSync(out).filter(n=>n.endsWith('.css'))){
 const css=readFileSync(resolve(out,name));const file='workspace-'+createHash('sha256').update(css).digest('hex').slice(0,16)+'.css';
 if(name!==file){writeFileSync(resolve(out,file),css);rmSync(resolve(out,name));}
 styles+='<link rel="stylesheet" href="/workspace_bundle/'+file+'">\n';
}
const source=readFileSync(resolve(root,'workspace.html'),'utf8');
const markup=source.replace('<link rel="stylesheet" href="/src/styles/sagb-global.css" />',styles)
 .replace('<script type="module" src="/workspace.tsx"></script>', '<script>window.__sagbStartWorkspace("/workspace_bundle/'+jsName+'");</script>');
if(markup.includes('/workspace.tsx')||!markup.includes(jsName)||!styles)throw Error('Workspace artifact incomplete');
writeFileSync(resolve(root,'dist/workspace.html'),markup);
console.log('SagB isolated classic workspace generated:',jsName);
