<?php

namespace Tests\Feature\Modules\Collections;

use App\Models\User;
use App\Modules\Facades\Modules;
use App\Modules\ModuleTier;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\RefreshDatabaseState;
use Illuminate\Support\Facades\Schema;
use Modules\Accounting\Models\Account;
use Modules\Accounting\Models\BankTransaction;
use Modules\Accounting\Models\CompanyBankAccount;
use Modules\Accounting\Support\FiscalCalendarService;
use Modules\Collections\Models\CollectionDunning;
use Modules\Collections\Models\CollectionPromise;
use Modules\Collections\Models\PostDatedCheck;
use Modules\Collections\Support\DunningAutomationService;
use Modules\Collections\Support\PostDatedCheckService;
use Modules\Expenses\Support\ExpenseSchemaInitializer;
use Modules\Invoicing\Models\Invoice;
use Modules\Partners\Models\Partner;
use Modules\Receivables\Models\Payment;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class CollectionsModuleTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function beforeRefreshingDatabase(): void
    {
        if (Schema::hasTable('accounts') && Schema::hasTable('bank_transactions')) {
            ExpenseSchemaInitializer::ensureReady();
            RefreshDatabaseState::$migrated = true;
        }
    }

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
        ExpenseSchemaInitializer::ensureReady();

        app(FiscalCalendarService::class)->ensureYear((int) now()->format('Y'));
    }

    public function test_collections_module_is_registered_with_correct_metadata(): void
    {
        $module = Modules::find('collections');

        $this->assertNotNull($module);
        $this->assertSame(ModuleTier::Foundation, $module->tier());
        $this->assertSame(['partners', 'invoicing', 'receivables'], $module->requires());
        $this->assertContains('view', $module->permissions());
        $this->assertContains('remind', $module->permissions());
        $this->assertContains('manage_pdc', $module->permissions());
    }

    public function test_dunning_automation_service_generates_stage_and_message_according_to_due_date(): void
    {
        $admin = $this->createAdminUser();
        $partner = Partner::query()->create([
            'code' => 'PTR-MB',
            'name' => 'PT Maju Bersama Logistik',
            'email' => 'finance@majubersama.com',
            'phone' => '08123456789',
        ]);

        $invH3 = Invoice::query()->create([
            'code' => 'INV-TEST-H3',
            'partner_id' => $partner->id,
            'issue_date' => Carbon::today()->subDays(10)->toDateString(),
            'due_date' => Carbon::today()->addDays(3)->toDateString(),
            'status' => Invoice::STATUS_ISSUED,
            'tax_enabled' => false,
            'tax_rate' => 0,
            'subtotal' => 5000000,
            'total' => 5000000,
            'amount_paid' => 0,
        ]);

        $invOverdue = Invoice::query()->create([
            'code' => 'INV-TEST-OVERDUE-7',
            'partner_id' => $partner->id,
            'issue_date' => Carbon::today()->subDays(20)->toDateString(),
            'due_date' => Carbon::today()->subDays(6)->toDateString(),
            'status' => Invoice::STATUS_ISSUED,
            'tax_enabled' => false,
            'tax_rate' => 0,
            'subtotal' => 10000000,
            'total' => 10000000,
            'amount_paid' => 0,
        ]);

        $dunningService = app(DunningAutomationService::class);

        $stageH3 = $dunningService->determineStage($invH3);
        $this->assertSame(CollectionDunning::STAGE_REMINDER_H3, $stageH3);

        $stageOverdue = $dunningService->determineStage($invOverdue);
        $this->assertSame(CollectionDunning::STAGE_OVERDUE_H7, $stageOverdue);

        // Send reminder
        $log = $dunningService->sendReminder($invOverdue, 'whatsapp', $admin);
        $this->assertInstanceOf(CollectionDunning::class, $log);
        $this->assertSame($invOverdue->id, $log->invoice_id);
        $this->assertSame(CollectionDunning::STATUS_SENT, $log->status);
        $this->assertStringContainsString('PT Maju Bersama Logistik', $log->message_body);
        $this->assertStringContainsString('INV-TEST-OVERDUE-7', $log->message_body);
    }

    public function test_collection_promise_to_pay_lifecycle(): void
    {
        $admin = $this->createAdminUser();
        $partner = Partner::query()->create([
            'code' => 'PTR-SM',
            'name' => 'CV Sumber Makmur',
            'phone' => '081298765432',
        ]);

        $invoice = Invoice::query()->create([
            'code' => 'INV-TEST-PROM',
            'partner_id' => $partner->id,
            'issue_date' => '2026-10-01',
            'due_date' => '2026-10-15',
            'status' => Invoice::STATUS_ISSUED,
            'tax_enabled' => false,
            'tax_rate' => 0,
            'subtotal' => 3000000,
            'total' => 3000000,
            'amount_paid' => 0,
        ]);

        $promise = CollectionPromise::query()->create([
            'invoice_id' => $invoice->id,
            'partner_id' => $partner->id,
            'promised_amount' => 3000000,
            'promised_date' => '2026-10-25',
            'status' => CollectionPromise::STATUS_PENDING,
            'notes' => 'Pelanggan berjanji melunasi setelah pencairan SPM',
            'recorded_by' => $admin->id,
        ]);

        $this->assertSame(CollectionPromise::STATUS_PENDING, $promise->status);

        $promise->update([
            'status' => CollectionPromise::STATUS_FULFILLED,
            'fulfilled_at' => now(),
        ]);

        $this->assertSame(CollectionPromise::STATUS_FULFILLED, $promise->fresh()->status);
        $this->assertNotNull($promise->fresh()->fulfilled_at);
    }

    public function test_post_dated_check_lifecycle_deposit_clearing_and_bounce(): void
    {
        $admin = $this->createAdminUser();
        $partner = Partner::query()->create([
            'code' => 'PTR-NS',
            'name' => 'PT Nusantara Sejahtera',
            'phone' => '08111222333',
        ]);

        $invoice = Invoice::query()->create([
            'code' => 'INV-TEST-PDC',
            'partner_id' => $partner->id,
            'issue_date' => '2026-10-01',
            'due_date' => '2026-10-20',
            'status' => Invoice::STATUS_ISSUED,
            'tax_enabled' => false,
            'tax_rate' => 0,
            'subtotal' => 7500000,
            'total' => 7500000,
            'amount_paid' => 0,
        ]);

        $bankLedger = Account::query()->firstOrCreate(
            ['code' => '1120'],
            [
                'name' => 'Bank Mandiri Utama',
                'type' => Account::TYPE_ASSET,
                'normal_balance' => Account::NORMAL_DEBIT,
                'system_role' => 'bank_primary',
                'is_postable' => true,
                'is_active' => true,
            ]
        );

        $bankAccount = CompanyBankAccount::query()->create([
            'name' => 'Rekening Kliring Giro',
            'bank_name' => 'Bank Mandiri',
            'account_number' => '142-00-112233-4',
            'account_holder' => 'PT Seruwit Transport',
            'account_id' => $bankLedger->id,
            'is_active' => true,
        ]);

        $pdcService = app(PostDatedCheckService::class);

        // 1. Create Received PDC
        $pdc = PostDatedCheck::query()->create([
            'check_number' => 'BG-MDR-998811',
            'bank_name' => 'Bank Mandiri',
            'partner_id' => $partner->id,
            'invoice_id' => $invoice->id,
            'amount' => 7500000,
            'due_date' => '2026-10-25',
            'status' => PostDatedCheck::STATUS_RECEIVED,
            'company_bank_account_id' => $bankAccount->id,
            'received_by' => $admin->id,
        ]);

        $this->assertSame(PostDatedCheck::STATUS_RECEIVED, $pdc->status);

        // 2. Deposit PDC to Bank
        $deposited = $pdcService->deposit($pdc);
        $this->assertSame(PostDatedCheck::STATUS_DEPOSITED, $deposited->status);

        // 3. Clear PDC
        $cleared = $pdcService->clear($deposited, $bankAccount->id, $admin);
        $this->assertSame(PostDatedCheck::STATUS_CLEARED, $cleared->status);
        $this->assertNotNull($cleared->cleared_at);

        // Verify Payment in Receivables
        $payment = Payment::query()->where('reference_number', 'BG-MDR-998811')->first();
        $this->assertNotNull($payment);
        $this->assertEquals(7500000, (float) $payment->amount);
        $this->assertSame(Payment::METHOD_GIRO, $payment->method);

        // Verify Invoice balance is settled
        $this->assertEquals(0, (float) $invoice->fresh()->balanceDue());
        $this->assertSame(Invoice::STATUS_PAID, $invoice->fresh()->status);

        // Verify BankTransaction in BankBook
        $bankTx = BankTransaction::query()
            ->where('source_type', $payment->getMorphClass())
            ->where('source_id', $payment->id)
            ->first();
        $this->assertNotNull($bankTx);
        $this->assertEquals(7500000, (float) $bankTx->amount);

        // 4. Test Bounced PDC
        $bouncedPdc = PostDatedCheck::query()->create([
            'check_number' => 'BG-BCA-KOSONG-1',
            'bank_name' => 'BCA',
            'partner_id' => $partner->id,
            'amount' => 2000000,
            'due_date' => '2026-10-28',
            'status' => PostDatedCheck::STATUS_RECEIVED,
            'received_by' => $admin->id,
        ]);

        $bounced = $pdcService->bounce($bouncedPdc, 'Saldo tidak mencukupi / Warkat Kosong', $admin);
        $this->assertSame(PostDatedCheck::STATUS_BOUNCED, $bounced->status);
        $this->assertSame('Saldo tidak mencukupi / Warkat Kosong', $bounced->bounced_reason);
    }

    public function test_collections_http_routes(): void
    {
        $admin = $this->createAdminUser();
        $this->actingAs($admin);

        // Collections Dashboard
        $response = $this->get(route('module.collections.dashboard'));
        $response->assertOk();

        // PDC Index
        $response = $this->get(route('module.collections.pdc.index'));
        $response->assertOk();
    }
}
