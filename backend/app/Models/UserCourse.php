<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserCourse extends Model
{
    protected $fillable = [
        'user_id', 'course_id', 'started_at', 'completed_at',
        'progress', 'current_episode_id', 'is_reset', 'status',
        'completion_proof_path', 'completion_endorsement_status',
        'completion_endorsed_by', 'completion_endorsed_at', 'completion_endorsement_note',
    ];

    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
            'is_reset' => 'boolean',
            'progress' => 'decimal:2',
            'completion_endorsed_at' => 'datetime',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    public function endorser()
    {
        return $this->belongsTo(User::class, 'completion_endorsed_by');
    }
}
