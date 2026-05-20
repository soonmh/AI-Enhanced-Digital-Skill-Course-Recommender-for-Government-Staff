<?php

namespace App\Listeners;

use App\Events\AssessmentSubmitted;
use App\Events\CourseCompleted;
use Illuminate\Support\Facades\Cache;

class InvalidateRecommendationCache
{
    public function handle(AssessmentSubmitted|CourseCompleted $event): void
    {
        if ($event instanceof AssessmentSubmitted) {
            $userId = $event->response->user_id;
        } else {
            $userId = $event->userCourse->user_id;
        }

        $keys = [
            "ai_recommendations:{$userId}",
            "ai_skill_gaps:{$userId}",
            "dashboard:user:{$userId}",
            "hybrid_recommendations:{$userId}",
        ];

        foreach ($keys as $key) {
            // Clear all cached variants for this user
            Cache::forget($key);
        }

        // Clear pattern-based caches
        $responseId = $event instanceof AssessmentSubmitted ? $event->response->id : null;
        if ($responseId) {
            Cache::forget("ai_recommendations:{$userId}:{$responseId}");
        }
    }
}
