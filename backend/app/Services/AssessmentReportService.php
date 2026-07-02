<?php

namespace App\Services;

use App\Models\AssessmentResponse;
use App\Models\Certificate;
use App\Models\JobRoleProfile;
use App\Models\User;

class AssessmentReportService
{
    public function __construct(private DsriCalculationService $dsriService) {}

    /**
     * Merge the latest full assessment with any newer section retests.
     * Returns per-competency section details enriched with the merged score.
     */
    public function mergedSectionScores(User $user, string $locale = 'en'): ?array
    {
        $latest = $user->assessmentResponses()
            ->where('assessment_type', 'full')
            ->orderByDesc('submitted_at')
            ->first();

        if (!$latest) {
            return null;
        }

        $sectionRetests = $user->assessmentResponses()
            ->where('assessment_type', 'section')
            ->where('submitted_at', '>', $latest->submitted_at)
            ->get();

        $merged = [];
        foreach ($this->dsriService->getCompetencies() as $code => $config) {
            $field = strtolower($code) . '_score';
            $merged[$code] = $latest->$field;
        }

        foreach ($sectionRetests as $retest) {
            if ($retest->section_code) {
                $merged[$retest->section_code] = $retest->{strtolower($retest->section_code) . '_score'};
            }
        }

        $sectionScores = [];
        foreach ($this->dsriService->getCompetencies() as $code => $config) {
            $sectionScores[$code] = $this->dsriService->getSectionDetails($merged[$code], $code, $locale);
        }

        return $sectionScores;
    }

    /**
     * Public verification payload for a certificate.
     */
    public function certificatePayload(?AssessmentResponse $latest): ?array
    {
        if (!$latest) {
            return null;
        }

        $cert = Certificate::where('assessment_response_id', $latest->id)->first();
        if (!$cert) {
            return null;
        }

        return [
            'id' => $cert->id,
            'verification_code' => $cert->verification_code,
            'maturity_level' => $cert->maturity_level,
            'maturity_label_en' => $cert->maturity_label_en,
            'issued_at' => $cert->issued_at->toIso8601String(),
            'expires_at' => $cert->expires_at?->toIso8601String(),
            'is_expired' => $cert->isExpired(),
            'share_url' => url('/c/' . $cert->verification_code),
        ];
    }

    /**
     * Compare a user's latest assessment against a job role's target competencies.
     * Returns per-competency gap status + an overall readiness (ratio-based, capped at 100%).
     */
    public function roleGap(User $user, JobRoleProfile $profile, string $locale = 'en'): array
    {
        $latest = $user->latestAssessmentResponse;

        if (!$latest) {
            return ['has_data' => false];
        }

        $targets = $profile->getTargets();
        $competencies = $this->dsriService->getCompetencies();
        $gaps = [];

        foreach ($competencies as $code => $config) {
            $field = strtolower($code) . '_score';
            $actualPct = $config['max_score'] > 0
                ? round(($latest->$field / $config['max_score']) * 100, 1)
                : 0;
            $targetPct = $targets[$code] ?? 0;
            $gap = round($targetPct - $actualPct, 1);

            $readiness = $targetPct > 0
                ? min(100, round(($actualPct / $targetPct) * 100, 1))
                : 100;

            $gaps[$code] = [
                'code' => $code,
                'name' => $config['name_en'],
                'name_ms' => $config['name_ms'],
                'actual_pct' => $actualPct,
                'target_pct' => $targetPct,
                'gap' => $gap,
                'readiness' => $readiness,
                'status' => $gap <= 0 ? 'met' : ($gap <= 15 ? 'close' : 'gap'),
            ];
        }

        return [
            'has_data' => true,
            'role' => [
                'id' => $profile->id,
                'name' => $profile->role_name,
                'name_ms' => $profile->role_name_ms,
            ],
            'gaps' => $gaps,
            'overall_readiness' => round(
                array_sum(array_map(fn($g) => $g['readiness'], $gaps)) / max(1, count($gaps)),
                1
            ),
        ];
    }
}
