<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'email_verified_at' => $this->email_verified_at,
            'working_field' => $this->working_field,
            'job_level' => $this->job_level,
            'experience_years' => $this->experience_years,
            'locale' => $this->locale,
            'roles' => $this->whenLoaded('roles', fn() => $this->roles->pluck('name')),
            'permissions' => $this->when($this->relationLoaded('roles'), fn() => $this->permissions()->values()),
            'has_direct_reports' => $this->directReports()->exists(),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
