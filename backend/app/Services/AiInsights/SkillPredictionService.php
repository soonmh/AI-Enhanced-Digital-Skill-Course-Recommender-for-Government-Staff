<?php

namespace App\Services\AiInsights;

use App\Models\User;
use Illuminate\Support\Facades\Cache;
use App\Services\Concerns\FormatsInsightContext;
use App\Services\Concerns\UsesGeminiApi;

class SkillPredictionService
{
    use FormatsInsightContext;
    use UsesGeminiApi;

    public function predict(User $user, string $locale = 'en'): array
    {
        $history = $user->assessmentResponses()->orderByDesc('submitted_at')->limit(5)->get();

        if ($history->count() < 2) {
            return [
                'prediction' => 'Insufficient assessment history for trend analysis. Complete at least 2 assessments.',
                'declining_areas' => [],
                'emerging_gaps' => [],
                'proactive_training' => [],
            ];
        }

        $cacheKey = "ai_skill_gaps:{$user->id}:{$history->first()->id}:{$locale}";

        return Cache::remember($cacheKey, now()->addHours(6), function () use ($history, $user, $locale) {
            $competencies = $this->dsriService()->getCompetencies();
            $trendData = [];

            foreach ($competencies as $code => $config) {
                $field = strtolower($code) . '_score';
                $scores = $history->map(fn($r) => round(($r->$field / $config['max_score']) * 100, 1))->toArray();
                $trendData[$code] = [
                    'name' => $this->formatCompetencyName($code, $locale),
                    'scores' => array_reverse($scores),
                    'latest' => $scores[0],
                    'direction' => $scores[0] > ($scores[count($scores) - 1] ?? $scores[0]) ? 'improving' : 'declining',
                ];
            }

            $trendText = collect($trendData)->map(fn($t) => "- {$t['name']}: " . implode(' → ', $t['scores']) . " ({$t['direction']})")->implode("\n");
            $dsriTrend = $history->pluck('dsri')->toArray();
            $dsriTrendText = implode(' → ', array_reverse($dsriTrend));
            $userContext = $this->buildUserContext($user);

            $prompt = <<<PROMPT
You are an AI advisor predicting future digital skill gaps for Malaysian government staff.

{$this->getDsriLevelContext()}

User profile:
{$userContext}

DSRI trend (oldest to newest): {$dsriTrendText}

Competency trends (oldest to newest):
{$trendText}

Think step by step:
1. Analyze the trend direction for each competency.
2. Project forward 3-6 months assuming the current trajectory continues.
3. Identify which declining areas pose the highest risk given the user's role.

Provide a JSON response with exactly this structure:
{
  "prediction": "2-3 sentence prediction about their skill trajectory",
  "declining_areas": ["area with risk_level: describe the decline and its risk (high/medium/low)"],
  "emerging_gaps": ["new gap that may emerge and its estimated impact"],
  "proactive_training": ["recommended proactive training step1", "step2"]
}

Keep predictions realistic and based on the trend data provided.
{$this->getLanguageInstruction($locale)}
PROMPT;

            return $this->callGemini($prompt, [
                'prediction' => 'Trend analysis unavailable at this time.',
                'declining_areas' => [],
                'emerging_gaps' => [],
                'proactive_training' => ['Continue taking assessments to track your progress over time.'],
            ]);
        });
    }
}
