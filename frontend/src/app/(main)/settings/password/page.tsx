"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { updatePassword } from "@/hooks/useApi";
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
  Shield,
  Eye,
  Key,
} from "lucide-react";

export default function PasswordPage() {
  const { t } = useTranslation();
  const [current, setCurrent] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass !== confirm) {
      toast.error(t("settings.passwordMismatch"));
      return;
    }
    setSaving(true);
    try {
      await updatePassword(current, newPass);
      toast.success(t("settings.passwordUpdated"));
      setCurrent("");
      setNewPass("");
      setConfirm("");
    } catch {
      toast.error(t("settings.passwordUpdateFailed"));
    } finally {
      setSaving(false);
    }
  };

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
              <Link
                href="/settings/profile"
                className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:bg-accent hover:border-accent transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-lg">
                    <User className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{t("settings.profileTab")}</h3>
                    <p className="text-sm text-muted-foreground">{t("settings.profileTabDescription")}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </Link>
              <div className="flex items-center justify-between p-4 bg-primary/10 border border-primary/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-500/15 rounded-lg">
                    <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-primary">{t("settings.passwordTab")}</h3>
                    <p className="text-sm text-primary">{t("settings.passwordTabDescription")}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-primary/20 text-primary">{t("settings.currentBadge")}</Badge>
              </div>
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

        {/* Password Form Card */}
        <Card className="mb-8 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              {t("settings.updatePasswordTitle")}
            </CardTitle>
            <CardDescription>{t("settings.updatePasswordDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid gap-2">
                <Label htmlFor="current_password" className="flex items-center gap-2 text-sm font-medium">
                  <Key className="w-4 h-4 text-muted-foreground" />
                  {t("settings.currentPasswordLabel")}
                </Label>
                <Input
                  id="current_password"
                  type="password"
                  value={current}
                  onChange={(e) => setCurrent(e.target.value)}
                  required
                  placeholder={t("settings.currentPasswordPlaceholder")}
                  className="mt-1 block w-full"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password" className="flex items-center gap-2 text-sm font-medium">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  {t("settings.newPasswordLabel")}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  required
                  placeholder={t("settings.newPasswordPlaceholder")}
                  className="mt-1 block w-full"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password_confirmation" className="flex items-center gap-2 text-sm font-medium">
                  <Eye className="w-4 h-4 text-muted-foreground" />
                  {t("settings.confirmPasswordLabel")}
                </Label>
                <Input
                  id="password_confirmation"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  placeholder={t("settings.confirmPasswordPlaceholder")}
                  className="mt-1 block w-full"
                />
              </div>
              <div className="flex items-center gap-4 pt-4 border-t">
                <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary/90 dark:bg-violet-500/20 dark:text-violet-300 dark:hover:bg-violet-500/30">
                  {saving ? t("common.saving") : t("settings.updatePassword")}
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
