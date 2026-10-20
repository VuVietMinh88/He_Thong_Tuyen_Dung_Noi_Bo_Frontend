import { describe, expect, it } from 'vitest';
import { getDashboardOverviewMetrics } from '../src/utils/dashboardOverviewHelper';

describe('getDashboardOverviewMetrics', () => {
  it('counts active published positions, received CVs, pending stages, and monthly offers', () => {
    const metrics = getDashboardOverviewMetrics(
      [
        { status: 'PUBLISHED', publishCareerPage: true, deadline: '2026-10-20' },
        { status: 'PUBLISHED', publishCareerPage: true, deadline: '2026-10-16' },
        { status: 'CLOSED', publishCareerPage: true, deadline: '2026-11-20' },
        { status: 'PUBLISHED', publishCareerPage: false, deadline: '2026-11-20' },
      ],
      [
        { status: 'Mới tiếp nhận' },
        { status: 'Đang đánh giá' },
        { status: 'Phỏng vấn' },
        {},
      ],
      12,
      new Date('2026-10-17T12:00:00'),
    );

    expect(metrics).toEqual({
      openPositions: 1,
      receivedCVs: 4,
      pendingApplications: 2,
      offersSentThisMonth: 12,
    });
  });
});
