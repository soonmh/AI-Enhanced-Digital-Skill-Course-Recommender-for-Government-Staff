"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import api from "@/lib/axios";

export default function CreateCoursePage() {
  const [form, setForm] = useState({
    title: "",
    title_bm: "",
    description: "",
    description_bm: "",
    level: "beginner",
    working_field: "",
    material_title: "",
    material_type: "video",
    material_url: "",
  });
  const [uploadMode, setUploadMode] = useState<"file" | "url">("url");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.get("/sanctum/csrf-cookie");
      await api.post("/api/courses", form);
      router.push("/courses/list");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create course";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [field]: e.target.value });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="px-6 py-8 w-full max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Create Course</h1>
          <p className="text-gray-600 text-lg">Add a new course with learning materials</p>
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
              <CardTitle>Material</CardTitle>
              <CardDescription>Add learning material to the course</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="material_title">Material Title</Label>
                <Input id="material_title" value={form.material_title} onChange={update("material_title")} placeholder="e.g., Introduction Video" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="material_type">Type</Label>
                <select id="material_type" value={form.material_type} onChange={update("material_type")} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="video">Video</option>
                  <option value="document">Document</option>
                  <option value="quiz">Quiz</option>
                </select>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="upload_mode" checked={uploadMode === "file"} onChange={() => setUploadMode("file")} className="accent-violet-600" />
                  <span className="text-sm font-medium">Upload File</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="upload_mode" checked={uploadMode === "url"} onChange={() => setUploadMode("url")} className="accent-violet-600" />
                  <span className="text-sm font-medium">External URL</span>
                </label>
              </div>
              {uploadMode === "file" ? (
                <div className="grid gap-2">
                  <Label>File</Label>
                  <input type="file" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100" />
                </div>
              ) : (
                <div className="grid gap-2">
                  <Label htmlFor="material_url">URL</Label>
                  <Input id="material_url" type="url" value={form.material_url} onChange={update("material_url")} placeholder="https://..." />
                </div>
              )}
            </CardContent>
          </Card>

          {error && <div className="p-3 mb-4 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">{error}</div>}
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
