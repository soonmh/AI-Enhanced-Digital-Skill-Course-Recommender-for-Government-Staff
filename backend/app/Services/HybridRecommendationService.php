<?php

namespace App\Services;

use App\Models\Course;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

class HybridRecommendationService
{
    private const MIN_PEERS = 3;
    private const IDEAL_PEERS = 10;
    private const MAX_COLLAB_WEIGHT = 0.5;

    public function __construct(
        private ContentBasedRecommendationService $contentService,
        private CollaborativeFilteringService $collaborativeService,
        private AiInsightService $aiService,
        private DsriCalculationService $dsriService,
    ) {}

    /**
     * Main entry point: get hybrid recommendations for a user.
     */
    public function getRecommendations(User $user, string $locale = 'en', int $limit = 8): array
    {
        $abGroup = $this->getAbGroup($user);

        // A/B test: control group uses old algorithm
        if ($abGroup === 'control') {
            return $this->getLegacyRecommendations($user, $locale, $limit);
        }

        $response = $user->latestAssessmentResponse;

        // No assessment: fall back to popularity
        if (!$response) {
            return $this->getPopularityRecommendations($user, $locale, $limit);
        }

        $cacheKey = "hybrid_recommendations:{$user->id}";

        return Cache::remember($cacheKey, now()->addHours(6), function () use ($user, $response, $locale, $limit, $abGroup) {
            // Step 1: Get content-based results
            $contentResults = $this->contentService->getRecommendations($user, 20);

            // Step 2: Get collaborative results
            $similarUsers = $this->collaborativeService->findSimilarUsers($user);
            $collabResults = $this->collaborativeService->getRecommendations($user, 20);

            // Step 3: Compute adaptive weights
            $weights = $this->computeAdaptiveWeights($similarUsers);

            // Step 4: Merge results
            $merged = $this->mergeResults($contentResults, $collabResults, $weights);

            // Step 5: Build response
            $weakSections = $this->getWeakSections($response);

            $courses = $merged->take($limit)->map(function ($item) use ($user, $response, $locale, $weights, $similarUsers) {
                $course = $item['course'] ?? Course::find($item['course_id']);
                if (!$course) {
                    return null;
                }

                $contentScore = $item['content_score'] ?? 0;
                $collabScore = $item['collaborative_score'] ?? 0;
                $hybridScore = $item['hybrid_score'] ?? 0;
                $matchedComps = $item['matched_competencies'] ?? [];

                // Determine score method
                $scoreMethod = 'content_only';
                if ($collabScore > 0) {
                    $scoreMethod = 'hybrid';
                }

                // Generate enhanced AI explanation
                $explanationData = $this->buildExplanationData(
                    $user,
                    $course,
                    $contentScore,
                    $collabScore,
                    $weights,
                    $matchedComps,
                    $similarUsers
                );

                $competencyCodes = $course->competencyMappings()->pluck('competency_code')->toArray();

                // Build competency breakdown with user scores for each code the course covers
                $competencyBreakdown = [];
                $competencies = $this->dsriService->getCompetencies();
                foreach ($competencyCodes as $code) {
                    $config = $competencies[$code] ?? null;
                    if (!$config) continue;
                    $field = strtolower($code) . '_score';
                    $userPct = round(($response->$field ?? 0) / $config['max_score'] * 100, 1);
                    $competencyBreakdown[] = [
                        'code' => $code,
                        'name' => $config['name_en'],
                        'user_pct' => $userPct,
                    ];
                }

                return [
                    'id' => $course->id,
                    'title' => $course->title,
                    'title_bm' => $course->title_bm,
                    'description' => $course->description,
                    'level' => $course->level,
                    'image' => $course->image,
                    'working_field' => $course->working_field,
                    'enrollment_count' => $course->enrollments()->count(),
                    'avg_rating' => $course->ratings()->avg('rating')
                        ? round($course->ratings()->avg('rating'), 1) : null,
                    'ratings_count' => $course->ratings()->count(),
                    'match_percentage' => is_nan($hybridScore) ? 0 : (int) round($hybridScore * 100),
                    'competency_codes' => $competencyCodes,
                    'ai_explanation' => $this->aiService->generateEnhancedCourseExplanation(
                        $course->title,
                        $course->description ?? '',
                        $explanationData,
                        $locale
                    ),
                    'content_score' => round($contentScore, 4),
                    'collaborative_score' => $collabScore > 0 ? round($collabScore, 4) : null,
                    'hybrid_score' => round($hybridScore, 4),
                    'score_method' => $scoreMethod,
                    'peer_count' => $item['peer_count'] ?? 0,
                    'difficulty_match' => $item['difficulty_match'] ?? 1.0,
                    'competency_breakdown' => $competencyBreakdown,
                    'matched_weak_competencies' => array_values($matchedComps),
                    'ab_group' => $this->getAbGroup($user),
                ];
            })->filter()->values()->toArray();

            $peerCount = $similarUsers->count();

            return [
                'courses' => $courses,
                'has_assessment' => true,
                'weak_sections' => $weakSections,
                'recommendation_method' => $peerCount >= self::MIN_PEERS ? 'hybrid' : 'content_only',
                'content_weight' => $weights['content_weight'],
                'collaborative_weight' => $weights['collaborative_weight'],
                'total_peers' => $peerCount,
            ];
        });
    }

