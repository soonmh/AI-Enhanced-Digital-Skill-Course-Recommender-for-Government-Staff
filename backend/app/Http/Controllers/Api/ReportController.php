<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\CourseProgressReportService;
use App\Services\StaffReportService;
use App\Services\TeamReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function __construct(
        private StaffReportService $staffReport,
        private TeamReportService $teamReport,
        private CourseProgressReportService $courseProgressReport,
    ) {}

    public function staffAnalysis(): JsonResponse
    {
        return response()->json($this->staffReport->staffAnalysis());
    }

    public function staffReport(Request $request, int $id): JsonResponse
    {
        $user = User::with('roles')->findOrFail($id);
        return response()->json($this->staffReport->individualReport($user));
    }

    public function teamMemberReport(Request $request, int $id): JsonResponse
    {
        $target = User::where('id', $id)
            ->where('hod_id', $request->user()->id)
            ->firstOrFail();

        return response()->json($this->staffReport->individualReport($target));
    }

    public function courseProgress(): JsonResponse
    {
        return response()->json($this->courseProgressReport->courseProgress());
    }

    public function myTeam(Request $request): JsonResponse
    {
        return response()->json($this->teamReport->myTeam($request->user()));
    }

    public function departmentComparison(): JsonResponse
    {
        return response()->json($this->staffReport->departmentComparison());
    }
}
