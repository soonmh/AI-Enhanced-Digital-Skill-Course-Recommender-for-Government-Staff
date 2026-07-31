<?php

namespace App\Events;

use App\Models\AssessmentResponse;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AssessmentEndorsed
{
    use Dispatchable, SerializesModels;

    public function __construct(public AssessmentResponse $response) {}
}
