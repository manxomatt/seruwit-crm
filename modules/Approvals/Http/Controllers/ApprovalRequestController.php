<?php

namespace Modules\Approvals\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Approvals\Models\ApprovalRequest;
use Modules\Approvals\Support\ApprovalDecisionService;
use Modules\Approvals\Support\ApprovalTriggers;

class ApprovalRequestController extends Controller
{
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    public function index(): Response
    {
        $status = request('status', 'pending');

        $requests = ApprovalRequest::query()
            ->with(['policy:id,name,trigger_type', 'requester:id,name'])
            ->when($status !== '' && $status !== 'all', fn ($q) => $q->where('status', $status))
            ->when(request('trigger_type'), fn ($q, $trigger) => $q->where('trigger_type', $trigger))
            ->latest('id')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Modules/Approvals/Requests/Index', [
            'requests' => $requests,
            'triggers' => ApprovalTriggers::catalog(),
            'filters' => [
                'status' => $status,
                'trigger_type' => request('trigger_type'),
            ],
            'can' => $this->abilitiesFor(),
            'pending_count' => ApprovalRequest::query()->where('status', ApprovalRequest::STATUS_PENDING)->count(),
        ]);
    }

    public function show(ApprovalRequest $approvalRequest): Response
    {
        $approvalRequest->load([
            'policy.levels',
            'actions.actor:id,name',
            'requester:id,name',
            'subject',
        ]);

        $user = Auth::user();
        $level = $approvalRequest->policy->levels->firstWhere('level', $approvalRequest->current_level);
        $canDecide = $approvalRequest->isPending()
            && $level
            && ApprovalDecisionService::userCanAct($user, $level);

        return Inertia::render('Modules/Approvals/Requests/Show', [
            'approvalRequest' => $approvalRequest,
            'triggers' => ApprovalTriggers::catalog(),
            'canDecide' => $canDecide && $user->hasPermissionFor('approvals', 'decide'),
            'can' => $this->abilitiesFor(),
        ]);
    }

    public function approve(Request $request, ApprovalRequest $approvalRequest): RedirectResponse
    {
        $request->validate(['note' => ['nullable', 'string', 'max:1000']]);

        ApprovalDecisionService::approve($approvalRequest, Auth::user(), $request->input('note'));

        return back()->with('success', 'Approved.');
    }

    public function reject(Request $request, ApprovalRequest $approvalRequest): RedirectResponse
    {
        $request->validate(['note' => ['nullable', 'string', 'max:1000']]);

        ApprovalDecisionService::reject($approvalRequest, Auth::user(), $request->input('note'));

        return back()->with('success', 'Rejected.');
    }

    /**
     * @return array<string, bool>
     */
    private function abilitiesFor(): array
    {
        $user = Auth::user();

        return [
            'decide' => $user->hasPermissionFor('approvals', 'decide'),
            'create' => $user->hasPermissionFor('approvals', 'create'),
            'update' => $user->hasPermissionFor('approvals', 'update'),
        ];
    }
}
