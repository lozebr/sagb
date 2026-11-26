import type { PresetDefinition } from "../core/types.js";

export const aiAgentPreset: PresetDefinition = {
  code: "ai_agent",
  version: 1,
  name: "Agente IA",
  description: "Cadastro operacional/digital de agente IA sobre o mesmo núcleo.",
  defaultEntityType: "AGENTE_IA",
  defaultRoles: ["agent"],
  activeBlocks: ["identity","classification","roles","ai_agent","organization","relationships","communication","competencies","responsibles","integrations","automation","custom_fields","audit"],
  fieldConfig: [
    { fieldCode: "identity.entity_type", state: "REQUIRED" },
    { fieldCode: "identity.display_name", state: "REQUIRED" },
    { fieldCode: "identity.short_description", state: "OPTIONAL" },
    { fieldCode: "identity.avatar_url", state: "OPTIONAL" },
    { fieldCode: "classification.origin", state: "OPTIONAL" },
    { fieldCode: "organization.venture", state: "OPTIONAL" },
    { fieldCode: "organization.area", state: "OPTIONAL" },
    { fieldCode: "organization.function", state: "REQUIRED" },
    { fieldCode: "organization.structural_role", state: "OPTIONAL" },
    { fieldCode: "organization.structural_status", state: "OPTIONAL" },
    { fieldCode: "ai_agent.operational_status", state: "REQUIRED" },
    { fieldCode: "ai_agent.operational_activation", state: "OPTIONAL", defaultValue: false },
    { fieldCode: "ai_agent.dna_status", state: "OPTIONAL" },
    { fieldCode: "ai_agent.operational_class", state: "OPTIONAL" },
    { fieldCode: "ai_agent.allowed_stacks", state: "OPTIONAL" },
    { fieldCode: "ai_agent.preferred_model", state: "CONDITIONAL" },
    { fieldCode: "relationships.ai_mentor", state: "OPTIONAL" },
    { fieldCode: "responsibles.human_owner", state: "OPTIONAL" },
    { fieldCode: "relationships.project", state: "OPTIONAL" },
    { fieldCode: "integrations.auth_link_enabled", state: "OPTIONAL", defaultValue: false },
    { fieldCode: "custom_fields.values", state: "OPTIONAL" }
  ],
  rules: [
    {
      code: "agent-active-model",
      version: 1,
      enabled: true,
      when: { all: [{ field: "ai_agent.operational_activation", op: "eq", value: true }] },
      then: [{ action: "show_field", target: "ai_agent.preferred_model" }, { action: "require_field", target: "ai_agent.preferred_model" }]
    },
    {
      code: "agent-auth-capability",
      version: 1,
      enabled: true,
      when: { all: [{ field: "integrations.auth_link_enabled", op: "eq", value: true }] },
      then: [{ action: "set_default", target: "automation.enabled", value: false }]
    }
  ]
};
