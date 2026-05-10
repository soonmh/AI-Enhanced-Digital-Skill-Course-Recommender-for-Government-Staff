"use client";

import { useState } from "react";
import Link from "next/link";
import { useAssessmentResults } from "@/hooks/useApi";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { COMPETENCIES } from "@/lib/constants";
import { CompetencyRadar } from "@/components/charts/CompetencyRadar";
import { DsriTrendLine } from "@/components/charts/DsriTrendLine";
import { ComparisonRadar } from "@/components/charts/ComparisonRadar";
import type { SectionScore, AssessmentRecord } from "@/types";
import {
  Info,
  History,
  TrendingUp,
  TrendingDown,
  Target,
  SquareChartGantt,
  Activity,
  Calendar,
  Award,
  Minus,
  Clock,
  ClipboardList,
  GitCompare,
} from "lucide-react";

function getDsriLevel(score: number) {
  if (score >= 90) return { label: "Excellent", color: "bg-green-500", textColor: "text-green-700" };
  if (score >= 70) return { label: "Good", color: "bg-yellow-500", textColor: "text-yellow-700" };
  if (score >= 40) return { label: "Average", color: "bg-orange-500", textColor: "text-orange-700" };
  return { label: "Needs Improvement", color: "bg-red-500", textColor: "text-red-700" };
}

function getScoreColor(percent: number) {
  if (percent >= 90) return "bg-green-100 border-green-200 text-green-800";
  if (percent >= 70) return "bg-yellow-100 border-yellow-200 text-yellow-800";
  if (percent >= 40) return "bg-orange-100 border-orange-200 text-orange-800";
  return "bg-red-100 border-red-200 text-red-800";
}

function getScoreIcon(percent: number) {
  if (percent >= 90) return TrendingUp;
  if (percent >= 70) return Award;
  if (percent >= 40) return Target;
  return Info;
}

