<?php

namespace App\Services\AiInsights;

use App\Models\User;
use Illuminate\Support\Facades\Cache;
use App\Services\Concerns\FormatsInsightContext;
use App\Services\Concerns\UsesGeminiApi;

class ReadinessCheckService
{
    use FormatsInsightContext;
    use UsesGeminiApi;

    public function check(User $user, string $locale = 'en'): array
    {
        $lastAssessment = $user->assessmentResponses()->orderByDesc('submitted_at')->first();

        if (!$lastAssessment) {
            return [
                'has_previous' => false,
                'readiness_score' => 0,
                'likely_improvements' => [],
                'review_first' => [],
                'recommendation' => 'take_first',
            ];
        }

        $cacheKey = "ai_readiness:{$user->id}:{$lastAssessment->id}:{$locale}";

        return Cache::remember($cacheKey, now()->addHours(3), function () use ($user, $lastAssessment, $locale) {
            $competencies = $this->dsriService()->getCompetencies();

            $prevScores = [];
            foreach ($competencies as $code => $config) {
                $field = strtolower($code) . '_score';
                $prevScores[$code] = round(($lastAssessment->$field / $config['max_score']) * 100, 1);
            }

            $completedSince = $user->userCourses()
                ->where('status', 'completed')
                ->whereNotNull('completed_at')
                ->where('completed_at', '>', $lastAssessment->submitted_at)
                ->with('course.competencyMappings')
                ->get();

            $coursesText = $completedSince->isEmpty()
                ? "No courses completed since last assessment."
                : $completedSince->map(fn($uc) => "- {$uc->course->title} (covers: " . $uc->course->competencyMappings->pluck('competency_code')->implode(', ') . ")")->implode("\n");

            $daysSince = $lastAssessment->submitted_at->diffInDays(now());
            $prevScoresText = collect($prevScores)->map(fn($pct, $code) => "- " . $this->formatCompetencyName($code, $locale) . ": {$pct}%")->implode("\n");

            $prompt = <<<PROMPT
You are an AI advisor helping a staff member decide if they are ready to retake their digital skills assessment.

{$this->getDsriLevelContext()}

Previous DSRI: {$lastAssessment->dsri}/100 (taken {$daysSince} days ago)

Previous competency scores:
{$prevScoresText}

Courses completed since last assessment:
{$coursesText}

Think step by step:
1. Assess how much time has passed and whether skills may have changed.
2. Consider which completed courses map to previous weak areas.
3. Predict which competencies are most likely to show improvement.

Provide a JSON response with exactly this structure:
{
  "readiness_score": 75,
  "likely_improvements": [
    {"competency": "C1", "name": "Competency name", "estimated_gain": "+10%"}
  ],
  "review_first": ["C3", "C7"],
  "recommendation": "ready"
}

readiness_score is 0-100. recommendation is one of: "ready", "needs_preparation", "wait" (wait if less than 30 days and no courses completed). review_first lists 1-3 competency codes to brush up on before retaking.
{$this->getLanguageInstruction($locale)}
PROMPT;

            $result = $this->callGemini($prompt, [
                'readiness_score' => $completedSince->count() > 0 ? 70 : 30,
                'likely_improvements' => [],
                'review_first' => [],
                'recommendation' => $completedSince->count() > 0 ? 'ready' : 'needs_preparation',
            ]);
            $result['has_previous'] = true;
            return $result;
        });
    }
}
