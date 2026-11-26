export const PRINCIPAL_TYPES = ["human", "agent", "service"] as const;
export type PrincipalType = (typeof PRINCIPAL_TYPES)[number];

export const PRINCIPAL_STATUSES = ["active", "suspended", "disabled"] as const;
export type PrincipalStatus = (typeof PRINCIPAL_STATUSES)[number];

export const MEMBERSHIP_STATUSES = ["active", "suspended", "revoked"] as const;
export type MembershipStatus = (typeof MEMBERSHIP_STATUSES)[number];

export type AuthAssuranceLevel = "aal1" | "aal2";

export interface IdentityPrincipal {
  id: string;
  type: PrincipalType;
  status: PrincipalStatus;
  provider: string;
  providerSubject: string;
}

export interface AccessContext {
  scopeType: string;
  scopeId: string;
  environment?: string;
}

export interface AuthSession {
  authenticated: boolean;
  provider: string;
  providerSubject?: string;
  assuranceLevel?: AuthAssuranceLevel;
}

export interface Membership {
  id: string;
  principalId: string;
  scopeType: string;
  scopeId: string;
  status: MembershipStatus;
  startsAt?: string;
  endsAt?: string;
}

export interface Role {
  id: string;
  slug: string;
  name: string;
  status: "active" | "inactive";
}

export interface Permission {
  id: string;
  code: string;
  description?: string;
}

export interface MembershipRole {
  membershipId: string;
  roleId: string;
}

export interface RolePermission {
  roleId: string;
  permissionId: string;
}

export interface AuthorizationSnapshot {
  principals: IdentityPrincipal[];
  memberships: Membership[];
  roles: Role[];
  permissions: Permission[];
  membershipRoles: MembershipRole[];
  rolePermissions: RolePermission[];
}

export interface AccessRequest {
  session: AuthSession;
  context: AccessContext;
  permission: string;
  requiredAssuranceLevel?: AuthAssuranceLevel;
  now?: string;
}

export type AccessDecisionReason =
  | "allowed"
  | "anonymous"
  | "principal_missing"
  | "principal_inactive"
  | "membership_missing"
  | "membership_inactive"
  | "permission_missing"
  | "mfa_required";

export interface AccessDecision {
  allowed: boolean;
  reason: AccessDecisionReason;
  principalId?: string;
  membershipId?: string;
  matchedRoleIds?: string[];
}

export interface ResolvedAuthorization {
  principal: IdentityPrincipal;
  membership: Membership;
  roles: Role[];
  permissions: Permission[];
}

export interface EntityIdentityLinkAdapter {
  findEntityIdsByPrincipal(principal: IdentityPrincipal): Promise<string[]>;
}

export interface IdentityEventSink {
  publish(event: IdentityEvent): Promise<void> | void;
}

export interface IdentityEvent {
  type:
    | "identity.access.allowed"
    | "identity.access.denied"
    | "identity.membership.created"
    | "identity.membership.suspended"
    | "identity.role.assigned"
    | "identity.role.revoked";
  occurredAt: string;
  principalId?: string;
  membershipId?: string;
  permission?: string;
  scopeType?: string;
  scopeId?: string;
  reason?: AccessDecisionReason;
  metadata?: Record<string, unknown>;
}
