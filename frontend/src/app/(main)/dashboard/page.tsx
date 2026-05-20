"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useDashboard } from "@/hooks/useApi";
import { useTranslation } from "@/i18n/context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { COMPETENCIES } from "@/lib/constants";
import type { AssessmentRecord } from "@/types";
import {
  TrendingUp,
  ClipboardList,
  Target,
  BookOpen,
  Clock,
  User,
  ArrowRight,
  History,
  Award,
  Star,
  CirclePlay,
  Activity,
  ChevronRight,
} from "lucide-react";
import { DsriTrendLine } from "@/components/charts/DsriTrendLine";
import { AiInsightCard } from "@/components/dashboard/AiInsightCard";
import { LearningPathProgress } from "@/components/dashboard/LearningPathProgress";

function getDsriLevel(score: number) {
  if (score >= 90) return { label: "Excellent", color: "bg-green-500 dark:bg-green-500/20 dark:text-green-300", ring: "#22c55e", ringDark: "#4ade80", bg: "bg-green-500/10" };
  if (score >= 70) return { label: "Good", color: "bg-emerald-500 dark:bg-emerald-500/20 dark:text-emerald-300", ring: "#10b981", ringDark: "#34d399", bg: "bg-emerald-500/10" };
  if (score >= 40) return { label: "Average", color: "bg-amber-500 dark:bg-amber-500/20 dark:text-amber-300", ring: "#f59e0b", ringDark: "#fbbf24", bg: "bg-amber-500/10" };
  return { label: "Needs Work", color: "bg-red-500 dark:bg-red-500/20 dark:text-red-300", ring: "#ef4444", ringDark: "#f87171", bg: "bg-red-500/10" };
}

