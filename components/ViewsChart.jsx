"use client";

import { useId } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { buildViewsChartData } from "@/lib/chart-data.js";
import { formatAxisDate, formatAxisViews, formatViews } from "@/lib/format.js";

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;

  const point = payload[0].payload;

  return (
    <div
      className="px-3 py-2.5 text-sm"
      style={{
        background: "#fff",
        border: "1px solid var(--color-border)",
        borderRadius: 12,
        boxShadow: "0 4px 16px rgba(91, 91, 214, 0.12)",
        fontFamily: "var(--font-body)",
      }}
    >
      <p
        className="font-semibold mb-1"
        style={{ fontFamily: "var(--font-display)", color: "var(--color-text)" }}
      >
        {formatAxisDate(point.dateKey)}
      </p>
      <p style={{ color: "var(--color-text-muted)" }}>
        За день: <strong style={{ color: "var(--color-text)" }}>{formatViews(point.views)}</strong>
      </p>
      <p style={{ color: "var(--color-text-muted)" }}>
        Накопительно:{" "}
        <strong style={{ color: "var(--color-primary)" }}>{formatViews(point.cumulative)}</strong>
      </p>
    </div>
  );
}

export default function ViewsChart({ reels }) {
  const gradientId = useId().replace(/:/g, "");
  const { points, hasChart } = buildViewsChartData(reels);

  if (!hasChart) {
    return (
      <div className="chart-placeholder" style={{ height: 220 }}>
        Добавьте ещё роликов, чтобы видеть динамику
      </div>
    );
  }

  return (
    <div style={{ height: 220, width: "100%" }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#5B5BD6" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#5B5BD6" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#EEF4FF" vertical={false} />

          <XAxis
            dataKey="dateKey"
            tickFormatter={formatAxisDate}
            tick={{ fontSize: 11, fill: "#8890B5" }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            minTickGap={24}
          />

          <YAxis
            tickFormatter={formatAxisViews}
            tick={{ fontSize: 11, fill: "#8890B5" }}
            tickLine={false}
            axisLine={false}
            width={44}
          />

          <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#DDE5F7", strokeWidth: 1 }} />

          <Area
            type="monotone"
            dataKey="cumulative"
            stroke="#5B5BD6"
            strokeWidth={2.5}
            strokeLinecap="round"
            fill={`url(#${gradientId})`}
            dot={{
              r: 4,
              fill: "#fff",
              stroke: "#5B5BD6",
              strokeWidth: 2,
            }}
            activeDot={{
              r: 6,
              fill: "#5B5BD6",
              stroke: "#fff",
              strokeWidth: 2,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
