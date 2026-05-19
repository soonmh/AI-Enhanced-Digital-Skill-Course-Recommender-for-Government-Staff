/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useStaffAnalysis, useDepartmentComparison, useDepartmentInsights } from "@/hooks/useApi";
import { useTranslation } from "@/i18n/context";
import { exportToCsv } from "@/lib/export";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/ui/user-avatar";
import { OnlineIndicator } from "@/components/shared/OnlineIndicator";
import { DepartmentComparisonBar } from "@/components/charts/DepartmentComparisonBar";
import { CompetencyHeatmap } from "@/components/charts/CompetencyHeatmap";
import {
  Users,
  BookOpen,
  CircleCheck,
  Target,
  Search,
  ArrowRight,
  Download,
  BarChart3,
  Lightbulb,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

export default function StaffAnalysisPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useStaffAnalysis();
  const { data: deptData } = useDepartmentComparison();
  const { insights: deptInsights, isLoading: insightsLoading } = useDepartmentInsights();
  const [search, setSearch] = useState("");
  const [fieldFilter, setFieldFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dsriMin, setDsriMin] = useState("");
  const [dsriMax, setDsriMax] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-card shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <Skeleton className="h-9 w-48 mb-1" />
            <Skeleton className="h-5 w-72" />
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
          <Skeleton className="h-14 w-full rounded-xl mb-8" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  const stats = data?.stats || { total_staff: 0, assessment_completion: 0, course_enrollment: 0, avg_dsri: 0 };
  const staff = data?.staff || [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filtered = staff.filter((s: any) => {
    const matchSearch = !search || s.name?.toLowerCase().includes(search.toLowerCase()) || s.email?.toLowerCase().includes(search.toLowerCase());
    const matchField = !fieldFilter || s.working_field === fieldFilter;
    const matchStatus = !statusFilter || s.status === statusFilter;
    const dsri = s.latest_dsri || 0;
    const matchDsriMin = !dsriMin || dsri >= Number(dsriMin);
    const matchDsriMax = !dsriMax || dsri <= Number(dsriMax);
    return matchSearch && matchField && matchStatus && matchDsriMin && matchDsriMax;
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fields = Array.from(new Set(staff.map((s: any) => s.working_field).filter(Boolean))) as string[];

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold text-foreground">{t("reports.staffAnalysisTitle")}</h1>
          <p className="text-muted-foreground mt-1">{t("reports.staffAnalysisDescription")}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-sm shrink-0">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground whitespace-nowrap">{t("reports.totalStaff")}</p>
                  <p className="text-2xl font-bold text-foreground">{stats.total_staff}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-sm shrink-0">
                  <CircleCheck className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground whitespace-nowrap">{t("reports.assessmentCompletion")}</p>
                  <p className="text-2xl font-bold text-foreground">{stats.assessment_completion}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-sm shrink-0">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground whitespace-nowrap">{t("reports.courseEnrollment")}</p>
                  <p className="text-2xl font-bold text-foreground">{stats.course_enrollment}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl shadow-sm shrink-0">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground whitespace-nowrap">{t("reports.avgDsriScore")}</p>
                  <p className="text-2xl font-bold text-foreground">{stats.avg_dsri}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Department Insights */}
        {deptInsights?.has_data && deptInsights?.insights && (
          <Card className="mb-8 border-0 shadow-lg bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                {t("reports.aiDepartmentInsights")}
              </CardTitle>
              <CardDescription>
                {t("reports.aiInsightsPoweredBy", { count: deptInsights.assessed_staff, avg: deptInsights.avg_dsri })}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-4">
              {deptInsights.insights.summary && (
                <p className="text-foreground leading-relaxed">{deptInsights.insights.summary}</p>
              )}

              {deptInsights.insights.strengths?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{t("reports.strengths")}</h4>
                  <ul className="space-y-1.5">
                    {deptInsights.insights.strengths.map((s: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {deptInsights.insights.weaknesses?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{t("reports.weaknesses")}</h4>
                  <ul className="space-y-1.5">
                    {deptInsights.insights.weaknesses.map((w: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                        <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {deptInsights.insights.recommendations?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{t("reports.recommendations")}</h4>
                  <ul className="space-y-1.5">
                    {deptInsights.insights.recommendations.map((r: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                        <Target className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {insightsLoading && (
          <Card className="mb-8 border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                {t("reports.aiDepartmentInsights")}
              </CardTitle>
              <CardDescription>{t("reports.loadingAiAnalysis")}</CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        )}

        {/* Field Comparison Chart */}
        {deptData?.departments?.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                {t("reports.fieldComparison")}
              </CardTitle>
              <CardDescription>{t("reports.fieldComparisonDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <DepartmentComparisonBar
                departments={deptData.departments}
                competencies={deptData.competencies}
              />
            </CardContent>
          </Card>
        )}

        {/* Field Heatmap */}
        {deptData?.departments?.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-amber-600" />
                {t("reports.fieldHeatmap")}
              </CardTitle>
              <CardDescription>{t("reports.fieldHeatmapDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <CompetencyHeatmap departments={deptData.departments} />
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="p-5">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={t("reports.searchStaff")}
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-shadow"
                />
              </div>
              <select
                value={fieldFilter}
                onChange={(e) => { setFieldFilter(e.target.value); setPage(1); }}
                className="px-3 py-2.5 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-shadow"
              >
                <option value="">{t("reports.allFields")}</option>
                {fields.map((f: string) => <option key={f} value={f}>{f}</option>)}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="px-3 py-2.5 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-shadow"
              >
                <option value="">{t("common.all")}</option>
                <option value="completed">{t("common.completed")}</option>
                <option value="in_progress">{t("common.inProgress")}</option>
                <option value="not_started">{t("common.notStarted")}</option>
              </select>
              <input
                type="number"
                placeholder={t("reports.dsriScore") + " min"}
                value={dsriMin}
                onChange={(e) => setDsriMin(e.target.value)}
                className="w-28 px-3 py-2.5 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-shadow"
                min="0"
                max="100"
              />
              <input
                type="number"
                placeholder={t("reports.dsriScore") + " max"}
                value={dsriMax}
                onChange={(e) => setDsriMax(e.target.value)}
                className="w-28 px-3 py-2.5 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-shadow"
                min="0"
                max="100"
              />
              <button
                onClick={() => {
                  const headers = ["Name", "Email", "Field", "DSRI", "Status"];
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const rows = filtered.map((s: any) => [
                    s.name || "",
                    s.email || "",
                    s.working_field || "",
                    s.latest_dsri ? `${s.latest_dsri}%` : "-",
                    s.status || "Not Started",
                  ]);
                  exportToCsv("staff-analysis.csv", headers, rows);
                  toast.success("Exported staff analysis");
                }}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-colors shadow-sm"
              >
                <Download className="w-4 h-4" />
                {t("reports.exportCsv")}
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Staff Table */}
        <Card className="py-0">
          <CardContent className="p-0">
            <div className="flex items-center justify-between px-5 py-3 border-b">
              <h2 className="text-base font-semibold text-foreground">{t("reports.staffDirectory")}</h2>
              <span className="text-sm text-muted-foreground">{t("reports.staffCount", { count: filtered.length })}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm table-fixed">
                <thead className="sticky top-0 z-10 bg-muted">
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium text-foreground" style={{ width: "35%" }}>{t("reports.tableStaff")}</th>
                    <th className="text-left p-4 font-medium text-foreground" style={{ width: "15%" }}>{t("reports.tableField")}</th>
                    <th className="text-left p-4 font-medium text-foreground" style={{ width: "15%" }}>{t("reports.tableDsri")}</th>
                    <th className="text-left p-4 font-medium text-foreground" style={{ width: "10%" }}>{t("reports.tableCourses")}</th>
                    <th className="text-left p-4 font-medium text-foreground" style={{ width: "15%" }}>{t("reports.tableStatus")}</th>
                    <th className="text-left p-4 font-medium text-foreground" style={{ width: "10%" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {paged.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">{t("reports.noStaffFound")}</td>
                    </tr>
                  ) : (
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    <>
                      {paged.map((s: any) => (
                        <tr key={s.id} className="border-b hover:bg-blue-50/40 hover:shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <UserAvatar name={s.name} size={34} />
                                <OnlineIndicator userId={s.id} />
                              </div>
                              <div className="truncate">
                                <p className="font-medium text-foreground truncate">{s.name}</p>
                                <p className="text-xs text-muted-foreground truncate">{s.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-muted-foreground truncate">{s.working_field || "-"}</td>
                          <td className="p-4">
                            {s.latest_dsri ? (
                              <div className="flex items-center gap-2">
                                <div className="w-16 bg-muted rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full ${(s.latest_dsri || 0) >= 70 ? "bg-green-500" : (s.latest_dsri || 0) >= 40 ? "bg-yellow-500" : "bg-red-500"}`}
                                    style={{ width: `${s.latest_dsri}%` }}
                                  />
                                </div>
                                <span className={`text-sm font-bold ${(s.latest_dsri || 0) >= 70 ? "text-green-600 dark:text-green-400" : (s.latest_dsri || 0) >= 40 ? "text-orange-600 dark:text-orange-400" : "text-red-600 dark:text-red-400"}`}>
                                  {s.latest_dsri}%
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="p-4 text-muted-foreground">{s.course_count || 0}</td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                              s.status === "completed" ? "bg-green-100 text-green-700" :
                              s.status === "in_progress" ? "bg-yellow-100 text-yellow-700" :
                              "bg-muted text-foreground"
                            }`}>
                              {s.status === "completed" ? t("common.completed") : s.status === "in_progress" ? t("common.inProgress") : t("common.notStarted")}
                            </span>
                          </td>
                          <td className="p-4">
                            <a href={`/staff-analysis/${s.id}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-violet-600 dark:text-violet-400 bg-violet-500/10 dark:bg-violet-400/15 hover:bg-violet-500/20 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition-all">
                              View <ArrowRight className="w-3 h-3" />
                            </a>
                          </td>
                        </tr>
                      ))}
                    </>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-t text-sm">
              <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
                {[10, 25, 50].map((n) => (
                  <button key={n} onClick={() => { setPageSize(n); setPage(1); }} className={`px-3 py-1 rounded-md text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${pageSize === n ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}>{n}</button>
                ))}
              </div>
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage(1)} disabled={page === 1} className="px-2 py-1 rounded hover:bg-muted focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-40">&laquo;</button>
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-2 py-1 rounded hover:bg-muted focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-40">&lsaquo;</button>
                  <span className="px-3 text-muted-foreground">{page} / {totalPages}</span>
                  <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-2 py-1 rounded hover:bg-muted focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-40">&rsaquo;</button>
                  <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="px-2 py-1 rounded hover:bg-muted focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-40">&raquo;</button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
