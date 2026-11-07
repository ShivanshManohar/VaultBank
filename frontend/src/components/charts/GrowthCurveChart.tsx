import React, { useState } from 'react';
import { Calendar, ArrowUpRight, ExternalLink } from 'lucide-react';
import { GrowthTrajectoryPoint } from '../../types';
import { getGoogleCalendarUrl } from '../../utils/googleCalendar';

interface GrowthCurveChartProps {
  trajectory: GrowthTrajectoryPoint[];
  height?: number;
  startDate?: string | Date;
}

export const GrowthCurveChart: React.FC<GrowthCurveChartProps> = ({
  trajectory,
  height = 340,
  startDate = new Date(),
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!trajectory || trajectory.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 border border-gold-subtle rounded-xl text-stone-muted">
        Insufficient trajectory points to render projection curve.
      </div>
    );
  }

  const baseDate = new Date(startDate);

  // Compute exact calendar date for each point
  const pointsWithDates = trajectory.map((p) => {
    const d = new Date(baseDate.getTime() + p.month * 30.4375 * 24 * 3600 * 1000);
    const shortLabel = d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
    const fullDate = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    return {
      ...p,
      calendarDate: fullDate,
      shortLabel,
      rawDate: d,
    };
  });

  const maxVal = Math.max(...trajectory.map((p) => p.totalValue)) * 1.05;
  const minVal = Math.min(...trajectory.map((p) => p.principal)) * 0.95;
  const paddingX = 60;
  const paddingY = 45;
  const chartWidth = 780;
  const chartHeight = height;

  const getX = (index: number) => paddingX + (index / (trajectory.length - 1)) * (chartWidth - paddingX * 2);
  const getY = (val: number) => chartHeight - paddingY - ((val - minVal) / (maxVal - minVal)) * (chartHeight - paddingY * 2);

  // Curve coordinates
  const pointsString = pointsWithDates.map((p, i) => `${getX(i)},${getY(p.totalValue)}`).join(' ');
  const principalPointsString = pointsWithDates.map((p, i) => `${getX(i)},${getY(p.principal)}`).join(' ');

  const areaString =
    `M ${getX(0)},${getY(pointsWithDates[0].totalValue)} ` +
    pointsWithDates.map((p, i) => `L ${getX(i)},${getY(p.totalValue)}`).join(' ') +
    ` L ${getX(pointsWithDates.length - 1)},${chartHeight - paddingY} ` +
    ` L ${getX(0)},${chartHeight - paddingY} Z`;

  const hoveredPoint = hoverIndex !== null ? pointsWithDates[hoverIndex] : pointsWithDates[pointsWithDates.length - 1];

  // Calendar event link for the selected or final maturity milestone
  const googleCalUrl = getGoogleCalendarUrl({
    title: `VaultBank Term Deposit Maturity — Payout ₹${hoveredPoint.totalValue.toLocaleString('en-IN')}`,
    description: `Compounded term deposit scheduled to mature by ${hoveredPoint.calendarDate}. Principal ₹${hoveredPoint.principal.toLocaleString('en-IN')} + Yield ₹${hoveredPoint.cumulativeInterest.toLocaleString('en-IN')}. Funds auto-settle to reserve account.`,
    startDate: hoveredPoint.rawDate,
  });

  return (
    <div className="relative w-full overflow-hidden glass-panel rounded-2xl p-6 space-y-4">
      {/* Dynamic Date & Yield Header Callout */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-gold-subtle/40">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-champagne uppercase tracking-widest">
            <Calendar className="w-3.5 h-3.5" />
            <span>Target Date: {hoveredPoint.calendarDate}</span>
          </div>
          <div className="text-3xl font-serif text-champagne font-bold mt-1">
            ₹{hoveredPoint.totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-stone-muted mt-0.5">
            By <strong className="text-ivory">{hoveredPoint.calendarDate}</strong> ({hoveredPoint.month} months), your ₹{hoveredPoint.principal.toLocaleString('en-IN')} will grow by <span className="text-success font-semibold">+₹{hoveredPoint.cumulativeInterest.toLocaleString('en-IN')}</span>.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:block text-right">
            <span className="text-xs text-stone-muted block">Compounded Yield</span>
            <span className="text-base text-success font-bold">
              +₹{hoveredPoint.cumulativeInterest.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <a
            href={googleCalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl btn-gold-outline text-xs font-semibold flex items-center gap-1.5 hover:scale-105 transition"
            title="Add this maturity target date to your Google Calendar"
          >
            <Calendar className="w-3.5 h-3.5 text-champagne" />
            <span>Add Date to Google Calendar</span>
            <ExternalLink className="w-3 h-3 text-stone-muted" />
          </a>
        </div>
      </div>

      {/* Interactive SVG Chart */}
      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-auto min-w-[580px]"
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id="growthAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#C5A46D" stopOpacity="0.45" />
              <stop offset="60%" stopColor="#C5A46D" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#C5A46D" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Reference Grid lines */}
          {[0.25, 0.5, 0.75, 1.0].map((ratio, idx) => {
            const y = chartHeight - paddingY - ratio * (chartHeight - paddingY * 2);
            return (
              <line
                key={idx}
                x1={paddingX}
                y1={y}
                x2={chartWidth - paddingX}
                y2={y}
                stroke="currentColor"
                className="text-gold-subtle/30"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
            );
          })}

          {/* Shaded Interest Area */}
          <path d={areaString} fill="url(#growthAreaGradient)" />

          {/* Base Principal Line */}
          <polyline
            fill="none"
            stroke="currentColor"
            className="text-stone-muted/50"
            strokeWidth="1.5"
            strokeDasharray="5 5"
            points={principalPointsString}
          />

          {/* Dynamic Compounding Curve */}
          <polyline
            fill="none"
            stroke="#C5A46D"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={pointsString}
          />

          {/* Nodes and X-Axis Calendar Date Ticks */}
          {pointsWithDates.map((point, index) => {
            const cx = getX(index);
            const cy = getY(point.totalValue);
            const isHovered = hoverIndex === index;

            return (
              <g key={index} onMouseEnter={() => setHoverIndex(index)}>
                {/* Hit area */}
                <circle cx={cx} cy={cy} r="18" fill="transparent" className="cursor-pointer" />

                {/* Node */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 7 : 4.5}
                  fill={isHovered ? '#FFFFFF' : '#C5A46D'}
                  stroke="var(--card-solid, #171717)"
                  strokeWidth="2.5"
                  className="transition-all duration-150 cursor-pointer"
                />

                {/* Vertical Indicator Guide Line on Hover */}
                {isHovered && (
                  <line
                    x1={cx}
                    y1={cy}
                    x2={cx}
                    y2={chartHeight - paddingY}
                    stroke="#C5A46D"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />
                )}

                {/* Calendar Date on X-Axis */}
                <text
                  x={cx}
                  y={chartHeight - paddingY + 22}
                  textAnchor="middle"
                  fill="currentColor"
                  className={`text-[11px] font-sans transition-colors ${
                    isHovered ? 'font-bold text-champagne fill-current' : 'text-stone-muted fill-current'
                  }`}
                >
                  {point.shortLabel}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Timeline Footnote */}
      <div className="flex justify-between items-center text-xs text-stone-muted pt-2 border-t border-gold-subtle/30 px-2">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-0.5 bg-stone-muted inline-block" /> Principal Baseline (₹{pointsWithDates[0].principal.toLocaleString('en-IN')})
        </span>
        <span className="flex items-center gap-1 text-champagne">
          <span className="w-2.5 h-1 bg-champagne inline-block rounded-full" /> Hover nodes to view exact milestone payouts & calendar dates
        </span>
      </div>
    </div>
  );
};
