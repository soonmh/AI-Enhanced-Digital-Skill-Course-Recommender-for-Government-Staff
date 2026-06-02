"use client";

import Link from "next/link";
import { useAssessmentResults } from "@/hooks/useApi";
import { Card, CardContent } from "@/components/ui/card";
import { COMPETENCIES } from "@/lib/constants";
import { getMaturityLevel } from "@/lib/maturity";
import { useTranslation } from "@/i18n/context";
import {
  Play,
  Clock,
  Target,
  Shield,
  Star,
  ArrowRight,
  BarChart3,
  Brain,
  BookOpen,
  Users,
  Lightbulb,
  RefreshCw,
  CircleHelp,
  Award,
  Zap,
  Sparkles,
  TrendingUp,
} from "lucide-react";

const COMPETENCY_ICONS = [BookOpen, Monitor2, Users, Lightbulb, Shield, TrendingUp, BarChart3, Sparkles, Brain, Target];

function Monitor2({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="14" x="2" y="3" rx="2" /><line x1="8" x2="16" y1="21" y2="21" /><line x1="12" x2="12" y1="17" y2="21" />
    </svg>
  );
}

function formatScore(dsri: number) {
  const m = getMaturityLevel(dsri);
  return { label: m.labelEn, color: m.textClass, bg: m.bgClass, ring: m.ringClass };
}

