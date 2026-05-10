<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AssessmentResponseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'assessment_id' => $this->assessment_id,
            'submitted_at' => $this->submitted_at,
            'c1_score' => $this->c1_score,
            'c2_score' => $this->c2_score,
            'c3_score' => $this->c3_score,
            'c4_score' => $this->c4_score,
            'c5_score' => $this->c5_score,
            'c6_score' => $this->c6_score,
            'c7_score' => $this->c7_score,
            'c8_score' => $this->c8_score,
            'c9_score' => $this->c9_score,
            'c10_score' => $this->c10_score,
            'dsri' => $this->dsri,
        ];
    }
}
