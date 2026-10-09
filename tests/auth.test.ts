import test from 'node:test';
import assert from 'node:assert/strict';
import { validateRedirectDestination, getInitialsFromEmail, isAuthConfigured } from '../frontend/src/auth';
import { getScopeKey, saveProfile, loadProfile, forgetProfile } from '../backend/src/core/profile';
import type { Profile } from '../backend/src/core/types';

// Mock localStorage for node environment test execution
class LocalStorageMock {
  private store: Record<string, string> = {};
  getItem(key: string) { return this.store[key] ?? null; }
  setItem(key: string, value: string) { this.store[key] = String(value); }
  removeItem(key: string) { delete this.store[key]; }
  clear() { this.store = {}; }
}
if (typeof globalThis.localStorage === 'undefined') {
  (globalThis as unknown as { localStorage: LocalStorageMock }).localStorage = new LocalStorageMock();
}

test('validateRedirectDestination restricts URLs to allowed destinations', () => {
  assert.equal(validateRedirectDestination('/workspace'), '/workspace');
  assert.equal(validateRedirectDestination('/account'), '/account');
  assert.equal(validateRedirectDestination('/privacy'), '/privacy');
  assert.equal(validateRedirectDestination('/login'), '/login');
  assert.equal(validateRedirectDestination('https://attacker.com/phish'), '/workspace');
  assert.equal(validateRedirectDestination('javascript:alert(1)'), '/workspace');
  assert.equal(validateRedirectDestination(null), '/workspace');
});

test('getInitialsFromEmail derives initials correctly', () => {
  assert.equal(getInitialsFromEmail('marcus.chen@domain.org', 'Marcus Chen'), 'MC');
  assert.equal(getInitialsFromEmail('alex@domain.org', 'Alex'), 'AL');
  assert.equal(getInitialsFromEmail('dev@company.com'), 'DE');
  assert.equal(getInitialsFromEmail(''), 'GU');
});

test('browser redirect validation rejects external URLs and strips query credentials', () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'window');
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { location: { origin: 'https://catchup.example' } } });
  try {
    assert.equal(validateRedirectDestination('https://catchup.example/account?token=private#fragment'), '/account');
    assert.equal(validateRedirectDestination('//attacker.example/account'), '/workspace');
    assert.equal(validateRedirectDestination('https://catchup.example.attacker.example/account'), '/workspace');
    assert.equal(validateRedirectDestination('https://catchup.example@attacker.example/account'), '/workspace');
    assert.equal(validateRedirectDestination('/unknown'), '/workspace');
  } finally {
    if (previous) Object.defineProperty(globalThis, 'window', previous);
    else Reflect.deleteProperty(globalThis, 'window');
  }
});

test('getScopeKey isolates keys for guest vs authenticated users', () => {
  assert.equal(getScopeKey(null), 'catchup.profile.guest');
  assert.equal(getScopeKey(undefined), 'catchup.profile.guest');
  assert.equal(getScopeKey('usr_123'), 'catchup.profile.user.usr_123');
  assert.equal(getScopeKey('usr_456'), 'catchup.profile.user.usr_456');
  assert.notEqual(getScopeKey('usr_123'), getScopeKey('usr_456'));
});

test('scoped profile storage prevents cross-user preference leakage', () => {
  localStorage.clear();
  const guestProfile: Profile = { name: 'GuestUser', role: 'student', interests: ['homework'], responsibilities: '', length: 'brief' };
  const userAProfile: Profile = { name: 'UserA', role: 'developer', interests: ['api'], responsibilities: 'backend', length: 'detailed' };
  const userBProfile: Profile = { name: 'UserB', role: 'lead', interests: ['milestones'], responsibilities: 'project lead', length: 'brief' };

  saveProfile(guestProfile, null);
  saveProfile(userAProfile, 'usr_123');
  saveProfile(userBProfile, 'usr_456');

  assert.equal(loadProfile(null)?.name, 'GuestUser');
  assert.equal(loadProfile('usr_123')?.name, 'UserA');
  assert.equal(loadProfile('usr_456')?.name, 'UserB');

  forgetProfile('usr_123');
  assert.equal(loadProfile('usr_123'), null);
  assert.equal(loadProfile('usr_456')?.name, 'UserB');
  assert.equal(loadProfile(null)?.name, 'GuestUser');
});

test('isAuthConfigured detects missing Supabase configuration gracefully', () => {
  assert.equal(typeof isAuthConfigured(), 'boolean');
});
