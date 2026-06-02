<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Certificate extends Model
{
    protected $fillable = [
        'user_id',
        'assessment_response_id',
        'verification_code',
        'type',
        'dsri_score',
        'maturity_level',
        'maturity_code',
        'maturity_label_en',
        'maturity_label_ms',
        'competency_scores',
        'issued_at',
        'expires_at',
    ];

    protected $casts = [
        'competency_scores' => 'array',
        'dsri_score' => 'float',
        'maturity_level' => 'integer',
        'issued_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function assessmentResponse(): BelongsTo
    {
        return $this->belongsTo(AssessmentResponse::class);
    }

    public function isExpired(): bool
    {
        return $this->expires_at && $this->expires_at->isPast();
    }

    public function isValid(): bool
    {
        return !$this->isExpired();
    }
}
