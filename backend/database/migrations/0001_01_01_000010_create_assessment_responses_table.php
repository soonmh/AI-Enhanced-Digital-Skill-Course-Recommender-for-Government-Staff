<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assessment_responses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('assessment_id')->constrained()->cascadeOnDelete();
            $table->timestamp('submitted_at')->nullable();
            $table->decimal('c1_score', 6, 2)->default(0);
            $table->decimal('c2_score', 6, 2)->default(0);
            $table->decimal('c3_score', 6, 2)->default(0);
            $table->decimal('c4_score', 6, 2)->default(0);
            $table->decimal('c5_score', 6, 2)->default(0);
            $table->decimal('c6_score', 6, 2)->default(0);
            $table->decimal('c7_score', 6, 2)->default(0);
            $table->decimal('c8_score', 6, 2)->default(0);
            $table->decimal('c9_score', 6, 2)->default(0);
            $table->decimal('c10_score', 6, 2)->default(0);
            $table->decimal('dsri', 6, 2)->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assessment_responses');
    }
};
