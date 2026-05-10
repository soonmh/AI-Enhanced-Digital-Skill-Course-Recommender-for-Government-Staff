"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Mail, Lock, Eye, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import api from "@/lib/axios";

export default function RegisterPage() {
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
      const message = err instanceof Error ? err.message : "Registration failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [field]: e.target.value });

  return (
    <Card className="border-0 shadow-xl backdrop-blur-sm bg-white/95">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl font-bold text-gray-900">Create an account</CardTitle>
        <CardDescription className="text-gray-600">Enter your details to get started</CardDescription>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <User className="w-4 h-4 text-gray-500" />
                Full name
              </Label>
              <Input
                id="name"
                value={form.name}
                onChange={update("name")}
                placeholder="Enter your full name"
                className="pl-4"
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Mail className="w-4 h-4 text-gray-500" />
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={update("email")}
                placeholder="you@example.com"
                className="pl-4"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Lock className="w-4 h-4 text-gray-500" />
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={update("password")}
                placeholder="Create a password"
                className="pl-4"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password_confirmation" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Eye className="w-4 h-4 text-gray-500" />
                Confirm password
              </Label>
              <Input
                id="password_confirmation"
                type="password"
                value={form.password_confirmation}
                onChange={update("password_confirmation")}
                placeholder="Confirm your password"
                className="pl-4"
                required
              />
            </div>
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">
                {error}
              </div>
            )}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2.5 mt-6"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {loading ? "Creating account..." : "Create account"}
            </Button>
          </div>
          <div className="text-center text-sm text-gray-600 pt-4 border-t">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-600 hover:text-blue-800 font-medium">
              Sign in
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
