"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAssessmentStart, submitAssessment, saveAssessmentDraft, loadAssessmentDraft, clearAssessmentDraft } from "@/hooks/useApi";
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

const RATING_LABELS: Record<number, string> = {
  1: "No confidence",
  2: "Low confidence",
  3: "Moderate",
  4: "High confidence",
  5: "Very confident",
};

const RATING_COLORS: Record<number, string> = {
  1: "bg-red-500 text-white",
  2: "bg-orange-400 text-white",
  3: "bg-yellow-400 text-yellow-900",
  4: "bg-emerald-400 text-white",
  5: "bg-green-500 text-white",
};

const RATING_HOVER: Record<number, string> = {
  1: "hover:bg-red-100 hover:border-red-300 hover:text-red-600",
  2: "hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600",
  3: "hover:bg-yellow-50 hover:border-yellow-300 hover:text-yellow-600",
  4: "hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-600",
  5: "hover:bg-green-50 hover:border-green-300 hover:text-green-600",
};

const SECTION_ICONS = [User, Monitor, Users, Shield, Brain, BookOpen, BarChart3, Lightbulb, Clock, ChevronRight];

const SECTION_DESCRIPTIONS = [
  "Evaluate your foundational digital knowledge and skills",
  "Assess your ability to use digital tools and applications",
  "Rate your proficiency in digital communication and teamwork",
  "Measure your understanding of online safety practices",
  "Evaluate your readiness for digital transformation",
  "Assess your digital creativity and innovation skills",
  "Rate your understanding of digital ethics and inclusion",
  "Evaluate your ability to apply digital skills in practice",
  "Assess your professional development through digital means",
  "Measure your problem-solving capabilities with technology",
];

