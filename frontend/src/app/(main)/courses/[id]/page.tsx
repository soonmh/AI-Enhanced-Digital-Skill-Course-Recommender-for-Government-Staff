"use client";

import { useState, useRef, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { useTranslation } from "@/i18n/context";
import { useCourse, enrollCourse, rateCourse, updateCourseProgress } from "@/hooks/useApi";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PermissionGate } from "@/components/shared/PermissionGate";
import { UserAvatar } from "@/components/ui/user-avatar";
import {
  BookOpen,
  Briefcase,
  Users,
  ArrowLeft,
  Play,
  Pencil,
  Star,
  ExternalLink,
  Calendar,
  User,
  BarChart3,
  CheckCircle2,
  Loader2,
  Archive,
  Target,
} from "lucide-react";

function StarRating({ value, onChange, readonly, size = "md" }: {
  value: number;
  onChange?: (r: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const [hover, setHover] = useState(0);
  const sz = size === "sm" ? "w-3.5 h-3.5" : size === "lg" ? "w-6 h-6" : "w-5 h-5";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={`${readonly ? "cursor-default" : "cursor-pointer"} transition-transform ${!readonly && "hover:scale-110"}`}
        >
          <Star
            className={`${sz} transition-colors ${(hover || value) >= star ? "text-yellow-400 fill-current" : "text-gray-200"}`}
          />
        </button>
      ))}
    </div>
  );
}

function RatingBar({ stars, count, total }: { stars: number; count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-3 text-right text-muted-foreground">{stars}</span>
      <Star className="w-3 h-3 text-yellow-400 fill-current" />
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-6 text-right text-muted-foreground text-xs">{count}</span>
    </div>
  );
}

