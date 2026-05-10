<?php

namespace App\Services;

class DsriCalculationService
{
    const COMPETENCIES = [
        'C1'  => ['weight' => 15, 'max_score' => 75,  'name_en' => 'Digital Literacy',                    'name_ms' => 'Literasi Digital'],
        'C2'  => ['weight' => 15, 'max_score' => 75,  'name_en' => 'Digital Skills',                      'name_ms' => 'Kemahiran Digital'],
        'C3'  => ['weight' => 10, 'max_score' => 50,  'name_en' => 'Communication & Collaboration',       'name_ms' => 'Komunikasi & Kolaborasi'],
        'C4'  => ['weight' => 10, 'max_score' => 50,  'name_en' => 'Problem-Solving & Critical Thinking', 'name_ms' => 'Penyelesaian Masalah & Pemikiran Kritis'],
        'C5'  => ['weight' => 10, 'max_score' => 50,  'name_en' => 'Digital Safety & Security',           'name_ms' => 'Keselamatan & Sekuriti Digital'],
        'C6'  => ['weight' => 10, 'max_score' => 50,  'name_en' => 'Professional Development & Engagement','name_ms' => 'Pembangunan & Penglibatan Profesional'],
        'C7'  => ['weight' => 11, 'max_score' => 55,  'name_en' => 'Digital Transformation & Governance', 'name_ms' => 'Transformasi & Tadbir Urus Digital'],
        'C8'  => ['weight' => 4,  'max_score' => 20,  'name_en' => 'Digital Creation & Innovation',       'name_ms' => 'Penciptaan & Inovasi Digital'],
        'C9'  => ['weight' => 5,  'max_score' => 25,  'name_en' => 'Digital Ethics & Inclusion',          'name_ms' => 'Etika & Inklusi Digital'],
        'C10' => ['weight' => 10, 'max_score' => 50,  'name_en' => 'Functional Skills & Applications',    'name_ms' => 'Kemahiran & Aplikasi Fungsian'],
    ];

    public function calculate(array $sectionScores): array
    {
        $scores = [];
        $dsri = 0;

        foreach (self::COMPETENCIES as $code => $config) {
            $raw = $sectionScores[$code] ?? 0;
            $scores[$code] = min($raw, $config['max_score']);
            $dsri += ($scores[$code] / $config['max_score']) * $config['weight'];
        }

        return [
            'scores' => $scores,
            'dsri' => round($dsri, 2),
        ];
    }

    public function getSectionDetails(float $score, string $code, string $locale = 'en'): array
    {
        $config = self::COMPETENCIES[$code];
        $nameKey = $locale === 'ms' ? 'name_ms' : 'name_en';
        return [
            'section_code' => $code,
            'section_name' => $config[$nameKey],
            'weight' => $config['weight'],
            'max_score' => $config['max_score'],
            'score' => $score,
            'score_percentage' => round(($score / $config['max_score']) * $config['weight'], 2),
        ];
    }

    public function getCompetencies(): array
    {
        return self::COMPETENCIES;
    }
}
