<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_similarity_cache', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id_a')->constrained('users')->cascadeOnDelete();
            $table->foreignId('user_id_b')->constrained('users')->cascadeOnDelete();
            $table->decimal('similarity_score', 8, 6)->default(0);
            $table->timestamp('computed_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id_a', 'user_id_b']);
            $table->index('user_id_a');
            $table->index(['user_id_a', 'similarity_score']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_similarity_cache');
    }
};
