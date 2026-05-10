<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AssessmentDraft extends Model
{
    protected $fillable = [
        'user_id',
        'answers',
        'current_section',
    ];

    protected function casts(): array
    {
        return [
            'answers' => 'array',
            'current_section' => 'integer',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
