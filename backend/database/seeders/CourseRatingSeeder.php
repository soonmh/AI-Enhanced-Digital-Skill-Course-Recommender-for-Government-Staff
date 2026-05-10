<?php

namespace Database\Seeders;

use App\Models\CourseRating;
use App\Models\User;
use App\Models\UserCourse;
use Illuminate\Database\Seeder;

class CourseRatingSeeder extends Seeder
{
    public function run(): void
    {
        $ratings = [
            // Course 0: CyberSAFE
            ['staff01@test.com', 0, 4],
            ['ahmad@test.com', 0, 5],
            ['siti@test.com', 0, 4],
            ['meiling@test.com', 0, 3],
            ['farah@test.com', 0, 5],
            ['weiming@test.com', 0, 4],
            // Course 1: AI for Citizens
            ['staff01@test.com', 1, 5],
            ['siti@test.com', 1, 4],
            ['raj@test.com', 1, 3],
            ['farah@test.com', 1, 5],
            // Course 2: Cloud for Citizens
            ['staff01@test.com', 2, 4],
            ['siti@test.com', 2, 5],
            ['meiling@test.com', 2, 3],
            ['farah@test.com', 2, 4],
            // Course 3: MS Word
            ['ahmad@test.com', 3, 4],
            ['raj@test.com', 3, 5],
            ['weiming@test.com', 3, 3],
            // Course 4: Google Workspace
            ['staff01@test.com', 4, 3],
            ['meiling@test.com', 4, 5],
            // Course 5: Canva
            ['ahmad@test.com', 5, 4],
            ['farah@test.com', 5, 5],
            // Course 6: Digital Gov
            ['siti@test.com', 6, 4],
            ['farah@test.com', 6, 5],
            // Course 7: Data Literacy
            ['raj@test.com', 7, 4],
            ['farah@test.com', 7, 4],
        ];

        $allCourses = \App\Models\Course::pluck('id')->toArray();

        foreach ($ratings as [$email, $courseIdx, $rating]) {
            $user = User::where('email', $email)->first();
            if (!$user || !isset($allCourses[$courseIdx])) continue;

            $enrolled = UserCourse::where('user_id', $user->id)
                ->where('course_id', $allCourses[$courseIdx])
                ->exists();

            if (!$enrolled) continue;

            CourseRating::firstOrCreate(
                ['user_id' => $user->id, 'course_id' => $allCourses[$courseIdx]],
                ['rating' => $rating]
            );
        }
    }
}
