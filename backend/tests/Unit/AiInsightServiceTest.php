<?php

namespace Tests\Unit;

use App\Models\Assessment;
use App\Models\AssessmentResponse;
use App\Models\User;
use App\Services\AiInsightService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AiInsightServiceTest extends TestCase
{
    use RefreshDatabase;

    private AiInsightService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(AiInsightService::class);
    }

    private function makeTestResponse(User $user, array $overrides = []): AssessmentResponse
    {
        $assessment = Assessment::create([
            'title' => 'Test Assessment',
            'description' => 'Test',
        ]);

        return AssessmentResponse::create(array_merge([
            'user_id' => $user->id,
            'assessment_id' => $assessment->id,
            'c1_score' => 30, 'c2_score' => 40, 'c3_score' => 35,
            'c4_score' => 45, 'c5_score' => 50, 'c6_score' => 40,
            'c7_score' => 35, 'c8_score' => 10, 'c9_score' => 15,
            'c10_score' => 40, 'dsri' => 35,
            'submitted_at' => now(),
        ], $overrides));
    }

    public function test_generate_recommendations_returns_fallback_without_api_key(): void
    {
        config(['services.gemini.key' => null]);

        $user = User::factory()->create();
        $response = $this->makeTestResponse($user);

        $result = $this->service->generateRecommendations($response);

        $this->assertArrayHasKey('summary', $result);
        $this->assertArrayHasKey('key_findings', $result);
    }

    public function test_generate_recommendations_caches_results(): void
    {
        config(['services.gemini.key' => null]);

        $user = User::factory()->create();
        $response = $this->makeTestResponse($user);

        $result1 = $this->service->generateRecommendations($response);
        $result2 = $this->service->generateRecommendations($response);

        $this->assertEquals($result1, $result2);
    }

    public function test_analyze_staff_performance_handles_empty_data(): void
    {
        $result = $this->service->analyzeStaffPerformance(collect());

        $this->assertEquals('No staff data available for analysis.', $result['summary']);
    }

    public function test_predict_skill_gaps_with_insufficient_history(): void
    {
        $user = User::factory()->create();
        $this->makeTestResponse($user);

        $result = $this->service->predictSkillGaps($user);

        $this->assertStringContainsString('Insufficient', $result['prediction']);
    }

    public function test_generate_course_explanation_returns_fallback_without_key(): void
    {
        config(['services.gemini.key' => null]);

        $result = $this->service->generateCourseExplanation(
            'Digital Literacy 101',
            'Learn digital basics',
            ['Digital Literacy', 'Digital Skills']
        );

        $this->assertIsString($result);
        $this->assertNotEmpty($result);
    }

    public function test_generate_course_explanation_returns_empty_without_weak_areas(): void
    {
        $result = $this->service->generateCourseExplanation('Course', 'Desc', []);

        $this->assertEquals('', $result);
    }
}
