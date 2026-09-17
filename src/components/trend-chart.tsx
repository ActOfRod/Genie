"use client";

import { formatAbs } from "@/lib/money";
import type { MonthPoint } from "@/lib/trends";

export function TrendChart({
  points,
  primary = "spend",
  secondary = "income",
  primaryLabel = "Spend",
  secondaryLabel = "Income",
}: {
  points: MonthPoint[];
  primary?: "spend" | "income" | "recurring";
  secondary?: "spend" | "income" | "recurring";
  primaryLabel?: string;
  secondaryLabel?: string;
}) {
  const width = 320;
  const height = 168;
  const padX = 8;
  const padTop = 12;
  const padBottom = 24;
  const innerW = width - padX * 2;
  const innerH = height - padTop - padBottom;
  const max = Math.max(...points.flatMap((point) => [point[primary], point[secondary]]), 1);

  function coords(values: number[]) {
    if (values.length === 1) {
      return [`${padX + innerW / 2},${padTop + innerH - (values[0] / max) * innerH}`];
    }
    return values.map((value, index) => {
      const x = padX + (index / (values.length - 1)) * innerW;
      const y = padTop + innerH - (value / max) * innerH;
      return `${x},${y}`;
    });
  }

  const primaryPts = coords(points.map((point) => point[primary]));
  const secondaryPts = coords(points.map((point) => point[secondary]));
  const base = `${padX},${padTop + innerH}`;
  const end = `${padX + innerW},${padTop + innerH}`;

  const last = points[points.length - 1];

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-44 w-full overflow-visible" role="img" aria-label={`${primaryLabel} versus ${secondaryLabel}`}>
        <defs>
          <linearGradient id="spendFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#0F6B5C" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#0F6B5C" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="costFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#C4A15A" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#C4A15A" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={`M ${base} L ${primaryPts.join(" L ")} L ${end} Z`} fill="url(#spendFill)" />
        <polyline points={secondaryPts.join(" ")} fill="none" stroke="#C4A15A" strokeWidth="2.5" strokeDasharray="5 4" strokeLinejoin="round" strokeLinecap="round" />
        <polyline points={primaryPts.join(" ")} fill="none" stroke="#0F6B5C" strokeWidth="2.75" strokeLinejoin="round" strokeLinecap="round" />
        {primaryPts.map((point, index) => {
          const [x, y] = point.split(",");
          const isLast = index === primaryPts.length - 1;
          return <circle key={point} cx={x} cy={y} r={isLast ? 4.5 : 3} fill={isLast ? "#0F6B5C" : "#fff"} stroke="#0F6B5C" strokeWidth="2" />;
        })}
        {points.map((point, index) => {
          const x = points.length === 1 ? padX + innerW / 2 : padX + (index / (points.length - 1)) * innerW;
          return (
            <text key={point.month} x={x} y={height - 6} textAnchor="middle" className="fill-muted" fontSize="9">
              {point.label}
            </text>
          );
        })}
      </svg>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex gap-3">
          <span className="inline-flex items-center gap-1.5 font-medium text-teal-dark">
            <span className="h-1.5 w-4 rounded-full bg-teal" />
            {primaryLabel} {last ? formatAbs(last[primary]) : ""}
          </span>
          <span className="inline-flex items-center gap-1.5 font-medium text-muted">
            <span className="h-1.5 w-4 rounded-full bg-gold" />
            {secondaryLabel} {last ? formatAbs(last[secondary]) : ""}
          </span>
        </div>
      </div>
    </div>
  );
}
