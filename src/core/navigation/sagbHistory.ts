// History contains only UI navigation, never credentials or authorization.
export interface SagbEntry { tab: string; sections: Record<string, unknown>; buId?: string }
export type SagbRoutes = Record<string,string>;
const KEY = 'sagbNavigationV1';
const aliases: Record<string,string> = { hub:'ecosystem', missions:'nide', metodologias:'nide', mentorias:'nide', quadro_de_elite:'nucleo_de_agentes', 'programmers-room':'sala-dev' };
export function canonicalTab(tab:string):string { return Object.prototype.hasOwnProperty.call(aliases,tab) ? aliases[tab] : tab; }
export function knownTab(tab:string,routes:SagbRoutes):boolean { return Object.prototype.hasOwnProperty.call(routes,tab); }
export function readEntry(state:unknown):SagbEntry|null {
  const e=(state as Record<string,unknown>|null)?.[KEY] as SagbEntry|undefined;
  return e && typeof e.tab==='string' && e.sections && typeof e.sections==='object' && !Array.isArray(e.sections) ? e : null;
}
export function routeEntry(state:unknown,pathname:string,search:string,routes:SagbRoutes):SagbEntry {
  const saved=readEntry(state);
  if(saved && knownTab(saved.tab,routes)) return {...saved,tab:canonicalTab(saved.tab)};
  const query=new URLSearchParams(search).get('sagb');
  const path=pathname.replace(/\/+$/,'') || '/';
  const tab=query && knownTab(query,routes) ? query :
    Object.entries(routes).filter(([,base])=>base!=='/' && (path===base||path.startsWith(base+'/'))).sort((a,b)=>b[1].length-a[1].length)[0]?.[0] || 'home';
  const sections:Record<string,unknown>={};
  if(tab==='missions'||tab==='metodologias'||tab==='mentorias')sections.nideDomain=tab==='missions'?'missoes':tab;
  if(path==='/nagi/links')sections.nagiSection='links';
  if(path==='/nide/metodologias'||path==='/nide/mentorias')sections.nideDomain=path.split('/')[2];
  return {tab:canonicalTab(tab),sections};
}
export function tabUrl(tab:string,routes:SagbRoutes):string {
  const base=routes[tab];
  return tab==='home'?'/':base&&base!=='/'?base:'/?sagb='+encodeURIComponent(tab);
}
export function entryState(previous:unknown,entry:SagbEntry):Record<string,unknown> {
  return {...(previous && typeof previous==='object' ? previous : {}),[KEY]:entry};
}
export function pushSection(tab:string,key:string,value:unknown,path?:string):void {
  const entry=readEntry(window.history.state);
  if(!entry || entry.tab!==canonicalTab(tab))return;
  if(JSON.stringify(entry.sections[key])===JSON.stringify(value))return;
  const url=path||window.location.pathname+window.location.search+window.location.hash;
  if(!url.startsWith('/')||url.startsWith('//'))return;
  window.history.pushState(entryState(window.history.state,{...entry,sections:{...entry.sections,[key]:value}}),'',url);
}
