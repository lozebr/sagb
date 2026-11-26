# LOZE Identity & Access Core — incubator v0.1.1

Status: **IMPLEMENTAÇÃO DE FÁBRICA / SQL LIVE TRANSACIONAL VERDE / AGUARDANDO SESSÃO REAL, PILOTO E HOMOLOGAÇÃO QG**.

Reusable authorization foundation for LOZE products. It separates authentication identity from business entities and provides:

- provider subject → principal resolution contract;
- context memberships;
- RBAC roles and permissions;
- deterministic deny-by-default evaluator;
- optional AAL2/MFA step-up requirement;
- Entity Registry bridge adapter without duplicating `entity_auth_links`;
- Supabase/Postgres migrations with deny-by-default RLS helpers;
- unit/security tests;
- standalone playground.

## Boundaries

This module does **not** own:
- business entities or profiles;
- billing/entitlements;
- feature flags;
- settings/preferences;
- audit storage;
- passwords, refresh tokens or provider secrets;
- tenant/organization domain records.

`auth.uid()` is a provider subject. It is **not** `entities.id`.

## Commands

```bash
npm run build
npm test
npm run playground
```

## Core API

```ts
checkAccess(request, snapshot)
requireAccess(request, snapshot)
listEffectivePermissionCodes(snapshot, membershipId)
createMembership(snapshot, input)
suspendMembership(snapshot, membershipId)
assignRole(snapshot, membershipId, roleId)
revokeRole(snapshot, membershipId, roleId)
```

## Supabase integration

Render migration placeholders:

```ts
renderIdentityMigration(sql, { schema: 'crm' })
```

Consumer-domain RLS can call:

```sql
crm.iam_has_permission('crm.contact.read', 'tenant', tenant_id::text, 'aal1')
```

Administrative writes to IAM tables remain backend-mediated in v0.1. Browser roles receive only self-diagnostic reads and authorization helper execution.

## Entity Registry

Use `createSupabaseEntityRegistryBridge` to map a human Supabase principal to the existing Registry bridge. The Identity module does not create a competing Entity↔Auth link.

## Not yet homologated

To reach **100% PRONTO**, the remaining gates are external to this isolated Factory implementation:
1. re-run build/unit/regression on the pinned v0.1.1 source;
2. run signed Auth/Data API A×B validation on an authorized consumer Preview (transactional SQL QA is already green);
3. integrate one real product pilot;
4. run pilot regression;
5. security review/autoadit;
6. explicit QG homologation.

No production deployment is authorized by this package.

## Cloud First integration and lifecycle

Use [integration and lifecycle guide](../../docs/architecture/3fb006-guia-integracao-atualizacao-modulos-cloud-first-v0.1-26-11-2026.md). New installs fail on object collisions; apply the initial migrations in a single transaction. Existing installs require a reviewed forward migration, never replay initial DDL. The request-bound Supabase RPC adapter `createSupabaseAuthorizationAdapter` calls `iam_has_permission`; keep mutations protected by product RLS or server-side enforcement, not a browser boolean. Static provider/repository are test doubles. The verified SQL harness is tests/cloud-first-rls-ab.sql.