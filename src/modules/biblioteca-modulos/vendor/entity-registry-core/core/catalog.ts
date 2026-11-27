import type { BlockDefinition, FieldDefinition } from "./types.js";

const blockNames = [
  ["identity", "Identidade"], ["classification", "Classificação"], ["roles", "Papéis"], ["contacts", "Contatos"],
  ["addresses", "Endereços"], ["documents", "Documentos"], ["business", "Dados empresariais"], ["organization", "Estrutura organizacional"],
  ["relationships", "Vínculos"], ["customer", "Cliente"], ["prospect", "Prospect"], ["supplier", "Fornecedor"], ["partner", "Parceiro"],
  ["employee", "Colaborador"], ["consultant", "Consultor/Freelancer"], ["ai_agent", "Agente IA"], ["hybrid", "Híbrido"], ["system_access", "Acesso ao sistema"],
  ["roles_permissions", "Roles e permissões"], ["finance", "Financeiro"], ["banking", "Bancário"], ["tax", "Fiscal/tributário"], ["contracts", "Contratos"],
  ["commercial", "Comercial"], ["products_services", "Produtos/Serviços"], ["competencies", "Competências"], ["certifications", "Certificações"],
  ["compliance", "Compliance"], ["consents", "LGPD/Consentimentos"], ["communication", "Comunicação"], ["marketing", "Marketing"], ["files", "Arquivos"],
  ["responsibles", "Responsáveis"], ["evaluation", "Avaliação"], ["timeline", "Timeline"], ["notes", "Notas internas"], ["integrations", "Integrações"],
  ["automation", "Automação"], ["custom_fields", "Campos customizados"], ["audit", "Auditoria"]
] as const;

export const BLOCK_DEFINITIONS: BlockDefinition[] = blockNames.map(([code, name], index) => ({
  code, name, description: `Bloco mestre ${name}.`, sortOrder: index + 1, active: true
}));

const f = (code: string, blockCode: string, label: string, fieldType: FieldDefinition["fieldType"], dataSource: string,
  defaultState: FieldDefinition["defaultState"] = "OPTIONAL", sensitivityClass: FieldDefinition["sensitivityClass"] = "internal",
  sortOrder = 10, extra: Partial<FieldDefinition> = {}): FieldDefinition => ({
    code, blockCode, label, fieldType, dataSource, defaultState, sensitivityClass, sortOrder, ...extra
  });

