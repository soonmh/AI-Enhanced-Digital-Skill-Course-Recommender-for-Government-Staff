<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoUserSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            ['name' => 'Admin User 01', 'email' => 'admin01@test.com', 'role' => 'Admin'],
            ['name' => 'Staff User 01', 'email' => 'staff01@test.com', 'role' => 'Staff',
             'working_field' => 'Information Technology', 'job_level' => 'Intern', 'experience_years' => '2-5 years'],
            ['name' => 'Management User 01', 'email' => 'mgmt01@test.com', 'role' => 'Top Management'],
            ['name' => 'Trainer User 01', 'email' => 'trainer01@test.com', 'role' => 'Trainer'],
            ['name' => 'Ahmad bin Hassan', 'email' => 'ahmad@test.com', 'role' => 'Staff',
             'working_field' => 'Finance', 'job_level' => 'Executive', 'experience_years' => '5-10 years'],
            ['name' => 'Siti binti Omar', 'email' => 'siti@test.com', 'role' => 'Staff',
             'working_field' => 'Human Resources', 'job_level' => 'Senior Executive', 'experience_years' => '5-10 years'],
            ['name' => 'Raj a/l Kumar', 'email' => 'raj@test.com', 'role' => 'Staff',
             'working_field' => 'Information Technology', 'job_level' => 'Manager', 'experience_years' => '10+ years'],
            ['name' => 'Mei Ling Tan', 'email' => 'meiling@test.com', 'role' => 'Staff',
             'working_field' => 'Administration', 'job_level' => 'Clerk', 'experience_years' => '2-5 years'],
            ['name' => 'Farah binti Ismail', 'email' => 'farah@test.com', 'role' => 'Staff',
             'working_field' => 'Education', 'job_level' => 'Assistant Director', 'experience_years' => '10+ years'],
            ['name' => 'Wei Ming Lim', 'email' => 'weiming@test.com', 'role' => 'Staff',
             'working_field' => 'Finance', 'job_level' => 'Deputy Director', 'experience_years' => '10+ years'],
        ];

        foreach ($users as $data) {
            $roleName = $data['role'];
            unset($data['role']);

            $user = User::firstOrCreate(
                ['email' => $data['email']],
                array_merge($data, ['password' => Hash::make('pass123')])
            );

            $role = Role::where('name', $roleName)->first();
            if ($role && !$user->roles()->where('role_id', $role->id)->exists()) {
                $user->roles()->attach($role->id, ['model_type' => User::class]);
            }
        }
    }
}
