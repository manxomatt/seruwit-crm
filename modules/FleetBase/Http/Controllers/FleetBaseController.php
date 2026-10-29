<?php

namespace Modules\FleetBase\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\User;
use App\Modules\Facades\Modules;
use Illuminate\Database\QueryException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Modules\FleetBase\Http\Requests\AssignVehiclesToFleetBaseRequest;
use Modules\FleetBase\Http\Requests\BatchDeleteFleetBasesRequest;
use Modules\FleetBase\Http\Requests\BatchDetachVehiclesFromFleetBaseRequest;
use Modules\FleetBase\Http\Requests\BatchUpdateFleetBaseStatusRequest;
use Modules\FleetBase\Http\Requests\StoreFleetBaseRequest;
use Modules\FleetBase\Http\Requests\UpdateFleetBaseRequest;
use Modules\FleetBase\Models\FleetBase;
use Modules\FleetBase\Support\AccessibleFleetBases;
use Modules\FleetBase\Support\FleetBaseKind;
use Modules\Inventory\Models\Warehouse;
use Modules\Partners\Models\Location;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

class FleetBaseController extends Controller
{
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    /**
     * Resolve a redirect URL respecting backward compatibility with fleet.bases routes.
     */
    protected function redirectTarget(string $action, mixed $parameter = null): string
    {
        $prefix = $this->getRoutePrefix();
        $currentName = request()->route()?->getName() ?? '';

        if (str_contains($currentName, 'fleet.bases')) {
            $candidate = "{$prefix}.fleet.bases.{$action}";
            if (Route::has($candidate)) {
                return $parameter !== null ? route($candidate, $parameter) : route($candidate);
            }
        }

        $standalone = "{$prefix}.fleet-bases.{$action}";
        if (Route::has($standalone)) {
            return $parameter !== null ? route($standalone, $parameter) : route($standalone);
        }

        $fallback = "{$prefix}.fleet.bases.{$action}";

        return $parameter !== null ? route($fallback, $parameter) : route($fallback);
    }

