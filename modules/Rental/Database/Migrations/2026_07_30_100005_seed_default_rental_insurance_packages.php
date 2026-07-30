<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('rental_insurance_packages')) {
            return;
        }

        $now = now();
        $rows = [
            [
                'code' => 'cdw',
                'name' => 'CDW — Collision Damage Waiver',
                'period_type' => 'daily',
                'amount' => 75000,
                'deductible_amount' => 500000,
                'coverage_limit' => 50000000,
                'description' => 'Mengurangi tanggung jawab kerusakan body kendaraan. Excess/deductible berlaku.',
                'is_active' => true,
                'sort_order' => 1,
            ],
            [
                'code' => 'tpl',
                'name' => 'TPL — Third Party Liability',
                'period_type' => 'daily',
                'amount' => 50000,
                'deductible_amount' => 0,
                'coverage_limit' => 100000000,
                'description' => 'Perlindungan tanggung jawab pihak ketiga.',
                'is_active' => true,
                'sort_order' => 2,
            ],
            [
                'code' => 'full',
                'name' => 'Full Cover (CDW + TPL)',
                'period_type' => 'daily',
                'amount' => 110000,
                'deductible_amount' => 250000,
                'coverage_limit' => 100000000,
                'description' => 'Paket gabungan CDW + TPL dengan excess lebih rendah.',
                'is_active' => true,
                'sort_order' => 3,
            ],
        ];

        foreach ($rows as $row) {
            $exists = DB::table('rental_insurance_packages')->where('code', $row['code'])->exists();
            if ($exists) {
                continue;
            }

            DB::table('rental_insurance_packages')->insert([
                ...$row,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('rental_insurance_packages')) {
            return;
        }

        DB::table('rental_insurance_packages')->whereIn('code', ['cdw', 'tpl', 'full'])->delete();
    }
};
