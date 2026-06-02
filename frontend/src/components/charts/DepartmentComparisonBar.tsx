/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  ReferenceLine,
} from "recharts";
import { COMPETENCIES } from "@/lib/constants";
import { getMaturityLevel } from "@/lib/maturity";
import { Trophy, AlertTriangle } from "lucide-react";

interface DepartmentData {
  name: string;
  staff_count: number;
  avg_dsri: number;
  competency_averages: Record<string, number>;
}

interface CompetencyInfo {
  code: string;
  name: string;
}

interface DepartmentComparisonBarProps {
  departments: DepartmentData[];
  competencies: CompetencyInfo[];
}

const PALETTE: Record<string, string> = {
  C1: "#6366f1",
  C2: "#8b5cf6",
  C3: "#3b82f6",
  C4: "#0ea5e9",
  C5: "#14b8a6",
  C6: "#22c55e",
  C7: "#eab308",
  C8: "#f97316",
  C9: "#ef4444",
  C10: "#ec4899",
};

function getDsriColor(v: number) {
  return getMaturityLevel(v).hex;
}

function getDsriLabel(v: number) {
  return getMaturityLevel(v).labelEn;
}

function RichTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  const dsriEntry = payload.find((e: any) => e.dataKey === "DSRI");
  const dsriVal = dsriEntry ? Number(dsriEntry.value) : 0;
  const staffEntry = payload.find((e: any) => e.dataKey === "staff");
  const staffCount = staffEntry ? staffEntry.value : 0;

  const compEntries = payload
    .filter((e: any) => e.dataKey !== "DSRI" && e.dataKey !== "staff")
    .sort((a: any, b: any) => b.value - a.value);

  const top5 = compEntries.slice(0, 5);
  const bottom2 = compEntries.length > 5 ? compEntries.slice(-2) : [];

  return (
    <div className="bg-card rounded-xl shadow-xl border border-border p-4 min-w-[280px] max-w-[320px]">
      <div className="flex items-center justify-between mb-3">
        <p className="font-bold text-foreground text-sm">{label}</p>
        <span className="text-[10px] text-muted-foreground">{staffCount} staff</span>
      </div>

      {/* DSRI Badge */}
      {dsriEntry && (
        <div className="flex items-center justify-between mb-3 px-3 py-2 rounded-lg" style={{ backgroundColor: getDsriColor(dsriVal) + "15" }}>
          <span className="text-xs font-semibold text-muted-foreground">Overall DSRI</span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium" style={{ color: getDsriColor(dsriVal) }}>{getDsriLabel(dsriVal)}</span>
            <span className="text-sm font-bold" style={{ color: getDsriColor(dsriVal) }}>{Math.round(dsriVal)}%</span>
          </div>
        </div>
      )}

      {/* Top competencies */}
      <div className="space-y-1.5">
        {top5.map((entry: any) => {
          const comp = COMPETENCIES[entry.dataKey as keyof typeof COMPETENCIES];
          return (
            <div key={entry.dataKey} className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
              <span className="text-[11px] text-muted-foreground w-8 shrink-0">{entry.dataKey}</span>
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${entry.value}%`, backgroundColor: entry.color }} />
              </div>
              <span className="text-[11px] font-bold text-foreground w-10 text-right">{Math.round(entry.value)}%</span>
            </div>
          );
        })}
      </div>

      {/* Bottom competencies */}
      {bottom2.length > 0 && (
        <>
          <div className="border-t border-border my-2" />
          <div className="space-y-1.5">
            {bottom2.map((entry: any) => (
              <div key={entry.dataKey} className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                <span className="text-[11px] text-muted-foreground w-8 shrink-0">{entry.dataKey}</span>
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${entry.value}%`, backgroundColor: entry.color }} />
                </div>
                <span className="text-[11px] font-bold text-foreground w-10 text-right">{Math.round(entry.value)}%</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function DepartmentComparisonBar({ departments, competencies }: DepartmentComparisonBarProps) {
  const [layout, setLayout] = useState<"grouped" | "stacked">("grouped");
  if (!departments?.length) return null;

  const data = departments.map((dept) => {
    const row: Record<string, any> = {
      department: dept.name,
      DSRI: dept.avg_dsri,
      staff: dept.staff_count,
    };
    competencies.forEach((c) => {
      row[c.code] = dept.competency_averages?.[c.code] ?? 0;
    });
    return row;
  });

  const strongest = [...departments].sort((a, b) => b.avg_dsri - a.avg_dsri)[0];
  const weakest = [...departments].sort((a, b) => a.avg_dsri - b.avg_dsri)[0];

  const gradId = (code: string) => `grad-${code}`;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
          <button
            onClick={() => setLayout("grouped")}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              layout === "grouped" ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Grouped
          </button>
          <button
            onClick={() => setLayout("stacked")}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              layout === "stacked" ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Stacked
          </button>
        </div>
        <span className="text-xs text-muted-foreground">
          All {competencies.length} competencies &middot; {departments.length} fields
        </span>
      </div>

      <ResponsiveContainer width="100%" height={420}>
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
          barCategoryGap={layout === "grouped" ? "15%" : "30%"}
        >
          <defs>
            {Object.entries(PALETTE).map(([code, color]) => (
              <linearGradient key={code} id={gradId(code)} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={1} />
                <stop offset="100%" stopColor={color} stopOpacity={0.6} />
              </linearGradient>
            ))}
          </defs>

          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis
            dataKey="department"
            tick={({ x, y, payload }) => {
              const name = String(payload.value);
              const spaceIdx = name.indexOf(" ");
              if (spaceIdx < 0) {
                return (
                  <text x={x} y={Number(y) + 6} textAnchor="middle" fontSize={11} fontWeight={600} fill="#334155">
                    {name}
                  </text>
                );
              }
              const line1 = name.substring(0, spaceIdx);
              const line2 = name.substring(spaceIdx + 1);
              return (
                <g>
                  <text x={x} y={Number(y) + 6} textAnchor="middle" fontSize={11} fontWeight={600} fill="#334155">
                    <tspan x={x} dy={0}>{line1}</tspan>
                    <tspan x={x} dy={14}>{line2}</tspan>
                  </text>
                </g>
              );
            }}
            interval={0}
            axisLine={{ stroke: "#e2e8f0" }}
            tickLine={false}
            height={50}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            domain={[0, 100]}
            axisLine={false}
            tickLine={false}
            width={40}
          />

          <ReferenceLine y={51} stroke="#eab308" strokeDasharray="4 4" strokeOpacity={0.5} label={{ value: "Capable", position: "left", fontSize: 9, fill: "#eab308", fontWeight: 600 }} />
          <ReferenceLine y={71} stroke="#22c55e" strokeDasharray="4 4" strokeOpacity={0.5} label={{ value: "Proficient", position: "left", fontSize: 9, fill: "#22c55e", fontWeight: 600 }} />

          <Tooltip content={<RichTooltip />} />

          <Legend
            wrapperStyle={{ paddingTop: 16, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "2px 10px" }}
            formatter={(value: string) => {
              if (value === "DSRI")
                return <span style={{ color: "#1e293b", fontWeight: 600, fontSize: 11 }}>DSRI</span>;
              return <span style={{ color: PALETTE[value] || "#64748b", fontSize: 11 }}>{value}</span>;
            }}
          />

          {competencies.map((c) => (
            <Bar
              key={c.code}
              dataKey={c.code}
              fill={`url(#${gradId(c.code)})`}
              radius={layout === "grouped" ? [3, 3, 0, 0] : undefined}
              barSize={layout === "grouped" ? 12 : undefined}
              stackId={layout === "stacked" ? "competencies" : undefined}
            />
          ))}

          {layout === "grouped" && (
            <Bar dataKey="DSRI" radius={[3, 3, 0, 0]} barSize={12}>
              {data.map((entry, i) => (
                <Cell key={i} fill={getDsriColor(entry.DSRI)} />
              ))}
            </Bar>
          )}
        </BarChart>
      </ResponsiveContainer>

      {/* Insight badges */}
      <div className="flex items-center justify-center gap-4 mt-2 pt-3 border-t border-border">
        {strongest && (
          <div className="flex items-center gap-1.5 text-xs">
            <Trophy className="w-3.5 h-3.5 text-green-500" />
            <span className="text-muted-foreground">Strongest:</span>
            <span className="font-semibold text-foreground">{strongest.name}</span>
            <span className="font-bold text-green-600 dark:text-green-400">{Math.round(strongest.avg_dsri)}%</span>
          </div>
        )}
        {weakest && weakest.name !== strongest?.name && (
          <div className="flex items-center gap-1.5 text-xs">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-muted-foreground">Needs Focus:</span>
            <span className="font-semibold text-foreground">{weakest.name}</span>
            <span className="font-bold text-amber-600">{Math.round(weakest.avg_dsri)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}
