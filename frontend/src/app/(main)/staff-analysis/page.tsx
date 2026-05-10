/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useStaffAnalysis, useDepartmentComparison, useDepartmentInsights } from "@/hooks/useApi";
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
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
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
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Staff Analysis</h1>
          <p className="text-gray-600 mt-1">Analyze staff performance and digital skills readiness</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-sm">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Staff</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_staff}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-sm">
                  <CircleCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Assessment Completion</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.assessment_completion}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-sm">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Course Enrollment</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.course_enrollment}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl shadow-sm">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Avg DSRI Score</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.avg_dsri}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Department Insights */}
        {deptInsights?.has_data && deptInsights?.insights && (
          <Card className="mb-8 border-0 shadow-lg bg-gradient-to-r from-indigo-50 to-purple-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                AI Department Insights
              </CardTitle>
              <CardDescription>
                Powered by AI — based on {deptInsights.assessed_staff} assessed staff (avg DSRI: {deptInsights.avg_dsri}%)
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-4">
              {deptInsights.insights.summary && (
                <p className="text-gray-700 leading-relaxed">{deptInsights.insights.summary}</p>
              )}

              {deptInsights.insights.strengths?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Strengths</h4>
                  <ul className="space-y-1.5">
                    {deptInsights.insights.strengths.map((s: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {deptInsights.insights.weaknesses?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Weaknesses</h4>
                  <ul className="space-y-1.5">
                    {deptInsights.insights.weaknesses.map((w: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {deptInsights.insights.recommendations?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Recommendations</h4>
                  <ul className="space-y-1.5">
                    {deptInsights.insights.recommendations.map((r: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
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
                AI Department Insights
              </CardTitle>
              <CardDescription>Loading AI analysis...</CardDescription>
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
                Field Comparison
              </CardTitle>
              <CardDescription>Average competency scores by working field</CardDescription>
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
                Field Competency Heatmap
              </CardTitle>
              <CardDescription>Color-coded view of competency strengths by working field</CardDescription>
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
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search staff..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-shadow"
                />
              </div>
              <select
                value={fieldFilter}
                onChange={(e) => { setFieldFilter(e.target.value); setPage(1); }}
                className="px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-shadow"
              >
                <option value="">All Fields</option>
                {fields.map((f: string) => <option key={f} value={f}>{f}</option>)}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-shadow"
              >
                <option value="">All Status</option>
                <option value="completed">Completed</option>
                <option value="in_progress">In Progress</option>
                <option value="not_started">Not Started</option>
              </select>
              <input
                type="number"
                placeholder="DSRI min"
                value={dsriMin}
                onChange={(e) => setDsriMin(e.target.value)}
                className="w-28 px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-shadow"
                min="0"
                max="100"
              />
              <input
                type="number"
                placeholder="DSRI max"
                value={dsriMax}
                onChange={(e) => setDsriMax(e.target.value)}
                className="w-28 px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-shadow"
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
                Export CSV
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Staff Table */}
        <Card className="py-0">
          <CardContent className="p-0">
            <div className="flex items-center justify-between px-5 py-3 border-b">
              <h2 className="text-base font-semibold text-gray-900">Staff Directory</h2>
              <span className="text-sm text-gray-500">{filtered.length} staff</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm table-fixed">
                <thead className="sticky top-0 z-10 bg-gray-50">
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium text-gray-700" style={{ width: "35%" }}>Staff</th>
                    <th className="text-left p-4 font-medium text-gray-700" style={{ width: "15%" }}>Field</th>
                    <th className="text-left p-4 font-medium text-gray-700" style={{ width: "15%" }}>DSRI</th>
                    <th className="text-left p-4 font-medium text-gray-700" style={{ width: "10%" }}>Courses</th>
                    <th className="text-left p-4 font-medium text-gray-700" style={{ width: "15%" }}>Status</th>
                    <th className="text-left p-4 font-medium text-gray-700" style={{ width: "10%" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {paged.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-500">No staff found</td>
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
                                <p className="font-medium text-gray-900 truncate">{s.name}</p>
                                <p className="text-xs text-gray-500 truncate">{s.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-gray-600 truncate">{s.working_field || "-"}</td>
                          <td className="p-4">
                            {s.latest_dsri ? (
                              <div className="flex items-center gap-2">
                                <div className="w-16 bg-gray-200 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full ${(s.latest_dsri || 0) >= 70 ? "bg-green-500" : (s.latest_dsri || 0) >= 40 ? "bg-yellow-500" : "bg-red-500"}`}
                                    style={{ width: `${s.latest_dsri}%` }}
                                  />
                                </div>
                                <span className={`text-sm font-bold ${(s.latest_dsri || 0) >= 70 ? "text-green-600" : (s.latest_dsri || 0) >= 40 ? "text-orange-600" : "text-red-600"}`}>
                                  {s.latest_dsri}%
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="p-4 text-gray-600">{s.course_count || 0}</td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                              s.status === "completed" ? "bg-green-100 text-green-700" :
                              s.status === "in_progress" ? "bg-yellow-100 text-yellow-700" :
                              "bg-gray-100 text-gray-700"
                            }`}>
                              {s.status === "completed" ? "Completed" : s.status === "in_progress" ? "In Progress" : "Not Started"}
                            </span>
                          </td>
                          <td className="p-4">
                            <a href={`/staff-analysis/${s.id}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-violet-600 bg-violet-50 hover:bg-violet-100 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition-all">
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
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                {[10, 25, 50].map((n) => (
                  <button key={n} onClick={() => { setPageSize(n); setPage(1); }} className={`px-3 py-1 rounded-md text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${pageSize === n ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>{n}</button>
                ))}
              </div>
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage(1)} disabled={page === 1} className="px-2 py-1 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-40">&laquo;</button>
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-2 py-1 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-40">&lsaquo;</button>
                  <span className="px-3 text-gray-600">{page} / {totalPages}</span>
                  <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-2 py-1 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-40">&rsaquo;</button>
                  <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="px-2 py-1 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-40">&raquo;</button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
