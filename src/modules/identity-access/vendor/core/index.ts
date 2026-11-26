import type {
  AccessDecision, AccessRequest, AuthorizationSnapshot, IdentityEventSink, IdentityPrincipal,
  Membership, MembershipRole, Permission, ResolvedAuthorization, Role
} from "./types.js";
export * from "./types.js";

export class AccessDeniedError extends Error {
  readonly decision: AccessDecision;

  constructor(decision: AccessDecision) {
    super(`Access denied: ${decision.reason}`);
    this.name = "AccessDeniedError";
    this.decision = decision;
  }
}

const isWithinWindow = (membership: Membership, nowIso: string): boolean => {
  const now = Date.parse(nowIso);
  if (Number.isNaN(now)) return false;
  if (membership.startsAt && (!Number.isFinite(Date.parse(membership.startsAt)) || Date.parse(membership.startsAt) > now)) return false;
  if (membership.endsAt && (!Number.isFinite(Date.parse(membership.endsAt)) || Date.parse(membership.endsAt) <= now)) return false;
  return true;
};

const findPrincipal = (snapshot: AuthorizationSnapshot, provider: string, providerSubject?: string): IdentityPrincipal | undefined => {
  if (!providerSubject) return undefined;
  return snapshot.principals.find((principal) =>
    principal.provider === provider && principal.providerSubject === providerSubject
  );
};

const findMembership = (
  snapshot: AuthorizationSnapshot,
  principalId: string,
  scopeType: string,
  scopeId: string
): Membership | undefined => {
  const matches = snapshot.memberships.filter((membership) =>
    membership.principalId === principalId && membership.scopeType === scopeType && membership.scopeId === scopeId);
  const active = matches.filter(membership => membership.status === "active");
  return active.length === 1 ? active[0] : active.length > 1 ? undefined : matches[0];
};

const rolesForMembership = (snapshot: AuthorizationSnapshot, membershipId: string): Role[] => {
  const roleIds = new Set(snapshot.membershipRoles.filter((link) => link.membershipId === membershipId).map((link) => link.roleId));
  return snapshot.roles.filter((role) => role.status === "active" && roleIds.has(role.id));
};

const permissionsForRoles = (snapshot: AuthorizationSnapshot, roles: Role[]): Permission[] => {
  const roleIds = new Set(roles.map((role) => role.id));
  const permissionIds = new Set(snapshot.rolePermissions.filter((link) => roleIds.has(link.roleId)).map((link) => link.permissionId));
  return snapshot.permissions.filter((permission) => permissionIds.has(permission.id));
};

export const resolveAuthorization = (
  request: AccessRequest,
  snapshot: AuthorizationSnapshot
): ResolvedAuthorization | AccessDecision => {
  if (!request.session.authenticated) return { allowed: false, reason: "anonymous" };

  const principal = findPrincipal(snapshot, request.session.provider, request.session.providerSubject);
  if (!principal) return { allowed: false, reason: "principal_missing" };
  if (principal.status !== "active") return { allowed: false, reason: "principal_inactive", principalId: principal.id };

  const membership = findMembership(snapshot, principal.id, request.context.scopeType, request.context.scopeId);
  if (!membership) return { allowed: false, reason: "membership_missing", principalId: principal.id };

  const nowIso = request.now ?? new Date().toISOString();
  if (membership.status !== "active" || !isWithinWindow(membership, nowIso)) {
    return { allowed: false, reason: "membership_inactive", principalId: principal.id, membershipId: membership.id };
  }

  const roles = rolesForMembership(snapshot, membership.id);
  const permissions = permissionsForRoles(snapshot, roles);
  if (!permissions.some((permission) => permission.code === request.permission)) {
    return {
      allowed: false,
      reason: "permission_missing",
      principalId: principal.id,
      membershipId: membership.id,
      matchedRoleIds: roles.map((role) => role.id)
    };
  }

  if ((request.requiredAssuranceLevel !== undefined && !["aal1","aal2"].includes(request.requiredAssuranceLevel)) || (request.requiredAssuranceLevel === "aal2" && request.session.assuranceLevel !== "aal2")) {
    return {
      allowed: false,
      reason: "mfa_required",
      principalId: principal.id,
      membershipId: membership.id,
      matchedRoleIds: roles.map((role) => role.id)
    };
  }

  return { principal, membership, roles, permissions };
};

