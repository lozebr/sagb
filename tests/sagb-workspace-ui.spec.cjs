const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const path=require('node:path');
const origin='https://deploy-preview-6--sagbapp.netlify.app';
const root=path.resolve(__dirname,'..','dist');
const moduleRoot=path.resolve(__dirname,'..','src','modules');
const modules=fs.readdirSync(moduleRoot).filter(n=>!n.startsWith('.')&&!n.startsWith('_')&&!['identity-access','quadro_de_elite'].includes(n)).flatMap(n=>{
 const file=path.join(moduleRoot,n,'manifest.ts');
 if(!fs.existsSync(file))return [];
 const content=fs.readFileSync(file,'utf8');
 const id=content.match(/\bid:\s*['"]([^'"]+)['"]/);
 const name=content.match(/\bdisplayName:\s*['"]([^'"]+)['"]/);
 return id&&name?[{id:id[1],label:name[1]}]:[];
});
const aliases={missions:'nide',metodologias:'nide',mentorias:'nide'};
const native=['nagi','nide','central_padroes','agenda','crm-ziplia','monitoramento','cid','simulador-mentorias'];
const tabs=['nic','rai','mcp_sagb','studio','hub-integracao','agentes_comerciais','nucleo_de_agentes','telas-avancadas','sala-dev'];
async function start(page){
 // All app requests are intercepted and served from the isolated local demo build.
 // Do not call the live Preview, Supabase, or any function endpoint.
 await page.route('**/*',async route=>{
  const u=new URL(route.request().url());
  if(u.origin!==origin){
   if(['cdn.tailwindcss.com','fonts.googleapis.com','fonts.gstatic.com'].includes(u.hostname))return route.continue();
   return route.abort();
  }
  if(route.request().method()!=='GET'||u.pathname.startsWith('/.netlify/')||u.pathname.startsWith('/api'))return route.fulfill({status:403,body:'Offline test'});
  const file=path.resolve(root,'.'+decodeURIComponent(u.pathname));
  if(!file.startsWith(root+path.sep)&&file!==root)return route.abort();
  if(fs.existsSync(file)&&fs.statSync(file).isFile())return route.fulfill({path:file});
  if(!path.extname(u.pathname))return route.fulfill({path:path.join(root,'index.html')});
  return route.fulfill({status:404,body:'Not found'});
 });
 await page.goto(origin+'/',{waitUntil:'domcontentloaded'});
 await expect(page.locator('[data-sagb-global-sidebar]')).toBeVisible({timeout:30000});
}
async function openModule(page,m){
 const nav=page.locator('[data-sagb-global-sidebar]');
 const label=m.id==='nucleo-conversacional'?'Conversas':m.label;
 const button=nav.getByRole('button',{name:'Abrir '+label,exact:true});
 await expect(nav).toBeVisible();
 if(m.id==='configuracoes-sistema'){await page.getByRole('button',{name:'Configurações',exact:true}).click();}
 else if(aliases[m.id]){await page.evaluate(id=>window.dispatchEvent(new CustomEvent('sagb:navigate',{detail:id})),m.id);}
 else {await button.click();}
 const id=aliases[m.id]||m.id;
 const shell=page.locator('[data-sagb-module-shell][data-module-id="'+id+'"]');
 await expect(shell).toBeVisible();
 await expect(page.locator('[data-sagb-global-sidebar]')).toHaveCount(0);
 return {shell,id};
}
test.use({viewport:{width:1366,height:768}});
for(const m of modules){
 test('Home → '+m.id+' → Home',async({page})=>{
  await start(page);
  const {shell,id}=await openModule(page,m);
  const sidebar=shell.locator(native.includes(id)?'[data-sagb-native-sidebar]':'[data-sagb-module-sidebar]');
  await expect(sidebar).toBeVisible();
  const bounds=await sidebar.boundingBox();
  expect(bounds.width).toBeGreaterThan(40);
  expect(bounds.x).toBeLessThan(40);
  if(tabs.includes(id))await expect(sidebar.locator('nav button').first()).toBeVisible();
  await expect(shell.locator('.sagb-module-content')).toBeVisible();
  await page.screenshot({path:test.info().outputPath('module.png')});
  await sidebar.getByRole('button',{name:/Voltar ao SagB/i}).first().click();
  await expect(page.locator('[data-sagb-global-sidebar]')).toBeVisible();
 });
}
test('NAGI native navigation and Central de Padrões drawer at mobile width',async({page})=>{
 await start(page);
 const {shell}=await openModule(page,{id:'nagi',label:'NAGI'});
 await shell.locator('.nagi-sidebar').getByRole('button',{name:'Aplicativos',exact:true}).click();
 await expect(shell.getByRole('heading',{name:'Aplicativos',exact:true})).toBeVisible();
 await shell.locator('.nagi-sidebar').getByRole('button',{name:/Voltar ao SagB/i}).click();
 const cp=await openModule(page,{id:'central_padroes',label:'Central de Padrões'});
 await page.setViewportSize({width:390,height:844});
 await cp.shell.getByRole('button',{name:'Abrir menu da Central de Padrões'}).click();
 await expect(cp.shell.locator('.cp-docs-sidebar')).toBeVisible();
 await cp.shell.locator('.cp-docs-sidebar').getByRole('button',{name:/Voltar ao SagB/i}).click();
 await expect(page.getByRole('button',{name:'Toggle Menu'})).toBeVisible();
});

