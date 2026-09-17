"use client";

import { useId } from "react";
import { formatAbs } from "@/lib/money";
import type { MonthPoint } from "@/lib/trends";

const SERIES_COLORS: Record<"spend" | "income" | "recurring", string> = {
  spend: "#9F2D20",
  income: "#0F6B5C",
  recurring: "#C4A15A",
};

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
  const primaryColor = SERIES_COLORS[primary];
  const secondaryColor = SERIES_COLORS[secondary];
  const gradientId = `primaryFill-${useId().replace(/:/g, "")}`;

  const last = points[points.length - 1];

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-44 w-full overflow-visible" role="img" aria-label={`${primaryLabel} versus ${secondaryLabel}`}>
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={primaryColor} stopOpacity="0.28" />
            <stop offset="100%" stopColor={primaryColor} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={`M ${base} L ${primaryPts.join(" L ")} L ${end} Z`} fill={`url(#${gradientId})`} />
        <polyline points={secondaryPts.join(" ")} fill="none" stroke={secondaryColor} strokeWidth="2.5" strokeDasharray="5 4" strokeLinejoin="round" strokeLinecap="round" />
        <polyline points={primaryPts.join(" ")} fill="none" stroke={primaryColor} strokeWidth="2.75" strokeLinejoin="round" strokeLinecap="round" />
        {primaryPts.map((point, index) => {
          const [x, y] = point.split(",");
          const isLast = index === primaryPts.length - 1;
          return <circle key={point} cx={x} cy={y} r={isLast ? 4.5 : 3} fill={isLast ? primaryColor : "#fff"} stroke={primaryColor} strokeWidth="2" />;
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
          <span className="inline-flex items-center gap-1.5 font-medium" style={{ color: primaryColor }}>
            <span className="h-1.5 w-4 rounded-full" style={{ backgroundColor: primaryColor }} />
            {primaryLabel} {last ? formatAbs(last[primary]) : ""}
          </span>
          <span className="inline-flex items-center gap-1.5 font-medium" style={{ color: secondaryColor }}>
            <span className="h-1.5 w-4 rounded-full" style={{ backgroundColor: secondaryColor }} />
            {secondaryLabel} {last ? formatAbs(last[secondary]) : ""}
          </span>
        </div>
      </div>
    </div>
  );
}
