<?php

namespace App\Listeners;

use App\Events\AssessmentSubmitted;
use App\Models\Certificate;
use App\Services\DsriCalculationService;
use Illuminate\Support\Str;

class IssueCertificate
{
    public function __construct(private DsriCalculationService $dsriService) {}

    public function handle(AssessmentSubmitted $event): void
    {
        $response = $event->response;
        $user = $response->user;
        $locale = $user->locale ?? 'en';

        $maturity = $this->dsriService->getMaturityLevel($response->dsri, $locale);

        $competencyScores = [];
        foreach ($this->dsriService->getCompetencies() as $code => $config) {
            $field = strtolower($code) . '_score';
            $competencyScores[$code] = $response->$field;
        }

        Certificate::updateOrCreate(
            ['user_id' => $user->id],
            [
                'assessment_response_id' => $response->id,
                'verification_code' => Str::uuid()->toString(),
                'type' => 'dsri_assessment',
                'dsri_score' => $response->dsri,
                'maturity_level' => $maturity['level'],
                'maturity_code' => $maturity['code'],
                'maturity_label_en' => $maturity['label_en'],
                'maturity_label_ms' => $maturity['label_ms'],
                'competency_scores' => $competencyScores,
                'issued_at' => now(),
                'expires_at' => now()->addYear(),
            ]
        );
    }
}
