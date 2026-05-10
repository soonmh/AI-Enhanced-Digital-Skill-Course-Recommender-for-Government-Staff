"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/axios";
import api from "@/lib/axios";
import type { DashboardData, AssessmentStartData, AssessmentResultsData, User } from "@/types";

export function useDashboard() {
  const { data, error, isLoading, mutate } = useSWR<DashboardData>("/api/dashboard", fetcher);
  return { dashboard: data, isLoading, isError: error, refresh: mutate };
}

export function useAssessmentStart() {
  const { data, error, isLoading } = useSWR<AssessmentStartData>("/api/assessment/start", fetcher);
  return { data, isLoading, isError: error };
}

export function useAssessmentResults() {
  const { data, error, isLoading } = useSWR<AssessmentResultsData>("/api/assessment/results", fetcher);
  return { data, isLoading, isError: error };
}

export function useUser() {
  const { data, error, isLoading } = useSWR<User>("/api/user", fetcher);
  return { user: data, isLoading, isError: error };
}

export async function submitAssessment(responses: { section: string; score: number }[], assessmentId: number) {
  const result = await api.post("/api/assessment/submit", {
    assessment_id: assessmentId,
    responses,
  });
  return result.data;
}

export async function saveAssessmentDraft(answers: Record<string, number>, currentSection: number) {
  const result = await api.post("/api/assessment/draft", { answers, current_section: currentSection });
  return result.data;
}

export async function loadAssessmentDraft() {
  const result = await api.get("/api/assessment/draft");
  return result.data;
}

export async function clearAssessmentDraft() {
  await api.delete("/api/assessment/draft");
}

export async function updateProfile(data: Record<string, string>) {
  const result = await api.put("/api/user/profile", data);
  return result.data;
}

export async function updatePassword(currentPassword: string, newPassword: string) {
  const result = await api.put("/api/user/password", {
    current_password: currentPassword,
    password: newPassword,
    password_confirmation: newPassword,
  });
  return result.data;
}

export async function updateLanguage(locale: string) {
  const result = await api.put("/api/user/language", { locale });
  return result.data;
}

export function useCourses() {
  const { data, error, isLoading } = useSWR("/api/courses", fetcher);
  return { courses: data, isLoading, isError: error };
}

export function useCourse(id: string) {
  const { data, error, isLoading, mutate } = useSWR(id ? `/api/courses/${id}` : null, fetcher);
  return { course: data, isLoading, isError: error, mutate };
}

export function useRecommendedCourses() {
  const { data, error, isLoading } = useSWR("/api/courses/recommended", fetcher);
  return {
    courses: data?.courses ?? data,
    hasAssessment: data?.has_assessment ?? false,
    weakSections: data?.weak_sections ?? [],
    isLoading,
    isError: error,
  };
}

export async function createCourse(formData: Record<string, string>) {
  const result = await api.post("/api/courses", formData);
  return result.data;
}

export async function updateCourse(id: string, formData: Record<string, string>) {
  const result = await api.put(`/api/courses/${id}`, formData);
  return result.data;
}

export async function deleteCourse(id: string) {
  await api.delete(`/api/courses/${id}`);
}

export async function enrollCourse(id: string) {
  const result = await api.post(`/api/courses/${id}/enroll`);
  return result.data;
}

export async function rateCourse(id: string, rating: number) {
  const result = await api.post(`/api/courses/${id}/rate`, { rating });
  return result.data;
}

export function useUsers() {
  const { data, error, isLoading, mutate } = useSWR("/api/admin/users", fetcher);
  return { users: data, isLoading, isError: error, mutate };
}

export function useStaffAnalysis() {
  const { data, error, isLoading } = useSWR("/api/reports/staff-analysis", fetcher);
  return { data, isLoading, isError: error };
}

export function useStaffReport(id: string) {
  const { data, error, isLoading } = useSWR(id ? `/api/reports/staff/${id}` : null, fetcher);
  return { data, isLoading, isError: error };
}

export function useCourseProgress() {
  const { data, error, isLoading } = useSWR("/api/reports/course-progress", fetcher);
  return { data, isLoading, isError: error };
}

export async function updateUser(id: string, data: Record<string, string>) {
  const result = await api.put(`/api/admin/users/${id}`, data);
  return result.data;
}

export async function createUser(data: Record<string, string>) {
  const result = await api.post("/api/admin/users", data);
  return result.data;
}

export async function assignCoursesToUser(userId: string, courseIds: number[]) {
  const result = await api.post(`/api/admin/users/${userId}/assign-courses`, { course_ids: courseIds });
  return result.data;
}

export async function assignCourseToUsers(courseId: string, userIds: number[]) {
  const result = await api.post(`/api/admin/courses/${courseId}/assign-users`, { user_ids: userIds });
  return result.data;
}

export async function deleteUser(id: string) {
  await api.delete(`/api/admin/users/${id}`);
}

export async function unassignUsersFromCourse(courseId: string, userIds: number[]) {
  const result = await api.delete(`/api/admin/courses/${courseId}/unassign-users`, {
    data: { user_ids: userIds },
  });
  return result.data;
}

export function useAssignedCourses(userId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<number[]>(
    userId ? `/api/admin/users/${userId}/assigned-courses` : null,
    fetcher
  );
  return { assignedCourseIds: data ?? [], isLoading, isError: error, mutate };
}

export function useAssignedUsers(courseId: string | null) {
  const { data, error, isLoading } = useSWR<number[]>(
    courseId ? `/api/admin/courses/${courseId}/assigned-users` : null,
    fetcher
  );
  return { assignedUserIds: data ?? [], isLoading, isError: error };
}

export async function unassignCoursesFromUser(userId: string, courseIds: number[]) {
  const result = await api.delete(`/api/admin/users/${userId}/unassign-courses`, {
    data: { course_ids: courseIds },
  });
  return result.data;
}

export function useAiInsights() {
  const { data, error, isLoading } = useSWR("/api/ai/insights", fetcher);
  return { insights: data, isLoading, isError: error };
}

export function useDepartmentInsights() {
  const { data, error, isLoading } = useSWR("/api/ai/department-insights", fetcher);
  return { insights: data, isLoading, isError: error };
}

export function useDepartmentComparison() {
  const { data, error, isLoading } = useSWR("/api/reports/department-comparison", fetcher);
  return { data, isLoading, isError: error };
}

export function useNotifications() {
  const { data, error, isLoading, mutate } = useSWR("/api/notifications", fetcher);
  return { notifications: data, isLoading, isError: error, mutate };
}

export function useUnreadCount() {
  const { data, error, isLoading, mutate } = useSWR("/api/notifications/unread-count", fetcher, {
    refreshInterval: 30000,
  });
  return { count: data?.count ?? 0, isLoading, mutate };
}

export async function markNotificationRead(id: string) {
  await api.put(`/api/notifications/${id}/read`);
}

export async function markAllNotificationsRead() {
  await api.put("/api/notifications/read-all");
}
