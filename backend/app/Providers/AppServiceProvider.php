<?php

namespace App\Providers;

use App\Events\AssessmentSubmitted;
use App\Events\CourseCompleted;
use App\Listeners\GenerateAiInsights;
use App\Listeners\InvalidateRecommendationCache;
use App\Listeners\IssueCertificate;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Event::listen(
            AssessmentSubmitted::class,
            [GenerateAiInsights::class, 'handle'],
        );
        Event::listen(
            AssessmentSubmitted::class,
            [IssueCertificate::class, 'handle'],
        );
        Event::listen(
            AssessmentSubmitted::class,
            [InvalidateRecommendationCache::class, 'handle'],
        );
        Event::listen(
            CourseCompleted::class,
            [InvalidateRecommendationCache::class, 'handle'],
        );
    }
}
