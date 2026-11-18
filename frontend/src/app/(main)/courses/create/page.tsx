"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import api from "@/lib/axios";
import { COMPETENCIES } from "@/lib/constants";

export default function CreateCoursePage() {
  const [form, setForm] = useState({
    title: "",
    title_bm: "",
    description: "",
    description_bm: "",
    level: "beginner",
    working_field: "",
    url: "",
    competency_codes: [] as string[],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.competency_codes.length === 0) {
      setError("Select at least one competency so the course can be recommended to users with that skill gap.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api.get("/sanctum/csrf-cookie");
      await api.post("/api/courses", form);
      router.push("/courses/list");
    } catch (err: unknown) {
      const apiMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      const message = apiMessage || (err instanceof Error ? err.message : "Failed to create course");
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [field]: e.target.value });

  const toggleCompetency = (code: string) =>
    setForm((f) => ({
      ...f,
      competency_codes: f.competency_codes.includes(code)
        ? f.competency_codes.filter((c) => c !== code)
        : [...f.competency_codes, code],
    }));

  return (
    <div className="min-h-screen bg-background">
      <div className="px-6 py-8 w-full max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Create Course</h1>
          <p className="text-gray-600 text-lg">Add a new course and map it to the competencies it covers</p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="mb-8 border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Course Details</CardTitle>
              <CardDescription>Provide the basic information about the course</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title (English)</Label>
                <Input id="title" value={form.title} onChange={update("title")} required placeholder="Course title in English" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="title_bm">Title (Bahasa Melayu)</Label>
                <Input id="title_bm" value={form.title_bm} onChange={update("title_bm")} placeholder="Course title in BM" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description (English)</Label>
                <textarea
                  id="description"
                  value={form.description}
                  onChange={update("description")}
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Describe the course in English"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description_bm">Description (Bahasa Melayu)</Label>
                <textarea
                  id="description_bm"
                  value={form.description_bm}
                  onChange={update("description_bm")}
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Describe the course in BM"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="level">Level</Label>
                <select id="level" value={form.level} onChange={update("level")} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="working_field">Working Field</Label>
                <Input id="working_field" value={form.working_field} onChange={update("working_field")} placeholder="e.g., Information Technology" />
              </div>
            </CardContent>
          </Card>

          <Card className="mb-8 border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Competencies &amp; Link</CardTitle>
              <CardDescription>The recommendation engine matches these competencies to users&apos; skill gaps</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Competencies Covered</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Object.values(COMPETENCIES).map((c) => (
                    <label key={c.code} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.competency_codes.includes(c.code)}
                        onChange={() => toggleCompetency(c.code)}
                        className="accent-violet-600"
                      />
                      <span><span className="font-medium">{c.code}</span> {c.nameEn}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="url">Course URL</Label>
                <Input id="url" type="url" value={form.url} onChange={update("url")} placeholder="https://..." />
              </div>
            </CardContent>
          </Card>

          {error && <div className="p-3 mb-4 text-sm text-red-600 bg-red-500/10 rounded-md border border-red-200">{error}</div>}
          <div className="flex gap-3">
            <Button type="submit" disabled={saving} className="bg-violet-600 hover:bg-violet-700">
              {saving ? "Creating..." : "Create Course"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
