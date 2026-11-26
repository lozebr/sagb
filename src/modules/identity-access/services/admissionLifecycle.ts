// Prevent stale async responses from reopening the shell after logout/account switch.
export class AdmissionRevision {
  private revision = 0;
  begin(): number { return ++this.revision; }
  invalidate(): void { ++this.revision; }
  isCurrent(revision: number): boolean { return revision === this.revision; }
}
export function getRecoveryCode(path: string, search: string, pending: boolean): string | null {
  if (path !== '/auth/reset-password' || !pending) return null;
  const params = new URLSearchParams(search);
  if (params.has('error') || params.has('error_code')) return null;
  const code = params.get('code');
  return code && code.length <= 2048 ? code : null;
}
