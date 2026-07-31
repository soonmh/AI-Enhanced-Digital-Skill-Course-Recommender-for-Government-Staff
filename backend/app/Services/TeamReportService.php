<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Collection;

class TeamReportService
{
    public function __construct(
        private DsriCalculationService $dsriService,
        private StaffReportService $staffReport,
    ) {}

    /**
     * Direct reports of an HOD, with assessment status and team competency averages.
     */
    public function myTeam(User $hod): array
    {
        $reports = $hod->directReports()
            ->with('latestEndorsedAssessmentResponse', 'userCourses')
            ->get();

        if ($reports->isEmpty()) {
            return [
                'has_team' => false,
                'stats' => null,
                'team' => [],
                'team_competency_avg' => null,
            ];
        }

        $team = $reports->map(fn($user) => $this->staffReport->userSummaryRow($user));

        $totalTeam = $team->count();
        $completedCount = $team->where('status', 'completed')->count();
        $enrolledCount = $team->filter(fn($s) => ($s['course_count'] ?? 0) > 0)->count();
        $avgDsri = $team->where('latest_dsri', '!=', null)->avg('latest_dsri');

        return [
            'has_team' => true,
            'stats' => [
                'team_size' => $totalTeam,
                'assessment_completion' => $totalTeam > 0 ? round(($completedCount / $totalTeam) * 100) : 0,
                'course_enrollment' => $enrolledCount,
                'avg_dsri' => $avgDsri ? round($avgDsri, 1) : 0,
            ],
            'team' => $team,
            'team_competency_avg' => $this->teamCompetencyAverages($reports),
        ];
    }

    /**
     * Average per-competency percentage across assessed team members (for radar chart).
     */
    private function teamCompetencyAverages(Collection $reports): ?array
    {
        $assessed = $reports->filter(fn($u) => $u->latestEndorsedAssessmentResponse);
        if ($assessed->isEmpty()) {
            return null;
        }

        $averages = [];
        foreach ($this->dsriService->getCompetencies() as $code => $config) {
            $field = strtolower($code) . '_score';
            $values = $assessed->pluck("latestEndorsedAssessmentResponse.{$field}")->filter();
            $averages[$code] = $values->isNotEmpty()
                ? round(($values->avg() / $config['max_score']) * 100, 1)
                : 0;
        }

        return $averages;
    }
}
