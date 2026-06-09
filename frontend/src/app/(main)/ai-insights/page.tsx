"use client";

import { useAiInsights, useLearningPath, usePeerComparison, useAssessmentReadiness, useActionPlan } from "@/hooks/useApi";
import { useTranslation } from "@/i18n/context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { COMPETENCIES } from "@/lib/constants";
import { getMaturityLevel } from "@/lib/maturity";
import {
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  GraduationCap,
  Users,
  Target,
  Clock,
  TrendingUp,
  ArrowRight,
  BookOpen,
  Calendar,
} from "lucide-react";
import Link from "next/link";

function SectionCard({
  icon: Icon,
  title,
  description,
  children,
  isLoading,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
  isLoading: boolean;
}) {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className="w-5 h-5 text-indigo-500" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

function PersonalInsightsSection() {
  const { insights, isLoading } = useAiInsights();
  const { t } = useTranslation();

  if (!isLoading && (!insights?.has_assessment || !insights?.recommendations)) {
    return (
      <SectionCard icon={Lightbulb} title={t("ai.personalInsightsTitle")} description={t("ai.personalInsightsDescription")} isLoading={false}>
        <p className="text-muted-foreground">{t("ai.completeAssessment")}</p>
        <Link href="/assessment" className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 font-medium mt-3">
          {t("ai.takeAssessment")} <ArrowRight className="w-4 h-4" />
        </Link>
      </SectionCard>
    );
  }

  const { recommendations, skill_gaps } = insights || {};

  return (
    <SectionCard icon={Lightbulb} title={t("ai.personalInsightsTitle")} description={t("ai.personalInsightsDescription")} isLoading={isLoading}>
      <div className="space-y-4">
        {recommendations?.summary && (
          <p className="text-foreground leading-relaxed">{recommendations.summary}</p>
        )}

        {recommendations?.key_findings?.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{t("ai.keyFindings")}</h4>
            <ul className="space-y-1.5">
              {recommendations.key_findings.slice(0, 3).map((finding: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  {finding}
                </li>
              ))}
            </ul>
          </div>
        )}

        {recommendations?.focus_areas?.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{t("ai.areasToFocus")}</h4>
            <div className="flex flex-wrap gap-2">
              {recommendations.focus_areas.map((area: { code: string; reason: string; priority_level?: string }, i: number) => (
                <div
                  key={i}
                  className="flex items-center gap-2 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-lg px-3 py-2 text-sm border border-indigo-100 dark:border-indigo-500/20"
                >
                  <span className="font-medium text-indigo-700 dark:text-indigo-300">{area.code}</span>
                  {area.priority_level && (
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      area.priority_level === 'high' ? 'bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-300' :
                      area.priority_level === 'medium' ? 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300' :
                      'bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-300'
                    }`}>
                      {area.priority_level}
                    </span>
                  )}
                  <span className="text-muted-foreground">{area.reason}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {recommendations?.advice && (
          <div className="flex items-start gap-2 bg-green-500/10 dark:bg-green-500/15 rounded-lg p-3 border border-green-100 dark:border-green-500/20">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
            <p className="text-sm text-foreground">{recommendations.advice}</p>
          </div>
        )}

        {recommendations?.next_steps?.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{t("ai.nextSteps")}</h4>
            <ol className="space-y-1.5">
              {recommendations.next_steps.map((step: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs font-bold shrink-0">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        )}

        {skill_gaps?.prediction && (
          <div className="pt-3 border-t border-border">
            <h4 className="text-sm font-semibold text-muted-foreground mb-1">{t("ai.skillTrendForecast")}</h4>
            <p className="text-sm text-muted-foreground">{skill_gaps.prediction}</p>
          </div>
        )}
      </div>
    </SectionCard>
  );
}

function LearningPathSection() {
  const { data, isLoading } = useLearningPath();
  const { t } = useTranslation();

  if (!isLoading && !data?.has_assessment) {
    return (
      <SectionCard icon={GraduationCap} title={t("ai.learningPathTitle")} description={t("ai.learningPathDescription")} isLoading={false}>
        <p className="text-muted-foreground">{t("ai.completeAssessmentLearningPath")}</p>
      </SectionCard>
    );
  }

  const path = data?.learning_path || [];

  return (
    <SectionCard icon={GraduationCap} title={t("ai.learningPathTitle")} description={t("ai.learningPathDescription")} isLoading={isLoading}>
      {path.length === 0 ? (
        <p className="text-muted-foreground">{t("ai.noLearningPath")}</p>
      ) : (
        <div className="space-y-4">
          <div className="relative border-l-2 border-indigo-200 dark:border-indigo-500/30 ml-3">
            {path.map((step: { step: number; course_title: string; reason: string; estimated_weeks: number; milestone: string }, i: number) => (
              <div key={i} className="relative pl-8 pb-6 last:pb-0">
                <div className="absolute -left-[17px] top-0 w-8 h-8 rounded-full bg-indigo-600 dark:bg-indigo-500/25 dark:text-indigo-300 text-white flex items-center justify-center text-sm font-bold">
                  {step.step}
                </div>
                <div className="bg-background rounded-lg p-4 border border-border">
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-500" />
                    {step.course_title}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">{step.reason}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {t("ai.weeks", { count: step.estimated_weeks })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      {step.milestone}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {data?.total_timeline_weeks > 0 && (
            <div className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 font-medium pt-2">
              <Clock className="w-4 h-4" />
              {t("ai.estimatedTotal", { weeks: data.total_timeline_weeks })}
            </div>
          )}
          {data?.expected_improvement && (
            <p className="text-sm text-muted-foreground bg-indigo-500/10 dark:bg-indigo-500/15 rounded-lg p-3 border border-indigo-100 dark:border-indigo-500/20">
              <TrendingUp className="w-4 h-4 inline mr-1 text-indigo-500" />
              {data.expected_improvement}
            </p>
          )}
        </div>
      )}
    </SectionCard>
  );
}

function PeerComparisonSection() {
  const { data, isLoading } = useLearningPath();
  const peerData = usePeerComparison();
  const { t } = useTranslation();

  if (!peerData.isLoading && !peerData.data?.has_assessment) {
    return (
      <SectionCard icon={Users} title={t("ai.peerComparisonTitle")} description={t("ai.peerComparisonDescription", { count: 0 })} isLoading={false}>
        <p className="text-muted-foreground">{t("ai.completeAssessmentPeer")}</p>
      </SectionCard>
    );
  }

  const comparison = peerData.data?.comparison;

  return (
    <SectionCard icon={Users} title={t("ai.peerComparisonTitle")} description={t("ai.peerComparisonDescription", { count: peerData.data?.peer_count || 0 })} isLoading={peerData.isLoading}>
      {comparison ? (
        <div className="space-y-4">
          {comparison.comparison_summary && (
            <p className="text-foreground leading-relaxed">{comparison.comparison_summary}</p>
          )}

          {comparison.percentile_rank > 0 && (
            <div className="flex items-center gap-3 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-lg p-3 border border-indigo-100 dark:border-indigo-500/20">
              <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">{comparison.percentile_rank}th</div>
              <div className="text-sm text-muted-foreground">{t("ai.percentileRank")}</div>
            </div>
          )}

          {comparison.above_average?.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide mb-2">{t("ai.aboveAverage")}</h4>
              <div className="space-y-2">
                {comparison.above_average.map((item: { competency: string; name: string; user_pct: number; dept_avg_pct: number }, i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs font-medium text-muted-foreground w-8">{item.competency}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-muted-foreground">{item.name}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-green-400 dark:bg-green-500/60 rounded-full" style={{ width: `${item.user_pct}%` }} />
                      </div>
                    </div>
                    <span className="text-xs font-medium text-green-700 dark:text-green-400 w-12 text-right">{item.user_pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {comparison.below_average?.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-2">{t("ai.belowAverage")}</h4>
              <div className="space-y-2">
                {comparison.below_average.map((item: { competency: string; name: string; user_pct: number; dept_avg_pct: number }, i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs font-medium text-muted-foreground w-8">{item.competency}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-muted-foreground">{item.name}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 dark:bg-amber-500/60 rounded-full" style={{ width: `${item.user_pct}%` }} />
                      </div>
                    </div>
                    <span className="text-xs font-medium text-amber-700 dark:text-amber-400 w-12 text-right">{item.user_pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {comparison.encouragement && (
            <p className="text-sm text-muted-foreground italic">{comparison.encouragement}</p>
          )}
        </div>
      ) : (
        <p className="text-muted-foreground">{t("ai.notEnoughPeerData")}</p>
      )}
    </SectionCard>
  );
}

function ActionPlanSection() {
  const { data, isLoading } = useActionPlan();
  const { t } = useTranslation();

  const phaseColors = [
    { bg: "bg-blue-500/10 border-blue-500/20", badge: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300", dot: "bg-blue-500" },
    { bg: "bg-indigo-500/10 border-indigo-500/20", badge: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300", dot: "bg-indigo-500" },
    { bg: "bg-purple-500/10 border-purple-500/20", badge: "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300", dot: "bg-purple-500" },
  ];

  if (!isLoading && !data?.has_assessment) {
    return (
      <SectionCard icon={Target} title={t("ai.actionPlanTitle")} description={t("ai.actionPlanDescription")} isLoading={false}>
        <p className="text-muted-foreground">{t("ai.actionPlanNoAssessment")}</p>
        <Link href="/assessment" className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 font-medium mt-3">
          {t("ai.takeAssessment")} <ArrowRight className="w-4 h-4" />
        </Link>
      </SectionCard>
    );
  }

  const plan = data?.action_plan || [];

  return (
    <SectionCard icon={Target} title={t("ai.actionPlanTitle")} description={t("ai.actionPlanDescription")} isLoading={isLoading}>
      {plan.length === 0 ? (
        <p className="text-muted-foreground">{t("ai.actionPlanNoData")}</p>
      ) : (
        <div className="space-y-4">
          {/* Phase cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plan.map((phase: { phase: string; phase_label: string; actions: string[]; milestone: string }, i: number) => {
              const color = phaseColors[i] || phaseColors[0];
              return (
                <div key={i} className={`rounded-xl border p-4 ${color.bg}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`w-8 h-8 rounded-full ${color.dot} text-white flex items-center justify-center text-sm font-bold`}>
                      {phase.phase}
                    </span>
                    <div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${color.badge}`}>
                        {t("ai.actionPlanDays", { phase: phase.phase })}
                      </span>
                      <h4 className="font-semibold text-foreground text-sm mt-0.5">{phase.phase_label}</h4>
                    </div>
                  </div>
                  <ul className="space-y-1.5 mb-3">
                    {phase.actions.map((action: string, j: number) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-foreground">
                        <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                        {action}
                      </li>
                    ))}
                  </ul>
                  <div className="text-xs text-muted-foreground border-t border-border pt-2 mt-2">
                    <span className="font-semibold">{t("ai.actionPlanMilestone")}:</span> {phase.milestone}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom bar */}
          <div className="flex flex-wrap items-center gap-4 p-3 bg-muted/50 rounded-lg text-sm">
            {data?.recommended_reassessment_date && (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                {t("ai.actionPlanReassessBy")}: <strong className="text-foreground">{new Date(data.recommended_reassessment_date).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</strong>
              </span>
            )}
            {data?.expected_dsri_improvement && (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <TrendingUp className="w-4 h-4 text-green-500" />
                {t("ai.actionPlanExpectedImprovement")}: <strong className="text-green-600 dark:text-green-400">{data.expected_dsri_improvement}</strong>
              </span>
            )}
          </div>
        </div>
      )}
    </SectionCard>
  );
}

function ReadinessSection() {
  const { data, isLoading } = useAssessmentReadiness();
  const { t } = useTranslation();

  if (!isLoading && !data?.has_previous) {
    return (
      <SectionCard icon={Target} title={t("ai.readinessTitle")} description={t("ai.readinessDescription")} isLoading={false}>
        <p className="text-muted-foreground">{t("ai.completeAssessmentReadiness")}</p>
        <Link href="/assessment" className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 font-medium mt-3">
          {t("ai.takeAssessment")} <ArrowRight className="w-4 h-4" />
        </Link>
      </SectionCard>
    );
  }

  const readiness = data?.readiness;
  const rec = readiness?.recommendation;

  return (
    <SectionCard icon={Target} title={t("ai.readinessTitle")} description={t("ai.readinessDescription")} isLoading={isLoading}>
      {readiness ? (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" className="dark:stroke-[#374151]" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="40" fill="none"
                  stroke="currentColor"
                  className={getMaturityLevel(readiness.readiness_score).textClass}
                  strokeWidth="8"
                  strokeDasharray={`${readiness.readiness_score * 2.51} 251`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-foreground">
                {readiness.readiness_score}%
              </span>
            </div>
            <div>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                rec === 'ready' ? 'bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-300' :
                rec === 'needs_preparation' ? 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300' :
                'bg-muted text-foreground'
              }`}>
                {rec === 'ready' ? t("ai.readinessReady") : rec === 'needs_preparation' ? t("ai.readinessPrepare") : t("ai.readinessWait")}
              </span>
            </div>
          </div>

          {readiness.likely_improvements?.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t("ai.likelyImprovements")}</h4>
              <div className="space-y-1">
                {readiness.likely_improvements.map((item: { competency: string; name: string; estimated_gain: string }, i: number) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{item.competency} — {item.name}</span>
                    <span className="text-green-600 dark:text-green-400 font-medium">{item.estimated_gain}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {readiness.review_first?.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t("ai.reviewBeforeRetaking")}</h4>
              <div className="flex flex-wrap gap-2">
                {readiness.review_first.map((code: string) => {
                  const comp = Object.values(COMPETENCIES).find((c) => c.code === code);
                  return (
                    <span key={code} className="px-2 py-1 bg-amber-500/10 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 rounded text-xs font-medium border border-amber-100 dark:border-amber-500/20">
                      {code} {comp?.nameEn || ''}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          <Link
            href="/assessment/start"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 dark:hover:bg-indigo-500/30 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {t("ai.takeAssessment")} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <p className="text-muted-foreground">{t("ai.readinessNotAvailable")}</p>
      )}
    </SectionCard>
  );
}

export default function AiInsightsPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Lightbulb className="w-6 h-6 text-indigo-500" />
            {t("ai.pageTitle")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("ai.pageDescription")}</p>
        </div>

        <div className="space-y-8">
          <PersonalInsightsSection />
          <ActionPlanSection />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <LearningPathSection />
            <PeerComparisonSection />
          </div>
          <ReadinessSection />
        </div>
      </div>
    </div>
  );
}
