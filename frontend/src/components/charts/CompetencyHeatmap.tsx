"use client";

import { COMPETENCIES } from "@/lib/constants";
import { Trophy, Users, TrendingDown } from "lucide-react";

interface HeatmapProps {
  departments: {
    name: string;
    staff_count: number;
    avg_dsri: number;
    competency_averages: Record<string, number>;
  }[];
}

function getHeatStyle(value: number): { bg: string; color: string } {
  if (value >= 70) return { bg: "#16a34a", color: "#ffffff" };
  if (value >= 50) return { bg: "#86efac", color: "#14532d" };
  if (value >= 40) return { bg: "#fde68a", color: "#713f12" };
  if (value >= 20) return { bg: "#fdba74", color: "#7c2d12" };
  if (value > 0) return { bg: "#fca5a5", color: "#7f1d1d" };
  return { bg: "#f3f4f6", color: "#9ca3af" };
}

function getDsriColor(v: number) {
  if (v >= 70) return "#16a34a";
  if (v >= 40) return "#d97706";
  return "#dc2626";
}

function shortName(code: string): string {
  const c = COMPETENCIES[code as keyof typeof COMPETENCIES];
  if (!c) return code;
  const n = c.nameEn;
  if (n.length <= 16) return n;
  return n.substring(0, 14) + "…";
}

