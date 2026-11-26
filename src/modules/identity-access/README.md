# Identidade e Acesso — SagB
Status: **PREPARADO / NÃO ATIVADO**. Fonte LOZE IAM 0.1.1, pin 0fd27045b49d5a29fadd8a02a8e653519c794904.
- `vendor/`: cópia integral byte a byte; não editar. `module-source.json`: proveniência e Git blob SHA.
- `adapters/sagbAdmission.ts`: contrato de admissão de produto, usando RPC oficial no schema sagb com usuário verificado. Escopo product/sagb e permissão sagb.access.enter são propostas a aprovar; nenhuma role ou conta foi criada.
- `tests/`: testes de contrato com doubles; não são sessões assinadas nem teste live.
- Manifest e index preparados, NÃO registrados no menu ou bootstrap enquanto o gate estiver pendente. Auth não deve virar toggle operacional. A aplicação atual permanece intacta.
- Migrations-modelo somente em vendor; não executar, nem copiar para trilha auto-aplicável. Renderização e migration própria sob gate Hub #74, revisar grants, RLS e rollback.
- Cliente definitivo deve ser construído para o project ref correto, request-bound, com chave pública e sessão real; bloquear fluxo legado e consultas não qualificadas antes do cutover. A função de admissão não é autoridade de DML e não valida por si só a configuração interna do cliente injetado. RLS/backend obrigatório. Não aceitar client arbitrário da UI nem service_role. Tratar revogação após admissão no backend e na sessão.
- Próximo: UI e guards de bootstrap, perfil, login/recuperação, sessão por projeto, impedir subscriptions/Storage/funções legadas, teste Auth A/B/C e autorização QG/Hub. Nenhum login real foi habilitado.
- Biblioteca LOZE PR #8 em paralelo: reconciliar snapshots na integração, usar uma única fonte local IAM, sem forks. Não alterar branch da Biblioteca.
- Guia oficial: https://github.com/lozebr/loze-adm/blob/0fd27045b49d5a29fadd8a02a8e653519c794904/docs/architecture/3fb006-guia-integracao-atualizacao-modulos-cloud-first-v0.1-26-11-2026.md
- QA local: usar TypeScript já instalado pelo lockfile do SagB; na raiz `npm ci`, `npx --no-install tsc -p src/modules/identity-access/vendor/tsconfig.json`, `node --test src/modules/identity-access/vendor/tests/*.test.mjs`, `npx --no-install tsc -p src/modules/identity-access/tsconfig.check.json`, `node --test src/modules/identity-access/tests/*.test.mjs`.
