<?php

namespace Modules\Maintenance\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Maintenance\Models\MaintenanceCategory;

class MaintenanceCategoryController extends Controller
{
    public function index(): Response
    {
        $categories = MaintenanceCategory::query()
            ->withCount('workOrders')
            ->orderBy('sort_order')
            ->get();

        return Inertia::render('Modules/Maintenance/Categories/Index', [
            'categories' => $categories,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'key' => ['required', 'string', 'max:50', 'unique:maintenance_categories,key', 'regex:/^[a-z0-9_]+$/'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'color' => ['required', 'string', 'max:20'],
            'sort_order' => ['integer', 'min:0'],
        ]);

        MaintenanceCategory::create($validated);

        return back()->with('success', __('maintenance.messages.category_created'));
    }

    public function update(Request $request, MaintenanceCategory $category): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'color' => ['required', 'string', 'max:20'],
            'sort_order' => ['integer', 'min:0'],
        ]);

        $category->update($validated);

        return back()->with('success', __('maintenance.messages.category_updated'));
    }

    public function destroy(MaintenanceCategory $category): RedirectResponse
    {
        if ($category->workOrders()->exists()) {
            return back()->with('error', __('maintenance.messages.category_in_use'));
        }

        $category->delete();

        return back()->with('success', __('maintenance.messages.category_deleted'));
    }
}
