# 3FB006 — SDVU — P0 — Decisão Arquitetural SAG B: Remodelar x Reconstruir — v0.1 — 18-09-2026

**Produto:** SAG B
**Repositório:** `lozebr/sagb`
**Branch:** `develop`
**Status:** 🟡 AGUARDANDO AUDITORIA E DECISÃO
**Regra:** nenhuma reconstrução ou limpeza destrutiva autorizada por este documento.

# 1. Pergunta central
Definir com evidência se o SAG B deve:

A) ser remodelado profundamente preservando partes maduras;
B) ser reconstruído do zero;
C) adotar migração incremental/strangler, mantendo partes antigas temporariamente enquanto novas camadas substituem as antigas.

# 2. Evidências iniciais já confirmadas
- registry central com 30 módulos registrados;
- Supabase configurado com auth, realtime, storage e migrations habilitadas;
- funções Netlify e rotas serverless;
- módulos com documentação, services e integrações próprias;
- NAGI, NIDE, Central de Padrões, Núcleo Conversacional, API SAG B, Hub de Integrações e outros módulos já materializados;
- histórico com builds/testes registrados em diversas entregas;
- `App.tsx` ainda concentra muitas responsabilidades e mistura arquitetura antiga com módulos novos;
- business units e outras estruturas ainda aparecem hardcoded no app principal;
- coexistência de componentes globais legados e arquitetura modular;
- documentação de deploy/branch apresenta sinais de desatualização;
- múltiplas branches históricas e frentes antigas permanecem no repositório.

# 3. Hipótese inicial
A evidência inicial favorece **remodelação profunda / strangler** em vez de reescrita total.

Isso NÃO é decisão oficial. A hipótese deve ser testada.

# 4. Auditoria obrigatória antes da decisão
Mapear por domínio:
- frontend shell / App.tsx;
- registry e roteamento;
- módulos ativos;
- módulos legados;
- autenticação;
- Supabase / schema / migrations;
- APIs e Netlify Functions;
- integrações externas;
- estado/localStorage/mock;
- agentes e IA;
- design system;
- testes;
- build/deploy;
- documentação;
- segurança;
- dependências;
- performance;
- duplicidades;
- dados reais que não podem ser perdidos.

# 5. Classificação de cada parte
Cada módulo/camada deve receber uma das classes:

- 🟢 PRESERVAR
- 🟣 EXTRAIR / MODULARIZAR
- 🟠 REFATORAR
- 🟡 SUBSTITUIR GRADUALMENTE
- 🔴 REMOVER / ARQUIVAR
- ⚪ INVESTIGAR

# 6. Critérios de decisão
Comparar as três estratégias usando evidência objetiva:

- risco de perda de funcionalidade;
- risco de perda/corrupção de dados;
- custo de regressão;
- tempo até uma baseline demonstrável estável;
- acoplamento entre módulos;
- quantidade de código reaproveitável;
- qualidade dos contratos internos;
- cobertura de testes;
- facilidade de QA;
- segurança;
- manutenção futura;
- migração de usuários/dados;
- capacidade de rollback.

# 7. Regra contra reescrita por impulso
Não escolher reconstrução total apenas porque o código parece bagunçado.

Reconstrução do zero só pode ser recomendada se a auditoria demonstrar que:
- o núcleo reutilizável é pequeno ou inseguro;
- contratos e dados são mais caros de preservar no código atual do que migrar;
- o acoplamento impede evolução incremental;
- o custo/risco de refatoração supera claramente a reconstrução;
- existe plano de migração de dados, paridade funcional, rollback e QA.

# 8. Se a remodelação vencer
Aplicar estratégia por camadas:

1. congelar baseline;
2. inventariar funcionalidades;
3. criar testes de caracterização;
4. separar shell/core;
5. remover hardcodes para registry/config;
6. modularizar serviços;
7. reduzir `App.tsx`;
8. eliminar rotas/componentes duplicados;
9. consolidar estado e persistência;
10. arquivar legado comprovadamente morto;
11. validar módulo por módulo;
12. Deploy Preview contínuo;
13. somente depois promover nova baseline.

# 9. Resultado esperado da auditoria
Entregar:
- mapa real da arquitetura atual;
- inventário de módulos;
- matriz preservar/refatorar/substituir/remover;
- dívida crítica;
- dependências perigosas;
- dados que exigem preservação;
- estimativa comparativa remodelar x reconstruir;
- recomendação técnica;
- plano em ondas;
- riscos e rollback.

# 10. Gate
Após o relatório:

`AUDITORIA → PROPOSTA → APROVAÇÃO → EXECUÇÃO`

Não iniciar limpeza profunda ou reconstrução antes do gate.