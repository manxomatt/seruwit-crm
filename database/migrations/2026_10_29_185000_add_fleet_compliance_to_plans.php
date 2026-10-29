<?php

use App\Models\Plan;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        $plans = Plan::query()->get();

        foreach ($plans as $plan) {
            $modules = $plan->modules ?? [];

            if (in_array('fleet', $modules, true) && ! in_array('fleet-compliance', $modules, true)) {
                $modules[] = 'fleet-compliance';
                $plan->modules = array_values(array_unique($modules));
                $plan->save();
            }
        }
    }

    public function down(): void
    {
        $plans = Plan::query()->get();

        foreach ($plans as $plan) {
            $modules = $plan->modules ?? [];

            if (in_array('fleet-compliance', $modules, true)) {
                $plan->modules = array_values(array_diff($modules, ['fleet-compliance']));
                $plan->save();
            }
        }
    }
};
