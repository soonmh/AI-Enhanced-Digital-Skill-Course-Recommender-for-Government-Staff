<?php

namespace Tests\Unit;

use App\Services\DsriCalculationService;
use PHPUnit\Framework\TestCase;

class DsriCalculationTest extends TestCase
{
    private DsriCalculationService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new DsriCalculationService();
    }

    public function test_all_zeros_returns_dsri_zero(): void
    {
        $scores = array_fill_keys(['C1','C2','C3','C4','C5','C6','C7','C8','C9','C10'], 0);
        $result = $this->service->calculate($scores);

        $this->assertEquals(0, $result['dsri']);
    }

    public function test_all_max_scores_returns_dsri_100(): void
    {
        $scores = [
            'C1' => 75, 'C2' => 75, 'C3' => 50, 'C4' => 50, 'C5' => 50,
            'C6' => 50, 'C7' => 55, 'C8' => 20, 'C9' => 25, 'C10' => 50,
        ];
        $result = $this->service->calculate($scores);

        $this->assertEquals(100, $result['dsri']);
    }

    public function test_specific_known_values(): void
    {
        // C1 at max (75/75 * 15 = 15), C2 at 0, rest at 0
        $scores = array_fill_keys(['C1','C2','C3','C4','C5','C6','C7','C8','C9','C10'], 0);
        $scores['C1'] = 75;

        $result = $this->service->calculate($scores);
        $this->assertEquals(15, $result['dsri']);
    }

    public function test_scores_above_max_are_clamped(): void
    {
        $scores = array_fill_keys(['C1','C2','C3','C4','C5','C6','C7','C8','C9','C10'], 0);
        $scores['C1'] = 200; // max is 75

        $result = $this->service->calculate($scores);
        // Should be clamped to 75, giving DSRI contribution of 15
        $this->assertEquals(15, $result['dsri']);
        $this->assertEquals(75, $result['scores']['C1']);
    }

    public function test_partial_scores(): void
    {
        $scores = array_fill_keys(['C1','C2','C3','C4','C5','C6','C7','C8','C9','C10'], 0);
        $scores['C1'] = 37; // half of 75
        $scores['C3'] = 25; // half of 50

        $result = $this->service->calculate($scores);
        // C1: 37/75 * 15 = 7.4, C3: 25/50 * 10 = 5
        $this->assertEquals(12.4, $result['dsri']);
    }

    public function test_missing_scores_treated_as_zero(): void
    {
        $result = $this->service->calculate([]);

        $this->assertEquals(0, $result['dsri']);
        foreach (['C1','C2','C3','C4','C5','C6','C7','C8','C9','C10'] as $code) {
            $this->assertEquals(0, $result['scores'][$code]);
        }
    }

    public function test_get_section_details(): void
    {
        $details = $this->service->getSectionDetails(50, 'C1', 'en');

        $this->assertEquals('C1', $details['section_code']);
        $this->assertEquals('Digital Literacy', $details['section_name']);
        $this->assertEquals(15, $details['weight']);
        $this->assertEquals(75, $details['max_score']);
        $this->assertEquals(50, $details['score']);
    }

    public function test_get_section_details_malay(): void
    {
        $details = $this->service->getSectionDetails(50, 'C1', 'ms');

        $this->assertEquals('Literasi Digital', $details['section_name']);
    }

    public function test_get_competencies_returns_all_ten(): void
    {
        $competencies = $this->service->getCompetencies();

        $this->assertCount(10, $competencies);
        $this->assertArrayHasKey('C1', $competencies);
        $this->assertArrayHasKey('C10', $competencies);
    }

    public function test_weights_sum_to_100(): void
    {
        $competencies = $this->service->getCompetencies();
        $totalWeight = array_sum(array_map(fn($c) => $c['weight'], $competencies));

        $this->assertEquals(100, $totalWeight);
    }
}
