<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;
use Modules\Accounting\Models\FiscalYear;
use Modules\Accounting\Support\OpeningBalanceService;

/**
 * Backfill greenfield opening journals (Kas/Modal at Rp 0) for fiscal years
 * that were seeded before zero-default opening existed.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('fiscal_years') || ! Schema::hasTable('journal_entries')) {
            return;
        }

        $openings = app(OpeningBalanceService::class);

        FiscalYear::query()
            ->orderBy('year')
            ->each(function (FiscalYear $year) use ($openings): void {
                $openings->ensureZeroDefault($year);
            });
    }

    public function down(): void
    {
        // Intentionally empty — posted opening journals are financial history.
    }
};
