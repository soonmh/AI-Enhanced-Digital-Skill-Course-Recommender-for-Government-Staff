<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', 'unique:users,email,' . $this->user()->id],
            'working_field' => ['nullable', 'string', 'max:255'],
            'job_level' => ['nullable', 'string', 'max:255'],
            'experience_years' => ['nullable', 'string', 'max:255'],
        ];
    }
}
