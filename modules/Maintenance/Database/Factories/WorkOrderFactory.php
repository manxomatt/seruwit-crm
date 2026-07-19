<?php

namespace Modules\Maintenance\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Fleet\Models\Vehicle;
use Modules\Maintenance\Models\MaintenanceCategory;
use Modules\Maintenance\Models\WorkOrder;

/**
 * @extends Factory<WorkOrder>
 */
class WorkOrderFactory extends Factory
{
    protected $model = WorkOrder::class;

    public function definition(): array
    {
        $status = fake()->randomElement([
            WorkOrder::STATUS_DRAFT,
            WorkOrder::STATUS_PENDING,
            WorkOrder::STATUS_APPROVED,
            WorkOrder::STATUS_IN_PROGRESS,
            WorkOrder::STATUS_COMPLETED,
        ]);

        $scheduledDate = fake()->dateTimeBetween('-3 months', '+1 month');
        $startedAt = in_array($status, [WorkOrder::STATUS_IN_PROGRESS, WorkOrder::STATUS_COMPLETED])
            ? fake()->dateTimeBetween($scheduledDate, 'now')
            : null;
        $completedAt = $status === WorkOrder::STATUS_COMPLETED && $startedAt
            ? fake()->dateTimeBetween($startedAt, 'now')
            : null;

        $estimatedCost = fake()->randomFloat(2, 150_000, 5_000_000);
        $actualLaborCost = $completedAt ? fake()->randomFloat(2, 100_000, 2_000_000) : null;
        $actualPartsCost = $completedAt ? fake()->randomFloat(2, 50_000, 3_000_000) : null;

        return [
            'vehicle_id' => Vehicle::factory(),
            'category_id' => MaintenanceCategory::query()->inRandomOrder()->value('id') ?? 1,
            'reference_number' => WorkOrder::generateReferenceNumber(),
            'title' => fake()->randomElement([
                'Ganti oli mesin rutin',
                'Perbaikan sistem rem',
                'Rotasi dan balancing ban',
                'Tune-up mesin',
                'Perbaikan AC',
                'Overhaul transmisi',
                'Penggantian aki',
                'Servis berkala 10.000 km',
                'Perbaikan bodi akibat benturan',
                'Ganti filter udara dan bahan bakar',
            ]),
            'description' => fake()->sentence(12),
            'status' => $status,
            'priority' => fake()->randomElement([WorkOrder::PRIORITY_LOW, WorkOrder::PRIORITY_NORMAL, WorkOrder::PRIORITY_HIGH]),
            'type' => fake()->randomElement([WorkOrder::TYPE_SCHEDULED, WorkOrder::TYPE_CORRECTIVE, WorkOrder::TYPE_PREVENTIVE]),
            'odometer_at_service' => fake()->numberBetween(10_000, 200_000),
            'scheduled_date' => $scheduledDate,
            'started_at' => $startedAt,
            'completed_at' => $completedAt,
            'vendor_name' => fake()->randomElement([
                'Bengkel Maju Jaya',
                'Auto Service Prima',
                'Bengkel Karya Motor',
                'PT. Astra Service',
                null,
            ]),
            'mechanic_name' => fake()->optional()->name(),
            'invoice_number' => $completedAt ? 'INV-'.fake()->numerify('######') : null,
            'estimated_cost' => $estimatedCost,
            'actual_labor_cost' => $actualLaborCost,
            'actual_parts_cost' => $actualPartsCost,
            'notes' => fake()->optional()->sentence(),
            'resolution_notes' => $completedAt ? fake()->optional()->sentence() : null,
            'created_by' => null,
            'approved_by' => null,
            'approved_at' => null,
        ];
    }

    public function pending(): static
    {
        return $this->state(fn (): array => ['status' => WorkOrder::STATUS_PENDING]);
    }

    public function inProgress(): static
    {
        return $this->state(fn (): array => [
            'status' => WorkOrder::STATUS_IN_PROGRESS,
            'started_at' => now()->subHours(fake()->numberBetween(1, 48)),
        ]);
    }

    public function completed(): static
    {
        return $this->state(fn (): array => [
            'status' => WorkOrder::STATUS_COMPLETED,
            'started_at' => now()->subDays(fake()->numberBetween(1, 30)),
            'completed_at' => now()->subDays(fake()->numberBetween(0, 7)),
            'actual_labor_cost' => fake()->randomFloat(2, 100_000, 1_500_000),
            'actual_parts_cost' => fake()->randomFloat(2, 50_000, 2_000_000),
        ]);
    }

    public function urgent(): static
    {
        return $this->state(fn (): array => [
            'priority' => WorkOrder::PRIORITY_URGENT,
            'type' => WorkOrder::TYPE_EMERGENCY,
        ]);
    }
}
