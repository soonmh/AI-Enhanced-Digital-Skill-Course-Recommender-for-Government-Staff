<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AssessmentResponse;
use App\Models\User;
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
            'maturity' => $latest ? $this->dsriService->getMaturityLevel($latest->dsri, $user->locale ?? 'en') : null,
        ]);
    }

    public function benchmark(Request $request): JsonResponse
    {
        $user = $request->user();
        $latest = $user->latestAssessmentResponse;

        if (!$latest) {
            return response()->json(['has_data' => false]);
        }

        // Get latest response per user (MAX id per user_id)
        $latestIds = AssessmentResponse::selectRaw('MAX(id) as id')
            ->groupBy('user_id')
            ->pluck('id');

        if ($latestIds->count() < 3) {
            return response()->json(['has_data' => false, 'sample_size' => $latestIds->count()]);
        }

        $competencyCodes = array_keys($this->dsriService->getCompetencies());

        // Platform averages
        $platformAgg = AssessmentResponse::whereIn('id', $latestIds)
            ->selectRaw('AVG(dsri) as avg_dsri, COUNT(*) as cnt')
            ->first();
        $platformCompetencies = [];
        foreach ($competencyCodes as $code) {
            $field = strtolower($code) . '_score';
            $avg = AssessmentResponse::whereIn('id', $latestIds)->avg($field);
            $maxScore = $this->dsriService->getCompetencies()[$code]['max_score'];
            $platformCompetencies[$code] = $maxScore > 0 ? round(($avg / $maxScore) * 100, 1) : 0;
        }

        // Department averages
        $departmentCompetencies = null;
        $deptAgg = null;
        $deptName = $user->working_field;
        if ($deptName) {
            $deptUserIds = User::where('working_field', $deptName)->pluck('id');
            $deptLatestIds = AssessmentResponse::selectRaw('MAX(id) as id')
                ->whereIn('user_id', $deptUserIds)
                ->groupBy('user_id')
                ->pluck('id');

            if ($deptLatestIds->count() >= 2) {
                $deptAgg = AssessmentResponse::whereIn('id', $deptLatestIds)
                    ->selectRaw('AVG(dsri) as avg_dsri, COUNT(*) as cnt')
                    ->first();
                $departmentCompetencies = [];
                foreach ($competencyCodes as $code) {
                    $field = strtolower($code) . '_score';
                    $avg = AssessmentResponse::whereIn('id', $deptLatestIds)->avg($field);
                    $maxScore = $this->dsriService->getCompetencies()[$code]['max_score'];
                    $departmentCompetencies[$code] = $maxScore > 0 ? round(($avg / $maxScore) * 100, 1) : 0;
                }
            }
        }

        // Percentile
        $allDsri = AssessmentResponse::whereIn('id', $latestIds)->pluck('dsri')->toArray();
        $below = count(array_filter($allDsri, fn ($d) => $d < $latest->dsri));
        $percentile = round(($below / count($allDsri)) * 100);

        $percentileLabel = 'Below Average';
        if ($percentile >= 80) $percentileLabel = 'Top Performer';
        elseif ($percentile >= 60) $percentileLabel = 'Above Average';
        elseif ($percentile >= 40) $percentileLabel = 'Average';

        return response()->json([
            'has_data' => true,
            'sample_size' => $platformAgg->cnt,
            'platform' => [
                'avg_dsri' => round($platformAgg->avg_dsri, 1),
                'competencies' => $platformCompetencies,
            ],
            'department' => $deptAgg ? [
                'name' => $deptName,
                'avg_dsri' => round($deptAgg->avg_dsri, 1),
                'sample_size' => $deptAgg->cnt,
                'competencies' => $departmentCompetencies,
            ] : null,
            'percentile' => $percentile,
            'percentile_label' => $percentileLabel,
        ]);
    }
}
