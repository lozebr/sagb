export const identityAccessDoc = {
  displayName: 'Identidade e Acesso',
  purpose: 'Consumir IAM LOZE para admissão e autorização contextual do SagB.',
  version: '0.1.1',
  boundaries: ['Não substitui Supabase Auth', 'Não concede acesso por preferência visual', 'Não instala migrations automaticamente', 'Não administra entidades ou DNA'],
  integrations: { internal: ['SagB shell (futuro gate)', 'Entity Registry (bridge oficial, futura)'], external: ['Supabase Auth e Data API'] },
  dataDependencies: { supabaseTables: ['sagb.iam_principals', 'sagb.iam_memberships', 'sagb.iam_roles', 'sagb.iam_permissions', 'sagb.iam_role_permissions', 'sagb.iam_membership_roles', 'sagb.iam_installation_config'] }
};
