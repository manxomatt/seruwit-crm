<?php

namespace Tests\Feature\Modules\Approvals;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Approvals\Models\ApprovalPolicy;
use Modules\Approvals\Models\ApprovalRequest;
use Modules\Approvals\Support\ApprovalDecisionService;
use Modules\Approvals\Support\ApprovalTriggers;
use Modules\Inventory\Models\Warehouse;
use Modules\Partners\Models\Partner;
use Modules\Product\Models\Product;
use Modules\Purchasing\Models\PurchaseOrder;
use Modules\Purchasing\Models\PurchaseOrderItem;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class ApprovalWorkflowTest extends TestCase
{
    use RefreshDatabase, WithRoles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();
    }

    private function createPoAmountPolicy(float $minAmount = 1_000_000): ApprovalPolicy
    {
        $policy = ApprovalPolicy::query()->create([
            'key' => 'large-po',
            'name' => 'Large PO',
            'trigger_type' => ApprovalTriggers::PO_AMOUNT,
            'is_active' => true,
            'conditions' => ['min_amount' => $minAmount],
        ]);

        $policy->levels()->create([
            'level' => 1,
            'name' => 'Manager',
            'approver_type' => 'permission',
            'approver_value' => 'approvals.decide',
        ]);

        $policy->levels()->create([
            'level' => 2,
            'name' => 'Director',
            'approver_type' => 'role',
            'approver_value' => 'admin',
        ]);

        return $policy->fresh('levels');
    }

    private function draftPo(float $total): PurchaseOrder
    {
        $po = PurchaseOrder::factory()->create([
            'status' => PurchaseOrder::STATUS_DRAFT,
            'partner_id' => Partner::factory()->supplier()->create()->id,
            'warehouse_id' => Warehouse::factory()->create()->id,
            'total_amount' => $total,
        ]);

        PurchaseOrderItem::factory()->create([
            'purchase_order_id' => $po->id,
            'product_id' => Product::factory()->create()->id,
            'quantity_ordered' => 1,
            'unit_price' => $total,
        ]);

        $po->recalculateTotal();

        return $po->fresh();
    }

    public function test_large_po_submit_creates_pending_approval_request(): void
    {
        $this->createPoAmountPolicy(500_000);
        $po = $this->draftPo(750_000);
        $user = $this->createAdminUser();

        $this->actingAs($user)
            ->post(route('module.purchasing.purchase-orders.submit', $po))
            ->assertSessionHas('error');

        $this->assertSame(PurchaseOrder::STATUS_DRAFT, $po->fresh()->status);
        $this->assertDatabaseHas('approval_requests', [
            'trigger_type' => ApprovalTriggers::PO_AMOUNT,
            'subject_id' => $po->id,
            'status' => ApprovalRequest::STATUS_PENDING,
        ]);
    }

    public function test_multi_level_approval_submits_po_after_final_approve(): void
    {
        $this->createPoAmountPolicy(100_000);
        $po = $this->draftPo(200_000);
        $admin = $this->createAdminUser();

        $this->actingAs($admin)
            ->post(route('module.purchasing.purchase-orders.submit', $po))
            ->assertSessionHas('error');

        $request = ApprovalRequest::query()->first();
        $this->assertNotNull($request);

        ApprovalDecisionService::approve($request, $admin, 'L1 ok');
        $this->assertSame(ApprovalRequest::STATUS_PENDING, $request->fresh()->status);
        $this->assertSame(2, $request->fresh()->current_level);
        $this->assertSame(PurchaseOrder::STATUS_DRAFT, $po->fresh()->status);

        ApprovalDecisionService::approve($request->fresh(), $admin, 'L2 ok');

        $this->assertSame(ApprovalRequest::STATUS_APPROVED, $request->fresh()->status);
        $this->assertSame(PurchaseOrder::STATUS_SUBMITTED, $po->fresh()->status);
    }

    public function test_po_below_threshold_submits_without_approval(): void
    {
        $this->createPoAmountPolicy(1_000_000);
        $po = $this->draftPo(100_000);

        $this->actingAs($this->createAdminUser())
            ->post(route('module.purchasing.purchase-orders.submit', $po))
            ->assertSessionHas('success');

        $this->assertSame(PurchaseOrder::STATUS_SUBMITTED, $po->fresh()->status);
        $this->assertSame(0, ApprovalRequest::query()->count());
    }

    public function test_policy_can_be_created_via_http(): void
    {
        $this->actingAs($this->createAdminUser())->post(route('module.approvals.policies.store', [], false), [
            'key' => 'credit-override',
            'name' => 'Credit Override',
            'trigger_type' => ApprovalTriggers::CREDIT_LIMIT,
            'is_active' => true,
            'conditions' => ['requires_exceeded' => true],
            'levels' => [
                [
                    'level' => 1,
                    'name' => 'Finance',
                    'approver_type' => 'permission',
                    'approver_value' => 'approvals.decide',
                ],
            ],
        ])->assertRedirect();

        $this->assertDatabaseHas('approval_policies', ['key' => 'credit-override']);
        $this->assertDatabaseCount('approval_policy_levels', 1);
    }
}
