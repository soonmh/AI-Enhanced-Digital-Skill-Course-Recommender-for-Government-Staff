<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\User;
use App\Models\UserCourse;
use Illuminate\Database\Seeder;

class CourseSeeder extends Seeder
{
    public function run(): void
    {
        $trainer = User::where('email', 'trainer01@test.com')->first();

        $courses = [
            ['title' => 'CyberSAFE® for Citizens', 'description' => 'A foundational course covering basic cybersecurity awareness. Participants will learn to identify common online threats like phishing, understand the importance of strong passwords, and manage digital risks to protect sensitive information.', 'url' => 'https://rakyatdigital.gov.my/courses/cybersafe-untuk-rakyat', 'level' => 'beginner', 'title_bm' => 'CyberSAFE® untuk Rakyat', 'description_bm' => 'Kursus asas yang merangkumi kesedaran keselamatan siber asas. Peserta akan belajar mengenal pasti ancaman dalam talian yang biasa seperti pancingan data, memahami kepentingan kata laluan yang kukuh, dan menguruskan risiko digital untuk melindungi maklumat sensitif.'],
            ['title' => 'AI for Citizens', 'description' => 'A short introductory program designed to demystify Artificial Intelligence. It explains the basics of AI and its application in daily life, concluding with a certificate of completion.', 'url' => 'https://rakyatdigital.gov.my/courses/ai-untuk-rakyat', 'level' => 'beginner', 'title_bm' => 'AI untuk Rakyat', 'description_bm' => 'Program pengenalan ringkas yang direka untuk menjelaskan Kecerdasan Buatan. Ia menerangkan asas AI serta aplikasinya dalam kehidupan seharian, diakhiri dengan sijil penyiapan.'],
            ['title' => 'Cloud for Citizens', 'description' => 'An introductory module on cloud computing principles. This course explains how cloud services can be used to enhance productivity, enable data storage, and facilitate collaboration among teams.', 'url' => 'https://rakyatdigital.gov.my', 'level' => 'beginner', 'title_bm' => 'Pengkomputeran Awan untuk Rakyat', 'description_bm' => 'Modul pengenalan tentang prinsip pengkomputeran awan. Kursus ini menerangkan bagaimana perkhidmatan awan boleh digunakan untuk meningkatkan produktiviti, membolehkan penyimpanan data, dan memudahkan kerjasama dalam kalangan pasukan.'],
            ['title' => 'Basic Microsoft Word for Government Use', 'description' => 'Learn essential Microsoft Word skills tailored for government administrative work. Covers document formatting, templates, mail merge, and collaborative editing features.', 'level' => 'beginner', 'title_bm' => 'Microsoft Word Asas untuk Kegunaan Kerajaan', 'description_bm' => 'Pelajari kemahiran Microsoft Word penting yang disesuaikan untuk kerja pentadbiran kerajaan.'],
            ['title' => 'Google Workspace Essentials', 'description' => 'Master the core Google Workspace tools including Gmail, Google Drive, Docs, Sheets, and Meet for improved productivity and collaboration.', 'level' => 'beginner', 'title_bm' => 'Penting Google Workspace', 'description_bm' => 'Kuasai alat Google Workspace teras termasuk Gmail, Google Drive, Docs, Sheets, dan Meet.'],
            ['title' => 'Canva Design for Beginners', 'description' => 'Learn to create professional-looking presentations, social media graphics, and documents using Canva. No design experience required.', 'level' => 'beginner', 'title_bm' => 'Rekaan Canva untuk Pemula', 'description_bm' => 'Belajar mencipta persembahan profesional menggunakan Canva.'],
            ['title' => 'Digital Government & E-Services', 'description' => 'Understand Malaysia\'s digital government initiatives and learn to navigate e-services platforms effectively for both personal and professional use.', 'level' => 'beginner', 'title_bm' => 'Kerajaan Digital & E-Perkhidmatan', 'description_bm' => 'Fahami inisiatif kerajaan digital Malaysia.'],
            ['title' => 'Introduction to Data Literacy', 'description' => 'Develop foundational skills in reading, understanding, and communicating with data. Learn to interpret charts, graphs, and basic statistics.', 'level' => 'beginner', 'title_bm' => 'Pengenalan Literasi Data', 'description_bm' => 'Kembangkan kemahiran asas dalam membaca dan memahami data.'],
        ];

        foreach ($courses as $course) {
            Course::firstOrCreate(
                ['title' => $course['title']],
                array_merge($course, ['created_by' => $trainer?->id ?? 1])
            );
        }

        // Seed course enrollments
        $allCourses = Course::pluck('id')->toArray();
        $staffEmails = ['staff01@test.com', 'ahmad@test.com', 'siti@test.com', 'raj@test.com', 'meiling@test.com', 'farah@test.com', 'weiming@test.com'];

        $enrollments = [
            // staff01 - active in several courses, 2 completed
            ['staff01@test.com', [0 => ['progress' => 100, 'status' => 'completed', 'completed_at' => '2025-07-15'], 1 => ['progress' => 100, 'status' => 'completed', 'completed_at' => '2025-07-20'], 2 => ['progress' => 65.5, 'status' => 'active'], 4 => ['progress' => 30.0, 'status' => 'active']]],
            // ahmad - 1 completed, 2 active
            ['ahmad@test.com', [0 => ['progress' => 100, 'status' => 'completed', 'completed_at' => '2025-06-10'], 3 => ['progress' => 45.0, 'status' => 'active'], 5 => ['progress' => 80.0, 'status' => 'active']]],
            // siti - mostly completed
            ['siti@test.com', [0 => ['progress' => 100, 'status' => 'completed', 'completed_at' => '2025-05-20'], 1 => ['progress' => 100, 'status' => 'completed', 'completed_at' => '2025-06-01'], 2 => ['progress' => 100, 'status' => 'completed', 'completed_at' => '2025-06-15'], 6 => ['progress' => 55.0, 'status' => 'active']]],
            // raj - mixed
            ['raj@test.com', [1 => ['progress' => 90.0, 'status' => 'active'], 3 => ['progress' => 100, 'status' => 'completed', 'completed_at' => '2025-08-01'], 7 => ['progress' => 25.0, 'status' => 'active']]],
            // meiling - just started
            ['meiling@test.com', [0 => ['progress' => 10.0, 'status' => 'active'], 2 => ['progress' => 5.0, 'status' => 'active'], 4 => ['progress' => 100, 'status' => 'completed', 'completed_at' => '2025-09-01']]],
            // farah - advanced learner
            ['farah@test.com', [0 => ['progress' => 100, 'status' => 'completed', 'completed_at' => '2025-04-10'], 1 => ['progress' => 100, 'status' => 'completed', 'completed_at' => '2025-05-05'], 2 => ['progress' => 100, 'status' => 'completed', 'completed_at' => '2025-06-01'], 5 => ['progress' => 100, 'status' => 'completed', 'completed_at' => '2025-07-01'], 6 => ['progress' => 100, 'status' => 'completed', 'completed_at' => '2025-08-01'], 7 => ['progress' => 75.0, 'status' => 'active']]],
            // weiming - 1 active
            ['weiming@test.com', [0 => ['progress' => 50.0, 'status' => 'active'], 3 => ['progress' => 20.0, 'status' => 'active']]],
        ];

        foreach ($enrollments as [$email, $courseEnrollments]) {
            $user = User::where('email', $email)->first();
            if (!$user) continue;

            foreach ($courseEnrollments as $courseIdx => $enrollData) {
                if (!isset($allCourses[$courseIdx])) continue;

                UserCourse::firstOrCreate(
                    ['user_id' => $user->id, 'course_id' => $allCourses[$courseIdx]],
                    array_merge([
                        'started_at' => now()->subMonths(3),
                        'progress' => $enrollData['progress'],
                        'status' => $enrollData['status'],
                        'completed_at' => $enrollData['completed_at'] ?? null,
                    ])
                );
            }
        }
    }
}
