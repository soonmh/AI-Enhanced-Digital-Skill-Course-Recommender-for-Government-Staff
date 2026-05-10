<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name', 'email', 'password',
        'working_field', 'job_level', 'experience_years', 'locale', 'is_active',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function roles()
    {
        return $this->morphToMany(Role::class, 'model', 'model_has_roles', 'model_id', 'role_id');
    }

    public function permissions()
    {
        return $this->roles->flatMap->permissions->pluck('name')->unique();
    }

    public function hasPermission(string $permission): bool
    {
        return $this->permissions()->contains($permission);
    }

    public function hasRole(string $role): bool
    {
        return $this->roles->pluck('name')->contains($role);
    }

    public function assessmentResponses()
    {
        return $this->hasMany(AssessmentResponse::class);
    }

    public function latestAssessmentResponse()
    {
        return $this->hasOne(AssessmentResponse::class)->latestOfMany();
    }

    public function userCourses()
    {
        return $this->hasMany(UserCourse::class);
    }

    public function assessmentDrafts()
    {
        return $this->hasMany(AssessmentDraft::class);
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }

    public function unreadNotifications()
    {
        return $this->hasMany(Notification::class)->whereNull('read_at');
    }
}
