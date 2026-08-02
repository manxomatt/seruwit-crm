<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;
use Modules\Accounting\Models\Account;
use Modules\Accounting\Models\CompanyBankAccount;
use Modules\Accounting\Models\JournalEntry;
use Modules\Accounting\Models\JournalLine;
use Modules\Accounting\Support\FiscalCalendarService;
use Modules\Accounting\Support\JournalService;
use Modules\Billing\Models\Tariff;
use Modules\Billing\Models\TripAllowance;
use Modules\Invoicing\Models\Invoice;
use Modules\Invoicing\Models\InvoiceLine;
use Modules\Partners\Models\Partner;
use Modules\Receivables\Models\Payment;
use Modules\Receivables\Models\PaymentAllocation;
use Modules\Receivables\Support\PaymentRecorder;
use Modules\TransportationManagement\Models\Trip;

/**
 * Demo data for the Finance vertical pack: accounting, invoicing, receivables, billing.
 * Payables demo is seeded/uninstalled via TenantPayablesDemoSeeder from the pack.
 *
 *   php artisan tenants:seed --class=TenantFinanceDemoSeeder --tenants={id}
 */
class TenantFinanceDemoSeeder extends Seeder
{
    public const TAG = '[FINANCE-DEMO]';

    public const INVOICE_COUNT = 15;

    public const TARIFF_COUNT = 8;

    public const JOURNAL_COUNT = 5;

    public function run(): void
    {
        $this->seedAccounting();
        $customers = $this->ensureCustomers();
        $this->seedInvoicesAndPayments($customers);
        $this->seedBillingTariffs();
        $this->seedTripAllowances();

        $this->command?->info(sprintf(
            'Finance demo ready: %d invoices, %d payments, %d tariffs, %d journals.',
            Invoice::query()->where('notes', 'like', '%'.self::TAG.'%')->count(),
            Payment::query()->where('notes', 'like', '%'.self::TAG.'%')->count(),
            $this->demoTariffQuery()->count(),
            JournalEntry::query()->where('memo', 'like', '%'.self::TAG.'%')->count(),
        ));
    }

    /**
     * Remove tagged finance demo rows without touching unrelated tenant data.
     */
    public function uninstall(): void
    {
        if (Schema::hasTable('payment_allocations') && Schema::hasTable('payments')) {
            $paymentIds = Payment::query()
                ->where('notes', 'like', '%'.self::TAG.'%')
                ->pluck('id');

            if ($paymentIds->isNotEmpty()) {
                PaymentAllocation::query()->whereIn('payment_id', $paymentIds)->delete();
                Payment::query()->whereIn('id', $paymentIds)->delete();
            }
        }

        if (Schema::hasTable('invoices')) {
            $invoiceIds = Invoice::query()
                ->where('notes', 'like', '%'.self::TAG.'%')
                ->pluck('id');

            if ($invoiceIds->isNotEmpty()) {
                if (Schema::hasTable('invoice_lines')) {
                    InvoiceLine::query()->whereIn('invoice_id', $invoiceIds)->delete();
                }
                Invoice::query()->whereIn('id', $invoiceIds)->delete();
            }
        }

        if (Schema::hasTable('trip_allowances')) {
            TripAllowance::query()->where('notes', 'like', '%'.self::TAG.'%')->delete();
        }

        if (Schema::hasTable('tariffs')) {
            $this->demoTariffQuery()->delete();
        }

        if (Schema::hasTable('journal_entries')) {
            $journalIds = JournalEntry::query()
                ->where('memo', 'like', '%'.self::TAG.'%')
                ->pluck('id');

            if ($journalIds->isNotEmpty()) {
                if (Schema::hasTable('journal_lines')) {
                    JournalLine::query()->whereIn('journal_entry_id', $journalIds)->delete();
                }
                JournalEntry::query()->whereIn('id', $journalIds)->delete();
            }
        }

        if (Schema::hasTable('company_bank_accounts')) {
            CompanyBankAccount::query()
                ->where('name', 'like', '%'.self::TAG.'%')
                ->delete();
        }

        if (Schema::hasTable('partners')) {
            Partner::query()
                ->where('notes', 'like', '%'.self::TAG.'%')
                ->where('code', 'like', 'CUS-FIN-%')
                ->delete();
        }

        $this->command?->info('Finance demo data removed.');
    }

