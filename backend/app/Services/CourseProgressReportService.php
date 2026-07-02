<?php

namespace App\Services;

use App\Models\Course;
use App\Models\User;
use App\Models\UserCourse;
use Illuminate\Support\Collection;

class CourseProgressReportService
{
    /**
     * Org-wide course analytics: enrollment, completion, top performers, active learners.
     */
    public function courseProgress(): array
    {
        $courses = Course::withCount('enrollments')
            ->withAvg('ratings', 'rating')
            ->withCount('ratings')
            ->orderByDesc('created_at')
            ->get();

        $courseStats = $courses->map(fn($course) => $this->courseStatRow($course))
            ->sortByDesc('enrollment_count')
            ->values();

        $activeLearners = $this->activeLearners();

        return [
            'summary' => [
                'total_courses' => $courses->count(),
                'total_enrollments' => $courseStats->sum('enrollment_count'),
                'avg_completion_rate' => $courseStats->count() > 0 ? round($courseStats->avg('completion_rate'), 1) : 0,
                'avg_progress' => $courseStats->count() > 0 ? round($courseStats->avg('avg_progress'), 1) : 0,
            ],
            'courseStats' => $courseStats,
            'topCourses' => [
                'enrollment' => $courseStats->sortByDesc('enrollment_count')->take(5)->values(),
                'progress' => $courseStats->sortByDesc('avg_progress')->take(5)->values(),
                'completion' => $courseStats->sortByDesc('completion_rate')->take(5)->values(),
            ],
            'enhancedUsers' => $activeLearners,
        ];
    }

    private function courseStatRow(Course $course): array
    {
        $enrollments = UserCourse::where('course_id', $course->id)->get();
        $total = $enrollments->count();
        $completed = $enrollments->where('status', 'completed')->count();
        $avgProgress = $total > 0 ? $enrollments->avg('progress') : 0;

        return [
            'id' => $course->id,
            'title' => $course->title,
            'title_bm' => $course->title_bm,
            'level' => $course->level,
            'enrollment_count' => $total,
            'completion_rate' => $total > 0 ? round(($completed / $total) * 100, 1) : 0,
            'avg_progress' => round($avgProgress, 1),
            'avg_rating' => $course->ratings_avg_rating ? round($course->ratings_avg_rating, 1) : null,
            'ratings_count' => $course->ratings_count,
        ];
    }

    private function activeLearners(): Collection
    {
        return User::whereHas('userCourses')
            ->with('userCourses.course')
            ->get()
            ->map(function ($user) {
                $ucs = $user->userCourses;
                $total = $ucs->count();
                $completed = $ucs->where('status', 'completed')->count();
                $avgProgress = $total > 0 ? $ucs->avg('progress') : 0;

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'total_courses' => $total,
                    'completed_courses' => $completed,
                    'avg_progress' => round($avgProgress, 1),
                    'status' => $avgProgress >= 100 ? 'completed' : ($avgProgress > 0 ? 'active' : 'inactive'),
                ];
            });
    }
}