    /**
     * Adaptive weights based on peer availability.
     */
    public function computeAdaptiveWeights(Collection $similarUsers): array
    {
        $peerCount = $similarUsers->count();

        if ($peerCount < self::MIN_PEERS) {
            return ['content_weight' => 1.0, 'collaborative_weight' => 0.0];
        }

        if ($peerCount >= self::IDEAL_PEERS) {
            return ['content_weight' => 0.5, 'collaborative_weight' => self::MAX_COLLAB_WEIGHT];
        }

        // Linear ramp
        $wCollab = self::MAX_COLLAB_WEIGHT * ($peerCount - self::MIN_PEERS) / (self::IDEAL_PEERS - self::MIN_PEERS);

        return [
            'content_weight' => round(1.0 - $wCollab, 4),
            'collaborative_weight' => round($wCollab, 4),
        ];
    }

    /**
     * Merge content and collaborative results using adaptive weights.
     */
    public function mergeResults(Collection $contentResults, Collection $collabResults, array $weights): Collection
    {
        $wContent = $weights['content_weight'];
        $wCollab = $weights['collaborative_weight'];

        // Index by course_id
        $byCourse = [];

        foreach ($contentResults as $item) {
            $id = $item['course_id'];
            $byCourse[$id] = [
                'course_id' => $id,
                'course' => $item['course'] ?? null,
                'content_score' => $item['score'],
                'collaborative_score' => 0.0,
                'matched_competencies' => $item['matched_competencies'] ?? [],
                'peer_count' => 0,
                'difficulty_match' => $item['course']
                    ? $this->contentService->computeDifficultyFactor(
                        $item['course']->level ?? 'beginner',
                        0 // will be replaced
                    ) : 1.0,
            ];
        }

        foreach ($collabResults as $item) {
            $id = $item['course_id'];
            if (isset($byCourse[$id])) {
                $byCourse[$id]['collaborative_score'] = $item['score'];
                $byCourse[$id]['peer_count'] = $item['peer_count'] ?? 0;
            } elseif ($wCollab > 0) {
                $byCourse[$id] = [
                    'course_id' => $id,
                    'course' => null,
                    'content_score' => 0.0,
                    'collaborative_score' => $item['score'],
                    'matched_competencies' => [],
                    'peer_count' => $item['peer_count'] ?? 0,
                    'difficulty_match' => 1.0,
                ];
            }
        }

        // Compute hybrid score
        foreach ($byCourse as &$item) {
            $cs = $item['content_score'] ?? 0;
            $cf = $item['collaborative_score'] ?? 0;
            $raw = $wContent * $cs + $wCollab * $cf;
            $item['hybrid_score'] = is_nan($raw) ? 0 : round($raw, 6);
        }

        return collect(array_values($byCourse))->sortByDesc('hybrid_score')->values();
    }