// Optional audit delivery must not change an authorization decision. Durable audit belongs to its consumer.
const publishBestEffort = (sink: IdentityEventSink | undefined, event: Parameters<IdentityEventSink["publish"]>[0]): void => {
  try { void Promise.resolve(sink?.publish(event)).catch(() => undefined); } catch { /* non-blocking sink */ }
};

export const checkAccess = (
  request: AccessRequest,
  snapshot: AuthorizationSnapshot,
  eventSink?: IdentityEventSink
): AccessDecision => {
  const resolved = resolveAuthorization(request, snapshot);
  const now = request.now ?? new Date().toISOString();

  if ("allowed" in resolved) {
    publishBestEffort(eventSink, {
      type: "identity.access.denied",
      occurredAt: now,
      permission: request.permission,
      scopeType: request.context.scopeType,
      scopeId: request.context.scopeId,
      ...(resolved.principalId ? { principalId: resolved.principalId } : {}),
      ...(resolved.membershipId ? { membershipId: resolved.membershipId } : {}),
      reason: resolved.reason
    });
    return resolved;
  }

  const decision: AccessDecision = {
    allowed: true,
    reason: "allowed",
    principalId: resolved.principal.id,
    membershipId: resolved.membership.id,
    matchedRoleIds: resolved.roles.map((role) => role.id)
  };
  publishBestEffort(eventSink, {
    type: "identity.access.allowed",
    occurredAt: now,
    principalId: resolved.principal.id,
    membershipId: resolved.membership.id,
    permission: request.permission,
    scopeType: request.context.scopeType,
    scopeId: request.context.scopeId,
    reason: "allowed"
  });
  return decision;
};

export const requireAccess = (
  request: AccessRequest,
  snapshot: AuthorizationSnapshot,
  eventSink?: IdentityEventSink
): AccessDecision => {
  const decision = checkAccess(request, snapshot, eventSink);
  if (!decision.allowed) throw new AccessDeniedError(decision);
  return decision;
};

export const listEffectivePermissionCodes = (
  snapshot: AuthorizationSnapshot,
  membershipId: string
): string[] => {
  const membership = snapshot.memberships.find(item => item.id === membershipId);
  if (!membership || membership.status !== "active" || !isWithinWindow(membership, new Date().toISOString()) || !snapshot.principals.some(p => p.id === membership.principalId && p.status === "active")) return [];
  return permissionsForRoles(snapshot, rolesForMembership(snapshot, membershipId)).map(permission => permission.code).sort();
};

const id = (): string => globalThis.crypto?.randomUUID?.() ?? `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;

export const createMembership = (
  snapshot: AuthorizationSnapshot,
  input: Omit<Membership, "id" | "status"> & { status?: Membership["status"] }
): AuthorizationSnapshot => {
  const duplicate = snapshot.memberships.some((membership) =>
    membership.principalId === input.principalId &&
    membership.scopeType === input.scopeType &&
    membership.scopeId === input.scopeId &&
    membership.status === "active"
  );
  if (duplicate) throw new Error("active_membership_exists");

  const membership: Membership = {
    id: id(),
    principalId: input.principalId,
    scopeType: input.scopeType,
    scopeId: input.scopeId,
    status: input.status ?? "active",
    ...(input.startsAt ? { startsAt: input.startsAt } : {}),
    ...(input.endsAt ? { endsAt: input.endsAt } : {})
  };
  return { ...snapshot, memberships: [...snapshot.memberships, membership] };
};

export const suspendMembership = (snapshot: AuthorizationSnapshot, membershipId: string): AuthorizationSnapshot => ({
  ...snapshot,
  memberships: snapshot.memberships.map((membership) => membership.id === membershipId ? { ...membership, status: "suspended" as const } : membership)
});

export const assignRole = (snapshot: AuthorizationSnapshot, membershipId: string, roleId: string): AuthorizationSnapshot => {
  if (!snapshot.memberships.some((membership) => membership.id === membershipId)) throw new Error("membership_not_found");
  if (!snapshot.roles.some((role) => role.id === roleId && role.status === "active")) throw new Error("role_not_found");
  if (snapshot.membershipRoles.some((link) => link.membershipId === membershipId && link.roleId === roleId)) return snapshot;
  const link: MembershipRole = { membershipId, roleId };
  return { ...snapshot, membershipRoles: [...snapshot.membershipRoles, link] };
};

export const revokeRole = (snapshot: AuthorizationSnapshot, membershipId: string, roleId: string): AuthorizationSnapshot => ({
  ...snapshot,
  membershipRoles: snapshot.membershipRoles.filter((link) => !(link.membershipId === membershipId && link.roleId === roleId))
});
