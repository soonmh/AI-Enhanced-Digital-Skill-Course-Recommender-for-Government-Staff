<?php

namespace Database\Seeders;

use App\Models\JobRoleProfile;
use Illuminate\Database\Seeder;

class JobRoleProfileSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            [
                'role_name' => 'Administrative Officer',
                'role_name_ms' => 'Pegawai Pentadbiran',
                'department' => 'Administration',
                // Admin: heavy on literacy, safety, ethics; lighter on technical
                'c1_target' => 75, 'c2_target' => 55, 'c3_target' => 70,
                'c4_target' => 55, 'c5_target' => 70, 'c6_target' => 65,
                'c7_target' => 60, 'c8_target' => 35, 'c9_target' => 70,
                'c10_target' => 70,
            ],
            [
                'role_name' => 'IT Officer',
                'role_name_ms' => 'Pegawai IT',
                'department' => 'Information Technology',
                // IT: high on all technical, safety, innovation
                'c1_target' => 80, 'c2_target' => 90, 'c3_target' => 70,
                'c4_target' => 85, 'c5_target' => 85, 'c6_target' => 70,
                'c7_target' => 75, 'c8_target' => 80, 'c9_target' => 70,
                'c10_target' => 80,
            ],
            [
                'role_name' => 'Human Resource Officer',
                'role_name_ms' => 'Pegawai Sumber Manusia',
                'department' => 'Human Resources',
                // HR: communication, ethics, professional dev heavy
                'c1_target' => 70, 'c2_target' => 55, 'c3_target' => 85,
                'c4_target' => 60, 'c5_target' => 65, 'c6_target' => 80,
                'c7_target' => 55, 'c8_target' => 35, 'c9_target' => 80,
                'c10_target' => 65,
            ],
            [
                'role_name' => 'Finance Officer',
                'role_name_ms' => 'Pegawai Kewangan',
                'department' => 'Finance',
                // Finance: data literacy, safety, functional skills
                'c1_target' => 70, 'c2_target' => 70, 'c3_target' => 65,
                'c4_target' => 70, 'c5_target' => 80, 'c6_target' => 60,
                'c7_target' => 60, 'c8_target' => 40, 'c9_target' => 75,
                'c10_target' => 80,
            ],
            [
                'role_name' => 'Trainer / Instructor',
                'role_name_ms' => 'Penganjur / Jurulatih',
                'department' => 'Education',
                // Trainer: communication, professional dev, creation
                'c1_target' => 75, 'c2_target' => 65, 'c3_target' => 85,
                'c4_target' => 70, 'c5_target' => 60, 'c6_target' => 85,
                'c7_target' => 55, 'c8_target' => 65, 'c9_target' => 70,
                'c10_target' => 70,
            ],
            [
                'role_name' => 'Manager / Director',
                'role_name_ms' => 'Pengurus / Pengarah',
                'department' => null,
                // Manager: balanced high across all, especially governance
                'c1_target' => 80, 'c2_target' => 70, 'c3_target' => 80,
                'c4_target' => 75, 'c5_target' => 75, 'c6_target' => 85,
                'c7_target' => 80, 'c8_target' => 50, 'c9_target' => 80,
                'c10_target' => 75,
            ],
            [
                'role_name' => 'Clerk / Assistant',
                'role_name_ms' => 'Kerani / Pembantu',
                'department' => null,
                // Clerk: basic functional skills, literacy, safety
                'c1_target' => 60, 'c2_target' => 45, 'c3_target' => 55,
                'c4_target' => 40, 'c5_target' => 55, 'c6_target' => 45,
                'c7_target' => 40, 'c8_target' => 25, 'c9_target' => 55,
                'c10_target' => 60,
            ],
            [
                'role_name' => 'Executive / Specialist',
                'role_name_ms' => 'Eksekutif / Pakar',
                'department' => null,
                // Executive: high across the board
                'c1_target' => 85, 'c2_target' => 80, 'c3_target' => 75,
                'c4_target' => 80, 'c5_target' => 80, 'c6_target' => 80,
                'c7_target' => 75, 'c8_target' => 60, 'c9_target' => 75,
                'c10_target' => 80,
            ],
        ];

        foreach ($roles as $role) {
            JobRoleProfile::create($role);
        }
    }
}
