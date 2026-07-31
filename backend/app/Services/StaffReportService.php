<?php

namespace App\Services;

use App\Models\AssessmentResponse;
use App\Models\User;
use App\Models\UserCourse;
use Illuminate\Support\Collection;

class StaffReportService
{
    public function __construct(private DsriCalculationService $dsriService) {}

    /**
     * Organization-wide staff list with assessment + enrollment status.
     */
    public function staffAnalysis(): array
    {
        $users = User::with('roles', 'latestEndorsedAssessmentResponse', 'userCourses.course')
            ->whereHas('roles', fn($q) => $q->where('name', 'Staff'))
            ->get();

        $staff = $users->map(fn($user) => $this->userSummaryRow($user));

        $totalStaff = $staff->count();
        $completedCount = $staff->where('status', 'completed')->count();
        $enrolledCount = $staff->filter(fn($s) => ($s['course_count'] ?? 0) > 0)->count();
        $avgDsri = $staff->where('latest_dsri', '!=', null)->avg('latest_dsri');

        return [
            'stats' => [
                'total_staff' => $totalStaff,
                'assessment_completion' => $totalStaff > 0 ? round(($completedCount / $totalStaff) * 100) : 0,
                'course_enrollment' => $enrolledCount,
                'avg_dsri' => $avgDsri ? round($avgDsri, 1) : 0,
            ],
            'staff' => $staff,
        ];
    }

    /**
     * Individual deep-dive report for one user.
     */
    public function individualReport(User $user): array
    {
        $responses = AssessmentResponse::where('user_id', $user->id)
            ->where('endorsement_status', 'endorsed')
            ->orderByDesc('submitted_at')
            ->get();

        $latest = $responses->first();
        $userCourses = UserCourse::where('user_id', $user->id)->with('course')->get();

        return [
            'staff' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'working_field' => $user->working_field,
                'job_level' => $user->job_level,
                'roles' => $user->roles->pluck('name'),
            ],
            'latest_dsri' => $latest?->dsri,
            'sectionScores' => $this->sectionScores($latest),
            'assessmentHistory' => $this->assessmentHistory($responses),
            'courseAnalysis' => $this->courseAnalysis($userCourses),
            'courseCount' => $userCourses->count(),
            'completedCourses' => $userCourses->where('status', 'completed')->count(),
        ];
    }

    /**
     * Average DSRI + competency averages per working_field.
     */
    public function departmentComparison(): array
    {
        $competencies = $this->dsriService->getCompetencies();

        $groups = User::with('latestEndorsedAssessmentResponse')
            ->whereNotNull('working_field')
            ->where('working_field', '!=', '')
            ->get()
            ->groupBy('working_field');

        $departments = $groups->map(function ($group, $field) use ($competencies) {
            $responses = $group->pluck('latestEndorsedAssessmentResponse')->filter();

            $competencyAverages = [];
            foreach ($competencies as $code => $config) {
                $scoreField = strtolower($code) . '_score';
                $values = $responses->pluck($scoreField)->filter();
                $competencyAverages[$code] = $values->count() > 0
                    ? round(($values->avg() / $config['max_score']) * 100, 1)
                    : 0;
            }

            return [
                'name' => $field,
                'staff_count' => $group->count(),
                'assessed_count' => $responses->count(),
                'avg_dsri' => $responses->count() > 0 ? round($responses->avg('dsri'), 1) : 0,
                'competency_averages' => $competencyAverages,
            ];
        })->values();

        return [
            'departments' => $departments,
            'competencies' => collect($competencies)->map(fn($c, $code) => [
                'code' => $code,
                'name' => $c['name_en'],
            ])->values(),
        ];
    }

    /**
     * Per-user summary row used in staff list and team list.
     */
    public function userSummaryRow(User $user): array
    {
        $latest = $user->latestEndorsedAssessmentResponse;
        $courseCount = $user->userCourses->count();
        $completedCourses = $user->userCourses->where('status', 'completed')->count();

        $status = 'not_started';
        if ($latest) {
            $status = 'completed';
        } elseif ($courseCount > 0) {
            $status = 'in_progress';
        }

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'working_field' => $user->working_field,
            'job_level' => $user->job_level,
            'latest_dsri' => $latest?->dsri ? round($latest->dsri) : null,
            'status' => $status,
            'course_count' => $courseCount,
            'completed_courses' => $completedCourses,
        ];
    }

    private function sectionScores(?AssessmentResponse $latest): ?array
    {
        if (!$latest) {
            return null;
        }

        $scores = [];
        foreach ($this->dsriService->getCompetencies() as $code => $config) {
            $field = strtolower($code) . '_score';
            $score = $latest->$field;
            $pct = $config['max_score'] > 0 ? ($score / $config['max_score']) * 100 : 0;

            $scores[$code] = [
                'code' => $code,
                'name' => $config['name_en'],
                'name_ms' => $config['name_ms'],
                'score' => $score,
                'max_score' => $config['max_score'],
                'weight' => $config['weight'],
                'percentage' => round($pct, 1),
                'weighted' => round(($score / $config['max_score']) * $config['weight'], 2),
            ];
        }

        return $scores;
    }

    private function assessmentHistory(Collection $responses): Collection
    {
        return $responses->map(fn($r) => [
            'id' => $r->id,
            'submitted_at' => $r->submitted_at,
            'dsri' => $r->dsri,
            'c1_score' => $r->c1_score,
            'c2_score' => $r->c2_score,
            'c3_score' => $r->c3_score,
            'c4_score' => $r->c4_score,
            'c5_score' => $r->c5_score,
            'c6_score' => $r->c6_score,
            'c7_score' => $r->c7_score,
            'c8_score' => $r->c8_score,
            'c9_score' => $r->c9_score,
            'c10_score' => $r->c10_score,
        ]);
    }

    private function courseAnalysis(Collection $userCourses): Collection
    {
        return $userCourses->map(fn($uc) => [
            'course_id' => $uc->course_id,
            'course_title' => $uc->course?->title,
            'progress' => (float) $uc->progress,
            'status' => $uc->status,
            'started_at' => $uc->started_at,
            'completed_at' => $uc->completed_at,
        ]);
    }
}