export default function AssessmentStartPage() {
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
      <div className="min-h-screen bg-gray-50">
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
    if (pct >= 70) return { pct, tip: "Strong performance in this area! Keep it up.", color: "bg-green-50 border-green-200 text-green-700" };
    if (pct >= 40) return { pct, tip: "Good progress. Targeted practice will help you improve further.", color: "bg-yellow-50 border-yellow-200 text-yellow-700" };
    return { pct, tip: "Consider focusing on building foundational knowledge in this area.", color: "bg-red-50 border-red-200 text-red-700" };
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
      setAlertMessage("Assessment submitted successfully!");
      setShowAlert(true);
    } catch (err) {
      console.error(err);
      setAlertSuccess(false);
      setAlertMessage("Failed to submit assessment. Please try again.");
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
        setAlertMessage(`Please answer all questions before submitting. ${answeredCount}/${totalQuestions} completed.`);
      }
      setAlertSuccess(false);
      setShowAlert(true);
      return;
    }
    setShowConfirm(true);
  };

  const SectionIcon = SECTION_ICONS[currentSection % SECTION_ICONS.length];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Digital Skills Assessment</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm text-gray-500">
                  {answeredCount}/{totalQuestions} answered
                </span>
                {saved && (
                  <span className="flex items-center gap-1 text-xs text-green-600">
                    <Save className="w-3 h-3" /> Saved
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                ~15 min
              </div>
              <div className="w-40">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-500">Progress</span>
                  <span className="font-semibold text-gray-700">{progressPercent}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-violet-500 to-indigo-500 h-2 rounded-full transition-all duration-500"
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
                        ? "bg-violet-100 text-violet-700"
                        : complete
                          ? "text-green-600 hover:bg-green-50"
                          : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                    }`}
                  >
                    {complete ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                        isActive ? "bg-violet-600 text-white" : "bg-gray-200 text-gray-500"
                      }`}>
                        {idx + 1}
                      </span>
                    )}
                    <span className="hidden lg:inline">{s.section_code}</span>
                  </button>
                  {idx < sections.length - 1 && (
                    <div className={`w-4 h-px mx-0.5 ${idx < currentSection ? "bg-green-300" : "bg-gray-200"}`} />
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
                    <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center">
                      <SectionIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-violet-600">{section.section_code}</span>
                        <span className="text-gray-300">|</span>
                        <span className="text-sm text-gray-500">Section {currentSection + 1} of {totalSections}</span>
                      </div>
                      <h2 className="text-lg font-bold text-gray-900">{section.section_name}</h2>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 ml-[52px]">
                    {SECTION_DESCRIPTIONS[currentSection % SECTION_DESCRIPTIONS.length]}
                  </p>
                </div>

                {/* Questions */}
                <div className="space-y-5">
                  {section.questions.map((q: AssessmentQuestion, qIdx: number) => {
                    const answered = answers[q.id] != null;
                    return (
                      <div
                        key={q.id}
                        className={`bg-white rounded-2xl p-6 transition-all duration-300 ${
                          answered
                            ? "ring-2 ring-violet-400/50 shadow-md shadow-violet-100"
                            : "shadow-sm border border-gray-100 hover:shadow-md"
                        }`}
                      >
                        {/* Question number + text */}
                        <div className="flex items-start gap-3 mb-5">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                            answered
                              ? "bg-violet-600 text-white"
                              : "bg-gray-200 text-gray-500"
                          }`}>
                            {qIdx + 1}
                          </div>
                          <p className="text-gray-800 font-medium leading-relaxed text-[15px]">{q.text}</p>
                        </div>

                        {/* Rating row */}
                        <div className="flex items-center justify-between pl-10">
                          <div className="flex items-center gap-2">
                            {[1, 2, 3, 4, 5].map((val) => (
                              <button
                                key={val}
                                title={RATING_LABELS[val]}
                                onClick={() => handleAnswer(q.id, val)}
                                className={`w-10 h-10 rounded-lg flex items-center justify-center font-semibold text-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-1 ${
                                  answers[q.id] === val
                                    ? RATING_COLORS[val] + " shadow-md scale-110"
                                    : `bg-gray-50 text-gray-400 border border-gray-200 ${RATING_HOVER[val]}`
                                }`}
                              >
                                {val}
                              </button>
                            ))}
                          </div>
                          {answered && (
                            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                              answers[q.id] <= 2 ? "bg-red-50 text-red-600" :
                              answers[q.id] === 3 ? "bg-yellow-50 text-yellow-600" :
                              "bg-green-50 text-green-600"
                            }`}>
                              {RATING_LABELS[answers[q.id]]}
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
                        <span className="font-semibold text-sm">Section Score: {feedback.pct}%</span>
                        <span className="text-sm ml-2">{feedback.tip}</span>
                      </div>
                    </div>
                  );
                })()}

                {/* Navigation */}
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setCurrentSection((i) => i - 1)}
                    disabled={currentSection === 0}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>

                  <span className="text-sm text-gray-400">
                    {getSectionAnswered(section)}/{section.questions.length} in this section
                  </span>

                  {currentSection < totalSections - 1 ? (
                    <button
                      onClick={() => setCurrentSection((i) => i + 1)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmitClick}
                      disabled={submitting}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-sm font-semibold transition-all disabled:opacity-50"
                    >
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      Submit Assessment
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
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Section Progress</h3>
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
                          isActive ? "bg-violet-50 ring-1 ring-violet-200" : "hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-xs font-medium ${isActive ? "text-violet-700" : "text-gray-700"}`}>
                            {s.section_code}
                          </span>
                          {complete ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                          ) : (
                            <span className="text-xs text-gray-400">{answered}/{total}</span>
                          )}
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                              complete ? "bg-green-500" : isActive ? "bg-violet-500" : "bg-gray-300"
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
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Rating Scale</h3>
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((val) => (
                    <div key={val} className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${RATING_COLORS[val]}`}>
                        {val}
                      </div>
                      <span className="text-xs text-gray-600">{RATING_LABELS[val]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Rating Guide (bottom sheet style) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Scale:</span>
            {[1, 2, 3, 4, 5].map((val) => (
              <div key={val} className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${RATING_COLORS[val]}`}>
                {val}
              </div>
            ))}
          </div>
          <span className="text-xs text-gray-400">
            {answeredCount}/{totalQuestions}
          </span>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Send className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Submit Assessment?</h3>
            <p className="text-gray-500 mb-6">
              All {totalQuestions} questions answered. This will submit your final responses.
            </p>
            <div className="flex gap-3 justify-center">
              <DialogClose render={<button className="px-6 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors" />}>
                Cancel
              </DialogClose>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium disabled:opacity-50 transition-colors"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2 inline" />}
                {submitting ? "Submitting..." : "Submit"}
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
        <DialogContent className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
          <div className="text-center">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
              alertSuccess ? "bg-green-100" : "bg-red-100"
            }`}>
              {alertSuccess ? (
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              ) : (
                <TriangleAlert className="w-8 h-8 text-red-600" />
              )}
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {alertSuccess ? "Success!" : "Incomplete"}
            </h3>
            <p className="text-gray-500 mb-6">{alertMessage}</p>
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
