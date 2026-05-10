<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('model_has_roles', function (Blueprint $table) {
            $table->string('model_type');
            $table->unsignedBigInteger('model_id');
            $table->foreignId('role_id')->constrained('roles')->cascadeOnDelete();
            $table->primary(['model_type', 'model_id', 'role_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('model_has_roles');
    }
};
