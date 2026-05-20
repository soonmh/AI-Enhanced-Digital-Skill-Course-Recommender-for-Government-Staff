<?php

namespace App\Services;

use App\Models\AssessmentResponse;
use App\Models\CourseRating;
use App\Models\User;
use App\Models\UserSimilarityCache;
use Illuminate\Support\Collection;

class CollaborativeFilteringService
{
    private const MIN_SIMILARITY = 0.3;
    private const MIN_PEERS = 3;

    public function __construct(private DsriCalculationService $dsriService) {}

    /**
     * Cosine similarity between two users' competency score vectors.
     */
    public function computeUserSimilarity(AssessmentResponse $a, AssessmentResponse $b): float
    {
        $competencies = $this->dsriService->getCompetencies();
        $vecA = [];
        $vecB = [];

        foreach ($competencies as $code => $config) {
            $field = strtolower($code) . '_score';
            $vecA[] = ($a->$field ?? 0) / $config['max_score'];
            $vecB[] = ($b->$field ?? 0) / $config['max_score'];
        }

        $dotProduct = 0.0;
        $normA = 0.0;
        $normB = 0.0;
        $count = count($vecA);

        for ($i = 0; $i < $count; $i++) {
            $dotProduct += $vecA[$i] * $vecB[$i];
            $normA += $vecA[$i] * $vecA[$i];
            $normB += $vecB[$i] * $vecB[$i];
        }

        $denominator = sqrt($normA) * sqrt($normB);

        return $denominator > 0 ? round($dotProduct / $denominator, 6) : 0.0;
    }

    /**
     * Find top K similar users from the precomputed cache.
     */
    public function findSimilarUsers(User $user, int $k = 10): Collection
    {
        $rows = UserSimilarityCache::where(function ($q) use ($user) {
            $q->where('user_id_a', $user->id)
              ->orWhere('user_id_b', $user->id);
        })
            ->where('similarity_score', '>=', self::MIN_SIMILARITY)
            ->orderByDesc('similarity_score')
            ->limit($k)
            ->get();

        return $rows->map(function ($row) use ($user) {
            $peerId = $row->user_id_a === $user->id ? $row->user_id_b : $row->user_id_a;

            return [
                'user_id' => $peerId,
                'similarity' => $row->similarity_score,
            ];
        });
    }

    /**
     * Weighted average of ratings from similar users for a course.
     * Normalized to 0.0-1.0.
     */
    public function computeCollaborativeScore(int $courseId, Collection $similarUsers): float
    {
        $peerIds = $similarUsers->pluck('user_id')->toArray();
        $similarityMap = $similarUsers->pluck('similarity', 'user_id')->toArray();

        $ratings = CourseRating::where('course_id', $courseId)
            ->whereIn('user_id', $peerIds)
            ->get();

        if ($ratings->isEmpty()) {
            return 0.0;
        }

        $weightedSum = 0.0;
        $weightSum = 0.0;

        foreach ($ratings as $rating) {
            $sim = $similarityMap[$rating->user_id] ?? 0;
            $weightedSum += $sim * $rating->rating;
            $weightSum += $sim;
        }

        if ($weightSum <= 0) {
            return 0.0;
        }

        // Normalize from 1-5 scale to 0-1
        return round(($weightedSum / $weightSum) / 5.0, 6);
    }

    /**
     * Get collaborative recommendations for a user.
     * Returns empty if insufficient peer data (cold start).
     */
    public function getRecommendations(User $user, int $limit = 20): Collection
    {
        if (!$user->latestAssessmentResponse) {
            return collect();
        }

        $similarUsers = $this->findSimilarUsers($user);

        if ($similarUsers->count() < self::MIN_PEERS) {
            return collect();
        }

        $enrolledIds = $user->userCourses()->pluck('course_id')->toArray();
        $peerIds = $similarUsers->pluck('user_id')->toArray();

        // Find courses rated by similar users that the target user hasn't enrolled in
        $peerRatings = CourseRating::whereIn('user_id', $peerIds)
            ->whereNotIn('course_id', $enrolledIds)
            ->selectRaw('course_id, COUNT(*) as rater_count, AVG(rating) as avg_rating')
            ->groupBy('course_id')
            ->havingRaw('COUNT(*) >= 1')
            ->orderByDesc('avg_rating')
            ->limit($limit * 2)
            ->get();

        $results = $peerRatings->map(function ($pr) use ($similarUsers) {
            $score = $this->computeCollaborativeScore($pr->course_id, $similarUsers);

            return [
                'course_id' => $pr->course_id,
                'score' => $score,
                'peer_count' => $pr->rater_count,
            ];
        })->sortByDesc('score')->take($limit)->values();

        return $results;
    }

    /**
     * How many valid similar peers does this user have?
     */
    public function getPeerCount(User $user): int
    {
        if (!$user->latestAssessmentResponse) {
            return 0;
        }

        return $this->findSimilarUsers($user)->count();
    }
}
