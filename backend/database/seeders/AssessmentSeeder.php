<?php

namespace Database\Seeders;

use App\Models\Assessment;
use App\Models\AssessmentResponse;
use App\Models\User;
use Illuminate\Database\Seeder;

class AssessmentSeeder extends Seeder
{
    public function run(): void
    {
        $assessment = Assessment::firstOrCreate(
            ['id' => 1],
            ['title' => 'Digital Skills Readiness Assessment', 'description' => 'Comprehensive assessment measuring digital competency across 10 key areas.']
        );

        $staff = User::where('email', 'staff01@test.com')->first();
        if ($staff && $staff->assessmentResponses()->count() === 0) {
            $responses = [
                ['c1' => 60, 'c2' => 60, 'c3' => 40, 'c4' => 40, 'c5' => 40, 'c6' => 40, 'c7' => 44, 'c8' => 16, 'c9' => 20, 'c10' => 40, 'dsri' => 80.00],
                ['c1' => 75, 'c2' => 75, 'c3' => 50, 'c4' => 50, 'c5' => 50, 'c6' => 50, 'c7' => 55, 'c8' => 20, 'c9' => 25, 'c10' => 50, 'dsri' => 100.00],
                ['c1' => 30, 'c2' => 45, 'c3' => 30, 'c4' => 30, 'c5' => 20, 'c6' => 20, 'c7' => 22, 'c8' => 4, 'c9' => 5, 'c10' => 30, 'dsri' => 47.20],
                ['c1' => 15, 'c2' => 15, 'c3' => 10, 'c4' => 10, 'c5' => 10, 'c6' => 10, 'c7' => 11, 'c8' => 4, 'c9' => 5, 'c10' => 10, 'dsri' => 20.00],
            ];

            $dates = ['2025-08-13', '2025-08-14 15:38', '2025-08-14 15:42', '2025-08-16'];
            foreach ($responses as $i => $r) {
                AssessmentResponse::create([
                    'user_id' => $staff->id,
                    'assessment_id' => $assessment->id,
                    'submitted_at' => $dates[$i],
                    'c1_score' => $r['c1'], 'c2_score' => $r['c2'], 'c3_score' => $r['c3'],
                    'c4_score' => $r['c4'], 'c5_score' => $r['c5'], 'c6_score' => $r['c6'],
                    'c7_score' => $r['c7'], 'c8_score' => $r['c8'], 'c9_score' => $r['c9'],
                    'c10_score' => $r['c10'], 'dsri' => $r['dsri'],
                ]);
            }
        }

        $admin = User::where('email', 'admin01@test.com')->first();
        if ($admin && $admin->assessmentResponses()->count() === 0) {
            AssessmentResponse::create([
                'user_id' => $admin->id,
                'assessment_id' => $assessment->id,
                'submitted_at' => '2025-08-13 13:12:35',
                'c1_score' => 75, 'c2_score' => 60, 'c3_score' => 40, 'c4_score' => 50,
                'c5_score' => 50, 'c6_score' => 50, 'c7_score' => 44, 'c8_score' => 16,
                'c9_score' => 20, 'c10_score' => 50, 'dsri' => 91.00,
            ]);
        }

        // Assessments for additional staff
        $additionalStaff = [
            ['email' => 'ahmad@test.com', 'responses' => [
                ['c1' => 45, 'c2' => 50, 'c3' => 30, 'c4' => 25, 'c5' => 35, 'c6' => 30, 'c7' => 33, 'c8' => 12, 'c9' => 10, 'c10' => 35, 'dsri' => 57.50, 'date' => '2025-07-20 10:00:00'],
                ['c1' => 55, 'c2' => 60, 'c3' => 40, 'c4' => 35, 'c5' => 40, 'c6' => 40, 'c7' => 38, 'c8' => 16, 'c9' => 15, 'c10' => 40, 'dsri' => 71.00, 'date' => '2025-09-15 14:30:00'],
            ]],
            ['email' => 'siti@test.com', 'responses' => [
                ['c1' => 70, 'c2' => 65, 'c3' => 45, 'c4' => 45, 'c5' => 50, 'c6' => 45, 'c7' => 44, 'c8' => 18, 'c9' => 20, 'c10' => 45, 'dsri' => 86.20, 'date' => '2025-06-05 09:00:00'],
                ['c1' => 75, 'c2' => 70, 'c3' => 50, 'c4' => 50, 'c5' => 50, 'c6' => 50, 'c7' => 50, 'c8' => 20, 'c9' => 22, 'c10' => 50, 'dsri' => 94.00, 'date' => '2025-09-01 11:00:00'],
            ]],
            ['email' => 'raj@test.com', 'responses' => [
                ['c1' => 60, 'c2' => 55, 'c3' => 35, 'c4' => 40, 'c5' => 30, 'c6' => 35, 'c7' => 33, 'c8' => 10, 'c9' => 15, 'c10' => 30, 'dsri' => 63.10, 'date' => '2025-08-10 16:00:00'],
            ]],
            ['email' => 'meiling@test.com', 'responses' => [
                ['c1' => 20, 'c2' => 25, 'c3' => 15, 'c4' => 10, 'c5' => 15, 'c6' => 10, 'c7' => 11, 'c8' => 4, 'c9' => 5, 'c10' => 15, 'dsri' => 27.50, 'date' => '2025-08-25 08:30:00'],
            ]],
            ['email' => 'farah@test.com', 'responses' => [
                ['c1' => 65, 'c2' => 70, 'c3' => 45, 'c4' => 45, 'c5' => 45, 'c6' => 45, 'c7' => 44, 'c8' => 16, 'c9' => 20, 'c10' => 45, 'dsri' => 83.40, 'date' => '2025-05-15 10:00:00'],
                ['c1' => 75, 'c2' => 75, 'c3' => 50, 'c4' => 50, 'c5' => 50, 'c6' => 50, 'c7' => 55, 'c8' => 20, 'c9' => 25, 'c10' => 50, 'dsri' => 100.00, 'date' => '2025-08-20 14:00:00'],
            ]],
            ['email' => 'weiming@test.com', 'responses' => [
                ['c1' => 40, 'c2' => 35, 'c3' => 25, 'c4' => 20, 'c5' => 25, 'c6' => 20, 'c7' => 22, 'c8' => 8, 'c9' => 10, 'c10' => 25, 'dsri' => 44.70, 'date' => '2025-07-30 15:00:00'],
            ]],
        ];

        foreach ($additionalStaff as $staffData) {
            $user = User::where('email', $staffData['email'])->first();
            if (!$user || $user->assessmentResponses()->count() > 0) continue;

            foreach ($staffData['responses'] as $r) {
                AssessmentResponse::create([
                    'user_id' => $user->id,
                    'assessment_id' => $assessment->id,
                    'submitted_at' => $r['date'],
                    'c1_score' => $r['c1'], 'c2_score' => $r['c2'], 'c3_score' => $r['c3'],
                    'c4_score' => $r['c4'], 'c5_score' => $r['c5'], 'c6_score' => $r['c6'],
                    'c7_score' => $r['c7'], 'c8_score' => $r['c8'], 'c9_score' => $r['c9'],
                    'c10_score' => $r['c10'], 'dsri' => $r['dsri'],
                ]);
            }
        }
    }
}