function getDsriTextColor(score: number) {
  if (score >= 70) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 40) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function scoreCellColor(val: number | null | undefined, maxScore: number) {
  if (val == null) return "text-muted-foreground";
  const pct = maxScore > 0 ? (val / maxScore) * 100 : 0;
  if (pct >= 80) return "text-emerald-600 dark:text-emerald-400 font-semibold";
  if (pct >= 60) return "text-amber-600 dark:text-amber-400 font-medium";
  if (pct >= 40) return "text-orange-500 dark:text-orange-400 font-medium";
  return "text-red-500 dark:text-red-400 font-medium";
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const { dashboard, isLoading } = useDashboard();
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="px-6 py-8 w-full max-w-7xl mx-auto">
          <div className="mb-8">
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-6 w-48" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
          </div>
          <div className="grid lg:grid-cols-3 gap-6">
            <Skeleton className="h-64 w-full rounded-xl lg:col-span-2" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  const stats = dashboard?.stats;
  const history = dashboard?.assessmentHistory || [];
  const courses = dashboard?.courses || [];
  const latestScore = stats?.latest_score ?? 0;
  const hasAssessment = latestScore > 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="px-6 py-8 w-full max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            {t("dashboard.welcome", { name: session?.user?.name || "User" })}
          </h1>
          <p className="text-muted-foreground text-lg">{t("dashboard.subtitle")}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="shadow-sm hover:shadow-md transition-shadow overflow-hidden !p-0 !gap-0 !py-0">
            <div className="flex h-full">
              <div className={`w-1.5 shrink-0 ${getDsriLevel(latestScore).color}`} />
              <div className="flex-1 px-5 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("dashboard.latestDsriScore")}</p>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-4xl font-extrabold tracking-tight" style={{ color: hasAssessment ? getDsriLevel(latestScore).ring : "hsl(var(--foreground))" }}>
                        {latestScore ? Math.round(latestScore) : "--"}
                      </span>
                      <span className="text-lg font-medium text-muted-foreground">%</span>
                    </div>
                    {hasAssessment && (
                      <Badge className={`${getDsriLevel(latestScore).color} text-white border-0 text-[10px] mt-2 rounded-md`}>
                        {getDsriLevel(latestScore).label}
                      </Badge>
                    )}
                  </div>
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-500/20 dark:to-blue-600/20 rounded-xl shadow-sm">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-shadow overflow-hidden !p-0 !gap-0 !py-0">
            <div className="flex h-full">
              <div className="w-1.5 shrink-0 bg-emerald-500 dark:bg-emerald-500/40" />
              <div className="flex-1 px-5 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("dashboard.totalAssessments")}</p>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-4xl font-extrabold tracking-tight text-foreground">
                        {stats?.total_assessments ?? 0}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {(stats?.total_assessments ?? 0) > 0 ? t("dashboard.keepImproving") : t("dashboard.startYourJourney")}
                    </p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 dark:from-emerald-500/20 dark:to-green-600/20 rounded-xl shadow-sm">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-shadow overflow-hidden !p-0 !gap-0 !py-0">
            <div className="flex h-full">
              <div className="w-1.5 shrink-0 bg-violet-500 dark:bg-violet-500/40" />
              <div className="flex-1 px-5 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("dashboard.coursesInProgress")}</p>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-4xl font-extrabold tracking-tight text-foreground">
                        {stats?.courses_in_progress ?? 0}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {(stats?.courses_in_progress ?? 0) > 0 ? t("dashboard.continueLearning") : t("dashboard.startACourse")}
                    </p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 dark:from-violet-500/20 dark:to-purple-600/20 rounded-xl shadow-sm">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* DSRI Trend Chart */}
        {history.length >= 2 && (
          <Card className="shadow-sm hover:shadow-md transition-shadow mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                {t("dashboard.dsriTrend")}
              </CardTitle>
              <CardDescription>{t("dashboard.dsriTrendDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0">
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
            </CardContent>
          </Card>
        )}

        {/* AI Insights */}
        <AiInsightCard />

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Assessment Progress */}
          <div className="lg:col-span-2">
            <Card className="shadow-sm hover:shadow-md transition-shadow h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  {t("dashboard.assessmentProgress")}
                </CardTitle>
                <CardDescription>{t("dashboard.assessmentProgressDescription")}</CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                {hasAssessment ? (
                  <div className="space-y-5">
                    <div className={`flex items-center gap-6 p-5 rounded-2xl border ${getDsriLevel(latestScore).bg} border-opacity-50`} style={{ borderColor: getDsriLevel(latestScore).ring + "30" }}>
                      {/* Circular progress */}
                      <div className="relative w-24 h-24 shrink-0">
                        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 36 36">
                          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e5e7eb" strokeWidth="2.5" />
                          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={getDsriLevel(latestScore).ring} strokeWidth="2.5" strokeDasharray={`${Math.round(latestScore)}, 100`} strokeLinecap="round" style={{ transition: "stroke-dasharray 1s ease" }} />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xl font-bold" style={{ color: getDsriLevel(latestScore).ring }}>{Math.round(latestScore)}</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground">{t("dashboard.latestAssessment")}</h4>
                        <p className="text-sm text-muted-foreground mt-0.5">{t("dashboard.latestAssessmentDescription")}</p>
                        <Badge className={`${getDsriLevel(latestScore).color} text-white border-0 text-xs mt-2`}>
                          {getDsriLevel(latestScore).label}
                        </Badge>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-3xl font-bold" style={{ color: getDsriLevel(latestScore).ring }}>
                          {latestScore}%
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Link
                        href="/assessment"
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300 dark:hover:bg-indigo-500/30 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-colors shadow-sm"
                      >
                        <TrendingUp className="w-4 h-4" />
                        {t("dashboard.takeNewAssessment")}
                      </Link>
                      <Link
                        href="/assessment/results"
                        className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground hover:bg-accent hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                      >
                        {t("dashboard.viewResults")}
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-500/15 dark:to-purple-500/15 rounded-2xl flex items-center justify-center mb-4">
                      <Target className="w-8 h-8 text-indigo-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {t("dashboard.startYourAssessmentJourney")}
                    </h3>
                    <p className="text-muted-foreground mb-5 max-w-sm mx-auto">
                      {t("dashboard.startYourAssessmentJourneyDesc")}
                    </p>
                    <Link
                      href="/assessment"
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300 dark:hover:bg-indigo-500/30 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-colors shadow-sm"
                    >
                      <TrendingUp className="w-4 h-4" />
                      {t("dashboard.takeFirstAssessment")}
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div>
            <Card className="shadow-sm hover:shadow-md transition-shadow h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-green-600 dark:text-green-400" />
                  {t("dashboard.quickActions")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-2.5">
                {[
                  { href: "/courses/recommended", icon: BookOpen, bg: "from-emerald-500 to-green-600", title: t("dashboard.browseCourses"), desc: t("dashboard.browseCoursesDesc") },
                  { href: "/assessment/results", icon: ClipboardList, bg: "from-violet-500 to-purple-600", title: t("dashboard.viewProgress"), desc: t("dashboard.viewProgressDesc") },
                  { href: "/settings/profile", icon: User, bg: "from-amber-500 to-orange-500", title: t("dashboard.updateProfile"), desc: t("dashboard.updateProfileDesc") },
                ].map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="flex items-center gap-3 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm hover:shadow-md hover:border-border focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all group"
                  >
                    <div className={`p-2 bg-gradient-to-br ${action.bg} dark:from-white/10 dark:to-white/5 rounded-lg shadow-sm`}>
                      <action.icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-foreground">{action.title}</div>
                      <div className="text-[11px] text-muted-foreground">{action.desc}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground group-hover:text-muted-foreground transition-colors" />
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Learning Path */}
        {dashboard?.latestSectionScores && (
          <Card className="shadow-sm hover:shadow-md transition-shadow mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                {t("dashboard.competencyRoadmap")}
              </CardTitle>
              <CardDescription>{t("dashboard.competencyRoadmapDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <LearningPathProgress sectionScores={dashboard.latestSectionScores} />
            </CardContent>
          </Card>
        )}

        {/* Recommended Courses */}
        {courses.length > 0 && (
          <Card className="shadow-sm hover:shadow-md transition-shadow mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                {t("dashboard.recommendedCourses")}
              </CardTitle>
              <CardDescription>{t("dashboard.recommendedCoursesDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {courses.slice(0, 3).map((course) => (
                  <div
                    key={course.id}
                    className="rounded-xl border border-border p-4 hover:shadow-lg hover:border-border transition-all group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-semibold text-foreground text-sm leading-snug">{course.title}</h4>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{course.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span className="text-xs text-muted-foreground font-medium">
                          {course.level || "Beginner"}
                        </span>
                      </div>
                      <Link
                        href={course.url || "/courses"}
                        className="inline-flex items-center gap-1 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/15 px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-colors group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20"
                      >
                        <CirclePlay className="w-3.5 h-3.5" />
                        {t("dashboard.start")}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
              {courses.length > 3 && (
                <div className="mt-5 text-center">
                  <Link
                    href="/courses/recommended"
                    className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                  >
                    {t("dashboard.viewAllRecommended")}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Assessment History */}
        {history.length > 0 && (
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                {t("dashboard.assessmentHistory")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gradient-to-b from-background to-muted/80">
                      <th className="text-left py-3 px-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        Date
                      </th>
                      <th className="py-3 px-3 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider text-center bg-indigo-50/50 dark:bg-indigo-500/10">
                        DSRI
                      </th>
                      {Object.entries(COMPETENCIES).map(([c, cfg]) => (
                        <th key={c} className="py-3 px-2 text-[11px] font-bold text-muted-foreground uppercase tracking-wider text-center">
                          <div>{c}</div>
                          <div className="text-[9px] font-normal text-muted-foreground/60">/{cfg.maxScore}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((r: AssessmentRecord, idx: number) => (
                      <tr
                        key={r.id}
                        className={`transition-colors border-t border-border ${
                          idx === 0 ? "bg-indigo-50/30 dark:bg-indigo-500/5" : "hover:bg-accent/50"
                        }`}
                      >
                        <td className="py-2.5 px-3 font-medium text-foreground">
                          <div className="flex items-center gap-2">
                            {new Date(r.submitted_at).toLocaleDateString()}
                            {idx === 0 && (
                              <Badge variant="outline" className="text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 border-0 px-1.5 py-0">
                                Latest
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center bg-indigo-50/30 dark:bg-indigo-500/5">
                          <span className={`text-base font-bold ${getDsriTextColor(r.dsri)}`}>
                            {r.dsri}%
                          </span>
                        </td>
                        {[r.c1_score, r.c2_score, r.c3_score, r.c4_score, r.c5_score, r.c6_score, r.c7_score, r.c8_score, r.c9_score, r.c10_score].map((val, i) => {
                          const code = `C${i + 1}` as keyof typeof COMPETENCIES;
                          const maxScore = COMPETENCIES[code]?.maxScore ?? 50;
                          return (
                            <td key={i} className={`py-2.5 px-2 text-center text-xs ${scoreCellColor(val, maxScore)}`}>
                              {val ?? "—"}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
