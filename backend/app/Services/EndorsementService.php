<?php

namespace App\Services;

use App\Events\AssessmentEndorsed;
use App\Events\CourseCompleted;
use App\Models\AssessmentResponse;
use App\Models\User;
use App\Models\UserCourse;
use Illuminate\Support\Collection;

class EndorsementService
{
    public function __construct(private RealtimePublisher $realtime) {}

    public function pendingForHod(User $hod): Collection
    {
        $reportIds = $hod->directReports()->pluck('id');

        return AssessmentResponse::whereIn('user_id', $reportIds)
            ->where('assessment_type', 'full')
            ->where('endorsement_status', 'pending')
            ->with('user')
            ->orderBy('submitted_at')
            ->get();
    }

    public function endorse(AssessmentResponse $response, User $hod, ?string $note = null): AssessmentResponse
    {
        $this->authorize($response, $hod);

        $response->update([
            'endorsement_status' => 'endorsed',
            'endorsed_by' => $hod->id,
            'endorsed_at' => now(),
            'endorsement_note' => $note,
        ]);

        AssessmentEndorsed::dispatch($response);

        $this->realtime->publishNotification($response->user_id, [
            'type' => 'endorsement_approved',
            'title' => 'Assessment endorsed',
            'body' => "Your HOD endorsed your assessment result (DSRI: {$response->dsri}%).",
            'data' => ['assessment_response_id' => $response->id],
        ]);

        return $response;
    }

    public function reject(AssessmentResponse $response, User $hod, string $note): AssessmentResponse
    {
        $this->authorize($response, $hod);

        $response->update([
            'endorsement_status' => 'rejected',
            'endorsed_by' => $hod->id,
            'endorsed_at' => now(),
            'endorsement_note' => $note,
        ]);

        $this->realtime->publishNotification($response->user_id, [
            'type' => 'endorsement_rejected',
            'title' => 'Assessment not endorsed',
            'body' => "Your HOD requested changes: {$note}",
            'data' => ['assessment_response_id' => $response->id],
        ]);

        return $response;
    }

    private function authorize(AssessmentResponse $response, User $hod): void
    {
        abort_unless($response->user->hod_id === $hod->id, 403, 'You are not the HOD for this user.');
    }

    public function pendingCourseCompletionsForHod(User $hod): Collection
    {
        $reportIds = $hod->directReports()->pluck('id');

        return UserCourse::whereIn('user_id', $reportIds)
            ->where('completion_endorsement_status', 'pending')
            ->with('user', 'course')
            ->orderBy('updated_at')
            ->get();
    }

    public function endorseCourseCompletion(UserCourse $uc, User $hod, ?string $note = null): UserCourse
    {
        $this->authorizeCourse($uc, $hod);

        $uc->update([
            'status' => 'completed',
            'completed_at' => now(),
            'completion_endorsement_status' => 'endorsed',
            'completion_endorsed_by' => $hod->id,
            'completion_endorsed_at' => now(),
            'completion_endorsement_note' => $note,
        ]);

        CourseCompleted::dispatch($uc);

        $this->realtime->publishNotification($uc->user_id, [
            'type' => 'course_endorsement_approved',
            'title' => 'Course completion endorsed',
            'body' => "Your HOD endorsed your completion of: {$uc->course->title}",
            'data' => ['user_course_id' => $uc->id, 'course_id' => $uc->course_id],
        ]);

        return $uc;
    }

    public function rejectCourseCompletion(UserCourse $uc, User $hod, string $note): UserCourse
    {
        $this->authorizeCourse($uc, $hod);

        $uc->update([
            'status' => 'active',
            'completion_endorsement_status' => 'rejected',
            'completion_endorsed_by' => $hod->id,
            'completion_endorsed_at' => now(),
            'completion_endorsement_note' => $note,
        ]);

        $this->realtime->publishNotification($uc->user_id, [
            'type' => 'course_endorsement_rejected',
            'title' => 'Course completion not endorsed',
            'body' => "Your HOD requested changes for {$uc->course->title}: {$note}",
            'data' => ['user_course_id' => $uc->id, 'course_id' => $uc->course_id],
        ]);

        return $uc;
    }

    private function authorizeCourse(UserCourse $uc, User $hod): void
    {
        abort_unless($uc->user->hod_id === $hod->id, 403, 'You are not the HOD for this user.');
    }

    public function endorsementHistoryForHod(User $hod): Collection
    {
        return AssessmentResponse::where('endorsed_by', $hod->id)
            ->whereIn('endorsement_status', ['endorsed', 'rejected'])
            ->with('user')
            ->orderByDesc('endorsed_at')
            ->get();
    }

    public function courseEndorsementHistoryForHod(User $hod): Collection
    {
        return UserCourse::where('completion_endorsed_by', $hod->id)
            ->whereIn('completion_endorsement_status', ['endorsed', 'rejected'])
            ->with('user', 'course')
            ->orderByDesc('completion_endorsed_at')
            ->get();
    }
}