test('Browser Back / Forward / reload preserve NAGI and Central de Padrões navigation',async({page})=>{
 await start(page);
 const nagi=(await openModule(page,{id:'nagi',label:'NAGI'})).shell;
 const menu=nagi.locator('.nagi-sidebar');
 await menu.getByRole('button',{name:'Documentos',exact:true}).click();
 await menu.getByRole('button',{name:'Aplicativos',exact:true}).click();
 await expect(nagi.getByRole('heading',{name:'Aplicativos',exact:true})).toBeVisible();
 await page.goBack();
 await expect(nagi).toBeVisible();
 await expect(page).toHaveURL(/\/nagi$/);
 await page.goForward();
 await expect(nagi.getByRole('heading',{name:'Aplicativos',exact:true})).toBeVisible();
 await page.reload();
 await expect(nagi.getByRole('heading',{name:'Aplicativos',exact:true})).toBeVisible();
 await page.goBack();
 await page.goBack();
 await expect(nagi).toBeVisible();
 await page.goBack();
 await expect(page.locator('[data-sagb-global-sidebar]')).toBeVisible();
 await page.goForward();
 await expect(nagi).toBeVisible();
 await menu.getByRole('button',{name:/Voltar ao SagB/i}).click();
 const cp=(await openModule(page,{id:'central_padroes',label:'Central de Padrões'})).shell;
 const cpMenu=cp.locator('.cp-docs-sidebar');
 await cpMenu.locator('.cp-docs-sidebar-foot').getByRole('button',{name:/Configurações/i}).click();
 await expect(cpMenu.locator('.cp-docs-sidebar-foot').getByRole('button',{name:/Configurações/i})).toHaveClass(/active/);
 await page.goBack();
 await expect(cp).toBeVisible();
 await expect(cpMenu.locator('.cp-docs-sidebar-foot').getByRole('button',{name:/Configurações/i})).not.toHaveClass(/active/);
 await page.goForward();
 await expect(cpMenu.locator('.cp-docs-sidebar-foot').getByRole('button',{name:/Configurações/i})).toHaveClass(/active/);
 await page.goBack();
 await page.goBack();
 await expect(page.locator('[data-sagb-global-sidebar]')).toBeVisible();
});
test('Managed NIC tabs remain internal history entries and original navigation controls',async({page})=>{
 await start(page);
 const {shell}=await openModule(page,{id:'nic',label:'NIC'});
 const side=shell.locator('[data-sagb-module-sidebar]');
 await side.getByRole('button',{name:'Nomes',exact:true}).click();
 await side.getByRole('button',{name:'Histórico',exact:true}).click();
 await page.goBack();
 await expect(side.getByRole('button',{name:'Nomes',exact:true})).toHaveClass(/bg-slate-900/);
 await page.goForward();
 await expect(side.getByRole('button',{name:'Histórico',exact:true})).toHaveClass(/bg-slate-900/);
});
