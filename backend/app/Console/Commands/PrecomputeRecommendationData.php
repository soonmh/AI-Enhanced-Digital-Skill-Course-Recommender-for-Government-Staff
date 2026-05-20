<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\UserSimilarityCache;
use App\Services\CollaborativeFilteringService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

class PrecomputeRecommendationData extends Command
{
    protected $signature = 'recommendations:precompute {--force : Force recomputation}';

    protected $description = 'Precompute user similarity matrix for collaborative filtering';

    public function handle(CollaborativeFilteringService $cfService): int
    {
        $users = User::whereHas('latestAssessmentResponse')
            ->with('latestAssessmentResponse')
            ->get();

        if ($users->isEmpty()) {
            $this->warn('No users with assessment responses found.');

            return self::SUCCESS;
        }

        $this->info("Computing similarity matrix for {$users->count()} users...");

        if ($this->option('force')) {
            UserSimilarityCache::query()->delete();
            $this->info('Cleared existing similarity data.');
        }

        $bar = $this->output->createProgressBar($users->count());
        $computed = 0;

        foreach ($users as $i => $userA) {
            $responseA = $userA->latestAssessmentResponse;
            if (!$responseA) {
                $bar->advance();
                continue;
            }

            foreach ($users->slice($i + 1) as $userB) {
                $responseB = $userB->latestAssessmentResponse;
                if (!$responseB) {
                    continue;
                }

                $similarity = $cfService->computeUserSimilarity($responseA, $responseB);

                if ($similarity >= 0.1) {
                    $smallerId = min($userA->id, $userB->id);
                    $largerId = max($userA->id, $userB->id);

                    UserSimilarityCache::updateOrCreate(
                        ['user_id_a' => $smallerId, 'user_id_b' => $largerId],
                        ['similarity_score' => $similarity, 'computed_at' => now()]
                    );
                }
                $computed++;
            }

            $bar->advance();
        }

        $bar->finish();
        $stored = UserSimilarityCache::count();
        $this->info("\nComputed {$computed} pairs, stored {$stored} similarity records (threshold >= 0.1).");

        // Clear hybrid recommendation caches so they regenerate with fresh similarity data
        $this->info('Clearing recommendation caches...');
        $cleared = 0;
        foreach ($users as $user) {
            Cache::forget("hybrid_recommendations:{$user->id}");
            $cleared++;
        }
        $this->info("Cleared {$cleared} recommendation caches.");

        return self::SUCCESS;
    }
}
