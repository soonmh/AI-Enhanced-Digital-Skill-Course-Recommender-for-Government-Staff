<?php

namespace App\Http\Requests;

use App\Models\User;
use Closure;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'bail', 'required', 'email',
                // Say so plainly instead of "already taken": an admin can reactivate the account with its history
                function (string $attribute, mixed $value, Closure $fail) {
                    if (User::where('email', $value)->where('is_active', false)->exists()) {
                        $fail('This account has been deactivated. Please ask an administrator to reactivate it.');
                    }
                },
                'unique:users,email',
            ],
            'password' => ['required', 'confirmed', Password::defaults()],
            'working_field' => ['nullable', 'string', 'max:255'],
            'job_level' => ['nullable', 'string', 'max:255'],
            'experience_years' => ['nullable', 'string', 'max:255'],
        ];
    }
}
