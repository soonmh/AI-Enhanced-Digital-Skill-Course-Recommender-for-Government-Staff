<?php

namespace Tests\Feature;

use App\Models\Assessment;
use App\Models\Certificate;
use App\Models\Course;
use App\Models\User;
use App\Models\UserCourse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Redis;
use Tests\TestCase;

class EndorsementTest extends TestCase
{
    use RefreshDatabase;

    private User $hod;
    private User $staff;

    protected function setUp(): void
    {
        parent::setUp();
        Redis::shouldReceive('publish')->andReturn(0);

        $this->hod = User::factory()->create();
        $this->staff = User::factory()->create(['hod_id' => $this->hod->id]);
    }

    public function test_an_assessment_can_only_be_reviewed_once(): void
    {
        $response = $this->staff->assessmentResponses()->create([
            'assessment_id' => Assessment::create(['title' => 'DSRA', 'description' => 'Test'])->id,
            'c1_score' => 45, 'dsri' => 60, 'submitted_at' => now(),
        ]);

        $this->actingAs($this->hod)->postJson("/api/endorsements/{$response->id}/endorse")->assertOk();
        $code = Certificate::where('user_id', $this->staff->id)->value('verification_code');

        $this->actingAs($this->hod)->postJson("/api/endorsements/{$response->id}/endorse")->assertStatus(422);
        $this->actingAs($this->hod)->postJson("/api/endorsements/{$response->id}/reject", ['note' => 'Redo'])->assertStatus(422);

        // A re-endorsement would have reissued the certificate and broken its shared link
        $this->assertSame($code, Certificate::where('user_id', $this->staff->id)->value('verification_code'));
        $this->assertSame('endorsed', $response->fresh()->endorsement_status);
    }

    public function test_a_course_completion_can_only_be_reviewed_once(): void
    {
        $uc = UserCourse::create([
            'user_id' => $this->staff->id,
            'course_id' => Course::factory()->create()->id,
            'progress' => 100,
            'status' => 'pending_endorsement',
            'started_at' => now(),
            'completion_endorsement_status' => 'pending',
        ]);

        $this->actingAs($this->hod)->postJson("/api/endorsements/course-completions/{$uc->id}/endorse")->assertOk();

        // Rejecting now would silently turn the completed course back into an active one
        $this->actingAs($this->hod)
            ->postJson("/api/endorsements/course-completions/{$uc->id}/reject", ['note' => 'Redo'])
            ->assertStatus(422);
        $this->assertSame('completed', $uc->fresh()->status);
    }
}
