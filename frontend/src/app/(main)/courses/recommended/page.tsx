"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useTranslation } from "@/i18n/context";
import { useRecommendedCourses } from "@/hooks/useApi";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { COMPETENCIES } from "@/lib/constants";
import {
  BookOpen,
  Star,
  Sparkles,
  Target,
  Users,
  AlertTriangle,
  TrendingUp,
  BarChart3,
} from "lucide-react";

const SORT_OPTIONS = [
  { value: "match", labelKey: "courses.sortBestMatch" },
  { value: "rating", labelKey: "courses.sortHighestRated" },
  { value: "popular", labelKey: "courses.sortMostEnrolled" },
] as const;

const GRADIENTS = [
  "from-violet-500 via-purple-500 to-indigo-600 dark:from-violet-700 dark:via-purple-700 dark:to-indigo-800",
  "from-emerald-500 via-teal-500 to-cyan-600 dark:from-emerald-700 dark:via-teal-700 dark:to-cyan-800",
  "from-rose-500 via-pink-500 to-fuchsia-600 dark:from-rose-700 dark:via-pink-700 dark:to-fuchsia-800",
  "from-amber-500 via-orange-500 to-red-500 dark:from-amber-700 dark:via-orange-700 dark:to-red-700",
  "from-sky-500 via-blue-500 to-indigo-600 dark:from-sky-700 dark:via-blue-700 dark:to-indigo-800",
  "from-lime-500 via-green-500 to-emerald-600 dark:from-lime-700 dark:via-green-700 dark:to-emerald-800",
];

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function RecommendedCoursesPage() {
  const { t } = useTranslation();
  const { courses, hasAssessment, weakSections, isLoading } = useRecommendedCourses();
  const [sortBy, setSortBy] = useState("match");
  const [competencyFilter, setCompetencyFilter] = useState("");

  const sorted = useMemo(() => {
    if (!courses) return [];
    let filtered = courses as any[];
    if (competencyFilter) {
      filtered = filtered.filter((c: any) =>
        c.competency_codes?.includes(competencyFilter)
      );
    }
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return (b.avg_rating || 0) - (a.avg_rating || 0);
        case "popular":
          return (b.enrollment_count || 0) - (a.enrollment_count || 0);
        default:
          return (b.match_percentage || 0) - (a.match_percentage || 0);
      }
    });
  }, [courses, sortBy, competencyFilter]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="px-6 py-8 w-full max-w-7xl mx-auto">
          <div className="mb-8">
            <Skeleton className="h-10 w-72 mb-2" />
            <Skeleton className="h-6 w-96" />
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-72 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="px-6 py-8 w-full max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-foreground">{t("courses.recommendedTitle")}</h1>
            </div>
            <p className="text-muted-foreground text-lg">
              {hasAssessment
                ? t("courses.recommendedDescriptionWithAssessment")
                : t("courses.recommendedDescriptionNoAssessment")}
            </p>
          </div>
        </div>

        {/* Skill Gaps Banner */}
        {hasAssessment && weakSections.length > 0 && (
          <Card className="border-0 shadow-md mb-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1.5">{t("courses.skillAreasToImprove")}</h3>
                  <div className="flex flex-wrap gap-2">
                    {weakSections.map((code: string) => {
                      const comp = COMPETENCIES[code as keyof typeof COMPETENCIES];
                      return comp ? (
                        <span
                          key={code}
                          className="px-3 py-1 bg-card rounded-full text-sm font-medium text-amber-700 shadow-sm border border-amber-200"
                        >
                          {code}: {comp.nameEn}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Assessment Banner */}
        {!hasAssessment && (
          <Card className="border-0 shadow-md mb-6 bg-gradient-to-r from-blue-500/10 to-indigo-500/10">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{t("courses.getPersonalizedRecommendations")}</h3>
                    <p className="text-sm text-muted-foreground">{t("courses.getPersonalizedDescription")}</p>
                  </div>
                </div>
                <Link
                  href="/assessment"
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                >
                  <Target className="w-4 h-4" />
                  {t("courses.takeAssessment")}
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Toolbar */}
        {sorted.length > 0 && (
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span>{t("courses.courseRecommended", { count: sorted.length })}</span>
            </div>
            <div className="flex items-center gap-3">
              {weakSections.length > 0 && (
                <select
                  value={competencyFilter}
                  onChange={(e) => setCompetencyFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-border bg-card text-sm text-muted-foreground"
                >
                  <option value="">{t("courses.allCompetencies")}</option>
                  {weakSections.map((code: string) => {
                    const comp = COMPETENCIES[code as keyof typeof COMPETENCIES];
                    return (
                      <option key={code} value={code}>
                        {code}: {comp?.nameEn || code}
                      </option>
                    );
                  })}
                </select>
              )}
              <div className="flex items-center gap-1.5 bg-card rounded-lg border border-border p-0.5">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSortBy(opt.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    sortBy === opt.value
                      ? "bg-emerald-500/10 text-emerald-700 shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {opt.value === "match" && <Target className="w-3 h-3" />}
                  {opt.value === "rating" && <Star className="w-3 h-3" />}
                  {opt.value === "popular" && <Users className="w-3 h-3" />}
                  {t(opt.labelKey)}
                </button>
              ))}
            </div>
            </div>
          </div>
        )}

        {/* Course Grid */}
        {(!sorted || sorted.length === 0) ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">{t("courses.noRecommendationsTitle")}</h3>
            <p className="text-muted-foreground mb-6">{t("courses.noRecommendationsDescription")}</p>
            <Link
              href="/assessment"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors font-medium"
            >
              <Target className="w-4 h-4" />
              {t("courses.takeAssessment")}
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sorted.map((course: any, idx: number) => {
              const gradient = GRADIENTS[idx % GRADIENTS.length];
              const matchPct = course.match_percentage;
              return (
                <Card key={course.id} className="p-0 overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 group h-full flex flex-col">
                  <Link href={`/courses/${course.id}?from=recommended`}>
                    <div className={`h-44 bg-gradient-to-br ${gradient} relative overflow-hidden`}>
                      <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <BookOpen className="w-14 h-14 text-white/20" />
                      </div>
                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex items-center gap-2">
                        <span className="flex items-center gap-1 px-2.5 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs text-white font-medium">
                          <Sparkles className="w-3 h-3" />
                          {t("courses.recommendedBadge")}
                        </span>
                      </div>
                      <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
                        {course.level && (
                          <span className="px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-xs text-white font-medium">
                            {t(`common.level${course.level.charAt(0).toUpperCase() + course.level.slice(1)}`)}
                          </span>
                        )}
                      </div>
                      {/* Bottom bar */}
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Star className="w-3.5 h-3.5 text-yellow-300 fill-current" />
                          <span className="text-xs text-white/90 font-medium">{course.avg_rating ?? "—"}</span>
                          {course.ratings_count > 0 && (
                            <span className="text-xs text-white/60">({course.ratings_count})</span>
                          )}
                        </div>
                        {course.enrollment_count > 0 && (
                          <span className="flex items-center gap-1 text-xs text-white/70">
                            <Users className="w-3 h-3" />
                            {course.enrollment_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                  <CardContent className="p-5 flex-1 flex flex-col">
                    <Link href={`/courses/${course.id}?from=recommended`}>
                      <h3 className="font-semibold text-foreground mb-1.5 line-clamp-2 hover:text-emerald-600 transition-colors group-hover:text-emerald-600">
                        {course.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{course.description}</p>
                    </Link>
                    {course.ai_explanation && (
                      <p className="text-xs text-indigo-600 italic line-clamp-2 mb-3 bg-indigo-50/50 px-2 py-1 rounded">
                        {course.ai_explanation}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-border">
                      {matchPct != null && hasAssessment ? (
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            matchPct >= 70 ? "bg-green-100" : matchPct >= 40 ? "bg-amber-100" : "bg-muted"
                          }`}>
                            <TrendingUp className={`w-4 h-4 ${
                              matchPct >= 70 ? "text-green-600 dark:text-green-400" : matchPct >= 40 ? "text-amber-600 dark:text-amber-400" : "text-gray-400"
                            }`} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{t("courses.percentMatch", { pct: matchPct })}</p>
                            <p className="text-xs text-muted-foreground">{t("courses.toYourSkillGaps")}</p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {course.working_field || t("courses.general")}
                        </span>
                      )}
                      <span className="text-sm text-emerald-600 font-medium group-hover:translate-x-0.5 transition-transform">
                        {t("courses.viewCourse")}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */
