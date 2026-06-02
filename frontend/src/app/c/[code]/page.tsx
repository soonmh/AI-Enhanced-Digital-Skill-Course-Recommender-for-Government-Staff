"use client";

import { useParams } from "next/navigation";
import { useCertificateVerification } from "@/hooks/useApi";
import { MATURITY_LEVELS, getMaturityLevel } from "@/lib/maturity";
import { COMPETENCIES } from "@/lib/constants";
import {
  Award,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Printer,
  Glasses,
} from "lucide-react";

export default function CertificateVerifyPage() {
  const { code } = useParams<{ code: string }>();
  const { verification, isLoading } = useCertificateVerification(code);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Verifying...</div>
      </div>
    );
  }

  if (!verification) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-foreground">Certificate Not Found</h1>
          <p className="text-muted-foreground mt-2">This verification link is invalid.</p>
        </div>
      </div>
    );
  }

  const cert = verification.certificate;
  const maturity = getMaturityLevel(cert.dsri_score);
  const levelOrder = ["novice", "developing", "capable", "proficient", "expert"] as const;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 print:hidden">
          <div className="flex items-center gap-2">
            <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-gradient-to-br from-blue-600 to-purple-600">
              <Glasses className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-foreground">DSRA</span>
          </div>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
          >
            <Printer className="w-4 h-4" />
            Print / Save PDF
          </button>
        </div>

        {/* Certificate Card */}
        <div className="relative bg-white dark:bg-card border-2 border-border rounded-2xl shadow-xl overflow-hidden print:shadow-none print:border print:rounded-none">
          {/* Top color bar */}
          <div className="h-2 print:h-3" style={{ backgroundColor: maturity.hex }} />

          <div className="p-8 md:p-12">
            {/* Status badge */}
            <div className="flex items-center justify-between mb-8 print:hidden">
              {verification.valid ? (
                <div className="inline-flex items-center gap-2 rounded-full bg-green-100 dark:bg-green-500/10 px-4 py-1.5">
                  <ShieldCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-semibold text-green-700 dark:text-green-400">Valid Certificate</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 rounded-full bg-red-100 dark:bg-red-500/10 px-4 py-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <span className="text-sm font-semibold text-red-700 dark:text-red-400">Expired</span>
                </div>
              )}
              {cert.expires_at && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  {cert.is_expired ? "Expired" : "Valid until"}{" "}
                  {new Date(cert.expires_at).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              )}
            </div>

            {/* Certificate title */}
            <div className="text-center mb-10">
              <Award className="w-10 h-10 mx-auto mb-4" style={{ color: maturity.hex }} />
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-2">
                Certificate of Digital Skills Readiness
              </p>
              <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-1">
                {cert.user_name}
              </h1>
              {cert.user_field && (
                <p className="text-muted-foreground">{cert.user_field}</p>
              )}
            </div>

            {/* DSRI Score */}
            <div className="flex justify-center mb-10">
              <div
                className="relative w-36 h-36 print:w-32 print:h-32"
              >
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="2"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke={maturity.hex}
                    strokeWidth="2.5"
                    strokeDasharray={`${Math.round(cert.dsri_score)}, 100`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-extrabold" style={{ color: maturity.hex }}>
                    {Math.round(cert.dsri_score)}
                  </span>
                  <span className="text-[10px] text-muted-foreground">/ 100</span>
                </div>
              </div>
            </div>

            {/* Maturity Level Bar */}
            <div className="max-w-md mx-auto mb-10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Maturity Level</span>
                <span className="text-sm font-bold" style={{ color: maturity.hex }}>
                  L{cert.maturity_level} — {cert.maturity_label_en}
                </span>
              </div>
              <div className="flex gap-1">
                {levelOrder.map((lvl, i) => {
                  const info = MATURITY_LEVELS[lvl];
                  const filled = i < cert.maturity_level;
                  return (
                    <div
                      key={lvl}
                      className="flex-1 h-3 rounded-full first:rounded-l-full last:rounded-r-full transition-all"
                      style={{
                        backgroundColor: filled ? info.hex : "#e5e7eb",
                      }}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between mt-1">
                {levelOrder.map((lvl, i) => (
                  <span
                    key={lvl}
                    className="text-[9px] text-muted-foreground flex-1 text-center"
                  >
                    L{i + 1}
                  </span>
                ))}
              </div>
            </div>

            {/* Competency Breakdown */}
            <div className="max-w-lg mx-auto mb-10">
              <h3 className="text-sm font-semibold text-foreground mb-4 text-center">
                Competency Breakdown
              </h3>
              <div className="space-y-2">
                {Object.entries(COMPETENCIES).map(([code, cfg]) => {
                  const val = cert.competency_scores[code] ?? 0;
                  const pct = cfg.maxScore > 0 ? Math.round((val / cfg.maxScore) * 100) : 0;
                  return (
                    <div key={code} className="flex items-center gap-3">
                      <span className="text-xs font-medium text-muted-foreground w-8">{code}</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: getMaturityLevel(pct).hex,
                          }}
                        />
                      </div>
                      <span className="text-xs font-bold text-foreground w-10 text-right">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-border pt-6 flex items-center justify-between text-xs text-muted-foreground">
              <div>
                <div className="font-medium">Issued: {new Date(cert.issued_at).toLocaleDateString(undefined, {
                  year: "numeric", month: "long", day: "numeric",
                })}</div>
                {cert.expires_at && (
                  <div>Expires: {new Date(cert.expires_at).toLocaleDateString(undefined, {
                    year: "numeric", month: "long", day: "numeric",
                  })}</div>
                )}
              </div>
              <div className="text-right">
                <div className="font-mono text-[10px]">{code}</div>
                <div>Digital Skills Readiness Assessment</div>
              </div>
            </div>
          </div>
        </div>

        {/* Print-only verification note */}
        <div className="hidden print:block mt-4 text-center text-xs text-muted-foreground">
          Verify online: {typeof window !== "undefined" ? window.location.href : ""}
        </div>
      </div>
    </div>
  );
}
