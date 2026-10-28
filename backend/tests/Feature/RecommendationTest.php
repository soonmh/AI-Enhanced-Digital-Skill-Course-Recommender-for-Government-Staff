<?php

namespace Tests\Feature;

use App\Models\Assessment;
use App\Models\Course;
use App\Models\CourseCompetencyMapping;
use App\Models\Role;
use App\Models\User;
use App\Models\UserCourse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class RecommendationTest extends TestCase
{
    use RefreshDatabase;

    private User $staffUser;

    protected function setUp(): void
    {
        parent::setUp();

        $role = Role::create(['name' => 'Staff', 'guard_name' => 'web']);
        $this->staffUser = User::factory()->create();
        $this->staffUser->roles()->attach($role);
    }

    public function test_no_assessment_returns_popular_courses(): void
    {
        Course::factory()->count(3)->create();

        $response = $this->actingAs($this->staffUser)
            ->getJson('/api/courses/recommended');

        $response->assertStatus(200)
            ->assertJson(['has_assessment' => false])
            ->assertJsonStructure(['courses', 'has_assessment']);
    }

    public function test_with_assessment_returns_weak_sections(): void
    {
        $course = Course::factory()->create();
        CourseCompetencyMapping::create([
            'course_id' => $course->id,
            'competency_code' => 'C1',
        ]);

        $assessment = Assessment::create(['title' => 'Test', 'description' => 'Test']);

        // Create assessment with weak C1 score
        $this->staffUser->assessmentResponses()->create([
            'assessment_id' => $assessment->id,
            'c1_score' => 10,  // weak (< 50 out of 75)
            'c2_score' => 60,
            'c3_score' => 40,
            'c4_score' => 40,
            'c5_score' => 40,
            'c6_score' => 40,
            'c7_score' => 45,
            'c8_score' => 15,
            'c9_score' => 20,
            'c10_score' => 40,
            'dsri' => 30,
            'submitted_at' => now(),
            'endorsement_status' => 'endorsed',
        ]);

        $response = $this->actingAs($this->staffUser)
            ->getJson('/api/courses/recommended');

        $response->assertStatus(200)
            ->assertJson(['has_assessment' => true]);

        $data = $response->json();
        $this->assertContains('C1', $data['weak_sections']);
    }

    public function test_enrolled_courses_excluded_from_recommendations(): void
    {
        $course = Course::factory()->create();
        UserCourse::create([
            'user_id' => $this->staffUser->id,
            'course_id' => $course->id,
            'progress' => 50,
            'status' => 'active',
            'started_at' => now(),
        ]);

        $response = $this->actingAs($this->staffUser)
            ->getJson('/api/courses/recommended');

        $response->assertStatus(200);
        $courseIds = collect($response->json('courses'))->pluck('id')->toArray();
        $this->assertNotContains($course->id, $courseIds);
    }

    public function test_courses_can_be_filtered_by_competency_code(): void
    {
        $course1 = Course::factory()->create(['title' => 'Digital Literacy Course']);
        $course2 = Course::factory()->create(['title' => 'Other Course']);

        CourseCompetencyMapping::create([
            'course_id' => $course1->id,
            'competency_code' => 'C1',
        ]);
        CourseCompetencyMapping::create([
            'course_id' => $course2->id,
            'competency_code' => 'C2',
        ]);

        $response = $this->actingAs($this->staffUser)
            ->getJson('/api/courses?competency_code=C1');

        $response->assertStatus(200);
        $titles = collect($response->json())->pluck('title')->toArray();
        $this->assertContains('Digital Literacy Course', $titles);
        $this->assertNotContains('Other Course', $titles);
    }

    /** Endorsed assessment that is weak in C1 only, plus $courses courses that cover C1. */
    private function weakInC1WithCourses(int $courses): void
    {
        foreach (Course::factory()->count($courses)->create(['level' => 'beginner']) as $course) {
            CourseCompetencyMapping::create(['course_id' => $course->id, 'competency_code' => 'C1']);
        }
        $this->staffUser->assessmentResponses()->create([
            'assessment_id' => Assessment::create(['title' => 'Test', 'description' => 'Test'])->id,
            'c1_score' => 10, 'c2_score' => 75, 'c3_score' => 50, 'c4_score' => 50, 'c5_score' => 50,
            'c6_score' => 50, 'c7_score' => 55, 'c8_score' => 20, 'c9_score' => 25, 'c10_score' => 50,
            'dsri' => 88, 'submitted_at' => now(), 'endorsement_status' => 'endorsed',
        ]);
    }

    private function geminiReply(string $text): array
    {
        return ['candidates' => [['content' => ['parts' => [['text' => $text]]]]]];
    }

    public function test_course_explanations_are_fetched_once_per_course_and_cached(): void
    {
        config(['services.gemini.key' => 'test-key']);
        Http::fake(['generativelanguage.googleapis.com/*' => Http::response($this->geminiReply('Fills your C1 gap.'))]);
        $this->weakInC1WithCourses(3);

        $response = $this->actingAs($this->staffUser)->getJson('/api/courses/recommended')->assertOk();
        $this->assertSame(
            ['Fills your C1 gap.', 'Fills your C1 gap.', 'Fills your C1 gap.'],
            array_column($response->json('courses'), 'ai_explanation')
        );
        Http::assertSentCount(3);

        // Recomputing the recommendations reuses the cached explanations
        Cache::forget("hybrid_recommendations:{$this->staffUser->id}");
        $this->actingAs($this->staffUser)->getJson('/api/courses/recommended')->assertOk();
        Http::assertSentCount(3);
    }

    public function test_failed_explanation_falls_back_and_is_retried_later(): void
    {
        config(['services.gemini.key' => 'test-key']);
        Http::fakeSequence('generativelanguage.googleapis.com/*')
            ->pushStatus(500)
            ->push($this->geminiReply('Fills your C1 gap.'));
        $this->weakInC1WithCourses(1);

        $this->actingAs($this->staffUser)->getJson('/api/courses/recommended')
            ->assertOk()
            ->assertJsonPath('courses.0.ai_explanation', 'This course addresses your weak areas: Digital Literacy (C1): 13.3%.');

        // The fallback isn't cached (not even inside the 6h recommendations cache),
        // so the very next request asks Gemini again
        $this->actingAs($this->staffUser)->getJson('/api/courses/recommended')
            ->assertOk()
            ->assertJsonPath('courses.0.ai_explanation', 'Fills your C1 gap.');
    }

    public function test_control_group_flags_weak_sections_relative_to_max_score(): void
    {
        config(['services.recommendations.ab_testing' => true, 'services.recommendations.control_ratio' => 1.0]);
        Http::fake();

        // Every category at 80% of its max score: nothing is weak
        $this->staffUser->assessmentResponses()->create([
            'assessment_id' => Assessment::create(['title' => 'Test', 'description' => 'Test'])->id,
            'c1_score' => 60, 'c2_score' => 60, 'c3_score' => 40, 'c4_score' => 40, 'c5_score' => 40,
            'c6_score' => 40, 'c7_score' => 44, 'c8_score' => 16, 'c9_score' => 20, 'c10_score' => 40,
            'dsri' => 80, 'submitted_at' => now(), 'endorsement_status' => 'endorsed',
        ]);

        $this->actingAs($this->staffUser)->getJson('/api/courses/recommended')
            ->assertOk()
            ->assertJsonPath('recommendation_method', 'legacy')
            ->assertJsonPath('weak_sections', []);
    }

    public function test_course_show_includes_peer_enrollments(): void
    {
        $course = Course::factory()->create();
        $peer = User::factory()->create(['name' => 'Peer User']);
        UserCourse::create([
            'user_id' => $peer->id,
            'course_id' => $course->id,
            'progress' => 75,
            'status' => 'active',
            'started_at' => now(),
        ]);

        $response = $this->actingAs($this->staffUser)
            ->getJson("/api/courses/{$course->id}");

        $response->assertStatus(200)
            ->assertJsonStructure(['peer_enrollments']);
    }
}
