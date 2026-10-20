import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import type { FunnelStageMetric } from '../../types/recruitmentFunnel';

export interface VisualFunnelSvgChartProps {
  stages: FunnelStageMetric[];
  onSelectStage?: (stage: FunnelStageMetric) => void;
}

interface TrapezoidGeometry {
  topHalf: number;
  bottomHalf: number;
  y1: number;
  y2: number;
}

// Tọa độ hình thang dốc thu hẹp dần của 6 tầng phễu (AC 1)
const STAGE_GEOMETRIES: TrapezoidGeometry[] = [
  { topHalf: 260, bottomHalf: 215, y1: 15, y2: 65 },  // 1. Applied
  { topHalf: 215, bottomHalf: 170, y1: 72, y2: 122 }, // 2. Screened
  { topHalf: 170, bottomHalf: 130, y1: 129, y2: 179 },// 3. Interview 1
  { topHalf: 130, bottomHalf: 95, y1: 186, y2: 236 }, // 4. Interview 2
  { topHalf: 95, bottomHalf: 68, y1: 243, y2: 293 },  // 5. Offered
  { topHalf: 68, bottomHalf: 50, y1: 300, y2: 350 },  // 6. Hired
];

const STAGE_GRADIENTS: Array<{ id: string; from: string; to: string; stroke: string }> = [
  { id: 'grad-applied', from: '#3b82f6', to: '#2563eb', stroke: '#1d4ed8' },     // Blue
  { id: 'grad-screened', from: '#6366f1', to: '#4f46e5', stroke: '#4338ca' },    // Indigo
  { id: 'grad-int1', from: '#8b5cf6', to: '#7c3aed', stroke: '#6d28d9' },        // Violet
  { id: 'grad-int2', from: '#a855f7', to: '#9333ea', stroke: '#7e22ce' },        // Purple
  { id: 'grad-offered', from: '#f59e0b', to: '#d97706', stroke: '#b45309' },     // Amber
  { id: 'grad-hired', from: '#10b981', to: '#059669', stroke: '#047857' },       // Emerald
];

