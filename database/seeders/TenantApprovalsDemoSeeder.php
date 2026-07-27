<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;
use Modules\Approvals\Models\ApprovalPolicy;
use Modules\Approvals\Models\ApprovalRequest;
use Modules\Approvals\Support\ApprovalTriggers;

/**
 * Seeds demo approval policies + 30 approval requests for UI pagination.
 *
 *   php artisan tenants:seed --class=TenantApprovalsDemoSeeder --tenants={id}
 */
class TenantApprovalsDemoSeeder extends Seeder
{
    public const TAG = '[APPROVALS-DEMO]';

    public const REQUEST_COUNT = 30;

    public function run(): void
    {
        if (! class_exists(ApprovalRequest::class) || ! Schema::hasTable('approval_requests')) {
            $this->command?->warn('Approvals tables missing. Install the approvals module first.');

            return;
        }

        $policies = $this->ensureDemoPolicies();
        $requester = User::query()->orderBy('id')->first() ?? User::factory()->create([
            'name' => 'Approvals Demo User',
            'email' => 'approvals-demo@example.test',
        ]);

        if ($this->demoRequestsExist()) {
            $this->command?->info('Approvals demo requests already present — skipping create.');
        } else {
            $this->seedRequests($policies, $requester);
        }

        $requestCount = ApprovalRequest::query()->where('payload->demo_tag', self::TAG)->count();
        $policyCount = ApprovalPolicy::query()->where('description', 'like', '%'.self::TAG.'%')->count();

        $this->command?->info(sprintf(
            'Approvals demo ready: %d policies, %d requests.',
            $policyCount,
            $requestCount,
        ));
        $this->command?->info('Open /module/approvals/requests');
    }

    /**
     * @return \Illuminate\Support\Collection<int, ApprovalPolicy>
     */
    protected function ensureDemoPolicies()
    {
        $definitions = [
            [
                'key' => 'demo-large-po',
                'name' => 'Demo Large PO',
                'trigger_type' => ApprovalTriggers::PO_AMOUNT,
                'conditions' => ['min_amount' => 500000],
            ],
            [
                'key' => 'demo-credit-limit',
                'name' => 'Demo Credit Limit',
                'trigger_type' => ApprovalTriggers::CREDIT_LIMIT,
                'conditions' => ['requires_exceeded' => true],
            ],
            [
                'key' => 'demo-order-discount',
                'name' => 'Demo Order Discount',
                'trigger_type' => ApprovalTriggers::ORDER_DISCOUNT,
                'conditions' => ['min_discount_percent' => 10],
            ],
            [
                'key' => 'demo-order-sla',
                'name' => 'Demo Out-of-SLA Order',
                'trigger_type' => ApprovalTriggers::ORDER_SLA,
                'conditions' => ['max_lead_hours' => 24],
            ],
        ];

        $policies = collect();

        foreach ($definitions as $definition) {
            $policy = ApprovalPolicy::query()->firstOrCreate(
                ['key' => $definition['key']],
                [
                    'name' => $definition['name'],
                    'trigger_type' => $definition['trigger_type'],
                    'is_active' => true,
                    'conditions' => $definition['conditions'],
                    'description' => self::TAG.' Seeded demo policy.',
                ],
            );

            if ($policy->levels()->count() === 0) {
                $policy->levels()->create([
                    'level' => 1,
                    'name' => 'Manager',
                    'approver_type' => 'permission',
                    'approver_value' => 'approvals.decide',
                ]);
            }

            $policies->push($policy->fresh('levels'));
        }

        return $policies;
    }

    protected function demoRequestsExist(): bool
    {
        return ApprovalRequest::query()
            ->where('payload->demo_tag', self::TAG)
            ->count() >= self::REQUEST_COUNT;
    }

    /**
     * @param  \Illuminate\Support\Collection<int, ApprovalPolicy>  $policies
     */
    protected function seedRequests($policies, User $requester): void
    {
        $statuses = [
            ApprovalRequest::STATUS_PENDING,
            ApprovalRequest::STATUS_PENDING,
            ApprovalRequest::STATUS_PENDING,
            ApprovalRequest::STATUS_APPROVED,
            ApprovalRequest::STATUS_REJECTED,
        ];

        $existing = ApprovalRequest::query()->where('payload->demo_tag', self::TAG)->count();

        for ($i = $existing + 1; $i <= self::REQUEST_COUNT; $i++) {
            /** @var ApprovalPolicy $policy */
            $policy = $policies[($i - 1) % $policies->count()];
            $status = $statuses[($i - 1) % count($statuses)];

            ApprovalRequest::query()->create([
                'code' => sprintf('APR-DEMO-%04d', $i),
                'approval_policy_id' => $policy->id,
                'trigger_type' => $policy->trigger_type,
                'subject_type' => User::class,
                'subject_id' => $requester->id,
                'status' => $status,
                'current_level' => $status === ApprovalRequest::STATUS_PENDING ? 1 : ($policy->levels->max('level') ?? 1),
                'payload' => [
                    'demo_tag' => self::TAG,
                    'amount' => 250000 + ($i * 12500),
                    'note' => 'Demo approval request #'.$i,
                ],
                'requested_by' => $requester->id,
                'decided_at' => in_array($status, [ApprovalRequest::STATUS_APPROVED, ApprovalRequest::STATUS_REJECTED], true)
                    ? now()->subDays(($i - 1) % 10)
                    : null,
                'created_at' => now()->subDays(($i - 1) % 20)->subHours($i % 8),
                'updated_at' => now()->subDays(($i - 1) % 20),
            ]);
        }

        $this->command?->info(sprintf('Created %d demo approval requests.', self::REQUEST_COUNT - $existing));
    }
}
