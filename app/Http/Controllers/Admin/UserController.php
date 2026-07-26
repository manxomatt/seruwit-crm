<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Models\Role;
use App\Models\User;
use App\Modules\Facades\Modules;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;
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
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Modules/Users/Index', [
            'users' => $users,
            'filters' => [
                'search' => request('search'),
            ],
        ]);
    }

    /**
     * Show the form for creating a new user.
     */
    public function create(): Response
    {
        $roles = Role::query()->orderBy('name')->get();

        return Inertia::render('Modules/Users/Create', [
            'roles' => $roles,
            'warehouses' => $this->assignableWarehouses(),
            'warehouseScopedRoleSlugs' => AccessibleWarehouses::scopedRoleSlugs(),
        ]);
    }

    public function store(StoreUserRequest $request): RedirectResponse
    {
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

        return Inertia::render('Modules/Users/Edit', [
            'user' => $user,
            'userRoles' => $user->roles->pluck('id')->toArray(),
            'userWarehouseIds' => $userWarehouseIds,
            'roles' => $roles,
            'warehouses' => $this->assignableWarehouses(),
            'warehouseScopedRoleSlugs' => AccessibleWarehouses::scopedRoleSlugs(),
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
}
