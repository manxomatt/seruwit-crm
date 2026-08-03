<?php

namespace Modules\Maintenance\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Modules\Maintenance\Models\WorkOrder;
use Modules\Maintenance\Models\WorkOrderChecklistItem;

class WorkOrderChecklistController extends Controller
{
    public function store(Request $request, WorkOrder $workOrder): RedirectResponse
    {
        $this->authorizeUpdate();

        $validated = $request->validate([
            'label' => ['required', 'string', 'max:255'],
        ]);

        $nextOrder = (int) $workOrder->checklistItems()->max('sort_order') + 1;

        $workOrder->checklistItems()->create([
            'label' => trim($validated['label']),
            'is_done' => false,
            'sort_order' => $nextOrder,
        ]);

        return back()->with('success', __('maintenance.messages.checklist_item_added'));
    }

    public function update(Request $request, WorkOrder $workOrder, WorkOrderChecklistItem $checklistItem): RedirectResponse
    {
        $this->authorizeUpdate();
        $this->assertBelongsToWorkOrder($workOrder, $checklistItem);

        $validated = $request->validate([
            'label' => ['sometimes', 'string', 'max:255'],
            'is_done' => ['sometimes', 'boolean'],
        ]);

        if (array_key_exists('label', $validated)) {
            $checklistItem->label = trim($validated['label']);
        }

        if (array_key_exists('is_done', $validated)) {
            $done = (bool) $validated['is_done'];
            $checklistItem->is_done = $done;
            $checklistItem->done_at = $done ? ($checklistItem->done_at ?? now()) : null;
        }

        $checklistItem->save();

        return back()->with('success', __('maintenance.messages.checklist_item_updated'));
    }

    public function destroy(WorkOrder $workOrder, WorkOrderChecklistItem $checklistItem): RedirectResponse
    {
        $this->authorizeUpdate();
        $this->assertBelongsToWorkOrder($workOrder, $checklistItem);

        $checklistItem->delete();

        return back()->with('success', __('maintenance.messages.checklist_item_deleted'));
    }

    private function authorizeUpdate(): void
    {
        $user = Auth::user();

        abort_unless($user !== null && $user->hasPermissionFor('maintenance', 'update'), 403);
    }

    private function assertBelongsToWorkOrder(WorkOrder $workOrder, WorkOrderChecklistItem $checklistItem): void
    {
        abort_unless($checklistItem->work_order_id === $workOrder->id, 404);
    }
}
