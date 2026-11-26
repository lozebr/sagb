import type { FieldState, RuleAction, RuleConditionTerm, RuleDefinition, RuleEvaluationContext } from "./types.js";

const resolveFieldValue = (field: string, context: RuleEvaluationContext): unknown => {
  if (field === "entity_type") return context.entityType;
  return context.values[field];
};

const compare = (actual: unknown, term: Extract<RuleConditionTerm, { field: string }>): boolean => {
  switch (term.op) {
    case "eq": return actual === term.value;
    case "neq": return actual !== term.value;
    case "in": return Array.isArray(term.value) && term.value.includes(actual);
    case "not_in": return Array.isArray(term.value) && !term.value.includes(actual);
    case "exists": return actual !== undefined && actual !== null;
    case "empty": return actual === undefined || actual === null || actual === "" || (Array.isArray(actual) && actual.length === 0);
    case "gt": return typeof actual === "number" && typeof term.value === "number" && actual > term.value;
    case "gte": return typeof actual === "number" && typeof term.value === "number" && actual >= term.value;
    case "lt": return typeof actual === "number" && typeof term.value === "number" && actual < term.value;
    case "lte": return typeof actual === "number" && typeof term.value === "number" && actual <= term.value;
    case "active": return Boolean(actual);
  }
};

export const evaluateTerm = (term: RuleConditionTerm, context: RuleEvaluationContext): boolean => {
  if ("role" in term) return context.roles.includes(term.role);
  if ("permission" in term) return context.permissions.capabilities.includes(term.permission);
  return compare(resolveFieldValue(term.field, context), term);
};

export const evaluateRule = (rule: RuleDefinition, context: RuleEvaluationContext): boolean => {
  if (!rule.enabled) return false;
  const all = rule.when.all ?? [];
  const any = rule.when.any ?? [];
  const allOk = all.every((term) => evaluateTerm(term, context));
  const anyOk = any.length === 0 || any.some((term) => evaluateTerm(term, context));
  return allOk && anyOk;
};

export interface RuleEffects {
  shownBlocks: Set<string>;
  hiddenBlocks: Set<string>;
  shownFields: Set<string>;
  hiddenFields: Set<string>;
  stateOverrides: Map<string, FieldState>;
  defaults: Map<string, unknown>;
  blockedTransitions: Map<string, string | undefined>;
}

export const emptyRuleEffects = (): RuleEffects => ({
  shownBlocks: new Set(), hiddenBlocks: new Set(), shownFields: new Set(), hiddenFields: new Set(),
  stateOverrides: new Map(), defaults: new Map(), blockedTransitions: new Map()
});

export const applyRuleAction = (effects: RuleEffects, action: RuleAction): void => {
  switch (action.action) {
    case "show_block": effects.shownBlocks.add(action.target); effects.hiddenBlocks.delete(action.target); break;
    case "hide_block": effects.hiddenBlocks.add(action.target); effects.shownBlocks.delete(action.target); break;
    case "show_field": effects.shownFields.add(action.target); effects.hiddenFields.delete(action.target); break;
    case "hide_field": effects.hiddenFields.add(action.target); effects.shownFields.delete(action.target); break;
    case "require_field": effects.stateOverrides.set(action.target, "REQUIRED"); break;
    case "optional_field": effects.stateOverrides.set(action.target, "OPTIONAL"); break;
    case "readonly_field": effects.stateOverrides.set(action.target, "READ_ONLY"); break;
    case "set_default": effects.defaults.set(action.target, action.value); break;
    case "block_transition": effects.blockedTransitions.set(action.target, action.reason); break;
  }
};

export const evaluateRules = (rules: RuleDefinition[], context: RuleEvaluationContext): RuleEffects => {
  const effects = emptyRuleEffects();
  for (const rule of rules) if (evaluateRule(rule, context)) for (const action of rule.then) applyRuleAction(effects, action);
  return effects;
};
