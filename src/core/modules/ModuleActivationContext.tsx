import React,{createContext,useContext,useEffect,useMemo,useState} from 'react';
import {readModuleToggles,writeModuleToggle,type ModuleToggleMap} from './moduleActivation';
type Activation={workspaceId:string|null; toggles:ModuleToggleMap; setEnabled:(id:string,enabled:boolean)=>boolean};
export const ModuleActivationContext=createContext<Activation|null>(null);
export function useModuleActivationState(workspaceId:string|null):Activation{
 const [revision,refresh]=useState(0);
 useEffect(()=>{const sync=()=>refresh(v=>v+1);window.addEventListener('storage',sync);window.addEventListener('sagb:module-toggles-changed',sync);sync();return()=>{window.removeEventListener('storage',sync);window.removeEventListener('sagb:module-toggles-changed',sync)}},[]);
 return useMemo(()=>({workspaceId,toggles:readModuleToggles(workspaceId),setEnabled:(id,enabled)=>writeModuleToggle(id,enabled,workspaceId)}),[workspaceId,revision]);
}
export function useModuleActivation(){const value=useContext(ModuleActivationContext);if(!value)throw new Error('ModuleActivationContext unavailable');return value}
