<?php

namespace Tests\Feature\Modules\Receivables;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Modules\Invoicing\Models\Invoice;
use Modules\Partners\Models\Partner;
use Modules\Receivables\Models\GatewayCharge;
use Modules\Receivables\Models\Payment;
use Modules\Receivables\Models\PaymentGatewayConfig;
use Modules\Rental\Models\Rental;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class MidtransGatewayTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();
    }

    private function enableGateway(): PaymentGatewayConfig
    {
        return PaymentGatewayConfig::query()->updateOrCreate([], [
            'provider' => PaymentGatewayConfig::PROVIDER_MIDTRANS,
            'is_enabled' => true,
            'is_production' => false,
            'server_key' => 'SB-Mid-server-test',
            'client_key' => 'SB-Mid-client-test',
            'merchant_id' => 'G123',
        ]);
    }

    public function test_gateway_settings_page_hides_secret_keys(): void
    {
        $this->enableGateway();

        $this->actingAs($this->createAdminUser())
            ->get(route('module.receivables.gateway.edit'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Receivables/Gateway/Settings')
                ->where('config.has_server_key', true)
                ->where('config.has_client_key', true)
                ->where('config.client_key', 'SB-Mid-client-test'));
    }

    public function test_can_create_snap_charge_for_rental_deposit(): void
    {
        $this->enableGateway();

        Http::fake([
            'app.sandbox.midtrans.com/snap/v1/transactions' => Http::response([
                'token' => 'snap-token-1',
                'redirect_url' => 'https://app.sandbox.midtrans.com/snap/v2/vtweb/snap-token-1',
            ], 201),
        ]);

        $rental = Rental::factory()->create([
            'status' => Rental::STATUS_DRAFT,
            'deposit_amount' => 1000000,
            'deposit_received_at' => null,
        ]);

        $this->actingAs($this->createAdminUser())
            ->post(route('module.rental.deposit.pay_online', $rental))
            ->assertRedirect('https://app.sandbox.midtrans.com/snap/v2/vtweb/snap-token-1');

        $this->assertDatabaseHas('gateway_charges', [
            'rental_id' => $rental->id,
            'purpose' => GatewayCharge::PURPOSE_RENTAL_DEPOSIT,
            'status' => GatewayCharge::STATUS_PENDING,
            'amount' => 1000000,
        ]);
    }

    public function test_webhook_settlement_receives_rental_deposit_idempotently(): void
    {
        $this->enableGateway();

        $rental = Rental::factory()->create([
            'status' => Rental::STATUS_DRAFT,
            'deposit_amount' => 500000,
            'deposit_received_at' => null,
        ]);

        $charge = GatewayCharge::query()->create([
            'purpose' => GatewayCharge::PURPOSE_RENTAL_DEPOSIT,
            'rental_id' => $rental->id,
            'partner_id' => $rental->partner_id,
            'order_id' => 'RDEP-TEST-001',
            'amount' => 500000,
            'status' => GatewayCharge::STATUS_PENDING,
            'snap_token' => 'tok',
            'redirect_url' => 'https://example.test',
        ]);

        $payload = $this->signedPayload([
            'order_id' => 'RDEP-TEST-001',
            'status_code' => '200',
            'gross_amount' => '500000.00',
            'transaction_status' => 'settlement',
            'payment_type' => 'bank_transfer',
            'transaction_id' => 'mid-txn-1',
            'fraud_status' => 'accept',
        ]);

        $this->postJson(route('webhooks.midtrans'), $payload)->assertOk();
        $this->assertNotNull($rental->fresh()->deposit_received_at);
        $this->assertSame(GatewayCharge::STATUS_PAID, $charge->fresh()->status);

        $this->postJson(route('webhooks.midtrans'), $payload)->assertOk();
        $this->assertSame(1, GatewayCharge::query()->where('status', GatewayCharge::STATUS_PAID)->count());
    }

    public function test_webhook_settlement_records_invoice_payment(): void
    {
        $this->enableGateway();

        $partner = Partner::factory()->create();
        $invoice = Invoice::factory()->create([
            'partner_id' => $partner->id,
            'status' => Invoice::STATUS_ISSUED,
            'subtotal' => 250000,
            'tax_amount' => 0,
            'total' => 250000,
            'amount_paid' => 0,
        ]);

        GatewayCharge::query()->create([
            'purpose' => GatewayCharge::PURPOSE_INVOICE,
            'invoice_id' => $invoice->id,
            'partner_id' => $partner->id,
            'order_id' => 'RINV-TEST-001',
            'amount' => 250000,
            'status' => GatewayCharge::STATUS_PENDING,
            'snap_token' => 'tok',
            'redirect_url' => 'https://example.test',
        ]);

        $payload = $this->signedPayload([
            'order_id' => 'RINV-TEST-001',
            'status_code' => '200',
            'gross_amount' => '250000.00',
            'transaction_status' => 'settlement',
            'payment_type' => 'qris',
            'transaction_id' => 'mid-txn-2',
        ]);

        $this->postJson(route('webhooks.midtrans'), $payload)->assertOk();

        $invoice->refresh();
        $this->assertEquals(250000, (float) $invoice->amount_paid);
        $this->assertSame(Invoice::STATUS_PAID, $invoice->status);
        $this->assertDatabaseHas('payments', [
            'partner_id' => $partner->id,
            'method' => Payment::METHOD_QRIS,
            'reference_number' => 'mid-txn-2',
        ]);
    }

    public function test_webhook_rejects_invalid_signature(): void
    {
        $this->enableGateway();

        GatewayCharge::query()->create([
            'purpose' => GatewayCharge::PURPOSE_INVOICE,
            'order_id' => 'RINV-BAD-SIG',
            'amount' => 1000,
            'status' => GatewayCharge::STATUS_PENDING,
        ]);

        $this->postJson(route('webhooks.midtrans'), [
            'order_id' => 'RINV-BAD-SIG',
            'status_code' => '200',
            'gross_amount' => '1000.00',
            'transaction_status' => 'settlement',
            'signature_key' => 'not-valid',
        ])->assertStatus(400);
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private function signedPayload(array $payload): array
    {
        $serverKey = 'SB-Mid-server-test';
        $payload['signature_key'] = hash(
            'sha512',
            $payload['order_id'].$payload['status_code'].$payload['gross_amount'].$serverKey,
        );

        return $payload;
    }
}
