"use client";

import { useState } from "react";
import Link from "next/link";
import { useAssessmentResults } from "@/hooks/useApi";
import { useTranslation } from "@/i18n/context";
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
  if (score >= 90) return { label: "Excellent", color: "bg-green-500 dark:bg-green-600", textColor: "text-green-700 dark:text-green-300" };
  if (score >= 70) return { label: "Good", color: "bg-yellow-500 dark:bg-yellow-600", textColor: "text-yellow-700 dark:text-yellow-300" };
  if (score >= 40) return { label: "Average", color: "bg-orange-500 dark:bg-orange-600", textColor: "text-orange-700 dark:text-orange-300" };
  return { label: "Needs Improvement", color: "bg-red-500 dark:bg-red-600", textColor: "text-red-700 dark:text-red-300" };
}

function getScoreColor(percent: number) {
  if (percent >= 80) return "bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-700/40 text-green-800 dark:text-green-300";
  if (percent >= 60) return "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-700/40 text-yellow-800 dark:text-yellow-300";
  if (percent >= 40) return "bg-orange-100 dark:bg-orange-900/30 border-orange-200 dark:border-orange-700/40 text-orange-800 dark:text-orange-300";
  return "bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-700/40 text-red-800 dark:text-red-300";
}

function getScoreIcon(percent: number) {
  if (percent >= 80) return TrendingUp;
  if (percent >= 60) return Award;
  if (percent >= 40) return Target;
  return Info;
}

