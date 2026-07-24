<?php

namespace Modules\Approvals\Support;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Modules\Approvals\Models\ApprovalPolicy;
use Modules\Approvals\Models\ApprovalRequest;

/**
 * Soft-callable gate for domain modules.
 *
 * @phpstan-type GateResult array{allowed: bool, required: bool, request: ?ApprovalRequest, message: ?string}
 */
class ApprovalGate
{
    public static function enabled(): bool
    {
        return class_exists(ApprovalPolicy::class)
            && Schema::hasTable('approval_policies');
    }

    /**
     * Evaluate active policies for $trigger against $payload. If approval is
     * required and not yet granted, create (or reuse) a pending request.
     *
     * @param  array<string, mixed>  $payload
     * @return GateResult
     */
    public static function authorize(string $trigger, Model $subject, array $payload = []): array
    {
        if (! self::enabled()) {
            return ['allowed' => true, 'required' => false, 'request' => null, 'message' => null];
        }

        $policy = self::matchingPolicy($trigger, $payload);

        if (! $policy) {
            return ['allowed' => true, 'required' => false, 'request' => null, 'message' => null];
        }

        $existingApproved = ApprovalRequest::query()
            ->where('trigger_type', $trigger)
            ->where('subject_type', $subject->getMorphClass())
            ->where('subject_id', $subject->getKey())
            ->where('status', ApprovalRequest::STATUS_APPROVED)
            ->where('approval_policy_id', $policy->id)
            ->latest('id')
            ->first();

        if ($existingApproved) {
            return ['allowed' => true, 'required' => true, 'request' => $existingApproved, 'message' => null];
        }

        $pending = ApprovalRequest::query()
            ->where('trigger_type', $trigger)
            ->where('subject_type', $subject->getMorphClass())
            ->where('subject_id', $subject->getKey())
            ->where('status', ApprovalRequest::STATUS_PENDING)
            ->first();

        if ($pending) {
            return [
                'allowed' => false,
                'required' => true,
                'request' => $pending,
                'message' => "Menunggu persetujuan {$pending->code} (level {$pending->current_level}).",
            ];
        }

        $request = self::createRequest($policy, $trigger, $subject, $payload);

        return [
            'allowed' => false,
            'required' => true,
            'request' => $request,
            'message' => "Perlu persetujuan {$request->code} sebelum melanjutkan.",
        ];
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public static function matchingPolicy(string $trigger, array $payload): ?ApprovalPolicy
    {
        $policies = ApprovalPolicy::query()
            ->with('levels')
            ->where('trigger_type', $trigger)
            ->where('is_active', true)
            ->orderBy('id')
            ->get();

        foreach ($policies as $policy) {
            if (ConditionMatcher::matches($policy->conditions ?? [], $payload)) {
                return $policy;
            }
        }

        return null;
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private static function createRequest(ApprovalPolicy $policy, string $trigger, Model $subject, array $payload): ApprovalRequest
    {
        return DB::transaction(function () use ($policy, $trigger, $subject, $payload): ApprovalRequest {
            if ($policy->levels->isEmpty()) {
                $policy->levels()->create([
                    'level' => 1,
                    'name' => 'Approver',
                    'approver_type' => 'permission',
                    'approver_value' => 'approvals.decide',
                ]);
                $policy->load('levels');
            }

            return ApprovalRequest::query()->create([
                'code' => ApprovalRequest::nextCode(),
                'approval_policy_id' => $policy->id,
                'trigger_type' => $trigger,
                'subject_type' => $subject->getMorphClass(),
                'subject_id' => $subject->getKey(),
                'status' => ApprovalRequest::STATUS_PENDING,
                'current_level' => (int) $policy->levels->first()->level,
                'payload' => $payload,
                'requested_by' => Auth::id(),
            ]);
        });
    }
}
