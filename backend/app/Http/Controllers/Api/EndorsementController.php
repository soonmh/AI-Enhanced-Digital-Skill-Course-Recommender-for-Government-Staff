<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AssessmentResponse;
use App\Models\UserCourse;
use App\Services\EndorsementService;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EndorsementController extends Controller
{
    public function __construct(private EndorsementService $endorsementService) {}

    public function pending(Request $request): JsonResponse
    {
        $pending = $this->endorsementService->pendingForHod($request->user())
            ->map(fn (AssessmentResponse $response) => [
                'id' => $response->id,
                'user_id' => $response->user_id,
                'name' => $response->user->name,
                'email' => $response->user->email,
                'dsri' => $response->dsri,
                'submitted_at' => $response->submitted_at,
            ]);

        return response()->json(['pending' => $pending]);
    }

    public function endorse(Request $request, int $id): JsonResponse
    {
        $request->validate(['note' => 'nullable|string|max:1000']);

        $response = AssessmentResponse::findOrFail($id);
        $this->endorsementService->endorse($response, $request->user(), $request->note);

        return response()->json(['message' => 'Assessment endorsed successfully']);
    }

    public function reject(Request $request, int $id): JsonResponse
    {
        $request->validate(['note' => 'required|string|max:1000']);

        $response = AssessmentResponse::findOrFail($id);
        $this->endorsementService->reject($response, $request->user(), $request->note);

        return response()->json(['message' => 'Assessment rejected']);
    }

    public function pendingCourseCompletions(Request $request): JsonResponse
    {
        $pending = $this->endorsementService->pendingCourseCompletionsForHod($request->user())
            ->map(fn (UserCourse $uc) => [
                'id' => $uc->id,
                'user_id' => $uc->user_id,
                'name' => $uc->user->name,
                'email' => $uc->user->email,
                'course_title' => $uc->course->title,
                'proof_url' => $uc->completion_proof_path
                    ? Storage::disk('public')->url($uc->completion_proof_path)
                    : null,
                'submitted_at' => $uc->updated_at,
            ]);

        return response()->json(['pending' => $pending]);
    }

    public function endorseCourse(Request $request, int $id): JsonResponse
    {
        $request->validate(['note' => 'nullable|string|max:1000']);

        $uc = UserCourse::findOrFail($id);
        $this->endorsementService->endorseCourseCompletion($uc, $request->user(), $request->note);

        return response()->json(['message' => 'Course completion endorsed successfully']);
    }

    public function rejectCourse(Request $request, int $id): JsonResponse
    {
        $request->validate(['note' => 'required|string|max:1000']);

        $uc = UserCourse::findOrFail($id);
        $this->endorsementService->rejectCourseCompletion($uc, $request->user(), $request->note);

        return response()->json(['message' => 'Course completion rejected']);
    }

    public function history(Request $request): JsonResponse
    {
        $hod = $request->user();

        $assessments = $this->endorsementService->endorsementHistoryForHod($hod)
            ->map(fn ($r) => [
                'type' => 'assessment',
                'id' => $r->id,
                'name' => $r->user->name,
                'decision' => $r->endorsement_status,
                'decided_at' => $r->endorsed_at,
                'note' => $r->endorsement_note,
                'detail' => $r->dsri,
            ]);

        $courses = $this->endorsementService->courseEndorsementHistoryForHod($hod)
            ->map(fn (UserCourse $uc) => [
                'type' => 'course',
                'id' => $uc->id,
                'name' => $uc->user->name,
                'decision' => $uc->completion_endorsement_status,
                'decided_at' => $uc->completion_endorsed_at,
                'note' => $uc->completion_endorsement_note,
                'detail' => $uc->course->title,
                'proof_url' => $uc->completion_proof_path
                    ? Storage::disk('public')->url($uc->completion_proof_path)
                    : null,
            ]);

        $history = $assessments->concat($courses)
            ->sortByDesc('decided_at')
            ->values();

        return response()->json(['history' => $history]);
    }
}
