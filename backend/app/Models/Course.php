<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Course extends Model
{
    use HasFactory;
    protected $fillable = [
        'title', 'description', 'image', 'url', 'remark', 'level',
        'working_field', 'created_by', 'title_bm', 'description_bm',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function enrollments()
    {
        return $this->hasMany(UserCourse::class);
    }

    public function competencyMappings()
    {
        return $this->hasMany(CourseCompetencyMapping::class);
    }

    public function ratings()
    {
        return $this->hasMany(CourseRating::class);
    }
}
