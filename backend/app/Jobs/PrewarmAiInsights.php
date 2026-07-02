<?php

namespace App\Jobs;

use App\Models\AssessmentResponse;
use App\Models\User;
use App\Services\AiInsights\ActionPlanService;
use App\Services\AiInsights\LearningPathService;
use App\Services\AiInsights\PeerComparisonService;
use App\Services\AiInsights\PersonalInsightService;
use App\Services\AiInsights\ReadinessCheckService;
use App\Services\AiInsights\SkillPredictionService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class PrewarmAiInsights implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $tries = 1;
    public int $timeout = 120;

    public function __construct(
        public AssessmentResponse $response,
        public string $locale = 'en',
    ) {}

    /**
     * Pre-generate all personal insight caches so the user's first visit
     * to /ai-insights returns instantly instead of waiting for Gemini.
     */
    public function handle(
        PersonalInsightService $personal,
        SkillPredictionService $skillPrediction,
        LearningPathService $learningPath,
        PeerComparisonService $peerComparison,
        ReadinessCheckService $readinessCheck,
        ActionPlanService $actionPlan,
    ): void {
        $user = $this->response->user;

        try {
            $personal->generate($this->response, $this->locale);
            $skillPrediction->predict($user, $this->locale);
            $learningPath->generate($user, $this->locale);

            $peers = User::where('working_field', $user->working_field)
                ->where('id', '!=', $user->id)
                ->with('latestAssessmentResponse')
                ->get();
            $peerComparison->compare($user, $peers, $this->locale);

            $readinessCheck->check($user, $this->locale);
            $actionPlan->generate($user, $this->locale);

            Log::info('AI insights prewarmed', ['user_id' => $user->id, 'response_id' => $this->response->id]);
        } catch (\Throwable $e) {
            Log::warning('AI insight prewarm failed', [
                'user_id' => $user->id,
                'message' => $e->getMessage(),
            ]);
        }
    }
}
