import { useState, type FC } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { CandidateProfile } from '../../types/candidate';
import {
  buildRecruitmentTrend,
  type DashboardTrendRange,
} from '../../utils/dashboardAnalyticsHelper';

interface RecruitmentTrendChartProps {
  candidates: CandidateProfile[];
}

const RecruitmentTrendChart: FC<RecruitmentTrendChartProps> = ({ candidates }) => {
  const [range, setRange] = useState<DashboardTrendRange>('WEEKLY');
  const data = buildRecruitmentTrend(candidates, range);

  return (
    <section
      aria-labelledby="recruitment-trend-title"
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 id="recruitment-trend-title" className="font-bold text-slate-900">
            Xu hướng tiếp nhận hồ sơ
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Số CV theo ngày nộp hồ sơ trong dữ liệu hiện có
          </p>
        </div>
        <div
          className="inline-flex w-fit rounded-lg bg-slate-100 p-1"
          aria-label="Chọn khoảng thời gian biểu đồ"
        >
          {([
            ['WEEKLY', 'Theo tuần'],
            ['MONTHLY', 'Theo tháng'],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setRange(value)}
              aria-pressed={range === value}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                range === value
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {candidates.length === 0 ? (
        <div className="mt-5 flex h-64 items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-500">
          Chưa có dữ liệu hồ sơ để hiển thị xu hướng.
        </div>
      ) : (
        <div className="mt-5 h-64 w-full" role="img" aria-label="Biểu đồ số hồ sơ tiếp nhận">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
                minTickGap={12}
              />
              <YAxis
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
                width={36}
              />
              <Tooltip
                contentStyle={{
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  boxShadow: '0 8px 24px rgb(15 23 42 / 0.1)',
                }}
                formatter={(value) => [`${value ?? 0} hồ sơ`, 'CV tiếp nhận']}
                labelStyle={{ color: '#0f172a', fontWeight: 600 }}
              />
              <Line
                type="monotone"
                dataKey="applications"
                name="CV tiếp nhận"
                stroke="#4f46e5"
                strokeWidth={3}
                dot={{ r: 3, fill: '#4f46e5', strokeWidth: 0 }}
                activeDot={{ r: 6, stroke: '#c7d2fe', strokeWidth: 4 }}
                isAnimationActive
                animationDuration={650}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
};

export default RecruitmentTrendChart;
