"use client";

import { COMPETENCIES } from "@/lib/constants";
import { CheckCircle, Circle, TrendingUp, AlertCircle } from "lucide-react";
import Link from "next/link";

interface SectionScore {
  section_code: string;
  section_name: string;
  score: number;
  max_score: number;
  score_percentage: number;
}

interface LearningPathProgressProps {
  sectionScores?: Record<string, SectionScore>;
}

function getStatus(score: number, max: number) {
  const pct = (score / max) * 100;
  if (pct >= 70) return { level: "strong", color: "text-emerald-600", bg: "bg-emerald-500", icon: CheckCircle };
  if (pct >= 40) return { level: "moderate", color: "text-amber-600", bg: "bg-amber-500", icon: TrendingUp };
  return { level: "weak", color: "text-red-500", bg: "bg-red-500", icon: AlertCircle };
}

export function LearningPathProgress({ sectionScores }: LearningPathProgressProps) {
  if (!sectionScores) return null;

  const entries = Object.entries(COMPETENCIES).map(([code, config]) => {
    const score = sectionScores[code];
    const status = score ? getStatus(score.score, config.maxScore) : { level: "none", color: "text-gray-300", bg: "bg-gray-200", icon: Circle };
    const pct = score ? Math.round((score.score / config.maxScore) * 100) : 0;

    return { code, config, score, status, pct };
  });

  const weakCount = entries.filter((e) => e.status.level === "weak").length;
  const strongCount = entries.filter((e) => e.status.level === "strong").length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
        <span>{strongCount}/10 competencies strong</span>
        {weakCount > 0 && (
          <Link href="/courses/recommended" className="text-indigo-600 hover:text-indigo-800 font-medium">
            {weakCount} area{weakCount > 1 ? "s" : ""} to improve →
          </Link>
        )}
      </div>
      <div className="space-y-2.5">
        {entries.map(({ code, config, status, pct }) => {
          const Icon = status.icon;
          return (
            <div key={code} className="flex items-center gap-3">
              <div className="w-10 text-xs font-bold text-gray-500">{code}</div>
              <Icon className={`w-4 h-4 shrink-0 ${status.color}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-700 truncate">{config.nameEn}</span>
                  <span className={`text-xs font-bold ml-2 ${status.color}`}>{pct}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${status.bg} transition-all duration-700 ease-out`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
