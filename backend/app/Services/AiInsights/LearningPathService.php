<?php

namespace App\Services\AiInsights;

use App\Models\Course;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use App\Services\Concerns\FormatsInsightContext;
use App\Services\Concerns\UsesGeminiApi;

class LearningPathService
{
    use FormatsInsightContext;
    use UsesGeminiApi;

    public function generate(User $user, string $locale = 'en'): array
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
            $competencies = $this->dsriService()->getCompetencies();
            $weakAreas = [];

            foreach ($competencies as $code => $config) {
                $field = strtolower($code) . '_score';
                $score = $latest->$field ?? 0;
                $pct = round(($score / $config['max_score']) * 100, 1);
                if ($pct < 60) {
                    $weakAreas[$code] = [
                        'name' => $this->formatCompetencyName($code, $locale),
                        'pct' => $pct,
                    ];
                }
            }

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
}
