"use client";

import { useState } from "react";
import Link from "next/link";
import { useCourses } from "@/hooks/useApi";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  Play,
  CheckCircle,
  Archive,
  Clock,
  ExternalLink,
  BarChart3,
  Sparkles,
} from "lucide-react";

type ApiRecord = Record<string, any>;

type TabKey = "in_progress" | "completed" | "archived";

const tabs: { key: TabKey; label: string; icon: typeof Play }[] = [
  { key: "in_progress", label: "In Progress", icon: Play },
  { key: "completed", label: "Completed", icon: CheckCircle },
  { key: "archived", label: "Archived", icon: Archive },
];

function classifyCourses(courses: ApiRecord[]) {
  const inProgress: ApiRecord[] = [];
  const completed: ApiRecord[] = [];
  const archived: ApiRecord[] = [];

  for (const c of courses) {
    if (!c.enrolled) continue;
    if (c.status === "removed") {
      archived.push(c);
    } else if (c.status === "completed" || (c.progress ?? 0) >= 100) {
      completed.push(c);
    } else {
      inProgress.push(c);
    }
  }

  return { in_progress: inProgress, completed: completed, archived: archived };
}

function CourseCard({ course, variant }: { course: ApiRecord; variant: "progress" | "completed" | "archived" }) {
  const progress = course.progress ?? 0;

  const styles = {
    progress: {
      border: "border-l-blue-500",
      badge: "bg-blue-50 text-blue-700",
      bar: "bg-blue-500",
      icon: <Play className="w-4 h-4 text-blue-500" />,
    },
    completed: {
      border: "border-l-green-500",
      badge: "bg-green-50 text-green-700",
      bar: "bg-green-500",
      icon: <CheckCircle className="w-4 h-4 text-green-500" />,
    },
    archived: {
      border: "border-l-gray-400",
      badge: "bg-gray-100 text-gray-600",
      bar: "bg-gray-400",
      icon: <Archive className="w-4 h-4 text-gray-400" />,
    },
  };

  const s = styles[variant];

  return (
    <Link href={`/courses/${course.id}?from=my-learning`}>
      <div
        className={cn(
          "bg-white rounded-xl border border-gray-200 border-l-4 shadow-sm hover:shadow-md transition-all duration-200 h-full",
          s.border,
          variant === "archived" && "opacity-70"
        )}
      >
        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <h3 className="font-semibold text-gray-900 line-clamp-2 text-sm leading-snug">
              {course.title}
            </h3>
            {s.icon}
          </div>

          {/* Level badge */}
          <div className="flex items-center gap-2 mb-4">
            {course.level && (
              <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", s.badge)}>
                {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
              </span>
            )}
            {variant === "completed" && (
              <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                <Sparkles className="w-3 h-3" />
                Completed
              </span>
            )}
            {variant === "archived" && (
              <span className="text-xs text-gray-500">Removed by admin</span>
            )}
          </div>

          {/* Progress bar */}
          {variant !== "archived" && (
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-gray-500">Progress</span>
                <span className="font-semibold text-gray-700">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className={cn("h-2 rounded-full transition-all duration-300", s.bar)}
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Archived info */}
          {variant === "archived" && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock className="w-3.5 h-3.5" />
              <span>This course was unassigned by an admin</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

function EmptyState({ tab }: { tab: TabKey }) {
  const config = {
    in_progress: {
      icon: BookOpen,
      title: "No courses in progress",
      desc: "Start learning by enrolling in a course",
      action: { label: "Browse Courses", href: "/courses/recommended" },
    },
    completed: {
      icon: CheckCircle,
      title: "No completed courses yet",
      desc: "Keep going — finish a course to see it here",
    },
    archived: {
      icon: Archive,
      title: "No archived courses",
      desc: "Courses removed by admin will appear here",
    },
  };

  const c = config[tab];
  const Icon = c.icon;

  return (
    <div className="text-center py-16">
      <div className="mx-auto w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-gray-300" />
      </div>
      <h3 className="text-lg font-semibold text-gray-700 mb-1">{c.title}</h3>
      <p className="text-gray-500 mb-5 text-sm">{c.desc}</p>
      {c.action && (
        <Link
          href={c.action.href}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          {c.action.label}
        </Link>
      )}
    </div>
  );
}

export default function MyLearningPage() {
  const { courses, isLoading } = useCourses();
  const [activeTab, setActiveTab] = useState<TabKey>("in_progress");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <Skeleton className="h-9 w-36 mb-1" />
            <Skeleton className="h-5 w-64" />
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Skeleton className="h-10 w-96 mb-6 rounded-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const allCourses = Array.isArray(courses) ? courses : [];
  const grouped = classifyCourses(allCourses);
  const activeCourses = grouped[activeTab];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold text-gray-900">My Learning</h1>
          <p className="text-gray-600 mt-1">Track your enrolled courses and progress</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {tabs.map((tab) => {
            const count = grouped[tab.key].length;
            const Icon = tab.icon;
            const colors = {
              in_progress: "bg-blue-50 border-blue-200 text-blue-700",
              completed: "bg-green-50 border-green-200 text-green-700",
              archived: "bg-gray-50 border-gray-200 text-gray-600",
            };
            return (
              <div
                key={tab.key}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors cursor-pointer",
                  colors[tab.key],
                  activeTab === tab.key && "ring-2 ring-offset-1",
                  activeTab === tab.key && tab.key === "in_progress" && "ring-blue-400",
                  activeTab === tab.key && tab.key === "completed" && "ring-green-400",
                  activeTab === tab.key && tab.key === "archived" && "ring-gray-400"
                )}
                onClick={() => setActiveTab(tab.key)}
              >
                <Icon className="w-5 h-5" />
                <div>
                  <p className="text-xs font-medium opacity-80">{tab.label}</p>
                  <p className="text-xl font-bold">{count}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Course grid */}
        {activeCourses.length === 0 ? (
          <EmptyState tab={activeTab} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {activeCourses.map((course: ApiRecord) => {
              const variant =
                activeTab === "in_progress"
                  ? "progress"
                  : activeTab === "completed"
                  ? "completed"
                  : "archived";
              return <CourseCard key={course.id} course={course} variant={variant} />;
            })}
          </div>
        )}
      </div>
    </div>
  );
}
