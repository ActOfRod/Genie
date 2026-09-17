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
  const height = 196;
  const padX = 18;
  const padTop = 18;
  const padBottom = 34;
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
  const chartId = useId().replace(/:/g, "");
  const gradientId = `primaryFill-${chartId}`;
  const screenId = `screenGlow-${chartId}`;
  const clipId = `chartClip-${chartId}`;
  const guideLevels = [0.2, 0.4, 0.6, 0.8];

  const last = points[points.length - 1];

  return (
    <div>
      <div className="rounded-[1.6rem] border border-[#0f6b5c]/25 bg-[#051f1b] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_20px_45px_rgba(5,31,27,0.18)]">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-52 w-full overflow-visible" role="img" aria-label={`${primaryLabel} versus ${secondaryLabel}`}>
          <defs>
            <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={primaryColor} stopOpacity="0.42" />
              <stop offset="100%" stopColor={primaryColor} stopOpacity="0.03" />
            </linearGradient>
            <radialGradient id={screenId} cx="50%" cy="35%" r="80%">
              <stop offset="0%" stopColor="#0f6b5c" stopOpacity="0.22" />
              <stop offset="55%" stopColor="#0f6b5c" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#051f1b" stopOpacity="0" />
            </radialGradient>
            <clipPath id={clipId}>
              <rect x={padX} y={padTop} width={innerW} height={innerH} rx="12" />
            </clipPath>
          </defs>
          <rect width={width} height={height} rx="24" fill="#051f1b" />
          <rect width={width} height={height} rx="24" fill={`url(#${screenId})`} />
          <g clipPath={`url(#${clipId})`}>
            {guideLevels.map((level) => {
              const y = padTop + innerH - innerH * level;
              return (
                <line
                  key={level}
                  x1={padX}
                  x2={padX + innerW}
                  y1={y}
                  y2={y}
                  stroke="rgba(123, 217, 194, 0.12)"
                  strokeWidth="1"
                />
              );
            })}
            {points.map((point, index) => {
              const x = points.length === 1 ? padX + innerW / 2 : padX + (index / (points.length - 1)) * innerW;
              return (
                <line
                  key={`grid-${point.month}`}
                  x1={x}
                  x2={x}
                  y1={padTop}
                  y2={padTop + innerH}
                  stroke="rgba(123, 217, 194, 0.08)"
                  strokeWidth="1"
                />
              );
            })}
            <path d={`M ${base} L ${primaryPts.join(" L ")} L ${end} Z`} fill={`url(#${gradientId})`} />
            <polyline
              points={secondaryPts.join(" ")}
              fill="none"
              stroke={secondaryColor}
              strokeWidth="2.5"
              strokeDasharray="5 4"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            <polyline
              points={primaryPts.join(" ")}
              fill="none"
              stroke={primaryColor}
              strokeWidth="2.75"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </g>
          {primaryPts.map((point, index) => {
            const [x, y] = point.split(",");
            const isLast = index === primaryPts.length - 1;
            return (
              <circle
                key={`${points[index]?.month ?? "point"}-${point}`}
                cx={x}
                cy={y}
                r={isLast ? 4.5 : 3}
                fill={isLast ? primaryColor : "#dff7f0"}
                stroke={primaryColor}
                strokeWidth="2"
              />
            );
          })}
          {secondaryPts.map((point, index) => {
            if (index !== secondaryPts.length - 1) return null;
            const [x, y] = point.split(",");
            return <circle key={`secondary-${point}`} cx={x} cy={y} r="3.5" fill="#051f1b" stroke={secondaryColor} strokeWidth="2" />;
          })}
          {points.map((point, index) => {
            const x = points.length === 1 ? padX + innerW / 2 : padX + (index / (points.length - 1)) * innerW;
            return (
              <text key={point.month} x={x} y={height - 10} textAnchor="middle" fill="rgba(223, 247, 240, 0.76)" fontSize="9">
                {point.label}
              </text>
            );
          })}
        </svg>
      </div>
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
