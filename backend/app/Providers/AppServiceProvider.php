<?php

namespace App\Providers;

use App\Events\AssessmentEndorsed;
use App\Events\AssessmentSubmitted;
use App\Events\CourseCompleted;
use App\Listeners\GenerateAiInsights;
use App\Listeners\InvalidateRecommendationCache;
use App\Listeners\IssueCertificate;
use App\Listeners\NotifyHodOfPendingEndorsement;
use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;

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

        // The API has no web routes, so reset links open the frontend's /reset-password page
        ResetPassword::createUrlUsing(fn (User $user, string $token) => config('app.frontend_url')
            . '/reset-password?token=' . $token . '&email=' . urlencode($user->email));

        // Deactivated accounts are refused on every request, even with a token issued before
        Sanctum::authenticateAccessTokensUsing(
            fn ($accessToken, bool $isValid) => $isValid && (bool) $accessToken->tokenable?->is_active
        );

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
