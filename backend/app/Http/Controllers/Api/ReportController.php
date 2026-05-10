<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AssessmentResponse;
use App\Models\Course;
use App\Models\User;
use App\Models\UserCourse;
use App\Services\DsriCalculationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function __construct(private DsriCalculationService $dsriService) {}

    public function staffAnalysis(Request $request): JsonResponse
    {
        $users = User::with('roles', 'latestAssessmentResponse', 'userCourses.course')
            ->whereHas('roles', fn($q) => $q->where('name', 'Staff'))
            ->get();

        $staff = $users->map(function ($user) {
            $latest = $user->latestAssessmentResponse;
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
                'latest_dsri' => $latest?->dsri ? round($latest->dsri) : null,
                'status' => $status,
                'course_count' => $courseCount,
                'completed_courses' => $completedCourses,
            ];
        });

        $totalStaff = $staff->count();
        $completedCount = $staff->where('status', 'completed')->count();
        $enrolledCount = $staff->filter(fn($s) => ($s['course_count'] ?? 0) > 0)->count();
        $avgDsri = $staff->where('latest_dsri', '!=', null)->avg('latest_dsri');

        return response()->json([
            'stats' => [
                'total_staff' => $totalStaff,
                'assessment_completion' => $totalStaff > 0 ? round(($completedCount / $totalStaff) * 100) : 0,
                'course_enrollment' => $enrolledCount,
                'avg_dsri' => $avgDsri ? round($avgDsri, 1) : 0,
            ],
            'staff' => $staff,
        ]);
    }

    public function staffReport(Request $request, int $id): JsonResponse
    {
        $user = User::with('roles')->findOrFail($id);

        $responses = AssessmentResponse::where('user_id', $id)
            ->orderByDesc('submitted_at')
            ->get();

        $latest = $responses->first();
        $userCourses = UserCourse::where('user_id', $id)->with('course')->get();

        $sectionScores = null;
        if ($latest) {
            $sectionScores = [];
            foreach ($this->dsriService->getCompetencies() as $code => $config) {
                $field = strtolower($code) . '_score';
                $score = $latest->$field;
                $pct = $config['max_score'] > 0 ? ($score / $config['max_score']) * 100 : 0;
                $sectionScores[$code] = [
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
        }

        $courseAnalysis = $userCourses->map(fn($uc) => [
            'course_id' => $uc->course_id,
            'course_title' => $uc->course?->title,
            'progress' => (float) $uc->progress,
            'status' => $uc->status,
            'started_at' => $uc->started_at,
            'completed_at' => $uc->completed_at,
        ]);

        $assessmentHistory = $responses->map(fn($r) => [
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

        return response()->json([
            'staff' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'working_field' => $user->working_field,
                'job_level' => $user->job_level,
                'roles' => $user->roles->pluck('name'),
            ],
            'latest_dsri' => $latest?->dsri,
            'sectionScores' => $sectionScores,
            'assessmentHistory' => $assessmentHistory,
            'courseAnalysis' => $courseAnalysis,
            'courseCount' => $userCourses->count(),
            'completedCourses' => $userCourses->where('status', 'completed')->count(),
        ]);
    }

    public function courseProgress(Request $request): JsonResponse
    {
        $courses = Course::withCount('enrollments')
            ->withAvg('ratings', 'rating')
            ->withCount('ratings')
            ->orderByDesc('created_at')->get();

        $courseStats = $courses->map(function ($course) {
            $enrollments = UserCourse::where('course_id', $course->id)->get();
            $total = $enrollments->count();
            $completed = $enrollments->where('status', 'completed')->count();
            $avgProgress = $total > 0 ? $enrollments->avg('progress') : 0;

            return [
                'id' => $course->id,
                'title' => $course->title,
                'title_bm' => $course->title_bm,
                'level' => $course->level,
                'enrollment_count' => $total,
                'completion_rate' => $total > 0 ? round(($completed / $total) * 100, 1) : 0,
                'avg_progress' => round($avgProgress, 1),
                'avg_rating' => $course->ratings_avg_rating ? round($course->ratings_avg_rating, 1) : null,
                'ratings_count' => $course->ratings_count,
            ];
        })->sortByDesc('enrollment_count')->values();

        $enhancedUsers = User::whereHas('userCourses')
            ->with('userCourses.course')
            ->get()
            ->map(function ($user) {
                $ucs = $user->userCourses;
                $total = $ucs->count();
                $completed = $ucs->where('status', 'completed')->count();
                $avgProgress = $total > 0 ? $ucs->avg('progress') : 0;

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'total_courses' => $total,
                    'completed_courses' => $completed,
                    'avg_progress' => round($avgProgress, 1),
                    'status' => $avgProgress >= 100 ? 'completed' : ($avgProgress > 0 ? 'active' : 'inactive'),
                ];
            });

        $topByEnrollment = $courseStats->sortByDesc('enrollment_count')->take(5)->values();
        $topByProgress = $courseStats->sortByDesc('avg_progress')->take(5)->values();
        $topByCompletion = $courseStats->sortByDesc('completion_rate')->take(5)->values();

        return response()->json([
            'summary' => [
                'total_courses' => $courses->count(),
                'total_enrollments' => $courseStats->sum('enrollment_count'),
                'avg_completion_rate' => $courseStats->count() > 0 ? round($courseStats->avg('completion_rate'), 1) : 0,
                'avg_progress' => $courseStats->count() > 0 ? round($courseStats->avg('avg_progress'), 1) : 0,
            ],
            'courseStats' => $courseStats,
            'topCourses' => [
                'enrollment' => $topByEnrollment,
                'progress' => $topByProgress,
                'completion' => $topByCompletion,
            ],
            'enhancedUsers' => $enhancedUsers,
        ]);
    }

    public function departmentComparison(Request $request): JsonResponse
    {
        $competencies = $this->dsriService->getCompetencies();

        $users = User::with('latestAssessmentResponse')
            ->whereNotNull('working_field')
            ->where('working_field', '!=', '')
            ->get()
            ->groupBy('working_field');

        $departments = $users->map(function ($group, $field) use ($competencies) {
            $responses = $group->pluck('latestAssessmentResponse')->filter();
            $staffCount = $group->count();
            $assessedCount = $responses->count();

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
                'staff_count' => $staffCount,
                'assessed_count' => $assessedCount,
                'avg_dsri' => $responses->count() > 0 ? round($responses->avg('dsri'), 1) : 0,
                'competency_averages' => $competencyAverages,
            ];
        })->values();

        return response()->json([
            'departments' => $departments,
            'competencies' => collect($competencies)->map(fn($c, $code) => [
                'code' => $code,
                'name' => $c['name_en'],
            ])->values(),
        ]);
    }
}
