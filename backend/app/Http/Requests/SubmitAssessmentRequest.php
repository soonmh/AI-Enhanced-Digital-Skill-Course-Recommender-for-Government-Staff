<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SubmitAssessmentRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'assessment_id' => ['required', 'exists:assessments,id'],
            'responses' => ['required', 'array'],
            'responses.*.section' => ['required', 'string', 'in:C1,C2,C3,C4,C5,C6,C7,C8,C9,C10'],
            'responses.*.score' => ['required', 'numeric', 'min:0'],
        ];
    }
}
