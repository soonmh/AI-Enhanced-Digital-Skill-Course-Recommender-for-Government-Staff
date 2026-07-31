/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import Link from "next/link";
import { useMyTeam, usePendingEndorsements, endorseAssessment, rejectAssessment, usePendingCourseCompletions, endorseCourseCompletion, rejectCourseCompletion, useEndorsementHistory } from "@/hooks/useApi";
import { useTranslation } from "@/i18n/context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CompetencyRadar } from "@/components/charts/CompetencyRadar";
import { getMaturityLevel } from "@/lib/maturity";
import { COMPETENCIES } from "@/lib/constants";
import type { PendingEndorsement, PendingCourseCompletion } from "@/types";
import {
  Users,
  BookOpen,
  CircleCheck,
  Target,
  ArrowRight,
  UserX,
  ClipboardCheck,
  XCircle,
  Loader2,
  GraduationCap,
  FileText,
  History,
  Inbox,
} from "lucide-react";

function PendingEndorsements() {
  const { t } = useTranslation();
  const { pending, isLoading, refresh } = usePendingEndorsements();
  const [rejecting, setRejecting] = useState<PendingEndorsement | null>(null);
  const [note, setNote] = useState("");
  const [submittingId, setSubmittingId] = useState<number | null>(null);

  if (isLoading || pending.length === 0) {
    return null;
  }

  const handleEndorse = async (id: number) => {
    setSubmittingId(id);
    try {
      await endorseAssessment(id);
      refresh();
    } finally {
      setSubmittingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejecting || !note.trim()) return;
    setSubmittingId(rejecting.id);
    try {
      await rejectAssessment(rejecting.id, note.trim());
      refresh();
      setRejecting(null);
      setNote("");
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <>
      <Card className="mb-8 py-0 border-0 shadow-md">
        <CardContent className="p-0">
          <div className="flex items-center gap-2 px-5 py-3 border-b">
            <ClipboardCheck className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h2 className="text-base font-semibold text-foreground">{t("endorsements.title")}</h2>
            <span className="text-sm text-muted-foreground">({pending.length})</span>
          </div>
          <div className="divide-y">
            {pending.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="flex items-center gap-3 min-w-0">
                  <UserAvatar name={item.name} size={34} />
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {t("endorsements.dsri")}: {item.dsri}% - {new Date(item.submitted_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={submittingId === item.id}
                    onClick={() => setRejecting(item)}
                  >
                    <XCircle className="w-4 h-4" />
                    {t("endorsements.reject")}
                  </Button>
                  <Button
                    size="sm"
                    disabled={submittingId === item.id}
                    onClick={() => handleEndorse(item.id)}
                  >
                    {submittingId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CircleCheck className="w-4 h-4" />}
                    {t("endorsements.endorse")}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!rejecting} onOpenChange={(open) => !open && setRejecting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("endorsements.rejectTitle")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-1.5">
            <label className="text-sm text-muted-foreground">{t("endorsements.noteLabel")}</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm"
              placeholder={t("endorsements.notePlaceholder")}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejecting(null)}>
              {t("endorsements.cancel")}
            </Button>
            <Button
              variant="destructive"
              disabled={!note.trim() || submittingId === rejecting?.id}
              onClick={handleReject}
            >
              {t("endorsements.confirmReject")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function PendingCourseCompletions() {
  const { t } = useTranslation();
  const { pending, isLoading, refresh } = usePendingCourseCompletions();
  const [rejecting, setRejecting] = useState<PendingCourseCompletion | null>(null);
  const [note, setNote] = useState("");
  const [submittingId, setSubmittingId] = useState<number | null>(null);

  if (isLoading || pending.length === 0) {
    return null;
  }

  const handleEndorse = async (id: number) => {
    setSubmittingId(id);
    try {
      await endorseCourseCompletion(id);
      refresh();
    } finally {
      setSubmittingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejecting || !note.trim()) return;
    setSubmittingId(rejecting.id);
    try {
      await rejectCourseCompletion(rejecting.id, note.trim());
      refresh();
      setRejecting(null);
      setNote("");
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <>
      <Card className="mb-8 py-0 border-0 shadow-md">
        <CardContent className="p-0">
          <div className="flex items-center gap-2 px-5 py-3 border-b">
            <GraduationCap className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            <h2 className="text-base font-semibold text-foreground">{t("endorsements.courseTitle")}</h2>
            <span className="text-sm text-muted-foreground">({pending.length})</span>
          </div>
          <div className="divide-y">
            {pending.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="flex items-center gap-3 min-w-0">
                  <UserAvatar name={item.name} size={34} />
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.course_title}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {item.proof_url && (
                    <a
                      href={item.proof_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-violet-600 dark:text-violet-400 bg-violet-500/10 hover:bg-violet-500/20 transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      {t("endorsements.viewProof")}
                    </a>
                  )}
                  <Button size="sm" variant="outline" disabled={submittingId === item.id} onClick={() => setRejecting(item)}>
                    <XCircle className="w-4 h-4" />
                    {t("endorsements.reject")}
                  </Button>
                  <Button size="sm" disabled={submittingId === item.id} onClick={() => handleEndorse(item.id)}>
                    {submittingId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CircleCheck className="w-4 h-4" />}
                    {t("endorsements.endorse")}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!rejecting} onOpenChange={(open) => !open && setRejecting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("endorsements.rejectCourseTitle")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-1.5">
            <label className="text-sm text-muted-foreground">{t("endorsements.noteLabel")}</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm"
              placeholder={t("endorsements.notePlaceholder")}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejecting(null)}>
              {t("endorsements.cancel")}
            </Button>
            <Button variant="destructive" disabled={!note.trim() || submittingId === rejecting?.id} onClick={handleReject}>
              {t("endorsements.confirmReject")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function EndorsementHistory() {
  const { t } = useTranslation();
  const { history, isLoading } = useEndorsementHistory();

  if (isLoading) {
    return <Skeleton className="h-32 w-full rounded-xl mb-8" />;
  }

  if (history.length === 0) {
    return (
      <Card className="mb-8 border-0 shadow-md">
        <CardContent className="p-10 text-center text-muted-foreground">
          <Inbox className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>{t("endorsements.noHistory")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-8 py-0 border-0 shadow-md">
      <CardContent className="p-0">
        <div className="flex items-center gap-2 px-5 py-3 border-b">
          <History className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-base font-semibold text-foreground">{t("endorsements.historyTitle")}</h2>
          <span className="text-sm text-muted-foreground">({history.length})</span>
        </div>
        <div className="divide-y">
          {history.map((item) => (
            <div key={`${item.type}-${item.id}`} className="flex items-center justify-between gap-4 px-5 py-4">
              <div className="flex items-center gap-3 min-w-0">
                <UserAvatar name={item.name} size={34} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground truncate">{item.name}</p>
                    <span className="px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground shrink-0">
                      {item.type === "assessment" ? t("endorsements.typeAssessment") : t("endorsements.typeCourse")}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {item.type === "assessment" ? `${t("endorsements.dsri")}: ${item.detail}%` : item.detail}
                    {" · "}
                    {new Date(item.decided_at).toLocaleDateString()}
                  </p>
                  {item.note && <p className="text-xs text-muted-foreground italic truncate">{item.note}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {item.type === "course" && item.proof_url && (
                  <a
                    href={item.proof_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-violet-600 dark:text-violet-400 bg-violet-500/10 hover:bg-violet-500/20 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    {t("endorsements.viewProof")}
                  </a>
                )}
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                  item.decision === "endorsed"
                    ? "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300"
                    : "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300"
                }`}>
                  {item.decision === "endorsed" ? <CircleCheck className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  {item.decision === "endorsed" ? t("endorsements.decisionEndorsed") : t("endorsements.decisionRejected")}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function EndorsementCenter() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<"pending" | "history">("pending");
  const { pending: pendingAssessments } = usePendingEndorsements();
  const { pending: pendingCourses } = usePendingCourseCompletions();
  const pendingCount = pendingAssessments.length + pendingCourses.length;

  return (
    <div className="mb-8">
      <div className="inline-flex rounded-lg border border-border bg-card p-1 mb-4">
        <button
          onClick={() => setTab("pending")}
          className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            tab === "pending" ? "bg-violet-600 text-white" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <ClipboardCheck className="w-4 h-4" />
          {t("endorsements.tabPending")}
          {pendingCount > 0 && (
            <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-xs ${tab === "pending" ? "bg-white/25" : "bg-violet-500/15 text-violet-600 dark:text-violet-300"}`}>
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("history")}
          className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            tab === "history" ? "bg-violet-600 text-white" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <History className="w-4 h-4" />
          {t("endorsements.tabHistory")}
        </button>
      </div>

      {tab === "pending" ? (
        pendingCount === 0 ? (
          <Card className="border-0 shadow-md">
            <CardContent className="p-10 text-center text-muted-foreground">
              <Inbox className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>{t("endorsements.noPending")}</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <PendingEndorsements />
            <PendingCourseCompletions />
          </>
        )
      ) : (
        <EndorsementHistory />
      )}
    </div>
  );
}

export default function MyTeamPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useMyTeam();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-card shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <Skeleton className="h-9 w-48 mb-1" />
            <Skeleton className="h-5 w-72" />
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!data?.has_team) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-card shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <h1 className="text-3xl font-bold text-foreground">{t("myTeam.title")}</h1>
            <p className="text-muted-foreground mt-1">{t("myTeam.description")}</p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center">
            <div className="mx-auto w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
              <UserX className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">{t("myTeam.noDirectReports")}</h3>
            <p className="text-muted-foreground">{t("myTeam.noDirectReportsDesc")}</p>
          </div>
        </div>
      </div>
    );
  }

  const stats = data.stats;
  const team = data.team || [];

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold text-foreground">{t("myTeam.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("myTeam.description")}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <EndorsementCenter />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-500/20 dark:to-blue-600/20 rounded-xl shadow-sm shrink-0">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground whitespace-nowrap">{t("myTeam.teamSize")}</p>
                  <p className="text-2xl font-bold text-foreground">{stats.team_size}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 dark:from-emerald-500/20 dark:to-green-600/20 rounded-xl shadow-sm shrink-0">
                  <CircleCheck className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground whitespace-nowrap">{t("myTeam.assessmentCompletion")}</p>
                  <p className="text-2xl font-bold text-foreground">{stats.assessment_completion}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 dark:from-violet-500/20 dark:to-purple-600/20 rounded-xl shadow-sm shrink-0">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground whitespace-nowrap">{t("myTeam.courseEnrollment")}</p>
                  <p className="text-2xl font-bold text-foreground">{stats.course_enrollment}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-500 dark:from-amber-500/20 dark:to-orange-500/20 rounded-xl shadow-sm shrink-0">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground whitespace-nowrap">{t("myTeam.avgDsri")}</p>
                  <p className="text-2xl font-bold text-foreground">{stats.avg_dsri}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Team Competency Radar */}
        {data.team_competency_avg && (
          <Card className="mb-8 border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Target className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                {t("myTeam.competencyAvg")}
              </CardTitle>
              <CardDescription>{t("myTeam.competencyAvgDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <CompetencyRadar
                data={Object.entries(COMPETENCIES).map(([code, comp]) => ({
                  code,
                  name: comp.nameEn,
                  percentage: data.team_competency_avg?.[code] ?? 0,
                }))}
              />
            </CardContent>
          </Card>
        )}

        {!data.team_competency_avg && (
          <Card className="mb-8 border-0 shadow-md">
            <CardContent className="p-8 text-center text-muted-foreground">
              <Target className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>{t("myTeam.noTeamData")}</p>
            </CardContent>
          </Card>
        )}

        {/* Team Members Table */}
        <Card className="py-0 border-0 shadow-md">
          <CardContent className="p-0">
            <div className="flex items-center justify-between px-5 py-3 border-b">
              <h2 className="text-base font-semibold text-foreground">{t("myTeam.teamMembers")}</h2>
              <span className="text-sm text-muted-foreground">{team.length} {t("myTeam.teamMembers").toLowerCase()}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm table-fixed">
                <thead className="sticky top-0 z-10 bg-muted">
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium text-foreground" style={{ width: "35%" }}>{t("reports.tableStaff")}</th>
                    <th className="text-left p-4 font-medium text-foreground" style={{ width: "15%" }}>{t("reports.tableField")}</th>
                    <th className="text-left p-4 font-medium text-foreground" style={{ width: "20%" }}>{t("reports.tableDsri")}</th>
                    <th className="text-left p-4 font-medium text-foreground" style={{ width: "10%" }}>{t("reports.tableCourses")}</th>
                    <th className="text-left p-4 font-medium text-foreground" style={{ width: "10%" }}>{t("reports.tableStatus")}</th>
                    <th className="text-left p-4 font-medium text-foreground" style={{ width: "10%" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {team.map((s: any) => (
                    <tr key={s.id} className="border-b hover:bg-blue-50/40 dark:hover:bg-violet-500/5 hover:shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <UserAvatar name={s.name} size={34} />
                          <div className="truncate">
                            <p className="font-medium text-foreground truncate">{s.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{s.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground truncate">{s.working_field || "-"}</td>
                      <td className="p-4">
                        {s.latest_dsri ? (
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-muted rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${getMaturityLevel(s.latest_dsri || 0).bgClass}`}
                                style={{ width: `${s.latest_dsri}%` }}
                              />
                            </div>
                            <span className={`text-sm font-bold ${getMaturityLevel(s.latest_dsri || 0).textClass}`}>
                              {s.latest_dsri}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-4 text-muted-foreground">{s.course_count || 0}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          s.status === "completed" ? "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300" :
                          s.status === "in_progress" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-300" :
                          "bg-muted text-foreground"
                        }`}>
                          {s.status === "completed" ? t("myTeam.completed") : s.status === "in_progress" ? t("myTeam.inProgress") : t("myTeam.notStarted")}
                        </span>
                      </td>
                      <td className="p-4">
                        <Link
                          href={`/my-team/${s.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-violet-600 dark:text-violet-400 bg-violet-500/10 dark:bg-violet-400/15 hover:bg-violet-500/20 hover:shadow-sm transition-all"
                        >
                          {t("myTeam.viewReport")} <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
