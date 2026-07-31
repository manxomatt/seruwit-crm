<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('accounts', function (Blueprint $table) {
            $table->id();
            $table->string('code', 32)->unique();
            $table->string('name');
            $table->string('type', 32)->index();
            $table->foreignId('parent_id')->nullable()->constrained('accounts')->nullOnDelete();
            $table->boolean('is_postable')->default(true);
            $table->boolean('is_active')->default(true);
            $table->string('normal_balance', 8);
            $table->string('currency', 3)->default('IDR');
            $table->string('system_role', 64)->nullable()->index();
            $table->timestamps();
        });

        Schema::create('fiscal_years', function (Blueprint $table) {
            $table->id();
            $table->unsignedSmallInteger('year')->unique();
            $table->date('starts_on');
            $table->date('ends_on');
            $table->boolean('is_closed')->default(false);
            $table->timestamps();
        });

        Schema::create('fiscal_periods', function (Blueprint $table) {
            $table->id();
            $table->foreignId('fiscal_year_id')->constrained('fiscal_years')->cascadeOnDelete();
            $table->unsignedTinyInteger('period_index');
            $table->string('name');
            $table->date('starts_on');
            $table->date('ends_on');
            $table->string('status', 16)->default('open')->index();
            $table->timestamps();

            $table->unique(['fiscal_year_id', 'period_index']);
        });

        Schema::create('journal_entries', function (Blueprint $table) {
            $table->id();
            $table->string('number')->unique();
            $table->foreignId('fiscal_period_id')->constrained('fiscal_periods');
            $table->date('entry_date')->index();
            $table->string('type', 16)->default('manual')->index();
            $table->string('status', 16)->default('draft')->index();
            $table->nullableMorphs('source');
            $table->string('event', 64)->nullable();
            $table->text('memo')->nullable();
            $table->timestamp('posted_at')->nullable();
            $table->foreignId('posted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('voided_at')->nullable();
            $table->timestamps();
        });

        Schema::create('journal_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('journal_entry_id')->constrained('journal_entries')->cascadeOnDelete();
            $table->foreignId('account_id')->constrained('accounts');
            $table->decimal('debit', 15, 2)->default(0);
            $table->decimal('credit', 15, 2)->default(0);
            $table->foreignId('partner_id')->nullable()->constrained('partners')->nullOnDelete();
            $table->unsignedBigInteger('warehouse_id')->nullable()->index();
            $table->string('memo')->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        $this->seedChartOfAccounts();
        $this->seedCurrentFiscalYear();
    }

    public function down(): void
    {
        Schema::dropIfExists('journal_lines');
        Schema::dropIfExists('journal_entries');
        Schema::dropIfExists('fiscal_periods');
        Schema::dropIfExists('fiscal_years');
        Schema::dropIfExists('accounts');
    }

    private function seedChartOfAccounts(): void
    {
        $now = now();

        $accounts = [
            ['code' => '1100', 'name' => 'Kas', 'type' => 'asset', 'normal_balance' => 'debit', 'system_role' => 'cash'],
            ['code' => '1110', 'name' => 'Bank', 'type' => 'asset', 'normal_balance' => 'debit', 'system_role' => 'bank'],
            ['code' => '1200', 'name' => 'Piutang Usaha', 'type' => 'asset', 'normal_balance' => 'debit', 'system_role' => 'ar_control'],
            ['code' => '1300', 'name' => 'Persediaan', 'type' => 'asset', 'normal_balance' => 'debit', 'system_role' => 'inventory'],
            ['code' => '1400', 'name' => 'PPN Masukan', 'type' => 'asset', 'normal_balance' => 'debit', 'system_role' => 'tax_input'],
            ['code' => '2100', 'name' => 'Hutang Usaha', 'type' => 'liability', 'normal_balance' => 'credit', 'system_role' => 'ap_control'],
            ['code' => '2200', 'name' => 'PPN Keluaran', 'type' => 'liability', 'normal_balance' => 'credit', 'system_role' => 'tax_output'],
            ['code' => '2300', 'name' => 'Hutang GRNI', 'type' => 'liability', 'normal_balance' => 'credit', 'system_role' => 'grni'],
            ['code' => '3100', 'name' => 'Modal', 'type' => 'equity', 'normal_balance' => 'credit', 'system_role' => null],
            ['code' => '3200', 'name' => 'Laba Ditahan', 'type' => 'equity', 'normal_balance' => 'credit', 'system_role' => 'retained_earnings'],
            ['code' => '4100', 'name' => 'Pendapatan Penjualan', 'type' => 'revenue', 'normal_balance' => 'credit', 'system_role' => 'sales_revenue'],
            ['code' => '4110', 'name' => 'Pendapatan POS', 'type' => 'revenue', 'normal_balance' => 'credit', 'system_role' => 'pos_revenue'],
            ['code' => '4200', 'name' => 'Potongan Penjualan', 'type' => 'contra_revenue', 'normal_balance' => 'debit', 'system_role' => 'sales_discount'],
            ['code' => '5100', 'name' => 'HPP', 'type' => 'expense', 'normal_balance' => 'debit', 'system_role' => 'cogs'],
            ['code' => '6100', 'name' => 'Beban Operasional', 'type' => 'expense', 'normal_balance' => 'debit', 'system_role' => 'opex'],
            ['code' => '6200', 'name' => 'Selisih Kas', 'type' => 'expense', 'normal_balance' => 'debit', 'system_role' => 'cash_variance'],
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
    }

    private function seedCurrentFiscalYear(): void
    {
        $year = (int) now()->format('Y');
        $now = now();

        $fiscalYearId = DB::table('fiscal_years')->insertGetId([
            'year' => $year,
            'starts_on' => sprintf('%d-01-01', $year),
            'ends_on' => sprintf('%d-12-31', $year),
            'is_closed' => false,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $months = [
            1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
            5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
            9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember',
        ];

        foreach ($months as $index => $label) {
            $startsOn = sprintf('%d-%02d-01', $year, $index);
            $endsOn = date('Y-m-t', strtotime($startsOn));

            DB::table('fiscal_periods')->insert([
                'fiscal_year_id' => $fiscalYearId,
                'period_index' => $index,
                'name' => "{$label} {$year}",
                'starts_on' => $startsOn,
                'ends_on' => $endsOn,
                'status' => 'open',
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }
};
