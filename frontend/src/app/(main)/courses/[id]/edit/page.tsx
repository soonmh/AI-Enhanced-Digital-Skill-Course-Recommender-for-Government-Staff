"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useCourse, updateCourse, deleteCourse } from "@/hooks/useApi";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Loader2, Save, Trash2 } from "lucide-react";

export default function EditCoursePage() {
  const params = useParams();
  const router = useRouter();
  const { course, isLoading } = useCourse(params.id as string);

  const [form, setForm] = useState({
    title: "",
    title_bm: "",
    description: "",
    description_bm: "",
    level: "beginner",
    working_field: "",
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (course) {
      setForm({
        title: course.title || "",
        title_bm: course.title_bm || "",
        description: course.description || "",
        description_bm: course.description_bm || "",
        level: course.level || "beginner",
        working_field: course.working_field || "",
      });
    }
  }, [course]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Course not found</h3>
          <Link href="/courses/list" className="text-violet-600 font-medium">Back to courses</Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await updateCourse(params.id as string, form);
      router.push(`/courses/${params.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update course";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this course? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await deleteCourse(params.id as string);
      router.push("/courses/list");
    } catch {
      setError("Failed to delete course");
    } finally {
      setDeleting(false);
    }
  };

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [field]: e.target.value });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="px-6 py-8 w-full max-w-4xl mx-auto">
        <Link href={`/courses/${params.id}`} className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to course
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Edit Course</h1>
          <p className="text-gray-600 text-lg">Update course information</p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="mb-8 border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Course Details</CardTitle>
              <CardDescription>Update the basic information about the course</CardDescription>
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

          {error && <div className="p-3 mb-4 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">{error}</div>}
          <div className="flex justify-between">
            <div className="flex gap-3">
              <Button type="submit" disabled={saving} className="bg-violet-600 hover:bg-violet-700">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            </div>
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={deleting}>
              <Trash2 className="w-4 h-4 mr-2" />
              {deleting ? "Deleting..." : "Delete Course"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
