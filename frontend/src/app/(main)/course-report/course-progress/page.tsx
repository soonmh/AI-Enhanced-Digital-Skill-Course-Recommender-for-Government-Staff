"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { useCourseProgress } from "@/hooks/useApi";
import { exportToCsv } from "@/lib/export";
import { useTranslation } from "@/i18n/context";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/ui/user-avatar";
import {
  BookOpen,
  Users,
  Trophy,
  TrendingUp,
  Search,
  BarChart3,
  Download,
  Activity,
  Star,
} from "lucide-react";

function getProgressColor(pct: number) {
  if (pct >= 90) return "bg-green-500";
  if (pct >= 70) return "bg-blue-500";
  if (pct >= 40) return "bg-yellow-500";
  return "bg-red-500";
}

function getStatusBadge(status: string) {
  if (status === "completed") return "bg-green-100 text-green-800";
  if (status === "active") return "bg-blue-100 text-blue-800";
  return "bg-muted text-foreground";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ApiRecord = Record<string, any>;

export default function CourseProgressPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useCourseProgress();
  const [search, setSearch] = useState("");
  const tableRef = useRef<HTMLDivElement>(null);
  const scrollToTable = () => setTimeout(() => tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  const [tab, setTab] = useState<"courses" | "users">("courses");
  const [coursePage, setCoursePage] = useState(1);
  const [coursePageSize, setCoursePageSize] = useState(6);
  const [userPage, setUserPage] = useState(1);
  const [userPageSize, setUserPageSize] = useState(6);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-card shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <Skeleton className="h-9 w-48 mb-1" />
            <Skeleton className="h-5 w-72" />
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
          <Skeleton className="h-14 w-full rounded-xl mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  const summary = data?.summary || { total_courses: 0, total_enrollments: 0, avg_completion_rate: 0, avg_progress: 0 };
  const courseStats = data?.courseStats || [];
  const topCourses = data?.topCourses || { enrollment: [], progress: [], completion: [] };
  const enhancedUsers = data?.enhancedUsers || [];

  const filteredCourses = courseStats.filter((c: ApiRecord) =>
    !search || c.title?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredUsers = enhancedUsers.filter((u: ApiRecord) =>
    !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const courseTotalPages = Math.ceil(filteredCourses.length / coursePageSize);
  const pagedCourses = filteredCourses.slice((coursePage - 1) * coursePageSize, coursePage * coursePageSize);

  const userTotalPages = Math.ceil(filteredUsers.length / userPageSize);
  const pagedUsers = filteredUsers.slice((userPage - 1) * userPageSize, userPage * userPageSize);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold text-foreground">{t("reports.courseProgressTitle")}</h1>
          <p className="text-muted-foreground mt-1">{t("reports.courseProgressDescription")}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t("reports.totalCourses")}</p>
                  <p className="text-3xl font-bold text-foreground">{summary.total_courses}</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-sm">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t("reports.totalEnrollments")}</p>
                  <p className="text-3xl font-bold text-foreground">{summary.total_enrollments}</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-sm">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t("reports.avgCompletionRate")}</p>
                  <p className="text-3xl font-bold text-foreground">{summary.avg_completion_rate}%</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-sm">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t("reports.avgProgress")}</p>
                  <p className="text-3xl font-bold text-foreground">{summary.avg_progress}%</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl shadow-sm">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Courses Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
          {/* Top by Enrollment */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                {t("reports.popularByEnrollment")}
              </h3>
              {topCourses.enrollment?.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">{t("reports.noEnrollmentData")}</div>
              ) : (
                <div className="space-y-3">
                  {topCourses.enrollment?.map((c: ApiRecord, i: number) => (
                    <div key={c.id} className="p-3 bg-background rounded-lg">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-6 h-6 flex items-center justify-center text-xs font-bold bg-violet-100 text-violet-700 rounded-full shrink-0">{i + 1}</span>
                          <span className="font-medium text-foreground text-sm truncate">{c.title}</span>
                        </div>
                        <span className="text-sm text-muted-foreground shrink-0 ml-2">{t("reports.enrolledCount", { count: c.enrollment_count })}</span>
                      </div>
                      <div className="pl-9">
                        <div className="w-full bg-muted rounded-full h-1.5">
                          <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${Math.min(c.completion_rate || 0, 100)}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top by Progress */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-sky-600" />
                Highest Progress
              </h3>
              {topCourses.progress?.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">No progress data found</div>
              ) : (
                <div className="space-y-3">
                  {topCourses.progress?.map((c: ApiRecord, i: number) => (
                    <div key={c.id} className="p-3 bg-background rounded-lg">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-6 h-6 flex items-center justify-center text-xs font-bold bg-sky-100 text-sky-700 rounded-full shrink-0">{i + 1}</span>
                          <span className="font-medium text-foreground text-sm truncate">{c.title}</span>
                        </div>
                        <span className="text-sm font-medium text-sky-600 shrink-0 ml-2">{Math.round(c.avg_progress)}%</span>
                      </div>
                      <div className="pl-9">
                        <div className="w-full bg-muted rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${getProgressColor(c.avg_progress)}`} style={{ width: `${Math.min(c.avg_progress, 100)}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top by Completion */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-green-600 dark:text-green-400" />
                Highest Completion
              </h3>
              {topCourses.completion?.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">No completion data found</div>
              ) : (
                <div className="space-y-3">
                  {topCourses.completion?.map((c: ApiRecord, i: number) => (
                    <div key={c.id} className="p-3 bg-background rounded-lg">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-6 h-6 flex items-center justify-center text-xs font-bold bg-green-100 text-green-700 rounded-full shrink-0">{i + 1}</span>
                          <span className="font-medium text-foreground text-sm truncate">{c.title}</span>
                        </div>
                        <span className="text-sm font-medium text-green-600 shrink-0 ml-2">{c.completion_rate}%</span>
                      </div>
                      <div className="pl-9">
                        <div className="w-full bg-muted rounded-full h-1.5">
                          <div className="h-1.5 rounded-full bg-green-500" style={{ width: `${Math.min(c.completion_rate || 0, 100)}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={tab === "courses" ? t("reports.searchCourses") : t("admin.searchUsers")}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCoursePage(1); setUserPage(1); }}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            <button
              onClick={() => setTab("courses")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === "courses" ? "bg-card shadow text-foreground" : "text-muted-foreground"}`}
            >
              Courses
            </button>
            <button
              onClick={() => setTab("users")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === "users" ? "bg-card shadow text-foreground" : "text-muted-foreground"}`}
            >
              Users
            </button>
          </div>
          <button
            onClick={() => {
              if (tab === "courses") {
                const headers = ["Title", "Level", "Enrolled", "Avg Progress", "Completion Rate"];
                const rows = filteredCourses.map((c: ApiRecord) => [
                  c.title || "", c.level || "",
                  String(c.enrollment_count || 0), `${Math.round(c.avg_progress || 0)}%`, `${c.completion_rate || 0}%`,
                ]);
                exportToCsv("course-progress.csv", headers, rows);
              } else {
                const headers = ["Name", "Email", "Courses", "Completed", "Avg Progress", "Status"];
                const rows = filteredUsers.map((u: ApiRecord) => [
                  u.name || "", u.email || "",
                  String(u.total_courses || 0), String(u.completed_courses || 0),
                  `${Math.round(u.avg_progress || 0)}%`, u.status || "",
                ]);
                exportToCsv("user-progress.csv", headers, rows);
              }
              toast.success(t("reports.exportCsv"));
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-card text-sm hover:bg-accent transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {tab === "courses" ? (
          /* Course List */
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pagedCourses.length === 0 ? (
                <div className="col-span-2 text-center py-12 text-muted-foreground">
                  <BookOpen className="w-12 h-12 mx-auto mb-3" />
                  <p>{t("reports.noCoursesFound")}</p>
                </div>
              ) : (
                pagedCourses.map((c: ApiRecord) => (
                  <Card key={c.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-foreground">{c.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            {c.level && <span className="px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full text-xs">{c.level}</span>}
                          </div>
                        </div>
                        <BarChart3 className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="grid grid-cols-4 gap-4 mb-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-foreground">{c.enrollment_count}</p>
                          <p className="text-xs text-muted-foreground">{t("common.enrolled")}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">{Math.round(c.avg_progress)}%</p>
                          <p className="text-xs text-muted-foreground">{t("common.progress")}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{c.completion_rate}%</p>
                          <p className="text-xs text-muted-foreground">{t("common.completed")}</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <p className="text-2xl font-bold text-foreground">{c.avg_rating ?? "—"}</p>
                          </div>
                          <p className="text-xs text-muted-foreground">{c.ratings_count || 0} rating{c.ratings_count === 1 ? "" : "s"}</p>
                        </div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className={`h-2 rounded-full transition-all ${getProgressColor(c.avg_progress)}`} style={{ width: `${c.avg_progress}%` }} />
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
            <div className="flex items-center justify-between mt-6 text-sm">
              <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
                {[4, 6, 8, 12].map((n) => (
                  <button key={n} onClick={() => { setCoursePageSize(n); setCoursePage(1); }} className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${coursePageSize === n ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}>{n}</button>
                ))}
              </div>
              {courseTotalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button onClick={() => setCoursePage(1)} disabled={coursePage === 1} className="px-2 py-1 rounded hover:bg-muted disabled:opacity-40">&laquo;</button>
                  <button onClick={() => setCoursePage((p) => Math.max(1, p - 1))} disabled={coursePage === 1} className="px-2 py-1 rounded hover:bg-muted disabled:opacity-40">&lsaquo;</button>
                  <span className="px-3 text-muted-foreground">{coursePage} / {courseTotalPages}</span>
                  <button onClick={() => setCoursePage((p) => Math.min(courseTotalPages, p + 1))} disabled={coursePage === courseTotalPages} className="px-2 py-1 rounded hover:bg-muted disabled:opacity-40">&rsaquo;</button>
                  <button onClick={() => setCoursePage(courseTotalPages)} disabled={coursePage === courseTotalPages} className="px-2 py-1 rounded hover:bg-muted disabled:opacity-40">&raquo;</button>
                </div>
              )}
            </div>
          </>
        ) : (
          /* User List */
          <Card className="py-0" ref={tableRef}>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm table-fixed">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-background border-b">
                      <th className="text-left p-4 font-medium text-foreground" style={{ width: "40%" }}>{t("reports.tableUser")}</th>
                      <th className="text-left p-4 font-medium text-foreground" style={{ width: "12%" }}>{t("reports.tableCourses")}</th>
                      <th className="text-left p-4 font-medium text-foreground" style={{ width: "12%" }}>{t("common.completed")}</th>
                      <th className="text-left p-4 font-medium text-foreground" style={{ width: "22%" }}>{t("reports.avgProgress")}</th>
                      <th className="text-left p-4 font-medium text-foreground" style={{ width: "14%" }}>{t("reports.tableStatus")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-muted-foreground">{t("reports.noUsersFound")}</td>
                      </tr>
                    ) : (
                      pagedUsers.map((u: ApiRecord) => (
                        <tr key={u.id} className="border-b hover:bg-accent transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <UserAvatar name={u.name} size={32} />
                              <div className="truncate">
                                <p className="font-medium text-foreground truncate">{u.name}</p>
                                <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-foreground">{u.total_courses}</td>
                          <td className="p-4 text-foreground">{u.completed_courses}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-muted rounded-full h-2">
                                <div className={`h-2 rounded-full ${getProgressColor(u.avg_progress)}`} style={{ width: `${u.avg_progress}%` }} />
                              </div>
                              <span className="text-sm">{Math.round(u.avg_progress)}%</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(u.status)}`}>
                              {u.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between px-4 py-3 border-t text-sm">
                <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
                  {[5, 6, 10, 25].map((n) => (
                    <button key={n} onClick={() => { setUserPageSize(n); setUserPage(1); }} className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${userPageSize === n ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}>{n}</button>
                  ))}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => { setUserPage(1); scrollToTable(); }} disabled={userPage === 1} className="px-2 py-1 rounded hover:bg-muted disabled:opacity-40">&laquo;</button>
                  <button onClick={() => { setUserPage((p) => Math.max(1, p - 1)); scrollToTable(); }} disabled={userPage === 1} className="px-2 py-1 rounded hover:bg-muted disabled:opacity-40">&lsaquo;</button>
                  <span className="px-3 text-muted-foreground">{userPage} / {userTotalPages}</span>
                  <button onClick={() => { setUserPage((p) => Math.min(userTotalPages, p + 1)); scrollToTable(); }} disabled={userPage === userTotalPages} className="px-2 py-1 rounded hover:bg-muted disabled:opacity-40">&rsaquo;</button>
                  <button onClick={() => { setUserPage(userTotalPages); scrollToTable(); }} disabled={userPage === userTotalPages} className="px-2 py-1 rounded hover:bg-muted disabled:opacity-40">&raquo;</button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