export function CompetencyHeatmap({ departments }: HeatmapProps) {
  if (!departments?.length) return null;

  const sorted = [...departments].sort((a, b) => b.avg_dsri - a.avg_dsri);
  const codes = Object.keys(COMPETENCIES);

  const colBest: Record<string, number> = {};
  const colWorst: Record<string, number> = {};
  codes.forEach((code) => {
    const vals = sorted.map((d) => d.competency_averages?.[code] ?? 0);
    colBest[code] = Math.max(...vals);
    colWorst[code] = Math.min(...vals);
  });

  const avgRow = codes.map((code) => {
    const vals = sorted.map((d) => d.competency_averages?.[code] ?? 0);
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  });
  const avgDsri = sorted.reduce((a, d) => a + d.avg_dsri, 0) / sorted.length;
  const totalStaff = sorted.reduce((a, d) => a + d.staff_count, 0);

  const bestField = sorted[0];
  const mostStaff = [...sorted].sort((a, b) => b.staff_count - a.staff_count)[0];
  const weakestComp = avgRow.reduce<{ code: string; val: number }>(
    (min, val, i) => (val < min.val ? { code: codes[i], val } : min),
    { code: codes[0], val: Infinity }
  );

  function getRowExtremes(dept: (typeof sorted)[0]) {
    let best = { code: "", val: -1 };
    let worst = { code: "", val: Infinity };
    codes.forEach((code) => {
      const v = dept.competency_averages?.[code] ?? 0;
      if (v > best.val) best = { code, val: v };
      if (v < worst.val) worst = { code, val: v };
    });
    return { best, worst };
  }

  return (
    <div>
      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg bg-green-50 border border-green-100">
          <Trophy className="w-4 h-4 text-green-500 shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] text-green-600 font-medium">Best Field</p>
            <p className="text-xs font-bold text-green-800 truncate">{bestField?.name} — {Math.round(bestField?.avg_dsri ?? 0)}%</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg bg-blue-50 border border-blue-100">
          <Users className="w-4 h-4 text-blue-500 shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] text-blue-600 font-medium">Most Staff</p>
            <p className="text-xs font-bold text-blue-800 truncate">{mostStaff?.name} — {mostStaff?.staff_count}</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg bg-amber-50 border border-amber-100">
          <TrendingDown className="w-4 h-4 text-amber-500 shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] text-amber-600 font-medium">Weakest Area</p>
            <p className="text-xs font-bold text-amber-800 truncate">{weakestComp.code}: {shortName(weakestComp.code)} — {Math.round(weakestComp.val)}%</p>
          </div>
        </div>
      </div>

      {/* Heatmap table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-b from-gray-50 to-gray-100/80">
              <th className="py-3 px-2 text-center text-[11px] font-bold text-gray-400 uppercase tracking-wider w-10">
                #
              </th>
              <th className="py-3 px-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider min-w-[180px]">
                Field
              </th>
              {codes.map((code) => (
                <th
                  key={code}
                  className="py-3 px-2 text-center min-w-[72px]"
                  title={COMPETENCIES[code as keyof typeof COMPETENCIES]?.nameEn || code}
                >
                  <div className="text-[11px] font-bold text-gray-600">{code}</div>
                  <div className="text-[9px] text-gray-400 font-medium leading-tight mt-0.5">
                    {shortName(code)}
                  </div>
                </th>
              ))}
              <th className="py-3 px-3 text-center text-[11px] font-bold text-indigo-600 uppercase tracking-wider min-w-[80px] bg-indigo-50/60">
                DSRI
              </th>
              <th className="py-3 px-2 text-center text-[11px] font-bold text-gray-400 uppercase tracking-wider min-w-[48px]">
                Staff
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((dept, idx) => {
              const extremes = getRowExtremes(dept);
              return (
                <tr key={dept.name} className="group transition-colors border-t border-gray-100 first:border-t-0">
                  <td className="py-3 px-2 text-center text-xs font-bold text-gray-300">
                    {idx + 1}
                  </td>
                  <td className="py-3 px-3 align-top">
                    <p className="text-[13px] font-semibold text-gray-800 whitespace-nowrap">{dept.name}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                        {extremes.best.code} {extremes.best.val}%
                      </span>
                      <span className="text-[10px] font-semibold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">
                        {extremes.worst.code} {extremes.worst.val}%
                      </span>
                    </div>
                  </td>
                  {codes.map((code) => {
                    const value = dept.competency_averages?.[code] ?? 0;
                    const style = getHeatStyle(value);
                    const isBest = value === colBest[code] && value > 0;
                    const isWorst = value === colWorst[code] && sorted.length > 1 && value > 0;
                    return (
                      <td key={code} className="py-2 px-1.5 text-center align-middle">
                        <div
                          className="rounded-lg px-1 py-2 transition-all cursor-default hover:scale-105 hover:shadow-md relative"
                          style={{
                            backgroundColor: style.bg,
                            color: style.color,
                            outline: isBest
                              ? "2.5px solid #16a34a"
                              : isWorst
                                ? "2.5px solid #f87171"
                                : "none",
                            outlineOffset: "-1px",
                          }}
                          title={`${COMPETENCIES[code as keyof typeof COMPETENCIES]?.nameEn || code}: ${value}%`}
                        >
                          <span className="text-[11px] font-bold">{value > 0 ? `${value}%` : "—"}</span>
                          {value > 0 && (
                            <div className="mt-1.5 mx-auto w-8 h-[3px] rounded-full" style={{ backgroundColor: "rgba(0,0,0,0.12)" }}>
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${value}%`, backgroundColor: "rgba(255,255,255,0.55)" }}
                              />
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                  {/* DSRI cell */}
                  <td className="py-2 px-2 bg-indigo-50/40">
                    <div className="flex flex-col items-center gap-1.5">
                      <span className="text-[13px] font-bold" style={{ color: getDsriColor(dept.avg_dsri) }}>
                        {Math.round(dept.avg_dsri)}%
                      </span>
                      <div className="w-12 h-[5px] rounded-full bg-indigo-100">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${dept.avg_dsri}%`, backgroundColor: getDsriColor(dept.avg_dsri) }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-2 px-2 text-center">
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                      {dept.staff_count}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          {/* Average footer */}
          <tfoot>
            <tr className="border-t-2 border-gray-200 bg-gradient-to-b from-gray-50 to-gray-100/60">
              <td className="py-3 px-2 text-center text-xs text-gray-300 font-bold">—</td>
              <td className="py-3 px-3">
                <p className="text-[13px] font-bold text-gray-600">Average</p>
              </td>
              {avgRow.map((val, i) => {
                const style = getHeatStyle(val);
                return (
                  <td key={codes[i]} className="py-2 px-1.5 text-center">
                    <div
                      className="rounded-lg px-1 py-2"
                      style={{ backgroundColor: style.bg, color: style.color }}
                    >
                      <span className="text-[11px] font-bold">{val > 0 ? `${Math.round(val)}%` : "—"}</span>
                      {val > 0 && (
                        <div className="mt-1.5 mx-auto w-8 h-[3px] rounded-full" style={{ backgroundColor: "rgba(0,0,0,0.12)" }}>
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${val}%`, backgroundColor: "rgba(255,255,255,0.55)" }}
                          />
                        </div>
                      )}
                    </div>
                  </td>
                );
              })}
              <td className="py-2 px-2 bg-indigo-50/40">
                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-[13px] font-bold" style={{ color: getDsriColor(avgDsri) }}>
                    {Math.round(avgDsri)}%
                  </span>
                  <div className="w-12 h-[5px] rounded-full bg-indigo-100">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${avgDsri}%`, backgroundColor: getDsriColor(avgDsri) }}
                    />
                  </div>
                </div>
              </td>
              <td className="py-2 px-2 text-center">
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  {totalStaff}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-4 p-3.5 rounded-lg bg-gray-50 border border-gray-100">
        <div className="flex items-center gap-3 text-xs">
          <span className="font-semibold text-gray-500 shrink-0">Scale</span>
          <div className="flex-1 flex items-center gap-2">
            <span className="text-[10px] text-gray-400">Low</span>
            <div className="flex-1 h-3 rounded-full" style={{ background: "linear-gradient(to right, #fca5a5, #fdba74, #fde68a, #86efac, #16a34a)" }} />
            <span className="text-[10px] text-gray-400">High</span>
          </div>
        </div>
        <div className="flex items-center justify-between mt-1.5 px-6 text-[10px] text-gray-400">
          <span>&lt;20%</span>
          <span>20%</span>
          <span>40%</span>
          <span>50%</span>
          <span>70%+</span>
        </div>
        <div className="flex items-center gap-4 mt-2.5 pt-2.5 border-t border-gray-200">
          <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
            <span className="w-3.5 h-3.5 rounded-md border-2 border-green-600 bg-transparent" />
            Best in column
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
            <span className="w-3.5 h-3.5 rounded-md border-2 border-red-400 bg-transparent" />
            Lowest in column
          </div>
        </div>
      </div>
    </div>
  );
}
