<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiRecommendation extends Model
{
    protected $fillable = [
        'user_id',
        'assessment_response_id',
        'type',
        'insights_json',
    ];

    protected $casts = [
        'insights_json' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function assessmentResponse(): BelongsTo
    {
        return $this->belongsTo(AssessmentResponse::class);
    }
}
