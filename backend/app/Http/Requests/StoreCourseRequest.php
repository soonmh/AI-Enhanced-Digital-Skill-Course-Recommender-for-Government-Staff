<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCourseRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'url' => ['nullable', 'url', 'max:500'],
            'level' => ['required', 'in:beginner,intermediate,advanced'],
            'working_field' => ['nullable', 'string', 'max:255'],
            'title_bm' => ['nullable', 'string', 'max:255'],
            'description_bm' => ['nullable', 'string'],
            'competency_codes' => ['nullable', 'array'],
            'competency_codes.*' => ['string', 'in:C1,C2,C3,C4,C5,C6,C7,C8,C9,C10'],
        ];
    }
}
