/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  Line,
  ComposedChart,
  Legend,
} from "recharts";

interface DsriTrendLineProps {
  data: Array<{ date: string; dsri: number; forecast?: number }>;
  forecast?: {
    slope: number;
    predicted_next: number;
    direction: string;
    data_points: number[];
  } | null;
}

function getDsriColor(val: number) {
  if (val >= 70) return "#22c55e";
  if (val >= 40) return "#f59e0b";
  return "#ef4444";
}

function getDsriLabel(val: number) {
  if (val >= 70) return "Good";
  if (val >= 40) return "Average";
  return "Needs Work";
}

export function DsriTrendLine({ data, forecast }: DsriTrendLineProps) {
  const chartData = [...data];

  if (forecast && chartData.length >= 3) {
    const lastDate = new Date(chartData[chartData.length - 1].date);
    const nextDate = new Date(lastDate);
    nextDate.setMonth(nextDate.getMonth() + 3);
    chartData.push({
      date: nextDate.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }),
      dsri: data[data.length - 1].dsri,
      forecast: forecast.predicted_next,
    });
  }

  if (forecast) {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={chartData} margin={{ top: 10, right: 20, bottom: 5, left: 0 }}>
          <defs>
            <linearGradient id="dsriAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={35} />
          <Tooltip
            contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", background: "hsl(var(--popover))", fontSize: 13 }}
            formatter={(value: any, name: any) => {
              if (name === "forecast") return [<span key="f" style={{ color: "#94a3b8", fontWeight: 600 }}>{value}% (predicted)</span>, "Forecast"];
              const val = Number(value);
              const color = getDsriColor(val);
              return [<span key="v" style={{ color, fontWeight: 600 }}>{val}% — {getDsriLabel(val)}</span>, "DSRI"];
            }}
          />
          <Legend />
          <Area type="monotone" dataKey="dsri" stroke="#6366f1" strokeWidth={2.5} fill="url(#dsriAreaGrad)" dot={{ r: 4, fill: "#6366f1", stroke: "#fff", strokeWidth: 2 }} name="DSRI" />
          <Line type="monotone" dataKey="forecast" stroke="#94a3b8" strokeWidth={2} strokeDasharray="8 4" dot={{ r: 4, fill: "#94a3b8", stroke: "#fff", strokeWidth: 2 }} name="Forecast" />
        </ComposedChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={chartData} margin={{ top: 10, right: 20, bottom: 5, left: 0 }}>
        <defs>
          <linearGradient id="dsriAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
        <XAxis
          dataKey="date"
          tickFormatter={(v: string) => {
            const d = new Date(v);
            return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
          }}
          tick={{ fontSize: 12 }}
          className="text-muted-foreground"
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 12 }}
          className="text-muted-foreground"
          axisLine={false}
          tickLine={false}
          width={35}
        />
        <Tooltip
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid hsl(var(--border))",
            background: "hsl(var(--popover))",
            color: "hsl(var(--popover-foreground))",
            fontSize: 13,
          }}
          formatter={(value) => {
            const val = Number(value);
            const color = getDsriColor(val);
            return [
              <span key="val" style={{ color, fontWeight: 600 }}>
                {val.toFixed(1)} — {getDsriLabel(val)}
              </span>,
              "DSRI",
            ];
          }}
          labelFormatter={(label) => {
            const d = new Date(String(label));
            return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
          }}
        />
        <Area
          type="monotone"
          dataKey="dsri"
          stroke="#6366f1"
          strokeWidth={2.5}
          fill="url(#dsriAreaGrad)"
          dot={(props: any) => {
            const p = props;
            const color = getDsriColor(p.payload?.dsri);
            return (
              <circle
                key={p.index}
                cx={p.cx}
                cy={p.cy}
                r={5}
                fill={color}
                stroke="#fff"
                strokeWidth={2}
              />
            );
          }}
          activeDot={{ r: 7, stroke: "#fff", strokeWidth: 2, fill: "#6366f1" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
