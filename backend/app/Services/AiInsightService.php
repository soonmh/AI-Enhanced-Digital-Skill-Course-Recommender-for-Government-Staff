<?php

namespace App\Services;

use App\Models\AssessmentResponse;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AiInsightService
{
    public function __construct(private DsriCalculationService $dsriService) {}

    public function generateRecommendations(AssessmentResponse $response): array
    {
        $cacheKey = "ai_recommendations:{$response->user_id}:{$response->id}";

        return Cache::remember($cacheKey, now()->addHours(6), function () use ($response) {
            $competencies = $this->dsriService->getCompetencies();
            $scores = [];
            $weakAreas = [];

            foreach ($competencies as $code => $config) {
                $field = strtolower($code) . '_score';
                $score = $response->$field ?? 0;
                $pct = round(($score / $config['max_score']) * 100, 1);
                $scores[$code] = [
                    'name' => $config['name_en'],
                    'score' => $score,
                    'max' => $config['max_score'],
                    'percentage' => $pct,
                    'weight' => $config['weight'],
                ];
                if ($pct < 50) {
                    $weakAreas[] = "{$config['name_en']} ({$code}): {$pct}%";
                }
            }

            $weakText = count($weakAreas) > 0
                ? implode("\n", $weakAreas)
                : "No significantly weak areas. All competencies are above 50%.";

            $prompt = <<<PROMPT
You are an AI advisor for Malaysian government staff digital skills development.

User's Digital Skills Readiness Index (DSRI): {$response->dsri}/100

Competency scores:
{$this->formatScoresForPrompt($scores)}

Weak areas (below 50%):
{$weakText}

Provide a JSON response with exactly this structure:
{
  "summary": "2-3 sentence personalized assessment of the user's overall digital readiness",
  "key_findings": ["finding1", "finding2", "finding3"],
  "focus_areas": [
    {"code": "C1", "reason": "Why this area needs attention"},
    {"code": "C2", "reason": "Why this area needs attention"}
  ],
  "advice": "2-3 sentence actionable advice for improvement"
}

Only include focus_areas for competencies scoring below 50%. Keep findings concise and practical.
PROMPT;

            return $this->callGemini($prompt, [
                'summary' => 'Assessment analysis unavailable at this time.',
                'key_findings' => ['Complete an assessment to receive personalized insights.'],
                'focus_areas' => [],
                'advice' => 'Continue developing your digital skills through available courses.',
            ]);
        });
    }

    public function analyzeStaffPerformance(Collection $staffData): array
    {
        if ($staffData->isEmpty()) {
            return [
                'summary' => 'No staff data available for analysis.',
                'strengths' => [],
                'weaknesses' => [],
                'recommendations' => [],
            ];
        }

        $cacheKey = "ai_department_insights:" . md5($staffData->toJson());

        return Cache::remember($cacheKey, now()->addHours(6), function () use ($staffData) {
            $competencies = $this->dsriService->getCompetencies();
            $avgScores = [];
            $count = $staffData->count();

            foreach ($competencies as $code => $config) {
                $field = strtolower($code) . '_score';
                $values = $staffData->pluck($field)->filter()->toArray();
                $avgScores[$code] = [
                    'name' => $config['name_en'],
                    'avg' => count($values) > 0 ? round(array_sum($values) / count($values), 1) : 0,
                    'max' => $config['max_score'],
                    'avg_pct' => count($values) > 0 ? round((array_sum($values) / count($values) / $config['max_score']) * 100, 1) : 0,
                ];
            }

            $avgDsri = round($staffData->pluck('dsri')->filter()->avg(), 1);
            $scoreText = collect($avgScores)->map(fn($s) => "- {$s['name']}: {$s['avg_pct']}%")->implode("\n");

            $prompt = <<<PROMPT
You are an AI advisor analyzing digital skills readiness for Malaysian government staff.

Department overview:
- Total staff assessed: {$count}
- Average DSRI: {$avgDsri}/100

Average competency scores:
{$scoreText}

Provide a JSON response with exactly this structure:
{
  "summary": "2-3 sentence overview of department digital readiness",
  "strengths": ["area1", "area2"],
  "weaknesses": ["area1", "area2"],
  "recommendations": ["action1", "action2", "action3"]
}

Keep all responses concise and practical for government training planning.
PROMPT;

            return $this->callGemini($prompt, [
                'summary' => 'Department analysis unavailable at this time.',
                'strengths' => [],
                'weaknesses' => [],
                'recommendations' => ['Encourage all staff to complete the digital skills assessment.'],
            ]);
        });
    }

    public function predictSkillGaps(User $user): array
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

        $cacheKey = "ai_skill_gaps:{$user->id}:" . $history->first()->id;

        return Cache::remember($cacheKey, now()->addHours(6), function () use ($history) {
            $competencies = $this->dsriService->getCompetencies();
            $trendData = [];

            foreach ($competencies as $code => $config) {
                $field = strtolower($code) . '_score';
                $scores = $history->map(fn($r) => round(($r->$field / $config['max_score']) * 100, 1))->toArray();
                $trendData[$code] = [
                    'name' => $config['name_en'],
                    'scores' => array_reverse($scores),
                    'latest' => $scores[0],
                    'direction' => $scores[0] > ($scores[count($scores) - 1] ?? $scores[0]) ? 'improving' : 'declining',
                ];
            }

            $trendText = collect($trendData)->map(fn($t) => "- {$t['name']}: " . implode(' → ', $t['scores']) . " ({$t['direction']})")->implode("\n");
            $dsriTrend = $history->pluck('dsri')->toArray();
            $dsriTrendText = implode(' → ', array_reverse($dsriTrend));

            $prompt = <<<PROMPT
You are an AI advisor predicting future digital skill gaps for Malaysian government staff.

DSRI trend (oldest to newest): {$dsriTrendText}

Competency trends (oldest to newest):
{$trendText}

Provide a JSON response with exactly this structure:
{
  "prediction": "2-3 sentence prediction about their skill trajectory",
  "declining_areas": ["area that may decline if not addressed"],
  "emerging_gaps": ["new gap that may emerge"],
  "proactive_training": ["recommended proactive training step1", "step2"]
}

Keep predictions realistic and based on the trend data provided.
PROMPT;

            return $this->callGemini($prompt, [
                'prediction' => 'Trend analysis unavailable at this time.',
                'declining_areas' => [],
                'emerging_gaps' => [],
                'proactive_training' => ['Continue taking assessments to track your progress over time.'],
            ]);
        });
    }

    public function generateCourseExplanation(string $courseTitle, string $courseDescription, array $weakCompetencies): string
    {
        if (empty($weakCompetencies)) {
            return '';
        }

        $weakText = implode(', ', $weakCompetencies);

        $cacheKey = "ai_course_explanation:" . md5($courseTitle . $weakText);

        return Cache::remember($cacheKey, now()->addHours(12), function () use ($courseTitle, $courseDescription, $weakText) {
            $prompt = <<<PROMPT
You are recommending a course to a government staff member.

Course: {$courseTitle}
Description: {$courseDescription}

Staff member's weak competency areas: {$weakText}

In 1-2 sentences, explain why this course would help improve their specific weak areas. Be direct and practical.

Respond with plain text only, no JSON.
PROMPT;

            $result = $this->callGeminiRaw($prompt);
            return $result ?? "This course can help strengthen your skills in: {$weakText}.";
        });
    }

    private function formatScoresForPrompt(array $scores): string
    {
        return collect($scores)->map(fn($s) => "- {$s['name']}: {$s['score']}/{$s['max']} ({$s['percentage']}%)")->implode("\n");
    }

    private function callGemini(string $prompt, array $fallback): array
    {
        try {
            $apiKey = config('services.gemini.key');
            $model = config('services.gemini.model', 'gemini-2.0-flash-lite');

            if (empty($apiKey)) {
                Log::warning('Gemini API key not configured');
                return $fallback;
            }

            $response = Http::timeout(30)->post(
                "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}",
                [
                    'contents' => [['parts' => [['text' => $prompt]]]],
                    'generationConfig' => [
                        'temperature' => 0.3,
                        'maxOutputTokens' => 1024,
                        'responseMimeType' => 'application/json',
                    ],
                ]
            );

            if (!$response->successful()) {
                Log::error('Gemini API error', ['status' => $response->status(), 'body' => $response->body()]);
                return $fallback;
            }

            $text = $response->json('candidates.0.content.parts.0.text');

            if (!$text) {
                return $fallback;
            }

            $decoded = json_decode($text, true);
            return is_array($decoded) ? $decoded : $fallback;
        } catch (\Exception $e) {
            Log::error('Gemini API exception', ['message' => $e->getMessage()]);
            return $fallback;
        }
    }

    private function callGeminiRaw(string $prompt): ?string
    {
        try {
            $apiKey = config('services.gemini.key');
            $model = config('services.gemini.model', 'gemini-2.0-flash-lite');

            if (empty($apiKey)) {
                return null;
            }

            $response = Http::timeout(30)->post(
                "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}",
                [
                    'contents' => [['parts' => [['text' => $prompt]]]],
                    'generationConfig' => [
                        'temperature' => 0.3,
                        'maxOutputTokens' => 256,
                    ],
                ]
            );

            if (!$response->successful()) {
                return null;
            }

            return $response->json('candidates.0.content.parts.0.text');
        } catch (\Exception $e) {
            return null;
        }
    }
}
