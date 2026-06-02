<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AssessmentResponse extends Model
{
    protected $fillable = [
        'user_id', 'assessment_id', 'assessment_type', 'section_code', 'submitted_at',
        'c1_score', 'c2_score', 'c3_score', 'c4_score', 'c5_score',
        'c6_score', 'c7_score', 'c8_score', 'c9_score', 'c10_score',
        'dsri',
    ];

    protected function casts(): array
    {
        return [
            'submitted_at' => 'datetime',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function assessment()
    {
        return $this->belongsTo(Assessment::class);
    }
}
