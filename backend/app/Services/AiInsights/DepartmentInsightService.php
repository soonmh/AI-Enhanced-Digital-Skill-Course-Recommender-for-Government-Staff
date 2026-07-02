<?php

namespace App\Services\AiInsights;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use App\Services\Concerns\FormatsInsightContext;
use App\Services\Concerns\UsesGeminiApi;

class DepartmentInsightService
{
    use FormatsInsightContext;
    use UsesGeminiApi;

    public function analyze(Collection $staffData, string $locale = 'en'): array
    {
        if ($staffData->isEmpty()) {
            return [
                'summary' => 'No staff data available for analysis.',
                'strengths' => [],
                'weaknesses' => [],
                'recommendations' => [],
                'priority_actions' => [],
            ];
        }

        $cacheKey = "ai_department_insights:" . md5($staffData->toJson()) . ":{$locale}";

        return Cache::remember($cacheKey, now()->addHours(6), function () use ($staffData, $locale) {
            $competencies = $this->dsriService()->getCompetencies();
            $avgScores = [];
            $count = $staffData->count();

            foreach ($competencies as $code => $config) {
                $field = strtolower($code) . '_score';
                $values = $staffData->pluck($field)->filter()->toArray();
                $avgScores[$code] = [
                    'name' => $this->formatCompetencyName($code, $locale),
                    'avg' => count($values) > 0 ? round(array_sum($values) / count($values), 1) : 0,
                    'max' => $config['max_score'],
                    'avg_pct' => count($values) > 0 ? round((array_sum($values) / count($values) / $config['max_score']) * 100, 1) : 0,
                ];
            }

            $avgDsri = round($staffData->pluck('dsri')->filter()->avg(), 1);
            $scoreText = collect($avgScores)->map(fn($s) => "- {$s['name']}: {$s['avg_pct']}%")->implode("\n");

            $prompt = <<<PROMPT
You are an AI advisor analyzing digital skills readiness for Malaysian government staff.

{$this->getDsriLevelContext()}

Department overview:
- Total staff assessed: {$count}
- Average DSRI: {$avgDsri}/100

Average competency scores:
{$scoreText}

Think step by step:
1. Identify overall department readiness level using the DSRI classification above.
2. Find the top 2 strengths and top 2 weaknesses relative to the full score range.
3. Recommend specific training programs with realistic timelines.

Provide a JSON response with exactly this structure:
{
  "summary": "2-3 sentence overview of department digital readiness",
  "strengths": ["area1", "area2"],
  "weaknesses": ["area1", "area2"],
  "recommendations": ["action1", "action2", "action3"],
  "priority_actions": [
    {"action": "specific training action", "timeline": "2-4 weeks", "target_competency": "C1"}
  ]
}

Limit priority_actions to at most 3 items. Keep all responses concise and practical for government training planning.
{$this->getLanguageInstruction($locale)}
PROMPT;

            return $this->callGemini($prompt, [
                'summary' => 'Department analysis unavailable at this time.',
                'strengths' => [],
                'weaknesses' => [],
                'recommendations' => ['Encourage all staff to complete the digital skills assessment.'],
                'priority_actions' => [],
            ]);
        });
    }
}
