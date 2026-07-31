<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('user_courses', function (Blueprint $table) {
            $table->string('completion_proof_path')->nullable()->after('status');
            $table->string('completion_endorsement_status')->nullable()->after('completion_proof_path');
            $table->foreignId('completion_endorsed_by')->nullable()->after('completion_endorsement_status')->constrained('users')->nullOnDelete();
            $table->timestamp('completion_endorsed_at')->nullable()->after('completion_endorsed_by');
            $table->text('completion_endorsement_note')->nullable()->after('completion_endorsed_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user_courses', function (Blueprint $table) {
            $table->dropForeign(['completion_endorsed_by']);
            $table->dropColumn([
                'completion_proof_path',
                'completion_endorsement_status',
                'completion_endorsed_by',
                'completion_endorsed_at',
                'completion_endorsement_note',
            ]);
        });
    }
};
