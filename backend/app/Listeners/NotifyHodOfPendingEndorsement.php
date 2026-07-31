<?php

namespace App\Listeners;

use App\Events\AssessmentSubmitted;
use App\Services\RealtimePublisher;

class NotifyHodOfPendingEndorsement
{
    public function __construct(private RealtimePublisher $realtime) {}

    public function handle(AssessmentSubmitted $event): void
    {
        $user = $event->response->user;

        if (!$user->hod_id) {
            return;
        }

        $this->realtime->publishNotification($user->hod_id, [
            'type' => 'endorsement_pending',
            'title' => 'Assessment awaiting your endorsement',
            'body' => "{$user->name} submitted their assessment (DSRI: {$event->response->dsri}%) — needs your endorsement.",
            'data' => ['assessment_response_id' => $event->response->id, 'user_id' => $user->id],
        ]);
    }
}
