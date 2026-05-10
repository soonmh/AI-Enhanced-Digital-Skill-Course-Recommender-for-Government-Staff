<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::defaults()],
            'working_field' => ['nullable', 'string', 'max:255'],
            'job_level' => ['nullable', 'string', 'max:255'],
            'experience_years' => ['nullable', 'string', 'max:255'],
        ];
    }
}
