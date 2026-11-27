import { BLOCK_DEFINITIONS, BLOCKS_BY_CODE, FIELD_DEFINITIONS } from "./catalog.js";
import { evaluateRules } from "./rules-engine.js";
import type { EntityDraft, PermissionContext, PresetDefinition, ProductOverride, ResolvedBlock, ResolvedField, RuleEvaluationContext } from "./types.js";

export interface ResolveFormInput {
  draft: EntityDraft;
  preset: PresetDefinition;
  productOverrides?: ProductOverride[];
  permissions?: PermissionContext;
}

const configMap = (preset: PresetDefinition) => new Map(preset.fieldConfig.map((item) => [item.fieldCode, item]));
const overrideMap = (overrides: ProductOverride[] = []) => new Map(overrides.map((item) => [item.fieldCode, item]));

export const resolveBlocks = ({ draft, preset, productOverrides = [], permissions = { capabilities: [] } }: ResolveFormInput): ResolvedBlock[] => {
  const pConfig = configMap(preset);
  const pOverrides = overrideMap(productOverrides);
  const context: RuleEvaluationContext = {
    entityType: draft.entity.entityType,
    roles: draft.roles.filter((r) => r.status === "active").map((r) => r.roleCode),
    permissions,
    values: { ...draft.values, entity_type: draft.entity.entityType }
  };
  const effects = evaluateRules(preset.rules, context);
  const activeBlocks = new Set(preset.activeBlocks);
  for (const b of effects.shownBlocks) activeBlocks.add(b);
  for (const b of effects.hiddenBlocks) activeBlocks.delete(b);

  const blocks = BLOCK_DEFINITIONS
    .filter((block) => block.active && activeBlocks.has(block.code))
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((block) => {
      const fields: ResolvedField[] = FIELD_DEFINITIONS
        .filter((field) => field.blockCode === block.code)
        .map((field) => {
          const cfg = pConfig.get(field.code);
          const override = pOverrides.get(field.code);
          let state = override?.state ?? cfg?.state ?? field.defaultState;
          if (effects.stateOverrides.has(field.code)) state = effects.stateOverrides.get(field.code)!;

          // A product-level OFF is terminal: declarative preset rules cannot resurrect a field
          // the consumer explicitly disabled for scope/privacy. Stored values remain untouched.
          const productOff = override?.state === "OFF";
          if (productOff) state = "OFF";

          let visible = state !== "OFF" && state !== "CONDITIONAL";
          if (!productOff && effects.shownFields.has(field.code)) visible = true;
          if (effects.hiddenFields.has(field.code)) visible = false;
          if ((field.sensitivityClass === "restricted" || field.sensitivityClass === "confidential") && permissions.canViewSensitive === false) visible = false;
          const defaultValue = effects.defaults.has(field.code) ? effects.defaults.get(field.code) : (override?.defaultValue ?? cfg?.defaultValue ?? field.defaultValue);
          const value = draft.values[field.code] ?? defaultValue;
          const helpText = override?.helpText ?? cfg?.helpText ?? field.helpText;
          return {
            definition: field,
            state,
            visible,
            required: state === "REQUIRED",
            readOnly: state === "READ_ONLY" || state === "CALCULATED" || state === "AUTOMATIC" || ((field.sensitivityClass === "restricted" || field.sensitivityClass === "confidential") && permissions.canEditSensitive === false),
            label: override?.label ?? cfg?.label ?? field.label,
            ...(helpText !== undefined ? { helpText } : {}),
            ...(value !== undefined ? { value } : {})
          } satisfies ResolvedField;
        })
        .filter((field) => field.visible)
        .sort((a, b) => (pConfig.get(a.definition.code)?.sortOrder ?? a.definition.sortOrder) - (pConfig.get(b.definition.code)?.sortOrder ?? b.definition.sortOrder));
      return { definition: BLOCKS_BY_CODE.get(block.code)!, visible: true, fields } satisfies ResolvedBlock;
    })
    .filter((block) => block.fields.length > 0);
  return blocks;
};

export const applyPresetDefaults = (draft: EntityDraft, preset: PresetDefinition): EntityDraft => {
  const values = { ...draft.values };
  for (const field of preset.fieldConfig) if (field.defaultValue !== undefined && values[field.fieldCode] === undefined) values[field.fieldCode] = field.defaultValue;
  return { ...draft, values };
};
