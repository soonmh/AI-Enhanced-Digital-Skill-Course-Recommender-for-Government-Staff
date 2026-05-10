<?php

namespace App\Events;

use App\Models\UserCourse;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CourseCompleted
{
    use Dispatchable, SerializesModels;

    public function __construct(public UserCourse $userCourse) {}
}