    public function index(): Response
    {
        $user = Auth::user();
        $tenant = tenant();
        $totalBases = FleetBase::count();
        $isLimitReached = $tenant instanceof Tenant && $tenant->hasReachedLimit('max_branches', $totalBases);
        $maxLimit = $tenant instanceof Tenant ? $tenant->planLimit('max_branches') : null;

        $bases = AccessibleFleetBases::query()
            ->with(['manager:id,name,email'])
            ->withCount('vehicles')
            ->when(request('search'), function ($query, $search) {
                $like = "%{$search}%";

                $query->where(function ($q) use ($like) {
                    $q->where('name', 'ilike', $like)
                        ->orWhere('code', 'ilike', $like)
                        ->orWhere('city', 'ilike', $like)
                        ->orWhere('phone', 'ilike', $like);
                });
            })
            ->when(request('status'), fn ($query, $status) => $query->where('status', $status))
            ->when(request('kind'), fn ($query, $kind) => $query->where('kind', $kind))
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Modules/FleetBase/Bases/Index', [
            'bases' => $bases,
            'filters' => [
                'search' => request('search'),
                'status' => request('status'),
                'kind' => request('kind'),
            ],
            'kinds' => FleetBaseKind::values(),
            'can' => [
                'create' => ($user->hasPermissionFor('fleet-base', 'create') || $user->hasPermissionFor('fleet', 'create'))
                    && ! ($user->hasRole(AccessibleFleetBases::ROLE_HEAD) && ! $user->hasRole(AccessibleFleetBases::ROLE_MANAGER) && ! $user->isAdmin())
                    && ! $isLimitReached,
                'update' => $user->hasPermissionFor('fleet-base', 'update') || $user->hasPermissionFor('fleet', 'update'),
                'delete' => ($user->hasPermissionFor('fleet-base', 'delete') || $user->hasPermissionFor('fleet', 'delete'))
                    && ! ($user->hasRole(AccessibleFleetBases::ROLE_HEAD) && ! $user->hasRole(AccessibleFleetBases::ROLE_MANAGER) && ! $user->isAdmin()),
            ],
            'quota' => [
                'max' => $maxLimit !== null ? (int) $maxLimit : null,
                'current' => $totalBases,
                'reached' => $isLimitReached,
            ],
        ]);
    }

    public function create(): Response|RedirectResponse
    {
        $user = Auth::user();
        if (
            $user
            && $user->hasRole(AccessibleFleetBases::ROLE_HEAD)
            && ! $user->hasRole(AccessibleFleetBases::ROLE_MANAGER)
            && ! $user->isAdmin()
        ) {
            abort(403, __('fleet.messages.base_create_forbidden_for_head'));
        }

        $tenant = tenant();
        if ($tenant instanceof Tenant && $tenant->hasReachedLimit('max_branches', FleetBase::count())) {
            $limit = (int) $tenant->planLimit('max_branches');

            return redirect()->to($this->redirectTarget('index'))
                ->with('error', __('fleet.messages.limit_reached_bases', ['limit' => $limit]));
        }

        return Inertia::render('Modules/FleetBase/Bases/Create', $this->formOptions());
    }

    public function store(StoreFleetBaseRequest $request): RedirectResponse
    {
        $user = Auth::user();
        if (
            $user
            && $user->hasRole(AccessibleFleetBases::ROLE_HEAD)
            && ! $user->hasRole(AccessibleFleetBases::ROLE_MANAGER)
            && ! $user->isAdmin()
        ) {
            abort(403, __('fleet.messages.base_create_forbidden_for_head'));
        }

        $tenant = tenant();
        if ($tenant instanceof Tenant && $tenant->hasReachedLimit('max_branches', FleetBase::count())) {
            $limit = (int) $tenant->planLimit('max_branches');
            throw ValidationException::withMessages([
                'name' => __('fleet.messages.limit_reached_bases', ['limit' => $limit]),
            ]);
        }

        $data = $request->safe()->except(['staff_ids']);
        $staffIds = $this->normalizedStaffIds(
            $request->integer('manager_id'),
            $request->input('staff_ids', []),
        );

        $base = DB::transaction(function () use ($data, $staffIds) {
            /** @var FleetBase $base */
            $base = FleetBase::query()->create($data);
            $base->users()->sync($staffIds);

            return $base;
        });

        return redirect()->to($this->redirectTarget('show', $base))
            ->with('success', __('fleet.messages.base_created'));
    }

    public function show(FleetBase $fleetBase): Response
    {
        $this->ensureAccessible($fleetBase);

        $user = Auth::user();

        $fleetBase->load([
            'manager:id,name,email',
            'users:id,name,email',
            'vehicles:id,name,plate_number,status,home_base_id',
        ]);

        if (FleetBase::locationOptionsAvailable()) {
            $fleetBase->load('location:id,code,name,city');
        }

        if (FleetBase::warehouseOptionsAvailable()) {
            $fleetBase->load('warehouse:id,name,kind');
        }

        $totalBases = FleetBase::count();
        $canDeleteBase = ($user->hasPermissionFor('fleet-base', 'delete') || $user->hasPermissionFor('fleet', 'delete'))
            && ! ($user->hasRole(AccessibleFleetBases::ROLE_HEAD) && ! $user->hasRole(AccessibleFleetBases::ROLE_MANAGER) && ! $user->isAdmin())
            && $totalBases > 1
            && $fleetBase->vehicles->isEmpty();

        $availableVehicles = class_exists(\Modules\Fleet\Models\Vehicle::class) && Schema::hasTable('vehicles')
            ? \Modules\Fleet\Models\Vehicle::query()
                ->select('id', 'name', 'plate_number', 'status', 'home_base_id')
                ->with('homeBase:id,name,code')
                ->where(function ($query) use ($fleetBase) {
                    $query->whereNull('home_base_id')
                        ->orWhere('home_base_id', '!=', $fleetBase->id);
                })
                ->orderBy('name')
                ->get()
            : [];

        return Inertia::render('Modules/FleetBase/Bases/Show', [
            'base' => $fleetBase,
            'availableVehicles' => $availableVehicles,
            'can' => [
                'update' => $user->hasPermissionFor('fleet-base', 'update') || $user->hasPermissionFor('fleet', 'update'),
                'delete' => $canDeleteBase,
            ],
        ]);
    }

    public function assignVehicles(AssignVehiclesToFleetBaseRequest $request, FleetBase $fleetBase): RedirectResponse
    {
        $this->ensureAccessible($fleetBase);

        $user = Auth::user();
        if (! ($user->hasPermissionFor('fleet-base', 'update') || $user->hasPermissionFor('fleet', 'update'))) {
            abort(403);
        }

        $vehicleIds = $request->validated()['vehicle_ids'];

        if ($fleetBase->vehicle_capacity !== null) {
            $currentCount = $fleetBase->vehicles()->count();
            $newAssignmentsCount = \Modules\Fleet\Models\Vehicle::query()
                ->whereIn('id', $vehicleIds)
                ->where(function ($q) use ($fleetBase) {
                    $q->whereNull('home_base_id')->orWhere('home_base_id', '!=', $fleetBase->id);
                })
                ->count();

            if ($currentCount + $newAssignmentsCount > $fleetBase->vehicle_capacity) {
                return redirect()->to($this->redirectTarget('show', $fleetBase))
                    ->with('error', "Kapasitas base terlampaui. Maksimal {$fleetBase->vehicle_capacity} unit (saat ini terparkir: {$currentCount}, mencoba menambah: {$newAssignmentsCount}).");
            }
        }

        \Modules\Fleet\Models\Vehicle::query()
            ->whereIn('id', $vehicleIds)
            ->update(['home_base_id' => $fleetBase->id]);

        $count = count($vehicleIds);

        return redirect()->to($this->redirectTarget('show', $fleetBase))
            ->with('success', "{$count} kendaraan berhasil dihubungkan ke pool {$fleetBase->name}.");
    }

    public function detachVehicle(FleetBase $fleetBase, int|string $vehicleId): RedirectResponse
    {
        $this->ensureAccessible($fleetBase);

        $user = Auth::user();
        if (! ($user->hasPermissionFor('fleet-base', 'update') || $user->hasPermissionFor('fleet', 'update'))) {
            abort(403);
        }

        $vehicle = \Modules\Fleet\Models\Vehicle::query()
            ->where('id', $vehicleId)
            ->where('home_base_id', $fleetBase->id)
            ->firstOrFail();

        $vehicle->update(['home_base_id' => null]);

        return redirect()->to($this->redirectTarget('show', $fleetBase))
            ->with('success', "Kendaraan {$vehicle->name} ({$vehicle->plate_number}) berhasil dilepas dari pool ini.");
    }

    public function batchDetachVehicles(BatchDetachVehiclesFromFleetBaseRequest $request, FleetBase $fleetBase): RedirectResponse
    {
        $this->ensureAccessible($fleetBase);

        $user = Auth::user();
        if (! ($user->hasPermissionFor('fleet-base', 'update') || $user->hasPermissionFor('fleet', 'update'))) {
            abort(403);
        }

        $vehicleIds = $request->validated()['vehicle_ids'];

        $count = \Modules\Fleet\Models\Vehicle::query()
            ->whereIn('id', $vehicleIds)
            ->where('home_base_id', $fleetBase->id)
            ->update(['home_base_id' => null]);

        return redirect()->to($this->redirectTarget('show', $fleetBase))
            ->with('success', "{$count} kendaraan berhasil dilepas dari pool ini.");
    }

    public function edit(FleetBase $fleetBase): Response
    {
        $this->ensureAccessible($fleetBase);

        $fleetBase->load('users:id');

        return Inertia::render('Modules/FleetBase/Bases/Edit', [
            'base' => $fleetBase,
            ...$this->formOptions(),
        ]);
    }

    public function update(UpdateFleetBaseRequest $request, FleetBase $fleetBase): RedirectResponse
    {
        $this->ensureAccessible($fleetBase);

        $data = $request->safe()->except(['staff_ids']);
        $managerId = (int) ($data['manager_id'] ?? $fleetBase->manager_id);
        $staffIds = $request->has('staff_ids')
            ? $this->normalizedStaffIds($managerId, $request->input('staff_ids', []))
            : null;

        DB::transaction(function () use ($fleetBase, $data, $staffIds) {
            $fleetBase->update($data);

            if ($staffIds !== null) {
                $fleetBase->users()->sync($staffIds);
            } elseif (array_key_exists('manager_id', $data)) {
                $fleetBase->users()->syncWithoutDetaching([(int) $data['manager_id']]);
            }
        });

        return redirect()->to($this->redirectTarget('show', $fleetBase))
            ->with('success', __('fleet.messages.base_updated'));
    }

    public function destroy(FleetBase $fleetBase): RedirectResponse
    {
        $user = Auth::user();
        if (
            $user
            && $user->hasRole(AccessibleFleetBases::ROLE_HEAD)
            && ! $user->hasRole(AccessibleFleetBases::ROLE_MANAGER)
            && ! $user->isAdmin()
        ) {
            abort(403, __('fleet.messages.base_delete_forbidden_for_head'));
        }

        $this->ensureAccessible($fleetBase);

        if (FleetBase::count() <= 1) {
            return back()->with('error', __('fleet.messages.base_last_remaining'));
        }

        if ($fleetBase->vehicles()->exists()) {
            return back()->with('error', __('fleet.messages.base_in_use'));
        }

        try {
            DB::transaction(fn () => $fleetBase->delete());
        } catch (QueryException) {
            return back()->with('error', __('fleet.messages.base_in_use'));
        }

        return redirect()->to($this->redirectTarget('index'))
            ->with('success', __('fleet.messages.base_deleted'));
    }

    /**
     * Update status for multiple fleet bases at once.
     */
    public function batchUpdateStatus(BatchUpdateFleetBaseStatusRequest $request): RedirectResponse
    {
        /** @var list<int> $ids */
        $ids = array_map('intval', $request->validated('ids'));
        $status = $request->validated('status');

        $updated = AccessibleFleetBases::query()
            ->whereIn('id', $ids)
            ->update(['status' => $status]);

        if ($updated === 0) {
            return back()->with('error', __('fleet.validation.base_access_denied'));
        }

        return back()->with('success', __('fleet.messages.bases_status_updated', [
            'count' => $updated,
            'status' => __('fleet.status.'.$status),
        ]));
    }

    /**
     * Delete multiple fleet bases, skipping any blocked by foreign-key constraints,
     * assigned vehicles, or being the last remaining base.
     */
    public function batchDestroy(BatchDeleteFleetBasesRequest $request): RedirectResponse
    {
        $user = Auth::user();
        if (
            $user
            && $user->hasRole(AccessibleFleetBases::ROLE_HEAD)
            && ! $user->hasRole(AccessibleFleetBases::ROLE_MANAGER)
            && ! $user->isAdmin()
        ) {
            abort(403, __('fleet.messages.base_delete_forbidden_for_head'));
        }

        /** @var list<int> $ids */
        $ids = array_map('intval', $request->validated('ids'));

        $deleted = 0;
        $blocked = 0;

        $bases = AccessibleFleetBases::query()->whereIn('id', $ids)->get();

        if ($bases->isEmpty()) {
            return back()->with('error', __('fleet.validation.base_access_denied'));
        }

        $totalBasesCount = FleetBase::count();

        foreach ($bases as $base) {
            // Cannot delete if this is the only remaining base overall
            if ($totalBasesCount <= 1) {
                $blocked++;

                continue;
            }

            // Cannot delete if base has assigned vehicles
            if ($base->vehicles()->exists()) {
                $blocked++;

                continue;
            }

            try {
                DB::transaction(fn () => $base->delete());
                $deleted++;
                $totalBasesCount--;
            } catch (QueryException) {
                $blocked++;
            }
        }

        if ($deleted === 0 && $blocked > 0) {
            return back()->with('error', __('fleet.messages.bases_batch_delete_blocked', [
                'blocked' => $blocked,
            ]));
        }

        if ($blocked > 0) {
            return back()->with('success', __('fleet.messages.bases_batch_deleted_partial', [
                'deleted' => $deleted,
                'blocked' => $blocked,
            ]));
        }

        return back()->with('success', __('fleet.messages.bases_batch_deleted', [
            'count' => $deleted,
        ]));
    }

    /**
     * @return array{
     *     managers: list<array{id: int, name: string, email: string}>,
     *     kinds: list<string>,
     *     locations: list<array{id: int, code: string, name: string, city: string|null}>,
     *     warehouses: list<array{id: int, name: string, kind: string|null}>,
     *     locationLinkEnabled: bool,
     *     warehouseLinkEnabled: bool
     * }
     */
    private function formOptions(): array
    {
        $managers = User::query()
            ->orderBy('name')
            ->get(['id', 'name', 'email'])
            ->map(fn (User $user): array => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ])
            ->all();

        $locations = [];
        if (FleetBase::locationOptionsAvailable() && Modules::available('partners')) {
            $locations = Location::query()
                ->active()
                ->orderBy('name')
                ->get(['id', 'code', 'name', 'city'])
                ->map(fn (Location $location): array => [
                    'id' => $location->id,
                    'code' => $location->code,
                    'name' => $location->name,
                    'city' => $location->city,
                ])
                ->all();
        }

        $warehouses = [];
        if (FleetBase::warehouseOptionsAvailable() && Modules::available('inventory')) {
            $warehouses = Warehouse::query()
                ->orderBy('name')
                ->get(['id', 'name', 'kind'])
                ->map(fn (Warehouse $warehouse): array => [
                    'id' => $warehouse->id,
                    'name' => $warehouse->name,
                    'kind' => $warehouse->kind?->value,
                ])
                ->all();
        }

        return [
            'managers' => $managers,
            'kinds' => FleetBaseKind::values(),
            'locations' => $locations,
            'warehouses' => $warehouses,
            'locationLinkEnabled' => $locations !== [] || (FleetBase::locationOptionsAvailable() && Modules::available('partners')),
            'warehouseLinkEnabled' => Modules::available('inventory') && Schema::hasTable('warehouses'),
        ];
    }

    /**
     * @param  list<int|string>  $staffIds
     * @return list<int>
     */
    private function normalizedStaffIds(int $managerId, array $staffIds): array
    {
        $ids = array_map('intval', $staffIds);
        $ids[] = $managerId;

        return array_values(array_unique(array_filter($ids, fn (int $id): bool => $id > 0)));
    }

    private function ensureAccessible(FleetBase $fleetBase): void
    {
        if (! AccessibleFleetBases::allows(Auth::user(), (int) $fleetBase->id)) {
            throw new AccessDeniedHttpException;
        }
    }
}
