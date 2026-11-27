
# GRUPOB ECOSYSTEM - DEV LOG

## 1. Visão Geral do Sistema
**Nome:** SagB (Sistema Autônomo GrupoB)
**Versão Atual:** 1.6.4 (Ergonomia Chat)
**Responsável Técnico:** Cássio Mendes (AI Architect)
**Chairman:** Douglas Rodrigues

Este documento serve como a "memória de longo prazo" do projeto. Ao iniciar um novo chat, a IA deve ler este arquivo para entender o contexto técnico e as regras de negócio vigentes.

---

## 2. Protocolo Golden Seal (Módulos Blindados) 🔒

As telas abaixo foram aprovadas pelo Chairman e **NÃO DEVEM** ser alteradas em sua lógica estrutural sem ordem explícita para "Quebrar o Selo".

- **`components/ManagementView.tsx`**: (ClickUp Style) - Entrada rápida de dados implementada. Não retornar para modelo puramente conversacional.
- **`components/SystemicVision.tsx`**: (Cluster View) - Chat ajustado com sidebar redimensionável e avatares visíveis.

---

## 3. Arquitetura Atual

### Estrutura de Pastas
- **`/components`**: Interface Visual (React + Tailwind).
  - `HubView.tsx`: Tela principal (Visão Orbital).
  - `SystemicVision.tsx`: (Cluster View) Visualização de Agentes e Chat Split-View.
  - `AgentFactory.tsx`: (RH) Criação e definição de DNA de agentes (Tulian Zagoto).
  - `UnitView.tsx`: (War Room) Sala de chat específica de uma Unidade de Negócio.
  - `ManagementView.tsx`: (Klaus) **[LOCKED]** Gestão de Tarefas hibrida (Lista Rápida + Chat).
- **`/services`**: Lógica de Backend/AI.
  - `gemini.ts`: Conexão com Google Gemini 2.0 Flash Exp. Gerenciamento de streams e prompts.
- **`/data`**: Dados Estáticos e Seeds.
  - `agents.ts`: Lista Mestre de Agentes (Seed inicial).
  - `prompts.ts`: As 3 camadas de DNA (Constituição, Contexto, Identidade).

### Fluxos Principais
1. **Navegação**: Sidebar (Desktop) controla a `activeTab`. `HubView` é a home.
2. **Interação com Agente**:
   - Se Agente **Planejado** -> Redireciona para `AgentFactory` (Onboarding).
   - Se Agente **Ativo** -> Redireciona para `SystemicVision` (Modo Chat/Split View).
3. **Gestão de Tarefas (Novo)**:
   - Entrada direta via Input no topo da lista "A Fazer".
   - Chat serve apenas para debate estratégico.

---

## 4. Histórico de Mudanças (Changelog)

### [v1.7.2] - Estruturação do C.I.D e Histórico Local
- **Isolamento Documental**: Criada a "casca" estrutural do módulo C.I.D em `src/modules/cid` com `manifest.ts` e `module-doc.ts` (tipado a partir da doc macro anterior).
- **Changelog Local**: Instituída a política de ter um `changelog.md` dentro de cada módulo plugável. Se um módulo for "extraído" para um novo projeto, ele levará seu próprio histórico técnico junto.

### [v1.7.1] - Estruturação do Núcleo Conversacional
- **Isolamento Documental**: Iniciado o processo de adequação do chat legado para a arquitetura modular em `src/modules/nucleo-conversacional/`.
- **Ficha Técnica Consolidada**: O conhecimento espalhado em Markdown foi transformado em arquivo TypeScript (`module-doc.ts`), e o `manifest.ts` foi registrado na aplicação. O código interno migrará gradualmente.

### [v1.7.0] - Modularização do NIC (Núcleo de Inteligência Conectiva)
- **Nomenclatura Oficial**: O antigo módulo RIC foi oficialmente renomeado para **NIC** (Núcleo de Inteligência Conectiva). Todas as referências visuais, rotas e documentação interna foram atualizadas.
- **Arquitetura Modular**: O módulo foi extraído para `src/modules/nic/`, seguindo o novo padrão plugável do SagB. Possui manifesto próprio, rotas independentes e estrutura preparada para extração futura.
- **Padronização**: Alinhamento com o ecossistema `CID > NIC > NAGI`, consolidando o NIC como a camada de inteligência interpretativa e conectiva.

### [v1.6.8] - Integração do Cadastro com Governança (ET-02)
- **Sincronização de Status de DNA**: O status do DNA do Agente no Quadro de Elite (`components/AgentFactory.tsx`) agora é atualizado automaticamente para `DNA_COMPLETO` quando um gestor finaliza a edição da identidade dele pelo Núcleo de Governança.
- **Proteção do Pipeline**: O conteúdo real do DNA não trafega de volta para o grid de cadastro, garantindo que `agents` lide apenas com master data e `agent_dna_effective` permaneça cego para o frontend geral, mas o pipeline entenda por ID que o agente já tem instrução.

