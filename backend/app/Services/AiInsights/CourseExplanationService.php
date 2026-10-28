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
        return $this->resolve([$this->request($courseTitle, $courseDescription, $weakCompetencies, $locale)])[0];
    }

    public function generateEnhanced(string $courseTitle, string $courseDescription, array $explanationData, string $locale = 'en'): string
    {
        return $this->resolve([$this->enhancedRequest($courseTitle, $courseDescription, $explanationData, $locale)])[0];
    }

    /**
     * Cache key, prompt and fallback for a legacy (A/B control) explanation; null when there is nothing to explain.
     */
    public function request(string $courseTitle, string $courseDescription, array $weakCompetencies, string $locale = 'en'): ?array
    {
        if (empty($weakCompetencies)) {
            return null;
        }

        $weakText = implode(', ', $weakCompetencies);

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

        return [
            'cache_key' => "ai_course_explanation:" . md5($courseTitle . $weakText . $locale),
            'prompt' => $prompt,
            'fallback' => "This course can help strengthen your skills in: {$weakText}.",
        ];
    }

    /**
     * Cache key, prompt and fallback for a hybrid-engine explanation; null when there is nothing to explain.
     */
    public function enhancedRequest(string $courseTitle, string $courseDescription, array $explanationData, string $locale = 'en'): ?array
    {
        $matchedComps = $explanationData['matched_competencies'] ?? [];
        if (empty($matchedComps)) {
            return null;
        }

        $compText = collect($matchedComps)->map(fn($c) => "{$c['name']} ({$c['code']}): {$c['user_pct']}%")->implode(', ');
        $dsri = $explanationData['dsri'] ?? 0;
        $peerCount = $explanationData['peer_count'] ?? 0;
        $courseLevel = $explanationData['course_level'] ?? 'beginner';
        $avgRating = $explanationData['course_avg_rating'] ?? null;

        $peerContext = $peerCount > 0 && $avgRating
            ? " {$peerCount} learners with similar skill profiles rated this course {$avgRating}/5."
            : '';

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

        return [
            'cache_key' => "ai_enhanced_course_exp:" . md5($courseTitle . $compText . $locale . $peerCount),
            'prompt' => $prompt,
            'fallback' => "This course addresses your weak areas: {$compText}.",
        ];
    }

    /**
     * Turn explanation requests into text. Cached explanations are reused and the rest
     * go to Gemini concurrently, so a page of recommendations costs one Gemini round-trip
     * instead of one per course (sequential calls overran PHP's 30s limit). Fallback text
     * is returned but not cached, so a failed or slow request is retried next time.
     */
    public function resolve(array $requests): array
    {
        $texts = [];
        $prompts = [];
        foreach ($requests as $key => $request) {
            if (!$request) {
                $texts[$key] = '';
            } elseif (($cached = Cache::get($request['cache_key'])) !== null) {
                $texts[$key] = $cached;
            } else {
                $prompts[$key] = $request['prompt'];
            }
        }

        foreach ($this->callGeminiRawMany($prompts, 384) as $key => $text) {
            if ($text !== null) {
                Cache::put($requests[$key]['cache_key'], $text, now()->addHours(12));
            }
            $texts[$key] = $text ?? $requests[$key]['fallback'];
        }

        return $texts;
    }
}
