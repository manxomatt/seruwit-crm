<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('rentals')) {
            return;
        }

        // Drop PostgreSQL enum check so new HQ-style statuses can be stored.
        if (Schema::getConnection()->getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE rentals DROP CONSTRAINT IF EXISTS rentals_status_check');
        }

        Schema::table('rentals', function (Blueprint $table): void {
            $table->string('status', 32)->default('draft')->change();

            if (! Schema::hasColumn('rentals', 'reserved_until')) {
                $table->timestamp('reserved_until')->nullable()->after('confirmed_at');
            }

            if (! Schema::hasColumn('rentals', 'cancelled_at')) {
                $table->timestamp('cancelled_at')->nullable()->after('cancelled_reason');
            }

            if (! Schema::hasColumn('rentals', 'no_show_at')) {
                $table->timestamp('no_show_at')->nullable()->after('cancelled_at');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('rentals')) {
            return;
        }

        Schema::table('rentals', function (Blueprint $table): void {
            if (Schema::hasColumn('rentals', 'no_show_at')) {
                $table->dropColumn('no_show_at');
            }

            if (Schema::hasColumn('rentals', 'cancelled_at')) {
                $table->dropColumn('cancelled_at');
            }

            if (Schema::hasColumn('rentals', 'reserved_until')) {
                $table->dropColumn('reserved_until');
            }
        });
    }
};