    /**
     * Build explanation data for enhanced Gemini prompt.
     */
    public function buildExplanationData(
        User $user,
        Course $course,
        float $contentScore,
        float $collabScore,
        array $weights,
        array $matchedComps,
        Collection $similarUsers
    ): array {
        $response = $user->latestAssessmentResponse;

        return [
            'user_role' => $user->roles->first()?->name ?? 'Staff',
            'user_field' => $user->working_field ?? 'Not specified',
            'dsri' => $response?->dsri ?? 0,
            'content_score' => $contentScore,
            'collaborative_score' => $collabScore,
            'content_weight' => $weights['content_weight'],
            'collaborative_weight' => $weights['collaborative_weight'],
            'matched_competencies' => $matchedComps,
            'peer_count' => $similarUsers->count(),
            'course_level' => $course->level,
            'difficulty_factor' => $response
                ? $this->contentService->computeDifficultyFactor($course->level ?? 'beginner', $response->dsri)
                : 1.0,
            'course_avg_rating' => $course->ratings()->avg('rating'),
        ];
    }

    /**
     * Fall back to popularity for users without assessment.
     */
    private function getPopularityRecommendations(User $user, string $locale, int $limit): array
    {
        $enrolledIds = $user->userCourses()->pluck('course_id')->toArray();

        $courses = Course::whereNotIn('id', $enrolledIds)
            ->withCount('enrollments')
            ->withAvg('ratings', 'rating')
            ->withCount('ratings')
            ->orderByDesc('enrollments_count')
            ->limit($limit)
            ->get();

        return [
            'courses' => $courses->map(fn($c) => [
                'id' => $c->id,
                'title' => $c->title,
                'title_bm' => $c->title_bm,
                'description' => $c->description,
                'level' => $c->level,
                'image' => $c->image,
                'working_field' => $c->working_field,
                'enrollment_count' => $c->enrollments_count,
                'avg_rating' => $c->ratings_avg_rating ? round($c->ratings_avg_rating, 1) : null,
                'ratings_count' => $c->ratings_count,
                'match_percentage' => null,
                'competency_codes' => $c->competencyMappings()->pluck('competency_code')->toArray(),
                'ai_explanation' => '',
                'content_score' => null,
                'collaborative_score' => null,
                'hybrid_score' => null,
                'score_method' => 'popularity',
                'peer_count' => 0,
                'difficulty_match' => null,
                'matched_weak_competencies' => [],
                'ab_group' => $this->getAbGroup($user),
            ])->toArray(),
            'has_assessment' => false,
            'weak_sections' => [],
            'recommendation_method' => 'popularity',
            'content_weight' => 0,
            'collaborative_weight' => 0,
            'total_peers' => 0,
        ];
    }

