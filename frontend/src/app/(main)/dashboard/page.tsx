"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useDashboard } from "@/hooks/useApi";
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
  if (score >= 90) return { label: "Excellent", color: "bg-green-500", ring: "#22c55e", bg: "bg-green-50" };
  if (score >= 70) return { label: "Good", color: "bg-emerald-500", ring: "#10b981", bg: "bg-emerald-50" };
  if (score >= 40) return { label: "Average", color: "bg-amber-500", ring: "#f59e0b", bg: "bg-amber-50" };
  return { label: "Needs Work", color: "bg-red-500", ring: "#ef4444", bg: "bg-red-50" };
}

function getDsriTextColor(score: number) {
  if (score >= 70) return "text-emerald-600";
  if (score >= 40) return "text-amber-600";
  return "text-red-600";
}

function scoreCellColor(val: number | null | undefined) {
  if (val == null) return "text-gray-400";
  if (val >= 70) return "text-emerald-600 font-semibold";
  if (val >= 40) return "text-amber-600 font-medium";
  return "text-red-500 font-medium";
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const { dashboard, isLoading } = useDashboard();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="px-6 py-8 w-full max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome, {session?.user?.name || "User"}!
          </h1>
          <p className="text-gray-500 text-lg">Track your digital skills journey</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="shadow-sm hover:shadow-md transition-shadow overflow-hidden !p-0 !gap-0 !py-0">
            <div className="flex h-full">
              <div className={`w-1.5 shrink-0 ${getDsriLevel(latestScore).color}`} />
              <div className="flex-1 px-5 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Latest DSRI Score</p>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-4xl font-extrabold tracking-tight" style={{ color: hasAssessment ? getDsriLevel(latestScore).ring : "#111827" }}>
                        {latestScore ? Math.round(latestScore) : "--"}
                      </span>
                      <span className="text-lg font-medium text-gray-400">%</span>
                    </div>
                    {hasAssessment && (
                      <Badge className={`${getDsriLevel(latestScore).color} text-white border-0 text-[10px] mt-2 rounded-md`}>
                        {getDsriLevel(latestScore).label}
                      </Badge>
                    )}
                  </div>
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-sm">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-shadow overflow-hidden !p-0 !gap-0 !py-0">
            <div className="flex h-full">
              <div className="w-1.5 shrink-0 bg-emerald-500" />
              <div className="flex-1 px-5 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Assessments</p>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-4xl font-extrabold tracking-tight text-gray-900">
                        {stats?.total_assessments ?? 0}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      {(stats?.total_assessments ?? 0) > 0 ? "Keep improving!" : "Start your journey"}
                    </p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-sm">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-shadow overflow-hidden !p-0 !gap-0 !py-0">
            <div className="flex h-full">
              <div className="w-1.5 shrink-0 bg-violet-500" />
              <div className="flex-1 px-5 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Courses In Progress</p>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-4xl font-extrabold tracking-tight text-gray-900">
                        {stats?.courses_in_progress ?? 0}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      {(stats?.courses_in_progress ?? 0) > 0 ? "Continue learning" : "Start a course"}
                    </p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-sm">
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
                <Activity className="w-5 h-5 text-blue-600" />
                DSRI Trend
              </CardTitle>
              <CardDescription>Your DSRI score over time</CardDescription>
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
                  <ClipboardList className="w-5 h-5 text-blue-600" />
                  Assessment Progress
                </CardTitle>
                <CardDescription>Your digital skills journey</CardDescription>
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
                        <h4 className="font-semibold text-gray-900">Latest Assessment</h4>
                        <p className="text-sm text-gray-500 mt-0.5">Your most recent result</p>
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
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-colors shadow-sm"
                      >
                        <TrendingUp className="w-4 h-4" />
                        Take New Assessment
                      </Link>
                      <Link
                        href="/assessment/results"
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                      >
                        View Results
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mb-4">
                      <Target className="w-8 h-8 text-indigo-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      Start Your Assessment Journey
                    </h3>
                    <p className="text-gray-500 mb-5 max-w-sm mx-auto">
                      Take your first digital skills assessment to get personalized recommendations.
                    </p>
                    <Link
                      href="/assessment"
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-colors shadow-sm"
                    >
                      <TrendingUp className="w-4 h-4" />
                      Take First Assessment
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
                  <Clock className="w-5 h-5 text-green-600" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-2.5">
                {[
                  { href: "/courses/recommended", icon: BookOpen, bg: "from-emerald-500 to-green-600", title: "Browse Courses", desc: "Enhance your skills" },
                  { href: "/assessment/results", icon: ClipboardList, bg: "from-violet-500 to-purple-600", title: "View Progress", desc: "Track your growth" },
                  { href: "/settings/profile", icon: User, bg: "from-amber-500 to-orange-500", title: "Update Profile", desc: "Manage account" },
                ].map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="flex items-center gap-3 w-full rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm hover:shadow-md hover:border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all group"
                  >
                    <div className={`p-2 bg-gradient-to-br ${action.bg} rounded-lg shadow-sm`}>
                      <action.icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-gray-800">{action.title}</div>
                      <div className="text-[11px] text-gray-400">{action.desc}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 ml-auto text-gray-300 group-hover:text-gray-500 transition-colors" />
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
                <Activity className="w-5 h-5 text-indigo-600" />
                Competency Roadmap
              </CardTitle>
              <CardDescription>Your learning path across all competency areas</CardDescription>
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
                <Award className="w-5 h-5 text-amber-500" />
                Recommended Courses
              </CardTitle>
              <CardDescription>Courses tailored to your skill gaps</CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {courses.slice(0, 3).map((course) => (
                  <div
                    key={course.id}
                    className="rounded-xl border border-gray-100 p-4 hover:shadow-lg hover:border-gray-200 transition-all group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-semibold text-gray-900 text-sm leading-snug">{course.title}</h4>
                    </div>
                    <p className="text-xs text-gray-500 mb-3 line-clamp-2">{course.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span className="text-xs text-gray-500 font-medium">
                          {course.level || "Beginner"}
                        </span>
                      </div>
                      <Link
                        href={course.url || "/courses"}
                        className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-colors group-hover:bg-indigo-100"
                      >
                        <CirclePlay className="w-3.5 h-3.5" />
                        Start
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
              {courses.length > 3 && (
                <div className="mt-5 text-center">
                  <Link
                    href="/courses/recommended"
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                  >
                    View All Recommended
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
                <History className="w-5 h-5 text-violet-600" />
                Assessment History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="overflow-x-auto rounded-lg border border-gray-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gradient-to-b from-gray-50 to-gray-100/80">
                      <th className="text-left py-3 px-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="py-3 px-3 text-[11px] font-bold text-indigo-600 uppercase tracking-wider text-center bg-indigo-50/50">
                        DSRI
                      </th>
                      {Object.keys(COMPETENCIES).map((c) => (
                        <th key={c} className="py-3 px-2 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-center">
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((r: AssessmentRecord, idx: number) => (
                      <tr
                        key={r.id}
                        className={`transition-colors border-t border-gray-50 ${
                          idx === 0 ? "bg-indigo-50/30" : "hover:bg-gray-50/50"
                        }`}
                      >
                        <td className="py-2.5 px-3 font-medium text-gray-700">
                          <div className="flex items-center gap-2">
                            {new Date(r.submitted_at).toLocaleDateString()}
                            {idx === 0 && (
                              <Badge variant="outline" className="text-[10px] bg-indigo-50 text-indigo-600 border-indigo-200 border-0 px-1.5 py-0">
                                Latest
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center bg-indigo-50/30">
                          <span className={`text-base font-bold ${getDsriTextColor(r.dsri)}`}>
                            {r.dsri}%
                          </span>
                        </td>
                        {[r.c1_score, r.c2_score, r.c3_score, r.c4_score, r.c5_score, r.c6_score, r.c7_score, r.c8_score, r.c9_score, r.c10_score].map((val, i) => (
                          <td key={i} className={`py-2.5 px-2 text-center text-xs ${scoreCellColor(val)}`}>
                            {val ?? "—"}
                          </td>
                        ))}
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
