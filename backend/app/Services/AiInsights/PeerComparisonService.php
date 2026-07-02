<?php

namespace App\Services\AiInsights;

use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use App\Services\Concerns\FormatsInsightContext;
use App\Services\Concerns\UsesGeminiApi;

class PeerComparisonService
{
    use FormatsInsightContext;
    use UsesGeminiApi;

    public function compare(User $user, Collection $peers, string $locale = 'en'): array
    {
        $latest = $user->latestAssessmentResponse;

        if (!$latest) {
            return [
                'has_assessment' => false,
                'comparison_summary' => '',
                'above_average' => [],
                'below_average' => [],
                'percentile_rank' => 0,
                'encouragement' => '',
            ];
        }

        $cacheKey = "ai_peer_comparison:{$user->id}:{$latest->id}:{$locale}";

        return Cache::remember($cacheKey, now()->addHours(6), function () use ($user, $latest, $peers, $locale) {
            $competencies = $this->dsriService()->getCompetencies();
            $userScores = [];
            $deptAvgScores = [];

            foreach ($competencies as $code => $config) {
                $field = strtolower($code) . '_score';
                $userScores[$code] = round(($latest->$field / $config['max_score']) * 100, 1);

                $peerValues = $peers->pluck('latestAssessmentResponse')->filter()
                    ->map(fn($r) => round(($r->$field / $config['max_score']) * 100, 1))
                    ->filter()
                    ->toArray();
                $deptAvgScores[$code] = count($peerValues) > 0
                    ? round(array_sum($peerValues) / count($peerValues), 1)
                    : 0;
            }

            $allDsri = $peers->pluck('latestAssessmentResponse')->filter()->pluck('dsri')->push($latest->dsri)->sort()->values();
            $total = $allDsri->count();
            if ($total <= 1) {
                $percentile = 50;
            } else {
                $below = $allDsri->filter(fn($d) => $d < $latest->dsri)->count();
                $percentile = round(($below / ($total - 1)) * 100);
            }

            $scoreLines = collect($competencies)->map(function ($config, $code) use ($userScores, $deptAvgScores, $locale) {
                $name = $this->formatCompetencyName($code, $locale);
                return "- {$name}: User {$userScores[$code]}% | Dept Avg {$deptAvgScores[$code]}%";
            })->implode("\n");

            $peerCount = $peers->pluck('latestAssessmentResponse')->filter()->count();
            $userContext = $this->buildUserContext($user);

            $avgDeptDsri = $peers->pluck('latestAssessmentResponse')->filter()->avg('dsri');
            $avgDeptDsriStr = $avgDeptDsri ? round($avgDeptDsri, 1) : 'N/A';

            $prompt = <<<PROMPT
You are an AI advisor comparing a staff member's digital skills to their department peers.

User profile:
{$userContext}

User DSRI: {$latest->dsri}/100
Department average DSRI: {$avgDeptDsriStr}/100
Percentile rank: {$percentile}th percentile (among {$peerCount} assessed peers)

Per-competency comparison:
{$scoreLines}

Provide a JSON response with exactly this structure:
{
  "comparison_summary": "2-3 sentence comparison of the user vs their peers",
  "above_average": [
    {"competency": "C1", "name": "Competency name", "user_pct": 65, "dept_avg_pct": 50}
  ],
  "below_average": [
    {"competency": "C3", "name": "Competency name", "user_pct": 30, "dept_avg_pct": 55}
  ],
  "percentile_rank": {$percentile},
  "encouragement": "1-2 sentence encouraging note about their position and growth potential"
}

Be constructive and motivating. Highlight strengths honestly and frame gaps as opportunities.
{$this->getLanguageInstruction($locale)}
PROMPT;

            $result = $this->callGemini($prompt, [
                'has_assessment' => true,
                'comparison_summary' => '',
                'above_average' => [],
                'below_average' => [],
                'percentile_rank' => $percentile,
                'encouragement' => '',
            ]);
            $result['percentile_rank'] = $percentile;

            return $result;
        });
    }
}
