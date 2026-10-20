import { beforeEach, afterEach, vi } from 'vitest';
// Unit-test configuration only: contracts below are HTTP-mocked, not VPS evidence.
beforeEach(() => vi.stubEnv('VITE_BACKEND_CAPABILITIES', JSON.stringify({
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1',
  backendSha256: '0'.repeat(64), verifiedAt: '2026-10-20T00:00:00Z',
  features: { schedules: 'AVAILABLE', scheduleWrites: 'AVAILABLE', evaluations: 'AVAILABLE', reopening: 'AVAILABLE',
    participantPicker: 'NOT_IMPLEMENTED', assignedProfile: 'NOT_IMPLEMENTED', bulkScheduling: 'NOT_IMPLEMENTED' },
})));
afterEach(() => vi.unstubAllEnvs());
