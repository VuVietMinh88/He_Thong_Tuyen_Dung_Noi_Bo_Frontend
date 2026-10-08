import { describe, expect, it } from 'vitest';
import { isSensitiveField } from '../src/services/sessionDraft.service';

describe('session-expiry form draft safety', () => {
  it('never persists passwords, tokens, secrets or verification codes', () => {
    expect(isSensitiveField({ type: 'password', name: 'currentPassword' })).toBe(true);
    expect(isSensitiveField({ name: 'accessToken' })).toBe(true);
    expect(isSensitiveField({ autocomplete: 'one-time-code' })).toBe(true);
    expect(isSensitiveField({ name: 'candidateName', type: 'text' })).toBe(false);
  });

  it('does not persist hidden or file controls', () => {
    expect(isSensitiveField({ type: 'hidden', name: 'state' })).toBe(true);
    expect(isSensitiveField({ type: 'file', name: 'resume' })).toBe(true);
  });
});
