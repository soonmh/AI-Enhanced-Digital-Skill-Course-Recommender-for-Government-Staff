"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import api from "@/lib/axios";
import { useTranslation } from "@/i18n/context";

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.get("/sanctum/csrf-cookie");
      await api.post("/api/forgot-password", { email });
      setSent(true);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-0 shadow-xl backdrop-blur-sm bg-card/95">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl font-bold text-foreground">{t("auth.forgotPasswordTitle")}</CardTitle>
        <CardDescription className="text-muted-foreground">{t("auth.forgotPasswordDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        {sent ? (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-200 rounded-lg flex items-center gap-2">
            <span className="text-sm text-green-700">{t("auth.resetLinkSent")}</span>
          </div>
        ) : (
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
                  autoFocus
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2.5"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {loading ? t("auth.sending") : t("auth.sendResetLink")}
              </Button>
            </div>
            <div className="text-center text-sm text-muted-foreground pt-4 border-t">
              <Link href="/login" className="text-primary hover:text-primary/80 font-medium">
                {t("auth.backToLogin")}
              </Link>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
