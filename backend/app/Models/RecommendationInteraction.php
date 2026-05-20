<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RecommendationInteraction extends Model
{
    protected $fillable = [
        'user_id',
        'course_id',
        'interaction_type',
        'source',
        'ab_group',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function course()
    {
        return $this->belongsTo(Course::class);
    }
}
