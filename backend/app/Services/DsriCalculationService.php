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

    const MATURITY_LEVELS = [
        'novice'     => ['level' => 1, 'label_en' => 'Novice',     'label_ms' => 'Pemula',         'hex' => '#ef4444', 'range_min' => 0,  'range_max' => 30],
        'developing' => ['level' => 2, 'label_en' => 'Developing', 'label_ms' => 'Berkembang',     'hex' => '#f97316', 'range_min' => 31, 'range_max' => 50],
        'capable'    => ['level' => 3, 'label_en' => 'Capable',    'label_ms' => 'Berkebolehan',   'hex' => '#eab308', 'range_min' => 51, 'range_max' => 70],
        'proficient' => ['level' => 4, 'label_en' => 'Proficient', 'label_ms' => 'Mahir',          'hex' => '#22c55e', 'range_min' => 71, 'range_max' => 89],
        'expert'     => ['level' => 5, 'label_en' => 'Expert',     'label_ms' => 'Pakar',          'hex' => '#10b981', 'range_min' => 90, 'range_max' => 100],
    ];

    public function getMaturityLevel(float $dsri, string $locale = 'en'): array
    {
        $code = 'novice';
        if ($dsri >= 90) $code = 'expert';
        elseif ($dsri >= 71) $code = 'proficient';
        elseif ($dsri >= 51) $code = 'capable';
        elseif ($dsri >= 31) $code = 'developing';

        $current = self::MATURITY_LEVELS[$code];
        $next = null;
        $gap = 0;
        if ($code !== 'expert') {
            $order = ['novice', 'developing', 'capable', 'proficient', 'expert'];
            $nextCode = $order[array_search($code, $order) + 1];
            $next = self::MATURITY_LEVELS[$nextCode];
            $gap = max(0, $next['range_min'] - $dsri);
        }

        return [
            'level'          => $current['level'],
            'code'           => $code,
            'label'          => $locale === 'ms' ? $current['label_ms'] : $current['label_en'],
            'label_en'       => $current['label_en'],
            'label_ms'       => $current['label_ms'],
            'color'          => $current['hex'],
            'range_min'      => $current['range_min'],
            'range_max'      => $current['range_max'],
            'next_level'     => $next ? $next['level'] : null,
            'next_label_en'  => $next ? $next['label_en'] : null,
            'next_label_ms'  => $next ? $next['label_ms'] : null,
            'gap_to_next'    => $gap,
        ];
    }
}