function getProgressBg(score: number) {
  if (score >= 90) return "bg-green-100 dark:bg-green-900/30";
  if (score >= 70) return "bg-yellow-100 dark:bg-yellow-900/30";
  if (score >= 40) return "bg-orange-100 dark:bg-orange-900/30";
  return "bg-red-500 dark:bg-red-600";
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
  const { t } = useTranslation();
  const { data, isLoading } = useAssessmentResults();
  const [compareA, setCompareA] = useState<string>("");
  const [compareB, setCompareB] = useState<string>("");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
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
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center py-16">
            <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
              <History className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">{t("assessment.noResultsTitle")}</h3>
            <p className="text-muted-foreground mb-6">
              {t("assessment.noResultsDescription")}
            </p>
            <Link
              href="/assessment"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {t("assessment.takeAssessment")}
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
    <div className="min-h-screen bg-background">
      <div className="px-6 py-8 w-full max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">{t("assessment.resultsTitle")}</h1>
          <p className="text-muted-foreground text-lg">{t("assessment.resultsDescription")}</p>
        </div>

        {/* Score Header Card */}
        <Card className="mb-8 overflow-hidden border-0 shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 dark:from-violet-900 dark:via-indigo-950 dark:to-gray-900 text-white">
          <CardContent className="p-8">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-card/20 rounded-xl backdrop-blur-sm">
                    <SquareChartGantt className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{t("assessment.latestDsri")}</h2>
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
                          <Minus className="w-4 h-4 text-muted-foreground" />
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
                <div className="bg-card/10 backdrop-blur-sm rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-1">{t("assessment.scoreBreakdown")}</h3>
                  <div className="w-full bg-muted rounded-full h-3 mb-2">
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
                {t("assessment.competencyOverview")}
              </CardTitle>
              <CardDescription>{t("assessment.competencyOverviewDescription")}</CardDescription>
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
                  {t("assessment.topPerformingAreas")}
                </CardTitle>
                <CardDescription>{t("assessment.topPerformingDescription")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {topPerforming.map(({ code, section, percent }, idx) => {
                  const comp = COMPETENCIES[code as keyof typeof COMPETENCIES];
                  return (
                    <div
                      key={code}
                      className="flex items-center gap-4 p-3 bg-green-500/10 rounded-lg border border-green-200"
                    >
                      <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-green-800">
                          {comp?.nameEn || section.section_name}
                        </h4>
                        <p className="text-sm text-green-600 dark:text-green-400">
                          {t("assessment.scoreLabel", { score: section.score, max: section.max_score })}
                        </p>
                      </div>
                      <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700/40">
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
                  {t("assessment.growthOpportunities")}
                </CardTitle>
                <CardDescription>{t("assessment.growthOpportunitiesDescription")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {growthOpportunities.map(({ code, section, percent }, idx) => {
                  const comp = COMPETENCIES[code as keyof typeof COMPETENCIES];
                  return (
                    <div
                      key={code}
                      className="flex items-center gap-4 p-3 bg-orange-50 dark:bg-orange-900/30 rounded-lg border border-orange-200 dark:border-orange-700/40"
                    >
                      <div className="w-8 h-8 bg-orange-500 dark:bg-orange-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-orange-800 dark:text-orange-300">
                          {comp?.nameEn || section.section_name}
                        </h4>
                        <p className="text-sm text-orange-600 dark:text-orange-400">
                          {t("assessment.scoreLabel", { score: section.score, max: section.max_score })}
                        </p>
                      </div>
                      <Badge className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-700/40">
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
                {t("assessment.detailedAnalysis")}
              </CardTitle>
              <CardDescription>{t("assessment.detailedAnalysisDescription")}</CardDescription>
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
                          {t("assessment.weightLabelResults", { weight: comp?.weight || 0 })}
                        </p>
                      </div>
                      <div className="px-4 pb-4">
                        <div className="text-2xl font-bold mb-1">{section.score}/{section.max_score}</div>
                        <div className="text-sm font-medium">{percent}%</div>
                        <div className="mt-3 w-full bg-card/50 rounded-full h-1.5">
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
                {t("assessment.assessmentHistory")}
              </CardTitle>
              <CardDescription>{t("assessment.assessmentHistoryDescription")}</CardDescription>
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
                    <tr className="bg-background">
                      <th className="p-3 font-semibold text-foreground">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {t("reports.tableDate")}
                        </div>
                      </th>
                      <th className="p-3 font-semibold text-foreground text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Activity className="w-4 h-4" />
                          DSRI
                        </div>
                      </th>
                      {Array.from({ length: 10 }, (_, i) => (
                        <th key={i + 1} className="p-3 font-semibold text-foreground text-center text-sm">
                          C{i + 1}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((r: AssessmentRecord, idx: number) => (
                      <tr
                        key={r.id}
                        className={`hover:bg-background transition-colors ${
                          idx === 0 ? "bg-blue-500/10 dark:bg-blue-900/30 border-l-4 border-l-blue-500 dark:border-l-blue-400" : ""
                        }`}
                      >
                        <td className="p-3 font-medium">
                          <div>
                            <div>{formatDate(r.submitted_at)}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatTime(r.submitted_at)}
                            </div>
                            {idx === 0 && (
                              <Badge variant="outline" className="mt-1 text-xs bg-blue-500/10 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700/40">
                                Latest
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`font-bold text-lg ${
                              r.dsri >= 90
                                ? "text-green-600 dark:text-green-400"
                                : r.dsri >= 70
                                ? "text-yellow-600 dark:text-yellow-400"
                                : r.dsri >= 40
                                ? "text-orange-600 dark:text-orange-400"
                                : "text-red-600 dark:text-red-400"
                            }`}
                          >
                            {r.dsri}%
                          </span>
                        </td>
                        {Array.from({ length: 10 }, (_, i) => {
                          const scoreKey = `c${i + 1}_score` as keyof AssessmentRecord;
                          const comp = COMPETENCIES[`C${i + 1}` as keyof typeof COMPETENCIES];
                          const rawScore = Number(r[scoreKey]) || 0;
                          const maxScore = comp?.maxScore ?? 0;
                          const pct = maxScore > 0 ? Math.round((rawScore / maxScore) * 1000) / 10 : 0;
                          return (
                            <td key={i + 1} className="p-3 text-center text-sm">
                              <div className="space-y-1">
                                <div className="font-semibold">{rawScore}/{maxScore}</div>
                                <div className="text-xs text-muted-foreground">
                                  ({pct}%)
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
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-border">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{history.length}</div>
                  <div className="text-sm text-muted-foreground">{t("assessment.totalAssessments")}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {Math.max(...history.map((r: AssessmentRecord) => Number(r.dsri)))}%
                  </div>
                  <div className="text-sm text-muted-foreground">{t("assessment.bestScore")}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {(
                      history.reduce(
                        (acc: number, r: AssessmentRecord) => acc + (Number(r.dsri) || 0),
                        0
                      ) / history.length
                    ).toFixed(1)}
                    %
                  </div>
                  <div className="text-sm text-muted-foreground">{t("assessment.averageScore")}</div>
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
                {t("assessment.compareAssessments")}
              </CardTitle>
              <CardDescription>{t("assessment.compareDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-foreground mb-1">{t("assessment.assessmentA")}</label>
                  <select
                    className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    value={compareA}
                    onChange={(e) => setCompareA(e.target.value)}
                  >
                    <option value="">{t("assessment.selectAssessment")}</option>
                    {history.map((r: AssessmentRecord) => (
                      <option key={`a-${r.id}`} value={r.id}>
                        {formatDate(r.submitted_at)} — DSRI: {r.dsri}%
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-foreground mb-1">{t("assessment.assessmentB")}</label>
                  <select
                    className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                    value={compareB}
                    onChange={(e) => setCompareB(e.target.value)}
                  >
                    <option value="">{t("assessment.selectAssessment")}</option>
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
                        <div className="mt-6 p-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-xl border border-indigo-100">
                          <h4 className="font-semibold text-indigo-900 mb-2 flex items-center gap-2">
                            <Activity className="w-4 h-4" />
                            {t("assessment.comparisonInsights")}
                          </h4>
                          <div className="space-y-1.5 text-sm text-foreground">
                            {dsriDelta !== 0 && (
                              <p>
                                Overall DSRI {dsriDelta > 0 ? "improved" : "declined"} by {Math.abs(dsriDelta).toFixed(1)}%.
                              </p>
                            )}
                            {improved.length > 0 && (
                              <p className="text-green-700">
                                {t("assessment.mostImproved", { items: improved.slice(0, 3).map((c) => `${c.code} (+${c.delta.toFixed(1)}%)`).join(", ") })}
                              </p>
                            )}
                            {declined.length > 0 && (
                              <p className="text-red-700">
                                {t("assessment.needsAttention", { items: declined.slice(0, 3).map((c) => `${c.code} (${c.delta.toFixed(1)}%)`).join(", ") })}
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
                          <tr className="bg-background">
                            <th className="p-3 font-semibold text-foreground text-left">{t("assessment.competencyHeader")}</th>
                            <th className="p-3 font-semibold text-foreground text-center">
                              {formatDate(recordA.submitted_at)}
                            </th>
                            <th className="p-3 font-semibold text-foreground text-center">
                              {formatDate(recordB.submitted_at)}
                            </th>
                            <th className="p-3 font-semibold text-foreground text-center">{t("assessment.changeHeader")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {comparisonData.map(({ code, name, rawA, rawB, delta }) => (
                            <tr key={code} className="border-b hover:bg-background">
                              <td className="p-3">
                                <span className="font-semibold">{code}</span>{" "}
                                <span className="text-muted-foreground">{name}</span>
                              </td>
                              <td className="p-3 text-center">{rawA}</td>
                              <td className="p-3 text-center">{rawB}</td>
                              <td className="p-3 text-center">
                                <span
                                  className={`font-semibold ${
                                    delta > 0
                                      ? "text-green-600 dark:text-green-400"
                                      : delta < 0
                                      ? "text-red-600"
                                      : "text-muted-foreground"
                                  }`}
                                >
                                  {delta > 0 ? "+" : ""}
                                  {delta.toFixed(1)}%
                                </span>
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-background font-bold">
                            <td className="p-3">DSRI</td>
                            <td className="p-3 text-center">{recordA.dsri}%</td>
                            <td className="p-3 text-center">{recordB.dsri}%</td>
                            <td className="p-3 text-center">
                              <span
                                className={
                                  recordB.dsri - recordA.dsri > 0
                                    ? "text-green-600 dark:text-green-400"
                                    : recordB.dsri - recordA.dsri < 0
                                    ? "text-red-600"
                                    : "text-muted-foreground"
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
