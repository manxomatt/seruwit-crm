<?php

namespace Modules\Rental\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Fleet\Models\Vehicle;
use Modules\Fleet\Support\AccessibleFleetBases;
use Modules\Partners\Models\Partner;
use Modules\Rental\Http\Requests\StoreRentalMaintenanceBlackoutRequest;
use Modules\Rental\Http\Requests\UpdateRentalMaintenanceBlackoutRequest;
use Modules\Rental\Models\RentalMaintenanceBlackout;

class RentalMaintenanceController extends Controller
{
    public function index(Request $request): Response
    {
        $this->ensureSchemaExists();

        $statusFilter = (string) $request->string('status', 'all');
        $vehicleFilter = (int) $request->integer('vehicle_id', 0);
        $search = trim((string) $request->string('search', ''));

        $query = RentalMaintenanceBlackout::query()
            ->with([
                'vehicle:id,name,plate_number,brand,type,rental_class,status,odometer_km,photo_url,stnk_expires_at,kir_expires_at',
                'vendorPartner:id,name,phone,email',
                'workOrder:id,reference_number,title,status',
                'creator:id,name',
            ])
            ->orderByDesc('id');

        if ($statusFilter !== 'all' && $statusFilter !== '') {
            $query->where('status', $statusFilter);
        }

        if ($vehicleFilter > 0) {
            $query->where('vehicle_id', $vehicleFilter);
        }

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                    ->orWhere('reason', 'like', "%{$search}%")
                    ->orWhere('vendor_workshop_name', 'like', "%{$search}%")
                    ->orWhereHas('vehicle', fn ($vq) => $vq->where('name', 'like', "%{$search}%")->orWhere('plate_number', 'like', "%{$search}%"))
                    ->orWhereHas('vendorPartner', fn ($pq) => $pq->where('name', 'like', "%{$search}%"));
            });
        }

        $blackouts = $query->get();

        // 1. KPI Counts
        $inWorkshopCount = RentalMaintenanceBlackout::query()
            ->where('status', RentalMaintenanceBlackout::STATUS_IN_PROGRESS)
            ->count();

        $upcomingCount = RentalMaintenanceBlackout::query()
            ->where('status', RentalMaintenanceBlackout::STATUS_SCHEDULED)
            ->count();

        $completedThisMonthCount = RentalMaintenanceBlackout::query()
            ->where('status', RentalMaintenanceBlackout::STATUS_COMPLETED)
            ->whereBetween('end_date', [now()->startOfMonth()->toDateString(), now()->endOfMonth()->toDateString()])
            ->count();

        // 2. Fetch fleet vehicles with compliance checks
        $vehicles = AccessibleFleetBases::scopeVehicles(Vehicle::query())
            ->orderBy('name')
            ->get(['id', 'name', 'plate_number', 'brand', 'type', 'rental_class', 'status', 'odometer_km', 'photo_url', 'stnk_expires_at', 'stnk_five_year_expires_at', 'insurance_expires_at', 'kir_expires_at']);

        $stnkAlerts = [];
        $kirAlerts = [];

        foreach ($vehicles as $v) {
            $summary = $v->compliance_summary;
            if (in_array($summary['stnk_annual']['status'] ?? '', ['expired', 'expiring_soon'], true)) {
                $stnkAlerts[] = [
                    'vehicle_id' => $v->id,
                    'name' => $v->name,
                    'plate_number' => $v->plate_number,
                    'status' => $summary['stnk_annual']['status'],
                    'label' => $summary['stnk_annual']['label'],
                    'date' => $summary['stnk_annual']['date'],
                    'days' => $summary['stnk_annual']['days'],
                ];
            }
            if (in_array($summary['kir']['status'] ?? '', ['expired', 'expiring_soon'], true)) {
                $kirAlerts[] = [
                    'vehicle_id' => $v->id,
                    'name' => $v->name,
                    'plate_number' => $v->plate_number,
                    'status' => $summary['kir']['status'],
                    'label' => $summary['kir']['label'],
                    'date' => $summary['kir']['date'],
                    'days' => $summary['kir']['days'],
                ];
            }
        }

        // 3. Workshop vendors (Partners)
        $workshopVendors = Partner::query()
            ->orderBy('name')
            ->get(['id', 'name', 'phone', 'email'])
            ->map(fn (Partner $p): array => [
                'id' => $p->id,
                'name' => $p->name,
                'phone' => $p->phone,
                'email' => $p->email,
            ]);

        $hasMaintenanceModule = class_exists(\Modules\Maintenance\Models\WorkOrder::class)
            && Schema::hasTable('work_orders');

        return Inertia::render('Modules/Rental/Maintenance/Index', [
            'blackouts' => $blackouts,
            'kpis' => [
                'in_workshop_count' => $inWorkshopCount,
                'upcoming_count' => $upcomingCount,
                'completed_this_month_count' => $completedThisMonthCount,
                'stnk_alerts_count' => count($stnkAlerts),
                'kir_alerts_count' => count($kirAlerts),
            ],
            'compliance_alerts' => [
                'stnk' => $stnkAlerts,
                'kir' => $kirAlerts,
            ],
            'vehicles' => $vehicles->map(fn (Vehicle $v): array => [
                'id' => $v->id,
                'name' => $v->name,
                'plate_number' => $v->plate_number,
                'type' => $v->type,
                'rental_class' => $v->rental_class,
                'status' => $v->status,
                'odometer_km' => $v->odometer_km,
                'photo_url' => $v->photo_url,
                'compliance_summary' => $v->compliance_summary,
            ]),
            'workshop_vendors' => $workshopVendors,
            'has_maintenance_module' => $hasMaintenanceModule,
            'filters' => [
                'status' => $statusFilter,
                'vehicle_id' => $vehicleFilter > 0 ? (string) $vehicleFilter : 'all',
                'search' => $search,
            ],
        ]);
    }

    public function store(StoreRentalMaintenanceBlackoutRequest $request): RedirectResponse
    {
        $this->ensureSchemaExists();

        $validated = $request->validated();

        $blackout = new RentalMaintenanceBlackout;
        $blackout->code = RentalMaintenanceBlackout::generateCode();
        $blackout->vehicle_id = (int) $validated['vehicle_id'];
        $blackout->vendor_partner_id = ! empty($validated['vendor_partner_id']) ? (int) $validated['vendor_partner_id'] : null;
        $blackout->vendor_workshop_name = $validated['workshop_name'] ?? $validated['vendor_workshop_name'] ?? null;
        $blackout->reason = $validated['reason'];
        $blackout->start_date = $validated['start_date'];
        $blackout->end_date = $validated['end_date'];
        $blackout->status = $validated['status'];
        $blackout->estimated_cost = (float) ($validated['estimated_cost'] ?? 0);
        $blackout->actual_cost = (float) ($validated['actual_cost'] ?? 0);
        $blackout->notes = $validated['notes'] ?? null;
        $blackout->created_by = auth()->id();
        $blackout->save();

        if ($request->boolean('set_vehicle_maintenance_status')) {
            Vehicle::query()->where('id', $blackout->vehicle_id)->update(['status' => Vehicle::STATUS_MAINTENANCE]);
        }

        // Optional WorkOrder creation
        if ($request->boolean('create_work_order') && class_exists(\Modules\Maintenance\Models\WorkOrder::class) && Schema::hasTable('work_orders')) {
            try {
                $vendorName = $blackout->workshop_name;
                if (! $vendorName && $blackout->vendor_partner_id) {
                    $vendorName = Partner::query()->where('id', $blackout->vendor_partner_id)->value('name');
                }

                $wo = \Modules\Maintenance\Models\WorkOrder::create([
                    'reference_number' => \Modules\Maintenance\Models\WorkOrder::generateReferenceNumber(),
                    'vehicle_id' => $blackout->vehicle_id,
                    'vendor_partner_id' => $blackout->vendor_partner_id,
                    'vendor_name' => $vendorName,
                    'title' => 'Blackout: '.$blackout->reason,
                    'description' => $blackout->notes ?? 'Dibuat otomatis dari Modul Rental (Servis & Blackout).',
                    'type' => \Modules\Maintenance\Models\WorkOrder::TYPE_SCHEDULED,
                    'priority' => \Modules\Maintenance\Models\WorkOrder::PRIORITY_NORMAL,
                    'status' => $blackout->status === RentalMaintenanceBlackout::STATUS_IN_PROGRESS
                        ? \Modules\Maintenance\Models\WorkOrder::STATUS_IN_PROGRESS
                        : \Modules\Maintenance\Models\WorkOrder::STATUS_APPROVED,
                    'scheduled_date' => $blackout->start_date,
                    'started_at' => $blackout->status === RentalMaintenanceBlackout::STATUS_IN_PROGRESS ? now() : null,
                    'estimated_cost' => $blackout->estimated_cost,
                    'created_by' => auth()->id(),
                ]);

                $blackout->update(['work_order_id' => $wo->id]);
            } catch (\Throwable) {
                // Ignore work order failure, blackout remains valid
            }
        }

        return redirect()->back()->with('success', "Jadwal servis & blackout {$blackout->code} berhasil dicatat.");
    }

    public function update(UpdateRentalMaintenanceBlackoutRequest $request, RentalMaintenanceBlackout $blackout): RedirectResponse
    {
        $this->ensureSchemaExists();

        $validated = $request->validated();

        $oldStatus = $blackout->status;
        $newStatus = $validated['status'];

        $blackout->update([
            'vendor_partner_id' => ! empty($validated['vendor_partner_id']) ? (int) $validated['vendor_partner_id'] : null,
            'vendor_workshop_name' => $validated['workshop_name'] ?? $validated['vendor_workshop_name'] ?? null,
            'reason' => $validated['reason'],
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'status' => $newStatus,
            'estimated_cost' => (float) ($validated['estimated_cost'] ?? 0),
            'actual_cost' => (float) ($validated['actual_cost'] ?? 0),
            'notes' => $validated['notes'] ?? null,
        ]);

        if ($newStatus === RentalMaintenanceBlackout::STATUS_COMPLETED && $oldStatus !== RentalMaintenanceBlackout::STATUS_COMPLETED) {
            $this->finalizeBlackout($blackout);
        }

        return redirect()->back()->with('success', "Jadwal servis {$blackout->code} berhasil diperbarui.");
    }

    public function complete(Request $request, RentalMaintenanceBlackout $blackout): RedirectResponse
    {
        $this->ensureSchemaExists();

        $actualCost = $request->input('actual_cost');
        if ($actualCost !== null) {
            $blackout->actual_cost = (float) $actualCost;
        }

        $blackout->status = RentalMaintenanceBlackout::STATUS_COMPLETED;
        $blackout->save();

        $this->finalizeBlackout($blackout);

        return redirect()->back()->with('success', "Servis armada {$blackout->code} telah ditandai selesai. Unit siap kembali disewakan.");
    }

    public function destroy(RentalMaintenanceBlackout $blackout): RedirectResponse
    {
        $this->ensureSchemaExists();

        $vehicleId = $blackout->vehicle_id;
        $code = $blackout->code;

        $blackout->delete();

        // If vehicle was marked maintenance and has no more active blackouts, restore to active
        $hasRemainingActive = RentalMaintenanceBlackout::query()
            ->where('vehicle_id', $vehicleId)
            ->whereIn('status', [RentalMaintenanceBlackout::STATUS_SCHEDULED, RentalMaintenanceBlackout::STATUS_IN_PROGRESS])
            ->exists();

        if (! $hasRemainingActive) {
            $vehicle = Vehicle::query()->find($vehicleId);
            if ($vehicle && $vehicle->status === Vehicle::STATUS_MAINTENANCE) {
                $vehicle->update(['status' => Vehicle::STATUS_ACTIVE]);
            }
        }

        return redirect()->back()->with('success', "Jadwal servis {$code} berhasil dihapus.");
    }

    private function finalizeBlackout(RentalMaintenanceBlackout $blackout): void
    {
        // 1. Restore vehicle status if currently in maintenance and no other active blackouts
        $hasRemainingActive = RentalMaintenanceBlackout::query()
            ->where('vehicle_id', $blackout->vehicle_id)
            ->where('id', '!=', $blackout->id)
            ->whereIn('status', [RentalMaintenanceBlackout::STATUS_SCHEDULED, RentalMaintenanceBlackout::STATUS_IN_PROGRESS])
            ->exists();

        if (! $hasRemainingActive) {
            $vehicle = Vehicle::query()->find($blackout->vehicle_id);
            if ($vehicle && $vehicle->status === Vehicle::STATUS_MAINTENANCE) {
                $vehicle->update(['status' => Vehicle::STATUS_ACTIVE]);
            }
        }

        // 2. Complete associated WorkOrder if present
        if ($blackout->work_order_id && class_exists(\Modules\Maintenance\Models\WorkOrder::class) && Schema::hasTable('work_orders')) {
            try {
                $wo = \Modules\Maintenance\Models\WorkOrder::query()->find($blackout->work_order_id);
                if ($wo && $wo->status !== \Modules\Maintenance\Models\WorkOrder::STATUS_COMPLETED) {
                    $wo->update([
                        'status' => \Modules\Maintenance\Models\WorkOrder::STATUS_COMPLETED,
                        'completed_at' => now(),
                        'actual_labor_cost' => $blackout->actual_cost,
                    ]);
                }
            } catch (\Throwable) {
                // Ignore
            }
        }
    }

    private function ensureSchemaExists(): void
    {
        if (! Schema::hasTable('rental_maintenance_blackouts')) {
            Schema::create('rental_maintenance_blackouts', function (Blueprint $table) {
                $table->id();
                $table->string('code', 40)->unique();
                $table->foreignId('vehicle_id')->constrained('vehicles')->cascadeOnDelete();
                $table->unsignedBigInteger('work_order_id')->nullable()->index();
                $table->foreignId('vendor_partner_id')->nullable()->constrained('partners')->nullOnDelete();
                $table->string('vendor_workshop_name', 191)->nullable();
                $table->string('reason', 191);
                $table->date('start_date');
                $table->date('end_date');
                $table->string('status', 30)->default('scheduled')->index();
                $table->decimal('estimated_cost', 15, 2)->default(0);
                $table->decimal('actual_cost', 15, 2)->default(0);
                $table->text('notes')->nullable();
                $table->foreignId('created_by')->nullable();
                $table->timestamps();
            });
        }
    }
}