export default function AssessmentLandingPage() {
  const { t } = useTranslation();
  const { data: results } = useAssessmentResults();
  const hasResults = results?.latest;
  const latestDsri = results?.latest?.dsri;
  const historyCount = results?.history?.length || 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 dark:from-violet-900 dark:via-indigo-950 dark:to-gray-900" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(255,255,255,0.08),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.05),transparent_50%)]" />

        <div className="relative max-w-7xl mx-auto px-6 py-16 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-card/10 backdrop-blur-sm rounded-full px-4 py-2 text-sm text-white/90 font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                {t("assessment.landingTitle")}
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
                {t("assessment.landingHeroTitle1")}{" "}
                <span className="bg-gradient-to-r from-yellow-300 via-amber-300 to-orange-300 bg-clip-text text-transparent">
                  {t("assessment.landingHeroTitle2")}
                </span>
              </h1>
              <p className="text-lg text-white/70 leading-relaxed mb-8 max-w-lg">
                {t("assessment.landingHeroDescription")}
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  href="/assessment/start"
                  className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white font-semibold px-7 py-3.5 rounded-xl hover:bg-white/25 transition-colors shadow-lg shadow-black/10 text-base"
                >
                  <Play className="w-5 h-5" />
                  {hasResults ? t("assessment.retakeAssessment") : t("assessment.startAssessment")}
                </Link>
                {hasResults && (
                  <Link
                    href="/assessment/results"
                    className="inline-flex items-center gap-2 text-white/80 hover:text-white font-medium transition-colors"
                  >
                    {t("assessment.viewLastResult")} <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>

              <div className="flex items-center gap-6 mt-10">
                <div className="flex items-center gap-2 text-white/60 text-sm">
                  <Clock className="w-4 h-4" />
                  {t("assessment.fifteenMinutesApprox")}
                </div>
                <div className="flex items-center gap-2 text-white/60 text-sm">
                  <Target className="w-4 h-4" />
                  {t("assessment.tenSkillAreas")}
                </div>
                <div className="flex items-center gap-2 text-white/60 text-sm">
                  <RefreshCw className="w-4 h-4" />
                  {t("assessment.retakeAnytime")}
                </div>
              </div>
            </div>

            {/* Right side */}
            <div className="hidden lg:block">
              {hasResults ? (
                <div className="bg-card/10 backdrop-blur-md border border-white/20 rounded-2xl p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg">{t("assessment.yourLatestScore")}</h3>
                      <p className="text-white/50 text-sm">{t("assessment.dsriResult")}</p>
                    </div>
                  </div>
                  <div className="flex items-end gap-3 mb-4">
                    <span className="text-6xl font-extrabold text-white">{latestDsri}%</span>
                    {(() => {
                      const s = formatScore(latestDsri ?? 0);
                      return (
                        <span className={`mb-2 px-3 py-1 rounded-full text-sm font-semibold ${s.bg} ${s.color} ring-1 ${s.ring}`}>
                          {s.label}
                        </span>
                      );
                    })()}
                  </div>
                  <div className="w-full bg-card/10 rounded-full h-3 mb-2">
                    <div className="h-3 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 transition-all" style={{ width: `${latestDsri}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-sm text-white/50 mt-3">
                    <span>{t("assessment.assessmentsTaken", { count: historyCount })}</span>
                    <Link href="/assessment/results" className="text-white/80 hover:text-white font-medium flex items-center gap-1">
                      {t("assessment.viewDetails")} <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="bg-card/10 backdrop-blur-md border border-white/20 rounded-2xl p-8">
                  <div className="space-y-4">
                    {[
                      { label: "Digital Literacy", pct: 85 },
                      { label: "Digital Skills", pct: 72 },
                      { label: "Communication", pct: 90 },
                      { label: "Problem Solving", pct: 65 },
                      { label: "Digital Safety", pct: 78 },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="flex justify-between text-sm text-white/80 mb-1.5">
                          <span>{item.label}</span>
                          <span>{item.pct}%</span>
                        </div>
                        <div className="w-full bg-card/10 rounded-full h-2">
                          <div className="h-2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400" style={{ width: `${item.pct}%` }} />
                        </div>
                      </div>
                    ))}
                    <p className="text-center text-white/40 text-sm pt-2">Sample result preview</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6">
        {/* How It Works */}
        <div className="py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-3">{t("assessment.howItWorksTitle")}</h2>
            <p className="text-muted-foreground text-lg">{t("assessment.howItWorksDescription")}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: 1,
                icon: Target,
                title: t("assessment.step1Title"),
                desc: t("assessment.step1Desc"),
                gradient: "from-violet-500 to-indigo-600",
              },
              {
                step: 2,
                icon: BarChart3,
                title: t("assessment.step2Title"),
                desc: t("assessment.step2Desc"),
                gradient: "from-blue-500 to-cyan-600",
              },
              {
                step: 3,
                icon: Lightbulb,
                title: t("assessment.step3Title"),
                desc: t("assessment.step3Desc"),
                gradient: "from-emerald-500 to-green-600",
              },
            ].map(({ step, icon: Icon, title, desc, gradient }) => (
              <div key={step} className="relative">
                <Card className="p-0 border-0 shadow-md h-full">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`w-12 h-12 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-sm`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-sm font-bold text-muted-foreground">
                        {step}
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>

        {/* 10 Competency Areas */}
        <div className="pb-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-foreground mb-3">{t("assessment.tenCompetencyAreasTitle")}</h2>
            <p className="text-muted-foreground text-lg">{t("assessment.tenCompetencyAreasDescription")}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(COMPETENCIES).map(([code, comp], idx) => {
              const Icon = COMPETENCY_ICONS[idx % COMPETENCY_ICONS.length];
              return (
                <Card key={code} className="p-0 border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4 text-center">
                    <div className="w-10 h-10 bg-violet-500/10 dark:bg-violet-400/15 rounded-xl flex items-center justify-center mx-auto mb-2">
                      <Icon className="w-5 h-5 text-violet-600 dark:text-violet-300" />
                    </div>
                    <p className="text-xs font-bold text-violet-600 dark:text-violet-300 mb-1">{code}</p>
                    <p className="text-xs text-muted-foreground leading-tight mb-2">{comp.nameEn}</p>
                    <span className="inline-block px-2 py-0.5 bg-muted rounded-full text-xs text-muted-foreground">
                      {t("assessment.weightLabel", { weight: comp.weight })}
                    </span>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Stats */}
        <div className="pb-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Target, value: "10", label: t("assessment.statsCompetencyAreas"), gradient: "from-violet-500 to-indigo-600", gradientDark: "from-violet-600/80 to-indigo-700/80" },
              { icon: Clock, value: "~15", label: t("assessment.statsMinutesToComplete"), gradient: "from-blue-500 to-cyan-600", gradientDark: "from-blue-600/80 to-cyan-700/80" },
              { icon: Star, value: "1-5", label: t("assessment.statsRatingScale"), gradient: "from-amber-500 to-orange-500", gradientDark: "from-amber-600/80 to-orange-600/80" },
              { icon: Award, value: "100", label: t("assessment.statsMaxDsriScore"), gradient: "from-emerald-500 to-green-600", gradientDark: "from-emerald-600/80 to-green-700/80" },
            ].map(({ icon: Icon, value, label, gradient, gradientDark }) => (
              <div key={label} className={`bg-gradient-to-br ${gradient} dark:${gradientDark} rounded-2xl p-6 text-white`}>
                <Icon className="w-6 h-6 text-white/60 mb-3" />
                <div className="text-3xl font-bold">{value}</div>
                <div className="text-sm text-white/70">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="pb-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-foreground mb-3">{t("assessment.faqTitle")}</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {[
              { icon: CircleHelp, q: t("assessment.faq1Question"), a: t("assessment.faq1Answer") },
              { icon: Shield, q: t("assessment.faq2Question"), a: t("assessment.faq2Answer") },
              { icon: RefreshCw, q: t("assessment.faq3Question"), a: t("assessment.faq3Answer") },
              { icon: Award, q: t("assessment.faq4Question"), a: t("assessment.faq4Answer") },
            ].map(({ icon: Icon, q, a }) => (
              <Card key={q} className="p-0 border-0 shadow-sm">
                <CardContent className="p-5">
                  <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Icon className="w-4 h-4 text-violet-600" />
                    {q}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="pb-16">
          <div className="bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-900 dark:via-indigo-950 dark:to-gray-900 rounded-2xl p-10 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.05),transparent_60%)]" />
            <div className="relative">
              <h2 className="text-3xl font-bold text-white mb-3">
                {hasResults ? t("assessment.bottomCtaTitleTrack") : t("assessment.bottomCtaTitleReady")}
              </h2>
              <p className="text-white/60 text-lg mb-8 max-w-xl mx-auto">
                {hasResults
                  ? t("assessment.bottomCtaDescTrack")
                  : t("assessment.bottomCtaDescReady")}
              </p>
              <Link
                href="/assessment/start"
                className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-white/25 transition-colors shadow-lg text-base"
              >
                <Zap className="w-5 h-5" />
                {hasResults ? t("assessment.retakeAssessment") : t("assessment.startAssessment")}
              </Link>
              <div className="flex items-center justify-center gap-8 mt-8 text-sm text-white/50">
                <span className="flex items-center gap-1.5"><Shield className="w-4 h-4" /> {t("assessment.bottomCtaSecure")}</span>
                <span className="flex items-center gap-1.5"><Zap className="w-4 h-4" /> {t("assessment.bottomCtaInstantResults")}</span>
                <span className="flex items-center gap-1.5"><RefreshCw className="w-4 h-4" /> {t("assessment.bottomCtaRepeatable")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
