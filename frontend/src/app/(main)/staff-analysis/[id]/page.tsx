"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { useStaffReport } from "@/hooks/useApi";
import { exportToCsv } from "@/lib/export";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/ui/user-avatar";
import { CompetencyRadar } from "@/components/charts/CompetencyRadar";
import { DsriTrendLine } from "@/components/charts/DsriTrendLine";
import { COMPETENCIES } from "@/lib/constants";
import {
  ArrowLeft,
  Calendar,
  BarChart3,
  FileText,
  CircleCheck,
  Activity,
  Users,
  BookOpen,
  Download,
  GraduationCap,
  Award,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";

function getScoreColor(score: number) {
  if (score >= 70) return "text-green-600";
  if (score >= 40) return "text-orange-600";
  return "text-red-600";
}

function getScoreBg(pct: number) {
  if (pct >= 70) return "bg-green-50 border-green-200";
  if (pct >= 40) return "bg-yellow-50 border-yellow-200";
  return "bg-red-50 border-red-200";
}

function getProgressBarColor(pct: number) {
  if (pct >= 70) return "bg-green-500";
  if (pct >= 40) return "bg-yellow-500";
  return "bg-red-500";
}

function getDsriLevel(score: number) {
  if (score >= 90) return { label: "Excellent", color: "#22c55e", bg: "bg-green-50", ring: "#22c55e" };
  if (score >= 70) return { label: "Good", color: "#84cc16", bg: "bg-lime-50", ring: "#84cc16" };
  if (score >= 40) return { label: "Average", color: "#f59e0b", bg: "bg-amber-50", ring: "#f59e0b" };
  return { label: "Needs Work", color: "#ef4444", bg: "bg-red-50", ring: "#ef4444" };
}

function getStatusBadge(status: string) {
  if (status === "completed") return "bg-green-100 text-green-800";
  if (status === "active") return "bg-blue-100 text-blue-800";
  return "bg-gray-100 text-gray-800";
}

/* eslint-disable @typescript-eslint/no-explicit-any */
type ApiRecord = Record<string, any>;

export default function StaffReportPage() {
  const params = useParams();
  const { data, isLoading } = useStaffReport(params.id as string);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div>
                <Skeleton className="h-8 w-48 mb-1" />
                <Skeleton className="h-5 w-64" />
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Skeleton className="h-64 w-full rounded-xl lg:col-span-2" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Staff not found</h3>
          <Link href="/staff-analysis" className="text-violet-600 font-medium">Back to staff analysis</Link>
        </div>
      </div>
    );
  }

  const staff = data.staff;
  const sectionScores = data.sectionScores || {};
  const assessmentHistory = data.assessmentHistory || [];
  const courseAnalysis = data.courseAnalysis || [];
  const latestDsri = data.latest_dsri || 0;
  const dsriRound = latestDsri ? Math.round(latestDsri) : 0;

  const totalAssessments = assessmentHistory.length;
  const totalCourses = data.courseCount || 0;
  const completedCourses = data.completedCourses || 0;
  const courseRate = totalCourses > 0 ? Math.round((completedCourses / totalCourses) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/staff-analysis" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <UserAvatar name={staff.name} size={44} />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{staff.name}</h1>
                <p className="text-gray-500 text-sm">{staff.email} {staff.working_field ? `· ${staff.working_field}` : ""} {staff.job_level ? `· ${staff.job_level}` : ""}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const headers = ["Competency", "Score", "Max", "Percentage"];
                  const rows = (Object.values(sectionScores) as ApiRecord[]).map((s) => [
                    s.name || s.code || "", String(s.score || 0), String(s.max_score || 0), `${s.percentage || 0}%`,
                  ]);
                  exportToCsv(`${staff.name.replace(/\s+/g, "-")}-report.csv`, headers, rows);
                  toast.success("Exported staff report");
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm hover:bg-gray-50 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(staff.roles?.includes("Staff") ? "active" : "completed")}`}>
                {(staff.roles || []).join(", ")}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-sm">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">DSRI Score</p>
                  <p className={`text-2xl font-bold ${getScoreColor(dsriRound)}`}>
                    {dsriRound || "-"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-sm">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Assessments</p>
                  <p className="text-2xl font-bold text-gray-900">{totalAssessments}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-sm">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Courses Enrolled</p>
                  <p className="text-2xl font-bold text-gray-900">{totalCourses}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl shadow-sm">
                  <CircleCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Courses Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{completedCourses} <span className="text-sm font-normal text-gray-500">({courseRate}%)</span></p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Competency Scores */}
          <div className="lg:col-span-2">
            <Card className="mb-8">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-violet-600" />
                  Competency Profile
                </h2>
                {Object.keys(sectionScores).length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                    <p>No assessment data available</p>
                  </div>
                ) : (
                  <>
                    {/* Radar Chart */}
                    <div className="mb-6">
                      <CompetencyRadar
                        data={(Object.entries(sectionScores) as [string, ApiRecord][]).map(([code, section]) => ({
                          code,
                          name: COMPETENCIES[code as keyof typeof COMPETENCIES]?.nameEn || section.name || code,
                          percentage: section.percentage || 0,
                        }))}
                      />
                    </div>

                    {/* Score Breakdown Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {(Object.entries(sectionScores) as [string, ApiRecord][]).map(([code, section]) => (
                        <div key={code} className={`rounded-lg p-3 border ${getScoreBg(section.percentage)}`}>
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-gray-600">{code}</span>
                              <span className="text-xs text-gray-600 truncate">{section.name}</span>
                            </div>
                            <span className={`text-sm font-bold ${getScoreColor(section.percentage)}`}>
                              {section.percentage}%
                            </span>
                          </div>
                          <div className="w-full bg-white/60 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full ${getProgressBarColor(section.percentage)} transition-all duration-700 ease-out`}
                              style={{ width: `${Math.min(section.percentage, 100)}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[10px] text-gray-400">{section.score}/{section.max_score}</span>
                            <span className="text-[10px] text-gray-400">Weight: {section.weight}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* DSRI Trend */}
            {assessmentHistory.length >= 2 && (
              <Card className="mb-8">
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    DSRI Trend
                  </h2>
                  <DsriTrendLine
                    data={assessmentHistory
                      .map((a: ApiRecord) => ({
                        date: new Date(a.submitted_at).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        }),
                        dsri: a.dsri,
                      }))
                      .reverse()}
                  />
                </CardContent>
              </Card>
            )}

            {/* Assessment History */}
            <Card className="py-0">
              <CardContent className="p-0">
                <div className="flex items-center justify-between px-6 py-4 border-b">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-violet-600" />
                    Assessment History
                  </h2>
                  <span className="text-sm text-gray-500">{assessmentHistory.length} records</span>
                </div>
                {assessmentHistory.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                    <p>No assessment history</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="text-left p-3 font-medium text-gray-700">Date</th>
                          <th className="text-left p-3 font-medium text-gray-700">DSRI</th>
                          {["C1","C2","C3","C4","C5","C6","C7","C8","C9","C10"].map(c => (
                            <th key={c} className="text-left p-3 font-medium text-gray-700">{c}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {assessmentHistory.map((a: ApiRecord, i: number) => (
                          <tr key={a.id} className={`hover:bg-gray-50 ${i === 0 ? "bg-violet-50/50" : ""}`}>
                            <td className="p-3 text-gray-600">
                              {a.submitted_at ? new Date(a.submitted_at).toLocaleDateString() : "-"}
                            </td>
                            <td className={`p-3 font-bold ${getScoreColor(a.dsri)}`}>
                              {a.dsri ? Math.round(a.dsri) : "-"}
                            </td>
                            {["c1","c2","c3","c4","c5","c6","c7","c8","c9","c10"].map(c => (
                              <td key={c} className="p-3 text-gray-600">{a[`${c}_score`] ?? "-"}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* DSRI Overview */}
            {dsriRound > 0 && (() => {
              const level = getDsriLevel(dsriRound);
              const trend = assessmentHistory.length >= 2 ? (() => {
                const diff = assessmentHistory[0].dsri - assessmentHistory[1].dsri;
                if (diff > 0) return { icon: TrendingUp, text: `+${Math.round(diff)} from previous`, color: "text-green-600" };
                if (diff < 0) return { icon: TrendingDown, text: `${Math.round(diff)} from previous`, color: "text-red-600" };
                return { icon: Minus, text: "No change", color: "text-gray-500" };
              })() : null;
              const TrendIcon = trend?.icon;
              return (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-500" />
                      DSRI Overview
                    </h3>
                    <div className="flex items-center justify-center mb-3">
                      <div className="relative w-36 h-36">
                        <svg className="w-36 h-36 -rotate-90" viewBox="0 0 36 36">
                          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e5e7eb" strokeWidth="2.5" />
                          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={level.ring} strokeWidth="2.5" strokeDasharray={`${dsriRound}, 100`} strokeLinecap="round" style={{ transition: "stroke-dasharray 1s ease" }} />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-3xl font-bold" style={{ color: level.color }}>{dsriRound}</span>
                          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: level.color }}>{level.label}</span>
                        </div>
                      </div>
                    </div>
                    {trend && TrendIcon && (
                      <div className={`flex items-center justify-center gap-1.5 text-xs font-medium ${trend.color}`}>
                        <TrendIcon className="w-3.5 h-3.5" />
                        {trend.text}
                      </div>
                    )}
                    {totalAssessments > 0 && (
                      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                        <div className="bg-gray-50 rounded-lg p-2">
                          <p className="text-lg font-bold text-gray-900">{totalAssessments}</p>
                          <p className="text-[10px] text-gray-500">Assessments</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2">
                          <p className="text-lg font-bold text-gray-900">{Math.max(...assessmentHistory.map((a: ApiRecord) => Math.round(a.dsri || 0)))}</p>
                          <p className="text-[10px] text-gray-500">Best Score</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2">
                          <p className="text-lg font-bold text-gray-900">{Math.round(assessmentHistory.reduce((s: number, a: ApiRecord) => s + (a.dsri || 0), 0) / totalAssessments)}</p>
                          <p className="text-[10px] text-gray-500">Average</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })()}

            {/* Course Progress */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-violet-600" />
                  Course Progress
                </h2>
                {totalCourses > 0 && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-600">Overall Completion</span>
                      <span className="font-semibold">{courseRate}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div className={`h-2 rounded-full transition-all duration-700 ease-out ${getProgressBarColor(courseRate)}`} style={{ width: `${courseRate}%` }} />
                    </div>
                  </div>
                )}
                {courseAnalysis.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    <BookOpen className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                    <p>No course enrollments</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {courseAnalysis.map((c: ApiRecord) => (
                      <div key={c.course_id} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-medium text-gray-900 text-sm truncate flex-1 mr-2">
                            {c.course_title || `Course #${c.course_id}`}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${getStatusBadge(c.status)}`}>
                            {c.status}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full transition-all duration-700 ease-out ${getProgressBarColor(c.progress)}`}
                            style={{ width: `${c.progress}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{Math.round(c.progress)}% complete</div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
