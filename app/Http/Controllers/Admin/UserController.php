<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\User;
use App\Modules\Facades\Modules;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Fleet\Models\FleetBase;
use Modules\Fleet\Support\AccessibleFleetBases;
use Modules\Inventory\Models\Warehouse;
use Modules\Inventory\Support\AccessibleWarehouses;

class UserController extends Controller
{
    /**
     * Get the route prefix for this controller.
     */
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    /**
     * Display a listing of the users.
     */
    public function index(): Response
    {
        $statusFilter = request('status');
        $tenant = tenant();
        $totalUsers = User::count();
        $isLimitReached = $tenant instanceof Tenant && $tenant->hasReachedLimit('max_users', $totalUsers);
        $maxLimit = $tenant instanceof Tenant ? $tenant->planLimit('max_users') : null;

        $users = User::query()
            ->with(['roles', 'profile'])
            ->when(request('search'), function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhereHas('profile', function ($profileQuery) use ($search) {
                            $profileQuery->where('first_name', 'like', "%{$search}%")
                                ->orWhere('last_name', 'like', "%{$search}%")
                                ->orWhere('phone_number', 'like', "%{$search}%");
                        });
                });
            })
            ->when($statusFilter === 'verified', function ($query) {
                $query->whereNotNull('email_verified_at');
            })
            ->when($statusFilter === 'unverified', function ($query) {
                $query->whereNull('email_verified_at');
            })
            ->latest()
            ->paginate(15)
            ->withQueryString();

        $stats = [
            'total_users' => $totalUsers,
            'verified_users' => User::whereNotNull('email_verified_at')->count(),
            'unverified_users' => User::whereNull('email_verified_at')->count(),
            'admin_users' => User::whereHas('roles', fn ($q) => $q->where('slug', 'admin'))->count(),
        ];

        return Inertia::render('Modules/Users/Index', [
            'users' => $users,
            'stats' => $stats,
            'filters' => [
                'search' => request('search'),
                'status' => $statusFilter,
            ],
            'can' => [
                'create' => ! $isLimitReached,
            ],
            'quota' => [
                'max' => $maxLimit !== null ? (int) $maxLimit : null,
                'current' => $totalUsers,
                'reached' => $isLimitReached,
            ],
        ]);
    }

    /**
     * Show the form for creating a new user.
     */
    public function create(): Response|RedirectResponse
    {
        $tenant = tenant();
        if ($tenant instanceof Tenant && $tenant->hasReachedLimit('max_users', User::count())) {
            $limit = (int) $tenant->planLimit('max_users');

            return redirect()->route($this->getRoutePrefix().'.users.index')
                ->with('error', __('users.messages.limit_reached_users', ['limit' => $limit]));
        }

        $roles = Role::query()->orderBy('name')->get();

        return Inertia::render('Modules/Users/Create', [
            'roles' => $roles,
            'warehouses' => $this->assignableWarehouses(),
            'warehouseScopedRoleSlugs' => AccessibleWarehouses::scopedRoleSlugs(),
            'fleetBases' => $this->assignableFleetBases(),
            'fleetBaseScopedRoleSlugs' => AccessibleFleetBases::scopedRoleSlugs(),
        ]);
    }

    public function store(StoreUserRequest $request): RedirectResponse
    {
        $tenant = tenant();
        if ($tenant instanceof Tenant && $tenant->hasReachedLimit('max_users', User::count())) {
            $limit = (int) $tenant->planLimit('max_users');
            throw ValidationException::withMessages([
                'email' => __('users.messages.limit_reached_users', ['limit' => $limit]),
            ]);
        }

        $validated = $request->validated();
        $validated['password'] = Hash::make($validated['password']);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => $validated['password'],
        ]);

        if (isset($validated['roles'])) {
            $user->syncRoles($validated['roles']);
        }

        $this->syncUserWarehouses($user, $validated['roles'] ?? [], $validated['warehouse_ids'] ?? []);
        $this->syncUserFleetBases($user, $validated['roles'] ?? [], $validated['fleet_base_ids'] ?? []);

        // Create user profile if any profile data is provided
        if (
            ! empty($validated['first_name']) ||
            ! empty($validated['last_name']) ||
            ! empty($validated['phone_number']) ||
            ! empty($validated['avatar_url'])
        ) {
            $user->profile()->create([
                'first_name' => $validated['first_name'] ?? null,
                'last_name' => $validated['last_name'] ?? null,
                'phone_number' => $validated['phone_number'] ?? null,
                'avatar_url' => $validated['avatar_url'] ?? null,
            ]);
        }

        return redirect()->route($this->getRoutePrefix().'.users.index')
            ->with('success', __('users.messages.created'));
    }

    /**
     * Display the specified user.
     */
    public function show(User $user): Response
    {
        $user->load(['roles.permissions', 'profile']);

        return Inertia::render('Modules/Users/Show', [
            'user' => $user,
        ]);
    }

    /**
     * Show the form for editing the specified user.
     */
    public function edit(User $user): Response
    {
        $user->load(['roles', 'profile']);
        $roles = Role::query()->orderBy('name')->get();

        $userWarehouseIds = [];
        if (Modules::available('inventory') && Schema::hasTable('user_warehouse')) {
            $userWarehouseIds = $user->warehouses()->pluck('warehouses.id')->map(fn ($id) => (int) $id)->all();
        }

        $userFleetBaseIds = [];
        if (Modules::available('fleet') && Schema::hasTable('user_fleet_base')) {
            $userFleetBaseIds = $user->fleetBases()->pluck('fleet_bases.id')->map(fn ($id) => (int) $id)->all();
        }

        return Inertia::render('Modules/Users/Edit', [
            'user' => $user,
            'userRoles' => $user->roles->pluck('id')->toArray(),
            'userWarehouseIds' => $userWarehouseIds,
            'userFleetBaseIds' => $userFleetBaseIds,
            'roles' => $roles,
            'warehouses' => $this->assignableWarehouses(),
            'warehouseScopedRoleSlugs' => AccessibleWarehouses::scopedRoleSlugs(),
            'fleetBases' => $this->assignableFleetBases(),
            'fleetBaseScopedRoleSlugs' => AccessibleFleetBases::scopedRoleSlugs(),
        ]);
    }

    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        $validated = $request->validated();

        if (isset($validated['password']) && $validated['password']) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => $validated['password'] ?? $user->password,
        ]);

        if (isset($validated['roles'])) {
            $user->syncRoles($validated['roles']);
        }

        $this->syncUserWarehouses($user, $validated['roles'] ?? [], $validated['warehouse_ids'] ?? []);
        $this->syncUserFleetBases($user, $validated['roles'] ?? [], $validated['fleet_base_ids'] ?? []);

        // Update or create user profile
        $user->profile()->updateOrCreate(
            ['user_id' => $user->id],
            [
                'first_name' => $validated['first_name'] ?? null,
                'last_name' => $validated['last_name'] ?? null,
                'phone_number' => $validated['phone_number'] ?? null,
                'avatar_url' => $validated['avatar_url'] ?? null,
            ]
        );

        return redirect()->route($this->getRoutePrefix().'.users.index')
            ->with('success', __('users.messages.updated'));
    }

    /**
     * Remove the specified user from storage.
     */
    public function destroy(User $user): RedirectResponse
    {
        $user->delete();

        return redirect()->route($this->getRoutePrefix().'.users.index')
            ->with('success', __('users.messages.deleted'));
    }

    /**
     * @return list<array{id: int, name: string, kind: string|null}>
     */
    protected function assignableWarehouses(): array
    {
        if (! Modules::available('inventory')) {
            return [];
        }

        return Warehouse::query()
            ->orderBy('name')
            ->get(['id', 'name', 'kind'])
            ->map(fn (Warehouse $warehouse): array => [
                'id' => $warehouse->id,
                'name' => $warehouse->name,
                'kind' => $warehouse->kind?->value,
            ])
            ->all();
    }

    /**
     * @return list<array{id: int, code: string, name: string}>
     */
    protected function assignableFleetBases(): array
    {
        if (! Modules::available('fleet') || ! Schema::hasTable('fleet_bases')) {
            return [];
        }

        return FleetBase::query()
            ->orderBy('name')
            ->get(['id', 'code', 'name'])
            ->map(fn (FleetBase $base): array => [
                'id' => $base->id,
                'code' => $base->code,
                'name' => $base->name,
            ])
            ->all();
    }

    /**
     * @param  list<int>  $roleIds
     * @param  list<int>  $warehouseIds
     */
    protected function syncUserWarehouses(User $user, array $roleIds, array $warehouseIds): void
    {
        if (! Modules::available('inventory') || ! Schema::hasTable('user_warehouse')) {
            return;
        }

        $slugs = Role::query()->whereIn('id', $roleIds)->pluck('slug')->all();
        $isScoped = count(array_intersect($slugs, AccessibleWarehouses::scopedRoleSlugs())) > 0;

        $user->warehouses()->sync($isScoped ? $warehouseIds : []);
    }

    /**
     * @param  list<int>  $roleIds
     * @param  list<int>  $fleetBaseIds
     */
    protected function syncUserFleetBases(User $user, array $roleIds, array $fleetBaseIds): void
    {
        if (! Modules::available('fleet') || ! Schema::hasTable('user_fleet_base')) {
            return;
        }

        $slugs = Role::query()->whereIn('id', $roleIds)->pluck('slug')->all();
        $isScoped = count(array_intersect($slugs, AccessibleFleetBases::scopedRoleSlugs())) > 0;

        $user->fleetBases()->sync($isScoped ? $fleetBaseIds : []);
    }
}
