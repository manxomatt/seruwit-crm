<?php

use App\Models\Setting;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        $settings = [
            [
                'key' => 'maintenance.alert_km_before',
                'group' => 'maintenance',
                'value' => '500',
                'type' => 'number',
                'label' => 'Alert km before service',
                'description' => 'Notify when vehicle odometer is within this many km of the next mileage-based service.',
                'is_public' => false,
                'sort_order' => 1,
            ],
            [
                'key' => 'maintenance.alert_days_before',
                'group' => 'maintenance',
                'value' => '14',
                'type' => 'number',
                'label' => 'Alert days before service',
                'description' => 'Notify when a calendar-based service is due within this many days.',
                'is_public' => false,
                'sort_order' => 2,
            ],
            [
                'key' => 'maintenance.auto_create_wo',
                'group' => 'maintenance',
                'value' => '0',
                'type' => 'boolean',
                'label' => 'Auto-create draft work order',
                'description' => 'When enabled, overdue schedules automatically open a draft preventive work order (deduped per vehicle + category).',
                'is_public' => false,
                'sort_order' => 3,
            ],
            [
                'key' => 'maintenance.single_active_wo_per_vehicle',
                'group' => 'maintenance',
                'value' => '1',
                'type' => 'boolean',
                'label' => 'One in-progress WO per vehicle',
                'description' => 'Prevent starting a second in-progress work order on the same vehicle.',
                'is_public' => false,
                'sort_order' => 4,
            ],
            [
                'key' => 'maintenance.single_active_wo_per_bay',
                'group' => 'maintenance',
                'value' => '1',
                'type' => 'boolean',
                'label' => 'One in-progress WO per bay',
                'description' => 'Prevent starting a second in-progress work order on the same workshop bay.',
                'is_public' => false,
                'sort_order' => 5,
            ],
        ];

        foreach ($settings as $setting) {
            Setting::query()->updateOrCreate(
                ['key' => $setting['key']],
                $setting,
            );
        }
    }

    public function down(): void
    {
        Setting::query()
            ->whereIn('key', [
                'maintenance.alert_km_before',
                'maintenance.alert_days_before',
                'maintenance.auto_create_wo',
                'maintenance.single_active_wo_per_vehicle',
                'maintenance.single_active_wo_per_bay',
            ])
            ->delete();
    }
};
