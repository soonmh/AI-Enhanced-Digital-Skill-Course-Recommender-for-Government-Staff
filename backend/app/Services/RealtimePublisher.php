<?php

namespace App\Services;

use App\Models\Notification;
use Illuminate\Support\Facades\Redis as RedisFacade;

class RealtimePublisher
{
    public function publishNotification(int $recipientId, array $data): void
    {
        $notification = Notification::create([
            'user_id' => $recipientId,
            'type' => $data['type'],
            'title' => $data['title'],
            'body' => $data['body'] ?? null,
            'data' => $data['data'] ?? null,
        ]);

        RedisFacade::publish('notifications', json_encode([
            'recipient_id' => $recipientId,
            'notification' => [
                'id' => $notification->id,
                'type' => $notification->type,
                'title' => $notification->title,
                'body' => $notification->body,
                'data' => $notification->data,
                'read_at' => null,
                'created_at' => $notification->created_at->toIso8601String(),
            ],
        ]));
    }

    public function publishDashboardUpdate(string $event, array $payload): void
    {
        RedisFacade::publish('dashboard_updates', json_encode([
            'event' => $event,
            'payload' => $payload,
        ]));
    }
}
