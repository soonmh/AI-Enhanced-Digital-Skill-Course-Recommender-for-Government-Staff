<?php

namespace App\Logging;

use Illuminate\Http\Request;
use Monolog\LogRecord;
use Monolog\Processor\ProcessorInterface;

/**
 * Adds request context (URL, method, IP, user ID, request_id) to every log
 * record so errors can be traced across the stack. The request_id propagates
 * from the X-Request-Id header (set by a proxy) or is generated per-request.
 */
class RequestContextProcessor implements ProcessorInterface
{
    public function __construct(private ?Request $request = null) {}

    public function __invoke(LogRecord $record): LogRecord
    {
        $context = [
            'app' => config('app.name'),
            'env' => config('app.env'),
        ];

        if ($this->request) {
            $context['request_id'] = $this->request->header('X-Request-Id') ?: $this->request->attributes->get('request_id');
            $context['method'] = $this->request->getMethod();
            $context['url'] = $this->request->fullUrl();
            $context['ip'] = $this->request->ip();

            $user = $this->request->user();
            if ($user) {
                $context['user_id'] = $user->id;
                $context['user_email'] = $user->email ?? null;
            }
        }

        // Merge our context with anything already on the record.
        $record->extra = array_merge($context, $record->extra);

        return $record;
    }
}
