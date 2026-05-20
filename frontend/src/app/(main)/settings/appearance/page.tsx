"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useTranslation } from "@/i18n/context";
import { User, Lock, Sun, Moon, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function AppearancePage() {
  const { theme, setTheme } = useTheme();
  const { locale, setLocale, t } = useTranslation();

  const handleLanguageChange = async (newLocale: "en" | "ms") => {
    try {
      await setLocale(newLocale);
    } catch {}
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="px-6 py-8 w-full max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">{t("settings.settingsTitle")}</h1>
          <p className="text-muted-foreground text-lg">{t("settings.settingsDescription")}</p>
        </div>

        <Card className="mb-8 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              {t("settings.settingsMenu")}
            </CardTitle>
            <CardDescription>{t("settings.settingsMenuDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link
                href="/settings/profile"
                className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:bg-accent hover:border-gray-300 transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-lg">
                    <User className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{t("settings.profileTab")}</h3>
                    <p className="text-sm text-muted-foreground">{t("settings.profileTabDescription")}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </Link>
              <Link
                href="/settings/password"
                className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:bg-accent hover:border-gray-300 transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-lg">
                    <Lock className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{t("settings.passwordTab")}</h3>
                    <p className="text-sm text-muted-foreground">{t("settings.passwordTabDescription")}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </Link>
              <div className="flex items-center justify-between p-4 bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-500/15 rounded-lg">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="4" />
                      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-blue-900 dark:text-blue-300">{t("settings.appearanceTab")}</h3>
                    <p className="text-sm text-blue-600 dark:text-blue-400">{t("settings.appearanceTabDescription")}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300">{t("settings.currentBadge")}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
              </svg>
              {t("settings.appearanceTitle")}
            </CardTitle>
            <CardDescription>{t("settings.appearanceDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-8">
              <div className="space-y-3">
                <Label className="text-sm font-medium">{t("settings.languageLabel")}</Label>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleLanguageChange("en")}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-colors border ${
                      locale === "en"
                        ? "bg-blue-600 text-white border-blue-600 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30"
                        : "bg-card text-foreground border-border hover:bg-accent"
                    }`}
                  >
                    <span>🇬🇧</span>
                    <span>{t("settings.english")}</span>
                  </button>
                  <button
                    onClick={() => handleLanguageChange("ms")}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-colors border ${
                      locale === "ms"
                        ? "bg-blue-600 text-white border-blue-600 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30"
                        : "bg-card text-foreground border-border hover:bg-accent"
                    }`}
                  >
                    <span>🇲🇾</span>
                    <span>{t("settings.bahasaMelayu")}</span>
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                <Label className="text-sm font-medium">{t("settings.themeLabel")}</Label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setTheme("light")}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-colors border ${
                      theme === "light"
                        ? "bg-blue-600 text-white border-blue-600 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30"
                        : "bg-card text-foreground border-border hover:bg-accent"
                    }`}
                  >
                    <Sun className="w-4 h-4" />
                    <span>{t("settings.light")}</span>
                  </button>
                  <button
                    onClick={() => setTheme("dark")}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-colors border ${
                      theme === "dark"
                        ? "bg-blue-600 text-white border-blue-600 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30"
                        : "bg-card text-foreground border-border hover:bg-accent"
                    }`}
                  >
                    <Moon className="w-4 h-4" />
                    <span>{t("settings.dark")}</span>
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
