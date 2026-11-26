# SagB — Comparativo visual de módulos e proposta de referência v0.1
26/11/2026 | develop 171ce3c4d26ecb12c24e8bc88b6d49c5e9473c7e | PROPOSTA, não padrão homologado

## Pedido e método
Direção pede analisar todos os módulos, selecionar referência estética, centralizar decisões e padrões neste chat como cérebro do SagB, depois especializar chats por módulo. Revisão estática das 30 rotas registradas, componentes de entrada e wrappers relevantes, três manifests legados fora do registry, Home, IAM (fonte incidente anterior) e Biblioteca LOZE PR #8 não mergeado, head 02ae938f704a870da5b4f13dd4caefdbe772f256. Critérios qualitativos: branco predominante, leveza, sombras discretas, contraste, densidade útil, navegação esquerda e saída inferior, tokens claro/escuro, responsividade, componentes reutilizáveis. Sem screenshot/browser autenticado, sem avaliação de todas as subrotas, sem notas de funcionalidade homologada. Bloqueio Auth redirect já registrado. Não alterar design nesta rodada.

## Recomendação
1. Simulador de Mentorias: melhor referência estética para preferências declaradas. Rubik, branco, títulos peso médio, cards sem borda explícita, shadow 0 10px 28px rgba(15,23,42,.055), KPIs com pequenos ícones semânticos. Não copiar magenta/gradientes/glass como obrigatórios, fonte miúda nem sidebar não funcional: nav com seleção fixa, botões Exportar/Salvar snapshot sem handlers, gráfico circular 68/24/8 fixo, falta modo escuro e saída nativa. Preservar motor e não propagar dados demonstrativos.
2. NAGI: referência de navegação funcional, shell 100dvh, sidebar 220px e compacto mobile em CSS, contadores, callback de retorno, tokens light/dark. Corrigir iniciais NZ e pesos 850/800, cores base quentes e bordas conforme padrão futuro. Não copiar largura 100vw sem testes.
3. TaskZei: referência técnica de tokens SagB e menu/rodapé, controles reais; bordas externas e sidebar fixa pedem QA mobile; mock banner exige distinguir dados.
4. Central Padrões: referência de árvore, busca/organização, breadcrumb, topbar 46px, Rubik e tokens claro/escuro; sidebar 306px e navegação inferior mobile não são padrão universal.
5. Biblioteca LOZE: referência de catálogo, ícones semânticos e filtros/status; PR #8 paralelo não mergeado, hero escuro de 242px decorativo não deve virar padrão do uso diário.
Monitoramento: indicadores e status, mas fundo azulado, hero pesado, bordas, letras miúdas. CID: lista/detalhe e inspetor contextual, não menu direito global.

## Inventário qualitativo (30/30 rotas)
| Módulo | Diagnóstico fonte | Direção |
|---|---|---|
| NAGI | shell próprio, tokens, menu compacto | navegação |
| Simulador Mentorias | cards brancos, sombra .055, Rubik, KPIs | estética principal |
| TaskZei | robust clean, tokens, menu/rodapé | componentes |
| Central Padrões | árvore, breadcrumb, cores semânticas | documentação |
| Monitoramento | dashboards, menu denso e forte | métricas |
| CID | explorer branco denso e inspetor | listas/detalhe |
| NIDE | shell e domínio, menu esquerda | hierarquia |
| NIC | hero escuro grande e cards brancos | reduzir hero |
| Núcleo Conversacional | busca/listas, header alto, caixas | compactar |
| Núcleo Agentes | tabs, header, vistas DNA | preservar domínio, unificar shell |
| Agentes Comerciais | título pesado, CTA azul e sombra | suavizar |
| Cadastro Empresas | formulários densos, fonte pequena, indigo | preservar CRUD, rever legibilidade |
| Gestão Financeira | cards, formulário e tabela, shadow-xl | simplificar |
| CRM Ziplia | menu lateral, listas e painéis múltiplos | manter especialização, sem copiar chrome |
| API SagB | cards técnicos, bordas, tokens | compactar |
| Hub Integrações | grid e seções, tema claro/escuro | componentes compartilhados |
| RAI | wizard 3 etapas, cards e títulos pesados | preservar fluxo |
| Sala Dev | workspace técnico escuro, header e console | exceção ferramenta |
| Mentorias | cards grandes, gradiente, rota alias NIDE | consolidar com NIDE |
| Metodologias | sidebar/árvore, cards, header | consolidar com NIDE |
| Missões | hero 5xl, métricas, POC | consolidar com NIDE |
| Studio | cards e player escuro especializado | preservar área de mídia |
| Karaoke | editor/player escuro, duas colunas | exceção ferramenta |
| Foco Total | painéis escuros específicos | exceção modo foco |
| Vídeos IA | página inicial simples | padronizar conforme maturidade |
| Telas Avançadas | fundo escuro e gradiente | exceção viewer; padronizar catálogo |
| MCP SagB | tabs, cards técnicos, saída flutuante | compactar |
| SagB Bridge | cards de status/roadmap | padronizar conforme uso |
| FluxoB | visão de roadmap, inativo inicial | não priorizar |
| Config Sistema | categorias e controles com tokens, bordas | formulários/settings |

Extras: Home Centro de Comando cards grandes/indicadores de exemplo, candidata a aplicar gramática futura após aceite; Quadro Elite alias do Núcleo, Centro Estudos placeholder, Orquestração Principal página inicial fora registry: não promover como referência; IAM tela candidata isolada, manter segurança e validar acesso; Biblioteca PR paralelo conforme acima.

## Proposta de padrão (aguarda Direção)
Base clara neutra e branca, sombra suave, tipografia regular/média, sem bordas decorativas (manter foco/contraste/estrutura necessários), pequenos ícones coloridos, cor semântica consistente, hierarquia e densidade sem fonte ilegível, sidebar única esquerda, saída inferior esquerda, módulos tela inteira, dark e responsividade. NAGI fornece comportamento, Simulador linguagem visual, TaskZei tokens; não copiar módulo inteiro nem introduzir nova biblioteca concorrente. Decisão final após comparar capturas reais lado a lado quando acesso permitir. Chat cérebro governa decisões, Registro Vivo e fontes Git versionadas; chats por módulo recebem escopo, versão, critérios, limites e retornam evidências. Não presumir sincronização automática entre chats ou acesso/execução sem tools. Sem mudança funcional, main, produção ou banco.
