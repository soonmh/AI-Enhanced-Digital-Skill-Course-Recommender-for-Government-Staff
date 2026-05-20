"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAssessmentStart, submitAssessment, saveAssessmentDraft, loadAssessmentDraft, clearAssessmentDraft } from "@/hooks/useApi";
import { useTranslation } from "@/i18n/context";
import {
  Dialog,
  DialogContent,
  DialogClose,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import type { AssessmentQuestion } from "@/types";
import {
  ChevronLeft,
  ChevronRight,
  Send,
  Lightbulb,
  Clock,
  User,
  Monitor,
  Users,
  Shield,
  Loader2,
  TriangleAlert,
  Save,
  CheckCircle2,
  BookOpen,
  Brain,
  BarChart3,
} from "lucide-react";

const RATING_LABEL_KEYS: Record<number, string> = {
  1: "assessment.rating1",
  2: "assessment.rating2",
  3: "assessment.rating3",
  4: "assessment.rating4",
  5: "assessment.rating5",
};

const RATING_COLORS: Record<number, string> = {
  1: "bg-red-500 text-white dark:bg-red-500/20 dark:text-red-300",
  2: "bg-orange-400 text-white dark:bg-orange-400/20 dark:text-orange-300",
  3: "bg-yellow-400 text-yellow-900 dark:bg-yellow-400/20 dark:text-yellow-300",
  4: "bg-emerald-400 text-white dark:bg-emerald-400/20 dark:text-emerald-300",
  5: "bg-green-500 text-white dark:bg-green-500/20 dark:text-green-300",
};

const RATING_HOVER: Record<number, string> = {
  1: "hover:bg-red-100 hover:border-red-300 hover:text-red-600",
  2: "hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600",
  3: "hover:bg-yellow-500/10 hover:border-yellow-300 hover:text-yellow-600",
  4: "hover:bg-emerald-500/10 hover:border-emerald-300 hover:text-emerald-600",
  5: "hover:bg-green-500/10 hover:border-green-300 hover:text-green-600",
};

const SECTION_ICONS = [User, Monitor, Users, Shield, Brain, BookOpen, BarChart3, Lightbulb, Clock, ChevronRight];

const SECTION_DESC_KEYS = [
  "assessment.sectionDesc1",
  "assessment.sectionDesc2",
  "assessment.sectionDesc3",
  "assessment.sectionDesc4",
  "assessment.sectionDesc5",
  "assessment.sectionDesc6",
  "assessment.sectionDesc7",
  "assessment.sectionDesc8",
  "assessment.sectionDesc9",
  "assessment.sectionDesc10",
];

export default function AssessmentStartPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useAssessmentStart();
  const [currentSection, setCurrentSection] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertSuccess, setAlertSuccess] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (data?.sections) {
      const savedDraft = localStorage.getItem("assessment_draft");
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft);
          if (draft.answers) setAnswers(draft.answers);
          if (draft.section !== undefined) setCurrentSection(draft.section);
        } catch { /* ignore */ }
      }
      loadAssessmentDraft().then((res) => {
        if (res?.draft?.answers && Object.keys(res.draft.answers).length > 0) {
          setAnswers(res.draft.answers);
          if (res.draft.current_section !== undefined) setCurrentSection(res.draft.current_section);
        }
      }).catch(() => {});
    }
  }, [data]);

  useEffect(() => {
    if (data?.sections && Object.keys(answers).length > 0) {
      localStorage.setItem("assessment_draft", JSON.stringify({ answers, section: currentSection }));
      setSaved(false);
      const timer = setTimeout(() => {
        saveAssessmentDraft(answers, currentSection).then(() => setSaved(true)).catch(() => {});
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [answers, currentSection, data]);

  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Skeleton className="h-8 w-64 mb-6" />
          <div className="grid lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <Skeleton className="h-96 w-full rounded-xl" />
            </div>
            <div className="lg:col-span-3">
              <Skeleton className="h-24 w-full rounded-xl mb-6" />
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const sections = data.sections;
  const section = sections[currentSection];
  const totalSections = sections.length;
  const totalQuestions = sections.reduce((sum, s) => sum + s.questions.length, 0);
  const answeredCount = Object.keys(answers).length;
  const progressPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;
  const allAnswered = totalQuestions > 0 && answeredCount === totalQuestions;

  const handleAnswer = (questionId: string, value: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const getSectionScore = (sectionCode: string) => {
    const sec = sections.find((s) => s.section_code === sectionCode);
    if (!sec) return 0;
    return sec.questions.reduce((sum, q) => sum + (answers[q.id] || 0), 0);
  };

  const getSectionFeedback = (sectionCode: string) => {
    const sec = sections.find((s) => s.section_code === sectionCode);
    if (!sec) return null;
    const score = sec.questions.reduce((sum, q) => sum + (answers[q.id] || 0), 0);
    const maxScore = sec.questions.length * 5;
    const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    if (pct >= 70) return { pct, tip: "Strong performance in this area! Keep it up.", color: "bg-green-500/10 border-green-500/20 text-green-700" };
    if (pct >= 40) return { pct, tip: "Good progress. Targeted practice will help you improve further.", color: "bg-yellow-500/10 border-yellow-500/20 text-yellow-700" };
    return { pct, tip: "Consider focusing on building foundational knowledge in this area.", color: "bg-red-500/10 border-red-500/20 text-red-700" };
  };

  const getSectionAnswered = (sec: typeof sections[0]) =>
    sec.questions.filter((q) => answers[q.id] !== undefined).length;

  const isSectionComplete = (sec: typeof sections[0]) =>
    sec.questions.every((q) => answers[q.id] !== undefined);

  const handleSubmit = async () => {
    setSubmitting(true);
    setShowConfirm(false);
    try {
      const responses = sections.map((s) => ({
        section: s.section_code,
        score: getSectionScore(s.section_code),
      }));
      await submitAssessment(responses, data.assessment.id);
      localStorage.removeItem("assessment_draft");
      clearAssessmentDraft().catch(() => {});
      setAlertSuccess(true);
      setAlertMessage(t("assessment.submitSuccessMessage"));
      setShowAlert(true);
    } catch (err) {
      console.error(err);
      setAlertSuccess(false);
      setAlertMessage(t("assessment.submitFailedMessage"));
      setShowAlert(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitClick = () => {
    if (!allAnswered) {
      const unanswered = sections.filter((s) => !isSectionComplete(s));
      if (unanswered.length <= 3) {
        setAlertMessage(`Please complete: ${unanswered.map((s) => s.section_code).join(", ")}`);
      } else {
        setAlertMessage(t("assessment.submitIncompleteMessage", { answered: answeredCount, total: totalQuestions }));
      }
      setAlertSuccess(false);
      setShowAlert(true);
      return;
    }
    setShowConfirm(true);
  };

  const SectionIcon = SECTION_ICONS[currentSection % SECTION_ICONS.length];

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <div className="bg-card border-b border-border sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-foreground">{t("assessment.startPageTitle")}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm text-muted-foreground">
                  {t("assessment.answeredCount", { answered: answeredCount, total: totalQuestions })}
                </span>
                {saved && (
                  <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                    <Save className="w-3 h-3" /> {t("common.saved")}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                {t("assessment.aboutFifteenMin")}
              </div>
              <div className="w-40">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{t("common.progress")}</span>
                  <span className="font-semibold text-foreground">{progressPercent}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-violet-500 to-indigo-500 dark:from-violet-400/50 dark:to-indigo-400/50 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section Stepper */}
          <div className="flex items-center gap-1 mt-4 overflow-x-auto pb-1">
            {sections.map((s, idx) => {
              const isActive = idx === currentSection;
              const complete = isSectionComplete(s);
              return (
                <div key={s.section_code} className="flex items-center shrink-0">
                  <button
                    onClick={() => setCurrentSection(idx)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300"
                        : complete
                          ? "text-green-600 hover:bg-green-500/10"
                          : "text-muted-foreground hover:bg-background hover:text-muted-foreground"
                    }`}
                  >
                    {complete ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                        isActive ? "bg-violet-600 text-white" : "bg-muted text-muted-foreground"
                      }`}>
                        {idx + 1}
                      </span>
                    )}
                    <span className="hidden lg:inline">{s.section_code}</span>
                  </button>
                  {idx < sections.length - 1 && (
                    <div className={`w-4 h-px mx-0.5 ${idx < currentSection ? "bg-green-300" : "bg-muted"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Left: Questions */}
          <div className="lg:col-span-3">
            {section && (
              <div>
                {/* Section Header */}
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-indigo-600 dark:from-violet-500/20 dark:to-indigo-500/20 rounded-xl flex items-center justify-center">
                      <SectionIcon className="w-5 h-5 text-white dark:text-violet-300" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-violet-600 dark:text-violet-400">{section.section_code}</span>
                        <span className="text-muted-foreground">|</span>
                        <span className="text-sm text-muted-foreground">{t("assessment.sectionOf", { current: currentSection + 1, total: totalSections })}</span>
                      </div>
                      <h2 className="text-lg font-bold text-foreground">{section.section_name}</h2>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground ml-[52px]">
                    {t(SECTION_DESC_KEYS[currentSection % SECTION_DESC_KEYS.length])}
                  </p>
                </div>

                {/* Questions */}
                <div className="space-y-5">
                  {section.questions.map((q: AssessmentQuestion, qIdx: number) => {
                    const answered = answers[q.id] != null;
                    return (
                      <div
                        key={q.id}
                        className={`bg-card rounded-2xl p-6 transition-all duration-300 ${
                          answered
                            ? "ring-2 ring-violet-400/50 shadow-md shadow-violet-100 dark:ring-violet-400/30 dark:shadow-violet-400/5"
                            : "shadow-sm border border-border hover:shadow-md"
                        }`}
                      >
                        {/* Question number + text */}
                        <div className="flex items-start gap-3 mb-5">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                            answered
                              ? "bg-violet-600 text-white dark:bg-violet-500/20 dark:text-violet-300"
                              : "bg-muted text-muted-foreground"
                          }`}>
                            {qIdx + 1}
                          </div>
                          <p className="text-foreground font-medium leading-relaxed text-[15px]">{q.text}</p>
                        </div>

                        {/* Rating row */}
                        <div className="flex items-center justify-between pl-10">
                          <div className="flex items-center gap-2">
                            {[1, 2, 3, 4, 5].map((val) => (
                              <button
                                key={val}
                                title={t(RATING_LABEL_KEYS[val])}
                                onClick={() => handleAnswer(q.id, val)}
                                className={`w-10 h-10 rounded-lg flex items-center justify-center font-semibold text-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-1 ${
                                  answers[q.id] === val
                                    ? RATING_COLORS[val] + " shadow-md scale-110"
                                    : `bg-background text-muted-foreground border border-border ${RATING_HOVER[val]}`
                                }`}
                              >
                                {val}
                              </button>
                            ))}
                          </div>
                          {answered && (
                            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                              answers[q.id] <= 2 ? "bg-red-500/10 dark:bg-red-400/15 text-red-600 dark:text-red-400" :
                              answers[q.id] === 3 ? "bg-yellow-500/10 dark:bg-yellow-400/15 text-yellow-600 dark:text-yellow-400" :
                              "bg-green-500/10 dark:bg-green-400/15 text-green-600 dark:text-green-400"
                            }`}>
                              {t(RATING_LABEL_KEYS[answers[q.id]])}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Per-Section Feedback */}
                {isSectionComplete(section) && (() => {
                  const feedback = getSectionFeedback(section.section_code);
                  if (!feedback) return null;
                  return (
                    <div className={`mt-6 p-4 rounded-xl border ${feedback.color} flex items-center gap-3`}>
                      <Lightbulb className="w-5 h-5 shrink-0" />
                      <div>
                        <span className="font-semibold text-sm">{t("assessment.sectionScore", { pct: feedback.pct })}</span>
                        <span className="text-sm ml-2">{feedback.tip}</span>
                      </div>
                    </div>
                  );
                })()}

                {/* Navigation */}
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
                  <button
                    onClick={() => setCurrentSection((i) => i - 1)}
                    disabled={currentSection === 0}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border bg-card text-sm font-medium text-foreground hover:bg-background disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    {t("common.previous")}
                  </button>

                  <span className="text-sm text-muted-foreground">
                    {t("assessment.inThisSection", { answered: getSectionAnswered(section), total: section.questions.length })}
                  </span>

                  {currentSection < totalSections - 1 ? (
                    <button
                      onClick={() => setCurrentSection((i) => i + 1)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 dark:bg-violet-500/20 dark:text-violet-300 dark:hover:bg-violet-500/30 text-white text-sm font-medium transition-colors"
                    >
                      {t("common.next")}
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmitClick}
                      disabled={submitting}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 dark:from-green-500/20 dark:to-emerald-500/20 dark:hover:from-green-500/30 dark:hover:to-emerald-500/30 dark:text-green-300 text-white text-sm font-semibold transition-all disabled:opacity-50"
                    >
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      {t("assessment.submitAssessment")}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right: Progress Sidebar */}
          <div className="hidden lg:block">
            <div className="sticky top-40 space-y-4">
              {/* Section Progress */}
              <div className="bg-card rounded-xl border border-border p-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t("assessment.sectionProgress")}</h3>
                <div className="space-y-2">
                  {sections.map((s, idx) => {
                    const answered = getSectionAnswered(s);
                    const total = s.questions.length;
                    const pct = total > 0 ? Math.round((answered / total) * 100) : 0;
                    const isActive = idx === currentSection;
                    const complete = isSectionComplete(s);
                    return (
                      <button
                        key={s.section_code}
                        onClick={() => setCurrentSection(idx)}
                        className={`w-full text-left p-2.5 rounded-lg transition-colors ${
                          isActive ? "bg-violet-500/10 dark:bg-violet-400/15 ring-1 ring-violet-200 dark:ring-violet-400/30" : "hover:bg-background"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-xs font-medium ${isActive ? "text-violet-700 dark:text-violet-300" : "text-foreground"}`}>
                            {s.section_code}
                          </span>
                          {complete ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                          ) : (
                            <span className="text-xs text-muted-foreground">{answered}/{total}</span>
                          )}
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                              complete ? "bg-green-500 dark:bg-green-400/50" : isActive ? "bg-violet-500 dark:bg-violet-400/50" : "bg-muted-foreground/30"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Rating Guide */}
              <div className="bg-card rounded-xl border border-border p-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t("assessment.ratingScale")}</h3>
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((val) => (
                    <div key={val} className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${RATING_COLORS[val]}`}>
                        {val}
                      </div>
                      <span className="text-xs text-muted-foreground">{t(RATING_LABEL_KEYS[val])}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Rating Guide (bottom sheet style) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border p-3 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Scale:</span>
            {[1, 2, 3, 4, 5].map((val) => (
              <div key={val} className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${RATING_COLORS[val]}`}>
                {val}
              </div>
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            {answeredCount}/{totalQuestions}
          </span>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="bg-card rounded-2xl p-8 max-w-md w-full shadow-2xl">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Send className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">{t("assessment.submitConfirmTitle")}</h3>
            <p className="text-muted-foreground mb-6">
              {t("assessment.submitConfirmDescription", { total: totalQuestions })}
            </p>
            <div className="flex gap-3 justify-center">
              <DialogClose render={<button className="px-6 py-2.5 rounded-xl border border-border bg-card text-sm font-medium text-foreground hover:bg-background transition-colors" />}>
                {t("common.cancel")}
              </DialogClose>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium disabled:opacity-50 transition-colors"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2 inline" />}
                {submitting ? t("assessment.submitting") : t("common.submit")}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog */}
      <Dialog open={showAlert} onOpenChange={(open) => {
        setShowAlert(open);
        if (!open && alertSuccess) {
          router.push("/assessment/results");
        }
      }}>
        <DialogContent className="bg-card rounded-2xl p-8 max-w-md w-full shadow-2xl">
          <div className="text-center">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
              alertSuccess ? "bg-green-100" : "bg-red-100"
            }`}>
              {alertSuccess ? (
                <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
              ) : (
                <TriangleAlert className="w-8 h-8 text-red-600" />
              )}
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              {alertSuccess ? t("assessment.submitSuccessTitle") : t("assessment.submitIncompleteTitle")}
            </h3>
            <p className="text-muted-foreground mb-6">{alertMessage}</p>
            <button
              onClick={() => {
                setShowAlert(false);
                if (alertSuccess) router.push("/assessment/results");
              }}
              className={`px-8 py-2.5 rounded-xl text-white text-sm font-medium transition-colors ${
                alertSuccess ? "bg-green-600 hover:bg-green-700" : "bg-violet-600 hover:bg-violet-700"
              }`}
            >
              OK
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
