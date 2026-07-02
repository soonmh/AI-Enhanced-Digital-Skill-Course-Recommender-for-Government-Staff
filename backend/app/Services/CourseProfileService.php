<?php

namespace App\Services;

use App\Models\Course;
use App\Models\CourseRating;
use App\Models\User;
use App\Models\UserCourse;
use Illuminate\Database\Eloquent\Collection;

class CourseProfileService
{
    public function __construct(private DsriCalculationService $dsriService) {}

    /**
     * Build the full course detail payload for a given viewer.
     */
    public function buildProfile(Course $course, ?User $viewer): array
    {
        return [
            'id' => $course->id,
            'title' => $course->title,
            'title_bm' => $course->title_bm,
            'description' => $course->description,
            'description_bm' => $course->description_bm,
            'level' => $course->level,
            'image' => $course->image,
            'url' => $course->url,
            'remark' => $course->remark,
            'enrollment_count' => $course->enrollments_count,
            'avg_rating' => $course->ratings_avg_rating ? round($course->ratings_avg_rating, 1) : null,
            'ratings_count' => $course->ratings_count,
            'created_by' => $course->creator?->name,
            'created_at' => $course->created_at,
            ...$this->viewerContext($course->id, $viewer),
            'recent_reviews' => $this->recentReviews($course->id),
            'rating_distribution' => $this->ratingDistribution($course->id),
            'peer_enrollments' => $this->peerEnrollments($course->id, $viewer?->id),
            'competency_breakdown' => $this->competencyBreakdown($course, $viewer?->latestAssessmentResponse),
        ];
    }

    /**
     * Viewer-specific fields: enrollment state, progress, their rating.
     */
    private function viewerContext(int $courseId, ?User $viewer): array
    {
        if (!$viewer) {
            return [
                'user_rating' => null,
                'enrolled' => false,
                'enrollment_status' => null,
                'progress' => null,
            ];
        }

        $enrollment = UserCourse::where('user_id', $viewer->id)
            ->where('course_id', $courseId)
            ->first();

        $userRating = CourseRating::where('user_id', $viewer->id)
            ->where('course_id', $courseId)
            ->value('rating');

        return [
            'user_rating' => $userRating,
            'enrolled' => $enrollment !== null,
            'enrollment_status' => $enrollment?->status,
            'progress' => $enrollment?->progress,
        ];
    }

    private function recentReviews(int $courseId): array
    {
        return CourseRating::where('course_id', $courseId)
            ->with('user:id,name')
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn($r) => [
                'user_name' => $r->user?->name ?? 'Anonymous',
                'rating' => $r->rating,
                'created_at' => $r->created_at,
            ])
            ->toArray();
    }

    private function ratingDistribution(int $courseId): array
    {
        $distribution = [];
        for ($i = 5; $i >= 1; $i--) {
            $distribution[$i] = CourseRating::where('course_id', $courseId)->where('rating', $i)->count();
        }
        return $distribution;
    }

    private function peerEnrollments(int $courseId, ?int $viewerId): array
    {
        return UserCourse::where('course_id', $courseId)
            ->when($viewerId, fn($q) => $q->where('user_id', '!=', $viewerId))
            ->with('user:id,name,working_field')
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn($uc) => [
                'name' => $uc->user?->name ?? 'Anonymous',
                'field' => $uc->user?->working_field,
                'progress' => $uc->progress,
            ])
            ->toArray();
    }

    /**
     * Each competency the course covers, with the viewer's current score for context.
     */
    private function competencyBreakdown(Course $course, $viewerResponse): array
    {
        $codes = $course->competencyMappings()->pluck('competency_code')->toArray();
        if (empty($codes)) {
            return [];
        }

        $competencies = $this->dsriService->getCompetencies();
        $breakdown = [];

        foreach ($codes as $code) {
            $config = $competencies[$code] ?? null;
            if (!$config) continue;

            $field = strtolower($code) . '_score';
            $userScore = $viewerResponse?->$field ?? 0;

            $breakdown[] = [
                'code' => $code,
                'name_en' => $config['name_en'],
                'name_ms' => $config['name_ms'],
                'weight' => $config['weight'],
                'max_score' => $config['max_score'],
                'user_score' => $userScore,
                'user_pct' => round(($userScore / $config['max_score']) * 100, 1),
            ];
        }

        return $breakdown;
    }
}
