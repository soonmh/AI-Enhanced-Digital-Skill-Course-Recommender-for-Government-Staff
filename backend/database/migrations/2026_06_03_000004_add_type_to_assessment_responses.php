<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('assessment_responses', function (Blueprint $table) {
            $table->string('assessment_type', 10)->default('full')->after('assessment_id');
            $table->string('section_code', 3)->nullable()->after('assessment_type');
        });
    }

    public function down(): void
    {
        Schema::table('assessment_responses', function (Blueprint $table) {
            $table->dropColumn(['assessment_type', 'section_code']);
        });
    }
};
