<?php

namespace Modules\Maintenance\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Maintenance\Models\MaintenanceBay;

class MaintenanceBayController extends Controller
{
    public function index(): Response
    {
        $user = Auth::user();

        $bays = MaintenanceBay::query()
            ->withCount([
                'workOrders as active_work_orders_count' => fn ($query) => $query->where('status', 'in_progress'),
            ])
            ->ordered()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Modules/Maintenance/Bays/Index', [
            'bays' => $bays,
            'can' => [
                'manage' => $user->hasPermissionFor('maintenance', 'manage_bays')
                    || $user->hasPermissionFor('maintenance', 'create'),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorizeManage();

        $validated = $request->validate([
            'code' => ['required', 'string', 'max:30', 'unique:maintenance_bays,code', 'regex:/^[A-Za-z0-9_-]+$/'],
            'name' => ['required', 'string', 'max:255'],
            'is_active' => ['boolean'],
            'sort_order' => ['integer', 'min:0'],
        ]);

        $validated['code'] = strtoupper($validated['code']);
        $validated['is_active'] = $request->boolean('is_active', true);
        $validated['sort_order'] = (int) ($validated['sort_order'] ?? 0);

        MaintenanceBay::query()->create($validated);

        return back()->with('success', __('maintenance.messages.bay_created'));
    }

    public function update(Request $request, MaintenanceBay $bay): RedirectResponse
    {
        $this->authorizeManage();

        $validated = $request->validate([
            'code' => [
                'required',
                'string',
                'max:30',
                'regex:/^[A-Za-z0-9_-]+$/',
                Rule::unique('maintenance_bays', 'code')->ignore($bay->id),
            ],
            'name' => ['required', 'string', 'max:255'],
            'is_active' => ['boolean'],
            'sort_order' => ['integer', 'min:0'],
        ]);

        $validated['code'] = strtoupper($validated['code']);
        $validated['is_active'] = $request->boolean('is_active', true);
        $validated['sort_order'] = (int) ($validated['sort_order'] ?? 0);

        $bay->update($validated);

        return back()->with('success', __('maintenance.messages.bay_updated'));
    }

    public function destroy(MaintenanceBay $bay): RedirectResponse
    {
        $this->authorizeManage();

        if ($bay->workOrders()->whereNotIn('status', ['completed', 'cancelled'])->exists()) {
            return back()->with('error', __('maintenance.messages.bay_in_use'));
        }

        $bay->delete();

        return back()->with('success', __('maintenance.messages.bay_deleted'));
    }

    private function authorizeManage(): void
    {
        $user = Auth::user();

        abort_unless(
            $user !== null && (
                $user->hasPermissionFor('maintenance', 'manage_bays')
                || $user->hasPermissionFor('maintenance', 'create')
            ),
            403,
        );
    }
}
