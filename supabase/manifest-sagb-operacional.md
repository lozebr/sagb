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
