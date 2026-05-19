<?php

namespace App\Services;

use App\Models\AssessmentResponse;
use App\Models\User;
use App\Models\Course;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AiInsightService
{
    public function __construct(private DsriCalculationService $dsriService) {}

    // ──────────────────────────────────────────────
    //  Existing Methods (enhanced)
    // ──────────────────────────────────────────────

    public function generateRecommendations(AssessmentResponse $response, string $locale = 'en'): array
    {
        $cacheKey = "ai_recommendations:{$response->user_id}:{$response->id}:{$locale}";

        return Cache::remember($cacheKey, now()->addHours(6), function () use ($response, $locale) {
            $competencies = $this->dsriService->getCompetencies();
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

    public function analyzeStaffPerformance(Collection $staffData, string $locale = 'en'): array
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
            $competencies = $this->dsriService->getCompetencies();
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

    public function predictSkillGaps(User $user, string $locale = 'en'): array
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
            $competencies = $this->dsriService->getCompetencies();
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

    public function generateCourseExplanation(string $courseTitle, string $courseDescription, array $weakCompetencies, string $locale = 'en'): string
    {
        if (empty($weakCompetencies)) {
            return '';
        }

        $weakText = implode(', ', $weakCompetencies);

        $cacheKey = "ai_course_explanation:" . md5($courseTitle . $weakText . $locale);

        return Cache::remember($cacheKey, now()->addHours(12), function () use ($courseTitle, $courseDescription, $weakText, $locale) {
            $prompt = <<<PROMPT
You are recommending a course to a government staff member.

Course: {$courseTitle}
Description: {$courseDescription}

Staff member's weak competency areas: {$weakText}

First, identify which weak competencies this course addresses.
Then, explain how completing this course would specifically improve those scores.

In 1-2 sentences, explain why this course would help. Be direct and practical.
Respond with plain text only, no JSON.
{$this->getLanguageInstruction($locale)}
PROMPT;

            $result = $this->callGeminiRaw($prompt, 384);
            return $result ?? "This course can help strengthen your skills in: {$weakText}.";
        });
    }

    // ──────────────────────────────────────────────
    //  New Methods
    // ──────────────────────────────────────────────

    public function generateLearningPath(User $user, string $locale = 'en'): array
    {
        $latest = $user->latestAssessmentResponse;

        if (!$latest) {
            return [
                'has_assessment' => false,
                'learning_path' => [],
                'total_timeline_weeks' => 0,
                'expected_improvement' => '',
            ];
        }

        $cacheKey = "ai_learning_path:{$user->id}:{$latest->id}:{$locale}";

        return Cache::remember($cacheKey, now()->addHours(6), function () use ($user, $latest, $locale) {
            $competencies = $this->dsriService->getCompetencies();
            $weakAreas = [];
            $allScores = [];

            foreach ($competencies as $code => $config) {
                $field = strtolower($code) . '_score';
                $score = $latest->$field ?? 0;
                $pct = round(($score / $config['max_score']) * 100, 1);
                $allScores[$code] = $pct;
                if ($pct < 60) {
                    $weakAreas[$code] = [
                        'name' => $this->formatCompetencyName($code, $locale),
                        'pct' => $pct,
                    ];
                }
            }

            // Get available courses
            $enrolledIds = $user->userCourses()->pluck('course_id')->toArray();
            $availableCourses = Course::whereNotIn('id', $enrolledIds)
                ->with('competencyMappings')
                ->get()
                ->filter(fn($c) => $c->competencyMappings->count() > 0)
                ->map(fn($c) => [
                    'title' => $c->title,
                    'level' => $c->level,
                    'codes' => $c->competencyMappings->pluck('competency_code')->toArray(),
                ])
                ->values()
                ->take(10)
                ->toArray();

            $weakText = collect($weakAreas)->map(fn($w) => "- {$w['name']}: {$w['pct']}%")->implode("\n");
            $coursesText = collect($availableCourses)->map(fn($c) => "- {$c['title']} ({$c['level']}) — covers: " . implode(', ', $c['codes']))->implode("\n");
            $userContext = $this->buildUserContext($user);

            $prompt = <<<PROMPT
You are an AI advisor creating a personalized learning path for a Malaysian government staff member.

{$this->getDsriLevelContext()}

User profile:
{$userContext}

Current DSRI: {$latest->dsri}/100

Weak competency areas (below 60%):
{$weakText}

Available courses (not yet enrolled):
{$coursesText}

If no available courses match a weak area, suggest general training activities instead.

Think step by step:
1. Prioritize the weakest competencies first.
2. Match available courses to those weak areas.
3. Create a logical learning sequence that builds skills progressively.

Provide a JSON response with exactly this structure:
{
  "learning_path": [
    {"step": 1, "course_title": "Course name or activity", "reason": "Why this first", "estimated_weeks": 2, "milestone": "What they'll achieve"},
    {"step": 2, "course_title": "...", "reason": "...", "estimated_weeks": 3, "milestone": "..."}
  ],
  "total_timeline_weeks": 8,
  "expected_improvement": "1-2 sentence description of expected DSRI improvement"
}

Limit to 3-5 steps. Be realistic about timelines.
{$this->getLanguageInstruction($locale)}
PROMPT;

            return $this->callGemini($prompt, [
                'has_assessment' => true,
                'learning_path' => [],
                'total_timeline_weeks' => 0,
                'expected_improvement' => 'Complete available courses in your weak areas to improve your DSRI.',
            ]);
        });
    }

    public function generatePeerComparison(User $user, Collection $peers, string $locale = 'en'): array
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
            $competencies = $this->dsriService->getCompetencies();
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

            // Calculate percentile rank among peers
            $allDsri = $peers->pluck('latestAssessmentResponse')->filter()->pluck('dsri')->push($latest->dsri)->sort()->values();
            $rank = $allDsri->search($latest->dsri);
            $percentile = $allDsri->count() > 1 ? round(($rank / ($allDsri->count() - 1)) * 100) : 50;

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

            return $this->callGemini($prompt, [
                'has_assessment' => true,
                'comparison_summary' => '',
                'above_average' => [],
                'below_average' => [],
                'percentile_rank' => $percentile,
                'encouragement' => '',
            ]);
        });
    }

    public function checkAssessmentReadiness(User $user, string $locale = 'en'): array
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
            $competencies = $this->dsriService->getCompetencies();

            // Previous scores
            $prevScores = [];
            foreach ($competencies as $code => $config) {
                $field = strtolower($code) . '_score';
                $prevScores[$code] = round(($lastAssessment->$field / $config['max_score']) * 100, 1);
            }

            // Courses completed since last assessment
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

            return $this->callGemini($prompt, [
                'has_previous' => true,
                'readiness_score' => $completedSince->count() > 0 ? 70 : 30,
                'likely_improvements' => [],
                'review_first' => [],
                'recommendation' => $completedSince->count() > 0 ? 'ready' : 'needs_preparation',
            ]);
        });
    }

    public function generateNotificationContent(string $type, array $context, string $locale = 'en'): array
    {
        $supported = ['skill_reminder', 'course_recommendation', 'assessment_due', 'milestone_achieved'];
        if (!in_array($type, $supported)) {
            return ['title' => 'Notification', 'body' => 'You have a new update.'];
        }

        $cacheKey = "ai_notification:{$type}:" . md5(json_encode($context)) . ":{$locale}";

        return Cache::remember($cacheKey, now()->addHours(24), function () use ($type, $context, $locale) {
            $prompts = [
                'skill_reminder' => "Generate a short notification reminding the user about their weak skill area: {$context['competency_name']}. They scored {$context['score']}%. Be encouraging and suggest a specific action.",
                'course_recommendation' => "Generate a short notification recommending the course '{$context['course_title']}' to improve {$context['competency_names']}. Match percentage: {$context['match_pct']}%. Be enthusiastic.",
                'assessment_due' => "Generate a short notification reminding the user it has been {$context['days']} days since their last assessment. Encourage them to retake and track progress.",
                'milestone_achieved' => "Generate a short congratulatory notification: the user completed '{$context['course_title']}' and may have improved {$context['competency_name']}. Celebrate the achievement.",
            ];

            $prompt = <<<PROMPT
You are writing a push notification for a government staff digital skills app.

{$prompts[$type]}

Keep the title under 50 characters and the body under 120 characters. Be encouraging, specific, and action-oriented.

Provide a JSON response with exactly this structure:
{"title": "...", "body": "..."}
{$this->getLanguageInstruction($locale)}
PROMPT;

            return $this->callGemini($prompt, [
                'title' => 'Digital Skills Update',
                'body' => 'Check your digital skills progress and recommendations.',
            ]);
        });
    }

    // ──────────────────────────────────────────────
    //  Private Helpers
    // ──────────────────────────────────────────────

    private function getDsriLevelContext(): string
    {
        return "DSRI Level Classification:\n"
            . "- 0-20: Novice — minimal digital capability; urgent intervention needed\n"
            . "- 21-40: Beginner — basic awareness; structured training required\n"
            . "- 41-60: Intermediate — functional skills; targeted improvement needed\n"
            . "- 61-80: Proficient — strong capability; refinement and leadership opportunities\n"
            . "- 81-100: Advanced — expert-level; can mentor others and drive innovation";
    }

    private function getLanguageInstruction(string $locale): string
    {
        return $locale === 'ms'
            ? "\n\nIMPORTANT: Respond entirely in Bahasa Melayu. All text, findings, and advice must be in Bahasa Melayu."
            : "\n\nRespond in English.";
    }

    private function formatCompetencyName(string $code, string $locale): string
    {
        $competencies = $this->dsriService->getCompetencies();
        $config = $competencies[$code] ?? null;
        if (!$config) {
            return $code;
        }
        return $locale === 'ms'
            ? "{$config['name_ms']} ({$config['name_en']})"
            : $config['name_en'];
    }

    private function buildUserContext(User $user): string
    {
        $role = $user->roles->first()?->name ?? 'Staff';
        $field = $user->working_field ?? 'Not specified';
        $level = $user->job_level ?? 'Not specified';
        $exp = $user->experience_years ?? 'Not specified';

        return "- Role: {$role}\n- Working field: {$field}\n- Job level: {$level}\n- Experience: {$exp} years";
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

    private function callGeminiRaw(string $prompt, int $maxTokens = 256): ?string
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
                        'maxOutputTokens' => $maxTokens,
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
