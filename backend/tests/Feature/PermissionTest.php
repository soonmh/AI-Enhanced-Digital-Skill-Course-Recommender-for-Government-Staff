<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PermissionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    private function createUserWithRole(string $roleName): User
    {
        $user = User::factory()->create();
        $role = Role::where('name', $roleName)->first();
        $user->roles()->attach($role);
        return $user;
    }

    public function test_staff_cannot_access_admin_user_management(): void
    {
        $staff = $this->createUserWithRole('Staff');

        $response = $this->actingAs($staff)->getJson('/api/admin/users');
        $response->assertStatus(403);
    }

    public function test_staff_cannot_access_staff_analysis(): void
    {
        $staff = $this->createUserWithRole('Staff');

        $response = $this->actingAs($staff)->getJson('/api/reports/staff-analysis');
        $response->assertStatus(403);
    }

    public function test_top_management_can_access_reports(): void
    {
        $mgmt = $this->createUserWithRole('Top Management');

        $response = $this->actingAs($mgmt)->getJson('/api/reports/staff-analysis');
        $response->assertStatus(200);
    }

    public function test_top_management_cannot_manage_courses(): void
    {
        $mgmt = $this->createUserWithRole('Top Management');

        $response = $this->actingAs($mgmt)->postJson('/api/courses', [
            'title' => 'Test',
        ]);
        $response->assertStatus(403);
    }

    public function test_trainer_can_manage_courses(): void
    {
        $trainer = $this->createUserWithRole('Trainer');

        $response = $this->actingAs($trainer)->postJson('/api/courses', [
            'title' => 'Test Course',
            'description' => 'Desc',
            'level' => 'beginner',
            'competency_codes' => ['C1'],
        ]);
        $response->assertStatus(201);
    }

    public function test_unauthenticated_gets_401(): void
    {
        $response = $this->getJson('/api/dashboard');
        $response->assertStatus(401);
    }

    public function test_admin_can_access_user_management(): void
    {
        $admin = $this->createUserWithRole('Admin');

        $response = $this->actingAs($admin)->getJson('/api/admin/users');
        $response->assertStatus(200);
    }
}
