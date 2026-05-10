/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface CompetencyRadarProps {
  data: Array<{ code: string; name: string; percentage: number }>;
  benchmark?: number;
}

function getScoreColor(pct: number) {
  if (pct >= 70) return { stroke: "#22c55e", fill: "#22c55e", bg: "#dcfce7" };
  if (pct >= 40) return { stroke: "#f59e0b", fill: "#f59e0b", bg: "#fef9c3" };
  return { stroke: "#ef4444", fill: "#ef4444", bg: "#fee2e2" };
}

function getScoreLabel(pct: number) {
  if (pct >= 70) return "Strong";
  if (pct >= 40) return "Developing";
  return "Needs Focus";
}

export function CompetencyRadar({ data, benchmark = 50 }: CompetencyRadarProps) {
  const enrichedData = data.map((d) => ({ ...d, benchmark }));

  return (
    <div className="flex flex-col items-center">
      <ResponsiveContainer width="100%" height={400}>
        <RadarChart cx="50%" cy="50%" outerRadius="62%" data={enrichedData}>
          <PolarGrid
            gridType="polygon"
            strokeDasharray=""
            polarRadius={[10, 20, 50, 80, 100]}
            className="stroke-gray-200"
          />
          <PolarAngleAxis
            dataKey="code"
            tick={({ x, y, payload }: any) => {
              const item = data.find((d) => d.code === payload.value);
              const pct = item?.percentage || 0;
              const color = pct >= 70 ? "#22c55e" : pct >= 40 ? "#f59e0b" : "#ef4444";
              return (
                <g>
                  <text
                    x={Number(x)}
                    y={Number(y) - 12}
                    textAnchor="middle"
                    fill="#374151"
                    fontSize={12}
                    fontWeight={700}
                  >
                    {payload.value}
                  </text>
                  <text
                    x={Number(x)}
                    y={Number(y) + 4}
                    textAnchor="middle"
                    fontSize={11}
                    fill={color}
                    fontWeight={600}
                  >
                    {pct}%
                  </text>
                </g>
              );
            }}
          />
          <PolarRadiusAxis angle={56} domain={[0, 100]} tick={false} axisLine={false} />

          <Radar
            name="Benchmark"
            dataKey="benchmark"
            stroke="#d1d5db"
            strokeWidth={1}
            strokeDasharray="4 3"
            fill="none"
            dot={false}
          />

          <defs>
            <linearGradient id="radarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <Radar
            name="Score"
            dataKey="percentage"
            stroke="#6366f1"
            strokeWidth={2.5}
            fill="url(#radarGrad)"
            dot={(props: any) => {
              const { cx, cy, payload } = props;
              const pct = payload.percentage;
              const color = pct >= 70 ? "#22c55e" : pct >= 40 ? "#f59e0b" : "#ef4444";
              return (
                <circle
                  key={payload.code}
                  cx={cx}
                  cy={cy}
                  r={5}
                  fill={color}
                  stroke="#fff"
                  strokeWidth={2}
                />
              );
            }}
            activeDot={{ r: 7, stroke: "#fff", strokeWidth: 2, fill: "#6366f1" }}
          />

          <Tooltip
            contentStyle={{
              borderRadius: "10px",
              border: "1px solid #e5e7eb",
              background: "#fff",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              fontSize: 13,
              padding: "10px 14px",
            }}
            formatter={(value: any, name: any, props: any) => {
              if (name === "Benchmark") return ["", ""];
              const item = data.find((d) => d.code === props.payload?.code);
              const pct = Number(value);
              const colorInfo = getScoreColor(pct);
              return [
                <div key="tip" style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ color: colorInfo.stroke, fontWeight: 700, fontSize: 14 }}>{pct}%</span>
                  <span style={{ color: "#6b7280", fontSize: 11 }}>{getScoreLabel(pct)}</span>
                </div>,
                item?.name || props.payload?.code,
              ];
            }}
          />
        </RadarChart>
      </ResponsiveContainer>

      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mt-1 text-xs">
        {data.map((item) => {
          const colorInfo = getScoreColor(item.percentage);
          return (
            <div key={item.code} className="flex items-center gap-1.5">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: colorInfo.fill }}
              />
              <span className="font-semibold text-gray-700">{item.code}</span>
              <span className="text-gray-400">{item.percentage}%</span>
            </div>
          );
        })}
        <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-gray-200">
          <span className="inline-block w-4 h-0 border-t-2 border-dashed border-gray-300" />
          <span className="text-gray-400">Benchmark {benchmark}%</span>
        </div>
      </div>
    </div>
  );
}
