<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\DsriCalculationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __construct(private DsriCalculationService $dsriService) {}

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $latest = $user->latestAssessmentResponse;
        $history = $user->assessmentResponses()->orderByDesc('submitted_at')->get();
        $userCourses = $user->userCourses()->with('course')->get();

        $stats = [
            'total_assessments' => $history->count(),
            'latest_score' => $latest?->dsri ?? 0,
            'courses_in_progress' => $userCourses->whereNull('completed_at')->count(),
            'average_score' => $history->count() > 0 ? round($history->avg('dsri'), 1) : 0,
        ];

        $sectionScores = null;
        if ($latest) {
            $sectionScores = [];
            foreach ($this->dsriService->getCompetencies() as $code => $config) {
                $field = strtolower($code) . '_score';
                $sectionScores[$code] = $this->dsriService->getSectionDetails(
                    $latest->$field, $code, $user->locale ?? 'en'
                );
            }
        }

        // Trend forecast
        $forecast = null;
        if ($history->count() >= 3) {
            $values = $history->pluck('dsri')->values()->toArray();
            $values = array_reverse($values);
            $n = count($values);
            $xMean = ($n - 1) / 2;
            $yMean = array_sum($values) / $n;
            $numerator = 0;
            $denominator = 0;
            for ($i = 0; $i < $n; $i++) {
                $numerator += ($i - $xMean) * ($values[$i] - $yMean);
                $denominator += ($i - $xMean) ** 2;
            }
            $slope = $denominator > 0 ? $numerator / $denominator : 0;
            $intercept = $yMean - $slope * $xMean;
            $predictedNext = round(max(0, min(100, $intercept + $slope * $n)), 1);
            $forecast = [
                'slope' => round($slope, 2),
                'predicted_next' => $predictedNext,
                'direction' => $slope > 0.5 ? 'improving' : ($slope < -0.5 ? 'declining' : 'stable'),
                'data_points' => $values,
            ];
        }

        return response()->json([
            'latestAssessment' => $latest,
            'assessmentHistory' => $history,
            'recommendedCourses' => [],
            'userCourses' => $userCourses,
            'stats' => $stats,
            'latestSectionScores' => $sectionScores,
            'forecast' => $forecast,
        ]);
    }
}