export const FIELD_DEFINITIONS: FieldDefinition[] = [
  f("identity.entity_type", "identity", "Tipo de entidade", "select", "entities.entity_type", "REQUIRED", "internal", 10, { validation: { options: ["HUMANO","ORGANIZACAO","AGENTE_IA","HIBRIDO","SISTEMA_SERVICO"] } }),
  f("identity.display_name", "identity", "Nome", "text", "entities.display_name", "REQUIRED", "internal", 20),
  f("identity.legal_name", "identity", "Razão social / nome legal", "text", "entities.legal_name", "OPTIONAL", "confidential", 30),
  f("identity.short_description", "identity", "Descrição", "textarea", "entities.short_description", "OPTIONAL", "internal", 40),
  f("identity.avatar_url", "identity", "Avatar", "url", "entities.avatar_url", "OPTIONAL", "internal", 50),
  f("classification.origin", "classification", "Origem", "text", "entity_custom_values:classification.origin", "OPTIONAL"),
  f("roles.role_codes", "roles", "Papéis ativos", "multiselect", "entity_roles.role_code", "READ_ONLY"),
  f("contacts.email", "contacts", "E-mail", "email", "entity_contacts.value", "OPTIONAL", "confidential", 10),
  f("contacts.phone", "contacts", "Telefone", "phone", "entity_contacts.value", "OPTIONAL", "confidential", 20),
  f("addresses.main", "addresses", "Endereço principal", "textarea", "entity_addresses", "OPTIONAL", "confidential"),
  f("documents.cnpj", "documents", "CNPJ", "text", "entity_documents", "CONDITIONAL", "restricted", 10),
  f("documents.cpf", "documents", "CPF", "text", "entity_documents", "OFF", "restricted", 20),
  f("business.trade_name", "business", "Nome fantasia", "text", "supplier_profiles.trade_name", "OPTIONAL", "confidential"),
  f("business.website", "business", "Website", "url", "supplier_profiles.website", "OPTIONAL", "internal"),
  f("supplier.category", "supplier", "Categoria do fornecedor", "text", "supplier_profiles.category", "REQUIRED"),
  f("supplier.homologated", "supplier", "Fornecedor homologado", "boolean", "supplier_profiles.homologated", "OPTIONAL", "internal", 20, { defaultValue: false }),
  f("supplier.homologated_at", "supplier", "Data de homologação", "date", "supplier_profiles.homologated_at", "CONDITIONAL", "confidential", 30),
  f("supplier.enable_financial_block", "supplier", "Exibir dados financeiros", "boolean", "supplier_profiles.enable_financial_block", "OPTIONAL", "internal", 40, { defaultValue: true }),
  f("tax.tax_regime", "tax", "Regime tributário", "select", "supplier_profiles.tax_regime", "OPTIONAL", "restricted", 10),
  f("finance.payment_terms", "finance", "Condição de pagamento", "text", "supplier_profiles.payment_terms", "OPTIONAL", "confidential", 10),
  f("banking.bank_name", "banking", "Banco", "text", "entity_custom_values:banking.bank_name", "OPTIONAL", "restricted", 10),
  f("banking.pix_key", "banking", "Chave PIX", "text", "entity_custom_values:banking.pix_key", "OPTIONAL", "restricted", 20),
  f("contracts.active_contracts", "contracts", "Contratos ativos", "number", "entity_contracts", "READ_ONLY", "confidential"),
  f("compliance.status", "compliance", "Status de compliance", "select", "supplier_profiles.compliance_status", "OPTIONAL", "restricted", 10),
  f("evaluation.score", "evaluation", "Avaliação", "number", "supplier_profiles.evaluation_score", "OPTIONAL", "internal", 10, { validation: { min: 0, max: 100 } }),
  f("files.attachments", "files", "Arquivos", "file", "entity_files", "OPTIONAL", "confidential"),
  f("responsibles.human_owner", "responsibles", "Responsável humano", "entity_ref", "entity_relationships", "OPTIONAL", "confidential"),
  f("organization.venture", "organization", "Venture / unidade", "text", "agent_profiles.venture", "OPTIONAL"),
  f("organization.area", "organization", "Área", "text", "agent_profiles.area", "OPTIONAL"),
  f("organization.function", "organization", "Função", "text", "agent_profiles.function_name", "REQUIRED"),
  f("organization.structural_role", "organization", "Papel estrutural", "text", "agent_profiles.structural_role", "OPTIONAL"),
  f("organization.structural_status", "organization", "Status estrutural", "select", "agent_profiles.structural_status", "OPTIONAL"),
  f("ai_agent.operational_status", "ai_agent", "Status operacional", "select", "agent_profiles.operational_status", "REQUIRED"),
  f("ai_agent.operational_activation", "ai_agent", "Ativação operacional", "boolean", "agent_profiles.operational_activation", "OPTIONAL", "internal", 20, { defaultValue: false }),
  f("ai_agent.dna_status", "ai_agent", "Status DNA", "select", "agent_profiles.dna_status", "OPTIONAL"),
  f("ai_agent.operational_class", "ai_agent", "Classe operacional", "text", "agent_profiles.operational_class", "OPTIONAL"),
  f("ai_agent.allowed_stacks", "ai_agent", "Stacks permitidas", "multiselect", "agent_profiles.allowed_stacks", "OPTIONAL"),
  f("ai_agent.preferred_model", "ai_agent", "Modelo preferido", "text", "agent_profiles.preferred_model", "CONDITIONAL"),
  f("relationships.ai_mentor", "relationships", "Mentor IA", "entity_ref", "entity_relationships", "OPTIONAL"),
  f("relationships.project", "relationships", "Projeto", "entity_ref", "entity_relationships", "OPTIONAL"),
  f("communication.channel", "communication", "Canal principal", "select", "agent_profiles.communication_channel", "OPTIONAL"),
  f("competencies.items", "competencies", "Competências", "multiselect", "entity_custom_values:competencies.items", "OPTIONAL"),
  f("integrations.auth_link_enabled", "integrations", "Vínculo opcional de Auth", "boolean", "entity_auth_links", "OPTIONAL", "restricted", 10, { defaultValue: false }),
  f("integrations.external_ids", "integrations", "IDs externos", "json_controlled", "entity_external_ids", "OPTIONAL", "confidential", 20),
  f("automation.enabled", "automation", "Automação habilitada", "boolean", "agent_profiles.automation_enabled", "OPTIONAL"),
  f("custom_fields.values", "custom_fields", "Campos customizados", "json_controlled", "entity_custom_values", "OPTIONAL", "confidential"),
  f("audit.created_at", "audit", "Criado em", "datetime", "entities.created_at", "READ_ONLY", "internal", 10),
  f("audit.updated_at", "audit", "Atualizado em", "datetime", "entities.updated_at", "READ_ONLY", "internal", 20)
];

export const BLOCKS_BY_CODE = new Map(BLOCK_DEFINITIONS.map((item) => [item.code, item]));
export const FIELDS_BY_CODE = new Map(FIELD_DEFINITIONS.map((item) => [item.code, item]));
