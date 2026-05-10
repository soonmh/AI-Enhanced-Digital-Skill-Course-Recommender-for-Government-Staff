<?php

namespace Database\Factories;

use App\Models\Course;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class CourseFactory extends Factory
{
    protected $model = Course::class;

    public function definition(): array
    {
        return [
            'title' => fake()->sentence(3),
            'description' => fake()->paragraph(),
            'level' => fake()->randomElement(['beginner', 'intermediate', 'advanced']),
            'working_field' => fake()->randomElement(['ICT', 'Finance', 'Administration', 'HR']),
            'url' => fake()->url(),
            'created_by' => User::factory(),
        ];
    }
}
