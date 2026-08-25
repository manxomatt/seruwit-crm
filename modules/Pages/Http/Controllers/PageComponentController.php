<?php

namespace Modules\Pages\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Facades\Modules;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Pages\Http\Requests\StorePageComponentRequest;
use Modules\Pages\Http\Requests\UpdatePageComponentRequest;
use Modules\Pages\Models\PageComponent;

class PageComponentController extends Controller
{
    /**
     * Authorize that the request is coming from a central administrator context.
     * Tenants are not allowed to manage (CRUD) page components.
     */
    protected function authorizeCentralAdmin(): void
    {
        $user = Auth::user();

        if (tenancy()->initialized || ! $user || ! $user->isAdmin()) {
            abort(403, 'Management components pages hanya bisa dilakukan dari dashboard admin central.');
        }
    }

    /**
     * Get the route prefix for this controller.
     */
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    /**
     * The optional modules a component can be bound to, for the management UI's
     * "bound module" selector. A component tagged with a module only appears in a
     * tenant's page editor when that tenant has the module installed.
     *
     * @return list<array{key: string, label: string}>
     */
    protected function bindableModules(): array
    {
        return collect(Modules::all())
            ->map(fn ($module): array => ['key' => $module->key(), 'label' => $module->label()])
            ->sortBy('label')
            ->values()
            ->all();
    }

    /**
     * Display a listing of page components.
     */
    public function index(): Response
    {
        $this->authorizeCentralAdmin();

        $components = PageComponent::query()
            ->ordered()
            ->get();

        $categories = PageComponent::query()
            ->distinct()
            ->pluck('category')
            ->filter()
            ->values();

        $user = Auth::user();

        return Inertia::render('Modules/Pages/Components/Index', [
            'components' => $components,
            'categories' => $categories,
            'can' => [
                'create' => $user ? $user->hasPermissionFor('pages', 'create') : true,
                'update' => $user ? $user->hasPermissionFor('pages', 'update') : true,
                'delete' => $user ? $user->hasPermissionFor('pages', 'delete') : true,
            ],
        ]);
    }

    /**
     * Show the form for creating a new component.
     */
    public function create(): Response
    {
        $this->authorizeCentralAdmin();

        return Inertia::render('Modules/Pages/Components/Form', [
            'modules' => $this->bindableModules(),
        ]);
    }

    /**
     * Store a newly created component in storage.
     */
    public function store(StorePageComponentRequest $request): RedirectResponse
    {
        $this->authorizeCentralAdmin();

        PageComponent::create($request->validated());

        return redirect()
            ->route($this->getRoutePrefix().'.pages.components.index')
            ->with('success', 'Page component created successfully.');
    }

    /**
     * Show the form for editing the specified component.
     */
    public function edit(PageComponent $component): Response
    {
        $this->authorizeCentralAdmin();

        return Inertia::render('Modules/Pages/Components/Form', [
            'component' => $component,
            'modules' => $this->bindableModules(),
        ]);
    }

    /**
     * Update the specified component in storage.
     */
    public function update(UpdatePageComponentRequest $request, PageComponent $component): RedirectResponse
    {
        $this->authorizeCentralAdmin();

        $component->update($request->validated());

        return redirect()
            ->route($this->getRoutePrefix().'.pages.components.index')
            ->with('success', 'Page component updated successfully.');
    }

    /**
     * Toggle the active status of a component.
     */
    public function toggleActive(PageComponent $component): RedirectResponse
    {
        $this->authorizeCentralAdmin();

        $component->update([
            'is_active' => ! $component->is_active,
        ]);

        return redirect()
            ->route($this->getRoutePrefix().'.pages.components.index')
            ->with('success', 'Component status updated.');
    }

    /**
     * Remove the specified component from storage.
     */
    public function destroy(PageComponent $component): RedirectResponse
    {
        $this->authorizeCentralAdmin();

        $component->delete();

        return redirect()
            ->route($this->getRoutePrefix().'.pages.components.index')
            ->with('success', 'Page component deleted successfully.');
    }
}
