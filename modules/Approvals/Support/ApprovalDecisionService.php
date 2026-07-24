<?php

namespace Modules\Approvals\Support;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Modules\Approvals\Events\ApprovalCompleted;
use Modules\Approvals\Events\ApprovalRejected;
use Modules\Approvals\Models\ApprovalAction;
use Modules\Approvals\Models\ApprovalPolicyLevel;
use Modules\Approvals\Models\ApprovalRequest;

class ApprovalDecisionService
{
    public static function approve(ApprovalRequest $request, User $actor, ?string $note = null): ApprovalRequest
    {
        return DB::transaction(function () use ($request, $actor, $note): ApprovalRequest {
            $request = ApprovalRequest::query()->lockForUpdate()->with('policy.levels')->findOrFail($request->id);

            if (! $request->isPending()) {
                throw ValidationException::withMessages(['request' => 'This approval is no longer pending.']);
            }

            $level = $request->policy->levels->firstWhere('level', $request->current_level);

            if (! $level || ! self::userCanAct($actor, $level)) {
                throw ValidationException::withMessages(['request' => 'You are not an approver for this level.']);
            }

            ApprovalAction::query()->create([
                'approval_request_id' => $request->id,
                'level' => $request->current_level,
                'actor_id' => $actor->id,
                'action' => ApprovalAction::ACTION_APPROVED,
                'note' => $note,
            ]);

            $next = $request->policy->levels
                ->where('level', '>', $request->current_level)
                ->sortBy('level')
                ->first();

            if ($next) {
                $request->update(['current_level' => $next->level]);

                return $request->fresh(['policy.levels', 'actions.actor', 'requester']);
            }

            $request->update([
                'status' => ApprovalRequest::STATUS_APPROVED,
                'decided_at' => now(),
            ]);

            $request = $request->fresh(['policy.levels', 'actions.actor', 'requester', 'subject']);

            event(new ApprovalCompleted($request));

            return $request;
        });
    }

    public static function reject(ApprovalRequest $request, User $actor, ?string $note = null): ApprovalRequest
    {
        return DB::transaction(function () use ($request, $actor, $note): ApprovalRequest {
            $request = ApprovalRequest::query()->lockForUpdate()->with('policy.levels')->findOrFail($request->id);

            if (! $request->isPending()) {
                throw ValidationException::withMessages(['request' => 'This approval is no longer pending.']);
            }

            $level = $request->policy->levels->firstWhere('level', $request->current_level);

            if (! $level || ! self::userCanAct($actor, $level)) {
                throw ValidationException::withMessages(['request' => 'You are not an approver for this level.']);
            }

            ApprovalAction::query()->create([
                'approval_request_id' => $request->id,
                'level' => $request->current_level,
                'actor_id' => $actor->id,
                'action' => ApprovalAction::ACTION_REJECTED,
                'note' => $note,
            ]);

            $request->update([
                'status' => ApprovalRequest::STATUS_REJECTED,
                'decided_at' => now(),
            ]);

            $request = $request->fresh(['policy.levels', 'actions.actor', 'requester', 'subject']);

            event(new ApprovalRejected($request));

            return $request;
        });
    }

    public static function userCanAct(User $user, ApprovalPolicyLevel $level): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        return match ($level->approver_type) {
            ApprovalPolicyLevel::APPROVER_ROLE => $user->hasRole($level->approver_value),
            ApprovalPolicyLevel::APPROVER_USER => (string) $user->id === (string) $level->approver_value,
            ApprovalPolicyLevel::APPROVER_PERMISSION => self::hasPermissionSlug($user, $level->approver_value),
            default => false,
        };
    }

    private static function hasPermissionSlug(User $user, string $slug): bool
    {
        if ($slug === 'approvals.decide') {
            return $user->hasPermissionFor('approvals', 'decide');
        }

        if (str_contains($slug, '.')) {
            [$module, $action] = explode('.', $slug, 2);

            return $user->hasPermissionFor($module, $action);
        }

        return $user->hasPermissionFor('approvals', 'decide');
    }
}
