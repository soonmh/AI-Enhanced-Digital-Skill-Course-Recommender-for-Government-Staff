"use client";

import { useAiInsights } from "@/hooks/useApi";
import { useTranslation } from "@/i18n/context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Lightbulb, AlertTriangle, CheckCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

export function AiInsightCard() {
  const { insights, isLoading } = useAiInsights();
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <Card className="border-0 shadow-lg mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            {t("dashboard.aiInsights")}
          </CardTitle>
          <CardDescription>{t("dashboard.aiInsightsLoading")}</CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!insights?.has_assessment || !insights?.recommendations) {
    return null;
  }

  const { recommendations, skill_gaps } = insights;

  return (
    <Card className="border-0 shadow-lg mb-8 bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          {t("dashboard.aiInsights")}
        </CardTitle>
        <CardDescription>{t("dashboard.aiInsightsDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="p-6 pt-0 space-y-4">
        {recommendations?.summary && (
          <p className="text-foreground leading-relaxed">{recommendations.summary}</p>
        )}

        {recommendations?.key_findings?.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{t("dashboard.keyFindings")}</h4>
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
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{t("dashboard.areasToFocus")}</h4>
            <div className="flex flex-wrap gap-2">
              {recommendations.focus_areas.map((area: { code: string; reason: string }, i: number) => (
                <div
                  key={i}
                  className="flex items-center gap-2 bg-card/70 rounded-lg px-3 py-2 text-sm border border-indigo-100"
                >
                  <span className="font-medium text-indigo-700">{area.code}</span>
                  <span className="text-muted-foreground">{area.reason}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {recommendations?.advice && (
          <div className="flex items-start gap-2 bg-card/60 rounded-lg p-3 border border-green-100">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
            <p className="text-sm text-foreground">{recommendations.advice}</p>
          </div>
        )}

        {recommendations?.next_steps?.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{t("dashboard.nextSteps")}</h4>
            <ol className="space-y-1.5">
              {recommendations.next_steps.map((step: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold shrink-0">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        )}

        {skill_gaps?.prediction && (
          <div className="pt-3 border-t border-indigo-100">
            <h4 className="text-sm font-semibold text-muted-foreground mb-1">{t("dashboard.skillTrendForecast")}</h4>
            <p className="text-sm text-muted-foreground">{skill_gaps.prediction}</p>
          </div>
        )}

        <div className="pt-2">
          <Link
            href="/assessment/results"
            className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            {t("dashboard.viewFullAnalysis")} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
