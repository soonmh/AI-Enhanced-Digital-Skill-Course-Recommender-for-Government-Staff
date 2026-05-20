"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import api from "@/lib/axios";
import { useTranslation } from "@/i18n/context";

export default function RegisterPage() {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
    working_field: "",
    job_level: "",
    experience_years: "",
  });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.get("/sanctum/csrf-cookie");
      await api.post("/api/register", form);
      router.push("/login");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const message = axiosErr.response?.data?.message || "Registration failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [field]: e.target.value });

  return (
    <Card className="border-0 shadow-xl backdrop-blur-sm bg-card/95">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl font-bold text-foreground">{t("auth.registerTitle")}</CardTitle>
        <CardDescription className="text-muted-foreground">{t("auth.registerDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2 text-sm font-medium text-foreground">
                <User className="w-4 h-4 text-muted-foreground" />
                {t("auth.fullNameLabel")}
              </Label>
              <Input
                id="name"
                value={form.name}
                onChange={update("name")}
                placeholder={t("auth.fullNamePlaceholder")}
                className="pl-4"
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Mail className="w-4 h-4 text-muted-foreground" />
                {t("auth.emailLabel")}
              </Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={update("email")}
                placeholder={t("auth.emailPlaceholder")}
                className="pl-4"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Lock className="w-4 h-4 text-muted-foreground" />
                {t("auth.passwordLabel")}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={update("password")}
                  placeholder={t("auth.passwordPlaceholder")}
                  className="pl-4 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password_confirmation" className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Eye className="w-4 h-4 text-muted-foreground" />
                {t("auth.confirmPasswordLabel")}
              </Label>
              <div className="relative">
                <Input
                  id="password_confirmation"
                  type={showConfirm ? "text" : "password"}
                  value={form.password_confirmation}
                  onChange={update("password_confirmation")}
                  placeholder={t("auth.confirmPasswordPlaceholder")}
                  className="pl-4 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-500/10 rounded-md border border-red-200">
                {error}
              </div>
            )}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2.5 mt-6"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {loading ? t("auth.creatingAccount") : t("auth.createAccountButton")}
            </Button>
          </div>
          <div className="text-center text-sm text-muted-foreground pt-4 border-t">
            {t("auth.alreadyHaveAccount")}{" "}
            <Link href="/login" className="text-primary hover:text-primary/80 font-medium">
              {t("auth.signInLink")}
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