    protected function seedAccounting(): void
    {
        if (! class_exists(JournalEntry::class) || ! Schema::hasTable('journal_entries')) {
            $this->command?->warn('Accounting journals missing — skipping accounting demo.');

            return;
        }

        if (! Schema::hasTable('accounts') || Account::query()->where('code', '1100')->doesntExist()) {
            $this->command?->warn('Chart of accounts missing — skipping accounting demo.');

            return;
        }

        app(FiscalCalendarService::class)->ensureYear((int) now()->format('Y'));

        $cash = Account::query()->where('code', '1100')->first();
        $bank = Account::query()->where('code', '1110')->first();
        $equity = Account::query()->where('code', '3100')->first();

        if ($cash && Schema::hasTable('company_bank_accounts')) {
            CompanyBankAccount::query()->firstOrCreate(
                ['name' => self::TAG.' Kas Operasional'],
                [
                    'kind' => CompanyBankAccount::KIND_CASH,
                    'bank_name' => null,
                    'account_number' => null,
                    'account_holder' => 'Finance Demo',
                    'account_id' => $cash->id,
                    'is_default' => false,
                    'is_active' => true,
                    'currency' => 'IDR',
                ],
            );
        }

        if (! $cash || ! $equity) {
            return;
        }

        $existing = JournalEntry::query()->where('memo', 'like', '%'.self::TAG.'%')->count();
        if ($existing >= self::JOURNAL_COUNT) {
            return;
        }

        $service = app(JournalService::class);

        for ($i = $existing + 1; $i <= self::JOURNAL_COUNT; $i++) {
            $amount = 1_000_000 * $i;
            $debitAccount = $i % 2 === 0 && $bank ? $bank : $cash;

            $entry = $service->createDraft([
                'entry_date' => now()->subDays(self::JOURNAL_COUNT - $i)->toDateString(),
                'memo' => self::TAG." Demo journal #{$i}",
                'lines' => [
                    ['account_id' => $debitAccount->id, 'debit' => $amount, 'credit' => 0],
                    ['account_id' => $equity->id, 'debit' => 0, 'credit' => $amount],
                ],
            ]);

            if ($i <= 3) {
                $service->post($entry->fresh(['lines.account', 'fiscalPeriod.fiscalYear']));
            }
        }
    }

    /**
     * @return \Illuminate\Support\Collection<int, Partner>
     */
    protected function ensureCustomers()
    {
        if (! class_exists(Partner::class) || ! Schema::hasTable('partners')) {
            return collect();
        }

        $names = [
            'PT Finance Demo Pelanggan',
            'CV Finance Demo Mitra',
            'UD Finance Demo Jaya',
            'PT Finance Demo Prima',
            'CV Finance Demo Abadi',
        ];

        $customers = collect();

        foreach ($names as $index => $name) {
            $code = sprintf('CUS-FIN-%02d', $index + 1);
            $customers->push(Partner::query()->firstOrCreate(
                ['code' => $code],
                [
                    'account_type' => 'company',
                    'sub_type' => 'customer',
                    'name' => $name,
                    'customer_rank' => 1,
                    'supplier_rank' => 0,
                    'status' => 'active',
                    'credit_limit' => 50_000_000,
                    'notes' => self::TAG.' Demo customer.',
                ],
            ));
        }

        return $customers->values();
    }

