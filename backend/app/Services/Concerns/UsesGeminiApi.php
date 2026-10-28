<?php

namespace App\Services\Concerns;

use Illuminate\Http\Client\Pool;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

trait UsesGeminiApi
{
    protected function callGemini(string $prompt, array $fallback): array
    {
        try {
            $apiKey = config('services.gemini.key');
            $model = config('services.gemini.model', 'gemini-3.1-flash-lite');

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

    protected function callGeminiRaw(string $prompt, int $maxTokens = 256): ?string
    {
        try {
            $apiKey = config('services.gemini.key');
            $model = config('services.gemini.model', 'gemini-3.1-flash-lite');

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

    /**
     * Send several plain-text prompts to Gemini concurrently, so the total wait is
     * about one round-trip. Returns [key => text], with null for any request that
     * failed or timed out.
     */
    protected function callGeminiRawMany(array $prompts, int $maxTokens = 256, int $timeout = 15): array
    {
        $texts = array_fill_keys(array_keys($prompts), null);
        $apiKey = config('services.gemini.key');
        $model = config('services.gemini.model', 'gemini-3.1-flash-lite');

        if (empty($apiKey) || empty($prompts)) {
            return $texts;
        }

        $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}";

        try {
            $responses = Http::pool(fn (Pool $pool) => collect($prompts)->map(
                fn ($prompt, $key) => $pool->as((string) $key)->timeout($timeout)->post($url, [
                    'contents' => [['parts' => [['text' => $prompt]]]],
                    'generationConfig' => [
                        'temperature' => 0.3,
                        'maxOutputTokens' => $maxTokens,
                    ],
                ])
            )->all());
        } catch (\Throwable $e) {
            Log::error('Gemini API exception', ['message' => $e->getMessage()]);
            return $texts;
        }

        foreach ($texts as $key => $_) {
            $response = $responses[$key] ?? null;
            if ($response instanceof Response && $response->successful()) {
                $texts[$key] = $response->json('candidates.0.content.parts.0.text');
            }
        }

        return $texts;
    }
}
