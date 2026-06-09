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
            // Course 8: Global Digital Literacy (C1)
            ['staff01@test.com', 8, 5],
            ['weiming@test.com', 8, 4],
            // Course 9: Information Literacy (C1)
            ['siti@test.com', 9, 4],
            ['farah@test.com', 9, 5],
            // Course 10: Emerging Technologies (C1)
            ['meiling@test.com', 10, 4],
            ['farah@test.com', 10, 5],
            // Course 11: IT Fundamentals (C2)
            ['ahmad@test.com', 11, 4],
            ['farah@test.com', 11, 5],
            // Course 12: Microsoft Excel (C2)
            ['raj@test.com', 12, 5],
            ['siti@test.com', 12, 4],
            // Course 13: Power Platform (C2)
            ['farah@test.com', 13, 4],
            // Course 14: Professional Email (C3)
            ['staff01@test.com', 14, 4],
            ['raj@test.com', 14, 3],
            // Course 15: Microsoft Teams (C3)
            ['raj@test.com', 15, 4],
            ['weiming@test.com', 15, 5],
            // Course 16: Stakeholder Engagement (C3)
            ['weiming@test.com', 16, 4],
            ['farah@test.com', 16, 5],
            // Course 17: Critical Thinking (C4)
            ['ahmad@test.com', 17, 4],
            ['siti@test.com', 17, 5],
            // Course 18: Data-Driven Problem Solving (C4)
            ['meiling@test.com', 18, 3],
            ['farah@test.com', 18, 4],
            // Course 19: Design Thinking (C4)
            ['farah@test.com', 19, 5],
            ['siti@test.com', 19, 4],
            // Course 20: Digital Security Awareness (C5)
            ['staff01@test.com', 20, 5],
            ['ahmad@test.com', 20, 4],
            // Course 21: Data Protection (C5)
            ['raj@test.com', 21, 4],
            ['farah@test.com', 21, 5],
            // Course 22: Cybersecurity Risk Mgmt (C5)
            ['staff01@test.com', 22, 4],
            ['farah@test.com', 22, 5],
            // Course 23: Continuous Learning (C6)
            ['raj@test.com', 23, 3],
            ['farah@test.com', 23, 5],
            // Course 24: Digital Leadership (C6)
            ['farah@test.com', 24, 4],
            ['siti@test.com', 24, 5],
            // Course 25: Innovation Management (C6)
            ['weiming@test.com', 25, 4],
            ['farah@test.com', 25, 5],
            // Course 26: AI Fluency (C7)
            ['ahmad@test.com', 26, 5],
            ['staff01@test.com', 26, 4],
            // Course 27: Generative AI (C7)
            ['meiling@test.com', 27, 4],
            ['farah@test.com', 27, 5],
            // Course 28: Digital Transformation Strategy (C7)
            ['farah@test.com', 28, 5],
            ['siti@test.com', 28, 4],
            // Course 29: Digital Content Creation (C8)
            ['staff01@test.com', 29, 5],
            ['farah@test.com', 29, 4],
            // Course 30: Digital Media Production (C8)
            ['farah@test.com', 30, 4],
            ['raj@test.com', 30, 3],
            // Course 31: UX Design (C8)
            ['weiming@test.com', 31, 4],
            ['farah@test.com', 31, 5],
            // Course 32: AI Governance (C9)
            ['ahmad@test.com', 32, 5],
            ['farah@test.com', 32, 4],
            // Course 33: AI Safety (C9)
            ['farah@test.com', 33, 5],
            ['meiling@test.com', 33, 4],
            // Course 34: Digital Accessibility (C9)
            ['farah@test.com', 34, 4],
            ['siti@test.com', 34, 5],
            // Course 35: Project Management (C10)
            ['weiming@test.com', 35, 4],
            ['farah@test.com', 35, 5],
            // Course 36: Microsoft 365 (C10)
            ['farah@test.com', 36, 4],
            ['raj@test.com', 36, 3],
            // Course 37: Power BI (C10)
            ['farah@test.com', 37, 5],
            ['staff01@test.com', 37, 4],
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
