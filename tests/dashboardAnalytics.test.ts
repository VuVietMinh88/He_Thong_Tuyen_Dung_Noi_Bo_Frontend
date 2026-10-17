import { describe, expect, it } from 'vitest';
import type { CandidateProfile } from '../src/types/candidate';
import { DEFAULT_SLA_SETTINGS } from '../src/types/sla';
import {
  buildRecruitmentTrend,
  getDashboardActionItems,
} from '../src/utils/dashboardAnalyticsHelper';

const makeCandidate = (
  id: string,
  appliedAt: string,
  updatedAt = appliedAt,
): CandidateProfile => ({
  id,
  fullName: `Ứng viên ${id}`,
  email: `${id}@example.com`,
  phone: '0900000000',
  cvParsingStatus: 'CONFIRMED',
  status: 'NEW',
  appliedAt,
  updatedAt,
});

describe('buildRecruitmentTrend', () => {
  const referenceDate = new Date(2026, 5, 17, 12);

  it('groups application counts into the last eight weeks, including empty weeks', () => {
    const result = buildRecruitmentTrend([
      makeCandidate('this-week', '2026-06-16T12:00:00'),
      makeCandidate('last-week', '2026-06-10T12:00:00'),
      makeCandidate('outside-range', '2026-04-01T12:00:00'),
    ], 'WEEKLY', referenceDate);

    expect(result).toHaveLength(8);
    expect(result.map((point) => point.applications).reduce((sum, count) => sum + count, 0)).toBe(2);
    expect(result.at(-1)?.applications).toBe(1);
    expect(result.at(-2)?.applications).toBe(1);
  });

  it('groups application counts into the last six calendar months', () => {
    const result = buildRecruitmentTrend([
      makeCandidate('january', '2026-01-12T12:00:00'),
      makeCandidate('june', '2026-06-02T12:00:00'),
      makeCandidate('last-year', '2025-12-25T12:00:00'),
    ], 'MONTHLY', referenceDate);

    expect(result).toHaveLength(6);
    expect(result.map((point) => point.applications)).toEqual([1, 0, 0, 0, 0, 1]);
  });
});

describe('getDashboardActionItems', () => {
  it('returns SLA-overdue candidates with the highest urgency first', () => {
    const result = getDashboardActionItems(
      [
        makeCandidate(
          'overdue',
          '2026-06-01T12:00:00',
          '2026-06-01T12:00:00',
        ),
        makeCandidate(
          'warning',
          '2026-06-15T12:00:00',
          '2026-06-15T12:00:00',
        ),
      ],
      [],
      DEFAULT_SLA_SETTINGS,
      new Date(2026, 5, 17, 12),
    );

    expect(result.map((item) => item.id)).toEqual(['candidate-overdue', 'candidate-warning']);
    expect(result[0].priority).toBe('OVERDUE');
    expect(result[0].href).toBe('/candidates/overdue');
    expect(result[1].priority).toBe('DUE_SOON');
  });
});
