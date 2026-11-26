# 3FB006 — SDVU — Gate G0 | Mega Operação SagB Supabase e Modularização — v0.1 — 26-11-2026

**Produto:** SagB | **Repositório:** lozebr/sagb | **Branch:** develop
**Origem:** ordem QG/Direção de 26/11/2026.
**Status:** AJUSTAR — G0 diagnóstico parcial documentado; G1 estrutural NÃO LIBERADO.
**Baseline SagB:** `2416ee197b7e304aa1cf8697ecf9242ff9c96d61` | **PR:** [#6, draft](https://github.com/lozebr/sagb/pull/6).
**Baseline de consulta Fábrica/QG:** lozebr/loze-adm/develop `bf25e96affed04465affc031a0826c61c4f06aa4`.

## 1. Direção, escopo e governança
[DC] A Direção determinou incorporação progressiva ao projeto existente loze-products-incubator, ref txyuwaffzgsjndqsralg, schema pretendido sagb, e consumo dos módulos reutilizáveis. Isto substitui a proibição anterior de sequer propor esse destino, mas NÃO autoriza DDL remoto antes do handoff/liberação do owner Hub e coordenação da migração Noivalía. Nenhuma alteração de plano, cobrança, produção, Auth global, outros schemas ou repositórios. O baseline compartilhado já foi homologado pelo QG em documento próprio; liberação individual continua obrigatória. Não confundir baseline global com liberação SagB. Registro Central de 17/11 aponta decisão comercial Pro, não prova contratação nem autoriza qualquer gasto nesta tarefa.

## 2. Evidências desta rodada
| Item | Resultado | Fonte |
|---|---|---|
| Destino | ACTIVE_HEALTHY, sa-east-1, PostgreSQL 17 | get_project / leitura 26/11 |
| Schema sagb | não encontrado na consulta pg_namespace | SQL somente leitura 26/11 |
| Schemas de negócio existentes | crm 38/38 RLS; crm_homolog 34/34; public 8/8; private 6/6; loze_platform 0 tabelas | pg_namespace + pg_class; flags RLS, não prova isolamento |
| Origem antiga | ref hfcpisvogbdlbsxnkjdv identificada em rodada histórica como SagB/Dathex INACTIVE; consulta get_project nesta rodada retornou permissão negada | evidência histórica, não revalidação de status |
| Runtime | services/supabase.ts usa uma URL e chave pública VITE; App.tsx consulta nomes não qualificados; restFetch aceita schema.tabela e usa Accept-Profile/Content-Profile | código baseline |
| Netlify | sagbapp, domínio de produção sagb.grupob.com.br; URL e anon key com valor production e sem valor deploy-preview, dev ou branch-deploy; valor da URL mascarado | leitura de metadados, sem expor valores |
| Config CLI | project_id SagB, API schemas public/graphql_public, auth local, não comprova vínculo remoto | supabase/config.toml |
| CI | API de runs PR e combined status não retornou registros para o HEAD consultado | não declarar CI verde atual |
| Registry | 30 módulos registrados; 3 manifests legados fora do registry, conforme árvore e mapa existente | src/core/modules/moduleRegistry.ts; supabaseEcosystemRegistry.ts |
| Histórico SQL | 72 arquivos SQL em supabase/migrations; run_all_migrations.sql inclui policies DROP e referências public | árvore Git e leitura de amostras |

**Atenção P0:** apontar VITE_SUPABASE_URL para a incubadora agora faria consumidores não qualificados atingirem public compartilhado. Não executar. O workflow netlify-deploy.yml usa secrets comuns de build e tem condição de produção diferente de pull_request, incluindo workflow_dispatch: não disparar manualmente. Separar candidato de produção em gate posterior. A exposição de service_role ao cliente é proibida; revisar bundle e funções antes de mudança.

## 3. Backup e preservação
Arquivo histórico `db_cluster-17-08-2026@09-08-35.backup.gz`, 10.820.142 bytes conforme metadado da conversa. Análise histórica de 16/11 registrou gzip íntegro, dump SQL completo em leitura estrutural, 160 tabelas public, 72 migrations registradas, 7 auth.users, 267 documentos de padrões, 1.564 trechos CID, 234 mensagens/216 sessões, 19 agentes, 6 buckets/14 metadados de objetos, cinco tabelas NAGI sem registros e 132/160 tabelas public com flag RLS. **Números históricos, não recontados nesta rodada:** arquivo não estava montado; tentativa de materialização retornou HTTP 403. Não há checksum desta rodada nem prova de restore. Backup de agosto não garante dados posteriores; objetos físicos Storage não foram comprovados. Não publicar dump, hashes, emails, sessões ou credenciais em Git.

G0 de preservação exige nova disponibilização privada do arquivo, SHA-256, gzip -t, inventário por tabela/schema com PK/FK/UUID, teste de restauração em PostgreSQL isolado compatível, reconciliação migration por migration, validação dos objetos físicos Storage e dos dados localStorage/exportados do usuário, revisão de 28 tabelas sem RLS no snapshot histórico. Não restaurar auth, storage, public, roles, extensões ou dump inteiro na incubadora. Não transferir tokens/sessões antigos; identidade deve ser reconciliada por procedimento autorizado de associação do provider e IDs legados, sem sobrescrever usuários existentes. Identidades ambíguas ficam em quarentena; recuperar senha/reautenticar se necessário.

## 4. Matriz prioritária de capacidades
Classificação de direção (não exclusão nem aprovação de migração física). Evidência: registry/manifests, App.tsx, serviços e relatório arquitetural existente.

| Capacidade | Classificação | Evidência / condição |
|---|---|---|
| Login/Auth, sessão, recuperação | ADAPTAR | components/Auth.tsx + services/supabase.ts + App.tsx; preservar fluxos, introduzir membership de produto antes de cutover |
| Identidade de acesso, papéis e permissões | INTEGRAR (condicional) | users, workspace_members, tiers no App; IAM oficial piloto depende QG/Fábrica; não criar IAM concorrente |
| Cadastro pessoas/empresas | INTEGRAR | users/perfis e cadastro-empresas/empresaPersistence.ts grava ventures; distinguir identidade Auth de entidade humana |
| Núcleo de Agentes / Quadro de Elite | INTEGRAR + PRESERVAR | agents, agent_configs, agent_dna_profiles, agent_dna_effective, agent_memories, agent_quality_events; runtimeBridge e decisão de fusão existente; não duplicar cadastro mestre |
| Sistemas / catálogo | ADAPTAR | NAGI demoProducts.ts, productId, referências de manifests, catálogo histórico; fonte de verdade é owner/Hub, não novo cadastro mestre concorrente |
| NAGI ideias/documentos/triagem | ADAPTAR | LocalStorageNagiRepository e LocalStorageNagiIngestionRepository; migration 20260313000102 tem cinco tabelas public com workspace_id; reconciliar contratos, exportar localStorage por usuário com consentimento |
| Central de Padrões, CID, Núcleo Conversacional, NIDE, Gestão Financeira | PRESERVAR | dados/contratos/migrations e auditoria anterior; finance tem estrutura própria histórica; não cortar namespace sem compatibilidade |
| API SagB, Hub de Integração, Monitoramento, Sala Dev, Configurações Ambiente | ADAPTAR | contratos e registry; fronteiras, credenciais server-only, snapshots com proveniência; revisão posterior |
| TaskZei, CRM Ziplia, Studio | INVESTIGAR | coexistência de módulos/produtos; validar ownership, paridade e contratos antes de SUBSTITUIR |
| Mentorias, Metodologias, Missões, Simulador Mentorias | INVESTIGAR | registry e domínios NIDE sobrepostos; separar duplicidade de consumidor real |
| Agentes Comerciais, NIC, RAI, Karaokê, Telas Avançadas, Vídeos IA, Foco Total, SagB Bridge, MCP SagB, FluxoB | INVESTIGAR | registro ativo não demonstra utilização; não mover ou descartar sem inventário |
| .centro_de_estudos, _orquestracao-principal, quadro_de_elite (dirs fora do registry) | INVESTIGAR | ausência no registry não prova ausência de import; Quadro de Elite tem contrato de fusão |
| Código ou dados a DESCONTINUAR | nenhum autorizado | exigir prova de consumidores ausentes, paridade, backup e aceite |

## 5. Fábrica — avaliação de adoção
**Entity Registry Core:** fonte modules/entity-registry-core em lozebr/loze-adm, README, core, templates de migrations, testes. Relatório QG de homologação Noivalía e Registro Vivo Fábrica confirmam RLS live e consumo homologado; README ainda diz candidato (drift conhecido). Módulo fornece entidades com múltiplos papéis, relacionamentos, presets Fornecedor/Agente IA, rules DSL e renderer, templates schema-qualified com escopo server_only/user_scoped/tenant_scoped. Selecionar o escopo segundo contextos reais e manter superfícies sensíveis backend-mediated. Proposta: uma entidade por pessoa/agente/empresa/sistema quando owner for SagB; manter mapa de IDs antigos → entity_id, papéis e relações; preservar UUID e contratos onde possível. Para sistemas externos, referenciar IDs de owner/Hub sem duplicar fonte de verdade. DNA, prompts, memórias, configurações, estados e regras específicas continuam extensões SagB/Central de Padrões. A decisão de fusão Quadro de Elite/Núcleo de Agentes estabelece um cadastro e contrato; runtimeBridge atual ainda tem DNA layers TODO. Preservar ambos os bridges até testar consumidores e paridade. Não alterar a Fábrica nem instalar templates no remoto.

**Identity & Access Core:** README, retorno Fábrica 25/11 e handoff 26/11. 17/17 testes locais declarados pela Fábrica, não reexecutados. Contratos provider subject → principal → membership contextual → RBAC, deny-by-default, AAL1/AAL2. Sete tabelas iam_* candidatas. Bridge entity_auth_links existente no Entity Registry; auth.uid() não é entities.id. Sem senhas, refresh/access tokens ou provider secrets dentro do IAM. Proposta de SagB como piloto: AGUARDANDO APROVAÇÃO QG + gates Fábrica, RLS A×B live, revisão independente. Mapear workspace_members e roles atuais; contexto real product/workspace, não inventar tenant; autorizações propostas sagb.nagi.read/write, sagb.entities.read/write, sagb.agents.manage, sagb.access.manage, a validar. Escritas administrativas backend-mediated, nenhuma autoconcessão de cargo/membership. Consumir fonte oficial pinada, sem fork silencioso. Homologação de Entity Registry não torna IAM homologado.

## 6. Plano incremental e critérios de avanço
| Gate proposto | Entrega e evidência | Estado |
|---|---|---|
| G0 | origem/backup restaurável, inventário dados/consumers, baseline e destino, mapa Factory, liberação explícita Hub com janela sem conflito Noivalía | PARCIAL; bloqueado por acesso a backup e handoff |
| G1 | design schema sagb, migrations aditivas separadas do legado, grants mínimos, RLS deny-default, plano de rollback/extração e aprovação owner | NÃO LIBERADO |
| G2 | candidato Auth com membership, mapping IDs e Entity Registry; primeiro em ambiente local descartável, depois em ambiente candidato autorizado | NÃO LIBERADO |
| G3 | piloto IAM após autorização QG/Fábrica; adaptar NAGI e migrar seletivamente dados aprovados, reconciliação de linhas/FKs | NÃO LIBERADO |
| G4 | typecheck/lint/build/testes Auth, A×B/anon/sem membership/revogação/self-elevation, isolamento entre produtos, Storage, APIs, regressão completa, Advisors e auditoria independente | NÃO EXECUTADO |
| G5 | homologação Preview do SHA exato, recibo QG, rollback e decisão explícita para eventual produção | NÃO EXECUTADO |

Sem novas tabelas genéricas em public, sem FK entre schemas de produtos, Auth compartilhado não equivale a acesso SagB. Proposta de um schema sagb com tabelas de domínios e namespaces de Storage privados; nomes e ownership finais condicionados ao inventário e renderer da Fábrica. Não inventar schema por módulo. Não aplicar 72 migrations legadas cegamente, nem alteração de search_path/allow-list compartilhada sem owner. Separar histórico SQL da futura trilha de migrations alvo após aprovação; não colocar SQL candidato na pasta auto-aplicável nesta fase.

Rollback: manter origem e cópia imutável, mapear versões/IDs, migrar em lotes idempotentes com contagem e checksums de dados autorizados; switch por ambiente apenas após aprovação, compatibilidade/dual read limitada, nenhum dual-write não coordenado; interromper diante de regressão, retornar ao runtime anterior quando operacional, não apagar tabelas para simular rollback. Como origem pode estar pausada, rollback de operação depende de prova de origem recuperável; não prometer disponibilidade.

## 7. Próximo gate / handoff ao Hub e QG
Solicitar owner Hub: confirmar janela exclusiva SagB, situação real da Noivalía, baseline atual e capacidade/limites, autorização explícita schema sagb + Data API/grants, contexto de Auth e redirects/SMTP compartilhados, Storage, ambiente candidato, fila de migrations e rollback. Nenhuma estrutura remota executada. Solicitar acesso privado ao backup para prova de restore. Solicitar QG aprovação explícita do piloto IAM e gates Fábrica/auditoria independente. Registrar resultado no mesmo Registro Vivo. Não avançar outros módulos, não publicar produção.

## 8. Fontes rastreáveis
- [Registro Vivo SagB](https://github.com/lozebr/sagb/blob/develop/docs/story/3fb006-registro-vivo-sagb-v0.1-18-09-2026.md), [manifesto existente](https://github.com/lozebr/sagb/blob/develop/supabase/manifest-sagb-operacional.md), [registry](https://github.com/lozebr/sagb/blob/2416ee197b7e304aa1cf8697ecf9242ff9c96d61/src/core/modules/moduleRegistry.ts), [migrations](https://github.com/lozebr/sagb/tree/2416ee197b7e304aa1cf8697ecf9242ff9c96d61/supabase/migrations), [adaptador](https://github.com/lozebr/sagb/blob/2416ee197b7e304aa1cf8697ecf9242ff9c96d61/services/supabase.ts), README, tarefas P0 de arquitetura/NAGI, relatório auditoria 03/11.
- [Padrão Supabase LOZE](https://github.com/lozebr/loze-adm/blob/develop/docs/standards/3fb006-padrao-supabase-loze-v1-17-09-2026.md), [Governança sequencial](https://github.com/lozebr/loze-adm/blob/develop/docs/standards/3fb006-padrao-governanca-sequencial-supabase-qg-platform-produtos-v1-17-09-2026.md), [Auth/Redirect/SMTP](https://github.com/lozebr/loze-adm/blob/develop/docs/standards/3fb006-padrao-auth-email-redirect-smtp-loze-v1-17-09-2026.md), Registro Vivo Central/Fábrica, homologação baseline e Noivalía.
- [Hub manifest](https://github.com/lozebr/loze-hub/blob/develop/supabase/manifest.yaml) e Registro Vivo baseline; manifest ainda indica em homologação, decisão QG posterior aprova baseline mas não libera SagB automaticamente.
- [Entity Registry Core](https://github.com/lozebr/loze-adm/tree/develop/modules/entity-registry-core), [Identity & Access Core](https://github.com/lozebr/loze-adm/tree/develop/modules/identity-access-core), [handoff IAM 26/11](https://github.com/lozebr/loze-adm/blob/develop/docs/tasks/3fb006-handoff-integracao-identity-access-core-programador-v0.1-26-11-2026.md).
- SQL de metadados somente leitura e Netlify env metadata 26/11. Não foram lidos registros pessoais do destino.

**Resultado da rodada:** diagnóstico e proposta documentados; sem código funcional, migrations, testes de runtime, deploy novo manual ou DDL. G0 não homologado. PR #6 permanece draft. 
