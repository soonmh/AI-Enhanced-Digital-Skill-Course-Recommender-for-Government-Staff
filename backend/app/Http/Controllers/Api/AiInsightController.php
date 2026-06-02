<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AiInsightService;
use App\Services\DsriCalculationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AiInsightController extends Controller
{
    public function __construct(
        private AiInsightService $aiService,
        private DsriCalculationService $dsriService
    ) {}

    public function personalInsights(Request $request): JsonResponse
    {
        $user = $request->user();
        $locale = $user->locale ?? 'en';
        $latest = $user->latestAssessmentResponse;

        if (!$latest) {
            return response()->json([
                'has_assessment' => false,
                'recommendations' => null,
                'skill_gaps' => null,
            ]);
        }

        $recommendations = $this->aiService->generateRecommendations($latest, $locale);
        $skillGaps = $this->aiService->predictSkillGaps($user, $locale);

        return response()->json([
            'has_assessment' => true,
            'recommendations' => $recommendations,
            'skill_gaps' => $skillGaps,
            'dsri' => $latest->dsri,
        ]);
    }

    public function departmentInsights(Request $request): JsonResponse
    {
        $locale = $request->user()->locale ?? 'en';

        $staff = User::whereHas('roles', fn($q) => $q->where('name', 'Staff'))
            ->with('latestAssessmentResponse')
            ->get();

        $responses = $staff->pluck('latestAssessmentResponse')->filter();

        if ($responses->isEmpty()) {
            return response()->json([
                'has_data' => false,
                'insights' => [
                    'summary' => 'No staff assessment data available for analysis.',
                    'strengths' => [],
                    'weaknesses' => [],
                    'recommendations' => ['Encourage staff to complete their digital skills assessments.'],
                    'priority_actions' => [],
                ],
            ]);
        }

        $insights = $this->aiService->analyzeStaffPerformance($responses, $locale);

        $competencies = $this->dsriService->getCompetencies();
        $departmentAverages = [];
        foreach ($competencies as $code => $config) {
            $field = strtolower($code) . '_score';
            $values = $responses->pluck($field)->filter();
            $departmentAverages[$code] = [
                'name' => $locale === 'ms' ? $config['name_ms'] : $config['name_en'],
                'avg_percentage' => $values->count() > 0
                    ? round(($values->avg() / $config['max_score']) * 100, 1)
                    : 0,
            ];
        }

        return response()->json([
            'has_data' => true,
            'insights' => $insights,
            'total_staff' => $staff->count(),
            'assessed_staff' => $responses->count(),
            'avg_dsri' => round($responses->avg('dsri'), 1),
            'competency_averages' => $departmentAverages,
        ]);
    }

    public function learningPath(Request $request): JsonResponse
    {
        $user = $request->user();
        $locale = $user->locale ?? 'en';

        $result = $this->aiService->generateLearningPath($user, $locale);
        $result['has_assessment'] = $result['has_assessment'] ?? ($user->latestAssessmentResponse !== null);

        return response()->json($result);
    }

    public function peerComparison(Request $request): JsonResponse
    {
        $user = $request->user();
        $locale = $user->locale ?? 'en';

        if (!$user->latestAssessmentResponse) {
            return response()->json([
                'has_assessment' => false,
                'comparison' => null,
            ]);
        }

        $peers = User::where('working_field', $user->working_field)
            ->where('id', '!=', $user->id)
            ->with('latestAssessmentResponse')
            ->get();

        $comparison = $this->aiService->generatePeerComparison($user, $peers, $locale);
        $assessedCount = $peers->pluck('latestAssessmentResponse')->filter()->count();

        return response()->json([
            'has_assessment' => true,
            'comparison' => $comparison,
            'peer_count' => $assessedCount,
        ]);
    }

    public function readinessCheck(Request $request): JsonResponse
    {
        $user = $request->user();
        $locale = $user->locale ?? 'en';

        $result = $this->aiService->checkAssessmentReadiness($user, $locale);

        return response()->json([
            'has_previous' => $result['has_previous'] ?? false,
            'readiness' => $result,
        ]);
    }

    public function actionPlan(Request $request): JsonResponse
    {
        $user = $request->user();
        $locale = $user->locale ?? 'en';

        $result = $this->aiService->generateActionPlan($user, $locale);
        $result['has_assessment'] = $result['has_assessment'] ?? ($user->latestAssessmentResponse !== null);

        return response()->json($result);
    }
}
