import type { AuthSession, AuthorizationSnapshot, EntityIdentityLinkAdapter, IdentityPrincipal } from "../core/types.js";

export interface AuthProviderAdapter {
  getSession(): Promise<AuthSession>;
}

export interface ProviderSessionLike {
  authenticated: boolean;
  subject?: string;
  assuranceLevel?: "aal1" | "aal2";
}

export const createStaticAuthProviderAdapter = (
  provider: string,
  session: ProviderSessionLike
): AuthProviderAdapter => ({
  async getSession(): Promise<AuthSession> {
    return {
      authenticated: session.authenticated,
      provider,
      ...(session.subject ? { providerSubject: session.subject } : {}),
      ...(session.assuranceLevel ? { assuranceLevel: session.assuranceLevel } : {})
    };
  }
});

export interface IdentityRepository {
  loadAuthorizationSnapshot(): Promise<AuthorizationSnapshot>;
}

export const createInMemoryIdentityRepository = (initial: AuthorizationSnapshot): IdentityRepository => ({
  async loadAuthorizationSnapshot(): Promise<AuthorizationSnapshot> {
    return structuredClone(initial);
  }
});

export interface EntityAuthLinkReader {
  findEntityIdsByAuthUserId(authUserId: string): Promise<string[]>;
}

export const createSupabaseEntityRegistryBridge = (reader: EntityAuthLinkReader): EntityIdentityLinkAdapter => ({
  async findEntityIdsByPrincipal(principal: IdentityPrincipal): Promise<string[]> {
    if (principal.provider !== "supabase" || principal.type !== "human") return [];
    return reader.findEntityIdsByAuthUserId(principal.providerSubject);
  }
});

export interface IdentityMigrationRenderOptions {
  schema: string;
}

const IDENTIFIER = /^[a-z][a-z0-9_]*$/;

export const validateSchemaName = (schema: string): string => {
  if (!IDENTIFIER.test(schema) || schema.length > 63 || /^(pg_|supabase_)/.test(schema) || ["public","auth","storage","extensions","realtime","vault","private","graphql","graphql_public","information_schema"].includes(schema)) throw new Error(`Invalid schema name: ${schema}`);
  return schema;
};

export const renderIdentityMigration = (sql: string, options: IdentityMigrationRenderOptions): string =>
  sql.replaceAll("__SCHEMA__", validateSchemaName(options.schema));

/** Request-bound Supabase client; never a service-role or caller-supplied decision. */
export interface SupabaseAuthorizationClient {
  schema(name: string): { rpc(name: string, args: Record<string, unknown>): PromiseLike<{data: unknown; error: unknown}> };
}
export const createSupabaseAuthorizationAdapter = (client: SupabaseAuthorizationClient, schema: string) => {
  const consumerSchema = validateSchemaName(schema);
  return {
    async hasPermission(permission: string, scopeType: string, scopeId: string, requiredAal: "aal1" | "aal2" = "aal1"): Promise<boolean> {
      if (!permission || !scopeType || !scopeId || !["aal1", "aal2"].includes(requiredAal)) return false;
      try {
        const result = await client.schema(consumerSchema).rpc("iam_has_permission", {p_permission_code: permission, p_scope_type: scopeType, p_scope_id: scopeId, p_required_aal: requiredAal});
        return !result.error && result.data === true;
      } catch { return false; }
    }
  };
};
