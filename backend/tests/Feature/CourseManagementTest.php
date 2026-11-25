<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Role;
use App\Models\User;
use App\Models\UserCourse;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CourseManagementTest extends TestCase
{
    use RefreshDatabase;

    private function trainer(): User
    {
        $this->seed(RolePermissionSeeder::class);
        $user = User::factory()->create();
        $user->roles()->attach(Role::where('name', 'Trainer')->first());

        return $user;
    }

    private function codes(Course $course): array
    {
        return $course->competencyMappings()->orderBy('competency_code')->pluck('competency_code')->all();
    }

    public function test_deleting_a_course_creator_keeps_their_courses_and_everyones_progress(): void
    {
        $trainer = $this->trainer();
        $course = Course::factory()->create(['created_by' => $trainer->id]);
        $learner = User::factory()->createOne();
        UserCourse::create([
            'user_id' => $learner->id, 'course_id' => $course->id,
            'progress' => 60, 'status' => 'active', 'started_at' => now(),
        ]);
        $admin = User::factory()->createOne();
        $admin->roles()->attach(Role::where('name', 'Admin')->first());

        $this->actingAs($admin)->deleteJson("/api/admin/users/{$trainer->id}")->assertOk();

        $this->assertModelExists($course);
        $this->assertNull($course->fresh()->created_by);
        $this->assertDatabaseHas('user_courses', ['user_id' => $learner->id, 'course_id' => $course->id, 'progress' => 60]);
        $this->actingAs($learner)->getJson("/api/courses/{$course->id}")->assertOk()->assertJsonPath('created_by', null);
    }

    public function test_creating_and_editing_a_course_saves_its_competency_mapping(): void
    {
        $trainer = $this->trainer();

        $id = $this->actingAs($trainer)->postJson('/api/courses', [
            'title' => 'Cyber Hygiene',
            'level' => 'beginner',
            'url' => 'https://example.com/cyber',
            'competency_codes' => ['C5', 'C9'],
        ])->assertCreated()->json('course.id');

        $course = Course::findOrFail($id);
        $this->assertSame(['C5', 'C9'], $this->codes($course));
        $this->assertSame('https://example.com/cyber', $course->url);

        // Editing replaces the mapping
        $this->actingAs($trainer)->putJson("/api/courses/{$id}", [
            'title' => 'Cyber Hygiene',
            'level' => 'beginner',
            'competency_codes' => ['C5'],
        ])->assertOk();
        $this->assertSame(['C5'], $this->codes($course));

        // An edit that doesn't send competency_codes leaves the mapping alone
        $this->actingAs($trainer)->putJson("/api/courses/{$id}", [
            'title' => 'Cyber Hygiene v2',
            'level' => 'intermediate',
        ])->assertOk();
        $this->assertSame(['C5'], $this->codes($course));
    }

    public function test_course_detail_returns_working_field_for_the_edit_form(): void
    {
        $trainer = $this->trainer();
        $course = Course::create(['title' => 'Data 101', 'level' => 'beginner', 'working_field' => 'Finance', 'created_by' => $trainer->id]);

        $this->actingAs($trainer)->getJson("/api/courses/{$course->id}")
            ->assertOk()
            ->assertJsonPath('working_field', 'Finance');
    }
}