    /**
     * @param  \Illuminate\Support\Collection<int, Partner>  $customers
     */
    protected function seedInvoicesAndPayments($customers): void
    {
        if ($customers->isEmpty()) {
            return;
        }

        if (! class_exists(Invoice::class) || ! Schema::hasTable('invoices')) {
            $this->command?->warn('Invoicing tables missing — skipping invoice demo.');

            return;
        }

        if (Invoice::query()->where('notes', 'like', '%'.self::TAG.'%')->count() >= self::INVOICE_COUNT) {
            return;
        }

        $statuses = [
            Invoice::STATUS_DRAFT,
            Invoice::STATUS_ISSUED,
            Invoice::STATUS_ISSUED,
            Invoice::STATUS_PARTIALLY_PAID,
            Invoice::STATUS_PAID,
            Invoice::STATUS_ISSUED,
            Invoice::STATUS_VOID,
        ];

        for ($i = 1; $i <= self::INVOICE_COUNT; $i++) {
            $code = sprintf('FIN-INV-%02d', $i);

            if (Invoice::query()->where('code', $code)->exists()) {
                continue;
            }

            /** @var Partner $customer */
            $customer = $customers[($i - 1) % $customers->count()];
            $status = $statuses[($i - 1) % count($statuses)];
            $lineAmount = 750_000 + ($i * 50_000);
            $lineCount = ($i % 3) + 1;
            $subtotal = $lineAmount * $lineCount;
            $taxAmount = round($subtotal * 0.11, 2);
            $total = round($subtotal + $taxAmount, 2);

            $createStatus = in_array($status, [Invoice::STATUS_PARTIALLY_PAID, Invoice::STATUS_PAID], true)
                ? Invoice::STATUS_ISSUED
                : $status;

            $invoice = Invoice::query()->create([
                'code' => $code,
                'partner_id' => $customer->id,
                'status' => $createStatus === Invoice::STATUS_VOID ? Invoice::STATUS_DRAFT : $createStatus,
                'issue_date' => now()->subDays(self::INVOICE_COUNT - $i)->toDateString(),
                'due_date' => now()->addDays($i)->toDateString(),
                'tax_enabled' => true,
                'tax_rate' => 11,
                'subtotal' => $subtotal,
                'tax_amount' => $taxAmount,
                'total' => $total,
                'amount_paid' => 0,
                'notes' => self::TAG." Demo invoice #{$i}.",
            ]);

            for ($line = 1; $line <= $lineCount; $line++) {
                InvoiceLine::query()->create([
                    'invoice_id' => $invoice->id,
                    'description' => self::TAG." Line {$line} for {$code}",
                    'amount' => $lineAmount,
                ]);
            }

            if ($status === Invoice::STATUS_VOID) {
                $invoice->update(['status' => Invoice::STATUS_VOID]);

                continue;
            }

            if ($createStatus === Invoice::STATUS_DRAFT) {
                continue;
            }

            if ($status === Invoice::STATUS_ISSUED) {
                $invoice->update(['status' => Invoice::STATUS_ISSUED]);

                continue;
            }

            if (! class_exists(PaymentRecorder::class) || ! Schema::hasTable('payments')) {
                continue;
            }

            $payAmount = $status === Invoice::STATUS_PAID
                ? $total
                : round($total * 0.4, 2);

            PaymentRecorder::record([
                'partner_id' => $customer->id,
                'payment_date' => now()->subDays(max(0, self::INVOICE_COUNT - $i - 1))->toDateString(),
                'amount' => $payAmount,
                'type' => $status === Invoice::STATUS_PAID
                    ? Payment::TYPE_SETTLEMENT
                    : Payment::TYPE_INSTALLMENT,
                'method' => $i % 2 === 0 ? Payment::METHOD_TRANSFER : Payment::METHOD_CASH,
                'reference_number' => sprintf('FIN-PAY-%02d', $i),
                'notes' => self::TAG." Demo payment for {$code}.",
                'post_accounting' => false,
                'allocations' => [
                    [
                        'invoice_id' => $invoice->id,
                        'amount' => $payAmount,
                    ],
                ],
            ]);
        }
    }

    protected function seedBillingTariffs(): void
    {
        if (! class_exists(Tariff::class) || ! Schema::hasTable('tariffs')) {
            return;
        }

        if ($this->demoTariffQuery()->count() >= self::TARIFF_COUNT) {
            return;
        }

        $routes = [
            ['Jakarta', 'Bandung'],
            ['Jakarta', 'Surabaya'],
            ['Bandung', 'Cirebon'],
            ['Surabaya', 'Malang'],
            ['Jakarta', 'Semarang'],
            ['Medan', 'Binjai'],
            ['Makassar', 'Parepare'],
            ['Denpasar', 'Gilimanuk'],
        ];

        foreach ($routes as $index => [$origin, $destination]) {
            $demoOrigin = 'FIN-DEMO '.$origin;

            Tariff::query()->firstOrCreate(
                [
                    'partner_id' => null,
                    'origin' => $demoOrigin,
                    'destination' => $destination,
                ],
                [
                    'price' => 1_500_000 + ($index * 250_000),
                    'is_active' => $index < 6,
                ],
            );
        }
    }

    protected function seedTripAllowances(): void
    {
        if (! class_exists(TripAllowance::class) || ! Schema::hasTable('trip_allowances')) {
            return;
        }

        if (! class_exists(Trip::class) || ! Schema::hasTable('trips')) {
            return;
        }

        if (TripAllowance::query()->where('notes', 'like', '%'.self::TAG.'%')->exists()) {
            return;
        }

        $trips = Trip::query()->orderBy('id')->limit(5)->get();

        foreach ($trips as $index => $trip) {
            TripAllowance::query()->create([
                'trip_id' => $trip->id,
                'advance_amount' => 250_000 + ($index * 50_000),
                'status' => $index % 2 === 0 ? TripAllowance::STATUS_ISSUED : TripAllowance::STATUS_SETTLED,
                'issued_at' => now()->subDays(5 - $index),
                'settled_at' => $index % 2 === 0 ? null : now()->subDays(2 - min(2, $index)),
                'notes' => self::TAG.' Demo trip allowance.',
            ]);
        }
    }

    /**
     * @return \Illuminate\Database\Eloquent\Builder<Tariff>
     */
    protected function demoTariffQuery()
    {
        return Tariff::query()->where('origin', 'like', 'FIN-DEMO %');
    }
}
