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
        // --- Existing courses ---
        'CyberSAFE® for Citizens' => ['C5', 'C9'],
        'AI for Citizens' => ['C1', 'C2', 'C4'],
        'Cloud for Citizens' => ['C2', 'C7'],
        'Basic Microsoft Word for Government Use' => ['C1', 'C2', 'C10'],
        'Google Workspace Essentials' => ['C2', 'C3', 'C6'],
        'Canva Design for Beginners' => ['C8', 'C2'],
        'Digital Government & E-Services' => ['C7', 'C1', 'C9'],
        'Introduction to Data Literacy' => ['C1', 'C4', 'C10'],

        // --- C1 – Digital Literacy ---
        'Global Digital Literacy' => ['C1', 'C2'],
        'Information Literacy in the Digital Age' => ['C1', 'C4'],
        'Emerging Technologies for Government' => ['C1', 'C7'],

        // --- C2 – Digital Skills ---
        'IT Fundamentals for Beginners' => ['C1', 'C2'],
        'Work Smarter with Microsoft Excel' => ['C2', 'C10'],
        'Microsoft Power Platform Fundamentals' => ['C2', 'C8'],

        // --- C3 – Communication & Collaboration ---
        'Professional Email and Online Communication' => ['C3', 'C1'],
        'Collaborate with Microsoft Teams' => ['C3', 'C2'],
        'Stakeholder Engagement in Digital Projects' => ['C3', 'C6'],

        // --- C4 – Problem-Solving & Critical Thinking ---
        'Critical Thinking and Decision Making' => ['C4', 'C6'],
        'Data-Driven Problem Solving' => ['C4', 'C10'],
        'Design Thinking for Public Services' => ['C4', 'C8'],

        // --- C5 – Digital Safety & Security ---
        'Digital Security Awareness' => ['C5', 'C1'],
        'Data Protection and Privacy Compliance' => ['C5', 'C9'],
        'Cybersecurity Risk Management' => ['C5', 'C7'],

        // --- C6 – Professional Development & Engagement ---
        'Continuous Learning in the Digital Workplace' => ['C6', 'C1'],
        'Digital Leadership and Change Management' => ['C6', 'C7'],
        'Innovation Management' => ['C6', 'C8'],

        // --- C7 – Digital Transformation & Governance ---
        'AI Fluency' => ['C7', 'C1'],
        'Generative AI Fundamentals' => ['C7', 'C2'],
        'Digital Transformation Strategy' => ['C7', 'C4'],

        // --- C8 – Digital Creation & Innovation ---
        'Digital Content Creation' => ['C8', 'C1'],
        'Digital Media Production for Government Communications' => ['C8', 'C3'],
        'UX Design Foundations' => ['C8', 'C4'],

        // --- C9 – Digital Ethics & Inclusion ---
        'AI Governance and Ethics' => ['C9', 'C7'],
        'AI Safety and Responsible Use' => ['C9', 'C5'],
        'Digital Accessibility and Inclusive Design' => ['C9', 'C3'],

        // --- C10 – Functional Skills & Applications ---
        'Project Management Fundamentals' => ['C10', 'C4'],
        'Microsoft 365 for Government Productivity' => ['C10', 'C2'],
        'Data Analysis and Visualization with Power BI' => ['C10', 'C4'],
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
