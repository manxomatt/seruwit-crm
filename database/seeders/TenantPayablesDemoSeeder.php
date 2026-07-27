<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;
use Modules\Partners\Models\Partner;
use Modules\Payables\Models\SupplierBill;
use Modules\Payables\Models\SupplierBillLine;
use Modules\Payables\Support\BillPaymentRecorder;

/**
 * Seeds 20 demo supplier bills (+ related lines/payments) for Payables.
 *
 *   php artisan tenants:seed --class=TenantPayablesDemoSeeder --tenants={id}
 */
class TenantPayablesDemoSeeder extends Seeder
{
    public const TAG = '[PAYABLES-DEMO]';

    public const BILL_COUNT = 20;

    public function run(): void
    {
        if (! class_exists(SupplierBill::class) || ! Schema::hasTable('supplier_bills')) {
            $this->command?->warn('Payables tables missing. Install the payables module first.');

            return;
        }

        if (! class_exists(Partner::class) || ! Schema::hasTable('partners')) {
            $this->command?->warn('Partners table missing.');

            return;
        }

        $suppliers = $this->ensureSuppliers();

        if ($this->demoBillsExist()) {
            $this->command?->info('Payables demo bills already present — skipping create.');
        } else {
            $this->seedBillsAndPayments($suppliers);
        }

        $billCount = SupplierBill::query()->where('notes', 'like', '%'.self::TAG.'%')->count();
        $paymentCount = \Modules\Payables\Models\BillPayment::query()
            ->where('notes', 'like', '%'.self::TAG.'%')
            ->count();

        $this->command?->info(sprintf(
            'Payables demo ready: %d bills, %d payments.',
            $billCount,
            $paymentCount,
        ));
        $this->command?->info('Open /module/payables/bills and /module/payables/payments');
    }

    /**
     * @return \Illuminate\Support\Collection<int, Partner>
     */
    protected function ensureSuppliers()
    {
        $suppliers = Partner::query()
            ->where('supplier_rank', '>', 0)
            ->orderBy('id')
            ->limit(5)
            ->get();

        $names = [
            'PT Payables Demo Nusantara',
            'CV Payables Demo Mandiri',
            'UD Payables Demo Sejahtera',
            'PT Payables Demo Global',
            'CV Payables Demo Prima',
        ];

        while ($suppliers->count() < 5) {
            $index = $suppliers->count();
            $code = sprintf('SUP-PAY-%02d', $index + 1);

            $supplier = Partner::query()->firstOrCreate(
                ['code' => $code],
                [
                    'account_type' => 'company',
                    'sub_type' => 'supplier',
                    'name' => $names[$index] ?? fake()->company(),
                    'customer_rank' => 0,
                    'supplier_rank' => 1,
                    'status' => 'active',
                    'notes' => self::TAG.' Demo supplier.',
                ],
            );

            $suppliers->push($supplier);
        }

        return $suppliers->values();
    }

    protected function demoBillsExist(): bool
    {
        return SupplierBill::query()
            ->where('notes', 'like', '%'.self::TAG.'%')
            ->count() >= self::BILL_COUNT;
    }

    /**
     * @param  \Illuminate\Support\Collection<int, Partner>  $suppliers
     */
    protected function seedBillsAndPayments($suppliers): void
    {
        $statuses = [
            SupplierBill::STATUS_DRAFT,
            SupplierBill::STATUS_ISSUED,
            SupplierBill::STATUS_ISSUED,
            SupplierBill::STATUS_PARTIALLY_PAID,
            SupplierBill::STATUS_PAID,
            SupplierBill::STATUS_ISSUED,
            SupplierBill::STATUS_DRAFT,
            SupplierBill::STATUS_VOID,
        ];

        for ($i = 1; $i <= self::BILL_COUNT; $i++) {
            $code = sprintf('DEMO-BILL-%02d', $i);

            if (SupplierBill::query()->where('code', $code)->exists()) {
                continue;
            }

            /** @var Partner $supplier */
            $supplier = $suppliers[($i - 1) % $suppliers->count()];
            $status = $statuses[($i - 1) % count($statuses)];
            $lineAmount = 500000 + ($i * 75000);
            $lineCount = ($i % 3) + 1;
            $subtotal = $lineAmount * $lineCount;
            $taxAmount = round($subtotal * 0.11, 2);
            $total = round($subtotal + $taxAmount, 2);

            $bill = SupplierBill::query()->create([
                'code' => $code,
                'partner_id' => $supplier->id,
                'status' => $status === SupplierBill::STATUS_PAID || $status === SupplierBill::STATUS_PARTIALLY_PAID
                    ? SupplierBill::STATUS_ISSUED
                    : $status,
                'bill_date' => now()->subDays(self::BILL_COUNT - $i)->toDateString(),
                'due_date' => now()->addDays($i)->toDateString(),
                'tax_enabled' => true,
                'tax_rate' => 11,
                'subtotal' => $subtotal,
                'tax_amount' => $taxAmount,
                'total' => $total,
                'amount_paid' => 0,
                'notes' => self::TAG." Demo supplier bill #{$i}.",
            ]);

            for ($line = 1; $line <= $lineCount; $line++) {
                SupplierBillLine::query()->create([
                    'supplier_bill_id' => $bill->id,
                    'description' => self::TAG." Line {$line} for {$code}",
                    'amount' => $lineAmount,
                    'expected_amount' => $lineAmount,
                ]);
            }

            if (in_array($status, [SupplierBill::STATUS_PARTIALLY_PAID, SupplierBill::STATUS_PAID], true)) {
                $payAmount = $status === SupplierBill::STATUS_PAID
                    ? $total
                    : round($total * 0.4, 2);

                BillPaymentRecorder::record([
                    'partner_id' => $supplier->id,
                    'payment_date' => now()->subDays(max(0, self::BILL_COUNT - $i - 1))->toDateString(),
                    'amount' => $payAmount,
                    'method' => $i % 2 === 0 ? 'transfer' : 'cash',
                    'reference_number' => sprintf('REF-DEMO-%02d', $i),
                    'notes' => self::TAG." Demo payment for {$code}.",
                    'allocations' => [
                        [
                            'supplier_bill_id' => $bill->id,
                            'amount' => $payAmount,
                        ],
                    ],
                ]);
            } elseif ($status === SupplierBill::STATUS_VOID) {
                $bill->update(['status' => SupplierBill::STATUS_VOID]);
            }
        }
    }
}
