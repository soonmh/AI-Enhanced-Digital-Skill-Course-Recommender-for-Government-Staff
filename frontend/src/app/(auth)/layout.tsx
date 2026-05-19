"use client";

import Link from "next/link";
import { Brain } from "lucide-react";
import { I18nProvider, useTranslation } from "@/i18n/context";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <AuthLayoutContent>{children}</AuthLayoutContent>
    </I18nProvider>
  );
}

function AuthLayoutContent({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute top-10 left-10 w-20 h-20 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl animate-pulse" />
        <div className="absolute top-40 right-20 w-32 h-32 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl animate-pulse [animation-delay:1000ms]" />
        <div className="absolute bottom-20 left-1/3 w-28 h-28 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl animate-pulse [animation-delay:500ms]" />
      </div>

      <div className="relative flex min-h-screen flex-col items-center justify-center p-4 sm:p-6">
        {/* Back to Home link */}
        <div className="absolute top-4 left-4 sm:top-8 sm:left-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            {t("auth.backToHome")}
          </Link>
        </div>

        <div className="w-full max-w-md">
          {/* Logo branding */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                <Brain className="w-7 h-7 text-white" />
              </div>
              <div className="text-left">
                <div className="text-2xl font-bold text-foreground">{t("auth.brandName")}</div>
                <div className="text-sm text-muted-foreground">{t("auth.brandSubtitle")}</div>
              </div>
            </Link>
          </div>

          {/* Card */}
          {children}

          {/* Copyright */}
          <div className="text-center mt-6 text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} {t("landing.footerCopyright")}
          </div>
        </div>
      </div>
    </div>
  );
}
