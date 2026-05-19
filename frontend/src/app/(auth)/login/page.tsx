"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Loader2, CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useTranslation } from "@/i18n/context";

export default function LoginPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [status] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
        setLoading(false);
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("Invalid email or password");
      setLoading(false);
    }
  };

  return (
    <Card className="border-0 shadow-xl backdrop-blur-sm bg-card/95">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl font-bold text-foreground">{t("auth.loginTitle")}</CardTitle>
        <CardDescription className="text-muted-foreground">{t("auth.loginDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        {status && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-200 rounded-lg flex items-center gap-2">
            <CircleCheck className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-700">{status}</span>
          </div>
        )}
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
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  {t("auth.passwordLabel")}
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-primary hover:text-primary/80"
                >
                  {t("auth.forgotPassword")}
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("auth.passwordPlaceholder")}
                className="pl-4"
                required
              />
            </div>
            <div className="flex items-center justify-between" tabIndex={3}>
              <Label htmlFor="remember" className="flex items-center space-x-3 text-sm cursor-pointer">
                <input
                  id="remember"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="size-5 shrink-0 rounded-sm border border-input"
                  tabIndex={4}
                />
                <span className="text-foreground">{t("auth.rememberMe")}</span>
              </Label>
            </div>
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-500/10 rounded-md border border-red-200">
                {error}
              </div>
            )}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2.5"
              tabIndex={4}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {loading ? t("auth.signingIn") : t("auth.signIn")}
            </Button>
          </div>
          <div className="text-center text-sm text-muted-foreground pt-4 border-t">
            {t("auth.noAccount")}{" "}
            <Link href="/register" className="text-primary hover:text-primary/80 font-medium">
              {t("auth.createAccount")}
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
