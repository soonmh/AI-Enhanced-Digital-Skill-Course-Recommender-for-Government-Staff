<?php

namespace App\Services\AiInsights;

use App\Models\User;
use Illuminate\Support\Facades\Cache;
use App\Services\Concerns\FormatsInsightContext;
use App\Services\Concerns\UsesGeminiApi;

class ActionPlanService
{
    use FormatsInsightContext;
    use UsesGeminiApi;

    public function generate(User $user, string $locale = 'en'): array
    {
        $latest = $user->latestAssessmentResponse;

        if (!$latest) {
            return [
                'has_assessment' => false,
                'action_plan' => [],
                'recommended_reassessment_date' => null,
                'expected_dsri_improvement' => '',
            ];
        }

        $cacheKey = "ai_action_plan:{$user->id}:{$latest->id}:{$locale}";

        return Cache::remember($cacheKey, now()->addHours(6), function () use ($user, $latest, $locale) {
            $competencies = $this->dsriService()->getCompetencies();
            $scores = [];
            $weakAreas = [];

            foreach ($competencies as $code => $config) {
                $field = strtolower($code) . '_score';
                $score = $latest->$field ?? 0;
                $pct = round(($score / $config['max_score']) * 100, 1);
                $scores[$code] = $pct;
                if ($pct < 60) {
                    $weakAreas[$code] = $this->formatCompetencyName($code, $locale) . ": {$pct}%";
                }
            }

            $weakText = count($weakAreas) > 0
                ? implode("\n", $weakAreas)
                : "All competencies are above 60%. Focus on advancing from proficient to expert.";

            $userContext = $this->buildUserContext($user);

            $scoresText = collect($scores)->map(fn($pct, $code) => "- {$this->formatCompetencyName($code, $locale)}: {$pct}%")->implode("\n");
            $today = now()->format('Y-m-d');

            $prompt = <<<PROMPT
You are an AI advisor creating a 30/60/90 day action plan for a Malaysian government staff member's digital skills development.

{$this->getDsriLevelContext()}

User profile:
{$userContext}

Current DSRI: {$latest->dsri}/100

Competency scores:
{$scoresText}

Weak areas (below 60%):
{$weakText}

Today's date: {$today}

Think step by step:
1. Identify the 2-3 weakest competencies that need immediate attention (30 days).
2. Plan intermediate development goals building on the first phase (60 days).
3. Set advanced goals that consolidate learning and prepare for reassessment (90 days).

Provide a JSON response with exactly this structure:
{
  "action_plan": [
    {
      "phase": "30",
      "phase_label": "Foundation",
      "actions": ["specific action 1", "specific action 2", "specific action 3"],
      "milestone": "What they will achieve by day 30"
    },
    {
      "phase": "60",
      "phase_label": "Development",
      "actions": ["specific action 1", "specific action 2", "specific action 3"],
      "milestone": "What they will achieve by day 60"
    },
    {
      "phase": "90",
      "phase_label": "Mastery",
      "actions": ["specific action 1", "specific action 2", "specific action 3"],
      "milestone": "What they will achieve by day 90"
    }
  ],
  "recommended_reassessment_date": "YYYY-MM-DD (90 days from now)",
  "expected_dsri_improvement": "Realistic DSRI improvement estimate"
}

Each phase should have 3-4 specific, actionable items. Make them practical for a government workplace setting. Reference specific competency codes where relevant.
{$this->getLanguageInstruction($locale)}
PROMPT;

            return $this->callGemini($prompt, [
                'has_assessment' => true,
                'action_plan' => [
                    ['phase' => '30', 'phase_label' => 'Foundation', 'actions' => ['Review your weakest competency areas', 'Enroll in relevant courses', 'Practice daily for 15 minutes'], 'milestone' => 'Build foundational understanding of weak areas'],
                    ['phase' => '60', 'phase_label' => 'Development', 'actions' => ['Complete enrolled courses', 'Apply skills in workplace tasks', 'Seek peer feedback'], 'milestone' => 'Apply new skills in real work scenarios'],
                    ['phase' => '90', 'phase_label' => 'Mastery', 'actions' => ['Retake assessment to measure improvement', 'Share knowledge with colleagues', 'Set next development goals'], 'milestone' => 'Demonstrate measurable improvement and readiness for reassessment'],
                ],
                'recommended_reassessment_date' => now()->addDays(90)->format('Y-m-d'),
                'expected_dsri_improvement' => '+5-15 points depending on effort and consistency',
            ]);
        });
    }
}
