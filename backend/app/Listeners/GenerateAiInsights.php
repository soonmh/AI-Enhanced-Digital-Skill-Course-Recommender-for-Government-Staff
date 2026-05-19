<?php

namespace App\Listeners;

use App\Events\AssessmentSubmitted;
use App\Models\AiRecommendation;
use App\Services\AiInsightService;
use Illuminate\Support\Facades\Log;

class GenerateAiInsights
{
    public function __construct(private AiInsightService $aiService) {}

    public function handle(AssessmentSubmitted $event): void
    {
        try {
            $response = $event->response;
            $locale = $response->user->locale ?? 'en';
            $recommendations = $this->aiService->generateRecommendations($response, $locale);
            $skillGaps = $this->aiService->predictSkillGaps($response->user, $locale);

            AiRecommendation::updateOrCreate(
                [
                    'user_id' => $response->user_id,
                    'assessment_response_id' => $response->id,
                ],
                [
                    'type' => 'personal',
                    'insights_json' => [
                        'recommendations' => $recommendations,
                        'skill_gaps' => $skillGaps,
                    ],
                ]
            );
        } catch (\Exception $e) {
            Log::error('Failed to generate AI insights', ['message' => $e->getMessage()]);
        }
    }
}
