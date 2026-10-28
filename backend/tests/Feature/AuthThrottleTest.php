<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Logins and registrations reach Laravel from the Next.js server, so in production they all
 * share one IP — like the test client here.
 */
class AuthThrottleTest extends TestCase
{
    use RefreshDatabase;

    public function test_many_testers_can_log_in_within_a_minute(): void
    {
        $users = User::factory()->count(8)->create(['password' => 'pass12345']);

        foreach ($users as $user) {
            $this->postJson('/api/login', ['email' => $user->email, 'password' => 'pass12345'])->assertOk();
            // Each real login arrives as a guest with a fresh session (NextAuth uses a new cookie jar
            // per sign-in), so don't let this login's session make the next request authenticated
            $this->app['session.store']->flush();
            $this->app['auth']->forgetGuards();
        }
    }

    public function test_repeated_failed_logins_for_one_account_are_still_throttled(): void
    {
        $user = User::factory()->createOne();

        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/login', ['email' => $user->email, 'password' => 'wrong'])->assertStatus(422);
        }
        $this->postJson('/api/login', ['email' => $user->email, 'password' => 'wrong'])->assertStatus(429);
    }

    public function test_many_testers_can_register_within_a_minute(): void
    {
        $this->seed(RolePermissionSeeder::class);

        for ($i = 1; $i <= 8; $i++) {
            $this->postJson('/api/register', [
                'name' => "Tester {$i}",
                'email' => "tester{$i}@example.com",
                'password' => 'Secret12345',
                'password_confirmation' => 'Secret12345',
            ])->assertCreated();
        }
    }
}