function getProgressBg(score: number) {
  if (score >= 90) return "bg-green-100";
  if (score >= 70) return "bg-yellow-100";
  if (score >= 40) return "bg-orange-100";
  return "bg-red-500";
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AssessmentResultsPage() {
  const { data, isLoading } = useAssessmentResults();
  const [compareA, setCompareA] = useState<string>("");
  const [compareB, setCompareB] = useState<string>("");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="px-6 py-8 w-full max-w-7xl mx-auto">
          <div className="mb-8">
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-6 w-48" />
          </div>
          <Skeleton className="h-48 w-full rounded-xl mb-8" />
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!data?.latest) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center py-16">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <History className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Results Yet</h3>
            <p className="text-gray-500 mb-6">
              Take your first assessment to see your results here.
            </p>
            <Link
              href="/assessment"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Take Assessment
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const dsri = data.latest.dsri;
  const sectionScores = data.latestSectionScores || {};
  const history = data.history || [];
  const submittedAt = data.latest.submitted_at;

  // Build sorted entries for top/bottom analysis
  const sectionEntries = Object.entries(sectionScores).map(
    ([code, section]: [string, SectionScore]) => {
      const percent =
        section.max_score > 0
          ? Math.round((section.score / section.max_score) * 100)
          : 0;
      return { code, section, percent };
    }
  );

  const sortedByPercent = [...sectionEntries].sort(
    (a, b) => b.percent - a.percent
  );
  const topPerforming = sortedByPercent.slice(0, 3);
  const growthOpportunities = [...sortedByPercent]
    .sort((a, b) => a.percent - b.percent)
    .slice(0, 3);

  // Trend calculation
  const trend =
    history.length >= 2
      ? (() => {
          const diff = history[0].dsri - history[1].dsri;
          if (diff > 0) return { direction: "up" as const, value: diff };
          if (diff < 0) return { direction: "down" as const, value: Math.abs(diff) };
          return { direction: "same" as const, value: 0 };
        })()
      : null;

  const level = getDsriLevel(dsri);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="px-6 py-8 w-full max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Assessment Results</h1>
          <p className="text-gray-600 text-lg">Your digital skills readiness breakdown</p>
        </div>

        {/* Score Header Card */}
        <Card className="mb-8 overflow-hidden border-0 shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardContent className="p-8">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <SquareChartGantt className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Latest DSRI</h2>
                    <div className="flex items-center gap-2 text-blue-100">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {submittedAt ? formatDate(submittedAt) : "N/A"} at {submittedAt ? formatTime(submittedAt) : ""}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-end gap-6">
                  <div className="text-6xl lg:text-7xl font-extrabold text-white">
                    {dsri}%
                  </div>
                  <div className="pb-2">
                    <Badge className={`${level.color} text-white border-white/30 text-lg px-4 py-3 rounded-full`}>
                      {dsri >= 90 && <TrendingUp className="w-4 h-4 mr-2" />}
                      {dsri >= 70 && dsri < 90 && <Award className="w-4 h-4 mr-2" />}
                      {dsri >= 40 && dsri < 70 && <Target className="w-4 h-4 mr-2" />}
                      {dsri < 40 && <Info className="w-4 h-4 mr-2" />}
                      {level.label}
                    </Badge>
                    {trend && trend.value > 0 && (
                      <div className="flex items-center gap-1 mt-2 text-white/90">
                        {trend.direction === "up" ? (
                          <TrendingUp className="w-4 h-4 text-green-300" />
                        ) : trend.direction === "down" ? (
                          <TrendingDown className="w-4 h-4 text-red-300" />
                        ) : (
                          <Minus className="w-4 h-4 text-gray-300" />
                        )}
                        <span className="text-sm">
                          {trend.direction === "up" ? "+" : trend.direction === "down" ? "-" : ""}
                          {trend.value.toFixed(2)}% from last attempt
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="w-full lg:w-80">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-1">Score Breakdown</h3>
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                    <div
                      className={`${getProgressBg(dsri)} h-3 rounded-full transition-all duration-300`}
                      style={{ width: `${dsri}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-sm text-white/80">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Competency Radar */}
        {sectionEntries.length > 0 && (
          <Card className="mb-8 border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Target className="w-6 h-6 text-blue-600" />
                Competency Overview
              </CardTitle>
              <CardDescription>Visual breakdown of all competency areas</CardDescription>
            </CardHeader>
            <CardContent>
              <CompetencyRadar
                data={sectionEntries.map(({ code, section }) => {
                  const comp = COMPETENCIES[code as keyof typeof COMPETENCIES];
                  return {
                    code,
                    name: comp?.nameEn || code,
                    percentage:
                      section.max_score > 0
                        ? Math.round((section.score / section.max_score) * 100)
                        : 0,
                  };
                })}
              />
            </CardContent>
          </Card>
        )}

        {/* Top Performing / Growth Opportunities */}
        {sectionEntries.length > 0 && (
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            {/* Top Performing */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <TrendingUp className="w-5 h-5" />
                  Top Performing Areas
                </CardTitle>
                <CardDescription>Your strongest digital skill areas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {topPerforming.map(({ code, section, percent }, idx) => {
                  const comp = COMPETENCIES[code as keyof typeof COMPETENCIES];
                  return (
                    <div
                      key={code}
                      className="flex items-center gap-4 p-3 bg-green-50 rounded-lg border border-green-200"
                    >
                      <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-green-800">
                          {comp?.nameEn || section.section_name}
                        </h4>
                        <p className="text-sm text-green-600">
                          Score: {section.score}/{section.max_score}
                        </p>
                      </div>
                      <Badge className="bg-green-100 text-green-700 border-green-200">
                        {percent}%
                      </Badge>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Growth Opportunities */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-700">
                  <Target className="w-5 h-5" />
                  Growth Opportunities
                </CardTitle>
                <CardDescription>Areas with the most room for improvement</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {growthOpportunities.map(({ code, section, percent }, idx) => {
                  const comp = COMPETENCIES[code as keyof typeof COMPETENCIES];
                  return (
                    <div
                      key={code}
                      className="flex items-center gap-4 p-3 bg-orange-50 rounded-lg border border-orange-200"
                    >
                      <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-orange-800">
                          {comp?.nameEn || section.section_name}
                        </h4>
                        <p className="text-sm text-orange-600">
                          Score: {section.score}/{section.max_score}
                        </p>
                      </div>
                      <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                        {percent}%
                      </Badge>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Detailed Analysis - Colored Card Grid */}
        {sectionEntries.length > 0 && (
          <Card className="mb-8 border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <ClipboardList className="w-6 h-6 text-blue-600" />
                Detailed Analysis
              </CardTitle>
              <CardDescription>Breakdown by competency area</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {sectionEntries.map(({ code, section, percent }) => {
                  const comp = COMPETENCIES[code as keyof typeof COMPETENCIES];
                  const ScoreIcon = getScoreIcon(percent);
                  return (
                    <div
                      key={code}
                      className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-200 hover:shadow-md ${getScoreColor(percent)}`}
                    >
                      <div className="p-4 pb-2">
                        <div className="flex items-center gap-2 mb-2">
                          <ScoreIcon className="w-4 h-4" />
                          <span className="font-bold text-sm">{code}</span>
                        </div>
                        <h3 className="font-medium text-sm leading-tight mb-1">
                          {comp?.nameEn || section.section_name}
                        </h3>
                        <p className="text-xs opacity-75">
                          Weight: {comp?.weight || 0}%
                        </p>
                      </div>
                      <div className="px-4 pb-4">
                        <div className="text-2xl font-bold mb-1">{section.score}</div>
                        <div className="text-sm font-medium">{percent}%</div>
                        <div className="mt-3 w-full bg-white/50 rounded-full h-1.5">
                          <div
                            className="h-1.5 bg-current rounded-full transition-all duration-300"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Assessment History Table */}
        {history.length > 0 && (
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <History className="w-6 h-6 text-purple-600" />
                Assessment History
              </CardTitle>
              <CardDescription>Your past assessment results</CardDescription>
            </CardHeader>
            <CardContent>
              {/* DSRI Trend Chart */}
              {history.length >= 2 && (
                <div className="mb-6">
                  <DsriTrendLine
                    data={history
                      .map((r: AssessmentRecord) => ({
                        date: new Date(r.submitted_at).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        }),
                        dsri: r.dsri,
                      }))
                      .reverse()}
                  />
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="p-3 font-semibold text-gray-700">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Date
                        </div>
                      </th>
                      <th className="p-3 font-semibold text-gray-700 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Activity className="w-4 h-4" />
                          DSRI
                        </div>
                      </th>
                      {Array.from({ length: 10 }, (_, i) => (
                        <th key={i + 1} className="p-3 font-semibold text-gray-700 text-center text-sm">
                          C{i + 1}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((r: AssessmentRecord, idx: number) => (
                      <tr
                        key={r.id}
                        className={`hover:bg-gray-50 transition-colors ${
                          idx === 0 ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
                        }`}
                      >
                        <td className="p-3 font-medium">
                          <div>
                            <div>{formatDate(r.submitted_at)}</div>
                            <div className="text-xs text-gray-500">
                              {formatTime(r.submitted_at)}
                            </div>
                            {idx === 0 && (
                              <Badge variant="outline" className="mt-1 text-xs bg-blue-50 text-blue-700 border-blue-200">
                                Latest
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`font-bold text-lg ${
                              r.dsri >= 90
                                ? "text-green-600"
                                : r.dsri >= 70
                                ? "text-yellow-600"
                                : r.dsri >= 40
                                ? "text-orange-600"
                                : "text-red-600"
                            }`}
                          >
                            {r.dsri}%
                          </span>
                        </td>
                        {Array.from({ length: 10 }, (_, i) => {
                          const key = `c${i + 1}_score` as keyof AssessmentRecord;
                          const pctKey = `c${i + 1}_score_percentage` as keyof AssessmentRecord;
                          return (
                            <td key={i + 1} className="p-3 text-center text-sm">
                              <div className="space-y-1">
                                <div className="font-semibold">{r[key]}</div>
                                <div className="text-xs text-gray-500">
                                  ({Number(r[pctKey]).toFixed(1)}%)
                                </div>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Bottom Stats */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-gray-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{history.length}</div>
                  <div className="text-sm text-gray-600">Total Assessments</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {Math.max(...history.map((r: AssessmentRecord) => r.dsri))}%
                  </div>
                  <div className="text-sm text-gray-600">Best Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {(
                      history.reduce(
                        (acc: number, r: AssessmentRecord) => acc + (r.dsri || 0),
                        0
                      ) / history.length
                    ).toFixed(1)}
                    %
                  </div>
                  <div className="text-sm text-gray-600">Average Score</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Compare Assessments */}
        {history.length >= 2 && (
          <Card className="border-0 shadow-md mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <GitCompare className="w-6 h-6 text-purple-600" />
                Compare Assessments
              </CardTitle>
              <CardDescription>Compare two assessments side by side</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assessment A</label>
                  <select
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    value={compareA}
                    onChange={(e) => setCompareA(e.target.value)}
                  >
                    <option value="">Select an assessment...</option>
                    {history.map((r: AssessmentRecord) => (
                      <option key={`a-${r.id}`} value={r.id}>
                        {formatDate(r.submitted_at)} — DSRI: {r.dsri}%
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assessment B</label>
                  <select
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                    value={compareB}
                    onChange={(e) => setCompareB(e.target.value)}
                  >
                    <option value="">Select an assessment...</option>
                    {history.map((r: AssessmentRecord) => (
                      <option key={`b-${r.id}`} value={r.id}>
                        {formatDate(r.submitted_at)} — DSRI: {r.dsri}%
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {compareA && compareB && (() => {
                const recordA = history.find((r: AssessmentRecord) => String(r.id) === compareA);
                const recordB = history.find((r: AssessmentRecord) => String(r.id) === compareB);
                if (!recordA || !recordB) return null;

                const competencyKeys = Object.keys(COMPETENCIES);
                const comparisonData = competencyKeys.map((code) => {
                  const comp = COMPETENCIES[code as keyof typeof COMPETENCIES];
                  const scoreKey = `${code.toLowerCase()}_score` as keyof AssessmentRecord;
                  const pctA = comp.maxScore > 0 ? (Number(recordA[scoreKey]) / comp.maxScore) * 100 : 0;
                  const pctB = comp.maxScore > 0 ? (Number(recordB[scoreKey]) / comp.maxScore) * 100 : 0;
                  return {
                    code,
                    name: comp.nameEn,
                    percentageA: Math.round(pctA * 10) / 10,
                    percentageB: Math.round(pctB * 10) / 10,
                    delta: Math.round((pctB - pctA) * 10) / 10,
                    rawA: Number(recordA[scoreKey]),
                    rawB: Number(recordB[scoreKey]),
                  };
                });

                return (
                  <>
                    <ComparisonRadar
                      data={comparisonData.map(({ code, name, percentageA, percentageB }) => ({
                        code,
                        name,
                        percentageA,
                        percentageB,
                      }))}
                      labelA={formatDate(recordA.submitted_at)}
                      labelB={formatDate(recordB.submitted_at)}
                    />

                    {/* Delta Insights */}
                    {(() => {
                      const improved = comparisonData.filter((c) => c.delta > 0).sort((a, b) => b.delta - a.delta);
                      const declined = comparisonData.filter((c) => c.delta < 0).sort((a, b) => a.delta - b.delta);
                      const dsriDelta = recordB.dsri - recordA.dsri;

                      if (improved.length === 0 && declined.length === 0) return null;

                      return (
                        <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                          <h4 className="font-semibold text-indigo-900 mb-2 flex items-center gap-2">
                            <Activity className="w-4 h-4" />
                            Comparison Insights
                          </h4>
                          <div className="space-y-1.5 text-sm text-gray-700">
                            {dsriDelta !== 0 && (
                              <p>
                                Overall DSRI {dsriDelta > 0 ? "improved" : "declined"} by {Math.abs(dsriDelta).toFixed(1)}%.
                              </p>
                            )}
                            {improved.length > 0 && (
                              <p className="text-green-700">
                                Most improved: {improved.slice(0, 3).map((c) => `${c.code} (+${c.delta.toFixed(1)}%)`).join(", ")}
                              </p>
                            )}
                            {declined.length > 0 && (
                              <p className="text-red-700">
                                Needs attention: {declined.slice(0, 3).map((c) => `${c.code} (${c.delta.toFixed(1)}%)`).join(", ")}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Delta Table */}
                    <div className="mt-6 overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="p-3 font-semibold text-gray-700 text-left">Competency</th>
                            <th className="p-3 font-semibold text-gray-700 text-center">
                              {formatDate(recordA.submitted_at)}
                            </th>
                            <th className="p-3 font-semibold text-gray-700 text-center">
                              {formatDate(recordB.submitted_at)}
                            </th>
                            <th className="p-3 font-semibold text-gray-700 text-center">Change</th>
                          </tr>
                        </thead>
                        <tbody>
                          {comparisonData.map(({ code, name, rawA, rawB, delta }) => (
                            <tr key={code} className="border-b hover:bg-gray-50">
                              <td className="p-3">
                                <span className="font-semibold">{code}</span>{" "}
                                <span className="text-gray-500">{name}</span>
                              </td>
                              <td className="p-3 text-center">{rawA}</td>
                              <td className="p-3 text-center">{rawB}</td>
                              <td className="p-3 text-center">
                                <span
                                  className={`font-semibold ${
                                    delta > 0
                                      ? "text-green-600"
                                      : delta < 0
                                      ? "text-red-600"
                                      : "text-gray-500"
                                  }`}
                                >
                                  {delta > 0 ? "+" : ""}
                                  {delta.toFixed(1)}%
                                </span>
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-gray-50 font-bold">
                            <td className="p-3">DSRI</td>
                            <td className="p-3 text-center">{recordA.dsri}%</td>
                            <td className="p-3 text-center">{recordB.dsri}%</td>
                            <td className="p-3 text-center">
                              <span
                                className={
                                  recordB.dsri - recordA.dsri > 0
                                    ? "text-green-600"
                                    : recordB.dsri - recordA.dsri < 0
                                    ? "text-red-600"
                                    : "text-gray-500"
                                }
                              >
                                {recordB.dsri - recordA.dsri > 0 ? "+" : ""}
                                {(recordB.dsri - recordA.dsri).toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </>
                );
              })()}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
