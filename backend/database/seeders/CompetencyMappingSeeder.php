<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\CourseCompetencyMapping;
use Illuminate\Database\Seeder;

class CompetencyMappingSeeder extends Seeder
{
    /**
     * Maps course titles to the competency codes they address.
     * C1=Digital Literacy, C2=Digital Skills, C3=Communication, C4=Problem-Solving,
     * C5=Digital Safety, C6=Professional Dev, C7=Digital Transformation, C8=Digital Creation,
     * C9=Digital Ethics, C10=Functional Skills
     */
    private const MAPPINGS = [
        'CyberSAFE® for Citizens' => ['C5', 'C9'],
        'AI for Citizens' => ['C1', 'C2', 'C4'],
        'Cloud for Citizens' => ['C2', 'C7'],
        'Basic Microsoft Word for Government Use' => ['C1', 'C2', 'C10'],
        'Google Workspace Essentials' => ['C2', 'C3', 'C6'],
        'Canva Design for Beginners' => ['C8', 'C2'],
        'Digital Government & E-Services' => ['C7', 'C1', 'C9'],
        'Introduction to Data Literacy' => ['C1', 'C4', 'C10'],
    ];

    public function run(): void
    {
        foreach (self::MAPPINGS as $title => $codes) {
            $course = Course::where('title', $title)->first();
            if (!$course) {
                continue;
            }

            foreach ($codes as $code) {
                CourseCompetencyMapping::firstOrCreate(
                    ['course_id' => $course->id, 'competency_code' => $code]
                );
            }
        }

        // For courses without explicit mappings, assign based on level and keywords
        $fallbacks = [
            'beginner' => ['C1', 'C2'],
            'intermediate' => ['C3', 'C4', 'C6'],
            'advanced' => ['C7', 'C8'],
        ];

        Course::whereDoesntHave('competencyMappings')->each(function ($course) use ($fallbacks) {
            $codes = $fallbacks[$course->level] ?? ['C1'];
            foreach ($codes as $code) {
                CourseCompetencyMapping::firstOrCreate(
                    ['course_id' => $course->id, 'competency_code' => $code]
                );
            }
        });
    }
}
