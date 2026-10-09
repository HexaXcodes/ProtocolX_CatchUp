import type { Profile, Role } from './types';

export const ROLE_INTERESTS: Record<Role, string[]> = {
  student: ['assignment', 'exam', 'submission', 'class', 'project'],
  developer: ['bug', 'deploy', 'api', 'review', 'blocked', 'test'],
  lead: ['deadline', 'owner', 'status', 'blocked', 'decision', 'milestone'],
  custom: [],
};
const KEY = 'catchup.profile.v1';
export function validateProfile(value: unknown): Profile {
  const p = value as Partial<Profile> | null;
  if (!p || typeof p.name !== 'string' || !p.name.trim() || p.name.length > 100 || !Object.hasOwn(ROLE_INTERESTS, p.role || '') || !Array.isArray(p.interests) || p.interests.length > 20 || p.interests.some(i => typeof i !== 'string' || i.length > 60) || typeof p.responsibilities !== 'string' || p.responsibilities.length > 500 || !['brief', 'detailed'].includes(p.length || '')) {
    throw new Error('Enter a name, valid role, up to 20 short interests, and responsibilities under 500 characters.');
  }
  return { name: p.name.trim(), role: p.role!, interests: p.interests.map(i => i.trim()).filter(Boolean), responsibilities: p.responsibilities, length: p.length! };
}
export function saveProfile(profile: Profile): void { localStorage.setItem(KEY, JSON.stringify(validateProfile(profile))); }
export function loadProfile(): Profile | null {
  try { const raw = localStorage.getItem(KEY); return raw ? validateProfile(JSON.parse(raw)) : null; } catch { return null; }
}
export function forgetProfile(): void { localStorage.removeItem(KEY); }
