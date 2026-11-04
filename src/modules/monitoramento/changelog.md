# Changelog do Módulo monitoramento

Registro de mudanças técnicas, decisões de arquitetura e evolução do módulo **monitoramento**.

---

## [v1.0.0-governance-bootstrap] - 2026-04-09

### Adicionado
- Estrutura inicial de histórico local do módulo (changelog.md).
- Base para rastreabilidade contínua de mudanças.

### Pendências (Roadmap)
- Definir owner principal e backup com nome e sobrenome.
- Consolidar persona definitiva do agente responsável.
# 2026-06-01 — Central operacional LIS V1

- Criada tela principal configurável da Central de Monitoramento com base visual LIS.
- Adicionados cards operacionais mockados, presets, modo TV, alternância claro/escuro local e drawer de detalhe.
- Decisão registrada: a Central de Monitoramento terá uma tela principal configurável com cards, presets, modo TV, drawer de detalhe e preparação para telemetria real.
- Sem integração real com banco, Supabase, APIs, migrations, RLS ou ações destrutivas.

# 2026-06-01 — Refinamento operacional e preparação para integração real

- Separadas as áreas internas de Visão Geral e Submódulos para reduzir verticalidade.
- Adicionados presets War Room e TV Operacional.
- Cards passam a exibir chip de integração mock/parcial/real/pendente.
- Drawer passou a destacar diagnóstico rápido, origem dos dados, integração futura, histórico e próximo passo sugerido.
- Catálogo recebeu mapa de integração futura com módulo fonte, conector, owner de validação e capacidades de TaskZei, notificação e incidente.
- Persistência futura de layout foi modelada em types sem criar banco ou integração real.

# 2026-06-01 — Correção de layout, entrada interna e observabilidade Supabase

- Corrigida a entrada do módulo para abrir em Início da Central, não diretamente no dashboard avançado.
- Criado sidebar interno dominante para navegação do Monitoramento sem alterar o shell global.
- Dashboard operacional compactado com redução de tipografia, paddings, sombras, altura mínima e métricas por card.
- Criada tela Supabase / Database Observatory com agrupamento por módulo, status real/inferido/pendente/erro/sem permissão e preparação de movimentações futuras.
- Contagens reais não foram executadas nesta etapa; todas as tabelas mapeadas permanecem inferidas/pendentes conforme origem.

# 2026-06-01 — Validação visual real e contagem segura Supabase

- Executado servidor Vite em porta alternativa 7001 após conflito na porta 7000.
- Aberto navegador local para validação visual real.
- Supabase / Database Observatory recebeu busca, resumo por status e botão de contagem segura via HEAD + Prefer: count=exact, sem ler linhas.
- Catálogo Supabase revisado com moduleId, assetName, kind, sourceEvidence, status e origem.
- Card Banco de Dados / Supabase marcado como integração parcial por já possuir tela detalhada e preparação de contagem segura.

# 2026-06-01 — Modo imersivo real e refino LIS V4 leve

- Monitoramento adicionado à lista de módulos sem sidebar/header global em App.tsx para experiência imersiva real.
- Sidebar interno passou a ser a navegação dominante da Central de Monitoramento.
- Dashboard e cards foram refinados para linguagem LIS V4 leve: menos texto, menor escala, cards mais compactos, gaps menores e contraste técnico limpo.
- Modo TV elevado para camada z-[90], ocupando a experiência sem competição visual do shell global.

# 2026-06-01 — Reaplicação real da referência LIS V4 leve

- Referência HTML lida em src/modules/monitoramento/docs/lis_central_monitoramento_v4_leve.html.
- Tokens visuais do :root reaplicados em styles/lisV4Dashboard.css.
- Dashboard Operacional passou a usar estrutura equivalente a app/main/head/controls/grid/card/visual/alerts/tv-mode/light-theme da referência.
- Cards foram refeitos para seguir card-head, num, status, metric-row, visual, side-mini, alert-list e Detalhes discreto.
- Densidades panels-4, panels-8, panels-12 e panels-16 foram traduzidas para CSS do módulo.

## 2026-11-04 — P0 Database Observatory / Padrão Supabase LOZE

- Lidos os três padrões aprovados do QG, Matriz Mestre e Registros Vivos.
- Confirmados por consultas Supabase somente leitura os dois projetos incubadores. `loze-products-incubator`: schema `crm` com 33 tabelas (33 com RLS ativada), 30 migrations aplicadas e bucket privado `authorial-audio`; exemplos `nexi/radscan/studio` não apareceram como schemas físicos. `loze-client-apps-incubator`: schema `noivalia` com 51 tabelas (51 com RLS ativada), 22 migrations e buckets `email-assets` (público) e `noivalia-media` (privado).
- Novo registro `supabaseEcosystemRegistry.ts`: fonte datada, status real/referência/não verificado, schema, bucket, Auth, RLS, migrations e comparação esperado × real (indeterminada sem manifesto).
- `MonitoramentoSupabasePage`: cartões de projetos, separação operacional/monitorado, tabela de módulos, status de evidência e inventário histórico preservado.
- `supabaseTablesService`: retirada a afirmação de importar todos os module-docs; agora compila somente declarações do inventário local existente.
- `supabaseObservabilityCatalog`: contagem HEAD restrita a sessão SagB; um HTTP 404 não é prova de tabela removida.
- Criado manifesto local do banco operacional SagB com project ref/schema não verificados, sem redirecionar a conexão.
- Testes de regressão: `tests/sagb-supabase-observatory.test.mjs`.
- **Sem alterações em Supabase remoto, migrações, usuários, schemas, secrets, `main` ou produção.**
- Pendente: manifesto e permissões dos owners externos, revalidação do banco operacional, homologação autenticada de Preview e testes de isolamento RLS.

- Complemento 04/11: a matriz de fronteiras agora cobre todas as 30 entradas do `moduleRegistry` e 3 diretórios legados fora do registro, com situação e proteção por módulo; não houve exclusões.
