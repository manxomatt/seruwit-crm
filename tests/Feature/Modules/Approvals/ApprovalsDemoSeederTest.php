<?php

namespace Tests\Feature\Modules\Approvals;

use Database\Seeders\TenantApprovalsDemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Approvals\Models\ApprovalPolicy;
use Modules\Approvals\Models\ApprovalRequest;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class ApprovalsDemoSeederTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_seeds_thirty_demo_approval_requests(): void
    {
        $this->seed(TenantApprovalsDemoSeeder::class);

        $this->assertSame(
            TenantApprovalsDemoSeeder::REQUEST_COUNT,
            ApprovalRequest::query()->where('payload->demo_tag', TenantApprovalsDemoSeeder::TAG)->count(),
        );

        $this->assertGreaterThanOrEqual(
            4,
            ApprovalPolicy::query()->where('description', 'like', '%'.TenantApprovalsDemoSeeder::TAG.'%')->count(),
        );

        $this->assertGreaterThan(
            0,
            ApprovalRequest::query()
                ->where('payload->demo_tag', TenantApprovalsDemoSeeder::TAG)
                ->where('status', ApprovalRequest::STATUS_PENDING)
                ->count(),
        );
        $this->assertGreaterThan(
            0,
            ApprovalRequest::query()
                ->where('payload->demo_tag', TenantApprovalsDemoSeeder::TAG)
                ->where('status', ApprovalRequest::STATUS_APPROVED)
                ->count(),
        );
    }

    public function test_seeder_is_idempotent(): void
    {
        $this->seed(TenantApprovalsDemoSeeder::class);
        $count = ApprovalRequest::query()->where('payload->demo_tag', TenantApprovalsDemoSeeder::TAG)->count();

        $this->seed(TenantApprovalsDemoSeeder::class);

        $this->assertSame(
            $count,
            ApprovalRequest::query()->where('payload->demo_tag', TenantApprovalsDemoSeeder::TAG)->count(),
        );
    }

    public function test_requests_index_paginates_demo_results(): void
    {
        $user = $this->createAdminUser();
        $this->seed(TenantApprovalsDemoSeeder::class);

        $this->actingAs($user)
            ->get(route('module.approvals.requests.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Approvals/Requests/Index')
                ->where('requests.per_page', 15)
                ->where('requests.total', TenantApprovalsDemoSeeder::REQUEST_COUNT)
                ->where('requests.last_page', 2)
                ->has('requests.data', 15)
                ->has('requests.links')
                ->has('filters')
                ->has('can.create'));

        $this->actingAs($user)
            ->get(route('module.approvals.requests.index', ['page' => 2]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('requests.data', 15));
    }

    public function test_policies_index_is_paginated(): void
    {
        $user = $this->createAdminUser();
        $this->seed(TenantApprovalsDemoSeeder::class);

        $this->actingAs($user)
            ->get(route('module.approvals.policies.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Approvals/Policies/Index')
                ->where('policies.per_page', 15)
                ->has('policies.data')
                ->has('policies.links')
                ->has('can.create'));
    }
}