    /**
     * Legacy algorithm for A/B test control group.
     */
    private function getLegacyRecommendations(User $user, string $locale, int $limit): array
    {
        $latestResponse = $user->latestAssessmentResponse;
        $enrolledIds = $user->userCourses()->pluck('course_id')->toArray();

        $baseQuery = Course::whereNotIn('id', $enrolledIds)
            ->withCount('enrollments')
            ->withAvg('ratings', 'rating')
            ->withCount('ratings');

        if (!$latestResponse) {
            $courses = $baseQuery->orderByDesc('enrollments_count')->limit($limit)->get();

            return [
                'courses' => $courses->map(fn($c) => [
                    'id' => $c->id,
                    'title' => $c->title,
                    'title_bm' => $c->title_bm,
                    'description' => $c->description,
                    'level' => $c->level,
                    'image' => $c->image,
                    'working_field' => $c->working_field,
                    'enrollment_count' => $c->enrollments_count,
                    'avg_rating' => $c->ratings_avg_rating ? round($c->ratings_avg_rating, 1) : null,
                    'ratings_count' => $c->ratings_count,
                    'match_percentage' => null,
                    'competency_codes' => $c->competencyMappings()->pluck('competency_code')->toArray(),
                    'ai_explanation' => '',
                    'content_score' => null,
                    'collaborative_score' => null,
                    'hybrid_score' => null,
                    'score_method' => 'popularity',
                    'peer_count' => 0,
                    'difficulty_match' => null,
                    'matched_weak_competencies' => [],
                    'ab_group' => 'control',
                ])->toArray(),
                'has_assessment' => false,
                'weak_sections' => [],
                'recommendation_method' => 'popularity',
                'content_weight' => 0,
                'collaborative_weight' => 0,
                'total_peers' => 0,
            ];
        }

        // Legacy binary weak/not-weak logic
        $weakSections = [];
        $competencies = $this->dsriService->getCompetencies();

        foreach (array_keys($competencies) as $code) {
            $field = strtolower($code) . '_score';
            if (($latestResponse->$field ?? 0) < 50) {
                $weakSections[] = $code;
            }
        }

        $courses = $baseQuery->get();
        $weakNames = [];
        $weakScores = [];

        foreach ($weakSections as $code) {
            $comp = $competencies[$code] ?? null;
            if ($comp) {
                $weakNames[] = $comp['name_en'];
            }
            $field = strtolower($code) . '_score';
            $weakScores[$code] = $latestResponse->$field ?? 0;
        }

        $result = $courses->map(function ($c) use ($weakSections, $weakNames, $weakScores, $user, $locale) {
            $mappings = $c->competencyMappings()->pluck('competency_code')->toArray();
            $matchPct = count($weakSections) > 0
                ? round((count(array_intersect($mappings, $weakSections)) / count($weakSections)) * 100)
                : (count($mappings) > 0 ? 40 : 0);

            $severity = 0;
            foreach (array_intersect($mappings, $weakSections) as $code) {
                $weight = $this->dsriService->getCompetencies()[$code]['weight'] ?? 1;
                $score = $weakScores[$code] ?? 0;
                $severity += $weight / max($score, 1);
            }

            $aiExplanation = '';
            if ($matchPct > 0 && !empty($weakNames)) {
                $aiExplanation = $this->aiService->generateCourseExplanation(
                    $c->title,
                    $c->description ?? '',
                    $weakNames,
                    $user->locale ?? 'en'
                );
            }

            return [
                'id' => $c->id,
                'title' => $c->title,
                'title_bm' => $c->title_bm,
                'description' => $c->description,
                'level' => $c->level,
                'image' => $c->image,
                'working_field' => $c->working_field,
                'enrollment_count' => $c->enrollments_count,
                'avg_rating' => $c->ratings_avg_rating ? round($c->ratings_avg_rating, 1) : null,
                'ratings_count' => $c->ratings_count,
                'match_percentage' => $matchPct,
                'competency_codes' => $mappings,
                'ai_explanation' => $aiExplanation,
                'content_score' => null,
                'collaborative_score' => null,
                'hybrid_score' => null,
                'score_method' => 'legacy',
                'peer_count' => 0,
                'difficulty_match' => null,
                'matched_weak_competencies' => [],
                'ab_group' => 'control',
            ];
        })->sortByDesc(function ($item) {
            // Legacy sort by severity (stored via matchPct for simplicity)
            return $item['match_percentage'];
        })->values()->take($limit)->toArray();

        return [
            'courses' => $result,
            'has_assessment' => true,
            'weak_sections' => $weakSections,
            'recommendation_method' => 'legacy',
            'content_weight' => 1.0,
            'collaborative_weight' => 0.0,
            'total_peers' => 0,
        ];
    }

    /**
     * Determine A/B test group for a user.
     */
    private function getAbGroup(User $user): string
    {
        if (!config('services.recommendations.ab_testing', false)) {
            return 'hybrid';
        }

        $ratio = config('services.recommendations.control_ratio', 0.5);
        $hash = crc32((string) $user->id) % 100;

        return $hash < ($ratio * 100) ? 'control' : 'hybrid';
    }

    /**
     * Get competency codes where user scored below 50%.
     */
    private function getWeakSections($response): array
    {
        $weak = [];
        foreach ($this->dsriService->getCompetencies() as $code => $config) {
            $field = strtolower($code) . '_score';
            if (($response->$field ?? 0) < $config['max_score'] * 0.5) {
                $weak[] = $code;
            }
        }

        return $weak;
    }
}
