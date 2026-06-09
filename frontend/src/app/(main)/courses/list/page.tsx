"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useTranslation } from "@/i18n/context";
import { useCourses, useUsers, assignCourseToUsers, unassignUsersFromCourse, useAssignedUsers } from "@/hooks/useApi";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { UserAvatar } from "@/components/ui/user-avatar";
import {
  Search,
  LayoutGrid,
  List,
  BookOpen,
  Star,
  UserPlus,
  SlidersHorizontal,
  Users,
  ChevronDown,
  ArrowUpDown,
  Trash2,
} from "lucide-react";

const LEVELS = ["All Levels", "beginner", "intermediate", "advanced"];
const SORT_KEYS = ["sortNewest", "sortHighestRated", "sortMostEnrolled", "sortTitleAz"] as const;
const SORT_VALUES = ["newest", "rating", "popular", "title"] as const;

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function ListCoursePage() {
  const { t } = useTranslation();
  const { courses, isLoading } = useCourses();
  const { data: session } = useSession();
  const isAdmin = session?.user?.permissions?.includes("user-management");
  const hasCourseMgmt = session?.user?.permissions?.includes("course-management");

  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [levelFilter, setLevelFilter] = useState("All Levels");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [showFilters, setShowFilters] = useState(false);

  // Assign modal state
  const [assignCourse, setAssignCourse] = useState<any>(null);
  const [assignSearch, setAssignSearch] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const { users: allUsers } = useUsers();
  const { assignedUserIds, mutate: mutateAssigned } = useAssignedUsers(assignCourse ? String(assignCourse.id) : null);
  const [removeUserTarget, setRemoveUserTarget] = useState<{ userId: number; name: string } | null>(null);

  const filtered = useMemo(() => {
    let result = (courses || []).filter(
      (c: any) =>
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        (c.description || "").toLowerCase().includes(search.toLowerCase())
    );

    if (levelFilter !== "All Levels") {
      result = result.filter((c: any) => c.level === levelFilter);
    }

    result = [...result].sort((a: any, b: any) => {
      switch (sortBy) {
        case "rating":
          return (b.avg_rating || 0) - (a.avg_rating || 0);
        case "popular":
          return (b.enrollment_count || 0) - (a.enrollment_count || 0);
        case "title":
          return a.title.localeCompare(b.title);
        default:
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      }
    });

    return result;
  }, [courses, search, levelFilter, sortBy]);

  const handleAssign = async () => {
    if (!assignCourse || selectedUsers.size === 0) return;
    setSaving(true);
    try {
      await assignCourseToUsers(String(assignCourse.id), Array.from(selectedUsers));
      toast.success(t("courses.assignedCount", { count: selectedUsers.size, title: assignCourse.title }));
      setAssignCourse(null);
      setSelectedUsers(new Set());
    } catch {
      toast.error(t("courses.failedToAssign"));
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="px-6 py-8 w-full max-w-7xl mx-auto">
          <div className="mb-8">
            <Skeleton className="h-10 w-36 mb-2" />
            <Skeleton className="h-6 w-72" />
          </div>
          <Skeleton className="h-11 w-full rounded-lg mb-8" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-72 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const levelCounts: Record<string, number> = {};
  (courses || []).forEach((c: any) => {
    const lv = c.level || "beginner";
    levelCounts[lv] = (levelCounts[lv] || 0) + 1;
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="px-6 py-8 w-full max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">{t("courses.listTitle")}</h1>
            <p className="text-muted-foreground text-lg">
              {t("courses.listDescription")}
              <span className="text-muted-foreground ml-2">{t("courses.courseCount", { count: filtered.length })}</span>
            </p>
          </div>
          {hasCourseMgmt && (
            <Link
              href="/courses/create"
              className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 dark:bg-violet-500/20 dark:text-violet-300 text-white rounded-lg hover:bg-violet-700 dark:hover:bg-violet-500/30 transition-colors font-medium shadow-sm"
            >
              <BookOpen className="w-4 h-4" />
              {t("courses.createCourse")}
            </Link>
          )}
        </div>

        {/* Search, Filters, View Toggle */}
        <div className="bg-card rounded-xl shadow-sm border border-border p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={t("courses.searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-card transition-colors"
              />
            </div>

            {/* Sort */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none pl-9 pr-8 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
              >
                {SORT_KEYS.map((key, i) => (
                  <option key={SORT_VALUES[i]} value={SORT_VALUES[i]}>{t(`courses.${key}`)}</option>
                ))}
              </select>
              <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            </div>

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                showFilters || levelFilter !== "All Levels"
                  ? "bg-violet-500/10 dark:bg-violet-400/15 border-violet-500/20 dark:border-violet-400/20 text-violet-700 dark:text-violet-300"
                  : "border-border bg-background text-muted-foreground hover:bg-muted"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              {t("courses.filters")}
              {levelFilter !== "All Levels" && (
                <span className="w-2 h-2 bg-violet-500 rounded-full" />
              )}
            </button>

            {/* View Toggle */}
            <div className="flex border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2.5 transition-colors ${viewMode === "grid" ? "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300" : "text-muted-foreground hover:bg-accent"}`}
                title={t("courses.gridView")}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-2.5 transition-colors ${viewMode === "table" ? "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300" : "text-muted-foreground hover:bg-accent"}`}
                title={t("courses.tableView")}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Expandable Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground font-medium mr-2">{t("courses.levelLabel")}</span>
                {LEVELS.map((lv) => (
                  <button
                    key={lv}
                    onClick={() => setLevelFilter(lv)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      levelFilter === lv
                        ? "bg-violet-600 text-white dark:bg-violet-500/20 dark:text-violet-300 shadow-sm"
                        : "bg-muted text-muted-foreground hover:bg-gray-200 dark:hover:bg-gray-700"
                    }`}
                  >
                    {lv === "All Levels" ? t("common.all") : t(`common.level${lv.charAt(0).toUpperCase() + lv.slice(1)}`)}
                    {lv !== "All Levels" && levelCounts[lv] && (
                      <span className="ml-1 opacity-70">{levelCounts[lv]}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Course Grid / Table */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">{t("courses.noCoursesTitle")}</h3>
            <p className="text-muted-foreground mb-6">{t("courses.noCoursesDescription")}</p>
            <button
              onClick={() => { setSearch(""); setLevelFilter("All Levels"); }}
              className="px-4 py-2 text-violet-600 dark:text-violet-400 font-medium hover:bg-violet-500/10 dark:hover:bg-violet-400/15 rounded-lg transition-colors"
            >
              {t("courses.clearAllFilters")}
            </button>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((course: any) => (
              <Card key={course.id} className="p-0 overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 group h-full flex flex-col">
                <Link href={`/courses/${course.id}?from=list`}>
                  <div className="h-44 relative overflow-hidden">
                    {course.image ? (
                      <img src={course.image} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 dark:from-violet-500/30 dark:via-purple-500/30 dark:to-indigo-500/30 flex items-center justify-center">
                        <BookOpen className="w-14 h-14 text-white/20" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs text-white font-medium">
                          {t(`common.level${(course.level || "beginner").charAt(0).toUpperCase() + (course.level || "beginner").slice(1)}`)}
                        </span>
                      </div>
                      {course.enrollment_count > 0 && (
                        <span className="flex items-center gap-1 px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs text-white">
                          <Users className="w-3 h-3" />
                          {course.enrollment_count}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
                <CardContent className="p-5 flex-1 flex flex-col">
                  <Link href={`/courses/${course.id}?from=list`}>
                    <h3 className="font-semibold text-foreground mb-1.5 line-clamp-2 hover:text-violet-600 transition-colors group-hover:text-violet-600">
                      {course.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{course.description}</p>
                  </Link>
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-border">
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-3.5 h-3.5 ${
                              star <= Math.round(course.avg_rating || 0)
                                ? "text-yellow-400 fill-current"
                                : "text-gray-200"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-medium text-foreground">{course.avg_rating ?? "—"}</span>
                      {course.ratings_count > 0 && (
                        <span className="text-xs text-muted-foreground">({course.ratings_count})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {course.working_field && (
                        <span className="text-xs text-muted-foreground">{course.working_field}</span>
                      )}
                      {isAdmin && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setAssignCourse(course);
                            setSelectedUsers(new Set());
                            setAssignSearch("");
                          }}
                          className="p-1.5 rounded-lg hover:bg-violet-500/10 text-violet-400 hover:text-violet-600 transition-colors"
                          title={t("courses.assign")}
                        >
                          <UserPlus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-background/80 border-b border-border">
                  <th className="text-left p-4 font-semibold text-muted-foreground">{t("courses.tableCourse")}</th>
                  <th className="text-left p-4 font-semibold text-muted-foreground">{t("courses.tableLevel")}</th>
                  <th className="text-left p-4 font-semibold text-muted-foreground">{t("courses.tableRating")}</th>
                  <th className="text-left p-4 font-semibold text-muted-foreground">{t("courses.tableEnrolled")}</th>
                  {isAdmin && <th className="text-left p-4 font-semibold text-muted-foreground w-28">{t("courses.tableActions")}</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((course: any) => (
                  <tr key={course.id} className="border-b border-border hover:bg-violet-50/30 dark:hover:bg-violet-500/5 transition-colors group">
                    <td className="p-4">
                      <Link href={`/courses/${course.id}?from=list`} className="font-medium text-foreground hover:text-violet-600 transition-colors">
                        {course.title}
                      </Link>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{course.description}</p>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        course.level === "advanced" ? "bg-red-500/10 dark:bg-red-400/15 text-red-600 dark:text-red-400" :
                        course.level === "intermediate" ? "bg-amber-500/10 dark:bg-amber-400/15 text-amber-600 dark:text-amber-400" :
                        "bg-green-500/10 dark:bg-green-400/15 text-green-600 dark:text-green-400"
                      }`}>
                        {t(`common.level${(course.level || "beginner").charAt(0).toUpperCase() + (course.level || "beginner").slice(1)}`)}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3 h-3 ${
                                star <= Math.round(course.avg_rating || 0)
                                  ? "text-yellow-400 fill-current"
                                  : "text-gray-200"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-medium">{course.avg_rating ?? "—"}</span>
                        {course.ratings_count > 0 && (
                          <span className="text-xs text-muted-foreground">({course.ratings_count})</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-muted-foreground">{course.enrollment_count || 0}</span>
                    </td>
                    {isAdmin && (
                      <td className="p-4">
                        <button
                          onClick={() => {
                            setAssignCourse(course);
                            setSelectedUsers(new Set());
                            setAssignSearch("");
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-violet-600 dark:text-violet-400 bg-violet-500/10 dark:bg-violet-400/15 hover:bg-violet-500/20 transition-colors"
                        >
                          <UserPlus className="w-3.5 h-3.5" /> {t("courses.assign")}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assign Users Modal */}
      <Dialog open={!!assignCourse} onOpenChange={(open) => { if (!open) { setAssignCourse(null); setSelectedUsers(new Set()); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("courses.assignUsersTitle")}</DialogTitle>
            <DialogDescription>{t("courses.assignUsersDescription", { title: assignCourse?.title || "" })}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={t("courses.searchUsers")}
                value={assignSearch}
                onChange={(e) => setAssignSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div className="max-h-64 overflow-y-auto space-y-1">
              {(allUsers || [])
                .filter((u: any) => !assignSearch || u.name?.toLowerCase().includes(assignSearch.toLowerCase()) || u.email?.toLowerCase().includes(assignSearch.toLowerCase()))
                .map((u: any) => {
                  const isAssigned = assignedUserIds.includes(u.id);
                  return (
                    <label key={u.id} className={`flex items-center gap-3 p-2.5 rounded-lg ${isAssigned ? "opacity-50 cursor-not-allowed" : "hover:bg-accent cursor-pointer"} transition-colors`}>
                      <input
                        type="checkbox"
                        checked={isAssigned || selectedUsers.has(u.id)}
                        disabled={isAssigned}
                        onChange={() => {
                          setSelectedUsers((prev) => {
                            const next = new Set(prev);
                            if (next.has(u.id)) next.delete(u.id); else next.add(u.id);
                            return next;
                          });
                        }}
                        className="rounded text-violet-600 dark:text-violet-400 focus:ring-violet-500"
                      />
                      <UserAvatar name={u.name} size={28} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{u.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                      </div>
                      {isAssigned && (
                        <button
                          onClick={() => setRemoveUserTarget({ userId: u.id, name: u.name })}
                          className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-muted-foreground hover:bg-red-500/10 hover:text-red-600 transition-colors shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          {t("common.remove")}
                        </button>
                      )}
                    </label>
                  );
                })}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAssignCourse(null); setSelectedUsers(new Set()); }}>{t("common.cancel")}</Button>
            <Button onClick={handleAssign} disabled={saving || selectedUsers.size === 0} className="bg-violet-600 hover:bg-violet-700 dark:bg-violet-500/20 dark:text-violet-300 dark:hover:bg-violet-500/30">
              {saving ? t("courses.assigning") : t("courses.assignButton", { count: selectedUsers.size })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove User Confirmation */}
      <Dialog open={!!removeUserTarget} onOpenChange={(open) => { if (!open) setRemoveUserTarget(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("courses.removeUserTitle")}</DialogTitle>
            <DialogDescription>
              {t("courses.removeUserFromCourse", { name: removeUserTarget?.name || "", title: assignCourse?.title || "" })}
              {" "}{t("courses.archivedMoved")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveUserTarget(null)}>{t("common.cancel")}</Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!removeUserTarget || !assignCourse) return;
                try {
                  await unassignUsersFromCourse(String(assignCourse.id), [removeUserTarget.userId]);
                  toast.success(t("courses.removedUser", { name: removeUserTarget.name, title: assignCourse.title }));
                  mutateAssigned();
                  setRemoveUserTarget(null);
                } catch {
                  toast.error(t("courses.failedToRemoveUser"));
                }
              }}
            >
              {t("common.remove")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */
