"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useUser, updateProfile } from "@/hooks/useApi";
import { useTranslation } from "@/i18n/context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  User,
  Lock,
  ChevronRight,
  Mail,
  Briefcase,
  TrendingUp,
  Clock,
} from "lucide-react";

const WORKING_FIELDS = [
  "Information Technology",
  "Education",
  "Healthcare",
  "Finance",
  "Manufacturing",
  "Retail",
  "Others",
];

const JOB_LEVELS = [
  "Intern",
  "Clerk",
  "Entry Level",
  "Mid Level",
  "Senior Level",
  "Senior Executive",
  "Executive",
  "Manager",
  "Assistant Director",
  "Deputy Director",
  "Director",
];

const EXPERIENCE_RANGES = [
  "0-1 years",
  "2-5 years",
  "5-10 years",
  "10+ years",
];

export default function ProfilePage() {
  const { user } = useUser();
  const { t } = useTranslation();
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    working_field: user?.working_field || "",
    job_level: user?.job_level || "",
    experience_years: user?.experience_years || "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        email: user.email || "",
        working_field: user.working_field || "",
        job_level: user.job_level || "",
        experience_years: user.experience_years || "",
      });
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile(form);
      toast.success(t("common.saved"));
    } catch {
      toast.error(t("settings.profileUpdateFailed"));
    } finally {
      setSaving(false);
    }
  };

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [field]: e.target.value });

  return (
    <div className="min-h-screen bg-background">
      <div className="px-6 py-8 w-full max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">{t("settings.settingsTitle")}</h1>
          <p className="text-muted-foreground text-lg">{t("settings.settingsDescription")}</p>
        </div>

        {/* Settings Nav Card */}
        <Card className="mb-8 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Settings className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              {t("settings.settingsMenu")}
            </CardTitle>
            <CardDescription>{t("settings.settingsMenuDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-4 bg-primary/10 border border-primary/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-500/15 rounded-lg">
                    <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-primary">{t("settings.profileTab")}</h3>
                    <p className="text-sm text-primary">{t("settings.profileTabDescription")}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-primary/20 text-primary">{t("settings.currentBadge")}</Badge>
              </div>
              <Link
                href="/settings/password"
                className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:bg-accent hover:border-accent transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-lg">
                    <Lock className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{t("settings.passwordTab")}</h3>
                    <p className="text-sm text-muted-foreground">{t("settings.passwordTabDescription")}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </Link>
              <Link
                href="/settings/appearance"
                className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:bg-accent hover:border-accent transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-lg">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="4" />
                      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{t("settings.appearanceTab")}</h3>
                    <p className="text-sm text-muted-foreground">{t("settings.appearanceTabDescription")}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Profile Form Card */}
        <Card className="mb-8 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              {t("settings.profileInformation")}
            </CardTitle>
            <CardDescription>{t("settings.profileInformationDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid gap-2">
                <Label htmlFor="name" className="flex items-center gap-2 text-sm font-medium">
                  <User className="w-4 h-4 text-muted-foreground" />
                  {t("settings.fullNameLabel")}
                </Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={update("name")}
                  required
                  placeholder={t("settings.fullNamePlaceholder")}
                  className="mt-1 block w-full"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  {t("settings.emailAddressLabel")}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={update("email")}
                  required
                  placeholder={t("settings.emailAddressPlaceholder")}
                  className="mt-1 block w-full"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="working_field" className="flex items-center gap-2 text-sm font-medium">
                  <Briefcase className="w-4 h-4 text-muted-foreground" />
                  {t("settings.workingFieldLabel")}
                </Label>
                <select
                  id="working_field"
                  value={form.working_field}
                  onChange={update("working_field")}
                  className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">{t("settings.selectWorkingField")}</option>
                  {WORKING_FIELDS.map((f) => (
                    <option key={f} value={f}>{t(`settings.workingField${f.replace(/[^a-zA-Z]/g, "")}`)}</option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="job_level" className="flex items-center gap-2 text-sm font-medium">
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  {t("settings.jobLevelLabel")}
                </Label>
                <select
                  id="job_level"
                  value={form.job_level}
                  onChange={update("job_level")}
                  className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">{t("settings.selectJobLevel")}</option>
                  {JOB_LEVELS.map((l) => (
                    <option key={l} value={l}>{t(`settings.jobLevel${l.replace(/[^a-zA-Z]/g, "")}`)}</option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="experience_years" className="flex items-center gap-2 text-sm font-medium">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  {t("settings.experienceYearsLabel")}
                </Label>
                <select
                  id="experience_years"
                  value={form.experience_years}
                  onChange={update("experience_years")}
                  className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">{t("settings.selectExperienceRange")}</option>
                  {EXPERIENCE_RANGES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-4 pt-4 border-t">
                <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary/90 dark:bg-violet-500/20 dark:text-violet-300 dark:hover:bg-violet-500/30">
                  {saving ? t("common.saving") : t("settings.saveChanges")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Settings({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
