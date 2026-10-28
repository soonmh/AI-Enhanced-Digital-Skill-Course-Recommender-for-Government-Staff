<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SubmitAssessmentRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'assessment_id' => ['required', 'exists:assessments,id'],
            // 1–5 rating per question id (e.g. "C1_Q1" => 4); section scores are computed server-side
            'answers' => ['required', 'array'],
            'answers.*' => ['required', 'integer', 'between:1,5'],
        ];
    }
}
