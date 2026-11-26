export const ENTITY_TYPES = ["HUMANO", "ORGANIZACAO", "AGENTE_IA", "HIBRIDO", "SISTEMA_SERVICO"] as const;
export type EntityType = (typeof ENTITY_TYPES)[number];

export const FIELD_STATES = ["OFF", "OPTIONAL", "REQUIRED", "READ_ONLY", "CALCULATED", "AUTOMATIC", "CONDITIONAL"] as const;
export type FieldState = (typeof FIELD_STATES)[number];

export type FieldType =
  | "text" | "textarea" | "number" | "money" | "boolean" | "date" | "datetime"
  | "email" | "phone" | "url" | "select" | "multiselect" | "entity_ref" | "file" | "json_controlled";

export interface Entity {
  id: string;
  entityType: EntityType;
  displayName: string;
  legalName?: string;
  slug?: string;
  status: "active" | "inactive" | "archived";
  avatarUrl?: string;
  shortDescription?: string;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
}

export interface EntityRole {
  id: string;
  entityId: string;
  roleCode: string;
  status: "active" | "inactive";
  startsAt?: string;
  endsAt?: string;
  createdAt: string;
}

export interface EntityRelationship {
  id: string;
  sourceEntityId: string;
  relationshipType: string;
  targetEntityId: string;
  status: "active" | "inactive";
  startsAt?: string;
  endsAt?: string;
  metadata?: Record<string, unknown>;
}

export interface BlockDefinition {
  code: string;
  name: string;
  description: string;
  sortOrder: number;
  active: boolean;
}

export interface FieldDefinition {
  code: string;
  blockCode: string;
  label: string;
  fieldType: FieldType;
  dataSource: string;
  validation?: { min?: number; max?: number; pattern?: string; options?: string[] };
  defaultState: FieldState;
  defaultValue?: unknown;
  sensitivityClass: "public" | "internal" | "confidential" | "restricted";
  sortOrder: number;
  helpText?: string;
  placeholder?: string;
}

export interface PresetFieldConfig {
  fieldCode: string;
  state?: FieldState;
  sortOrder?: number;
  label?: string;
  helpText?: string;
  defaultValue?: unknown;
}

export interface PresetDefinition {
  code: string;
  version: number;
  name: string;
  description: string;
  defaultEntityType: EntityType;
  defaultRoles: string[];
  activeBlocks: string[];
  fieldConfig: PresetFieldConfig[];
  rules: RuleDefinition[];
}

export type RuleOperator = "eq" | "neq" | "in" | "not_in" | "exists" | "empty" | "gt" | "gte" | "lt" | "lte" | "active";
export type RuleConditionTerm =
  | { field: string; op: RuleOperator; value?: unknown }
  | { role: string; op: "active" }
  | { permission: string; op: "active" };
export interface RuleCondition { all?: RuleConditionTerm[]; any?: RuleConditionTerm[]; }

export type RuleAction =
  | { action: "show_block" | "hide_block"; target: string }
  | { action: "show_field" | "hide_field" | "require_field" | "optional_field" | "readonly_field"; target: string }
  | { action: "set_default"; target: string; value: unknown }
  | { action: "block_transition"; target: string; reason?: string };

export interface RuleDefinition {
  code: string;
  version: number;
  enabled: boolean;
  when: RuleCondition;
  then: RuleAction[];
}

export interface ProductOverride {
  fieldCode: string;
  state?: FieldState;
  label?: string;
  helpText?: string;
  defaultValue?: unknown;
}

export interface PermissionContext {
  capabilities: string[];
  canViewSensitive?: boolean;
  canEditSensitive?: boolean;
}

export interface EntityDraft {
  entity: Entity;
  roles: EntityRole[];
  relationships: EntityRelationship[];
  values: Record<string, unknown>;
}

export interface RuleEvaluationContext {
  entityType: EntityType;
  roles: string[];
  permissions: PermissionContext;
  values: Record<string, unknown>;
}

export interface ResolvedField {
  definition: FieldDefinition;
  state: FieldState;
  visible: boolean;
  required: boolean;
  readOnly: boolean;
  label: string;
  helpText?: string;
  value?: unknown;
}

export interface ResolvedBlock {
  definition: BlockDefinition;
  visible: boolean;
  fields: ResolvedField[];
}

export interface ValidationIssue {
  fieldCode: string;
  code: "required" | "invalid_type" | "invalid_format";
  message: string;
}
