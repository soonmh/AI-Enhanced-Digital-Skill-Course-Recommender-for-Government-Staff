"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
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
const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "rating", label: "Highest Rated" },
  { value: "popular", label: "Most Enrolled" },
  { value: "title", label: "Title A-Z" },
] as const;

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function ListCoursePage() {
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
      toast.success(`Assigned ${selectedUsers.size} user(s) to ${assignCourse.title}`);
      setAssignCourse(null);
      setSelectedUsers(new Set());
    } catch {
      toast.error("Failed to assign users");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="px-6 py-8 w-full max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Courses</h1>
            <p className="text-gray-600 text-lg">
              Browse and enroll in courses to improve your skills
              <span className="text-gray-400 ml-2">({filtered.length} course{filtered.length !== 1 ? "s" : ""})</span>
            </p>
          </div>
          {hasCourseMgmt && (
            <Link
              href="/courses/create"
              className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors font-medium shadow-sm"
            >
              <BookOpen className="w-4 h-4" />
              Create Course
            </Link>
          )}
        </div>

        {/* Search, Filters, View Toggle */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search courses by title or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-colors"
              />
            </div>

            {/* Sort */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none pl-9 pr-8 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                showFilters || levelFilter !== "All Levels"
                  ? "bg-violet-50 border-violet-200 text-violet-700"
                  : "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {levelFilter !== "All Levels" && (
                <span className="w-2 h-2 bg-violet-500 rounded-full" />
              )}
            </button>

            {/* View Toggle */}
            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2.5 transition-colors ${viewMode === "grid" ? "bg-violet-100 text-violet-700" : "text-gray-400 hover:bg-gray-50"}`}
                title="Grid view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-2.5 transition-colors ${viewMode === "table" ? "bg-violet-100 text-violet-700" : "text-gray-400 hover:bg-gray-50"}`}
                title="Table view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Expandable Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 font-medium mr-2">Level:</span>
                {LEVELS.map((lv) => (
                  <button
                    key={lv}
                    onClick={() => setLevelFilter(lv)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      levelFilter === lv
                        ? "bg-violet-600 text-white shadow-sm"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {lv === "All Levels" ? "All" : lv.charAt(0).toUpperCase() + lv.slice(1)}
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
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No courses found</h3>
            <p className="text-gray-500 mb-6">Try adjusting your search or filters.</p>
            <button
              onClick={() => { setSearch(""); setLevelFilter("All Levels"); }}
              className="px-4 py-2 text-violet-600 font-medium hover:bg-violet-50 rounded-lg transition-colors"
            >
              Clear all filters
            </button>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((course: any) => (
              <Card key={course.id} className="p-0 overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 group h-full flex flex-col">
                <Link href={`/courses/${course.id}?from=list`}>
                  <div className="h-44 bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 relative overflow-hidden">
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <BookOpen className="w-14 h-14 text-white/20" />
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs text-white font-medium">
                          {(course.level || "beginner").charAt(0).toUpperCase() + (course.level || "beginner").slice(1)}
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
                    <h3 className="font-semibold text-gray-900 mb-1.5 line-clamp-2 hover:text-violet-600 transition-colors group-hover:text-violet-600">
                      {course.title}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-4">{course.description}</p>
                  </Link>
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
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
                      <span className="text-sm font-medium text-gray-700">{course.avg_rating ?? "—"}</span>
                      {course.ratings_count > 0 && (
                        <span className="text-xs text-gray-400">({course.ratings_count})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {course.working_field && (
                        <span className="text-xs text-gray-400">{course.working_field}</span>
                      )}
                      {isAdmin && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setAssignCourse(course);
                            setSelectedUsers(new Set());
                            setAssignSearch("");
                          }}
                          className="p-1.5 rounded-lg hover:bg-violet-50 text-violet-400 hover:text-violet-600 transition-colors"
                          title="Assign to users"
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
          <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200">
                  <th className="text-left p-4 font-semibold text-gray-600">Course</th>
                  <th className="text-left p-4 font-semibold text-gray-600">Level</th>
                  <th className="text-left p-4 font-semibold text-gray-600">Rating</th>
                  <th className="text-left p-4 font-semibold text-gray-600">Enrolled</th>
                  {isAdmin && <th className="text-left p-4 font-semibold text-gray-600 w-28">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((course: any) => (
                  <tr key={course.id} className="border-b border-gray-100 hover:bg-violet-50/30 transition-colors group">
                    <td className="p-4">
                      <Link href={`/courses/${course.id}?from=list`} className="font-medium text-gray-900 hover:text-violet-600 transition-colors">
                        {course.title}
                      </Link>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-1">{course.description}</p>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        course.level === "advanced" ? "bg-red-50 text-red-600" :
                        course.level === "intermediate" ? "bg-amber-50 text-amber-600" :
                        "bg-green-50 text-green-600"
                      }`}>
                        {(course.level || "beginner").charAt(0).toUpperCase() + (course.level || "beginner").slice(1)}
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
                          <span className="text-xs text-gray-400">({course.ratings_count})</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-gray-600">{course.enrollment_count || 0}</span>
                    </td>
                    {isAdmin && (
                      <td className="p-4">
                        <button
                          onClick={() => {
                            setAssignCourse(course);
                            setSelectedUsers(new Set());
                            setAssignSearch("");
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-violet-600 bg-violet-50 hover:bg-violet-100 transition-colors"
                        >
                          <UserPlus className="w-3.5 h-3.5" /> Assign
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
            <DialogTitle>Assign Users</DialogTitle>
            <DialogDescription>Select users to assign to &ldquo;{assignCourse?.title}&rdquo;</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={assignSearch}
                onChange={(e) => setAssignSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div className="max-h-64 overflow-y-auto space-y-1">
              {(allUsers || [])
                .filter((u: any) => !assignSearch || u.name?.toLowerCase().includes(assignSearch.toLowerCase()) || u.email?.toLowerCase().includes(assignSearch.toLowerCase()))
                .map((u: any) => {
                  const isAssigned = assignedUserIds.includes(u.id);
                  return (
                    <label key={u.id} className={`flex items-center gap-3 p-2.5 rounded-lg ${isAssigned ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50 cursor-pointer"} transition-colors`}>
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
                        className="rounded text-violet-600 focus:ring-violet-500"
                      />
                      <UserAvatar name={u.name} size={28} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{u.name}</p>
                        <p className="text-xs text-gray-500 truncate">{u.email}</p>
                      </div>
                      {isAssigned && (
                        <button
                          onClick={() => setRemoveUserTarget({ userId: u.id, name: u.name })}
                          className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Remove
                        </button>
                      )}
                    </label>
                  );
                })}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAssignCourse(null); setSelectedUsers(new Set()); }}>Cancel</Button>
            <Button onClick={handleAssign} disabled={saving || selectedUsers.size === 0}>
              {saving ? "Assigning..." : `Assign ${selectedUsers.size} User(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove User Confirmation */}
      <Dialog open={!!removeUserTarget} onOpenChange={(open) => { if (!open) setRemoveUserTarget(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove User</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove <strong>{removeUserTarget?.name}</strong> from <strong>{assignCourse?.title}</strong>?
              The course will be moved to their Archived tab.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveUserTarget(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!removeUserTarget || !assignCourse) return;
                try {
                  await unassignUsersFromCourse(String(assignCourse.id), [removeUserTarget.userId]);
                  toast.success(`Removed ${removeUserTarget.name} from ${assignCourse.title}`);
                  mutateAssigned();
                  setRemoveUserTarget(null);
                } catch {
                  toast.error("Failed to remove user");
                }
              }}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */
