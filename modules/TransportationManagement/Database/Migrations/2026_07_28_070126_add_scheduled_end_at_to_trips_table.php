<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('trips', function (Blueprint $table): void {
            $table->dateTime('scheduled_end_at')->nullable()->after('scheduled_at')->index();
        });

        DB::table('trips')
            ->whereNull('scheduled_end_at')
            ->whereNotNull('scheduled_at')
            ->update([
                'scheduled_end_at' => DB::raw("scheduled_at + interval '8 hours'"),
            ]);
    }

    public function down(): void
    {
        Schema::table('trips', function (Blueprint $table): void {
            $table->dropColumn('scheduled_end_at');
        });
    }
};
