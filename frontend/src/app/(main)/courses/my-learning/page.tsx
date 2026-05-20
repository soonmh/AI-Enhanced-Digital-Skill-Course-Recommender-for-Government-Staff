"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/i18n/context";
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

const tabs: { key: TabKey; labelKey: string; icon: typeof Play }[] = [
  { key: "in_progress", labelKey: "courses.tabInProgress", icon: Play },
  { key: "completed", labelKey: "courses.tabCompleted", icon: CheckCircle },
  { key: "archived", labelKey: "courses.tabArchived", icon: Archive },
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

function CourseCard({ course, variant, t }: { course: ApiRecord; variant: "progress" | "completed" | "archived"; t: (key: string, params?: Record<string, string | number>) => string }) {
  const progress = course.progress ?? 0;

  const styles = {
    progress: {
      border: "border-l-blue-500 dark:border-l-blue-400",
      badge: "bg-blue-500/10 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300",
      bar: "bg-blue-500 dark:bg-blue-400",
      icon: <Play className="w-4 h-4 text-blue-500 dark:text-blue-400" />,
    },
    completed: {
      border: "border-l-green-500 dark:border-l-green-400",
      badge: "bg-green-500/10 text-green-700 dark:bg-green-400/15 dark:text-green-300",
      bar: "bg-green-500 dark:bg-green-400",
      icon: <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400" />,
    },
    archived: {
      border: "border-l-gray-400 dark:border-l-gray-500",
      badge: "bg-muted text-muted-foreground",
      bar: "bg-gray-400 dark:bg-gray-500",
      icon: <Archive className="w-4 h-4 text-gray-400 dark:text-gray-500" />,
    },
  };

  const s = styles[variant];

  return (
    <Link href={`/courses/${course.id}?from=my-learning`}>
      <div
        className={cn(
          "bg-card rounded-xl border border-border border-l-4 shadow-sm hover:shadow-md transition-all duration-200 h-full",
          s.border,
          variant === "archived" && "opacity-70"
        )}
      >
        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <h3 className="font-semibold text-foreground line-clamp-2 text-sm leading-snug">
              {course.title}
            </h3>
            {s.icon}
          </div>

          {/* Level badge */}
          <div className="flex items-center gap-2 mb-4">
            {course.level && (
              <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", s.badge)}>
                {t(`common.level${course.level.charAt(0).toUpperCase() + course.level.slice(1)}`)}
              </span>
            )}
            {variant === "completed" && (
              <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                <Sparkles className="w-3 h-3" />
                {t("courses.completedBadge")}
              </span>
            )}
            {variant === "archived" && (
              <span className="text-xs text-muted-foreground">{t("courses.removedByAdmin")}</span>
            )}
          </div>

          {/* Progress bar */}
          {variant !== "archived" && (
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">{t("courses.progressLabel")}</span>
                <span className="font-semibold text-foreground">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className={cn("h-2 rounded-full transition-all duration-300", s.bar)}
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Archived info */}
          {variant === "archived" && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span>{t("courses.unassignedByAdmin")}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

function EmptyState({ tab, t }: { tab: TabKey; t: (key: string, params?: Record<string, string | number>) => string }) {
  const config: Record<TabKey, { icon: React.ElementType; titleKey: string; descKey: string; action?: { labelKey: string; href: string } }> = {
    in_progress: {
      icon: BookOpen,
      titleKey: "courses.emptyInProgressTitle",
      descKey: "courses.emptyInProgressDesc",
      action: { labelKey: "courses.emptyInProgressAction", href: "/courses/recommended" },
    },
    completed: {
      icon: CheckCircle,
      titleKey: "courses.emptyCompletedTitle",
      descKey: "courses.emptyCompletedDesc",
    },
    archived: {
      icon: Archive,
      titleKey: "courses.emptyArchivedTitle",
      descKey: "courses.emptyArchivedDesc",
    },
  };

  const c = config[tab];
  const Icon = c.icon;

  return (
    <div className="text-center py-16">
      <div className="mx-auto w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-gray-300" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">{t(c.titleKey)}</h3>
      <p className="text-muted-foreground mb-5 text-sm">{t(c.descKey)}</p>
      {c.action && (
        <Link
          href={c.action.href}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          {t(c.action!.labelKey)}
        </Link>
      )}
    </div>
  );
}

export default function MyLearningPage() {
  const { t } = useTranslation();
  const { courses, isLoading } = useCourses();
  const [activeTab, setActiveTab] = useState<TabKey>("in_progress");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-card shadow-sm border-b">
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold text-foreground">{t("courses.myLearningTitle")}</h1>
          <p className="text-muted-foreground mt-1">{t("courses.myLearningDescription")}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {tabs.map((tab) => {
            const count = grouped[tab.key].length;
            const Icon = tab.icon;
            const colors = {
              in_progress: "bg-blue-500/10 border-blue-500/20 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300",
              completed: "bg-green-500/10 border-green-500/20 text-green-700 dark:bg-green-400/15 dark:text-green-300",
              archived: "bg-muted border-border text-muted-foreground",
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
                  <p className="text-xs font-medium opacity-80">{t(tab.labelKey)}</p>
                  <p className="text-xl font-bold">{count}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Course grid */}
        {activeCourses.length === 0 ? (
          <EmptyState tab={activeTab} t={t} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {activeCourses.map((course: ApiRecord) => {
              const variant =
                activeTab === "in_progress"
                  ? "progress"
                  : activeTab === "completed"
                  ? "completed"
                  : "archived";
              return <CourseCard key={course.id} course={course} variant={variant} t={t} />;
            })}
          </div>
        )}
      </div>
    </div>
  );
}
