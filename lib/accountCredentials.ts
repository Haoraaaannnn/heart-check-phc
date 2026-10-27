/** @fileoverview Shared validation and login naming for generated thesis accounts. */
export interface AccountCredentials { email: string; password: string }

/** @param value - Untrusted role. @returns Whether account management supports it. */
export function isAccountRole(value: unknown): value is 'registration' | 'nurse' | 'doctor' | 'admin' | 'superadmin' {
  return value === 'registration' || value === 'nurse' || value === 'doctor' || value === 'admin' || value === 'superadmin';
}

/** @param options - Selected username and role. @returns Reserved test login, or empty for invalid inputs. */
export function accountEmail(options: { username: string; role: string }): string {
  const username = options.username.trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9_-]{0,31}$/.test(username) || !isAccountRole(options.role)) return '';
  return `${username}.${options.role}@heartcheck.test`;
}

/** @param value - Untrusted response field. @returns Validated credentials or null. */
export function parseCredentials(value: unknown): AccountCredentials | null {
  if (typeof value !== 'object' || value === null || !('email' in value) || !('password' in value)) return null;
  if (typeof value.email !== 'string' || typeof value.password !== 'string') return null;
  return { email: value.email, password: value.password };
}
