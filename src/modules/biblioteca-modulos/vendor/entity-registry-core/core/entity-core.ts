import type { EntityDraft, EntityRelationship, EntityRole, PermissionContext, PresetDefinition, ProductOverride, ValidationIssue } from "./types.js";
import { resolveBlocks, applyPresetDefaults } from "./preset-engine.js";

const id = (): string => globalThis.crypto?.randomUUID?.() ?? `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
const now = (): string => new Date().toISOString();

export const createEntityDraft = (preset: PresetDefinition, input: { displayName?: string; values?: Record<string, unknown> } = {}): EntityDraft => {
  const entityId = id();
  const createdAt = now();
  let draft: EntityDraft = {
    entity: {
      id: entityId,
      entityType: preset.defaultEntityType,
      displayName: input.displayName ?? "",
      status: "active",
      createdAt,
      updatedAt: createdAt
    },
    roles: preset.defaultRoles.map((roleCode) => ({ id: id(), entityId, roleCode, status: "active", createdAt })),
    relationships: [],
    values: { ...(input.values ?? {}), "identity.entity_type": preset.defaultEntityType, "identity.display_name": input.displayName ?? "" }
  };
  draft = applyPresetDefaults(draft, preset);
  return draft;
};

export const addRole = (draft: EntityDraft, roleCode: string): EntityDraft => {
  if (draft.roles.some((r) => r.roleCode === roleCode && r.status === "active")) return draft;
  return { ...draft, roles: [...draft.roles, { id: id(), entityId: draft.entity.id, roleCode, status: "active", createdAt: now() }] };
};

export const removeRole = (draft: EntityDraft, roleCode: string): EntityDraft => ({
  ...draft, roles: draft.roles.map((r) => r.roleCode === roleCode && r.status === "active" ? { ...r, status: "inactive" as const, endsAt: now() } : r)
});

export const addRelationship = (draft: EntityDraft, relationship: Omit<EntityRelationship, "id" | "sourceEntityId" | "status">): EntityDraft => ({
  ...draft,
  relationships: [...draft.relationships, { id: id(), sourceEntityId: draft.entity.id, status: "active", ...relationship }]
});

export const removeRelationship = (draft: EntityDraft, relationshipId: string): EntityDraft => ({
  ...draft, relationships: draft.relationships.map((r) => r.id === relationshipId ? { ...r, status: "inactive" as const, endsAt: now() } : r)
});

export const updateValue = (draft: EntityDraft, fieldCode: string, value: unknown): EntityDraft => {
  const values = { ...draft.values, [fieldCode]: value };
  const entity = { ...draft.entity, updatedAt: now() };
  if (fieldCode === "identity.display_name" && typeof value === "string") entity.displayName = value;
  if (fieldCode === "identity.entity_type" && typeof value === "string") entity.entityType = value as typeof entity.entityType;
  return { ...draft, entity, values };
};

const empty = (value: unknown): boolean => value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0);

export interface ValidateEntityDraftOptions {
  productOverrides?: ProductOverride[];
  permissions?: PermissionContext;
}

export const validateEntityDraft = (
  draft: EntityDraft,
  preset: PresetDefinition,
  options: ValidateEntityDraftOptions = {}
): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];
  const permissions = options.permissions ?? { capabilities: [], canViewSensitive: true, canEditSensitive: true };
  for (const block of resolveBlocks({ draft, preset, ...(options.productOverrides ? { productOverrides: options.productOverrides } : {}), permissions })) {
    for (const field of block.fields) {
      const value = draft.values[field.definition.code] ?? field.value;
      if (field.required && empty(value)) issues.push({ fieldCode: field.definition.code, code: "required", message: `${field.label} é obrigatório.` });
      if (!empty(value) && field.definition.fieldType === "email" && typeof value === "string" && !/^\S+@\S+\.\S+$/.test(value)) issues.push({ fieldCode: field.definition.code, code: "invalid_format", message: `${field.label} possui formato inválido.` });
    }
  }
  return issues;
};

export const serializeEntity = (draft: EntityDraft): string => JSON.stringify(draft);
export const hydrateEntity = (serialized: string): EntityDraft => JSON.parse(serialized) as EntityDraft;
export type { EntityRole };