### [v1.6.7] - Personalização Ativa (Human-Centered)
- **Top Bar**: Dashboard Home agora exibe `Bem-vindo, [Nome do Usuário]` de forma dinâmica.
- **Sidebar**: O perfil inferior exibe o nome, cargo (Tier) e a foto (Avatar) real salva no banco de dados.
- **Chat Interativo**: Tanto no Canal Direto (App.tsx) quanto nas Salas Sistêmicas (SystemicVision.tsx), os avatares nas mensagens refletem a imagem real do usuário humano logado.
- **DNA Dinâmico**: Injetado automaticamente no prompt base o `[Contexto Sistêmico]: O usuário interagindo nesta conversa é [NOME] ([CARGO]). Responda diretamente a ele.` Isso garante que agentes saibam exatamente com quem estão falando.

### [v1.6.6] - Quadro de Elite (clareza estrutural + qualidade de cadastro)
- **Listagem com foco operacional**: adicionada alternância entre **Colunas Essenciais** e **Colunas Avançadas** no Quadro de Elite para reduzir sobrecarga visual no uso diário.
- **Validação reforçada de cadastro**:
  - função principal obrigatória;
  - pelo menos 1 stack permitida;
  - modelo preferencial precisa pertencer à stack permitida.
- **Semântica de campos ajustada**:
  - `officialRole` passa a refletir diretamente `functionName` (função principal);
  - `baseRoleUniversal` deixa de usar fallback silencioso e passa a ser opcional explícito.
- **UX de status melhorada**: adicionado texto de impacto operacional por `status estrutural` no formulário para orientar preenchimento.
- **Nomenclatura de formulário clarificada**:
  - “Função” -> “Função principal”
  - “Cargo-base universal” -> “Cargo-base (taxonomia)”
  - “Papel” -> “Papel de atuação”
  - “Status DNA (somente status)” -> “Status DNA (indicador de cadastro)”
- **Arquivo principal alterado**:
  - `components/AgentFactory.tsx`

### [v1.6.5] - Whisper Local para Transcrição
- **Transcrição local habilitada**: fluxo de áudio pode operar sem Gemini API para transcrição.
- **Servidor local**: criado `tools/local_whisper_server.py` (FastAPI + faster-whisper), endpoint compatível `/v1/audio/transcriptions`.
- **Script**: `npm run whisper:local` para subir o servidor local.
- **Documentação**: criado `docs/WHISPER_LOCAL_TRANSCRICAO.md` com setup e troubleshooting.

### [v1.6.4] - Ergonomia Chat
- **Resizable Sidebar**: Barra lateral de histórico agora pode ser arrastada para aumentar a largura (ideal para telas 24").
- **Avatares**: Fotos do Agente (esquerda) e Douglas (direita) restauradas em todas as mensagens do chat individual.

### [v1.6.3] - Fast Track & Golden Seal
- **ManagementView**: Adicionado input direto estilo ClickUp no topo da lista. O chat agora é secundário à operação de entrada de dados.
- **Processo**: Instituído protocolo de blindagem de módulos (Golden Seal).

### [v1.6.2] - Consolidação de Chat
- **Ajuste Crítico**: Restaurada a lógica de clique no Agente.
- **Rota Inteligente**: Clicar em agente "Planejado" abre o RH. Clicar em "Ativo" abre o Chat.
- **UI**: O `SystemicVision` agora aceita um `forcedAgent` para abrir diretamente na conversa, sem mostrar o grid.

---

## 5. Padrões de Código (Diretrizes Cássio)
1. **XML Output**: Todas as alterações de código devem ser entregues em blocos XML `<changes>`.
2. **Sem Alucinação**: Se uma funcionalidade não existe, não invente que ela funciona.
3. **Clean Code**: Componentes pequenos, tipagem TypeScript estrita.
4. **Estética**: Tailwind CSS, foco em "Clean & Professional" (Grayscale + Cores da Marca).

## 6. Próximos Passos (Backlog Técnico)
- [ ] Refinar a persistência de memória dos agentes (além do localStorage).
- [ ] Implementar busca global no Ecossistema.
- [ ] Conectar n8n para automações externas (webhook).


## 27-11-2026 — Direção confirma login em produção e solicita interface completa
- Deploy b10ec838 READY e login real confirmado pela Direção. Causa dos quatro menus: AuthenticatedHome provisória, não ausência de commits em main. Reconciliada Biblioteca LOZE PR #8 (source 02ae938f704a870da5b4f13dd4caefdbe772f256): catálogo, vendor pinado, rotas, contexto único de toggles e testes, sem publicar preview standalone #9 nem importar alterações antigas de shell/Auth. Interface nativa atualizada com sidebars e histórico existentes. Workspace separado em documento sandbox de origem opaca, sem acesso à sessão IAM, sem conexão remota, sem gravação operacional; armazenamento temporário; conta/MFA/logout reais mantidos no documento pai. Acesso direto ao workspace não monta App. Limitação: dados e operações reais aguardam migração e autorização por domínio. Histórico em fragmentos na área isolada; QA real a confirmar. Login: mostrar/ocultar senha, acessibilidade, Caps Lock, força indicativa em nova senha, layout. Não alterado banco, Auth global, senha ou RLS. Rollback anterior 6b09c5bbccc0d3896dd0c7c8.
