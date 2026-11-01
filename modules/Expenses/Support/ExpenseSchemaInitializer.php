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

        if (! Schema::hasTable('driver_payrolls')) {
            Schema::create('driver_payrolls', function (Blueprint $table): void {
                $table->id();
                $table->string('code', 40)->unique();
                $table->unsignedBigInteger('driver_id')->index();
                $table->date('period_start')->index();
                $table->date('period_end')->index();
                $table->string('status', 24)->default('draft')->index();
                $table->decimal('base_salary', 15, 2)->default(0);
                $table->decimal('daily_allowance_total', 15, 2)->default(0);
                $table->decimal('overtime_pay_total', 15, 2)->default(0);
                $table->decimal('trip_commission_total', 15, 2)->default(0);
                $table->decimal('bonus_total', 15, 2)->default(0);
                $table->decimal('deductions_total', 15, 2)->default(0);
                $table->decimal('net_pay', 15, 2)->default(0);
                $table->unsignedBigInteger('company_bank_account_id')->nullable()->index();
                $table->string('payment_method', 32)->default('bank_transfer');
                $table->string('payment_reference', 100)->nullable();
                $table->timestamp('paid_at')->nullable();
                $table->unsignedBigInteger('paid_by')->nullable();
                $table->timestamp('approved_at')->nullable();
                $table->unsignedBigInteger('approved_by')->nullable();
                $table->unsignedBigInteger('created_by')->nullable();
                $table->text('notes')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('driver_payroll_lines')) {
            Schema::create('driver_payroll_lines', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('driver_payroll_id')->constrained('driver_payrolls')->cascadeOnDelete();
                $table->string('type', 32)->index();
                $table->string('title', 255);
                $table->decimal('amount', 15, 2)->default(0);
                $table->nullableMorphs('source');
                $table->text('notes')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('collection_dunnings')) {
            Schema::create('collection_dunnings', function (Blueprint $table): void {
                $table->id();
                $table->unsignedBigInteger('invoice_id')->index();
                $table->unsignedBigInteger('partner_id')->index();
                $table->string('stage', 32)->index();
                $table->string('channel', 24)->default('whatsapp');
                $table->string('recipient', 150);
                $table->string('status', 24)->default('sent');
                $table->text('message_body');
                $table->timestamp('sent_at')->nullable();
                $table->unsignedBigInteger('sent_by')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('collection_promises')) {
            Schema::create('collection_promises', function (Blueprint $table): void {
                $table->id();
                $table->unsignedBigInteger('invoice_id')->index();
                $table->unsignedBigInteger('partner_id')->index();
                $table->decimal('promised_amount', 15, 2)->default(0);
                $table->date('promised_date')->index();
                $table->string('status', 24)->default('pending')->index();
                $table->text('notes')->nullable();
                $table->unsignedBigInteger('recorded_by')->nullable();
                $table->timestamp('fulfilled_at')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('post_dated_checks')) {
            Schema::create('post_dated_checks', function (Blueprint $table): void {
                $table->id();
                $table->string('check_number', 64)->unique();
                $table->string('bank_name', 100);
                $table->unsignedBigInteger('partner_id')->index();
                $table->unsignedBigInteger('invoice_id')->nullable()->index();
                $table->decimal('amount', 15, 2)->default(0);
                $table->date('issue_date')->nullable();
                $table->date('due_date')->index();
                $table->string('status', 24)->default('received')->index();
                $table->unsignedBigInteger('company_bank_account_id')->nullable()->index();
                $table->timestamp('cleared_at')->nullable();
                $table->text('bounced_reason')->nullable();
                $table->text('notes')->nullable();
                $table->unsignedBigInteger('received_by')->nullable();
                $table->timestamps();
            });
        }

        if (Schema::hasTable('invoices') && ! Schema::hasColumn('invoices', 'revenue_role')) {
            Schema::table('invoices', function (Blueprint $table): void {
                $table->string('revenue_role', 64)->nullable()->after('source_id');
            });
        }

        if (Schema::hasTable('invoice_lines') && ! Schema::hasColumn('invoice_lines', 'revenue_role')) {
            Schema::table('invoice_lines', function (Blueprint $table): void {
                $table->string('revenue_role', 64)->nullable()->after('source_id');
            });
        }

        if (Schema::hasTable('gateway_charges') && ! Schema::hasColumn('gateway_charges', 'chargeable_type')) {
            Schema::table('gateway_charges', function (Blueprint $table): void {
                $table->nullableMorphs('chargeable');
            });
        }

        if (Schema::hasTable('journal_lines')) {
            Schema::table('journal_lines', function (Blueprint $table): void {
                if (! Schema::hasColumn('journal_lines', 'vehicle_id')) {
                    $table->unsignedBigInteger('vehicle_id')->nullable()->index();
                }
                if (! Schema::hasColumn('journal_lines', 'fleet_base_id')) {
                    $table->unsignedBigInteger('fleet_base_id')->nullable()->index();
                }
                if (! Schema::hasColumn('journal_lines', 'cost_center_id')) {
                    $table->string('cost_center_id', 64)->nullable()->index();
                }
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
                'code' => '1110',
                'name' => 'Kas Kecil & Kas Operasional',
                'type' => Account::TYPE_ASSET,
                'normal_balance' => Account::NORMAL_DEBIT,
                'system_role' => 'cash',
            ],
            [
                'code' => '1120',
                'name' => 'Bank Utama',
                'type' => Account::TYPE_ASSET,
                'normal_balance' => Account::NORMAL_DEBIT,
                'system_role' => 'bank_primary',
            ],
            [
                'code' => '1130',
                'name' => 'Piutang Usaha',
                'type' => Account::TYPE_ASSET,
                'normal_balance' => Account::NORMAL_DEBIT,
                'system_role' => 'ar',
            ],
            [
                'code' => '2110',
                'name' => 'Utang Usaha (Supplier)',
                'type' => Account::TYPE_LIABILITY,
                'normal_balance' => Account::NORMAL_CREDIT,
                'system_role' => 'ap',
            ],
            [
                'code' => '4100',
                'name' => 'Pendapatan Jasa Umum',
                'type' => Account::TYPE_REVENUE,
                'normal_balance' => Account::NORMAL_CREDIT,
                'system_role' => 'revenue_default',
            ],
            [
                'code' => '4110',
                'name' => 'Pendapatan Sewa Kendaraan',
                'type' => Account::TYPE_REVENUE,
                'normal_balance' => Account::NORMAL_CREDIT,
                'system_role' => 'rental_revenue',
            ],
            [
                'code' => '4120',
                'name' => 'Pendapatan Tiket Shuttle & Travel',
                'type' => Account::TYPE_REVENUE,
                'normal_balance' => Account::NORMAL_CREDIT,
                'system_role' => 'shuttle_revenue',
            ],
            [
                'code' => '6100',
                'name' => 'Beban Operasional Umum',
                'type' => Account::TYPE_EXPENSE,
                'normal_balance' => Account::NORMAL_DEBIT,
                'system_role' => 'opex',
            ],
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
            [
                'code' => '6160',
                'name' => 'Beban Gaji & Komisi Supir',
                'type' => Account::TYPE_EXPENSE,
                'normal_balance' => Account::NORMAL_DEBIT,
                'system_role' => 'payroll_driver',
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
