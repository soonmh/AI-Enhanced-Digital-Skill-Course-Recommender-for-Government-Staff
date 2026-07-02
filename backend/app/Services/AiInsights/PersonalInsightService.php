<?php

namespace App\Services\AiInsights;

use App\Models\AssessmentResponse;
use Illuminate\Support\Facades\Cache;
use App\Services\Concerns\FormatsInsightContext;
use App\Services\Concerns\UsesGeminiApi;

class PersonalInsightService
{
    use FormatsInsightContext;
    use UsesGeminiApi;

    public function generate(AssessmentResponse $response, string $locale = 'en'): array
    {
        $cacheKey = "ai_recommendations:{$response->user_id}:{$response->id}:{$locale}";

        return Cache::remember($cacheKey, now()->addHours(6), function () use ($response, $locale) {
            $competencies = $this->dsriService()->getCompetencies();
            $scores = [];
            $weakAreas = [];

            foreach ($competencies as $code => $config) {
                $field = strtolower($code) . '_score';
                $score = $response->$field ?? 0;
                $pct = round(($score / $config['max_score']) * 100, 1);
                $scores[$code] = [
                    'name' => $this->formatCompetencyName($code, $locale),
                    'score' => $score,
                    'max' => $config['max_score'],
                    'percentage' => $pct,
                    'weight' => $config['weight'],
                ];
                if ($pct < 50) {
                    $weakAreas[] = $this->formatCompetencyName($code, $locale) . " ({$code}): {$pct}%";
                }
            }

            $weakText = count($weakAreas) > 0
                ? implode("\n", $weakAreas)
                : "No significantly weak areas. All competencies are above 50%.";

            $user = $response->user;
            $userContext = $this->buildUserContext($user);

            $prompt = <<<PROMPT
You are an AI advisor for Malaysian government staff digital skills development.

{$this->getDsriLevelContext()}

User profile:
{$userContext}

User's Digital Skills Readiness Index (DSRI): {$response->dsri}/100

Competency scores:
{$this->formatScoresForPrompt($scores)}

Weak areas (below 50%):
{$weakText}

Think step by step:
1. Analyze the overall DSRI score and what it means for this person's role.
2. Identify the weakest competencies and why they matter for their career growth.
3. Generate specific, actionable advice tailored to their profile.

Provide a JSON response with exactly this structure:
{
  "summary": "2-3 sentence personalized assessment of the user's overall digital readiness",
  "key_findings": ["finding1", "finding2", "finding3"],
  "focus_areas": [
    {"code": "C1", "reason": "Why this area needs attention", "priority_level": "high"}
  ],
  "advice": "2-3 sentence actionable advice for improvement",
  "next_steps": ["specific action 1", "specific action 2", "specific action 3"]
}

Only include focus_areas for competencies scoring below 50%. Set priority_level as "high" for scores below 30%, "medium" for 30-40%, "low" for 40-50%. Keep findings concise and practical.
{$this->getLanguageInstruction($locale)}
PROMPT;

            return $this->callGemini($prompt, [
                'summary' => 'Assessment analysis unavailable at this time.',
                'key_findings' => ['Complete an assessment to receive personalized insights.'],
                'focus_areas' => [],
                'advice' => 'Continue developing your digital skills through available courses.',
                'next_steps' => [],
            ]);
        });
    }
}
