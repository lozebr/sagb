import {useState,useRef,useCallback,useEffect,useLayoutEffect} from 'react';
import type {Dispatch,SetStateAction} from 'react';
import {canonicalTab,knownTab,readEntry,routeEntry,tabUrl,entryState,pushSection} from './sagbHistory';
import type {SagbRoutes} from './sagbHistory';

export function useSagbTabHistory<T extends string>(routes:SagbRoutes,enabled:boolean) {
  const routesRef=useRef(routes); routesRef.current=routes;
  const enabledRef=useRef(enabled);enabledRef.current=enabled;
  const current=()=>routeEntry(window.history.state,window.location.pathname,window.location.search,routesRef.current);
  const [tab,rawSet]=useState<T>(()=>current().tab as T);
  const tabRef=useRef(tab);
  const update=useCallback((next:T,replace=false)=>{
    if(!knownTab(next,routesRef.current))return;
    const target=canonicalTab(next) as T;
    const e=readEntry(window.history.state);
    if(target===tabRef.current && (!enabledRef.current||e?.tab===target))return;
    tabRef.current=target;rawSet(target);
    if(!enabledRef.current)return;
    const sections:Record<string,unknown>={};
    if(['missions','metodologias','mentorias'].includes(next))sections.nideDomain=next==='missions'?'missoes':next;
    const payload=entryState(window.history.state,{tab:target,sections});
    const url=tabUrl(target,routesRef.current);
    if(replace)window.history.replaceState(payload,'',url);
    else window.history.pushState(payload,'',url);
  },[]);
  const setTab:Dispatch<SetStateAction<T>>=useCallback(next=>update(typeof next==='function'?(next as (v:T)=>T)(tabRef.current):next),[update]);
  const replaceTab=useCallback((next:T)=>update(next,true),[update]);
  useLayoutEffect(()=>{
    if(!enabled)return;
    const e=current();
    tabRef.current=e.tab as T;rawSet(e.tab as T);
    // Keep the original deep link and unrelated history metadata.
    window.history.replaceState(entryState(window.history.state,e),'',window.location.href);
    const onPop=()=>{const restored=current();tabRef.current=restored.tab as T;rawSet(restored.tab as T);};
    window.addEventListener('popstate',onPop);
    return ()=>window.removeEventListener('popstate',onPop);
  },[enabled]);
  return [tab,setTab,replaceTab] as const;
}

/** For existing module navigation controls, not form inputs or background data. */
export function useSagbSection<T>(tab:string,key:string,initial:T|(()=>T),pathFor?:(value:T)=>string):[T,Dispatch<SetStateAction<T>>] {
  const opts=useRef({tab,key,initial,pathFor});opts.current={tab,key,initial,pathFor};
  const read=()=>{
    const {tab,key,initial}=opts.current;
    const e=readEntry(window.history.state);
    const fallback=()=>typeof initial==='function'?(initial as ()=>T)():initial;
    return e?.tab===canonicalTab(tab)&&Object.prototype.hasOwnProperty.call(e.sections,key)?e.sections[key] as T:fallback();
  };
  const [value,rawSet]=useState<T>(read);
  const valueRef=useRef(value);
  const setValue:Dispatch<SetStateAction<T>>=useCallback(next=>{
    const v=typeof next==='function'?(next as (previous:T)=>T)(valueRef.current):next;
    if(JSON.stringify(v)===JSON.stringify(valueRef.current))return;
    valueRef.current=v;rawSet(v);
    const o=opts.current;pushSection(o.tab,o.key,v,o.pathFor?.(v));
  },[]);
  useEffect(()=>{
    const onPop=()=>{const e=readEntry(window.history.state);if(e&&e.tab!==canonicalTab(opts.current.tab))return;const v=read();valueRef.current=v;rawSet(v);};
    window.addEventListener('popstate',onPop);
    return ()=>window.removeEventListener('popstate',onPop);
  },[]);
  return [value,setValue];
}
