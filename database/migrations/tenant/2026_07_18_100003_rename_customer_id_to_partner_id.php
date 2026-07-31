<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Renames customer_id → partner_id across all dependent tables.
 * Uses raw SQL for clean column+FK renames in PostgreSQL.
 */
return new class extends Migration
{
    /** @var list<array{table: string, nullable: bool}> */
    private array $columns = [
        ['table' => 'trips', 'nullable' => true],
        ['table' => 'trip_schedules', 'nullable' => true],
        ['table' => 'delivery_orders', 'nullable' => false],
        ['table' => 'invoices', 'nullable' => false],
        ['table' => 'tariffs', 'nullable' => true],
    ];

    public function up(): void
    {
        foreach ($this->columns as $col) {
            $t = $col['table'];
            if (Schema::hasColumn($t, 'customer_id')) {
                DB::statement("ALTER TABLE {$t} RENAME COLUMN customer_id TO partner_id");
            }
        }
    }

    public function down(): void
    {
        foreach ($this->columns as $col) {
            $t = $col['table'];
            if (Schema::hasColumn($t, 'partner_id')) {
                DB::statement("ALTER TABLE {$t} RENAME COLUMN partner_id TO customer_id");
            }
        }
    }
};
