<?php

namespace Modules\Fleet\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Facades\Modules;
use Illuminate\Database\QueryException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Fleet\Http\Requests\BatchDeleteDriversRequest;
use Modules\Fleet\Http\Requests\BatchUpdateDriverStatusRequest;
use Modules\Fleet\Http\Requests\StoreDriverRequest;
use Modules\Fleet\Http\Requests\UpdateDriverRequest;
use Modules\Fleet\Models\Driver;

class DriverController extends Controller
{
    /**
     * Get the route prefix for this controller.
     */
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    /**
     * Display a listing of the drivers.
     */
    public function index(): Response
    {
        $user = Auth::user();

        $drivers = Driver::query()
            ->when(request('search'), function ($query, $search) {
                $like = "%{$search}%";

                $query->where(function ($q) use ($like) {
                    $q->where('name', 'ilike', $like)
                        ->orWhere('license_number', 'ilike', $like)
                        ->orWhere('license_type', 'ilike', $like)
                        ->orWhere('phone', 'ilike', $like)
                        ->orWhere('email', 'ilike', $like);
                });
            })
            ->when(request('status'), fn ($query, $status) => $query->where('status', $status))
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Modules/Fleet/Drivers/Index', [
            'drivers' => $drivers,
            'filters' => [
                'search' => request('search'),
                'status' => request('status'),
            ],
            'can' => [
                'create' => $user->hasPermissionFor('fleet', 'create'),
                'update' => $user->hasPermissionFor('fleet', 'update'),
                'delete' => $user->hasPermissionFor('fleet', 'delete'),
            ],
        ]);
    }

    /**
     * Show the form for creating a new driver.
     */
    public function create(): Response
    {
        return Inertia::render('Modules/Fleet/Drivers/Create');
    }

    /**
     * Store a newly created driver in storage.
     */
    public function store(StoreDriverRequest $request): RedirectResponse
    {
        $driver = Driver::create($request->validated());

        return redirect()->route($this->getRoutePrefix().'.fleet.drivers.show', $driver)
            ->with('success', __('fleet.messages.driver_created'));
    }

    /**
     * Display the specified driver.
     */
    public function show(Driver $driver): Response
    {
        $user = Auth::user();

        $driver->load('user:id,name,username,email');

        return Inertia::render('Modules/Fleet/Drivers/Show', [
            'driver' => $driver,
            'documentsEnabled' => Modules::available('document'),
            'documentSummary' => $this->driverDocumentSummary($driver),
            'can' => [
                'update' => $user->hasPermissionFor('fleet', 'update'),
                'delete' => $user->hasPermissionFor('fleet', 'delete'),
            ],
        ]);
    }

    /**
     * @return array{total: int, expired: int, expiring_soon: int, nearest_expiry: string|null}|null
     */
    private function driverDocumentSummary(Driver $driver): ?array
    {
        if (! Modules::available('document') || ! Schema::hasTable('documents')) {
            return null;
        }

        $documents = \Modules\Document\Models\Document::query()
            ->where('documentable_type', 'driver')
            ->where('documentable_id', $driver->id)
            ->get(['id', 'expires_at']);

        if ($documents->isEmpty()) {
            return [
                'total' => 0,
                'expired' => 0,
                'expiring_soon' => 0,
                'nearest_expiry' => null,
            ];
        }

        $expired = 0;
        $expiring = 0;
        $nearest = null;

        foreach ($documents as $document) {
            $status = $document->status;
            if ($status === \Modules\Document\Models\Document::STATUS_EXPIRED) {
                $expired++;
            } elseif ($status === \Modules\Document\Models\Document::STATUS_EXPIRING_SOON) {
                $expiring++;
            }

            if ($document->expires_at !== null) {
                $date = $document->expires_at->toDateString();
                if ($nearest === null || $date < $nearest) {
                    $nearest = $date;
                }
            }
        }

        return [
            'total' => $documents->count(),
            'expired' => $expired,
            'expiring_soon' => $expiring,
            'nearest_expiry' => $nearest,
        ];
    }

    /**
     * Show the form for editing the specified driver.
     */
    public function edit(Driver $driver): Response
    {
        return Inertia::render('Modules/Fleet/Drivers/Edit', [
            'driver' => $driver,
        ]);
    }

    /**
     * Update the specified driver in storage.
     */
    public function update(UpdateDriverRequest $request, Driver $driver): RedirectResponse
    {
        $driver->update($request->validated());

        return redirect()->route($this->getRoutePrefix().'.fleet.drivers.show', $driver)
            ->with('success', __('fleet.messages.driver_updated'));
    }

    /**
     * Remove the specified driver from storage.
     *
     * Fleet has no knowledge of Trip or any other module that might reference
     * this driver, so it cannot check "is this driver busy" itself — the
     * database's own foreign key constraint is what stops the delete, and this
     * just turns that into a readable message instead of a 500. The delete is
     * wrapped in its own transaction so a constraint violation only rolls back
     * this statement (via a savepoint) instead of poisoning an outer one.
     */
    public function destroy(Driver $driver): RedirectResponse
    {
        try {
            DB::transaction(fn () => $driver->delete());
        } catch (QueryException) {
            return back()->with('error', __('fleet.messages.driver_in_use'));
        }

        return redirect()->route($this->getRoutePrefix().'.fleet.drivers.index')
            ->with('success', __('fleet.messages.driver_deleted'));
    }

    /**
     * Update status for multiple drivers at once.
     */
    public function batchUpdateStatus(BatchUpdateDriverStatusRequest $request): RedirectResponse
    {
        /** @var list<int> $ids */
        $ids = array_map('intval', $request->validated('ids'));
        $status = $request->validated('status');

        $updated = Driver::query()
            ->whereIn('id', $ids)
            ->update(['status' => $status]);

        return back()->with('success', __('fleet.messages.drivers_status_updated', [
            'count' => $updated,
            'status' => __('fleet.status.'.$status),
        ]));
    }

    /**
     * Delete multiple drivers, skipping any blocked by foreign-key constraints.
     */
    public function batchDestroy(BatchDeleteDriversRequest $request): RedirectResponse
    {
        /** @var list<int> $ids */
        $ids = array_map('intval', $request->validated('ids'));

        $deleted = 0;
        $blocked = 0;

        $drivers = Driver::query()->whereIn('id', $ids)->get();

        foreach ($drivers as $driver) {
            try {
                DB::transaction(fn () => $driver->delete());
                $deleted++;
            } catch (QueryException) {
                $blocked++;
            }
        }

        if ($deleted === 0 && $blocked > 0) {
            return back()->with('error', __('fleet.messages.drivers_batch_delete_blocked', [
                'blocked' => $blocked,
            ]));
        }

        if ($blocked > 0) {
            return back()->with('success', __('fleet.messages.drivers_batch_deleted_partial', [
                'deleted' => $deleted,
                'blocked' => $blocked,
            ]));
        }

        return back()->with('success', __('fleet.messages.drivers_batch_deleted', [
            'count' => $deleted,
        ]));
    }
}
