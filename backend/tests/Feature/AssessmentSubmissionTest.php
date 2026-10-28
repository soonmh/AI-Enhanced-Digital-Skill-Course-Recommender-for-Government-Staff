<?php

namespace Tests\Feature;

use App\Events\AssessmentSubmitted;
use App\Models\Assessment;
use App\Models\AssessmentResponse;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Redis;
use Tests\TestCase;

class AssessmentSubmissionTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Assessment $assessment;
    private array $sections;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);

        $this->user = User::factory()->create();
        $this->user->roles()->attach(Role::where('name', 'Staff')->first());
        $this->assessment = Assessment::create(['title' => 'DSRA', 'description' => 'Test']);

        // Keep submissions offline: no AI prewarm job / HOD notification, no Redis publish
        Event::fake([AssessmentSubmitted::class]);
        Redis::shouldReceive('publish')->andReturn(0)->byDefault();

        $this->sections = $this->actingAs($this->user)->getJson('/api/assessment/start')->json('sections');
    }

    /** Answer every question with $rating, except the given question-id overrides. */
    private function answers(int $rating, array $overrides = []): array
    {
        $answers = [];
        foreach ($this->sections as $section) {
            foreach ($section['questions'] as $question) {
                $answers[$question['id']] = $rating;
            }
        }

        return array_merge($answers, $overrides);
    }

    private function submit(array $payload)
    {
        return $this->actingAs($this->user)
            ->postJson('/api/assessment/submit', $payload + ['assessment_id' => $this->assessment->id]);
    }

    /** Retest one section with every question rated $rating, a minute after the previous submission. */
    private function retest(string $code, int $rating)
    {
        $this->travel(1)->minutes();
        $questions = collect($this->sections)->firstWhere('section_code', $code)['questions'];

        return $this->actingAs($this->user)->postJson('/api/assessment/submit-section', [
            'section_code' => $code,
            'answers' => collect($questions)->mapWithKeys(fn ($q) => [$q['id'] => $rating])->all(),
        ]);
    }

    public function test_all_fives_score_every_section_at_max_and_dsri_100(): void
    {
        $this->submit(['answers' => $this->answers(5)])->assertCreated();

        $response = AssessmentResponse::firstOrFail();
        foreach ($this->sections as $section) {
            $field = strtolower($section['section_code']) . '_score';
            $this->assertEquals($section['max_score'], (float) $response->$field, $section['section_code']);
        }
        $this->assertEquals(100, (float) $response->dsri);
    }

    public function test_question_weights_are_applied(): void
    {
        // C1_Q7 has weight 3, the other six C1 questions weight 2: 6×2×1 + 3×5 = 27 (unweighted sum would be 11)
        $this->submit(['answers' => $this->answers(1, ['C1_Q7' => 5])])->assertCreated();

        $response = AssessmentResponse::firstOrFail();
        $this->assertEquals(27, (float) $response->c1_score);
        // C1: 27/75×15 = 5.4; every other section scores 1/5 of its weight: 85/5 = 17
        $this->assertEquals(22.4, (float) $response->dsri);
    }

    public function test_submission_succeeds_when_realtime_publish_fails(): void
    {
        Redis::shouldReceive('publish')->andThrow(new \RuntimeException('Redis is down'));

        $this->submit(['answers' => $this->answers(4)])->assertCreated();
        $this->assertDatabaseCount('assessment_responses', 1);
    }

    public function test_client_supplied_scores_are_rejected(): void
    {
        $this->submit(['responses' => [['section' => 'C1', 'score' => 75]]])
            ->assertStatus(422)
            ->assertJsonValidationErrors('answers');

        $this->assertDatabaseCount('assessment_responses', 0);
    }

    public function test_out_of_range_or_missing_answers_are_rejected(): void
    {
        $this->submit(['answers' => $this->answers(5, ['C1_Q1' => 6])])->assertStatus(422);

        $incomplete = $this->answers(5);
        unset($incomplete['C10_Q6']);
        $this->submit(['answers' => $incomplete])->assertStatus(422);

        $this->assertDatabaseCount('assessment_responses', 0);
    }

    public function test_section_retest_is_scored_on_server(): void
    {
        $this->submit(['answers' => $this->answers(3)])->assertCreated();

        $this->actingAs($this->user)
            ->postJson('/api/assessment/submit-section', ['section_code' => 'C5', 'score' => 50])
            ->assertStatus(422);

        $this->retest('C5', 5)
            ->assertCreated()
            ->assertJson(['section_code' => 'C5', 'score' => 50, 'max_score' => 50, 'percentage' => 100]);

        $retest = AssessmentResponse::where('assessment_type', 'section')->firstOrFail();
        $this->assertSame('C5', $retest->section_code);
        $this->assertEquals(50, (float) $retest->c5_score);
    }

    public function test_section_retest_is_not_read_as_a_full_assessment(): void
    {
        // Full assessment at all 3s (C1 = 45/75), then a C5 retest at all 5s
        $this->submit(['answers' => $this->answers(3)])->assertCreated();
        $this->retest('C5', 5)->assertCreated();

        $this->assertSame('full', $this->user->fresh()->latestAssessmentResponse->assessment_type);

        $dashboard = $this->actingAs($this->user)->getJson('/api/dashboard')->assertOk();
        $this->assertEquals(45, (float) $dashboard->json('latestSectionScores.C1.score'));
        $this->assertSame(1, $dashboard->json('stats.total_assessments'));

        $results = $this->actingAs($this->user)->getJson('/api/assessment/results')->assertOk();
        $this->assertCount(1, $results->json('history'));
        // The retest still updates the merged section scores on the results page
        $this->assertEquals(50, (float) $results->json('latestSectionScores.C5.score'));
    }

    public function test_benchmark_ignores_section_retests(): void
    {
        foreach (User::factory()->count(2)->create() as $peer) {
            $peer->assessmentResponses()->create([
                'assessment_id' => $this->assessment->id,
                'c1_score' => 45,
                'dsri' => 60,
                'submitted_at' => now(),
            ]);
        }
        $this->submit(['answers' => $this->answers(3)])->assertCreated();
        $this->retest('C5', 5)->assertCreated();

        // Everyone's latest full assessment has C1 at 45/75 = 60%
        $benchmark = $this->actingAs($this->user)->getJson('/api/dashboard/benchmark')->assertOk();
        $this->assertEquals(60, $benchmark->json('platform.competencies.C1'));
    }

    public function test_staff_report_ignores_section_retests(): void
    {
        $this->submit(['answers' => $this->answers(3)])->assertCreated();
        AssessmentResponse::query()->update(['endorsement_status' => 'endorsed']);
        $this->retest('C5', 5)->assertCreated();

        $mgmt = User::factory()->createOne();
        $mgmt->roles()->attach(Role::where('name', 'Top Management')->first());

        $report = $this->actingAs($mgmt)->getJson("/api/reports/staff/{$this->user->id}")->assertOk();
        $this->assertCount(1, $report->json('assessmentHistory'));
        $this->assertEquals(45, (float) $report->json('sectionScores.C1.score'));
    }
}
