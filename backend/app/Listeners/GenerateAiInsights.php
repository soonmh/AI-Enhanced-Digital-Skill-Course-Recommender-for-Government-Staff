<?php

namespace App\Listeners;

use App\Events\AssessmentSubmitted;
use App\Jobs\PrewarmAiInsights;

class GenerateAiInsights
{
    public function handle(AssessmentSubmitted $event): void
    {
        $locale = $event->response->user->locale ?? 'en';

        // Dispatch to the queue so the request returns immediately.
        // The job prewarms every personal insight cache (learning path,
        // peer comparison, readiness, action plan) so the user's first
        // visit to /ai-insights returns instantly.
        PrewarmAiInsights::dispatch($event->response, $locale);
    }
}
