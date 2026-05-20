<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recommendation_interactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->string('interaction_type'); // impression, click, enroll, complete
            $table->string('source')->default('recommended');
            $table->string('ab_group')->nullable(); // control or hybrid
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'interaction_type']);
            $table->index(['course_id', 'interaction_type']);
            $table->index('ab_group');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recommendation_interactions');
    }
};
