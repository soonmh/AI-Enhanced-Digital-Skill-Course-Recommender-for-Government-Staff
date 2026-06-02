<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JobRoleProfile extends Model
{
    protected $fillable = [
        'role_name',
        'role_name_ms',
        'department',
        'c1_target', 'c2_target', 'c3_target', 'c4_target', 'c5_target',
        'c6_target', 'c7_target', 'c8_target', 'c9_target', 'c10_target',
    ];

    protected $casts = [
        'c1_target' => 'float', 'c2_target' => 'float', 'c3_target' => 'float',
        'c4_target' => 'float', 'c5_target' => 'float', 'c6_target' => 'float',
        'c7_target' => 'float', 'c8_target' => 'float', 'c9_target' => 'float',
        'c10_target' => 'float',
    ];

    public function getTargets(): array
    {
        return [
            'C1' => $this->c1_target, 'C2' => $this->c2_target,
            'C3' => $this->c3_target, 'C4' => $this->c4_target,
            'C5' => $this->c5_target, 'C6' => $this->c6_target,
            'C7' => $this->c7_target, 'C8' => $this->c8_target,
            'C9' => $this->c9_target, 'C10' => $this->c10_target,
        ];
    }
}
