<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('assessment_responses', function (Blueprint $table) {
            $table->string('endorsement_status')->default('pending')->after('dsri');
            $table->foreignId('endorsed_by')->nullable()->after('endorsement_status')->constrained('users')->nullOnDelete();
            $table->timestamp('endorsed_at')->nullable()->after('endorsed_by');
            $table->text('endorsement_note')->nullable()->after('endorsed_at');
        });

        // Existing rows predate this feature — treat them as already endorsed
        // so current demo data/dashboards keep working unchanged.
        DB::table('assessment_responses')->update([
            'endorsement_status' => 'endorsed',
            'endorsed_at' => DB::raw('submitted_at'),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('assessment_responses', function (Blueprint $table) {
            $table->dropForeign(['endorsed_by']);
            $table->dropColumn(['endorsement_status', 'endorsed_by', 'endorsed_at', 'endorsement_note']);
        });
    }
};
