<?php

namespace App\Services;

use App\Models\AssessmentResponse;
use App\Models\Course;
use App\Models\User;
use Illuminate\Support\Collection;

class ContentBasedRecommendationService
{
    public function __construct(private DsriCalculationService $dsriService) {}

    /**
     * Build a normalized deficit vector for a user.
     * Each value = 1.0 - (score / max_score), so weak areas get high values.
     */
    public function getUserDeficitVector(AssessmentResponse $response): array
    {
        $competencies = $this->dsriService->getCompetencies();
        $vector = [];

        foreach ($competencies as $code => $config) {
            $field = strtolower($code) . '_score';
            $score = $response->$field ?? 0;
            $vector[$code] = round(1.0 - ($score / $config['max_score']), 6);
        }

        return $vector;
    }

    /**
     * Build a course's competency coverage vector.
     * 1.0 if the course covers the competency, 0.0 otherwise.
     */
    public function getCourseCompetencyVector(Course $course): array
    {
        $codes = $course->competencyMappings()->pluck('competency_code')->toArray();
        $vector = [];

        foreach (array_keys($this->dsriService->getCompetencies()) as $code) {
            $vector[$code] = in_array($code, $codes) ? 1.0 : 0.0;
        }

        return $vector;
    }

    /**
     * Cosine similarity between deficit and course vectors, multiplied by difficulty factor.
     */
    public function computeContentScore(array $deficitVector, array $courseVector, string $courseLevel, float $dsri): float
    {
        $cosine = $this->cosineSimilarity($deficitVector, $courseVector);
        $difficulty = $this->computeDifficultyFactor($courseLevel, $dsri);

        return round($cosine * $difficulty, 6);
    }

    /**
     * Difficulty match factor based on DSRI level vs course level.
     */
    public function computeDifficultyFactor(string $courseLevel, float $dsri): float
    {
        $map = [
            'beginner'     => [0 => 1.0, 41 => 0.8, 61 => 0.5],
            'intermediate' => [0 => 0.6, 41 => 1.0, 61 => 0.8],
            'advanced'     => [0 => 0.3, 41 => 0.7, 61 => 1.0],
        ];

        $thresholds = $map[$courseLevel] ?? $map['beginner'];

        if ($dsri >= 61) {
            return $thresholds[61];
        } elseif ($dsri >= 41) {
            return $thresholds[41];
        }

        return $thresholds[0];
    }

    /**
     * Get top N content-based recommendations for a user.
     */
    public function getRecommendations(User $user, int $limit = 20): Collection
    {
        $response = $user->latestAssessmentResponse;

        if (!$response) {
            return collect();
        }

        $deficitVector = $this->getUserDeficitVector($response);
        $enrolledIds = $user->userCourses()->pluck('course_id')->toArray();

        $courses = Course::whereNotIn('id', $enrolledIds)
            ->with('competencyMappings')
            ->withCount('enrollments')
            ->withAvg('ratings', 'rating')
            ->get();

        $results = $courses->map(function ($course) use ($deficitVector, $response) {
            $courseVector = $this->getCourseCompetencyVector($course);

            // Skip courses with no competency mappings
            if (array_sum($courseVector) === 0.0) {
                return null;
            }

            $score = $this->computeContentScore(
                $deficitVector,
                $courseVector,
                $course->level ?? 'beginner',
                $response->dsri ?? 0
            );

            $matchedCompetencies = [];
            $competencies = $this->dsriService->getCompetencies();
            foreach ($courseVector as $code => $covers) {
                if ($covers > 0 && $deficitVector[$code] > 0.3) {
                    $field = strtolower($code) . '_score';
                    $matchedCompetencies[$code] = [
                        'code' => $code,
                        'name' => $competencies[$code]['name_en'],
                        'user_pct' => round(($response->$field ?? 0) / $competencies[$code]['max_score'] * 100, 1),
                        'deficit' => $deficitVector[$code],
                    ];
                }
            }

            return [
                'course_id' => $course->id,
                'score' => $score,
                'course' => $course,
                'matched_competencies' => $matchedCompetencies,
                'course_vector' => $courseVector,
            ];
        })->filter()->sortByDesc('score')->take($limit)->values();

        return $results;
    }

    private function cosineSimilarity(array $a, array $b): float
    {
        $dotProduct = 0.0;
        $normA = 0.0;
        $normB = 0.0;

        foreach ($a as $key => $val) {
            $bVal = $b[$key] ?? 0.0;
            $dotProduct += $val * $bVal;
            $normA += $val * $val;
            $normB += $bVal * $bVal;
        }

        $denominator = sqrt($normA) * sqrt($normB);

        return $denominator > 0 ? round($dotProduct / $denominator, 6) : 0.0;
    }
}
