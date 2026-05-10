"use client";

import Link from "next/link";
import { useAssessmentResults } from "@/hooks/useApi";
import { Card, CardContent } from "@/components/ui/card";
import { COMPETENCIES } from "@/lib/constants";
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
  if (dsri >= 90) return { label: "Excellent", color: "text-green-600", bg: "bg-green-50", ring: "ring-green-200" };
  if (dsri >= 70) return { label: "Good", color: "text-yellow-600", bg: "bg-yellow-50", ring: "ring-yellow-200" };
  if (dsri >= 40) return { label: "Average", color: "text-orange-600", bg: "bg-orange-50", ring: "ring-orange-200" };
  return { label: "Needs Work", color: "text-red-600", bg: "bg-red-50", ring: "ring-red-200" };
}

export default function AssessmentLandingPage() {
  const { data: results } = useAssessmentResults();
  const hasResults = results?.latest;
  const latestDsri = results?.latest?.dsri;
  const historyCount = results?.history?.length || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(255,255,255,0.08),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.05),transparent_50%)]" />

        <div className="relative max-w-7xl mx-auto px-6 py-16 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-sm text-white/90 font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                Digital Skills Readiness Assessment
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
                Measure Your{" "}
                <span className="bg-gradient-to-r from-yellow-300 via-amber-300 to-orange-300 bg-clip-text text-transparent">
                  Digital Readiness
                </span>
              </h1>
              <p className="text-lg text-white/70 leading-relaxed mb-8 max-w-lg">
                Evaluate your skills across 10 core competency areas. Get your DSRI score and personalized course recommendations in about 15 minutes.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  href="/assessment/start"
                  className="inline-flex items-center gap-2 bg-white text-violet-700 font-semibold px-7 py-3.5 rounded-xl hover:bg-gray-50 transition-colors shadow-lg shadow-black/10 text-base"
                >
                  <Play className="w-5 h-5" />
                  {hasResults ? "Retake Assessment" : "Start Assessment"}
                </Link>
                {hasResults && (
                  <Link
                    href="/assessment/results"
                    className="inline-flex items-center gap-2 text-white/80 hover:text-white font-medium transition-colors"
                  >
                    View Last Result <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>

              <div className="flex items-center gap-6 mt-10">
                <div className="flex items-center gap-2 text-white/60 text-sm">
                  <Clock className="w-4 h-4" />
                  ~15 minutes
                </div>
                <div className="flex items-center gap-2 text-white/60 text-sm">
                  <Target className="w-4 h-4" />
                  10 skill areas
                </div>
                <div className="flex items-center gap-2 text-white/60 text-sm">
                  <RefreshCw className="w-4 h-4" />
                  Retake anytime
                </div>
              </div>
            </div>

            {/* Right side */}
            <div className="hidden lg:block">
              {hasResults ? (
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg">Your Latest Score</h3>
                      <p className="text-white/50 text-sm">DSRI Result</p>
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
                  <div className="w-full bg-white/10 rounded-full h-3 mb-2">
                    <div className="h-3 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 transition-all" style={{ width: `${latestDsri}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-sm text-white/50 mt-3">
                    <span>{historyCount} assessment{historyCount !== 1 ? "s" : ""} taken</span>
                    <Link href="/assessment/results" className="text-white/80 hover:text-white font-medium flex items-center gap-1">
                      View Details <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8">
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
                        <div className="w-full bg-white/10 rounded-full h-2">
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
            <h2 className="text-3xl font-bold text-gray-900 mb-3">How It Works</h2>
            <p className="text-gray-500 text-lg">Three simple steps to understand your digital capabilities</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: 1,
                icon: Target,
                title: "Rate Your Confidence",
                desc: "Answer questions across 10 digital competency areas on a 1-5 confidence scale",
                gradient: "from-violet-500 to-indigo-600",
              },
              {
                step: 2,
                icon: BarChart3,
                title: "Get Your DSRI Score",
                desc: "Receive a weighted Digital Skills Readiness Index score out of 100",
                gradient: "from-blue-500 to-cyan-600",
              },
              {
                step: 3,
                icon: Lightbulb,
                title: "Discover Your Path",
                desc: "Identify strengths, weaknesses, and get personalized course recommendations",
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
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-bold text-gray-500">
                        {step}
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>

        {/* 10 Competency Areas */}
        <div className="pb-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">10 Competency Areas</h2>
            <p className="text-gray-500 text-lg">Each area is weighted based on industry relevance</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(COMPETENCIES).map(([code, comp], idx) => {
              const Icon = COMPETENCY_ICONS[idx % COMPETENCY_ICONS.length];
              return (
                <Card key={code} className="p-0 border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4 text-center">
                    <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                      <Icon className="w-5 h-5 text-violet-600" />
                    </div>
                    <p className="text-xs font-bold text-violet-600 mb-1">{code}</p>
                    <p className="text-xs text-gray-600 leading-tight mb-2">{comp.nameEn}</p>
                    <span className="inline-block px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-500">
                      {comp.weight}% weight
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
              { icon: Target, value: "10", label: "Competency Areas", gradient: "from-violet-500 to-indigo-600" },
              { icon: Clock, value: "~15", label: "Minutes to Complete", gradient: "from-blue-500 to-cyan-600" },
              { icon: Star, value: "1-5", label: "Rating Scale", gradient: "from-amber-500 to-orange-500" },
              { icon: Award, value: "100", label: "Max DSRI Score", gradient: "from-emerald-500 to-green-600" },
            ].map(({ icon: Icon, value, label, gradient }) => (
              <div key={label} className={`bg-gradient-to-br ${gradient} rounded-2xl p-6 text-white`}>
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
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Frequently Asked Questions</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {[
              { icon: CircleHelp, q: "How long does it take?", a: "Approximately 15 minutes to complete all 10 sections covering every digital competency area." },
              { icon: Shield, q: "Is my data secure?", a: "Yes. All responses are encrypted and stored securely. Your results are only visible to you and authorized roles." },
              { icon: RefreshCw, q: "Can I retake the assessment?", a: "Yes, you can retake it anytime to track your progress. All past results are saved with full history." },
              { icon: Award, q: "What do I get from the results?", a: "You receive a DSRI score, breakdown by all 10 areas, trend charts, and personalized course recommendations." },
            ].map(({ icon: Icon, q, a }) => (
              <Card key={q} className="p-0 border-0 shadow-sm">
                <CardContent className="p-5">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Icon className="w-4 h-4 text-violet-600" />
                    {q}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="pb-16">
          <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-10 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.05),transparent_60%)]" />
            <div className="relative">
              <h2 className="text-3xl font-bold text-white mb-3">
                {hasResults ? "Track Your Progress" : "Ready to Begin?"}
              </h2>
              <p className="text-white/60 text-lg mb-8 max-w-xl mx-auto">
                {hasResults
                  ? "Retake the assessment to see how your digital skills have improved over time."
                  : "Take the first step towards understanding and improving your digital skills."}
              </p>
              <Link
                href="/assessment/start"
                className="inline-flex items-center gap-2 bg-white text-violet-700 font-semibold px-8 py-3.5 rounded-xl hover:bg-gray-50 transition-colors shadow-lg text-base"
              >
                <Zap className="w-5 h-5" />
                {hasResults ? "Retake Assessment" : "Start Assessment"}
              </Link>
              <div className="flex items-center justify-center gap-8 mt-8 text-sm text-white/50">
                <span className="flex items-center gap-1.5"><Shield className="w-4 h-4" /> Secure</span>
                <span className="flex items-center gap-1.5"><Zap className="w-4 h-4" /> Instant Results</span>
                <span className="flex items-center gap-1.5"><RefreshCw className="w-4 h-4" /> Repeatable</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
