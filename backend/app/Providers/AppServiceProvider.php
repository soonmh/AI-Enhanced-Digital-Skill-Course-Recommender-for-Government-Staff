<?php

namespace App\Providers;

use App\Events\AssessmentEndorsed;
use App\Events\AssessmentSubmitted;
use App\Events\CourseCompleted;
use App\Listeners\GenerateAiInsights;
use App\Listeners\InvalidateRecommendationCache;
use App\Listeners\IssueCertificate;
use App\Listeners\NotifyHodOfPendingEndorsement;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Logins and registrations reach Laravel from the Next.js server, so they all share one IP.
        // Throttle per account instead, so one user's attempts can't lock everyone else out.
        RateLimiter::for('auth', fn (Request $request) => Limit::perMinute(5)->by(
            Str::lower((string) $request->input('email')) . '|' . $request->ip()
        ));

        Event::listen(
            AssessmentSubmitted::class,
            [GenerateAiInsights::class, 'handle'],
        );
        Event::listen(
            AssessmentSubmitted::class,
            [NotifyHodOfPendingEndorsement::class, 'handle'],
        );
        Event::listen(
            AssessmentSubmitted::class,
            [InvalidateRecommendationCache::class, 'handle'],
        );
        Event::listen(
            AssessmentEndorsed::class,
            [IssueCertificate::class, 'handle'],
        );
        Event::listen(
            AssessmentEndorsed::class,
            [InvalidateRecommendationCache::class, 'handle'],
        );
        Event::listen(
            CourseCompleted::class,
            [InvalidateRecommendationCache::class, 'handle'],
        );
    }
}
