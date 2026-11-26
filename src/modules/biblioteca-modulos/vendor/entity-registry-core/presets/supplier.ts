import type { PresetDefinition } from "../core/types.js";

export const supplierPreset: PresetDefinition = {
  code: "supplier",
  version: 1,
  name: "Fornecedor",
  description: "Cadastro empresarial/comercial reutilizando o núcleo comum.",
  defaultEntityType: "ORGANIZACAO",
  defaultRoles: ["supplier"],
  activeBlocks: ["identity","classification","roles","contacts","addresses","documents","business","supplier","tax","finance","banking","contracts","compliance","evaluation","files","responsibles","audit"],
  fieldConfig: [
    { fieldCode: "identity.entity_type", state: "REQUIRED" },
    { fieldCode: "identity.display_name", state: "REQUIRED" },
    { fieldCode: "identity.legal_name", state: "REQUIRED" },
    { fieldCode: "documents.cnpj", state: "CONDITIONAL" },
    { fieldCode: "documents.cpf", state: "CONDITIONAL" },
    { fieldCode: "supplier.category", state: "REQUIRED" },
    { fieldCode: "supplier.homologated", state: "OPTIONAL", defaultValue: false },
    { fieldCode: "supplier.homologated_at", state: "CONDITIONAL" },
    { fieldCode: "supplier.enable_financial_block", state: "OPTIONAL", defaultValue: true },
    { fieldCode: "audit.created_at", state: "READ_ONLY" },
    { fieldCode: "audit.updated_at", state: "READ_ONLY" }
  ],
  rules: [
    {
      code: "supplier-org-cnpj",
      version: 1,
      enabled: true,
      when: { all: [{ field: "entity_type", op: "eq", value: "ORGANIZACAO" }, { role: "supplier", op: "active" }] },
      then: [{ action: "show_field", target: "documents.cnpj" }, { action: "require_field", target: "documents.cnpj" }, { action: "hide_field", target: "documents.cpf" }]
    },
    {
      code: "supplier-human-cpf",
      version: 1,
      enabled: true,
      when: { all: [{ field: "entity_type", op: "eq", value: "HUMANO" }, { role: "supplier", op: "active" }] },
      then: [{ action: "show_field", target: "documents.cpf" }, { action: "require_field", target: "documents.cpf" }, { action: "hide_field", target: "documents.cnpj" }]
    },
    {
      code: "supplier-homologation-date",
      version: 1,
      enabled: true,
      when: { all: [{ field: "supplier.homologated", op: "eq", value: true }] },
      then: [{ action: "show_field", target: "supplier.homologated_at" }, { action: "require_field", target: "supplier.homologated_at" }]
    },
    {
      code: "supplier-hide-finance",
      version: 1,
      enabled: true,
      when: { all: [{ field: "supplier.enable_financial_block", op: "eq", value: false }] },
      then: [{ action: "hide_block", target: "finance" }, { action: "hide_block", target: "banking" }]
    }
  ]
};
