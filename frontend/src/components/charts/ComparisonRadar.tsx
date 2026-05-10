"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

interface ComparisonRadarProps {
  data: Array<{
    code: string;
    name: string;
    percentageA: number;
    percentageB: number;
  }>;
  labelA: string;
  labelB: string;
}

export function ComparisonRadar({ data, labelA, labelB }: ComparisonRadarProps) {
  return (
    <div className="flex flex-col items-center">
      <ResponsiveContainer width="100%" height={420}>
        <RadarChart cx="50%" cy="50%" outerRadius="65%" data={data}>
          <PolarGrid
            gridType="polygon"
            strokeDasharray=""
            className="stroke-border"
          />
          <PolarAngleAxis
            dataKey="code"
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            tick={({ x, y, payload }: any) => {
              const item = data.find((d) => d.code === payload.value);
              const pctA = item?.percentageA || 0;
              const pctB = item?.percentageB || 0;
              const diff = pctB - pctA;
              const color = diff > 0 ? "#22c55e" : diff < 0 ? "#ef4444" : "#94a3b8";
              return (
                <g>
                  <text
                    x={Number(x)}
                    y={Number(y) - 10}
                    textAnchor="middle"
                    fill="currentColor"
                    fontSize={12}
                    fontWeight={600}
                    className="fill-foreground"
                  >
                    {payload.value}
                  </text>
                  <text
                    x={Number(x)}
                    y={Number(y) + 5}
                    textAnchor="middle"
                    fontSize={10}
                    fill={color}
                    fontWeight={500}
                  >
                    {diff > 0 ? "+" : ""}{diff}%
                  </text>
                </g>
              );
            }}
          />
          <PolarRadiusAxis angle={56} domain={[0, 100]} tick={false} axisLine={false} />
          <defs>
            <linearGradient id="compGradA" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0.08} />
            </linearGradient>
            <linearGradient id="compGradB" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f97316" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#f97316" stopOpacity={0.08} />
            </linearGradient>
          </defs>
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid hsl(var(--border))",
              background: "hsl(var(--popover))",
              color: "hsl(var(--popover-foreground))",
              fontSize: 13,
            }}
            formatter={(value, name) => {
              const isA = String(name) === "percentageA";
              const label = isA ? labelA : labelB;
              const color = isA ? "#6366f1" : "#f97316";
              return [
                <span key="val" style={{ color, fontWeight: 600 }}>
                  {Number(value).toFixed(1)}%
                </span>,
                label,
              ];
            }}
          />
          <Legend
            formatter={(value) => {
              const isA = String(value) === "percentageA";
              const label = isA ? labelA : labelB;
              const color = isA ? "#6366f1" : "#f97316";
              return <span style={{ color }}>{label}</span>;
            }}
          />
          <Radar
            name="percentageA"
            dataKey="percentageA"
            stroke="#6366f1"
            strokeWidth={2}
            fill="url(#compGradA)"
            dot={{ r: 4, fill: "#6366f1", stroke: "#fff", strokeWidth: 2 }}
            activeDot={{ r: 6, stroke: "#fff", strokeWidth: 2, fill: "#6366f1" }}
          />
          <Radar
            name="percentageB"
            dataKey="percentageB"
            stroke="#f97316"
            strokeWidth={2}
            fill="url(#compGradB)"
            dot={{ r: 4, fill: "#f97316", stroke: "#fff", strokeWidth: 2 }}
            activeDot={{ r: 6, stroke: "#fff", strokeWidth: 2, fill: "#f97316" }}
          />
        </RadarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex items-center gap-6 mt-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-1 rounded-full" style={{ backgroundColor: "#6366f1" }} />
          <span className="font-medium text-foreground">{labelA}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-1 rounded-full" style={{ backgroundColor: "#f97316" }} />
          <span className="font-medium text-foreground">{labelB}</span>
        </div>
      </div>
    </div>
  );
}