export default function CourseDetailPage() {
  const { t } = useTranslation();
  const params = useParams();
  const searchParams = useSearchParams();
  const { course, isLoading, mutate } = useCourse(params.id as string);
  const [submitting, setSubmitting] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [sliderValue, setSliderValue] = useState<number | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const from = searchParams.get("from");

  const backConfig: Record<string, { href: string; label: string }> = {
    "my-learning": { href: "/courses/my-learning", label: t("courses.backToLearning") },
    recommended: { href: "/courses/recommended", label: t("courses.backToRecommended") },
    list: { href: "/courses/list", label: t("courses.backToManage") },
  };
  const back = backConfig[from ?? ""] ?? { href: "/courses/my-learning", label: t("courses.backToCourses") };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-card shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <Skeleton className="h-4 w-28 mb-6" />
            <Skeleton className="h-56 w-full rounded-xl mb-8" />
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <Skeleton className="h-48 w-full rounded-xl" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-40 w-full rounded-xl" />
                <Skeleton className="h-32 w-full rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">{t("courses.detailCourseNotFound")}</h3>
          <Link href={back.href} className="text-violet-600 font-medium hover:underline">{t("courses.backToCourses")} {back.label}</Link>
        </div>
      </div>
    );
  }

  const enrolled = course.enrolled || false;
  const progress = course.progress ?? 0;
  const isCompleted = progress >= 100;
  const isArchived = course.enrollment_status === "removed";
  const dist = course.rating_distribution || {};
  const totalRatings = (Object.values(dist) as number[]).reduce((a, b) => a + b, 0);
  const reviews = course.recent_reviews || [];

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      await enrollCourse(params.id as string);
      toast.success(t("courses.enrolledSuccessfully"));
      mutate({ ...course, enrolled: true, progress: 0, enrollment_count: (course.enrollment_count || 0) + 1 }, false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : t("courses.failedToEnroll");
      toast.error(msg);
    } finally {
      setEnrolling(false);
    }
  };

  const handleRate = async (rating: number) => {
    setSubmitting(true);
    try {
      const res = await rateCourse(params.id as string, rating);
      toast.success(t("courses.ratingSubmitted"));
      mutate({ ...course, user_rating: rating, avg_rating: res.avg_rating, ratings_count: res.ratings_count }, false);
    } catch {
      toast.error(t("courses.failedToSubmitRating"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Banner */}
      <div className="relative h-64 overflow-hidden">
        {course.image ? (
          <img src={course.image} alt={course.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-700 flex items-center justify-center">
            <BookOpen className="w-24 h-24 text-white/10" />
          </div>
        )}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_60%)]" />
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/20 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-16 relative z-10 pb-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Link href={back.href} className="hover:text-violet-600 transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            {back.label}
          </Link>
          <span>/</span>
          <span className="text-muted-foreground truncate max-w-xs">{course.title}</span>
        </div>

        {/* Archived Banner */}
        {isArchived && (
          <div className="flex items-center gap-3 px-5 py-3 bg-muted border border-border rounded-xl mb-6">
            <Archive className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-semibold text-foreground">{t("courses.archivedBannerTitle")}</p>
              <p className="text-xs text-muted-foreground">{t("courses.archivedBannerDescription")}</p>
            </div>
          </div>
        )}
        <Card className="p-0 border-0 shadow-lg mb-6">
          <CardContent className="p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl flex items-center justify-center shrink-0 shadow-md">
                    <BookOpen className="w-7 h-7 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-1">{course.title}</h1>
                    {course.title_bm && <p className="text-base text-muted-foreground mb-3">{course.title_bm}</p>}
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      {course.level && (
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          course.level === "advanced" ? "bg-red-500/10 dark:bg-red-400/15 text-red-600 dark:text-red-400" :
                          course.level === "intermediate" ? "bg-amber-500/10 dark:bg-amber-400/15 text-amber-600 dark:text-amber-400" :
                          "bg-green-500/10 dark:bg-green-400/15 text-green-600 dark:text-green-400"
                        }`}>
                          {t(`common.level${course.level.charAt(0).toUpperCase() + course.level.slice(1)}`)}
                        </span>
                      )}
                      {course.working_field && (
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Briefcase className="w-3.5 h-3.5" />
                          {course.working_field}
                        </span>
                      )}
                      {course.avg_rating && (
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Star className="w-3.5 h-3.5 text-yellow-400 fill-current" />
                          <span className="font-medium">{course.avg_rating}</span>
                          <span className="text-muted-foreground">({course.ratings_count})</span>
                        </span>
                      )}
                      {course.enrollment_count > 0 && (
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Users className="w-3.5 h-3.5" />
                          {course.enrollment_count} {t("common.enrolled").toLowerCase()}
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground leading-relaxed">{course.description}</p>
                    {course.description_bm && (
                      <p className="text-muted-foreground text-sm mt-2 leading-relaxed">{course.description_bm}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 shrink-0">
                <PermissionGate permission="course-management">
                  <Link
                    href={`/courses/${params.id}/edit`}
                    className="flex items-center gap-2 px-4 py-2.5 border border-border text-foreground rounded-xl hover:bg-accent transition-colors font-medium text-sm"
                  >
                    <Pencil className="w-4 h-4" />
                    {t("courses.editButton")}
                  </Link>
                </PermissionGate>
                {isArchived ? (
                  <div className="flex items-center gap-2 px-5 py-2.5 bg-muted text-muted-foreground rounded-xl border border-border">
                    <Archive className="w-5 h-5" />
                    <span className="font-semibold">{t("courses.archivedBannerTitle")}</span>
                  </div>
                ) : enrolled ? (
                  <div className="flex items-center gap-2 px-5 py-2.5 bg-green-500/10 text-green-700 rounded-xl border border-green-200">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-semibold">{t("common.enrolled")}</span>
                  </div>
                ) : (
                  <button
                    onClick={handleEnroll}
                    disabled={enrolling}
                    className="flex items-center gap-2 px-6 py-2.5 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors font-semibold text-sm shadow-sm disabled:opacity-60"
                  >
                    {enrolling ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    {enrolling ? t("common.enrolling") : t("courses.enrollNow")}
                  </button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress Bar (if enrolled and not archived) */}
        {enrolled && !isArchived && (
          <Card className="p-0 border-0 shadow-md mb-6">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <BarChart3 className="w-5 h-5 text-violet-500 dark:text-violet-400" />
                  )}
                  <span className="font-semibold text-foreground">
                    {isCompleted ? t("courses.completedLabel") : t("courses.yourProgress")}
                  </span>
                </div>
                <span className={`text-lg font-bold ${isCompleted ? "text-green-600 dark:text-green-400" : "text-violet-600 dark:text-violet-400"}`}>
                  {Math.round(progress)}%
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isCompleted ? "bg-green-500 dark:bg-green-400" : "bg-gradient-to-r from-violet-500 to-indigo-500 dark:from-violet-400/50 dark:to-indigo-400/50"
                  }`}
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
              {/* Progress Slider */}
              <div className="mt-4 flex items-center gap-3">
                <span className="text-xs text-muted-foreground shrink-0">0%</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={sliderValue ?? Math.round(progress)}
                  disabled={submitting}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setSliderValue(val);
                    if (debounceRef.current) clearTimeout(debounceRef.current);
                    debounceRef.current = setTimeout(async () => {
                      try {
                        await updateCourseProgress(params.id as string, val);
                        const wasNotCompleted = (course?.progress ?? 0) < 100;
                        mutate({ ...course, progress: val }, false);
                        setSliderValue(null);
                        if (val >= 100 && wasNotCompleted) {
                          toast.success(t("courses.completedLabel"));
                        }
                      } catch {
                        setSliderValue(null);
                        toast.error(t("courses.failedToSubmitRating"));
                      }
                    }, 500);
                  }}
                  className="flex-1 h-2 accent-violet-600 cursor-pointer disabled:opacity-50"
                />
                <span className="text-xs text-muted-foreground shrink-0">100%</span>
              </div>
              {course.url && (
                <div className="mt-3 flex justify-end">
                  <Link
                    href={course.url}
                    target="_blank"
                    className="flex items-center gap-1.5 text-sm text-violet-600 dark:text-violet-400 font-medium hover:text-violet-700 transition-colors"
                  >
                    {t("courses.continueLearning")} <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Course Details */}
            <Card className="p-0 border-0 shadow-md">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                  {t("courses.aboutThisCourse")}
                </h2>
                {course.remark && (
                  <div className="p-4 bg-violet-500/10 dark:bg-violet-400/15 rounded-xl mb-4 border border-violet-100 dark:border-violet-400/20">
                    <p className="text-sm text-violet-800 leading-relaxed">{course.remark}</p>
                  </div>
                )}
                {!course.remark && course.description && (
                  <p className="text-muted-foreground leading-relaxed">{course.description}</p>
                )}
              </CardContent>
            </Card>

            {/* Course Link */}
            {course.url && (
              <Card className="p-0 border-0 shadow-md">
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <ExternalLink className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                    {t("courses.courseLink")}
                  </h2>
                  <Link
                    href={course.url}
                    target="_blank"
                    className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-500/20 dark:to-indigo-500/20 dark:text-violet-300 text-white rounded-xl hover:from-violet-700 hover:to-indigo-700 dark:hover:from-violet-500/30 dark:hover:to-indigo-500/30 transition-all font-medium text-sm shadow-sm"
                  >
                    <Play className="w-4 h-4" />
                    {t("courses.openCourse")}
                    <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Ratings & Reviews */}
            <Card className="p-0 border-0 shadow-md">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold text-foreground mb-5 flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  {t("courses.ratingsAndReviews")}
                </h2>

                <div className="flex flex-col sm:flex-row gap-6 mb-6">
                  {/* Average Score */}
                  <div className="flex flex-col items-center justify-center px-6 py-4 bg-background rounded-xl min-w-[140px]">
                    <span className="text-4xl font-bold text-foreground">{course.avg_rating ?? "—"}</span>
                    <StarRating value={Math.round(course.avg_rating || 0)} readonly size="sm" />
                    <p className="text-sm text-muted-foreground mt-1">{t("courses.ratingsCount", { count: totalRatings })}</p>
                  </div>

                  {/* Distribution Bars */}
                  <div className="flex-1 space-y-1.5">
                    {[5, 4, 3, 2, 1].map((s) => (
                      <RatingBar key={s} stars={s} count={dist[s] || 0} total={totalRatings} />
                    ))}
                  </div>
                </div>

                {/* Submit Rating */}
                {enrolled && (
                  <div className="p-4 bg-violet-500/10 dark:bg-violet-400/15 rounded-xl border border-violet-100 dark:border-violet-400/20 mb-6">
                    <p className="text-sm font-medium text-foreground mb-2">
                      {course.user_rating ? t("courses.updateYourRating") : t("courses.rateThisCourse")}
                    </p>
                    <StarRating
                      value={course.user_rating || 0}
                      onChange={submitting ? undefined : handleRate}
                      size="lg"
                    />
                  </div>
                )}

                {/* Recent Reviews */}
                {reviews.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{t("courses.recentReviews")}</h3>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {reviews.map((review: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-background rounded-xl">
                        <UserAvatar name={review.user_name} size={36} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-foreground">{review.user_name}</p>
                            {review.created_at && (
                              <span className="text-xs text-muted-foreground">
                                {new Date(review.created_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          <StarRating value={review.rating} readonly size="sm" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Course Info */}
            <Card className="p-0 border-0 shadow-md">
              <CardContent className="p-5">
                <h3 className="font-semibold mb-4 text-xs uppercase tracking-wider text-muted-foreground">{t("courses.courseInformation")}</h3>
                <div className="space-y-4">
                  {course.level && (
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-violet-100 dark:bg-violet-400/15 rounded-xl flex items-center justify-center">
                        <BarChart3 className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{t("courses.infoLevel")}</p>
                        <p className="text-sm font-medium text-foreground capitalize">{course.level}</p>
                      </div>
                    </div>
                  )}
                  {course.working_field && (
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-blue-100 dark:bg-blue-400/15 rounded-xl flex items-center justify-center">
                        <Briefcase className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{t("courses.infoField")}</p>
                        <p className="text-sm font-medium text-foreground">{course.working_field}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-green-100 dark:bg-green-400/15 rounded-xl flex items-center justify-center">
                      <Users className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t("courses.infoEnrolled")}</p>
                      <p className="text-sm font-medium text-foreground">{t("courses.infoUsers", { count: course.enrollment_count || 0 })}</p>
                    </div>
                  </div>
                  {course.created_by && (
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-amber-100 dark:bg-amber-400/15 rounded-xl flex items-center justify-center">
                        <User className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{t("courses.infoCreatedBy")}</p>
                        <p className="text-sm font-medium text-foreground">{course.created_by}</p>
                      </div>
                    </div>
                  )}
                  {course.created_at && (
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-rose-100 dark:bg-rose-400/15 rounded-xl flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{t("courses.infoCreated")}</p>
                        <p className="text-sm font-medium text-foreground">{new Date(course.created_at).toLocaleDateString("en-MY", { year: "numeric", month: "long", day: "numeric" })}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Competency Mapping */}
            {course.competency_breakdown && course.competency_breakdown.length > 0 && (
              <Card className="p-0 border-0 shadow-md">
                <CardContent className="p-5">
                  <h3 className="font-semibold mb-4 text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    {t("courses.competencyMapping") || "Competency Mapping"}
                  </h3>
                  <div className="space-y-3">
                    {course.competency_breakdown.map((comp: { code: string; name_en: string; name_ms?: string; user_pct: number; max_score: number; user_score: number }, idx: number) => (
                      <div key={idx}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-violet-600 dark:text-violet-400 bg-violet-500/10 dark:bg-violet-400/15 px-2 py-0.5 rounded-md">{comp.code}</span>
                            <span className="text-xs text-foreground font-medium">{comp.name_en}</span>
                          </div>
                          <span className={`text-xs font-semibold ${comp.user_pct >= 70 ? "text-green-600 dark:text-green-400" : comp.user_pct >= 40 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"}`}>
                            {comp.user_pct}%
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              comp.user_pct >= 70 ? "bg-green-500" : comp.user_pct >= 40 ? "bg-amber-500" : "bg-red-500"
                            }`}
                            style={{ width: `${Math.min(comp.user_pct, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  {!course.enrolled && (
                    <p className="text-xs text-muted-foreground mt-3 italic">
                      {t("courses.enrollToSeeFullDetails") || "Enroll to start improving these competencies"}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}


            {/* Peer Enrollments */}
            {course.peer_enrollments && course.peer_enrollments.length > 0 && (
              <Card className="p-0 border-0 shadow-md">
                <CardContent className="p-5">
                  <h3 className="font-semibold mb-3 text-xs uppercase tracking-wider text-muted-foreground">{t("courses.alsoEnrolled")}</h3>
                  <div className="space-y-2.5">
                    {course.peer_enrollments.map((peer: { name: string; field?: string; progress: number }, idx: number) => (
                      <div key={idx} className="flex items-center gap-3 p-2 bg-background rounded-lg">
                        <UserAvatar name={peer.name} size={30} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{peer.name}</p>
                          <p className="text-xs text-muted-foreground">{peer.field || "Staff"}</p>
                        </div>
                        <span className={`text-xs font-semibold ${peer.progress >= 100 ? "text-green-600 dark:text-green-400" : "text-violet-600 dark:text-violet-400"}`}>
                          {Math.round(peer.progress)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            {/* Quick Enroll CTA */}
            {!enrolled && !isArchived && (
              <Card className="p-0 border-0 shadow-md bg-gradient-to-br from-violet-600 to-indigo-600">
                <CardContent className="p-5">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Play className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-white mb-1">{t("courses.readyToStart")}</h3>
                    <p className="text-sm text-white/70 mb-4">{t("courses.readyToStartDescription")}</p>
                    <button
                      onClick={handleEnroll}
                      disabled={enrolling}
                      className="w-full py-3 bg-white text-violet-700 rounded-xl font-semibold hover:bg-accent transition-colors disabled:opacity-60"
                    >
                      {enrolling ? t("common.enrolling") : t("courses.enrollNowFree")}
                    </button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Course Link Sidebar */}
            {course.url && (
              <Card className="p-0 border-0 shadow-md">
                <CardContent className="p-5">
                  <Link
                    href={course.url}
                    target="_blank"
                    className="flex items-center gap-3 p-3 bg-background rounded-xl hover:bg-violet-500/10 dark:hover:bg-violet-400/15 transition-colors group"
                  >
                    <div className="w-9 h-9 bg-violet-100 dark:bg-violet-400/15 rounded-xl flex items-center justify-center group-hover:bg-violet-200 transition-colors">
                      <ExternalLink className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground group-hover:text-violet-600 dark:text-violet-400">{t("courses.externalCourseLink")}</p>
                      <p className="text-xs text-muted-foreground truncate">{course.url}</p>
                    </div>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
