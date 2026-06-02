<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('certificates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('assessment_response_id')->constrained()->cascadeOnDelete();
            $table->string('verification_code', 36)->unique();
            $table->string('type')->default('dsri_assessment');
            $table->float('dsri_score');
            $table->unsignedTinyInteger('maturity_level');
            $table->string('maturity_code', 20);
            $table->string('maturity_label_en', 30);
            $table->string('maturity_label_ms', 30);
            $table->json('competency_scores');
            $table->timestamp('issued_at');
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('certificates');
    }
};
