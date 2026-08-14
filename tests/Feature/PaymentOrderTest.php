<?php

namespace Tests\Feature;

use App\Models\Plan;
use App\Models\Tenant;
use App\Models\User;
use App\Services\PaymentOrderService;
use Database\Seeders\PlanSeeder;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class PaymentOrderTest extends TestCase
{
    use DatabaseMigrations;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PlanSeeder::class);
    }

    private function createTenantRecord(array $attributes): Tenant
    {
        $id = $attributes['id'] ?? (string) \Illuminate\Support\Str::random(16);
        $plan = $attributes['plan'] ?? null;
        unset($attributes['plan']);

        $data = $plan ? json_encode(['plan' => $plan]) : null;

        DB::table('tenants')->insert(array_merge([
            'id' => $id,
            'name' => 'Test Tenant',
            'status' => 'active',
            'data' => $data,
            'trial_ends_at' => null,
            'is_trial_expired' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ], $attributes));

        return Tenant::query()->findOrFail($id);
    }

    public function test_create_order_generates_unique_code_and_expires_at(): void
    {
        $tenant = $this->createTenantRecord(['id' => 'order-create-test']);
        $plan = Plan::query()->where('key', 'basic')->firstOrFail();

        $service = new PaymentOrderService;
        $order = $service->createOrder($tenant, $plan, 'activate');

        $this->assertNotNull($order->id);
        $this->assertSame($tenant->id, $order->tenant_id);
        $this->assertSame($plan->id, $order->plan_id);
        $this->assertSame('activate', $order->type);
        $this->assertSame('pending', $order->status);
        $this->assertGreaterThanOrEqual(100, $order->unique_code);
        $this->assertLessThanOrEqual(999, $order->unique_code);
        $this->assertTrue($order->expires_at->isFuture());
        $this->assertTrue($order->expires_at->lt(now()->addHours(49)));
    }

    public function test_submit_proof_moves_to_awaiting_confirmation(): void
    {
        $tenant = $this->createTenantRecord(['id' => 'proof-test']);
        $plan = Plan::query()->where('key', 'basic')->firstOrFail();

        $service = new PaymentOrderService;
        $order = $service->createOrder($tenant, $plan, 'activate');

        $file = \Illuminate\Http\UploadedFile::fake()->create('proof.jpg', 100);
        $service->submitProof($order, $file, 'Transfer dari BCA');

        $order->refresh();
        $this->assertSame('awaiting_confirmation', $order->status);
        $this->assertNotNull($order->transfer_proof_path);
        $this->assertSame('Transfer dari BCA', $order->transfer_note);
    }

    public function test_confirm_activates_subscription(): void
    {
        $tenant = $this->createTenantRecord(['id' => 'confirm-test']);
        $plan = Plan::query()->where('key', 'basic')->firstOrFail();
        $admin = User::factory()->create();

        $service = new PaymentOrderService;
        $order = $service->createOrder($tenant, $plan, 'activate');

        $file = \Illuminate\Http\UploadedFile::fake()->create('proof.jpg', 100);
        $service->submitProof($order, $file);

        $subscription = $service->confirm($order, $admin);

        $order->refresh();
        $this->assertSame('confirmed', $order->status);
        $this->assertNotNull($order->confirmed_at);
        $this->assertSame($admin->id, $order->confirmed_by);
        $this->assertSame($subscription->id, $order->subscription_id);
        $this->assertSame('active', $tenant->refresh()->status);
    }

    public function test_reject_marks_order_rejected(): void
    {
        $tenant = $this->createTenantRecord(['id' => 'reject-test']);
        $plan = Plan::query()->where('key', 'basic')->firstOrFail();
        $admin = User::factory()->create();

        $service = new PaymentOrderService;
        $order = $service->createOrder($tenant, $plan, 'activate');

        $file = \Illuminate\Http\UploadedFile::fake()->create('proof.jpg', 100);
        $service->submitProof($order, $file);

        $service->reject($order, $admin, 'Nominal tidak sesuai');

        $order->refresh();
        $this->assertSame('rejected', $order->status);
        $this->assertNotNull($order->rejected_at);
        $this->assertSame($admin->id, $order->rejected_by);
        $this->assertSame('Nominal tidak sesuai', $order->rejection_reason);
    }

    public function test_expire_stale_marks_expired_orders(): void
    {
        $tenant = $this->createTenantRecord(['id' => 'expire-test']);
        $plan = Plan::query()->where('key', 'basic')->firstOrFail();

        $service = new PaymentOrderService;

        $order = $service->createOrder($tenant, $plan, 'activate');

        DB::table('payment_orders')->where('id', $order->id)->update(['expires_at' => now()->subHour()]);

        $count = $service->expireStale();

        $this->assertSame(1, $count);

        $order->refresh();
        $this->assertSame('expired', $order->status);
    }

    public function test_renew_extends_subscription_ends_at(): void
    {
        $tenant = $this->createTenantRecord(['id' => 'renew-test']);
        $plan = Plan::query()->where('key', 'basic')->firstOrFail();

        $service = new PaymentOrderService;

        $subscription = \App\Models\Subscription::create([
            'tenant_id' => $tenant->id,
            'plan_id' => $plan->id,
            'starts_at' => now()->subMonth(),
            'ends_at' => now()->addDays(5),
            'status' => \App\Models\Subscription::STATUS_ACTIVE,
        ]);

        $order = $service->createOrder($tenant, $plan, 'renew');

        $file = \Illuminate\Http\UploadedFile::fake()->create('proof.jpg', 100);
        $service->submitProof($order, $file);

        $admin = User::factory()->create();
        $service->confirm($order, $admin);

        $subscription->refresh();
        $this->assertTrue($subscription->ends_at->gt(now()->addDays(30)));
    }
}
