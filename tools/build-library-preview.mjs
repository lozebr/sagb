import {resolve} from 'node:path';
import {existsSync,rmSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const repo=fileURLToPath(new URL('..',import.meta.url));
const branch='work/loze-biblioteca-modulos-20261126';
const permitted=process.env.CONTEXT==='deploy-preview' && (process.env.REVIEW_ID==='9'||process.env.HEAD===branch||process.env.BRANCH===branch);
const out=resolve(repo,'dist/biblioteca-preview');
if(!permitted){
  // Main Vite build preserves dist; explicitly remove any stale demo on other contexts.
  rmSync(out,{recursive:true,force:true});
  console.log('Standalone library preview disabled outside designated Netlify preview.');
}else{
  const {build}=await import('vite');
  const {default:react}=await import('@vitejs/plugin-react');
  const root=resolve(repo,'src/modules/biblioteca-modulos/preview');
  const library=resolve(repo,'src/modules/biblioteca-modulos');
  const nodeModules=resolve(repo,'node_modules');
  await build({configFile:false,root,base:'/biblioteca-preview/',publicDir:false,envPrefix:'LOZE_PREVIEW_UNUSED_',plugins:[react(),{
    name:'library-isolation-boundary',
    generateBundle(){
      for(const id of this.getModuleIds()){
        const clean=id.replace(/^\0/,'').split('?')[0];
        if(clean.startsWith('vite/')||clean.startsWith('commonjsHelpers')||clean.startsWith('react'))continue;
        if(clean.startsWith(library+'/'))continue;
        if(clean.startsWith(nodeModules+'/')&&/\/node_modules\/(react|react-dom|scheduler|vite)\//.test(clean))continue;
        if(id.startsWith('\0')&&!clean.startsWith('/'))continue;
        throw new Error('Unexpected dependency in standalone library preview: '+id);
      }
    }
  }],build:{outDir:out,emptyOutDir:true,sourcemap:false}});
  if(!existsSync(resolve(out,'index.html')))throw new Error('Standalone preview not emitted');
  console.log('Standalone isolated library preview built.');
}