export const VisualFunnelSvgChart: React.FC<VisualFunnelSvgChartProps> = ({
  stages,
  onSelectStage,
}) => {
  const [hoveredStageId, setHoveredStageId] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  const centerX = 300;
  const hoveredStage = stages.find((s) => s.id === hoveredStageId);

  const handleMouseEnter = (stage: FunnelStageMetric, e: React.MouseEvent) => {
    setHoveredStageId(stage.id);
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({
      x: rect.left + rect.width / 2,
      y: rect.top,
    });
  };

  const handleMouseLeave = () => {
    setHoveredStageId(null);
    setTooltipPos(null);
  };

  return (
    <div
      data-testid="visual-funnel-svg-chart"
      className="relative flex flex-col items-center p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs"
    >
      <div className="w-full flex items-center justify-between pb-3 mb-2 border-b border-gray-100 dark:border-gray-800">
        <div>
          <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-blue-500" />
            Biểu đồ phễu thu hẹp độ dốc hình học (Geometric Funnel)
          </h4>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            Minh họa lưu lượng chuyển đổi và điểm rơi trực quan theo từng tầng tuyển dụng
          </p>
        </div>
      </div>

      {/* SVG Canvas (AC 1) */}
      <div className="w-full max-w-2xl relative flex justify-center">
        <svg
          data-testid="funnel-svg-element"
          viewBox="0 0 600 370"
          className="w-full h-auto drop-shadow-md select-none"
        >
          <defs>
            {STAGE_GRADIENTS.map((g) => (
              <linearGradient key={g.id} id={g.id} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={g.from} />
                <stop offset="100%" stopColor={g.to} />
              </linearGradient>
            ))}

            {/* Glowing filter cho điểm rơi lớn nhất (AC 2) */}
            <filter id="glow-dropoff" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#f43f5e" floodOpacity="0.8" />
            </filter>
          </defs>

          {/* Render 6 tầng hình thang phễu */}
          {stages.map((stage, idx) => {
            const geo = STAGE_GEOMETRIES[idx] || { topHalf: 60, bottomHalf: 40, y1: 300, y2: 350 };
            const grad = STAGE_GRADIENTS[idx] || STAGE_GRADIENTS[0];
            const isHovered = hoveredStageId === stage.id;
            const isBiggestDrop = Boolean(stage.isBiggestDropOff);

            // Tọa độ hình thang
            const p1 = `${centerX - geo.topHalf},${geo.y1}`;
            const p2 = `${centerX + geo.topHalf},${geo.y1}`;
            const p3 = `${centerX + geo.bottomHalf},${geo.y2}`;
            const p4 = `${centerX - geo.bottomHalf},${geo.y2}`;
            const pathData = `M ${p1} L ${p2} L ${p3} L ${p4} Z`;

            const centerY = (geo.y1 + geo.y2) / 2;

            return (
              <g
                key={stage.id}
                data-testid={`funnel-trapezoid-${stage.id.toLowerCase()}`}
                className="cursor-pointer transition-transform duration-200"
                onClick={() => onSelectStage?.(stage)}
                onMouseEnter={(e) => handleMouseEnter(stage, e)}
                onMouseLeave={handleMouseLeave}
              >
                {/* Hình thang phễu */}
                <path
                  d={pathData}
                  fill={`url(#${grad.id})`}
                  stroke={isBiggestDrop ? '#f43f5e' : isHovered ? '#ffffff' : grad.stroke}
                  strokeWidth={isBiggestDrop ? 3.5 : isHovered ? 2.5 : 1.5}
                  filter={isBiggestDrop ? 'url(#glow-dropoff)' : undefined}
                  className="transition-all duration-300 hover:opacity-95"
                />

                {/* Text: Tên vòng & Số lượng ứng viên */}
                <text
                  x={centerX}
                  y={centerY - 5}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize={idx <= 3 ? "12" : "10"}
                  fontWeight="bold"
                  className="pointer-events-none drop-shadow-sm"
                >
                  {`${stage.stageOrder}. ${stage.name.split('(')[0].trim()}`}
                </text>

                <text
                  x={centerX}
                  y={centerY + 11}
                  textAnchor="middle"
                  fill="#ffffff"
                  fillOpacity="0.95"
                  fontSize={idx <= 3 ? "11" : "9"}
                  fontWeight="600"
                  className="pointer-events-none"
                >
                  {`${stage.count} ứng viên (${stage.retentionRate}%)`}
                </text>

                {/* Huy hiệu cảnh báo điểm rơi lớn nhất trên hình phễu (AC 2) */}
                {isBiggestDrop && (
                  <g
                    data-testid={`svg-badge-dropoff-${stage.id.toLowerCase()}`}
                    transform={`translate(${centerX + geo.topHalf - 45}, ${geo.y1 - 2})`}
                  >
                    <rect
                      x="0"
                      y="0"
                      width="100"
                      height="20"
                      rx="10"
                      fill="#e11d48"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                      className="animate-pulse"
                    />
                    <text
                      x="50"
                      y="14"
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="9"
                      fontWeight="bold"
                    >
                      {`⚠️ Rớt ${stage.dropRate}%`}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip chi tiết (AC 1) */}
        {hoveredStage && tooltipPos && (
          <div
            data-testid="funnel-hover-tooltip"
            className="absolute z-30 pointer-events-none transform -translate-x-1/2 -top-4 bg-gray-900/95 text-white p-3 rounded-xl shadow-xl border border-gray-700/80 backdrop-blur-md w-64 space-y-2 text-xs animate-fade-in"
          >
            <div className="flex items-center justify-between pb-1.5 border-b border-gray-700">
              <span className="font-black text-blue-400">
                {`Tầng ${hoveredStage.stageOrder}: ${hoveredStage.name}`}
              </span>
              {hoveredStage.isBiggestDropOff && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white">
                  ĐIỂM RƠI
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-gray-400">Ứng viên:</span>
                <span className="ml-1 font-bold text-white">{hoveredStage.count}</span>
              </div>
              <div>
                <span className="text-gray-400">Qua vòng:</span>
                <span className="ml-1 font-bold text-emerald-400">{hoveredStage.passRate}%</span>
              </div>
              <div>
                <span className="text-gray-400">Bị loại/rút:</span>
                <span className="ml-1 font-bold text-rose-400">-{hoveredStage.dropCount} ({hoveredStage.dropRate}%)</span>
              </div>
              <div>
                <span className="text-gray-400">Giữ chân:</span>
                <span className="ml-1 font-bold text-blue-300">{hoveredStage.retentionRate}%</span>
              </div>
            </div>

            <div className="text-[10px] text-gray-400 pt-1 border-t border-gray-800 flex items-center justify-between">
              <span>Thời gian xử lý TB:</span>
              <span className="font-semibold text-amber-300">{hoveredStage.avgDaysInStage} ngày</span>
            </div>
          </div>
        )}
      </div>

      {/* Chú giải nhãn màu bên dưới */}
      <div className="flex items-center justify-center flex-wrap gap-3 mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 text-[11px] text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
          <span>Ứng tuyển mới</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
          <span>Duyệt hồ sơ</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-violet-500" />
          <span>Phỏng vấn 1</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />
          <span>Phỏng vấn 2</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
          <span>Đề nghị (Offer)</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          <span>Tiếp nhận (Hired)</span>
        </span>
      </div>
    </div>
  );
};
