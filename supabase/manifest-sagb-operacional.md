# 3FB006 — SDVU — Manifesto Supabase operacional do SagB (inventário P0)

**Produto:** SagB — Sistema Administrativo do GrupoB  
**Repositório/owner de domínio:** `lozebr/sagb` / agente responsável do SagB  
**Estado:** `AJUSTAR — DADOS REMOTOS OPERACIONAIS NÃO INVENTARIADOS`  
**Data da checagem:** 04-11-2026  
**Formato:** documento local do produto, não define um novo padrão transversal.

## Responsabilidade e separação

- **Banco operacional SagB:** conexão definida por `VITE_SUPABASE_URL` e chave pública de build, via `services/supabase.ts`. O project ref atualmente utilizado em produção/preview NÃO foi comprovado nesta checagem. Preservar a conexão existente e os usuários. Não presumir que pertença às incubadoras.
- **Projeto para produtos LOZE:** `loze-products-incubator` — observado por consulta read-only, **não é destino operacional do SagB**.
- **Projeto para aplicativos de clientes:** `loze-client-apps-incubator` — observado por consulta read-only, **não é destino operacional do SagB**.
- **Monitoramento/Database Observatory:** somente metadados autorizados e snapshots datados; não possui os schemas dos produtos externos.

## Campos do manifesto exigidos pelo padrão LOZE

| Campo | Estado no SagB |
|---|---|
| Produto | SagB |
| Repositório | `lozebr/sagb` |
| Owner | Agente do SagB; autoridade por dados/módulo a reconciliar |
| Classe de projeto | Operacional existente, classificação exata não verificada |
| Project ref | `NÃO VERIFICADO` — não usar ref de incubadora por inferência |
| Schema(s) | `NÃO VERIFICADOS NO REMOTO OPERACIONAL` |
| Auth | Fluxo existente Supabase Auth e sessão SagB; validar projeto de identidade |
| Migrations | `supabase/migrations/` (histórico existente preservado) |
| Storage / namespace | Pendência de inventário real por bucket e módulo |
| Estágio | Operacional legado, reconciliar antes de eventual reorganização |
| Dependências | Central de Padrões, TaskZei, CID, Studio, agentes e demais módulos documentados |
| Extração / separação | Por domínio e prova de paridade; sem criar schemas ou migrar dados nesta P0 |
| Última validação | 04-11-2026 — documental; validação remota operacional BLOQUEADA |

## Fronteiras dos módulos

Módulos internos não são automaticamente produtos independentes no Supabase. Uma separação lógica de schema por domínio interno somente deve ser proposta após mapear tabelas, proprietários, consumidores, RLS e migração aditiva/rollback. Módulos que também existem como produtos externos não podem transferir dados nem consumir credenciais cruzadas sem contrato e autorização.

**Não aplicar:** criação de projeto/schema, migrations, alterações de Auth/SMTP, service_role no navegador, limpeza física de tabelas legadas.

## Critérios para encerrar o bloqueio

1. Identificar o projeto remoto operacional com permissão de leitura autorizada, sem expor chaves.
2. Inventariar schemas, tabelas, views, funções, buckets, RLS, policies e Auth por domínio.
3. Comparar esquema real × migrations deste repositório e demonstrar backup/rollback para futuras mudanças.
4. Homologar login e telas SagB em Deploy Preview com usuário autorizado.
5. Registrar a evidência no Registro Vivo e levar decisões estruturais ao QG LOZE.


## 26-11-2026 — Nova direção QG: transição progressiva (G0)
**Estado atual desta frente:** `AJUSTAR — DESTINO APROVADO COMO DIREÇÃO; G0 PARCIAL; DDL NÃO LIBERADO`.
Este complemento é cronológico: a declaração anterior de que a incubadora não era destino operacional descreve o estado de 04/11 e é preservada como histórico. A ordem de 26/11 define o destino PRETENDIDO, não um cutover realizado.
| Campo | Estado atualizado |
|---|---|
| Origem operacional histórica | SagB/Dathex, ref hfcpisvogbdlbsxnkjdv; status histórico INACTIVE, permissão negada na consulta atual; URL runtime real não verificada |
| Destino pretendido | loze-products-incubator / txyuwaffzgsjndqsralg / sa-east-1 |
| Schema pretendido | sagb; não encontrado em pg_namespace em 26/11; não criado |
| Ownership | SagB somente no próprio domínio após liberação Hub; nenhum FK ou ownership de outro produto |
| Auth | compartilhado no destino, membership específico SagB obrigatório; reconciliação ID legado → principal/entidade; sem copiar sessões/tokens |
| Entity Registry | consumir core homologado sob escopo aprovado; preservar DNA e IDs/contratos existentes |
| IAM | candidato piloto, QG + Fábrica pendentes; não aplicar templates remotos |
| Migrations | 72 SQL históricos preservados; futura trilha alvo versionada somente depois de revisão e gate; não executar run_all_migrations.sql na incubadora |
| Storage | namespace privado SagB a definir; 6 buckets/14 metadados no backup histórico, objetos físicos não verificados |
| Backup | 17/08 localizado por metadado, acesso aos bytes negado nesta rodada; restore/checksum pendentes |
| Ambientes | Preview Netlify sem VITE_SUPABASE_URL/ANON_KEY; produção valores presentes, ref não visível; não alterar |
| Gate | liberação Hub + coordenação Noivalía, prova restore, segurança e QA candidato, aceite QG |
| Última validação | 26/11/2026, somente leitura de metadados destino e código; nenhuma implantação |
Relatório: `docs/reports/3fb006-sdvu-g0-mega-operacao-sagb-supabase-modularizacao-v0.1-26-11-2026.md`.


## 26-11-2026 — IAM preparação de consumo
- Módulo: identity-access-core 0.1.1, origem lozebr/loze-adm @ 0fd27045b49d5a29fadd8a02a8e653519c794904, `src/modules/identity-access/module-source.json`.
- Estado: PREPARADO, NÃO ATIVADO. Snapshot e migrations-modelo isolados em vendor; nenhuma migration executável adicionada. Schema sagb e Data API aguardam owner Hub #74; escopo product/sagb e permission sagb.access.enter propostas, não provisionadas. Auth existente sem alteração. CI dedicado sem deploy; gates signed Auth, RLS e regressão pendentes.

## 26-11-2026 — entrada candidata IAM
Bootstrap isolado para ref LOZE/flag explícita; SDK e storage de sessão por ref, Auth e RPC sagb somente no cliente candidato. Nenhuma alteração de ambiente ou banco. Configurar apenas após gate Hub/QG, RLS, sessão real e autorização de usuário. A confirmação de admissão não equivale à disponibilidade do dashboard.

## 26-11-2026 — Pacote G1 IAM para revisão
`supabase/review/identity-access/` contém SQL candidato com ROLLBACK, seed de catálogo sem identidade, QA sintético e checklist. Não é migration aplicável; execução e exposição Data API aguardam Hub/QG e revisão dos helpers privilegiados. Sem alteração remota.
