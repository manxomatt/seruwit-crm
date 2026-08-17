<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRoleRequest;
use App\Http\Requests\UpdateRoleRequest;
use App\Models\Permission;
use App\Models\Role;
use App\Support\SystemRolePermissions;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class RoleController extends Controller
{
    /**
     * Get the route prefix for this controller.
     */
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    /**
     * Display a listing of the roles.
     */
    public function index(): Response
    {
        $query = Role::query()
            ->withCount(['users', 'permissions'])
            ->when(request('search'), function ($q, $search) {
                $q->where(function ($sub) use ($search) {
                    $sub->where('name', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->when(request('type'), function ($q, $type) {
                if ($type === 'system') {
                    $q->where('is_system', true);
                } elseif ($type === 'custom') {
                    $q->where('is_system', false);
                }
            });

        $roles = (clone $query)
            ->latest()
            ->paginate(12)
            ->withQueryString();

        $stats = [
            'total_roles' => Role::count(),
            'system_roles' => Role::where('is_system', true)->count(),
            'custom_roles' => Role::where('is_system', false)->count(),
            'assigned_users' => \App\Models\User::whereHas('roles')->count(),
        ];

        return Inertia::render('Modules/Roles/Index', [
            'roles' => $roles,
            'stats' => $stats,
            'filters' => [
                'search' => request('search'),
                'type' => request('type'),
            ],
        ]);
    }

    /**
     * Show the form for creating a new role.
     */
    public function create(): Response
    {
        $permissions = Permission::query()
            ->orderBy('module')
            ->orderBy('action')
            ->get()
            ->groupBy('module');

        return Inertia::render('Modules/Roles/Create', [
            'permissions' => $permissions,
            'modules' => Permission::getModules(),
            'actions' => Permission::getActions(),
        ]);
    }

    /**
     * Store a newly created role in storage.
     */
    public function store(StoreRoleRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $validated['slug'] = Str::slug($validated['name']);

        $role = Role::create([
            'name' => $validated['name'],
            'slug' => $validated['slug'],
            'description' => $validated['description'] ?? null,
            'is_system' => false,
        ]);

        if (isset($validated['permissions'])) {
            $role->syncPermissions($validated['permissions']);
        }

        return redirect()->route($this->getRoutePrefix().'.roles.index')
            ->with('success', __('roles.messages.created'));
    }

    /**
     * Display the specified role.
     */
    public function show(Role $role): Response
    {
        $role->load(['permissions', 'users']);

        $permissionsByModule = $role->permissions->groupBy('module');

        return Inertia::render('Modules/Roles/Show', [
            'role' => $role,
            'permissionsByModule' => $permissionsByModule,
            'modules' => Permission::getModules(),
            'actions' => Permission::getActions(),
        ]);
    }

    /**
     * Show the form for editing the specified role.
     */
    public function edit(Role $role): Response
    {
        $role->load('permissions');

        $permissions = Permission::query()
            ->orderBy('module')
            ->orderBy('action')
            ->get()
            ->groupBy('module');

        $lockedPermissionIds = $role->isSystemRole()
            ? collect(SystemRolePermissions::defaultIdsFor($role))->sort()->values()->all()
            : [];

        return Inertia::render('Modules/Roles/Edit', [
            'role' => $role,
            'rolePermissions' => $role->permissions->pluck('id')->toArray(),
            'lockedPermissionIds' => $lockedPermissionIds,
            'permissions' => $permissions,
            'modules' => Permission::getModules(),
            'actions' => Permission::getActions(),
        ]);
    }

    /**
     * Update the specified role in storage.
     *
     * System roles keep their name/description/slug and default permissions locked.
     * Admins may only add or remove permissions beyond those defaults.
     */
    public function update(UpdateRoleRequest $request, Role $role): RedirectResponse
    {
        $validated = $request->validated();

        if (! $role->isSystemRole()) {
            $role->update([
                'name' => $validated['name'],
                'slug' => Str::slug($validated['name']),
                'description' => $validated['description'] ?? null,
            ]);
            $role->syncPermissions($validated['permissions'] ?? []);
        } else {
            $role->syncPermissions(
                SystemRolePermissions::mergeWithDefaults($role, $validated['permissions'] ?? [])
            );
        }

        return redirect()->route($this->getRoutePrefix().'.roles.index')
            ->with('success', __('roles.messages.updated'));
    }

    /**
     * Remove the specified role from storage.
     */
    public function destroy(Role $role): RedirectResponse
    {
        if ($role->isSystemRole()) {
            return redirect()->back()
                ->with('error', __('roles.messages.system_cannot_delete'));
        }

        if ($role->users()->count() > 0) {
            return redirect()->back()
                ->with('error', __('roles.messages.cannot_delete_assigned'));
        }

        $role->delete();

        return redirect()->route($this->getRoutePrefix().'.roles.index')
            ->with('success', __('roles.messages.deleted'));
    }
}
