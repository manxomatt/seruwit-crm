<?php

namespace Modules\Approvals\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Approvals\Http\Requests\StoreApprovalPolicyRequest;
use Modules\Approvals\Http\Requests\UpdateApprovalPolicyRequest;
use Modules\Approvals\Models\ApprovalPolicy;
use Modules\Approvals\Support\ApprovalTriggers;

class ApprovalPolicyController extends Controller
{
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    public function index(): Response
    {
        return Inertia::render('Modules/Approvals/Policies/Index', [
            'policies' => ApprovalPolicy::query()
                ->withCount('levels')
                ->withCount(['requests as pending_requests_count' => fn ($q) => $q->where('status', 'pending')])
                ->orderBy('name')
                ->get(),
            'triggers' => ApprovalTriggers::catalog(),
            'can' => $this->abilitiesFor(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Modules/Approvals/Policies/Create', [
            'triggers' => ApprovalTriggers::catalog(),
            'roles' => Role::query()->orderBy('name')->get(['id', 'name', 'slug']),
            'users' => User::query()->orderBy('name')->limit(100)->get(['id', 'name', 'email']),
        ]);
    }

    public function store(StoreApprovalPolicyRequest $request): RedirectResponse
    {
        $data = $request->validated();

        DB::transaction(function () use ($data): void {
            $policy = ApprovalPolicy::query()->create([
                'key' => $data['key'],
                'name' => $data['name'],
                'trigger_type' => $data['trigger_type'],
                'is_active' => $data['is_active'] ?? true,
                'conditions' => $this->cleanConditions($data['conditions'] ?? []),
                'description' => $data['description'] ?? null,
            ]);

            foreach ($data['levels'] as $level) {
                $policy->levels()->create($level);
            }
        });

        return redirect()
            ->route($this->getRoutePrefix().'.approvals.policies.index')
            ->with('success', __('approvals.messages.policy_created'));
    }

    public function edit(ApprovalPolicy $policy): Response
    {
        $policy->load('levels');

        return Inertia::render('Modules/Approvals/Policies/Edit', [
            'policy' => $policy,
            'triggers' => ApprovalTriggers::catalog(),
            'roles' => Role::query()->orderBy('name')->get(['id', 'name', 'slug']),
            'users' => User::query()->orderBy('name')->limit(100)->get(['id', 'name', 'email']),
        ]);
    }

    public function update(UpdateApprovalPolicyRequest $request, ApprovalPolicy $policy): RedirectResponse
    {
        $data = $request->validated();

        DB::transaction(function () use ($policy, $data): void {
            $policy->update([
                'key' => $data['key'],
                'name' => $data['name'],
                'trigger_type' => $data['trigger_type'],
                'is_active' => $data['is_active'] ?? $policy->is_active,
                'conditions' => $this->cleanConditions($data['conditions'] ?? []),
                'description' => $data['description'] ?? null,
            ]);

            $policy->levels()->delete();

            foreach ($data['levels'] as $level) {
                $policy->levels()->create($level);
            }
        });

        return redirect()
            ->route($this->getRoutePrefix().'.approvals.policies.index')
            ->with('success', __('approvals.messages.policy_updated'));
    }

    public function destroy(ApprovalPolicy $policy): RedirectResponse
    {
        if ($policy->requests()->where('status', 'pending')->exists()) {
            return back()->with('error', __('approvals.messages.policy_has_pending'));
        }

        $policy->delete();

        return redirect()
            ->route($this->getRoutePrefix().'.approvals.policies.index')
            ->with('success', __('approvals.messages.policy_deleted'));
    }

    /**
     * @param  array<string, mixed>  $conditions
     * @return array<string, mixed>
     */
    private function cleanConditions(array $conditions): array
    {
        return collect($conditions)
            ->reject(fn ($value) => $value === null || $value === '')
            ->map(function ($value, $key) {
                if ($key === 'requires_exceeded') {
                    return filter_var($value, FILTER_VALIDATE_BOOLEAN);
                }

                return is_numeric($value) ? $value + 0 : $value;
            })
            ->all();
    }

    /**
     * @return array<string, bool>
     */
    private function abilitiesFor(): array
    {
        $user = Auth::user();

        return [
            'create' => $user->hasPermissionFor('approvals', 'create'),
            'update' => $user->hasPermissionFor('approvals', 'update'),
            'delete' => $user->hasPermissionFor('approvals', 'delete'),
            'decide' => $user->hasPermissionFor('approvals', 'decide'),
        ];
    }
}
