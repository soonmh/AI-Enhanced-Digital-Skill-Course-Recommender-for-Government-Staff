<?php

namespace App\Services\Concerns;

use App\Models\User;
use App\Services\DsriCalculationService;

trait FormatsInsightContext
{
    protected function dsriService(): DsriCalculationService
    {
        return app(DsriCalculationService::class);
    }

    protected function getDsriLevelContext(): string
    {
        return "DSRI Level Classification:\n"
            . "- 0-20: Novice — minimal digital capability; urgent intervention needed\n"
            . "- 21-40: Beginner — basic awareness; structured training required\n"
            . "- 41-60: Intermediate — functional skills; targeted improvement needed\n"
            . "- 61-80: Proficient — strong capability; refinement and leadership opportunities\n"
            . "- 81-100: Advanced — expert-level; can mentor others and drive innovation";
    }

    protected function getLanguageInstruction(string $locale): string
    {
        return $locale === 'ms'
            ? "\n\nIMPORTANT: Respond entirely in Bahasa Melayu. All text, findings, and advice must be in Bahasa Melayu."
            : "\n\nRespond in English.";
    }

    protected function formatCompetencyName(string $code, string $locale): string
    {
        $competencies = $this->dsriService()->getCompetencies();
        $config = $competencies[$code] ?? null;
        if (!$config) {
            return $code;
        }
        return $locale === 'ms'
            ? "{$config['name_ms']} ({$config['name_en']})"
            : $config['name_en'];
    }

    protected function buildUserContext(User $user): string
    {
        $role = $user->roles->first()?->name ?? 'Staff';
        $field = $user->working_field ?? 'Not specified';
        $level = $user->job_level ?? 'Not specified';
        $exp = $user->experience_years ?? 'Not specified';

        return "- Role: {$role}\n- Working field: {$field}\n- Job level: {$level}\n- Experience: {$exp} years";
    }

    protected function formatScoresForPrompt(array $scores): string
    {
        return collect($scores)->map(fn($s) => "- {$s['name']}: {$s['score']}/{$s['max']} ({$s['percentage']}%)")->implode("\n");
    }
}
