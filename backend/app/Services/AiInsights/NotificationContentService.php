<?php

namespace App\Services\AiInsights;

use Illuminate\Support\Facades\Cache;
use App\Services\Concerns\UsesGeminiApi;

class NotificationContentService
{
    use UsesGeminiApi;

    public function generate(string $type, array $context, string $locale = 'en'): array
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
}
