<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CourseCompetencyMapping extends Model
{
    protected $fillable = ['course_id', 'competency_code'];

    public function course()
    {
        return $this->belongsTo(Course::class);
    }
}
