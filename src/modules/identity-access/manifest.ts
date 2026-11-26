// Metadata only: bootstrap is not an operational menu toggle.
export const identityAccessManifest = {
  id: 'identity-access',
  internalName: 'identity-access',
  displayName: 'Identidade e Acesso',
  baseRoute: '/identity-access',
  icon: 'ShieldCheckIcon',
  initialStatus: 'inactive',
  essential: true,
  lifecycle: 'prepared-not-activated',
} as const;
