<?php

namespace Modules\Expenses\Support;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Modules\Accounting\Models\Account;

class ExpenseSchemaInitializer
{
    public static function ensureReady(): void
    {
        self::ensureTables();
        self::ensureSeeded();
    }

    public static function ensureTables(): void
    {
        if (! Schema::hasTable('expense_categories')) {
            Schema::create('expense_categories', function (Blueprint $table): void {
                $table->id();
                $table->string('code', 32)->unique();
                $table->string('name', 150);
                $table->unsignedBigInteger('account_id')->nullable()->index();
                $table->boolean('is_active')->default(true);
                $table->text('description')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('cash_advances')) {
            Schema::create('cash_advances', function (Blueprint $table): void {
                $table->id();
                $table->string('code', 40)->unique();
                $table->date('advance_date')->index();
                $table->string('purpose', 255);
                $table->string('recipient_name', 150)->nullable();
                $table->unsignedBigInteger('user_id')->nullable()->index();
                $table->unsignedBigInteger('driver_id')->nullable()->index();
                $table->unsignedBigInteger('partner_id')->nullable()->index();
                $table->unsignedBigInteger('vehicle_id')->nullable()->index();
                $table->unsignedBigInteger('company_bank_account_id')->nullable()->index();
                $table->unsignedBigInteger('advance_account_id')->nullable()->index();
                $table->string('payment_method', 32)->default('cash');
                $table->decimal('amount', 15, 2)->default(0);
                $table->decimal('spent_amount', 15, 2)->default(0);
                $table->decimal('returned_amount', 15, 2)->default(0);
                $table->decimal('reimbursed_amount', 15, 2)->default(0);
                $table->string('status', 24)->default('draft')->index();
                $table->string('reference_number', 100)->nullable();
                $table->text('notes')->nullable();
                $table->nullableMorphs('source');
                $table->timestamp('disbursed_at')->nullable();
                $table->unsignedBigInteger('disbursed_by')->nullable();
                $table->timestamp('settled_at')->nullable();
                $table->unsignedBigInteger('settled_by')->nullable();
                $table->timestamp('voided_at')->nullable();
                $table->unsignedBigInteger('created_by')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('expense_claims')) {
            Schema::create('expense_claims', function (Blueprint $table): void {
                $table->id();
                $table->string('code', 40)->unique();
                $table->date('expense_date')->index();
                $table->string('type', 32)->default('direct_expense')->index();
                $table->string('title', 255);
                $table->unsignedBigInteger('cash_advance_id')->nullable()->index();
                $table->unsignedBigInteger('company_bank_account_id')->nullable()->index();
                $table->unsignedBigInteger('partner_id')->nullable()->index();
                $table->unsignedBigInteger('vehicle_id')->nullable()->index();
                $table->unsignedBigInteger('driver_id')->nullable()->index();
                $table->string('payment_method', 32)->default('cash');
                $table->decimal('total_amount', 15, 2)->default(0);
                $table->string('status', 24)->default('draft')->index();
                $table->string('reference_number', 100)->nullable();
                $table->text('notes')->nullable();
                $table->nullableMorphs('source');
                $table->timestamp('posted_at')->nullable();
                $table->unsignedBigInteger('posted_by')->nullable();
                $table->timestamp('voided_at')->nullable();
                $table->unsignedBigInteger('created_by')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('expense_claim_lines')) {
            Schema::create('expense_claim_lines', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('expense_claim_id')->constrained('expense_claims')->cascadeOnDelete();
                $table->unsignedBigInteger('expense_category_id')->nullable()->index();
                $table->unsignedBigInteger('account_id')->index();
                $table->unsignedBigInteger('vehicle_id')->nullable()->index();
                $table->string('description', 255);
                $table->decimal('amount', 15, 2)->default(0);
                $table->string('receipt_number', 100)->nullable();
                $table->unsignedSmallInteger('sort_order')->default(0);
                $table->timestamps();
            });
        }
    }

    public static function ensureSeeded(): void
    {
        if (! Schema::hasTable('accounts') || ! Schema::hasTable('expense_categories')) {
            return;
        }

        $now = now();

        $accounts = [
            [
                'code' => '1150',
                'name' => 'Uang Muka Kerja & Kasbon',
                'type' => Account::TYPE_ASSET,
                'normal_balance' => Account::NORMAL_DEBIT,
                'system_role' => 'cash_advance',
            ],
            [
                'code' => '6110',
                'name' => 'Beban BBM & Bahan Bakar',
                'type' => Account::TYPE_EXPENSE,
                'normal_balance' => Account::NORMAL_DEBIT,
                'system_role' => 'expense_fuel',
            ],
            [
                'code' => '6120',
                'name' => 'Beban Tol, Parkir & Retribusi',
                'type' => Account::TYPE_EXPENSE,
                'normal_balance' => Account::NORMAL_DEBIT,
                'system_role' => 'expense_toll_parking',
            ],
            [
                'code' => '6130',
                'name' => 'Beban Servis & Perawatan Armada',
                'type' => Account::TYPE_EXPENSE,
                'normal_balance' => Account::NORMAL_DEBIT,
                'system_role' => 'expense_maintenance',
            ],
            [
                'code' => '6140',
                'name' => 'Beban Pajak & Dokumen Kendaraan',
                'type' => Account::TYPE_EXPENSE,
                'normal_balance' => Account::NORMAL_DEBIT,
                'system_role' => 'expense_vehicle_doc',
            ],
            [
                'code' => '6150',
                'name' => 'Beban Uang Makan & Perjalanan Dinas',
                'type' => Account::TYPE_EXPENSE,
                'normal_balance' => Account::NORMAL_DEBIT,
                'system_role' => 'expense_meal_travel',
            ],
        ];

        foreach ($accounts as $account) {
            DB::table('accounts')->insertOrIgnore([
                'code' => $account['code'],
                'name' => $account['name'],
                'type' => $account['type'],
                'parent_id' => null,
                'is_postable' => true,
                'is_active' => true,
                'normal_balance' => $account['normal_balance'],
                'currency' => 'IDR',
                'system_role' => $account['system_role'],
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        $fallbackOpexId = DB::table('accounts')->where('system_role', 'opex')->value('id')
            ?? DB::table('accounts')->where('code', '6100')->value('id');

        $categories = [
            [
                'code' => 'FUEL',
                'name' => 'BBM & Bahan Bakar Armada',
                'account_code' => '6110',
                'description' => 'Pengeluaran solar, bensin, dan pengisian BBM unit kendaraan.',
            ],
            [
                'code' => 'TOLL_PARKING',
                'name' => 'Tol, Parkir & Retribusi Jalan',
                'account_code' => '6120',
                'description' => 'Biaya e-Toll, parkir bandara/stasiun, penyeberangan kapal, dan retribusi.',
            ],
            [
                'code' => 'MAINTENANCE',
                'name' => 'Servis, Suku Cadang & Cuci Mobil',
                'account_code' => '6130',
                'description' => 'Perbaikan ringan, ganti oli, ban, aki, dan cuci unit armada.',
            ],
            [
                'code' => 'VEHICLE_DOC',
                'name' => 'Pajak STNK, KIR & Perizinan Unit',
                'account_code' => '6140',
                'description' => 'Perpanjangan STNK tahunan, ganti plat 5 tahunan, uji KIR, dan asuransi.',
            ],
            [
                'code' => 'MEAL_TRAVEL',
                'name' => 'Uang Makan, Menginap & Perjalanan Dinas',
                'account_code' => '6150',
                'description' => 'Akomodasi pengemudi luar kota, uang makan kru, dan insentif perjalanan.',
            ],
            [
                'code' => 'OFFICE_OPEX',
                'name' => 'Operasional Kantor & Petty Cash',
                'account_code' => '6100',
                'description' => 'ATK, listrik, internet, konsumsi garasi/kantor, dan pengeluaran kas kecil.',
            ],
        ];

        foreach ($categories as $category) {
            $accountId = DB::table('accounts')->where('code', $category['account_code'])->value('id') ?? $fallbackOpexId;

            DB::table('expense_categories')->insertOrIgnore([
                'code' => $category['code'],
                'name' => $category['name'],
                'account_id' => $accountId,
                'is_active' => true,
                'description' => $category['description'],
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }
}
