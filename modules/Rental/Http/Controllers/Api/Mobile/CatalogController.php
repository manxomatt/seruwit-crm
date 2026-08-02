<?php

namespace Modules\Rental\Http\Controllers\Api\Mobile;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Fleet\Models\Vehicle;
use Modules\Fleet\Support\VehicleRentalClass;
use Modules\Partners\Models\Location;
use Modules\Rental\Http\Controllers\Api\Mobile\Concerns\InteractsWithMobileRentalApi;
use Modules\Rental\Http\Resources\Mobile\MobileRentalVehicleResource;
use Modules\Rental\Models\Rental;
use Modules\Rental\Models\RentalInsurancePackage;

class CatalogController extends Controller
{
    use InteractsWithMobileRentalApi;

    public function classes(): JsonResponse
    {
        $this->ensurePassengerChannelEnabled();

        $data = collect(VehicleRentalClass::values())
            ->map(fn (string $value): array => [
                'value' => $value,
                'label' => VehicleRentalClass::label($value),
            ])
            ->values()
            ->all();

        return response()->json([
            'data' => $data,
            'meta' => ['count' => count($data)],
        ]);
    }

    public function vehicles(Request $request): JsonResponse
    {
        $this->ensurePassengerChannelEnabled();

        $validated = $request->validate([
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'rental_class' => ['nullable', 'string'],
            'type' => ['nullable', 'string'],
            'available_only' => ['sometimes', 'boolean'],
        ]);

        $start = $validated['start_date'] ?? null;
        $end = $validated['end_date'] ?? $start;
        $availableOnly = $request->boolean('available_only', filled($start) && filled($end));

        $vehicles = Vehicle::query()
            ->where('status', Vehicle::STATUS_ACTIVE)
            ->when($validated['rental_class'] ?? null, fn ($q, $class) => $q->where('rental_class', $class))
            ->when($validated['type'] ?? null, fn ($q, $type) => $q->where('type', $type))
            ->orderBy('name')
            ->get();

        if ($availableOnly && $start && $end) {
            $vehicles = $vehicles->filter(
                fn (Vehicle $vehicle): bool => Rental::vehicleAvailabilityReasons($vehicle, $start, $end) === []
            )->values();
        }

        return response()->json([
            'data' => MobileRentalVehicleResource::collection($vehicles)->resolve(),
            'meta' => [
                'count' => $vehicles->count(),
                'start_date' => $start,
                'end_date' => $end,
            ],
        ]);
    }

    public function showVehicle(Vehicle $vehicle): JsonResponse
    {
        $this->ensurePassengerChannelEnabled();

        abort_unless($vehicle->status === Vehicle::STATUS_ACTIVE, 404);

        return response()->json([
            'vehicle' => (new MobileRentalVehicleResource($vehicle))->resolve(),
        ]);
    }

    public function locations(): JsonResponse
    {
        $this->ensurePassengerChannelEnabled();

        $locations = Location::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'code', 'name', 'address', 'city', 'latitude', 'longitude']);

        return response()->json([
            'data' => $locations->map(fn (Location $location): array => [
                'id' => $location->id,
                'code' => $location->code,
                'name' => $location->name,
                'address' => $location->address,
                'city' => $location->city,
                'latitude' => $location->latitude !== null ? (string) $location->latitude : null,
                'longitude' => $location->longitude !== null ? (string) $location->longitude : null,
            ])->all(),
            'meta' => ['count' => $locations->count()],
        ]);
    }

    public function insurancePackages(Request $request): JsonResponse
    {
        $this->ensurePassengerChannelEnabled();

        $periodType = $request->string('period_type')->toString();

        $packages = RentalInsurancePackage::query()
            ->where('is_active', true)
            ->when($periodType !== '', fn ($q) => $q->where('period_type', $periodType))
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        return response()->json([
            'data' => $packages->map(fn (RentalInsurancePackage $package): array => [
                'id' => $package->id,
                'code' => $package->code,
                'name' => $package->name,
                'period_type' => $package->period_type,
                'amount' => (float) $package->amount,
                'deductible_amount' => $package->deductible_amount !== null ? (float) $package->deductible_amount : null,
                'coverage_limit' => $package->coverage_limit !== null ? (float) $package->coverage_limit : null,
                'description' => $package->description,
            ])->all(),
            'meta' => ['count' => $packages->count()],
        ]);
    }
}
