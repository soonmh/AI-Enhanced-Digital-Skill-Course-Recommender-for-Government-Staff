"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAssessmentStart, submitSectionRetest, saveAssessmentDraft, loadAssessmentDraft, clearAssessmentDraft } from "@/hooks/useApi";
import { useTranslation } from "@/i18n/context";
import { COMPETENCIES } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
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

export default function RetestPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const sectionCode = params.code as string;
  const comp = COMPETENCIES[sectionCode as keyof typeof COMPETENCIES];

  const { data, isLoading } = useAssessmentStart();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const section = data?.sections?.find((s: any) => s.section_code === sectionCode);
  const questions = section?.questions || [];

  useEffect(() => {
    if (answers && Object.keys(answers).length > 0) {
      saveAssessmentDraft(answers, 0);
    }
  }, [answers]);

  useEffect(() => {
    loadAssessmentDraft().then((draft: any) => {
      if (draft?.answers) setAnswers(draft.answers);
    });
  }, []);

  if (!comp) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Invalid section code</p>
          <Link href="/assessment/results" className="text-indigo-600 font-medium text-sm mt-2 inline-block">
            {t("assessment.retestBackToResults")}
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-4 w-96 mb-8" />
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl mb-4" />
          ))}
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">{t("assessment.retestSuccessTitle")}</h2>
          <p className="text-muted-foreground mb-6">{t("assessment.retestSuccess")}</p>
          <Link
            href="/assessment/results"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {t("assessment.retestBackToResults")}
          </Link>
        </div>
      </div>
    );
  }

  const allAnswered = questions.length > 0 && questions.every((q: any) => answers[q.id] != null);
  const totalScore = Object.values(answers).reduce((sum: number, v: number) => sum + v, 0);

  const handleSubmit = async () => {
    if (!allAnswered || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      await submitSectionRetest(sectionCode, totalScore);
      clearAssessmentDraft();
      setSubmitted(true);
    } catch {
      setError("Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/assessment/results" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
            <ChevronLeft className="w-4 h-4" />
            {t("assessment.retestBackToResults")}
          </Link>
          <h1 className="text-3xl font-bold text-foreground">
            {t("assessment.retestSectionTitle", { name: comp.nameEn })}
          </h1>
          <p className="text-muted-foreground mt-1">{t("assessment.retestSectionDescription")}</p>
        </div>

        {/* Rating Scale Guide */}
        <div className="mb-6 p-4 bg-muted/50 rounded-xl">
          <p className="text-sm font-medium text-foreground mb-2">{t("assessment.ratingScale")}</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(RATING_COLORS).map(([value, color]) => (
              <span key={value} className={`px-3 py-1 rounded-full text-xs font-medium ${color}`}>
                {value} — {t(RATING_LABEL_KEYS[Number(value)])?.split(" — ")[0] || value}
              </span>
            ))}
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-4">
          {questions.map((q: any, idx: number) => (
            <div key={q.id} className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-start gap-3 mb-4">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs font-bold shrink-0">
                  {idx + 1}
                </span>
                <div>
                  <p className="font-medium text-foreground">{q.text}</p>
                  {q.title && <p className="text-xs text-muted-foreground mt-0.5">{q.title}</p>}
                </div>
              </div>
              <div className="flex gap-2 ml-10">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => setAnswers({ ...answers, [q.id]: rating })}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${
                      answers[q.id] === rating
                        ? RATING_COLORS[rating]
                        : "border-border text-muted-foreground hover:border-current"
                    }`}
                  >
                    {rating}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Submit */}
        <div className="mt-8 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {Object.keys(answers).length}/{questions.length} {t("assessment.answeredCount", { answered: Object.keys(answers).length, total: questions.length }).split("/")[1] || "answered"}
          </p>
          <Button
            onClick={handleSubmit}
            disabled={!allAnswered || submitting}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
            {t("assessment.retestSubmit")}
          </Button>
        </div>

        {error && (
          <p className="mt-4 text-sm text-red-600 text-center">{error}</p>
        )}
      </div>
    </div>
  );
}
