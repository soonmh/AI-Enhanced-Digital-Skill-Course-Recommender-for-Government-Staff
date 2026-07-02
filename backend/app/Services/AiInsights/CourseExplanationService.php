<?php

namespace App\Services\AiInsights;

use Illuminate\Support\Facades\Cache;
use App\Services\Concerns\FormatsInsightContext;
use App\Services\Concerns\UsesGeminiApi;

class CourseExplanationService
{
    use FormatsInsightContext;
    use UsesGeminiApi;

    public function generate(string $courseTitle, string $courseDescription, array $weakCompetencies, string $locale = 'en'): string
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

    public function generateEnhanced(string $courseTitle, string $courseDescription, array $explanationData, string $locale = 'en'): string
    {
        $matchedComps = $explanationData['matched_competencies'] ?? [];
        if (empty($matchedComps)) {
            return '';
        }

        $compText = collect($matchedComps)->map(fn($c) => "{$c['name']} ({$c['code']}): {$c['user_pct']}%")->implode(', ');
        $dsri = $explanationData['dsri'] ?? 0;
        $peerCount = $explanationData['peer_count'] ?? 0;
        $courseLevel = $explanationData['course_level'] ?? 'beginner';
        $avgRating = $explanationData['course_avg_rating'] ?? null;

        $peerContext = $peerCount > 0 && $avgRating
            ? " {$peerCount} learners with similar skill profiles rated this course {$avgRating}/5."
            : '';

        $cacheKey = "ai_enhanced_course_exp:" . md5($courseTitle . $compText . $locale . $peerCount);

        return Cache::remember($cacheKey, now()->addHours(12), function () use ($courseTitle, $courseDescription, $compText, $dsri, $peerContext, $courseLevel, $locale) {
            $prompt = <<<PROMPT
You are recommending a course to a Malaysian government staff member.

Course: {$courseTitle} ({$courseLevel} level)
Description: {$courseDescription}

Staff member's DSRI: {$dsri}/100
Their weak areas this course covers: {$compText}
{$peerContext}

In 1-2 sentences, explain specifically why this course would help. Reference their actual scores where relevant. Be direct and practical.
Respond with plain text only, no JSON.
{$this->getLanguageInstruction($locale)}
PROMPT;

            $result = $this->callGeminiRaw($prompt, 384);
            return $result ?? "This course addresses your weak areas: {$compText}.";
        });
    }
}
