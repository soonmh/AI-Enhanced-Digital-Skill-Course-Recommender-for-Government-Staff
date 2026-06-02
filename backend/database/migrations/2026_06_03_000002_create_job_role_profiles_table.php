<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('job_role_profiles', function (Blueprint $table) {
            $table->id();
            $table->string('role_name');
            $table->string('role_name_ms');
            $table->string('department')->nullable();
            $table->float('c1_target')->default(0);
            $table->float('c2_target')->default(0);
            $table->float('c3_target')->default(0);
            $table->float('c4_target')->default(0);
            $table->float('c5_target')->default(0);
            $table->float('c6_target')->default(0);
            $table->float('c7_target')->default(0);
            $table->float('c8_target')->default(0);
            $table->float('c9_target')->default(0);
            $table->float('c10_target')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('job_role_profiles');
    }
};
