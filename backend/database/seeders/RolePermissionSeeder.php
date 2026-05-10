<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        $roles = ['Admin', 'Staff', 'Top Management', 'Trainer'];
        foreach ($roles as $name) {
            Role::firstOrCreate(['name' => $name, 'guard_name' => 'web']);
        }

        $permissions = [
            'user-management',
            'course-management',
            'take-assessment',
            'user-reporting',
            'course-reporting',
        ];
        foreach ($permissions as $name) {
            Permission::firstOrCreate(['name' => $name, 'guard_name' => 'web']);
        }

        $rolePermissions = [
            'Admin' => $permissions,
            'Staff' => ['take-assessment'],
            'Top Management' => ['user-reporting', 'course-reporting'],
            'Trainer' => ['course-management', 'take-assessment', 'course-reporting'],
        ];

        foreach ($rolePermissions as $roleName => $permNames) {
            $role = Role::where('name', $roleName)->first();
            $permIds = Permission::whereIn('name', $permNames)->pluck('id');
            $role->permissions()->sync($permIds);
        }
    }
}
