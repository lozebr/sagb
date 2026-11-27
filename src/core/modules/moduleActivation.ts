import { isOfflineWorkspace } from '../demo/publicDemo';
import { getRegisteredModules } from './moduleRegistry';
import { ModuleManifest } from './module.types';

export type ModuleToggleMap = Record<string, boolean>;

const STORAGE_KEY = 'sagb:module-toggles:v3';
const ORDER_KEY = 'sagb:module-order:v1';
const ORDER_LOCK_KEY = 'sagb:module-order-lock:v1';

function getWorkspaceScopeKey(workspaceId?: string | null): string {
  return workspaceId && workspaceId.trim() ? workspaceId.trim() : '__global__';
}

export function getModuleManifests(): ModuleManifest[] {
  return getRegisteredModules().map((mod) => mod.manifest);
}

export function getDefaultModuleToggles(): ModuleToggleMap {
  return getModuleManifests().reduce((acc, manifest) => {
    acc[manifest.id] = isOfflineWorkspace || manifest.initialStatus === 'active';
    return acc;
  }, {} as ModuleToggleMap);
}

export function readModuleToggles(workspaceId?: string | null): ModuleToggleMap {
  const defaults = getDefaultModuleToggles();

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;

    const parsed = JSON.parse(raw) as Record<string, ModuleToggleMap>;
    const globalScoped = parsed?.['__global__'] || {};
    const scoped = parsed?.[getWorkspaceScopeKey(workspaceId)] || {};
    return {
      ...defaults,
      ...globalScoped,
      ...scoped
    };
  } catch (error) {
    console.warn('[moduleActivation] Falha ao ler toggles de módulo:', error);
    return defaults;
  }
}

export function writeModuleToggles(next: ModuleToggleMap, workspaceId?: string | null): void {
  const scopeKey = getWorkspaceScopeKey(workspaceId);
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, ModuleToggleMap>) : {};
    parsed[scopeKey] = next;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    window.dispatchEvent(new CustomEvent('sagb:module-toggles-changed', { detail: { workspaceId: scopeKey } }));
  } catch (error) {
    console.warn('[moduleActivation] Falha ao salvar toggles de módulo:', error);
  }
}

// Persist only the selected override, never materialize inherited defaults for a workspace.
export function writeModuleToggle(moduleId:string, enabled:boolean, workspaceId?:string|null):boolean {
  const scopeKey=getWorkspaceScopeKey(workspaceId);
  try {
    const raw=localStorage.getItem(STORAGE_KEY);
    const parsed=raw?JSON.parse(raw) as Record<string,ModuleToggleMap>:{};
    parsed[scopeKey]={...(parsed[scopeKey]||{}),[moduleId]:enabled};
    localStorage.setItem(STORAGE_KEY,JSON.stringify(parsed));
    window.dispatchEvent(new CustomEvent('sagb:module-toggles-changed',{detail:{workspaceId:scopeKey}}));
    return true;
  } catch(error) {
    console.warn('[moduleActivation] Falha ao salvar toggle:',error);
    return false;
  }
}

export function isModuleEnabled(moduleId: string, toggles: ModuleToggleMap): boolean {
  if (!(moduleId in toggles)) return true;
  return !!toggles[moduleId];
}

export function getEnabledModuleIds(toggles: ModuleToggleMap): Set<string> {
  return new Set(
    Object.entries(toggles)
      .filter(([, enabled]) => !!enabled)
      .map(([id]) => id)
  );
}

export function getDisabledModuleIds(toggles: ModuleToggleMap): Set<string> {
  return new Set(
    Object.entries(toggles)
      .filter(([, enabled]) => !enabled)
      .map(([id]) => id)
  );
}

/* ─── Orderm de módulos ─── */

export function readModuleOrder(): string[] {
  try {
    const raw = localStorage.getItem(ORDER_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === 'string');
  } catch {
    return [];
  }
}

export function writeModuleOrder(order: string[]): void {
  try {
    localStorage.setItem(ORDER_KEY, JSON.stringify(order));
    window.dispatchEvent(
      new CustomEvent('sagb:module-order-changed', { detail: { order } })
    );
  } catch (error) {
    console.warn('[moduleActivation] Falha ao salvar ordem de módulos:', error);
  }
}

export function readModuleOrderLocked(): boolean {
  try {
    const raw = localStorage.getItem(ORDER_LOCK_KEY);
    return raw !== 'false'; // locked por padrão
  } catch {
    return true;
  }
}

export function writeModuleOrderLocked(locked: boolean): void {
  try {
    localStorage.setItem(ORDER_LOCK_KEY, String(locked));
  } catch (error) {
    console.warn('[moduleActivation] Falha ao salvar lock de ordem:', error);
  }
}

/**
 * Ordena um array de itens com base em um array de IDs.
 * Itens não listados no array de ordem vão para o final.
 */
export function sortModulesByOrder<T extends { id: string }>(items: T[], order: string[]): T[] {
  if (!order || order.length === 0) return items;
  const orderMap = new Map(order.map((id, index) => [id, index]));
  return [...items].sort((a, b) => {
    const ai = orderMap.get(a.id);
    const bi = orderMap.get(b.id);
    if (ai === undefined && bi === undefined) return 0;
    if (ai === undefined) return 1;
    if (bi === undefined) return -1;
    return ai - bi;
  });
}
