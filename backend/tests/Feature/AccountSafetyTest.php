<?php

namespace Tests\Feature;

use App\Models\Assessment;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class AccountSafetyTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    private function userWithRole(string $role, array $attributes = []): User
    {
        $user = User::factory()->createOne($attributes);
        $user->roles()->attach(Role::where('name', $role)->first());

        return $user;
    }

    public function test_forgot_password_responds_without_error(): void
    {
        $user = User::factory()->createOne();

        $this->postJson('/api/forgot-password', ['email' => $user->email])->assertOk();
    }

    public function test_reset_link_opens_the_frontend_page_and_its_token_works(): void
    {
        Notification::fake();
        $user = User::factory()->createOne();

        $this->postJson('/api/forgot-password', ['email' => $user->email])->assertOk();

        $url = null;
        Notification::assertSentTo($user, ResetPassword::class, function (ResetPassword $notification) use ($user, &$url) {
            $url = $notification->toMail($user)->actionUrl;
            return true;
        });
        $this->assertStringStartsWith(config('app.frontend_url') . '/reset-password?token=', $url);

        parse_str(parse_url($url, PHP_URL_QUERY), $query);
        $this->postJson('/api/reset-password', [
            'token' => $query['token'],
            'email' => $user->email,
            'password' => 'NewPass12345',
            'password_confirmation' => 'NewPass12345',
        ])->assertOk();
        $this->assertTrue(Hash::check('NewPass12345', $user->fresh()->password));
    }

    public function test_admin_deactivation_cuts_off_an_existing_session(): void
    {
        $adminToken = $this->userWithRole('Admin')->createToken('test')->plainTextToken;
        $staff = $this->userWithRole('Staff');
        $staffToken = $staff->createToken('test')->plainTextToken;

        $this->withToken($staffToken)->getJson('/api/user')->assertOk();

        // forgetGuards(): each real request authenticates from scratch
        $this->app['auth']->forgetGuards();
        $this->withToken($adminToken)->putJson("/api/admin/users/{$staff->id}", ['is_active' => false])->assertOk();

        $this->app['auth']->forgetGuards();
        $this->withToken($staffToken)->getJson('/api/user')->assertUnauthorized();
    }

    public function test_an_inactive_account_is_refused_even_with_a_valid_token(): void
    {
        $staff = $this->userWithRole('Staff');
        $token = $staff->createToken('test')->plainTextToken;
        $staff->update(['is_active' => false]);

        $this->withToken($token)->getJson('/api/user')->assertUnauthorized();
    }

    public function test_the_last_active_admin_cannot_be_deactivated_or_demoted(): void
    {
        $admin = $this->userWithRole('Admin');

        $this->actingAs($admin)->putJson("/api/admin/users/{$admin->id}", ['is_active' => false])->assertForbidden();
        $this->actingAs($admin)->putJson("/api/admin/users/{$admin->id}", ['role' => 'Staff'])->assertForbidden();
        $this->actingAs($admin)->postJson('/api/user/deactivate', ['password' => 'password'])->assertForbidden();
        $this->assertTrue((bool) $admin->fresh()->is_active);
        $this->assertTrue($admin->fresh()->hasRole('Admin'));

        // Once there's another active admin, it's allowed
        $this->userWithRole('Admin');
        $this->actingAs($admin)->putJson("/api/admin/users/{$admin->id}", ['role' => 'Staff'])->assertOk();
    }

    public function test_the_last_active_admin_cannot_be_deleted_when_the_other_admin_is_inactive(): void
    {
        $admin = $this->userWithRole('Admin');
        $this->userWithRole('Admin', ['is_active' => false]);

        $this->actingAs($admin)->deleteJson("/api/admin/users/{$admin->id}")->assertForbidden();
        $this->assertModelExists($admin);
    }

    public function test_registering_with_a_deactivated_accounts_email_is_refused_and_keeps_its_data(): void
    {
        $old = $this->userWithRole('Staff', ['is_active' => false]);
        $old->assessmentResponses()->create([
            'assessment_id' => Assessment::create(['title' => 'DSRA', 'description' => 'Test'])->id,
            'dsri' => 60, 'submitted_at' => now(),
        ]);

        $this->postJson('/api/register', [
            'name' => 'Someone Else',
            'email' => $old->email,
            'password' => 'Secret12345',
            'password_confirmation' => 'Secret12345',
        ])
            ->assertStatus(422)
            ->assertJsonPath('errors.email.0', 'This account has been deactivated. Please ask an administrator to reactivate it.');

        $this->assertModelExists($old);
        $this->assertSame(1, $old->assessmentResponses()->count());
    }
}
