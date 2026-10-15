import React, { useState } from 'react';
import type { CompetencyBenchmarkItem } from '../../../types/candidateEvaluationSummary';
import { calculateRadarPoints } from '../../../utils/candidateEvaluationSummaryHelper';

export interface CompetencyRadarChartProps {
  benchmarks: CompetencyBenchmarkItem[];
  size?: number;
  candidateName?: string;
}

export const CompetencyRadarChart: React.FC<CompetencyRadarChartProps> = ({
  benchmarks,
  size = 360,
  candidateName = 'Ứng viên',
}) => {
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  const center = size / 2;
  const radius = size * 0.35; // 35% kích thước để chừa lề cho nhãn văn bản

  const {
    candidatePolygonPoints,
    targetPolygonPoints,
    axes,
    candidatePoints,
    targetPoints,
  } = calculateRadarPoints(benchmarks, radius, center, 5);

  // Vòng tròn mốc điểm (1, 2, 3, 4, 5)
  const gridLevels = [1, 2, 3, 4, 5];

  return (
    <div
      data-testid="competency-radar-chart-container"
      className="flex flex-col items-center justify-center p-3"
    >
      <div className="relative w-full max-w-[420px] aspect-square flex items-center justify-center">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="w-full h-full overflow-visible select-none drop-shadow-xs"
          role="img"
          aria-label="Biểu đồ mạng nhện so sánh năng lực ứng viên và chuẩn vị trí"
        >
          {/* Định nghĩa Gradient cho Polygon ứng viên */}
          <defs>
            <linearGradient id="candidateRadarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.35" />
            </linearGradient>
            <radialGradient id="radarCenterGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Vùng tâm phát sáng nhẹ */}
          <circle cx={center} cy={center} r={radius} fill="url(#radarCenterGlow)" />

          {/* Lưới các đa giác đồng tâm (Grid Levels 1 - 5) */}
          {gridLevels.map((level) => {
            const levelRadius = (radius * level) / 5;
            const levelPoints = benchmarks
              .map((_, i) => {
                const angle = (i * 2 * Math.PI) / benchmarks.length - Math.PI / 2;
                const x = center + levelRadius * Math.cos(angle);
                const y = center + levelRadius * Math.sin(angle);
                return `${x.toFixed(1)},${y.toFixed(1)}`;
              })
              .join(' ');

            return (
              <g key={`grid-level-${level}`}>
                <polygon
                  points={levelPoints}
                  fill="none"
                  stroke="currentColor"
                  strokeDasharray={level < 5 ? '2,2' : undefined}
                  className="text-gray-200 dark:text-gray-800"
                  strokeWidth={level === 5 ? '1.5' : '0.8'}
                />
                {/* Chỉ số mức điểm mốc trên trục dọc */}
                <text
                  x={center + 4}
                  y={center - levelRadius + 3}
                  className="text-[9px] font-semibold fill-gray-400 dark:fill-gray-500"
                >
                  {level}.0
                </text>
              </g>
            );
          })}

          {/* Các trục nan hoa (Spoke Axes) */}
          {axes.map((axis, i) => (
            <line
              key={`axis-line-${i}`}
              x1={center}
              y1={center}
              x2={axis.x2}
              y2={axis.y2}
              stroke="currentColor"
              className="text-gray-200 dark:text-gray-800"
              strokeWidth="1"
            />
          ))}

          {/* Đa giác Chuẩn vị trí (Target Benchmark - Nét đứt màu Slate) */}
          {targetPolygonPoints && (
            <polygon
              data-testid="target-benchmark-polygon"
              points={targetPolygonPoints}
              fill="#64748b"
              fillOpacity="0.08"
              stroke="#64748b"
              strokeWidth="1.8"
              strokeDasharray="4,3"
              className="transition-all duration-300"
            />
          )}

          {/* Đa giác Ứng viên đạt được (Candidate Polygon - Gradient Indigo/Emerald) */}
          {candidatePolygonPoints && (
            <polygon
              data-testid="candidate-achievement-polygon"
              points={candidatePolygonPoints}
              fill="url(#candidateRadarGradient)"
              stroke="#4f46e5"
              strokeWidth="2.2"
              className="transition-all duration-300 filter drop-shadow-sm"
            />
          )}

          {/* Các điểm nút Benchmark (Dấu tròn nhỏ) */}
          {targetPoints.map((pt, i) => (
            <circle
              key={`target-point-${i}`}
              cx={pt.x}
              cy={pt.y}
              r="3"
              fill="#ffffff"
              stroke="#64748b"
              strokeWidth="1.5"
              className="transition-transform duration-200"
            />
          ))}

          {/* Các điểm nút Ứng viên (Dấu tròn tương tác) */}
          {candidatePoints.map((pt, i) => {
            const isHovered = hoveredPointIndex === i;
            return (
              <g
                key={`candidate-point-${i}`}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredPointIndex(i)}
                onMouseLeave={() => setHoveredPointIndex(null)}
              >
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? '6' : '4.5'}
                  fill="#10b981"
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="transition-all duration-200 hover:scale-125"
                />
              </g>
            );
          })}

          {/* Nhãn tên các trục năng lực ở viền ngoài */}
          {axes.map((axis, i) => {
            const isHovered = hoveredPointIndex === i;
            // Canh chỉnh text anchor tùy góc
            let textAnchor: 'start' | 'middle' | 'end' = 'middle';
            const cosVal = Math.cos((i * 2 * Math.PI) / benchmarks.length - Math.PI / 2);
            if (cosVal > 0.25) textAnchor = 'start';
            else if (cosVal < -0.25) textAnchor = 'end';

            return (
              <text
                key={`axis-label-${i}`}
                x={axis.labelX}
                y={axis.labelY}
                textAnchor={textAnchor}
                className={`text-[10px] font-bold transition-colors duration-150 ${
                  isHovered
                    ? 'fill-indigo-600 dark:fill-indigo-400 font-extrabold'
                    : 'fill-gray-700 dark:fill-gray-300'
                }`}
                onMouseEnter={() => setHoveredPointIndex(i)}
                onMouseLeave={() => setHoveredPointIndex(null)}
              >
                {axis.benchmark.name.length > 22
                  ? `${axis.benchmark.name.slice(0, 20)}...`
                  : axis.benchmark.name}
              </text>
            );
          })}
        </svg>

        {/* Tooltip nổi khi hover vào điểm năng lực */}
        {hoveredPointIndex !== null && benchmarks[hoveredPointIndex] && (
          <div
            data-testid="radar-tooltip"
            className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 rounded-xl bg-gray-900/95 px-3 py-2 text-xs text-white shadow-xl backdrop-blur-xs border border-gray-700 pointer-events-none transition-all duration-150 animate-in fade-in"
          >
            <div className="font-bold text-amber-300">
              {benchmarks[hoveredPointIndex].name}
            </div>
            <div className="mt-1 flex items-center gap-3 text-[11px]">
              <div>
                <span className="text-gray-400">Ứng viên: </span>
                <span className="font-bold text-emerald-400">
                  {benchmarks[hoveredPointIndex].score.toFixed(1)}/5.0
                </span>
              </div>
              <div>
                <span className="text-gray-400">Chuẩn vị trí: </span>
                <span className="font-bold text-slate-300">
                  {benchmarks[hoveredPointIndex].targetScore.toFixed(1)}/5.0
                </span>
              </div>
              <div>
                <span className="text-gray-400">Độ lệch: </span>
                <span
                  className={`font-bold ${
                    benchmarks[hoveredPointIndex].gap >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {benchmarks[hoveredPointIndex].gap >= 0
                    ? `+${benchmarks[hoveredPointIndex].gap.toFixed(1)}`
                    : benchmarks[hoveredPointIndex].gap.toFixed(1)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chú giải (Legend) */}
      <div className="mt-2 flex flex-wrap items-center justify-center gap-5 text-xs">
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-5 rounded-xs bg-indigo-600/70 border border-emerald-500" />
          <span className="font-semibold text-gray-800 dark:text-gray-200">
            {`${candidateName} (Điểm đạt được)`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-0.5 w-5 border-t-2 border-dashed border-slate-500" />
          <span className="text-gray-600 dark:text-gray-400 font-medium">
            Điểm chuẩn kỳ vọng vị trí
          </span>
        </div>
      </div>
    </div>
  );
};

export default CompetencyRadarChart;
