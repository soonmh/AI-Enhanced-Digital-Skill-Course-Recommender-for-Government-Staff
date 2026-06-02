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
import { getMaturityLevel } from "@/lib/maturity";
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
  if (score >= 70) return "text-green-600 dark:text-green-400";
  if (score >= 40) return "text-orange-600 dark:text-orange-400";
  return "text-red-600 dark:text-red-400";
}

function getScoreBg(pct: number) {
  if (pct >= 70) return "bg-green-500/10 border-green-500/20";
  if (pct >= 40) return "bg-yellow-500/10 border-yellow-500/20";
  return "bg-red-500/10 border-red-500/20";
}

function getProgressBarColor(pct: number) {
  if (pct >= 70) return "bg-green-500";
  if (pct >= 40) return "bg-yellow-500";
  return "bg-red-500";
}

function getDsriLevel(score: number) {
  const m = getMaturityLevel(score);
  return { label: m.labelEn, color: m.hex, bg: m.bgClass, ring: m.hex };
}

function getStatusBadge(status: string) {
  if (status === "completed") return "bg-green-100 text-green-800";
  if (status === "active") return "bg-blue-100 text-blue-800";
  return "bg-muted text-foreground";
}

/* eslint-disable @typescript-eslint/no-explicit-any */
type ApiRecord = Record<string, any>;

export default function StaffReportPage() {
  const params = useParams();
  const { data, isLoading } = useStaffReport(params.id as string);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-card shadow-sm border-b">
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Staff not found</h3>
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/staff-analysis" className="p-2 hover:bg-muted rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5 text-muted-foreground" />
              </Link>
              <UserAvatar name={staff.name} size={44} />
              <div>
                <h1 className="text-2xl font-bold text-foreground">{staff.name}</h1>
                <p className="text-muted-foreground text-sm">{staff.email} {staff.working_field ? `· ${staff.working_field}` : ""} {staff.job_level ? `· ${staff.job_level}` : ""}</p>
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-sm hover:bg-accent transition-colors"
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
                  <p className="text-sm text-muted-foreground">DSRI Score</p>
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
                  <p className="text-sm text-muted-foreground">Assessments</p>
                  <p className="text-2xl font-bold text-foreground">{totalAssessments}</p>
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
                  <p className="text-sm text-muted-foreground">Courses Enrolled</p>
                  <p className="text-2xl font-bold text-foreground">{totalCourses}</p>
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
                  <p className="text-sm text-muted-foreground">Courses Completed</p>
                  <p className="text-2xl font-bold text-foreground">{completedCourses} <span className="text-sm font-normal text-muted-foreground">({courseRate}%)</span></p>
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
                <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                  Competency Profile
                </h2>
                {Object.keys(sectionScores).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
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
                              <span className="text-xs font-bold text-muted-foreground">{code}</span>
                              <span className="text-xs text-muted-foreground truncate">{section.name}</span>
                            </div>
                            <span className={`text-sm font-bold ${getScoreColor(section.percentage)}`}>
                              {section.percentage}%
                            </span>
                          </div>
                          <div className="w-full bg-card/60 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full ${getProgressBarColor(section.percentage)} transition-all duration-700 ease-out`}
                              style={{ width: `${Math.min(section.percentage, 100)}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[10px] text-muted-foreground">{section.score}/{section.max_score}</span>
                            <span className="text-[10px] text-muted-foreground">Weight: {section.weight}</span>
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
                  <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
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
                  <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                    Assessment History
                  </h2>
                  <span className="text-sm text-muted-foreground">{assessmentHistory.length} records</span>
                </div>
                {assessmentHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                    <p>No assessment history</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border text-sm">
                      <thead>
                        <tr className="bg-background">
                          <th className="text-left p-3 font-medium text-foreground">Date</th>
                          <th className="text-left p-3 font-medium text-foreground">DSRI</th>
                          {["C1","C2","C3","C4","C5","C6","C7","C8","C9","C10"].map(c => (
                            <th key={c} className="text-left p-3 font-medium text-foreground">{c}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {assessmentHistory.map((a: ApiRecord, i: number) => (
                          <tr key={a.id} className={`hover:bg-accent ${i === 0 ? "bg-violet-50/50" : ""}`}>
                            <td className="p-3 text-muted-foreground">
                              {a.submitted_at ? new Date(a.submitted_at).toLocaleDateString() : "-"}
                            </td>
                            <td className={`p-3 font-bold ${getScoreColor(a.dsri)}`}>
                              {a.dsri ? Math.round(a.dsri) : "-"}
                            </td>
                            {["c1","c2","c3","c4","c5","c6","c7","c8","c9","c10"].map(c => (
                              <td key={c} className="p-3 text-muted-foreground">{a[`${c}_score`] ?? "-"}</td>
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
                if (diff > 0) return { icon: TrendingUp, text: `+${Math.round(diff)} from previous`, color: "text-green-600 dark:text-green-400" };
                if (diff < 0) return { icon: TrendingDown, text: `${Math.round(diff)} from previous`, color: "text-red-600" };
                return { icon: Minus, text: "No change", color: "text-muted-foreground" };
              })() : null;
              const TrendIcon = trend?.icon;
              return (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
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
                        <div className="bg-background rounded-lg p-2">
                          <p className="text-lg font-bold text-foreground">{totalAssessments}</p>
                          <p className="text-[10px] text-muted-foreground">Assessments</p>
                        </div>
                        <div className="bg-background rounded-lg p-2">
                          <p className="text-lg font-bold text-foreground">{Math.max(...assessmentHistory.map((a: ApiRecord) => Math.round(a.dsri || 0)))}</p>
                          <p className="text-[10px] text-muted-foreground">Best Score</p>
                        </div>
                        <div className="bg-background rounded-lg p-2">
                          <p className="text-lg font-bold text-foreground">{Math.round(assessmentHistory.reduce((s: number, a: ApiRecord) => s + (a.dsri || 0), 0) / totalAssessments)}</p>
                          <p className="text-[10px] text-muted-foreground">Average</p>
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
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                  Course Progress
                </h2>
                {totalCourses > 0 && (
                  <div className="mb-4 p-3 bg-background rounded-lg">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Overall Completion</span>
                      <span className="font-semibold">{courseRate}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div className={`h-2 rounded-full transition-all duration-700 ease-out ${getProgressBarColor(courseRate)}`} style={{ width: `${courseRate}%` }} />
                    </div>
                  </div>
                )}
                {courseAnalysis.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <BookOpen className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                    <p>No course enrollments</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {courseAnalysis.map((c: ApiRecord) => (
                      <div key={c.course_id} className="bg-background rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-medium text-foreground text-sm truncate flex-1 mr-2">
                            {c.course_title || `Course #${c.course_id}`}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${getStatusBadge(c.status)}`}>
                            {c.status}
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full transition-all duration-700 ease-out ${getProgressBarColor(c.progress)}`}
                            style={{ width: `${c.progress}%` }}
                          />
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">{Math.round(c.progress)}% complete</div>
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
