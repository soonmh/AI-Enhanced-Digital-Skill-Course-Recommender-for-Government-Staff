"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail, Eye, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import api from "@/lib/axios";
import { useTranslation } from "@/i18n/context";

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">{t("common.loading")}</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.get("/sanctum/csrf-cookie");
      await api.post("/api/reset-password", {
        token: searchParams.get("token") || "",
        email,
        password,
        password_confirmation: passwordConfirmation,
      });
      router.push("/login");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to reset password";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-0 shadow-xl backdrop-blur-sm bg-card/95">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl font-bold text-foreground">{t("auth.resetPasswordTitle")}</CardTitle>
        <CardDescription className="text-muted-foreground">
          {t("auth.resetPasswordDescription")}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Mail className="w-4 h-4 text-muted-foreground" />
                {t("auth.emailLabel")}
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("auth.emailPlaceholder")}
                className="pl-4"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Lock className="w-4 h-4 text-muted-foreground" />
                {t("auth.newPasswordLabel")}
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("auth.newPasswordPlaceholder")}
                className="pl-4"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password_confirmation" className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Eye className="w-4 h-4 text-muted-foreground" />
                {t("auth.confirmPasswordLabel")}
              </Label>
              <Input
                id="password_confirmation"
                type="password"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                placeholder={t("auth.confirmPasswordPlaceholder")}
                className="pl-4"
                required
              />
            </div>
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-500/10 rounded-md border border-red-200">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2.5 rounded-md disabled:opacity-50 transition-colors"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2 inline" />}
              {loading ? t("auth.resetting") : t("auth.resetButton")}
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
